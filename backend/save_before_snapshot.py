import os
import sys
import json

if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

current_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(current_dir)
sys.path.insert(0, current_dir)

DATA_PATH = os.path.join(current_dir, "data", "onet_careers.json")
with open(DATA_PATH, "r", encoding="utf-8") as f:
    careers = json.load(f)

test_socs = [
    "27-2042.00",  # Musicians and Singers
    "27-1022.00",  # Fashion Designers
    "29-1141.00",  # Registered Nurses
    "25-2012.00",  # Kindergarten Teachers
    "15-1252.00",  # Software Developers
    "15-2051.00",  # Data Scientists
    "11-3051.00",  # Industrial Production Managers (SAP relevant)
    "11-3051.01",  # Quality Control Systems Managers
]

snapshot = {}
for c in careers:
    if c.get("soc_code") in test_socs:
        snapshot[c.get("soc_code")] = {
            "title": c.get("title"),
            "field": c.get("field"),
            "skills": c.get("skills"),
            "software_tools": c.get("software_tools")
        }

with open("before_etl_snapshot.json", "w", encoding="utf-8") as out:
    json.dump(snapshot, out, indent=2, ensure_ascii=False)

print("Saved before_etl_snapshot.json successfully.")
