import json
from collections import defaultdict

print("Checking ALL available airpress properties...")
print()

# Load products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find airpress products
airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']

print(f"Total airpress products: {len(airpress_products)}")
print()

# Find ALL properties used
all_properties = set()
for product in airpress_products:
    for key in product.keys():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description', 'image_paths', 'media', 'imageUrl', 'attributes', 'source', 'priceMode', 'stock', 'category', 'id']:
            if product.get(key) is not None:
                all_properties.add(key)

print("All technical properties found:")
print("-" * 80)
for prop in sorted(all_properties):
    count = sum(1 for p in airpress_products if p.get(prop) is not None and p.get(prop) != '')
    percentage = (count / len(airpress_products)) * 100
    print(f"{prop:30} : {count:4} / {len(airpress_products):4} ({percentage:5.1f}%)")
    
print()
print("Properties with >90% coverage:")
print("-" * 80)
high_coverage = []
for prop in sorted(all_properties):
    count = sum(1 for p in airpress_products if p.get(prop) is not None and p.get(prop) != '')
    percentage = (count / len(airpress_products)) * 100
    if percentage > 90:
        high_coverage.append(prop)
        print(f"✅ {prop:30} : {percentage:5.1f}%")

print()
print("=" * 80)
print("RECOMMENDATION:")
print("=" * 80)
print("The frontend component should display these high-coverage properties first,")
print("and show the detailed properties (intake, outtake, etc.) when available.")
print()
print("Currently available for most products:")
for prop in high_coverage:
    print(f"  - {prop}")
