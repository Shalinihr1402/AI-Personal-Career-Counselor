import glob

files = glob.glob(r'frontend/src/components/onboarding/*.tsx') + [r'frontend/src/pages/Onboarding.tsx']
for path in files:
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace broken encoding artifacts
    replacements = {
        'â€”': '—',
        'Ã¢â‚¬â€': '—',
        'â€¢': '•',
        'Ã¢â‚¬Â¢': '•',
        'âœ“': '✓',
        'â†': '←',
        'Ã¢â‚¬': '—',
    }
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Cleaned {len(files)} files successfully.")
