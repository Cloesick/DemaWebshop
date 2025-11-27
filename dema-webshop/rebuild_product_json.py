"""
Rebuild product JSON to match actual image files in the webshop
"""

import json
from pathlib import Path
from collections import defaultdict

PRODUCTS_FILE = Path('public/data/products_for_shop.json')
IMAGES_DIR = Path('public/product-images')

print("🔧 Rebuilding product JSON to match actual image files...\n")

# Step 1: Build index of all actual image files
print("📁 Scanning actual image files...")
image_index = defaultdict(list)

for catalog_dir in IMAGES_DIR.iterdir():
    if not catalog_dir.is_dir():
        continue
    
    catalog_name = catalog_dir.name.replace('.pdf', '')
    
    for img_file in catalog_dir.glob('*.webp'):
        image_index[catalog_name].append({
            'filename': img_file.name,
            'path': f"/product-images/{catalog_dir.name}/{img_file.name}"
        })

print(f"   Found {sum(len(v) for v in image_index.values())} .webp images across {len(image_index)} catalogs")

# Step 2: Load products
products = json.load(open(PRODUCTS_FILE))
print(f"\n📄 Loaded {len(products)} products")

# Step 3: Clear all image references
for p in products:
    if 'imageUrl' in p:
        del p['imageUrl']
    if 'image_paths' in p:
        del p['image_paths']
    if 'media' in p:
        del p['media']

# Step 4: Re-link images by catalog (assign all catalog images to all products in that catalog)
updated = 0

for product in products:
    catalog = product.get('catalog', '')
    
    if catalog in image_index and image_index[catalog]:
        # Get all images for this catalog
        catalog_images = image_index[catalog]
        
        # Assign to product
        media = []
        image_paths = []
        
        for idx, img_info in enumerate(sorted(catalog_images, key=lambda x: x['filename'])[:10]):  # Max 10 images per product
            media.append({
                'url': img_info['path'],
                'role': 'main' if idx == 0 else 'gallery',
                'type': 'image',
                'format': 'webp'
            })
            image_paths.append(img_info['path'])
        
        product['media'] = media
        product['image_paths'] = image_paths
        product['imageUrl'] = media[0]['url']
        updated += 1

print(f"\n✅ Updated {updated} products with images")

# Save
with PRODUCTS_FILE.open('w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"   Saved to: {PRODUCTS_FILE}")

# Stats
with_images = len([p for p in products if p.get('imageUrl')])
print(f"\n📊 Final stats:")
print(f"   Products with images: {with_images}/{len(products)} ({with_images/len(products)*100:.1f}%)")
