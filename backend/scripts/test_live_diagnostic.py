import urllib.request
import json

# 1. Test diagnostic chat
diag_payload = {
    'messages': [
        {'role': 'assistant', 'content': 'Hello! Tell me about a project you have built.'},
        {'role': 'user', 'content': 'I built a career counseling web application with FastAPI, Python, and PostgreSQL.'}
    ],
    'student_profile': {'educationStage': 'college_ug_pg', 'course': 'B.Tech CS'},
    'assessment_evidence': {'holland_code': 'EAI'},
    'diagnostic_profile': None
}

req = urllib.request.Request(
    'http://127.0.0.1:8000/api/counselor/diagnostic-chat',
    data=json.dumps(diag_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res = urllib.request.urlopen(req)
data = json.loads(res.read())
print('DIAGNOSTIC CHAT RESPONSE:')
print('Reply:', data.get('reply')[:140])
print('Extracted skills:', data.get('diagnostic_profile', {}).get('technical_skills'))
print('Projects:', [p.get('name') for p in data.get('diagnostic_profile', {}).get('projects', [])])
print('Completeness:', data.get('completeness_score'), '%')

# 2. Test generate recommendations
rec_payload = {
    'riasec_scores': {'R': 12, 'I': 19, 'A': 19, 'S': 12, 'E': 19, 'C': 12},
    'code': 'EAI',
    'interests': ['AI & Machine Learning', 'Web Development'],
    'education': 'B.Tech Computer Science',
    'work_style': {'people_vs_data': 'Working with data or things'},
    'resume_skills': ['Python', 'SQL'],
    'diagnostic_profile': data.get('diagnostic_profile')
}

req2 = urllib.request.Request(
    'http://127.0.0.1:8000/api/counselor/generate-recommendations',
    data=json.dumps(rec_payload).encode('utf-8'),
    headers={'Content-Type': 'application/json'}
)
res2 = urllib.request.urlopen(req2)
data2 = json.loads(res2.read())
print('\nRECOMMENDATIONS RESPONSE:')
print('Source:', data2.get('source'))
print('Matches count:', len(data2.get('matches', [])))
for i, m in enumerate(data2.get('matches', [])):
    print(f'  #{i+1}: {m.get("title")} ({m.get("fit")}%) - Readiness: {m.get("readiness")}')
