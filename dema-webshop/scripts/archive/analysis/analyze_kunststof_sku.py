import json
import re

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find products from kunststof-afvoerleidingen
kunststof_products = [p for p in products if p.get('catalog') == 'kunststof-afvoerleidingen']

print(f"Found {len(kunststof_products)} products in kunststof-afvoerleidingen catalog")
print()

# Sample first 30 SKUs to understand patterns
print("First 30 SKUs:")
print("-" * 60)
for i, product in enumerate(kunststof_products[:30]):
    sku = product.get('sku', '')
    print(f"{i+1:3}. {sku:20} (Length: {len(sku)})")

print()
print("-" * 60)
print("SKU Pattern Analysis:")
print("-" * 60)

# Analyze patterns
patterns = {}
for product in kunststof_products:
    sku = product.get('sku', '')
    
    # Identify pattern
    pattern = "Unknown"
    
    if re.match(r'^[A-Z]{2}\d{4}$', sku):
        pattern = "2 letters + 4 digits (AB0322)"
    elif re.match(r'^[A-Z]{2}\d{6}$', sku):
        pattern = "2 letters + 6 digits"
    elif re.match(r'^T\d{6}$', sku):
        pattern = "T + 6 digits (T032903)"
    elif re.match(r'^TO\d{5}$', sku):
        pattern = "TO + 5 digits (TO32903)"
    elif re.match(r'^T\d{5}$', sku):
        pattern = "T + 5 digits"
    elif re.match(r'^[A-Z]{2}\d{3}$', sku):
        pattern = "2 letters + 3 digits"
    elif re.match(r'^[A-Z]{2}\d{5}$', sku):
        pattern = "2 letters + 5 digits"
    
    if pattern not in patterns:
        patterns[pattern] = []
    patterns[pattern].append(sku)

for pattern, skus in sorted(patterns.items(), key=lambda x: -len(x[1])):
    print(f"{pattern:35} : {len(skus):4} products")
    print(f"   Examples: {', '.join(skus[:5])}")
    print()
