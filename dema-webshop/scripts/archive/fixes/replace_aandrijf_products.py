"""
Replace all aandrijftechniek products with correctly extracted ones
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs with correct SKUs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/aandrijftechniek_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("REPLACING AANDRIJFTECHNIEK PRODUCTS WITH CORRECT DATA")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_replace_aandrijf.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Remove all old aandrijftechniek products
other_products = [p for p in catalog if 'aandrijftechniek' not in str(p.get('catalog', '')).lower()]
old_count = len(catalog) - len(other_products)

print(f"\n🗑️  Removing {old_count} old aandrijftechniek products")

# Build new products from extracted data
new_products = []
next_id = max([int(p.get('id', '0').replace('P', '')) for p in catalog if p.get('id', '').replace('P', '').isdigit()] + [0]) + 1

print(f"\n✨ Creating {len(specs_data)} new products...")

for i, spec in enumerate(specs_data):
    sku = spec.get('sku')
    if not sku:
        continue
    
    product = {
        'id': f'P{next_id + i}',
        'sku': sku,
        'name': f"{sku} - Bearing",
        'catalog': 'catalogus-aandrijftechniek-150922',
        'brand': None,
        'category': 'Bearings',
        'description': f"Product {sku} from catalogus-aandrijftechniek-150922.pdf",
        'price': None,
        'priceMode': 'request_quote',
        'inStock': None,
        'stock': {
            'status': 'unknown',
            'quantity': None
        },
        'images': [],  # Will be filled from image extraction
        'image_paths': [],
        'imageUrl': None
    }
    
    # Add all extracted specifications
    if 'diameter_mm' in spec:
        product['diameter_mm'] = spec['diameter_mm']
    if 'inner_diameter_mm' in spec:
        product['inner_diameter_mm'] = spec['inner_diameter_mm']
    if 'bearing_housing' in spec:
        product['bearing_housing'] = spec['bearing_housing']
    if 'pillow_block_bearing' in spec:
        product['pillow_block_bearing'] = spec['pillow_block_bearing']
    if 'min_temp_c' in spec:
        product['min_temp_c'] = spec['min_temp_c']
        product['max_temp_c'] = spec['max_temp_c']
    if 'type' in spec:
        product['bearing_type'] = spec['type']
    if 'application' in spec:
        product['application'] = spec['application']
    if 'page_in_pdf' in spec:
        product['page_in_pdf'] = spec['page_in_pdf']
        product['description'] = f"Product {sku} from catalogus-aandrijftechniek-150922.pdf. Page: {spec['page_in_pdf']}"
    
    # Add name based on properties
    parts = [sku]
    if product.get('bearing_type'):
        parts.append(product['bearing_type'])
    if product.get('diameter_mm'):
        parts.append(f"{product['diameter_mm']}mm")
    product['name'] = ' - '.join(parts)
    
    new_products.append(product)
    
    if (i + 1) <= 10:
        print(f"   ✓ {sku:20} | 📏 {spec.get('diameter_mm', 'N/A'):6} mm | 🏠 {spec.get('bearing_housing', 'N/A')}")

# Combine
final_catalog = other_products + new_products

print(f"\n📊 REPLACEMENT STATISTICS:")
print(f"   Old catalog size:           {len(catalog)}")
print(f"   Old aandrijf products:      {old_count}")
print(f"   Other products kept:        {len(other_products)}")
print(f"   New aandrijf products:      {len(new_products)}")
print(f"   New catalog size:           {len(final_catalog)}")
print(f"   Net change:                 {len(final_catalog) - len(catalog):+d}")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(final_catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Show sample
print(f"\n📋 SAMPLE NEW PRODUCTS:")
for p in new_products[:5]:
    print(f"\n   ID:   {p['id']}")
    print(f"   SKU:  {p['sku']}")
    print(f"   Name: {p['name']}")
    if p.get('diameter_mm'):
        print(f"   📏 Diameter: {p['diameter_mm']} mm")
    if p.get('bearing_housing'):
        print(f"   🏠 Bearing Housing: {p['bearing_housing']}")
    if p.get('pillow_block_bearing'):
        print(f"   🔩 Pillow Block: {p['pillow_block_bearing']}")

print(f"\n{'='*80}")
print("✅ REPLACEMENT COMPLETE!")
print("="*80)
