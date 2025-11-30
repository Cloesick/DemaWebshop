import json
from collections import defaultdict

print("=" * 100)
print("AIRPRESS PRODUCT ANALYSIS")
print("=" * 100)
print()

# Load existing products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find airpress products
airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']
print(f"Total airpress products: {len(airpress_products)}")
print()

# Analyze what properties are currently assigned
print("=" * 100)
print("CURRENT PROPERTY DISTRIBUTION")
print("=" * 100)
print()

property_stats = defaultdict(int)
property_examples = defaultdict(list)

for product in airpress_products:
    for key, value in product.items():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description']:
            if value:
                property_stats[key] += 1
                if len(property_examples[key]) < 5:
                    property_examples[key].append({
                        'sku': product['sku'],
                        'value': value
                    })

print("Properties found across all products:")
print("-" * 100)
for prop, count in sorted(property_stats.items(), key=lambda x: -x[1]):
    percentage = (count / len(airpress_products)) * 100
    print(f"{prop:30} : {count:4} products ({percentage:5.1f}%)")
    for ex in property_examples[prop][:3]:
        print(f"  → {ex['sku']:20} = {ex['value']}")
print()

# Check for products with duplicate values
print("=" * 100)
print("DUPLICATE VALUE ANALYSIS")
print("=" * 100)
print()

duplicates_found = []
products_with_duplicates = []

for product in airpress_products:
    seen_values = defaultdict(list)
    
    for key, value in product.items():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description']:
            if value is not None and value != '':
                value_str = str(value)
                seen_values[value_str].append(key)
    
    # Find duplicates in this product
    product_duplicates = []
    for value, keys in seen_values.items():
        if len(keys) > 1:
            product_duplicates.append({
                'value': value,
                'properties': keys
            })
    
    if product_duplicates:
        products_with_duplicates.append({
            'sku': product['sku'],
            'name': product.get('name', 'N/A'),
            'duplicates': product_duplicates
        })

if products_with_duplicates:
    print(f"Found {len(products_with_duplicates)} products with duplicate values:")
    print("-" * 100)
    for prod in products_with_duplicates[:30]:
        print(f"\nSKU: {prod['sku']}")
        print(f"Name: {prod['name']}")
        for dup in prod['duplicates']:
            print(f"  ⚠️  Value '{dup['value']}' in: {', '.join(dup['properties'])}")
    
    if len(products_with_duplicates) > 30:
        print(f"\n... and {len(products_with_duplicates) - 30} more products with duplicates")
else:
    print("✅ No duplicate values found!")

print()

# Sample products for inspection
print("=" * 100)
print("SAMPLE PRODUCTS (First 10)")
print("=" * 100)
print()

for i, product in enumerate(airpress_products[:10]):
    print(f"\n{i+1}. SKU: {product['sku']}")
    print(f"   Name: {product.get('name', 'N/A')}")
    print(f"   Properties:")
    for key, value in sorted(product.items()):
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description']:
            if value:
                print(f"     {key:25} = {value}")

print()
print("=" * 100)
print("ANALYSIS COMPLETE")
print("=" * 100)
