"""
resume_parser.py
Multi-format resume parsing and deep structured extraction module.
Supports: PDF (.pdf), Microsoft Word OpenXML (.docx), and Legacy Word (.doc).
"""

import io
import re
import json
import zipfile
import xml.etree.ElementTree as ET
from typing import Any, Dict, List, Optional, Tuple

try:
    import pymupdf as fitz
except ImportError:
    try:
        import fitz
    except ImportError:
        fitz = None

# Max resume text length sent to LLM to stay within Groq budget
MAX_RESUME_CHARS = 12_000
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class ResumeParseError(Exception):
    """Base exception for resume parsing errors."""
    pass


class PasswordProtectedError(ResumeParseError):
    """Raised when PDF is encrypted or password-protected."""
    pass


class FileSizeExceededError(ResumeParseError):
    """Raised when uploaded file exceeds 5MB."""
    pass


class UnsupportedFormatError(ResumeParseError):
    """Raised when file extension or magic bytes do not match supported types."""
    pass


class CorruptedFileError(ResumeParseError):
    """Raised when file contents cannot be parsed or read."""
    pass


def detect_file_type(filename: str, contents: bytes) -> str:
    """
    Validate both filename extension and magic bytes.
    Returns: 'pdf' | 'docx' | 'doc'
    """
    ext = filename.lower().split(".")[-1] if "." in filename else ""

    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise FileSizeExceededError(
            f"File size exceeds the 5 MB limit ({(len(contents) / 1024 / 1024):.2f} MB uploaded)."
        )

    # Magic byte check
    is_pdf_magic = contents.startswith(b"%PDF-")
    is_zip_magic = contents.startswith(b"PK\x03\x04")
    is_doc_magic = contents.startswith(b"\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1")

    if ext == "pdf" or is_pdf_magic:
        if not is_pdf_magic and not contents[:1024].strip().startswith(b"%PDF-"):
            raise CorruptedFileError("The file has a .pdf extension but is not a valid PDF file.")
        return "pdf"

    if ext == "docx" or (is_zip_magic and ext in ("docx", "")):
        try:
            with zipfile.ZipFile(io.BytesIO(contents)) as z:
                if "word/document.xml" not in z.namelist():
                    raise CorruptedFileError("Invalid DOCX format: word/document.xml missing.")
            return "docx"
        except zipfile.BadZipFile:
            raise CorruptedFileError("The DOCX file is corrupted or not a valid archive.")

    if ext == "doc" or is_doc_magic:
        return "doc"

    raise UnsupportedFormatError(
        f"Unsupported file format '{ext}'. Only PDF (.pdf), Word (.docx), and (.doc) files up to 5 MB are supported."
    )


def extract_text_from_pdf(contents: bytes) -> str:
    """Extract plain text from PDF bytes using PyMuPDF."""
    if fitz is None:
        raise ResumeParseError("PyMuPDF engine is not available on this server.")

    try:
        doc = fitz.open(stream=contents, filetype="pdf")
    except Exception as e:
        raise CorruptedFileError(f"Could not open PDF document: {str(e)}")

    try:
        if getattr(doc, "is_encrypted", False) or getattr(doc, "needs_pass", False):
            raise PasswordProtectedError(
                "Password-protected PDF files cannot be processed. Please upload an unlocked PDF."
            )

        text_pages: List[str] = []
        for page_idx in range(len(doc)):
            page = doc[page_idx]
            page_text = page.get_text()
            if page_text:
                text_pages.append(page_text)

        full_text = "\n\n".join(text_pages).strip()
        if not full_text or len(full_text) < 15:
            # Check if this might be a scanned image-only PDF
            raise ResumeParseError(
                "Unable to extract readable text. The PDF might contain only scanned images or be empty. "
                "Please upload a text-based resume."
            )
        return full_text
    finally:
        doc.close()


