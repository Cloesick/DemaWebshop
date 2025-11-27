import json
from pathlib import Path

products = json.load(open('public/data/products_for_shop.json'))

# Check abs-persluchtbuizen products
abs_products = [p for p in products if p.get('catalog') == 'abs-persluchtbuizen' and p.get('imageUrl')]

print(f"abs-persluchtbuizen products with images: {len(abs_products)}")

if abs_products:
    for p in abs_products[:5]:
        img_url = p['imageUrl']
        img_path = Path('public') / img_url.lstrip('/')
        exists = img_path.exists()
        status = '✅' if exists else '❌'
        print(f"{status} {p['sku']}: {exists}")

# Check zuigerpompen
zuiger_products = [p for p in products if p.get('catalog') == 'zuigerpompen']
zuiger_with_imgs = [p for p in zuiger_products if p.get('imageUrl')]
print(f"\nzuigerpompen: {len(zuiger_with_imgs)}/{len(zuiger_products)} with images")

# Check zwarte-draad
zwarte_products = [p for p in products if p.get('catalog') == 'zwarte-draad-en-lasfittingen']
zwarte_with_imgs = [p for p in zwarte_products if p.get('imageUrl')]
print(f"zwarte-draad-en-lasfittingen: {len(zwarte_with_imgs)}/{len(zwarte_products)} with images")

print(f"\n📊 Total improvement:")
print(f"   Before: 8,598 products with images (49.8%)")
print(f"   After: {len([p for p in products if p.get('imageUrl')])} products with images")
