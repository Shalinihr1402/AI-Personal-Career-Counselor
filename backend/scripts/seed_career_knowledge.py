"""
Seed script for Supabase career_knowledge table.

Reads verified and projected career intelligence from backend/data/career_knowledge_base.json
and upserts records in batches into the Supabase 'career_knowledge' table.

Usage:
    python backend/scripts/seed_career_knowledge.py
"""

import os
import sys
import json
from pathlib import Path

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

CURRENT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = CURRENT_DIR.parent
DATA_PATH = BACKEND_DIR / "data" / "career_knowledge_base.json"
ENV_PATH = BACKEND_DIR / ".env"

try:
    from dotenv import load_dotenv
    if ENV_PATH.exists():
        load_dotenv(ENV_PATH)
except ImportError:
    pass

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")


def seed_career_knowledge(batch_size: int = 50):
    if not DATA_PATH.exists():
        print(f"Error: Dataset not found at {DATA_PATH}")
        return False

    with open(DATA_PATH, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Found {len(records)} records in {DATA_PATH.name}")

    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Warning: SUPABASE_URL or SUPABASE_KEY not configured in environment.")
        print("Database seeding requires valid credentials. JSON dataset remains ready for local retrieval.")
        return False

    try:
        import httpx
    except ImportError:
        print("Error: httpx package is required to seed Supabase via REST API.")
        return False

    endpoint = f"{SUPABASE_URL.rstrip('/')}/rest/v1/career_knowledge"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates",
    }

    print(f"Seeding {len(records)} career records into Supabase ({endpoint})...")

    success_count = 0
    total_batches = (len(records) + batch_size - 1) // batch_size

    for b_idx in range(total_batches):
        batch = records[b_idx * batch_size : (b_idx + 1) * batch_size]
        payload = []
        for r in batch:
            payload.append({
                "id": r["id"],
                "slug": r["slug"],
                "soc_code": r.get("soc_code"),
                "nco_code": r.get("nco_code"),
                "canonical_title": r.get("canonical_title", ""),
                "category": r.get("category", "General"),
                "industry": r.get("industry", "General"),
                "domain": r.get("domain", "other_specialized"),
                "description": r.get("description", ""),
                "data": r,
            })

        try:
            resp = httpx.post(endpoint, headers=headers, json=payload, timeout=30.0)
            if resp.status_code in (200, 201):
                success_count += len(batch)
                print(f"Batch {b_idx + 1}/{total_batches}: Uploaded {len(batch)} records (Total: {success_count})")
            else:
                print(f"Batch {b_idx + 1} failed: {resp.status_code} - {resp.text[:200]}")
        except Exception as e:
            print(f"Batch {b_idx + 1} connection error: {e}")
            break

    print(f"Seeding finished: {success_count}/{len(records)} records processed.")
    return success_count == len(records)


if __name__ == "__main__":
    seed_career_knowledge()
