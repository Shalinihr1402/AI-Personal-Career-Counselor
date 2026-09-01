from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import tempfile
import json
try:
    import fitz # PyMuPDF
except ImportError:
    fitz = None

try:
    import google.generativeai as genai
except ImportError:
    genai = None

# Configure Gemini (In production, load this from .env)
# genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

app = FastAPI(
    title="AI Personal Career Counselor API",
    description="Backend API for the Career Counselor Platform",
    version="1.0.0"
)

# CORS setup for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Personal Career Counselor API"}

@app.post("/api/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if fitz is None or genai is None:
        # Mock response for when dependencies are missing or network is down
        print("WARNING: PyMuPDF or google-generativeai not installed. Returning mock data.")
        return {
            "name": "Alex Johnson",
            "education": ["B.S. Computer Science, University of Technology"],
            "skills": ["Python", "React", "TypeScript", "FastAPI", "SQL", "Git"],
            "experience": ["Software Engineering Intern at TechCorp", "Freelance Web Developer"]
        }

    try:
        # Read the uploaded PDF file
        contents = await file.read()
        
        # Save temporarily to parse with PyMuPDF
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(contents)
            temp_file_path = temp_file.name

        # Extract text using PyMuPDF
        text = ""
        try:
            doc = fitz.open(temp_file_path)
            for page in doc:
                text += page.get_text()
            doc.close()
        finally:
            os.remove(temp_file_path)

        # Call Google Gemini to parse the structured data
        # Note: If no API key is set, this will fail. For demo purposes, we will wrap in a try-except.
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            prompt = f"""
            Extract the following information from the resume text below.
            Format the output strictly as a JSON object with these exact keys:
            - "name": string (the person's full name)
            - "education": array of strings
            - "skills": array of strings
            - "experience": array of strings
            
            Resume Text:
            {text}
            """
            
            response = model.generate_content(prompt)
            # Clean up markdown JSON block if present
            response_text = response.text.strip()
            if response_text.startswith("```json"):
                response_text = response_text[7:-3]
            elif response_text.startswith("```"):
                response_text = response_text[3:-3]
                
            return json.loads(response_text)
        except Exception as ai_err:
            print(f"Gemini AI Error: {ai_err}")
            # Fallback mock data if AI fails (e.g. missing API key)
            return {
                "name": "Demo User (AI Failed)",
                "education": ["B.S. Computer Science"],
                "skills": ["Extracted text length: " + str(len(text))],
                "experience": ["Please configure GEMINI_API_KEY"]
            }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
