import json

products = json.load(open('public/data/products_for_shop.json'))

# Find products from abs-persluchtbuizen catalog
abs_products = [p for p in products if p.get('catalog') == 'abs-persluchtbuizen']
print(f"Total abs-persluchtbuizen products: {len(abs_products)}")

with_images = [p for p in abs_products if p.get('imageUrl')]
print(f"With imageUrl: {len(with_images)}")

if with_images:
    print(f"\nSample:")
    p = with_images[0]
    print(f"  SKU: {p['sku']}")
    print(f"  ImageUrl: {p.get('imageUrl')}")
else:
    print("\n❌ No abs-persluchtbuizen products have images!")
    print(f"Sample SKU: {abs_products[0]['sku'] if abs_products else 'None'}")
