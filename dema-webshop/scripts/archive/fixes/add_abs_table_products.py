"""
Add ABS products from table extraction that are not in the catalog yet
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
print("ADDING NEW ABS PRODUCTS FROM TABLES")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_add_abs_products.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

print(f"\n📊 Loaded {len(specs_data)} products from table extraction")

# Get existing SKUs
existing_skus = {p.get('sku') for p in catalog if p.get('sku')}
print(f"📦 Catalog has {len(existing_skus)} existing SKUs")

# Find new products
new_products_data = [p for p in specs_data if p.get('sku') not in existing_skus]
print(f"\n🆕 Found {len(new_products_data)} new products to add")

# Get next product ID
next_id = max([int(p.get('id', '0').replace('P', '')) for p in catalog if p.get('id', '').replace('P', '').isdigit()] + [0]) + 1

stats = {
    'products_added': 0,
    'with_diameter': 0,
    'with_pressure': 0
}

print(f"\n⚡ Adding new products...")

for i, spec in enumerate(new_products_data):
    sku = spec.get('sku')
    if not sku:
        continue
    
    # Create product
    product = {
        'id': f'P{next_id + i}',
        'sku': sku,
        'name': f"{sku}",
        'catalog': 'abs-persluchtbuizen',
        'brand': None,
        'category': 'Pipes & Fittings',
        'description': f"ABS Persluchtbuis product {sku}",
        'price': None,
        'priceMode': 'request_quote',
        'inStock': None,
        'stock': {'status': 'unknown', 'quantity': None},
        'images': [],
        'image_paths': [],
        'imageUrl': None,
        'pdf_source': 'abs-persluchtbuizen.pdf',
        'source_pages': [spec.get('page_in_pdf')] if spec.get('page_in_pdf') else []
    }
    
    # Add diameter
    if 'diameter_mm' in spec:
        product['diameter_mm'] = spec['diameter_mm']
        product['diameter_source'] = 'table'
        stats['with_diameter'] += 1
        
        # Update name with diameter
        product['name'] = f"{sku} - {spec['diameter_mm']}mm"
    
    # Add pressure
    if 'pressure_max_bar' in spec:
        product['pressure_max_bar'] = spec['pressure_max_bar']
        stats['with_pressure'] += 1
    
    catalog.append(product)
    stats['products_added'] += 1
    
    if stats['products_added'] <= 20:
        diameter_str = f"{product.get('diameter_mm', 'N/A'):>3}"
        pressure_str = f"{product.get('pressure_max_bar', 'N/A'):>4}"
        print(f"   ✓ {sku:15} | ø {diameter_str} mm | 🔧 {pressure_str} bar | ID: {product['id']}")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 ADDITION STATISTICS:")
print(f"   New products added:        {stats['products_added']}")
print(f"   With diameter:             {stats['with_diameter']}")
print(f"   With pressure:             {stats['with_pressure']}")

# Final counts
abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
print(f"\n✅ VERIFICATION:")
print(f"   Total ABS products now:    {len(abs_products)}")
print(f"   Catalog total products:    {len(catalog)}")

# Show sample new products by type
print(f"\n📋 SAMPLE NEW PRODUCTS BY TYPE:")
new_products = [p for p in catalog if p['id'] in [f'P{next_id + j}' for j in range(min(10, stats['products_added']))]]
for p in new_products[:10]:
    diameter_str = f"{p.get('diameter_mm', 'N/A'):>3}"
    pressure_str = f"{p.get('pressure_max_bar', 'N/A'):>4}"
    print(f"   {p['sku']:15} | ø {diameter_str} mm | 🔧 {pressure_str} bar")

print(f"\n{'='*80}")
print("✅ NEW PRODUCTS ADDED!")
print("="*80)
