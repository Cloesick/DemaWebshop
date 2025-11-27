import json
from pathlib import Path

products = json.load(open('public/data/products_for_shop.json'))

with_images = [p for p in products if p.get('imageUrl')]
print(f"Products with imageUrl: {len(with_images)}")

# Check first 20
checked = 0
exists = 0
missing = 0
missing_samples = []

for p in with_images[:100]:
    img_url = p.get('imageUrl')
    if img_url:
        img_path = Path('public') / img_url.lstrip('/')
        checked += 1
        if img_path.exists():
            exists += 1
        else:
            missing += 1
            if len(missing_samples) < 5:
                missing_samples.append({
                    'sku': p['sku'],
                    'url': img_url,
                    'catalog': p.get('catalog')
                })

print(f"\nChecked {checked} products:")
print(f"  ✅ Files exist: {exists}")
print(f"  ❌ Files missing: {missing}")

if missing_samples:
    print(f"\n❌ Sample missing files:")
    for s in missing_samples:
        print(f"   SKU: {s['sku']}, Catalog: {s['catalog']}")
        print(f"   URL: {s['url']}")
        print()
