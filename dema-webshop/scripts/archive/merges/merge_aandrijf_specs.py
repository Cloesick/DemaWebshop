"""
Merge aandrijftechniek specifications into catalog
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/aandrijftechniek_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("MERGING AANDRIJFTECHNIEK SPECIFICATIONS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_aandrijf_specs.json')
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

# Find aandrijftechniek products
aandrijf_products = [p for p in catalog if 'aandrijftechniek' in str(p.get('catalog', '')).lower()]
print(f"📦 Found {len(aandrijf_products)} aandrijftechniek products in catalog")

# Merge specs
stats = {
    'products_updated': 0,
    'diameter_added': 0,
    'temperature_added': 0,
    'type_added': 0,
    'application_added': 0,
    'bearing_housing_added': 0,
    'pillow_block_added': 0,
}

print(f"\n⚡ Merging specifications...")

for product in aandrijf_products:
    sku = product.get('sku')
    if not sku or sku not in specs_by_sku:
        continue
    
    specs = specs_by_sku[sku]
    updated = False
    
    # Add diameter (inside diameter from column 1)
    if 'diameter_mm' in specs and not product.get('diameter_mm'):
        product['diameter_mm'] = specs['diameter_mm']
        stats['diameter_added'] += 1
        updated = True
    
    # Add inner diameter specifically
    if 'inner_diameter_mm' in specs and not product.get('inner_diameter_mm'):
        product['inner_diameter_mm'] = specs['inner_diameter_mm']
        updated = True
    
    # Add temperature range
    if 'min_temp_c' in specs:
        product['min_temp_c'] = specs['min_temp_c']
        product['max_temp_c'] = specs['max_temp_c']
        stats['temperature_added'] += 1
        updated = True
    
    # Add type
    if 'type' in specs:
        product['bearing_type'] = specs['type']
        stats['type_added'] += 1
        updated = True
    
    # Add application
    if 'application' in specs:
        product['application'] = specs['application']
        stats['application_added'] += 1
        updated = True
    
    # Add bearing housing
    if 'bearing_housing' in specs:
        product['bearing_housing'] = specs['bearing_housing']
        stats['bearing_housing_added'] += 1
        updated = True
    
    # Add pillow block bearing
    if 'pillow_block_bearing' in specs:
        product['pillow_block_bearing'] = specs['pillow_block_bearing']
        stats['pillow_block_added'] += 1
        updated = True
    
    if updated:
        stats['products_updated'] += 1
        
        if stats['products_updated'] <= 10:
            print(f"   ✓ {sku:20} ", end='')
            if 'diameter_mm' in specs:
                print(f"📏 {specs['diameter_mm']}mm ", end='')
            if 'min_temp_c' in specs:
                print(f"🌡️ {specs['min_temp_c']}°-{specs['max_temp_c']}°C ", end='')
            if 'type' in specs:
                print(f"🏷️ {specs['type'][:20]} ", end='')
            print()

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 MERGE STATISTICS:")
print(f"   Products updated:          {stats['products_updated']}")
print(f"   Diameters added:           {stats['diameter_added']}")
print(f"   Temperature ranges added:  {stats['temperature_added']}")
print(f"   Types added:               {stats['type_added']}")
print(f"   Applications added:        {stats['application_added']}")
print(f"   Bearing housings added:    {stats['bearing_housing_added']}")
print(f"   Pillow block bearings:     {stats['pillow_block_added']}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
updated_products = [p for p in aandrijf_products if p.get('bearing_type')][:3]
for p in updated_products:
    print(f"\n   SKU: {p['sku']}")
    print(f"      Catalog: {p.get('catalog')}")
    if p.get('diameter_mm'):
        print(f"      📏 Diameter: {p['diameter_mm']} mm")
    if p.get('min_temp_c'):
        print(f"      🌡️ Temperature: {p['min_temp_c']}°C to {p['max_temp_c']}°C")
    if p.get('bearing_type'):
        print(f"      🏷️ Type: {p['bearing_type']}")
    if p.get('application'):
        print(f"      🔧 Application: {p['application']}")
    if p.get('bearing_housing'):
        print(f"      🏠 Bearing Housing: {p['bearing_housing']}")
    if p.get('pillow_block_bearing'):
        print(f"      🔩 Pillow Block: {p['pillow_block_bearing']}")

print(f"\n{'='*80}")
print("✅ MERGE COMPLETE!")
print("="*80)
