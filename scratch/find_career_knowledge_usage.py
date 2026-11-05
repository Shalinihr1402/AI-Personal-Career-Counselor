import os
import glob
import re

root = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor"
files = glob.glob(root + "/**/*.*", recursive=True)
files = [f for f in files if not any(x in f for x in ['node_modules', 'venv', '.git', 'scratch'])]

matches = []
for f in files:
    try:
        content = open(f, encoding='utf-8', errors='ignore').read()
        if 'career_knowledge' in content:
            rel = os.path.relpath(f, root)
            hits = [l.strip() for l in content.splitlines() if 'career_knowledge' in l and not l.strip().startswith('//') and not l.strip().startswith('#')]
            matches.append((rel, len(hits), hits[:2]))
    except Exception:
        pass

print("Occurrences of career_knowledge across repository:")
for rel, count, sample in sorted(matches, key=lambda x: x[0]):
    print(f"  {rel} ({count} occurrences)")
    for s in sample:
        print(f"    - {s[:100]}")