def extract_text_from_docx(contents: bytes) -> str:
    """Extract text from Word OpenXML (.docx) bytes."""
    try:
        with zipfile.ZipFile(io.BytesIO(contents)) as z:
            if "word/document.xml" not in z.namelist():
                raise CorruptedFileError("Document structure invalid (missing word/document.xml).")
            xml_data = z.read("word/document.xml")
    except zipfile.BadZipFile:
        raise CorruptedFileError("The DOCX file is corrupted or incomplete.")

    try:
        tree = ET.fromstring(xml_data)
        paragraphs: List[str] = []
        for p in tree.iter():
            if p.tag.endswith("}p") or p.tag == "p":
                runs = []
                for t in p.iter():
                    if (t.tag.endswith("}t") or t.tag == "t") and t.text:
                        runs.append(t.text)
                if runs:
                    paragraphs.append("".join(runs).strip())

        full_text = "\n".join(p for p in paragraphs if p).strip()
        if not full_text or len(full_text) < 15:
            raise ResumeParseError("The DOCX file appears to be empty or contains no readable text.")
        return full_text
    except ET.ParseError as e:
        raise CorruptedFileError(f"Could not parse DOCX XML structure: {str(e)}")


def extract_text_from_doc(contents: bytes) -> str:
    """
    Extract readable text runs from legacy binary Word (.doc) files.
    Extracts contiguous ASCII and Latin printable runs.
    """
    try:
        # Match runs of printable ascii characters >= 4 bytes
        ascii_matches = re.findall(rb"[\x20-\x7E\t\r\n]{4,}", contents)
        extracted = []
        for b in ascii_matches:
            try:
                decoded = b.decode("latin1").strip()
                # Exclude binary noise / long strings of symbols
                if len(decoded) >= 4 and not re.match(r"^[\W_]+$", decoded):
                    extracted.append(decoded)
            except Exception:
                continue

        full_text = "\n".join(extracted).strip()
        if not full_text or len(full_text) < 30:
            raise ResumeParseError(
                "Unable to extract readable text from this legacy .doc file. "
                "Please save/convert your document as a .pdf or .docx and re-upload."
            )
        return full_text
    except Exception as e:
        if isinstance(e, ResumeParseError):
            raise
        raise CorruptedFileError(f"Failed to extract text from .doc file: {str(e)}")


def extract_text_from_file(filename: str, contents: bytes) -> Tuple[str, str]:
    """
    Validates file format and extracts text.
    Returns: (extracted_text, detected_type)
    """
    file_type = detect_file_type(filename, contents)
    if file_type == "pdf":
        text = extract_text_from_pdf(contents)
    elif file_type == "docx":
        text = extract_text_from_docx(contents)
    elif file_type == "doc":
        text = extract_text_from_doc(contents)
    else:
        raise UnsupportedFormatError(f"Unsupported format: {file_type}")

    return text, file_type


def build_fallback_parsed_data(raw_text: str, filename: str) -> Dict[str, Any]:
    """Generates a structured fallback dictionary when AI extraction is unavailable."""
    # Attempt simple regex extractions for common patterns
    words = re.findall(r"\b[A-Za-z0-9+#.-]+\b", raw_text)
    
    # Common tech/skills keywords to scan for
    common_skills = [
        "Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++",
        "HTML", "CSS", "SQL", "Git", "Docker", "AWS", "Figma", "Excel",
        "Machine Learning", "Communication", "Problem Solving", "Leadership",
        "Data Analysis", "Project Management", "Marketing", "Sales"
    ]
    detected_skills = [s for s in common_skills if re.search(r"\b" + re.escape(s) + r"\b", raw_text, re.IGNORECASE)]
    if not detected_skills:
        detected_skills = ["Communication", "Problem Solving"]

    return {
        "personal_summary": {
            "name": filename.rsplit(".", 1)[0].replace("_", " ").title() if filename else "Applicant",
            "summary": "Profile extracted from uploaded resume.",
            "career_objective": None,
            "designation": None,
        },
        "education": [
            {
                "degree": "Degree / Qualification (From Resume)",
                "institution": "University / College",
                "specialization": "General",
                "graduation_year": None,
            }
        ],
        "skills": {
            "technical_skills": [s for s in detected_skills if s in ["Python", "JavaScript", "TypeScript", "React", "Node.js", "Java", "C++", "HTML", "CSS", "SQL", "Docker", "AWS", "Machine Learning"]],
            "tools_and_frameworks": [s for s in detected_skills if s in ["Git", "Docker", "AWS", "Figma", "Excel"]],
            "soft_skills": [s for s in detected_skills if s in ["Communication", "Problem Solving", "Leadership"]],
            "domain_skills": [s for s in detected_skills if s in ["Data Analysis", "Project Management", "Marketing", "Sales"]],
            "all_skills": detected_skills,
        },
        "experience": [],
        "projects": [],
        "additional_info": {
            "internships": [],
            "certifications": [],
            "achievements": [],
            "publications": [],
            "volunteering": [],
        },
    }


