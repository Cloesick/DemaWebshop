"""
Check for duplicate values across ALL catalogs
"""
import json
from pathlib import Path
from collections import defaultdict

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("CHECKING FOR DUPLICATES ACROSS ALL CATALOGS")
print("=" * 80)

# Check for products with duplicate property values across different catalogs
print("\n🔍 Checking for common duplicate patterns...")

catalogs = ['pomp-specials', 'plat-oprolbare-slangen', 'abs-persluchtbuizen', 
            'slangkoppelingen', 'catalogus-aandrijftechniek-150922']

duplicate_issues = []

for cat in catalogs:
    products = [p for p in catalog if p.get('catalog') == cat]
    if not products:
        continue
    
    print(f"\n{'='*80}")
    print(f"{cat.upper()} ({len(products)} products)")
    print(f"{'='*80}")
    
    # Check first 5 products for duplicates
    for i, product in enumerate(products[:5]):
        sku = product.get('sku')
        print(f"\n{i+1}. SKU: {sku}")
        
        # Get technical properties
        skip_keys = ['id', 'sku', 'name', 'category', 'catalog', 'images', 
                     'imageUrl', 'image_paths', 'media', 'source', 'attributes',
                     'description', 'priceMode', 'stock', 'seo', 'pdf_source']
        
        tech_props = {}
        for key, value in product.items():
            if key not in skip_keys and value:
                tech_props[key] = value
        
        # Check for potential duplicates
        duplicates = []
        
        # Pressure duplicates
        pressure_keys = [k for k in tech_props.keys() if 'pressure' in k]
        if len(pressure_keys) > 1:
            pressure_values = {k: tech_props[k] for k in pressure_keys}
            # Check if any have same value
            values = list(pressure_values.values())
            if len(values) != len(set(str(v) for v in values)):
                duplicates.append(f"Multiple pressure properties: {pressure_values}")
        
        # Diameter duplicates
        diameter_keys = [k for k in tech_props.keys() if 'diameter' in k]
        if len(diameter_keys) > 1:
            diameter_values = {k: tech_props[k] for k in diameter_keys}
            values = list(diameter_values.values())
            if len(values) != len(set(str(v) for v in values)):
                duplicates.append(f"Multiple diameter properties: {diameter_values}")
        
        # Weight duplicates
        weight_keys = [k for k in tech_props.keys() if 'weight' in k]
        if len(weight_keys) > 1:
            weight_values = {k: tech_props[k] for k in weight_keys}
            duplicates.append(f"Multiple weight properties: {weight_values}")
        
        # Flow duplicates (these are OK - different units)
        flow_keys = [k for k in tech_props.keys() if 'flow' in k]
        if len(flow_keys) > 1:
            flow_values = {k: tech_props[k] for k in flow_keys}
            # This is intentional (m³/h and L/min), mark as INFO
            pass
        
        if duplicates:
            print(f"   ⚠️  POTENTIAL DUPLICATES:")
            for dup in duplicates:
                print(f"      {dup}")
                duplicate_issues.append({'catalog': cat, 'sku': sku, 'issue': dup})
        else:
            # Show first few properties
            props_list = list(tech_props.items())[:5]
            for k, v in props_list:
                print(f"   {k}: {v}")

# Summary
print(f"\n{'='*80}")
print("SUMMARY")
print(f"{'='*80}")
print(f"Total potential duplicate issues found: {len(duplicate_issues)}")

if duplicate_issues:
    print("\nIssues by catalog:")
    by_catalog = defaultdict(int)
    for issue in duplicate_issues:
        by_catalog[issue['catalog']] += 1
    
    for cat, count in by_catalog.items():
        print(f"  {cat}: {count}")
