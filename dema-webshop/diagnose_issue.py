import json
from pathlib import Path

products = json.load(open('public/data/products_for_shop.json'))

print("🔍 Diagnosing image issues...\n")

# Check the failing SKUs from the browser
failing_skus = ['0-10', '0-14', '0-15', '0-1300', '0-1400', '0-13600', '0-1800', '0-2000']

print(f"📋 Checking failing SKUs:\n")

for sku in failing_skus:
    product = next((p for p in products if p['sku'] == sku), None)
    if product:
        has_image = bool(product.get('imageUrl'))
        print(f"  {sku}:")
        print(f"    Has imageUrl: {has_image}")
        if has_image:
            print(f"    URL: {product['imageUrl']}")
            # Check if file exists
            file_path = Path('public') / product['imageUrl'].lstrip('/')
            exists = file_path.exists()
            print(f"    File exists: {exists}")
        else:
            print(f"    Catalog: {product.get('catalog')}")
            # Check if catalog has any images
            catalog = product.get('catalog')
            if catalog:
                catalog_dir = Path('public/product-images') / f"{catalog}.pdf"
                if catalog_dir.exists():
                    webp_count = len(list(catalog_dir.glob('*.webp')))
                    print(f"    Catalog has {webp_count} .webp files available")
    else:
        print(f"  {sku}: NOT FOUND in JSON")
    print()

# Overall stats
with_images = len([p for p in products if p.get('imageUrl')])
print(f"\n📊 Overall stats:")
print(f"   Total products: {len(products)}")
print(f"   With imageUrl: {with_images} ({with_images/len(products)*100:.1f}%)")
