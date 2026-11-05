import os
import glob
import re

frontend_src = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\frontend\src"
files = glob.glob(frontend_src + "/**/*.*", recursive=True)

for f in files:
    content = open(f, encoding='utf-8', errors='ignore').read()
    if 'counselor/chat' in content or 'api/counselor' in content:
        print(f"Found api/counselor call in: {os.path.relpath(f, frontend_src)}")
