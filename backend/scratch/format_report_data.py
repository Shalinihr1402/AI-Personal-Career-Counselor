import json

with open("scratch/post_implementation_audit_output.json") as f:
    data = json.load(f)

print("DATA LOADED SUCCESSFULLY")
print("Profiles:", list(data["profiles"].keys()))
print("Branching test:", data.get("branching_test"))
print("Stopping test:", data.get("uncertainty_stopping_test"))
