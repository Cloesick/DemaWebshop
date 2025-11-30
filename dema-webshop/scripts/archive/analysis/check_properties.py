"""
Check what properties are available in the enriched catalog
"""
import json
from collections import defaultdict

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

print("=" * 80)
print("CATALOG PRODUCT PROPERTIES ANALYSIS")
print("=" * 80)

# Collect all unique keys
all_keys = set()
key_counts = defaultdict(int)

for product in products:
    for key in product.keys():
        all_keys.add(key)
        if product[key] is not None and product[key] != '' and product[key] != [] and product[key] != {}:
            key_counts[key] += 1

# Print statistics
print(f"\nTotal products: {len(products)}")
print(f"Total unique properties: {len(all_keys)}")

print("\n" + "=" * 80)
print("PROPERTY COVERAGE (Top 30)")
print("=" * 80)

sorted_keys = sorted(key_counts.items(), key=lambda x: x[1], reverse=True)[:30]
for key, count in sorted_keys:
    pct = count / len(products) * 100
    print(f"  {key:30} {count:6} products ({pct:5.1f}%)")

# Show sample enriched product
print("\n" + "=" * 80)
print("SAMPLE ENRICHED PRODUCT WITH MOST PROPERTIES")
print("=" * 80)

# Find product with most properties
richest_product = max(products, key=lambda p: len([v for v in p.values() if v not in [None, '', [], {}]]))

print(f"\nSKU: {richest_product.get('sku')}")
print(f"Name: {richest_product.get('name', 'N/A')[:60]}")
print(f"\nAll properties:")
for key, value in richest_product.items():
    if value not in [None, '', [], {}]:
        if isinstance(value, (list, dict)):
            print(f"  {key:30} {type(value).__name__} with {len(value)} items")
        else:
            val_str = str(value)[:50]
            print(f"  {key:30} {val_str}")

# Check for technical spec coverage
print("\n" + "=" * 80)
print("TECHNICAL SPECIFICATIONS COVERAGE")
print("=" * 80)

tech_fields = [
    'power_kw', 'power_kw_derived', 'power_hp',
    'voltage_v', 'pressure_max_bar', 'pressure_min_bar',
    'weight_kg', 'volume_l', 'length_m',
    'flow_l_min', 'flow_l_min_list', 'rpm',
    'connection_type', 'connection_types',
    'materials', 'size_inch', 'dimensions_mm_list',
    'product_type', 'product_category'
]

for field in tech_fields:
    count = sum(1 for p in products if p.get(field) not in [None, '', [], {}])
    pct = count / len(products) * 100 if count > 0 else 0
    print(f"  {field:30} {count:6} ({pct:5.1f}%)")

print("\n" + "=" * 80)
