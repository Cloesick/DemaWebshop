"""
Merge pomp-specials specifications
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/pomp_specials_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("MERGING POMP-SPECIALS SPECIFICATIONS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_pomp_specials_merge.json')
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

# Find pomp-specials products
pomp_products = [p for p in catalog if 'pomp-special' in str(p.get('catalog', '')).lower()]
print(f"📦 Found {len(pomp_products)} pomp-specials products in catalog")

# Merge specs
stats = {
    'products_updated': 0,
    'type_added': 0,
    'power_added': 0,
    'rpm_added': 0,
    'flow_added': 0,
    'pressure_added': 0
}

print(f"\n⚡ Merging specifications...")

for product in pomp_products:
    sku = product.get('sku')
    if not sku or sku not in specs_by_sku:
        continue
    
    specs = specs_by_sku[sku]
    updated = False
    
    # Add pump type
    if 'pump_type' in specs:
        product['pump_type'] = specs['pump_type']
        stats['type_added'] += 1
        updated = True
    
    # Add power (HP and kW)
    if 'power_hp' in specs:
        product['power_hp'] = specs['power_hp']
        product['power_kw'] = specs['power_kw']
        stats['power_added'] += 1
        updated = True
    
    # Add RPM
    if 'rpm' in specs:
        product['rpm'] = specs['rpm']
        stats['rpm_added'] += 1
        updated = True
    
    # Add flow
    if 'flow_m3_per_h' in specs:
        product['flow_m3_per_h'] = specs['flow_m3_per_h']
        product['flow_l_min'] = specs['flow_l_min']
        stats['flow_added'] += 1
        updated = True
    
    # Add pressure
    if 'pressure_height_m' in specs:
        product['pressure_height_m'] = specs['pressure_height_m']
        product['pressure_max_bar'] = specs['pressure_max_bar']
        stats['pressure_added'] += 1
        updated = True
    
    if updated:
        stats['products_updated'] += 1
        
        if stats['products_updated'] <= 10:
            print(f"   ✓ {sku:20} ", end='')
            if 'pump_type' in specs:
                print(f"{specs['pump_type']:10} ", end='')
            if 'power_hp' in specs:
                print(f"⚡ {specs['power_hp']:4.0f}HP ", end='')
            if 'rpm' in specs:
                print(f"🔄 {specs['rpm']:4}RPM ", end='')
            print()

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 MERGE STATISTICS:")
print(f"   Products updated:          {stats['products_updated']}")
print(f"   Pump types added:          {stats['type_added']}")
print(f"   Power specs added:         {stats['power_added']}")
print(f"   RPM values added:          {stats['rpm_added']}")
print(f"   Flow rates added:          {stats['flow_added']}")
print(f"   Pressure specs added:      {stats['pressure_added']}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
updated_products = [p for p in pomp_products if p.get('pump_type')][:5]
for p in updated_products:
    print(f"\n   SKU: {p['sku']}")
    if p.get('pump_type'):
        print(f"      Type: {p['pump_type']}")
    if p.get('power_hp'):
        print(f"      ⚡ Power: {p['power_hp']} HP ({p['power_kw']} kW)")
    if p.get('rpm'):
        print(f"      🔄 RPM: {p['rpm']}")
    if p.get('flow_m3_per_h'):
        print(f"      💨 Flow: {p['flow_m3_per_h']} m³/h ({p['flow_l_min']} L/min)")
    if p.get('pressure_height_m'):
        print(f"      🔧 Pressure: {p['pressure_height_m']} m ({p['pressure_max_bar']} bar)")

print(f"\n{'='*80}")
print("✅ MERGE COMPLETE!")
print("="*80)
