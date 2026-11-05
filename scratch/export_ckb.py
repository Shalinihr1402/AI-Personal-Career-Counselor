import json
import sys
from pathlib import Path

sys.path.insert(0, r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\backend")
import career_knowledge_base as ckb

base = ckb.CareerKnowledgeBase()
records = [r.to_dict() for r in base._all_records]

output_path = Path(r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\backend\data\career_knowledge_base.json")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(records, f, indent=2, ensure_ascii=False)

print(f"Exported {len(records)} records to {output_path.name}")
curated = [r for r in records if r["source_metadata"].get("record_provenance") == "curated_benchmark"]
projected = [r for r in records if r["source_metadata"].get("record_provenance") == "projected_onet"]
print(f"Curated benchmark records: {len(curated)}")
print(f"Projected O*NET records: {len(projected)}")
