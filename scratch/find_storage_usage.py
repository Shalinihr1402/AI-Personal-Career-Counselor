import os
import glob
import re

frontend_src = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\frontend\src"
files = glob.glob(frontend_src + "/**/*.*", recursive=True)

storage_refs = []

for f in files:
    if not (f.endswith('.ts') or f.endswith('.tsx') or f.endswith('.js') or f.endswith('.jsx')):
        continue
    content = open(f, encoding='utf-8', errors='ignore').read()
    if 'localStorage' in content or 'sessionStorage' in content:
        rel = os.path.relpath(f, frontend_src)
        hits = [l.strip() for l in content.splitlines() if 'localStorage' in l or 'sessionStorage' in l]
        storage_refs.append((rel, hits))

print("Browser storage usage in frontend:")
for rel, hits in sorted(storage_refs):
    print(f"=== {rel} ===")
    for h in hits:
        print(f"  {h[:120]}")
