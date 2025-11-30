"""
Fix slangkoppelingen products where outer == inner diameter
"""
import json
import shutil
from pathlib import Path
from datetime import datetime

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

def backup_catalog():
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = catalog_path.parent / f'catalog_products_backup_{timestamp}.json'
    shutil.copy(catalog_path, backup_path)
    print(f"✓ Backup created: {backup_path.name}")
    return backup_path

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("FIXING SLANGKOPPELINGEN DUPLICATES")
print("=" * 80)

backup_catalog()

# Find problematic products
problems = []
for product in catalog:
    if product.get('catalog') != 'slangkoppelingen':
        continue
    
    outer = product.get('outer_diameter_mm')
    inner = product.get('inner_diameter_mm')
    
    # If both outer and inner are the same, keep only one
    if outer and inner and outer == inner:
        problems.append(product)

print(f"\nFound {len(problems)} products with outer_diameter_mm == inner_diameter_mm\n")

for product in problems:
    sku = product.get('sku')
    outer = product.get('outer_diameter_mm')
    inner = product.get('inner_diameter_mm')
    
    print(f"SKU {sku}: outer={outer}, inner={inner}")
    
    # This is likely a straight coupling (50x50), so both diameters ARE correct
    # But we should only display once on the card
    # Keep both in data, but mark that they're the same
    # Actually, for 50x50 straight coupling, just keep diameter_mm
    
    # Remove outer_diameter_mm and inner_diameter_mm, set diameter_mm
    if 'outer_diameter_mm' in product:
        del product['outer_diameter_mm']
    if 'inner_diameter_mm' in product:
        del product['inner_diameter_mm']
    product['diameter_mm'] = outer  # Use the value (they're the same)
    
    print(f"  → Changed to diameter_mm={outer}")

# Save
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)

print(f"\n✅ Fixed {len(problems)} products")
print("=" * 80)