def create_extraction_prompt(resume_text: str) -> str:
    """Generates the prompt for deep structured AI extraction via Groq LLM."""
    truncated = resume_text[:MAX_RESUME_CHARS]
    return f"""
You are an expert AI Resume Parsing and Information Extraction Engine.
Extract all structured information from the following resume text.

STRICT EXTRACTION RULES:
1. Extract FACTUAL information only.
2. NEVER invent, hallucinate, or guess missing details.
3. If an item or field is absent from the resume text, return null or an empty array [] as appropriate.
4. Normalize skills into proper casing (e.g. "React", "Python", "Communication").
5. Return ALL identified skills across categories, and also aggregate every single distinct skill in "all_skills".

Return strictly a valid JSON object with the following EXACT schema:
{{
  "personal_summary": {{
    "name": string or null,
    "summary": string or null,
    "career_objective": string or null,
    "designation": string or null
  }},
  "education": [
    {{
      "degree": string or null,
      "institution": string or null,
      "specialization": string or null,
      "graduation_year": string or null
    }}
  ],
  "skills": {{
    "technical_skills": [string],
    "tools_and_frameworks": [string],
    "soft_skills": [string],
    "domain_skills": [string],
    "all_skills": [string]
  }},
  "experience": [
    {{
      "organization": string or null,
      "job_title": string or null,
      "role": string or null,
      "duration": string or null,
      "responsibilities": [string],
      "achievements": [string]
    }}
  ],
  "projects": [
    {{
      "title": string or null,
      "description": string or null,
      "technologies": [string],
      "role": string or null
    }}
  ],
  "additional_info": {{
    "internships": [string],
    "certifications": [string],
    "achievements": [string],
    "publications": [string],
    "volunteering": [string]
  }}
}}

Resume Text:
\"\"\"
{truncated}
\"\"\"
"""


