import os
import glob
import re

frontend_src = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\frontend\src"
files = glob.glob(frontend_src + "/**/*.*", recursive=True)

found_tables = {}

for f in files:
    if not (f.endswith('.ts') or f.endswith('.tsx')):
        continue
    content = open(f, encoding='utf-8', errors='ignore').read()
    matches = re.findall(r"\.from\(['\"]([^'\"]+)['\"]\)", content)
    if matches:
        found_tables[os.path.relpath(f, frontend_src)] = set(matches)

print("Tables queried in frontend:")
for file, tables in sorted(found_tables.items()):
    print(f"  {file} -> {tables}")
