import os
import urllib.request
import urllib.error
import json

backend_env_path = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\backend\.env"
frontend_env_path = r"C:\Users\ABHISHEK\Documents\AI-Career-Councelor\AI-Personal-Career-Counselor\frontend\.env"

supabase_url = None
anon_key = None
database_url = None

if os.path.exists(backend_env_path):
    for line in open(backend_env_path):
        if line.startswith("SUPABASE_URL="):
            supabase_url = line.strip().split("=", 1)[1]
        elif line.startswith("VITE_SUPABASE_ANON_KEY="):
            anon_key = line.strip().split("=", 1)[1]
        elif line.startswith("DATABASE_URL="):
            database_url = line.strip().split("=", 1)[1]

if not supabase_url and os.path.exists(frontend_env_path):
    for line in open(frontend_env_path):
        if line.startswith("VITE_SUPABASE_URL="):
            supabase_url = line.strip().split("=", 1)[1]
        elif line.startswith("VITE_SUPABASE_ANON_KEY="):
            anon_key = line.strip().split("=", 1)[1]

print(f"Testing Supabase URL: {supabase_url}")

# 1. Test PostgREST for assessments table with legacy columns
url_legacy = f"{supabase_url}/rest/v1/assessments?select=id,code,scores&limit=1"
req_legacy = urllib.request.Request(url_legacy, headers={
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}"
})

try:
    with urllib.request.urlopen(req_legacy) as resp:
        print(f"Legacy columns check HTTP status: {resp.status}")
        data = resp.read().decode('utf-8')
        print(f"Legacy columns response: {data[:200]}")
except urllib.error.HTTPError as e:
    print(f"Legacy columns HTTP error {e.code}: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Legacy columns error: {e}")

# 2. Test PostgREST for assessments table with adaptive_evidence column
url_adaptive = f"{supabase_url}/rest/v1/assessments?select=id,adaptive_evidence&limit=1"
req_adaptive = urllib.request.Request(url_adaptive, headers={
    "apikey": anon_key,
    "Authorization": f"Bearer {anon_key}"
})

try:
    with urllib.request.urlopen(req_adaptive) as resp:
        print(f"Adaptive column check HTTP status: {resp.status}")
        data = resp.read().decode('utf-8')
        print(f"Adaptive column response: {data[:200]}")
        print("RESULT: Column 'adaptive_evidence' EXISTS on remote Supabase database!")
except urllib.error.HTTPError as e:
    err_body = e.read().decode('utf-8')
    print(f"Adaptive column HTTP error {e.code}: {err_body}")
    if "adaptive_evidence" in err_body or "PGRST204" in err_body or "42703" in err_body:
        print("RESULT: Column 'adaptive_evidence' DOES NOT EXIST YET on remote Supabase database (migration 0003 pending).")
except Exception as e:
    print(f"Adaptive column error: {e}")

# 3. Check direct DATABASE_URL if available
if database_url:
    print(f"DATABASE_URL is provided in backend/.env: host={database_url.split('@')[-1] if '@' in database_url else 'configured'}")
    try:
        import psycopg2
        conn = psycopg2.connect(database_url)
        cur = conn.cursor()
        cur.execute("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'assessments';
        """)
        cols = cur.fetchall()
        print("Direct PostgreSQL columns in 'assessments':", cols)
        cur.execute("""
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'assessments';
        """)
        indexes = cur.fetchall()
        print("Direct PostgreSQL indexes on 'assessments':", indexes)
        cur.close()
        conn.close()
    except ImportError:
        print("psycopg2 is not installed in the python environment.")
    except Exception as e:
        print(f"PostgreSQL direct connection result: {e}")
