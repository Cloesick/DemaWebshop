"""
Merge ABS table-extracted specifications into catalog
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/abs_table_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("MERGING ABS TABLE SPECIFICATIONS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_abs_table_merge.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Build SKU lookup
specs_by_sku = {}
for spec in specs_data:
    sku = spec.get('sku')
    if sku:
        specs_by_sku[sku] = spec

print(f"\n📊 Loaded {len(specs_by_sku)} product specifications from tables")

# Find ABS products
abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
print(f"📦 Found {len(abs_products)} abs-persluchtbuizen products in catalog")

# Merge specs
stats = {
    'products_updated': 0,
    'diameter_added': 0,
    'diameter_updated': 0,
    'pressure_added': 0,
    'angle_preserved': 0
}

print(f"\n⚡ Merging specifications...")

for product in abs_products:
    sku = product.get('sku')
    if not sku or sku not in specs_by_sku:
        continue
    
    specs = specs_by_sku[sku]
    updated = False
    
    # Add or update diameter (prefer table data over SKU pattern)
    if 'diameter_mm' in specs:
        old_diameter = product.get('diameter_mm')
        new_diameter = specs['diameter_mm']
        
        if old_diameter != new_diameter:
            product['diameter_mm'] = new_diameter
            product['diameter_source'] = 'table'
            if old_diameter:
                stats['diameter_updated'] += 1
            else:
                stats['diameter_added'] += 1
            updated = True
        elif not product.get('diameter_source'):
            product['diameter_source'] = 'table'
            updated = True
    
    # Add pressure (from table)
    if 'pressure_max_bar' in specs:
        if not product.get('pressure_max_bar'):
            product['pressure_max_bar'] = specs['pressure_max_bar']
            stats['pressure_added'] += 1
            updated = True
    
    # Preserve angle if it exists (from SKU pattern extraction)
    if product.get('angle_degrees'):
        stats['angle_preserved'] += 1
    
    if updated:
        stats['products_updated'] += 1
        
        if stats['products_updated'] <= 15:
            diameter_str = f"{product.get('diameter_mm', 'N/A'):>3}"
            pressure_str = f"{product.get('pressure_max_bar', 'N/A'):>4}"
            angle_str = f"{product.get('angle_degrees', 'N/A'):>3}"
            print(f"   ✓ {sku:15} | ø {diameter_str} mm | 🔧 {pressure_str} bar | ∠ {angle_str}°")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 MERGE STATISTICS:")
print(f"   Products updated:          {stats['products_updated']}")
print(f"   Diameters added:           {stats['diameter_added']}")
print(f"   Diameters updated:         {stats['diameter_updated']}")
print(f"   Pressures added:           {stats['pressure_added']}")
print(f"   Angles preserved:          {stats['angle_preserved']}")

# Show summary
print(f"\n✅ VERIFICATION:")
abs_products_updated = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
with_diameter = len([p for p in abs_products_updated if p.get('diameter_mm')])
with_pressure = len([p for p in abs_products_updated if p.get('pressure_max_bar')])
with_angle = len([p for p in abs_products_updated if p.get('angle_degrees')])

print(f"   Products with diameter:    {with_diameter} / {len(abs_products_updated)}")
print(f"   Products with pressure:    {with_pressure} / {len(abs_products_updated)}")
print(f"   Products with angle:       {with_angle} / {len(abs_products_updated)}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")

# Straight pipes (no angle)
straight = [p for p in abs_products_updated if p.get('diameter_mm') and not p.get('angle_degrees')][:2]
if straight:
    print(f"\n   Straight Pipes:")
    for p in straight:
        print(f"      {p['sku']:15} → ø {p['diameter_mm']} mm, 🔧 {p.get('pressure_max_bar', 'N/A')} bar")

# Angled fittings
angled = [p for p in abs_products_updated if p.get('angle_degrees')][:3]
if angled:
    print(f"\n   Angled Fittings:")
    for p in angled:
        print(f"      {p['sku']:15} → ø {p.get('diameter_mm', 'N/A')} mm, 🔧 {p.get('pressure_max_bar', 'N/A')} bar, ∠ {p['angle_degrees']}°")

print(f"\n{'='*80}")
print("✅ MERGE COMPLETE!")
print("="*80)