def format_resume_response(raw_extracted: Any, file_type: str, file_size: int, filename: str) -> Dict[str, Any]:
    """
    Standardize the parsed resume response so it is rich, clean, and 100% backward compatible
    with legacy consumers that expect name, skills (array of string), education, and experience.
    """
    # 1. Ensure raw_extracted is a dictionary
    if isinstance(raw_extracted, list):
        raw_extracted = raw_extracted[0] if (len(raw_extracted) > 0 and isinstance(raw_extracted[0], dict)) else {}
    elif not isinstance(raw_extracted, dict):
        raw_extracted = {}

    personal = raw_extracted.get("personal_summary")
    if not isinstance(personal, dict):
        personal = {}

    skills_raw = raw_extracted.get("skills")
    skills_obj: Dict[str, List[str]] = {
        "technical_skills": [],
        "tools_and_frameworks": [],
        "soft_skills": [],
        "domain_skills": [],
        "all_skills": [],
    }

    if isinstance(skills_raw, list):
        clean_list = [str(s).strip() for s in skills_raw if s and str(s).strip()]
        skills_obj["all_skills"] = clean_list
        skills_obj["technical_skills"] = clean_list
    elif isinstance(skills_raw, dict):
        for k in ["technical_skills", "tools_and_frameworks", "soft_skills", "domain_skills", "all_skills"]:
            v = skills_raw.get(k)
            if isinstance(v, list):
                skills_obj[k] = [str(x).strip() for x in v if x and str(x).strip()]
            elif isinstance(v, str):
                skills_obj[k] = [x.strip() for x in v.split(",") if x.strip()]

        if not skills_obj["all_skills"]:
            combined = []
            for k in ["technical_skills", "tools_and_frameworks", "soft_skills", "domain_skills"]:
                combined.extend(skills_obj[k])
            skills_obj["all_skills"] = list(dict.fromkeys(combined))

    all_skills = skills_obj["all_skills"]

    # 2. Education list
    raw_edu = raw_extracted.get("education") or raw_extracted.get("education_details") or []
    if isinstance(raw_edu, dict):
        raw_edu = [raw_edu]
    elif not isinstance(raw_edu, list):
        raw_edu = [str(raw_edu)] if raw_edu else []

    edu_list = []
    legacy_edu = []
    for ed in raw_edu:
        if isinstance(ed, dict):
            edu_list.append(ed)
            parts = [ed.get("degree"), ed.get("specialization"), ed.get("institution"), ed.get("graduation_year")]
            line = " - ".join(str(p) for p in parts if p)
            if line:
                legacy_edu.append(line)
        elif isinstance(ed, str) and ed.strip():
            edu_list.append({
                "degree": ed.strip(),
                "institution": None,
                "specialization": None,
                "graduation_year": None,
            })
            legacy_edu.append(ed.strip())

    # 3. Experience list
    raw_exp = raw_extracted.get("experience") or raw_extracted.get("experience_details") or []
    if isinstance(raw_exp, dict):
        raw_exp = [raw_exp]
    elif not isinstance(raw_exp, list):
        raw_exp = [str(raw_exp)] if raw_exp else []

    exp_list = []
    legacy_exp = []
    for ex in raw_exp:
        if isinstance(ex, dict):
            exp_list.append(ex)
            parts = [ex.get("job_title") or ex.get("role"), ex.get("organization"), ex.get("duration")]
            line = " at ".join(str(p) for p in parts if p)
            if line:
                legacy_exp.append(line)
        elif isinstance(ex, str) and ex.strip():
            exp_list.append({
                "organization": None,
                "job_title": ex.strip(),
                "role": ex.strip(),
                "duration": None,
                "responsibilities": [],
                "achievements": [],
            })
            legacy_exp.append(ex.strip())

    # 4. Projects list
    raw_proj = raw_extracted.get("projects") or []
    if isinstance(raw_proj, dict):
        raw_proj = [raw_proj]
    elif not isinstance(raw_proj, list):
        raw_proj = []

    # 5. Additional info
    add_info = raw_extracted.get("additional_info")
    if not isinstance(add_info, dict):
        add_info = {}

    fallback_name = filename.rsplit(".", 1)[0].replace("_", " ").title() if filename else "Applicant"
    full_name = personal.get("name") or raw_extracted.get("name") or fallback_name

    return {
        # Legacy-compatible top-level keys
        "name": str(full_name).strip(),
        "education": legacy_edu,
        "skills": all_skills,
        "experience": legacy_exp,

        # Deep structured keys
        "personal_summary": {
            "name": str(full_name).strip(),
            "summary": personal.get("summary"),
            "career_objective": personal.get("career_objective"),
            "designation": personal.get("designation"),
        },
        "education_details": edu_list,
        "skills_categorized": skills_obj,
        "experience_details": exp_list,
        "projects": raw_proj,
        "additional_info": {
            "internships": add_info.get("internships") or [],
            "certifications": add_info.get("certifications") or [],
            "achievements": add_info.get("achievements") or [],
            "publications": add_info.get("publications") or [],
            "volunteering": add_info.get("volunteering") or [],
        },
        "metadata": {
            "filename": filename,
            "file_type": file_type,
            "file_size": file_size,
            "skills_count": len(all_skills),
            "experience_count": len(exp_list),
            "projects_count": len(raw_proj),
            "education_count": len(edu_list),
        },
    }
