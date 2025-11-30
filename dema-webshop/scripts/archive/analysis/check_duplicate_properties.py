"""
Check for duplicate properties per SKU in catalog
"""
import json
from pathlib import Path
from collections import defaultdict

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("CHECKING FOR DUPLICATE PROPERTIES")
print("=" * 80)

# Check for duplicate SKUs first
sku_counts = defaultdict(int)
for product in catalog:
    sku = product.get('sku')
    if sku:
        sku_counts[sku] += 1

duplicate_skus = {sku: count for sku, count in sku_counts.items() if count > 1}

if duplicate_skus:
    print(f"\n❌ FOUND {len(duplicate_skus)} DUPLICATE SKUs:")
    for sku, count in list(duplicate_skus.items())[:10]:
        print(f"   {sku}: appears {count} times")
else:
    print("\n✅ No duplicate SKUs found")

# Check for duplicate/conflicting properties within each product
print("\n" + "=" * 80)
print("CHECKING FOR CONFLICTING PROPERTY PAIRS")
print("=" * 80)

# Common property conflicts to check
property_pairs = [
    ('diameter_mm', ['inner_diameter_mm', 'outer_diameter_mm']),
    ('pressure_max_bar', ['pressure_work_bar', 'pressure_height_m']),
    ('weight_kg', ['weight_kg_per_m', 'weight_g_per_m']),
    ('flow_l_min', ['flow_m3_per_h']),
]

conflicts_found = defaultdict(int)
sample_conflicts = defaultdict(list)

for product in catalog:
    sku = product.get('sku')
    
    for main_prop, related_props in property_pairs:
        if main_prop in product and product.get(main_prop):
            for related in related_props:
                if related in product and product.get(related):
                    # Check if both exist - this is OK for some pairs
                    conflict_key = f"{main_prop} + {related}"
                    conflicts_found[conflict_key] += 1
                    if len(sample_conflicts[conflict_key]) < 3:
                        sample_conflicts[conflict_key].append({
                            'sku': sku,
                            main_prop: product[main_prop],
                            related: product[related]
                        })

print("\nProperty Co-existence (not necessarily conflicts):")
for conflict, count in conflicts_found.items():
    print(f"\n{conflict}: {count} products")
    if sample_conflicts[conflict]:
        print("  Sample products:")
        for sample in sample_conflicts[conflict][:2]:
            print(f"    {sample}")

# Check for duplicate property values (redundant data)
print("\n" + "=" * 80)
print("CHECKING FOR REDUNDANT PROPERTY PAIRS")
print("=" * 80)

# Check if diameter_mm is redundant when inner/outer exist
redundant_diameter = []
for product in catalog:
    sku = product.get('sku')
    if (product.get('diameter_mm') and 
        (product.get('inner_diameter_mm') or product.get('outer_diameter_mm'))):
        # Check if diameter_mm matches either inner or outer
        diam = product.get('diameter_mm')
        inner = product.get('inner_diameter_mm')
        outer = product.get('outer_diameter_mm')
        
        if diam == inner or diam == outer:
            redundant_diameter.append({
                'sku': sku,
                'diameter_mm': diam,
                'inner_diameter_mm': inner,
                'outer_diameter_mm': outer
            })

if redundant_diameter:
    print(f"\n⚠️  Found {len(redundant_diameter)} products with redundant diameter_mm")
    print("   (diameter_mm matches inner_diameter_mm or outer_diameter_mm)")
    for sample in redundant_diameter[:5]:
        print(f"   {sample}")
else:
    print("\n✅ No redundant diameter properties found")

# Check for similar properties with different names
print("\n" + "=" * 80)
print("CHECKING FOR SIMILAR PROPERTIES WITH DIFFERENT NAMES")
print("=" * 80)

similar_props = []
for product in catalog:
    sku = product.get('sku')
    props = set(product.keys())
    
    # Check for similar names
    if 'work_pressure_bar' in props and 'pressure_work_bar' in props:
        similar_props.append({'sku': sku, 'issue': 'work_pressure_bar vs pressure_work_bar'})
    
    if 'rupture_pressure_bar' in props and 'pressure_burst_bar' in props:
        similar_props.append({'sku': sku, 'issue': 'rupture_pressure_bar vs pressure_burst_bar'})
    
    if 'weight_g_per_m' in props and 'weight_kg_per_m' in props and 'weight_kg' in props:
        similar_props.append({'sku': sku, 'issue': 'multiple weight properties'})

if similar_props:
    print(f"\n⚠️  Found {len(similar_props)} products with similar property names:")
    for sample in similar_props[:10]:
        print(f"   {sample}")
else:
    print("\n✅ No similar property name conflicts found")

# Summary
print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"Total products:                    {len(catalog)}")
print(f"Duplicate SKUs:                    {len(duplicate_skus)}")
print(f"Redundant diameter properties:     {len(redundant_diameter)}")
print(f"Similar property name conflicts:   {len(similar_props)}")

if duplicate_skus or redundant_diameter or similar_props:
    print("\n⚠️  CLEANUP RECOMMENDED")
else:
    print("\n✅ CATALOG IS CLEAN")

print("=" * 80)
