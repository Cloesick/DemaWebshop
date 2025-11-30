import json

print("Checking airpress product data...")
print()

# Load products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find airpress products
airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']

print(f"Total airpress products: {len(airpress_products)}")
print()

# Check how many have the new properties
properties_to_check = [
    'product_code',
    'intake_l_min',
    'outtake_l_min',
    'piston_count',
    'noise_db',
    'frequency_hz',
    'phase',
    'dimensions_mm',
    'pressure_min_bar'
]

print("Property coverage:")
print("-" * 80)
for prop in properties_to_check:
    count = sum(1 for p in airpress_products if p.get(prop) is not None)
    percentage = (count / len(airpress_products)) * 100
    print(f"{prop:20} : {count:4} / {len(airpress_products):4} ({percentage:5.1f}%)")

print()

# Show 10 sample products
print("Sample products (first 10):")
print("=" * 80)
for i, product in enumerate(airpress_products[:10]):
    print(f"\n{i+1}. SKU: {product['sku']}")
    print(f"   Has product_code: {product.get('product_code', 'NO')}")
    print(f"   Has intake_l_min: {product.get('intake_l_min', 'NO')}")
    print(f"   Has outtake_l_min: {product.get('outtake_l_min', 'NO')}")
    print(f"   Has pressure_min_bar: {product.get('pressure_min_bar', 'NO')}")
    print(f"   Has noise_db: {product.get('noise_db', 'NO')}")
