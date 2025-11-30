import json

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find products with PDF sources
pdf_products = [p for p in products if p.get('pdf_source')]

print(f"Total products with pdf_source: {len(pdf_products)}")
print()

# Check first few samples
for i, product in enumerate(pdf_products[:5]):
    print(f"Product {i+1}:")
    print(f"  SKU: {product.get('sku')}")
    print(f"  pdf_source: {product.get('pdf_source')}")
    print(f"  source_pages: {product.get('source_pages')}")
    print(f"  pages: {product.get('pages')}")
    print(f"  Has 'source_pages' key: {'source_pages' in product}")
    print(f"  Has 'pages' key: {'pages' in product}")
    print()

# Count which property is used
source_pages_count = sum(1 for p in pdf_products if 'source_pages' in p and p.get('source_pages'))
pages_count = sum(1 for p in pdf_products if 'pages' in p and p.get('pages'))

print(f"\nSummary:")
print(f"  Products with 'source_pages': {source_pages_count}")
print(f"  Products with 'pages': {pages_count}")
