import json
from pathlib import Path

products = json.load(open('public/data/products_for_shop.json'))

with_images = [p for p in products if p.get('imageUrl')]

print(f"Checking {len(with_images)} products with images...\n")

# Check first 50
missing = []
existing = []

for p in with_images[:100]:
    url = p.get('imageUrl')
    if url:
        file_path = Path('public') / url.lstrip('/')
        if file_path.exists():
            existing.append(p['sku'])
        else:
            missing.append({
                'sku': p['sku'],
                'url': url,
                'catalog': p.get('catalog')
            })

print(f"✅ Files exist: {len(existing)}")
print(f"❌ Files missing: {len(missing)}")

if missing:
    print(f"\nSample missing files:")
    for item in missing[:10]:
        print(f"  {item['sku']}: {item['url']}")
        
        # Check if a .webp version exists with different name
        catalog = item['url'].split('/')[2] if '/' in item['url'] else ''
        if catalog:
            catalog_dir = Path('public/product-images') / catalog
            if catalog_dir.exists():
                webp_files = list(catalog_dir.glob('*.webp'))
                print(f"    Catalog has {len(webp_files)} .webp files")
