"""
Merge plat-oprolbare-slangen specifications
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/plat_oprolbare_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("MERGING PLAT-OPROLBARE-SLANGEN SPECIFICATIONS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_plat_oprolbare_merge.json')
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

# Find plat-oprolbare products
plat_products = [p for p in catalog if 'plat-oprolbare' in str(p.get('catalog', '')).lower()]
print(f"📦 Found {len(plat_products)} plat-oprolbare products in catalog")

# Merge specs
stats = {
    'products_updated': 0,
    'inner_diameter_added': 0,
    'work_pressure_added': 0,
    'rupture_pressure_added': 0,
    'weight_added': 0,
    'length_added': 0
}

print(f"\n⚡ Merging specifications...")

for product in plat_products:
    sku = product.get('sku')
    if not sku or sku not in specs_by_sku:
        continue
    
    specs = specs_by_sku[sku]
    updated = False
    
    # Add inner diameter
    if 'inner_diameter_mm' in specs:
        product['inner_diameter_mm'] = specs['inner_diameter_mm']
        product['diameter_mm'] = specs['inner_diameter_mm']  # Set as main diameter
        stats['inner_diameter_added'] += 1
        updated = True
    
    # Add work pressure
    if 'work_pressure_bar' in specs:
        product['work_pressure_bar'] = specs['work_pressure_bar']
        product['pressure_max_bar'] = specs['work_pressure_bar']  # Also set as max
        stats['work_pressure_added'] += 1
        updated = True
    
    # Add rupture pressure
    if 'rupture_pressure_bar' in specs:
        product['rupture_pressure_bar'] = specs['rupture_pressure_bar']
        stats['rupture_pressure_added'] += 1
        updated = True
    
    # Add weight
    if 'weight_g_per_m' in specs:
        product['weight_g_per_m'] = specs['weight_g_per_m']
        product['weight_kg_per_m'] = specs['weight_kg_per_m']
        stats['weight_added'] += 1
        updated = True
    
    # Add length
    if 'length_m' in specs:
        product['length_m'] = specs['length_m']
        stats['length_added'] += 1
        updated = True
    
    if updated:
        stats['products_updated'] += 1
        
        if stats['products_updated'] <= 10:
            print(f"   ✓ {sku:20} ", end='')
            if 'inner_diameter_mm' in specs:
                print(f"⊙ {specs['inner_diameter_mm']:4.0f}mm ", end='')
            if 'work_pressure_bar' in specs:
                print(f"🔧 {specs['work_pressure_bar']:4.0f}bar ", end='')
            if 'length_m' in specs:
                print(f"📐 {specs['length_m']:4.0f}m ", end='')
            print()

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 MERGE STATISTICS:")
print(f"   Products updated:          {stats['products_updated']}")
print(f"   Inner diameters added:     {stats['inner_diameter_added']}")
print(f"   Work pressures added:      {stats['work_pressure_added']}")
print(f"   Rupture pressures added:   {stats['rupture_pressure_added']}")
print(f"   Weights added:             {stats['weight_added']}")
print(f"   Lengths added:             {stats['length_added']}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
updated_products = [p for p in plat_products if p.get('inner_diameter_mm')][:5]
for p in updated_products:
    print(f"\n   SKU: {p['sku']}")
    if p.get('inner_diameter_mm'):
        print(f"   ⊙ Inner diameter: {p['inner_diameter_mm']} mm")
    if p.get('work_pressure_bar'):
        print(f"   🔧 Work pressure: {p['work_pressure_bar']} bar")
    if p.get('rupture_pressure_bar'):
        print(f"   💥 Rupture pressure: {p['rupture_pressure_bar']} bar")
    if p.get('weight_kg_per_m'):
        print(f"   ⚖️ Weight: {p['weight_g_per_m']} g/m ({p['weight_kg_per_m']} kg/m)")
    if p.get('length_m'):
        print(f"   📐 Length: {p['length_m']} m")

print(f"\n{'='*80}")
print("✅ MERGE COMPLETE!")
print("="*80)
