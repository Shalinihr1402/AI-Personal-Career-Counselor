import os
import glob
import re

root = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor"
files = glob.glob(root + "/**/*.*", recursive=True)
files = [f for f in files if not any(x in f for x in ['node_modules', 'venv', '.git', 'scratch', '__pycache__'])]

json_files = [
    "career_knowledge_base.json",
    "onet_careers.json",
    "career_index.json",
    "audit_summary_report.json",
    "before_etl_snapshot.json",
    "dealbreaker_experiment_results.json",
    "endpoint_validation_results.json",
    "experiment_results.json"
]

results = {jf: [] for jf in json_files}

for f in files:
    try:
        content = open(f, encoding='utf-8', errors='ignore').read()
        rel = os.path.relpath(f, root)
        for jf in json_files:
            if jf in content:
                # find lines
                matching_lines = [l.strip() for l in content.splitlines() if jf in l]
                results[jf].append((rel, matching_lines))
    except Exception:
        pass

for jf, refs in results.items():
    print(f"=== {jf} ===")
    for rel, lines in refs:
        print(f"  Referenced in: {rel}")
        for l in lines[:2]:
            print(f"     {l[:110]}")
    print()
