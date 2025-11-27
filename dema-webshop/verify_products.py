import json
from pathlib import Path

products_file = Path("public/data/products_for_shop.json")
products = json.load(open(products_file))

print(f"Total products: {len(products)}")

# Find products with good data
with_images = [p for p in products if p.get('media')]
print(f"With images: {len(with_images)} ({len(with_images)/len(products)*100:.1f}%)")

# Show samples
print("\n=== SAMPLE PRODUCTS ===\n")
samples = [p for p in products if p.get('media')][:5]

for p in samples:
    print(f"SKU: {p['sku']}")
    print(f"Name: {p['name']}")
    print(f"Category: {p['product_category']}")
    print(f"Brand: {p.get('brand', 'N/A')}")
    print(f"Images: {len(p['media'])}")
    print(f"Price: {p.get('price') or 'Request Quote'}")
    print(f"PDF: {p['pdf_source']} (pages: {p['source_pages']})")
    print(f"Image URL: {p['media'][0]['url'][:80]}...")
    print()
