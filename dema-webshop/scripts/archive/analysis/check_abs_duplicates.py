"""
Check ABS-persluchtbuizen products for duplicate properties
"""
import json
from pathlib import Path

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Filter ABS products
abs_products = [p for p in catalog if p.get('catalog') == 'abs-persluchtbuizen']

print("=" * 80)
print(f"CHECKING ABS-PERSLUCHTBUIZEN PRODUCTS ({len(abs_products)} total)")
print("=" * 80)

# Check first 10 products for all properties
print("\nFirst 10 products with ALL properties:\n")

for i, product in enumerate(abs_products[:10]):
    print(f"\n{i+1}. SKU: {product.get('sku')}")
    print("-" * 60)
    
    # Get all technical properties
    tech_props = {}
    skip_keys = ['id', 'sku', 'name', 'category', 'catalog', 'images', 
                 'imageUrl', 'image_paths', 'media', 'source', 'attributes',
                 'description', 'priceMode', 'stock', 'seo', 'pdf_source']
    
    for key, value in product.items():
        if key not in skip_keys and value:
            tech_props[key] = value
    
    # Print all properties
    for key in sorted(tech_props.keys()):
        value = tech_props[key]
        print(f"   {key:30} = {value}")
    
    # Check for potential duplicates
    duplicates = []
    
    # Check pressure duplicates
    if product.get('pressure_max_bar') and product.get('pressure_work_bar'):
        if product['pressure_max_bar'] == product['pressure_work_bar']:
            duplicates.append(f"pressure_max_bar == pressure_work_bar ({product['pressure_max_bar']})")
    
    # Check diameter duplicates
    if product.get('diameter_mm') and product.get('inner_diameter_mm'):
        if product['diameter_mm'] == product['inner_diameter_mm']:
            duplicates.append(f"diameter_mm == inner_diameter_mm ({product['diameter_mm']})")
    
    if product.get('diameter_mm') and product.get('outer_diameter_mm'):
        if product['diameter_mm'] == product['outer_diameter_mm']:
            duplicates.append(f"diameter_mm == outer_diameter_mm ({product['diameter_mm']})")
    
    # Check dimensions_mm_list duplicates
    if product.get('dimensions_mm_list'):
        dml = product['dimensions_mm_list']
        if isinstance(dml, list) and len(dml) >= 2:
            if len(set(dml)) == 1:
                duplicates.append(f"dimensions_mm_list has same value repeated: {dml}")
    
    if duplicates:
        print(f"\n   ⚠️  POTENTIAL DUPLICATES:")
        for dup in duplicates:
            print(f"      - {dup}")

# Summary of property usage
print("\n" + "=" * 80)
print("PROPERTY USAGE SUMMARY")
print("=" * 80)

property_counts = {}
for product in abs_products:
    for key in product.keys():
        if key not in ['id', 'sku', 'name', 'category', 'catalog', 'images', 
                       'imageUrl', 'image_paths', 'media', 'source', 'attributes',
                       'description', 'priceMode', 'stock', 'seo']:
            if product.get(key):
                property_counts[key] = property_counts.get(key, 0) + 1

print("\nProperty occurrence in ABS products:")
for prop, count in sorted(property_counts.items(), key=lambda x: -x[1]):
    percentage = (count / len(abs_products)) * 100
    print(f"   {prop:30} {count:4}/{len(abs_products):4} ({percentage:.1f}%)")
