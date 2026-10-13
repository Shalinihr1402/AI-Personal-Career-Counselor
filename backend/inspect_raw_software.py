import zipfile
import csv
import io
from pathlib import Path

raw_zip = Path('data/onet_raw.zip')
target_socs = [
    ('27-2042.00', 'Musicians and Singers'),
    ('29-1141.00', 'Registered Nurses'),
    ('25-2012.00', 'Kindergarten Teachers'),
]

with zipfile.ZipFile(raw_zip) as z:
    sw_file = [name for name in z.namelist() if 'software skills' in name.lower()][0]
    with z.open(sw_file) as f:
        reader = csv.DictReader(io.TextIOWrapper(f, encoding='utf-8', errors='replace'), delimiter='\t')
        all_rows = list(reader)

for soc, title in target_socs:
    print('=' * 100)
    print(f'SOC: {soc} - {title}')
    soc_rows = [r for r in all_rows if r.get('O*NET-SOC Code', '').strip() == soc]
    print(f'Total software rows: {len(soc_rows)}')
    for r in soc_rows:
        ex = r.get('Workplace Example') or r.get('Example') or ''
        elem = r.get('Element Name') or ''
        elem_id = r.get('Element ID') or ''
        hot = r.get('Hot Technology', 'N')
        dem = r.get('In Demand', 'N')
        print(f"  {ex:<40} | Elem: {elem:<35} | ID: {elem_id:<8} | Hot: {hot} | Dem: {dem}")
