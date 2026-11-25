import json

d = json.load(open('scratch/post_implementation_audit_output.json'))['profiles']
for k, v in d.items():
    print('=== ' + k + ' ===')
    for s in v['trace']:
        step = s['step']
        qid = s.get('question_id', 'STOP')
        prompt = s.get('prompt', s.get('reason', ''))[:70]
        opt = s.get('chosen_option_id', '-')
        dims = s.get('target_dimensions', '-')
        rationale = s.get('selection_rationale', '-')
        print(f"  Step {step}: [{qid}] (Opt: {opt}, Dims: {dims})\n    Prompt: {prompt}...\n    Rationale: {rationale}")
    print()
