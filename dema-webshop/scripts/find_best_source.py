"""Find the best source file with most products and technical specs"""
import json
from pathlib import Path

base_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output')
versions = ['v9', 'v8', 'v7', 'v6', 'v5', 'v4', 'v3', 'v2', 'v1']

print("Checking analysis versions for technical specs...")
print("=" * 80)

best_file = None
best_count = 0
best_with_specs = 0

for v in versions:
    file_path = base_path / f'input_pdfs_analysis_{v}.json'
    if not file_path.exists():
        continue
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        total = len(data)
        with_specs = sum(1 for item in data if any(
            item.get(f) for f in ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg']
        ))
        
        print(f"{v}: {total:5} products, {with_specs:5} with technical specs ({with_specs/total*100:.1f}%)")
        
        if with_specs > best_with_specs:
            best_file = file_path
            best_count = total
            best_with_specs = with_specs
    except Exception as e:
        print(f"{v}: Error - {e}")

print("=" * 80)
if best_file:
    print(f"\n✅ Best source: {best_file.name}")
    print(f"   Total products: {best_count}")
    print(f"   With specs: {best_with_specs} ({best_with_specs/best_count*100:.1f}%)")
else:
    print("\n❌ No valid source files found")
