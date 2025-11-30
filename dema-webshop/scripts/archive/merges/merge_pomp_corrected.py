"""
Merge corrected pomp-specials data with manual fixes for corrupted table rows
"""
import json
import shutil
from pathlib import Path
from datetime import datetime

# Manual corrections for SKUs where PDF table parsing failed
MANUAL_CORRECTIONS = {
    '17130230': {
        'flow_m3_per_h': 66.0,
        'flow_l_min': 1100.0,
        'pressure_height_m': 59.0,
        'pressure_max_bar': 5.9
    },
    '17130290': {
        'flow_m3_per_h': 35.0,
        'flow_l_min': 583.3,
        'pressure_height_m': 87.0,
        'pressure_max_bar': 8.7
    },
}

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'
extraction_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/pomp_specials_correct_v2.json')

def backup_catalog():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = catalog_path.parent / f'catalog_products_backup_{timestamp}.json'
    shutil.copy(catalog_path, backup_path)
    print(f"✓ Backup created: {backup_path.name}")
    return backup_path

print("=" * 100)
print("MERGING CORRECTED POMP-SPECIALS DATA")
print("=" * 100)

# Backup
print("\n💾 Creating backup...")
backup_catalog()

# Load data
print("\n📂 Loading data...")
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

with open(extraction_path, 'r', encoding='utf-8') as f:
    extracted = json.load(f)

print(f"   Catalog products: {len(catalog)}")
print(f"   Extracted products: {len(extracted)}")

# Create lookup
extracted_by_sku = {p['sku']: p for p in extracted}

# Merge
print("\n🔄 Merging pomp-specials products...")
stats = {
    'updated': 0,
    'manual_corrected': 0,
    'not_found': 0
}

for product in catalog:
    if product.get('catalog') != 'pomp-specials':
        continue
    
    sku = product.get('sku')
    if not sku:
        continue
    
    # Get extracted data
    extracted_data = extracted_by_sku.get(sku)
    
    if not extracted_data:
        stats['not_found'] += 1
        continue
    
    # Update properties
    for key in ['pump_type', 'power_hp', 'power_kw', 'rpm', 'flow_m3_per_h', 
                'flow_l_min', 'pressure_height_m', 'pressure_max_bar', 'weight_kg',
                'suction_dn', 'discharge_dn']:
        if key in extracted_data and extracted_data[key]:
            product[key] = extracted_data[key]
    
    # Apply manual corrections if needed
    if sku in MANUAL_CORRECTIONS:
        corrections = MANUAL_CORRECTIONS[sku]
        for key, value in corrections.items():
            product[key] = value
        stats['manual_corrected'] += 1
        print(f"  ✓ Manual correction applied to SKU {sku}")
    
    stats['updated'] += 1

# Save
print("\n💾 Saving catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

# Report
print("\n" + "=" * 100)
print("MERGE SUMMARY")
print("=" * 100)
print(f"Products updated:              {stats['updated']}")
print(f"Manual corrections applied:    {stats['manual_corrected']}")
print(f"Not found in extraction:       {stats['not_found']}")

if stats['manual_corrected'] > 0:
    print("\n📝 Manual corrections for:")
    for sku in MANUAL_CORRECTIONS:
        print(f"   - SKU {sku}")

print("\n✅ MERGE COMPLETE!")
print("=" * 100)
