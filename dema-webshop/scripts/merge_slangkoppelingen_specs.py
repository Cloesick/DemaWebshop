"""
Merge slangkoppelingen specifications with correct outer/inner diameters
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/slangkoppelingen_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("MERGING SLANGKOPPELINGEN SPECIFICATIONS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_slangkoppelingen_merge.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Build SKU lookup
specs_by_sku = {}
for spec in specs_data:
    sku = spec.get('sku')
    if sku:
        specs_by_sku[sku] = spec

print(f"\n📊 Loaded {len(specs_by_sku)} product specifications")

# Find slangkoppelingen products
slang_products = [p for p in catalog if 'slangkoppeling' in str(p.get('catalog', '')).lower()]
print(f"📦 Found {len(slang_products)} slangkoppelingen products in catalog")

# Merge specs
stats = {
    'products_updated': 0,
    'outer_added': 0,
    'inner_added': 0,
    'diameter_updated': 0
}

print(f"\n⚡ Merging specifications...")

for product in slang_products:
    sku = product.get('sku')
    if not sku or sku not in specs_by_sku:
        continue
    
    specs = specs_by_sku[sku]
    updated = False
    
    # Add outer diameter
    if 'outer_diameter_mm' in specs:
        product['outer_diameter_mm'] = specs['outer_diameter_mm']
        stats['outer_added'] += 1
        updated = True
    
    # Add inner diameter
    if 'inner_diameter_mm' in specs:
        product['inner_diameter_mm'] = specs['inner_diameter_mm']
        stats['inner_added'] += 1
        updated = True
    
    # Update main diameter to outer diameter
    if 'outer_diameter_mm' in specs:
        product['diameter_mm'] = specs['outer_diameter_mm']
        stats['diameter_updated'] += 1
    
    if updated:
        stats['products_updated'] += 1
        
        if stats['products_updated'] <= 10:
            print(f"   ✓ {sku:20} ", end='')
            if 'outer_diameter_mm' in specs:
                print(f"Outer: {specs['outer_diameter_mm']:6.1f}mm ", end='')
            if 'inner_diameter_mm' in specs:
                print(f"Inner: {specs['inner_diameter_mm']:6.1f}mm ", end='')
            print()

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 MERGE STATISTICS:")
print(f"   Products updated:      {stats['products_updated']}")
print(f"   Outer diameters added: {stats['outer_added']}")
print(f"   Inner diameters added: {stats['inner_added']}")
print(f"   Main diameter updated: {stats['diameter_updated']}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
updated_products = [p for p in slang_products if p.get('outer_diameter_mm')][:5]
for p in updated_products:
    print(f"\n   SKU: {p['sku']}")
    if p.get('outer_diameter_mm'):
        print(f"   ↔️ Outer diameter: {p['outer_diameter_mm']} mm")
    if p.get('inner_diameter_mm'):
        print(f"   📐 Inner diameter: {p['inner_diameter_mm']} mm")
    if p.get('diameter_mm'):
        print(f"   📏 Main diameter: {p['diameter_mm']} mm")

print(f"\n{'='*80}")
print("✅ MERGE COMPLETE!")
print("="*80)
