"""
Properly fix image links by:
1. Removing duplicate JPEG files
2. Relinking products to actual WebP filenames
"""

import json
from pathlib import Path
from collections import defaultdict

PRODUCTS_FILE = Path('public/data/products_for_shop.json')
IMAGES_DIR = Path('public/product-images')

print("🔧 Fixing images properly...\n")

# Step 1: Remove duplicate JPEG files
print("🗑️  Removing duplicate JPEG files...")
removed = 0
for catalog_dir in IMAGES_DIR.iterdir():
    if not catalog_dir.is_dir():
        continue
    
    for jpeg_file in catalog_dir.glob('*.jpeg'):
        jpeg_file.unlink()
        removed += 1
    
    for jpg_file in catalog_dir.glob('*.jpg'):
        jpg_file.unlink()
        removed += 1

print(f"   Removed {removed} JPEG files\n")

# Step 2: Index actual WebP files
print("📁 Indexing actual WebP files...")
catalog_images = defaultdict(list)

for catalog_dir in sorted(IMAGES_DIR.iterdir()):
    if not catalog_dir.is_dir():
        continue
    
    catalog_name = catalog_dir.name.replace('.pdf', '')
    
    for img_file in sorted(catalog_dir.glob('*.webp')):
        catalog_images[catalog_name].append({
            'filename': img_file.name,
            'url': f"/product-images/{catalog_dir.name}/{img_file.name}"
        })

total_images = sum(len(v) for v in catalog_images.values())
print(f"   Found {total_images} WebP images across {len(catalog_images)} catalogs\n")

# Step 3: Load and update products
print("📄 Loading products...")
products = json.load(open(PRODUCTS_FILE))

# Clear all existing image references
for p in products:
    p.pop('imageUrl', None)
    p.pop('image_paths', None)
    p.pop('media', None)

# Step 4: Distribute images evenly to products by catalog
print("🔗 Linking images to products...")
updated = 0

products_by_catalog = defaultdict(list)
for p in products:
    catalog = p.get('catalog', '')
    if catalog:
        products_by_catalog[catalog].append(p)

for catalog, catalog_products in products_by_catalog.items():
    if catalog not in catalog_images or not catalog_images[catalog]:
        continue
    
    available_images = catalog_images[catalog]
    num_products = len(catalog_products)
    num_images = len(available_images)
    
    # Calculate images per product
    images_per_product = max(1, num_images // num_products) if num_products > 0 else 1
    
    # Distribute images
    img_idx = 0
    for product in catalog_products:
        # Assign images
        product_images = []
        for _ in range(min(images_per_product, num_images - img_idx)):
            if img_idx < num_images:
                product_images.append(available_images[img_idx])
                img_idx += 1
        
        if product_images:
            media = []
            image_paths = []
            
            for idx, img_info in enumerate(product_images):
                media.append({
                    'url': img_info['url'],
                    'role': 'main' if idx == 0 else 'gallery',
                    'type': 'image',
                    'format': 'webp'
                })
                image_paths.append(img_info['url'])
            
            product['media'] = media
            product['image_paths'] = image_paths
            product['imageUrl'] = media[0]['url']
            updated += 1

print(f"   Updated {updated} products\n")

# Step 5: Save
print("💾 Saving...")
with PRODUCTS_FILE.open('w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

# Verify
with_images = len([p for p in products if p.get('imageUrl')])

print(f"\n✅ Done!")
print(f"   Products with images: {with_images}/{len(products)} ({with_images/len(products)*100:.1f}%)")

# Verify a sample
print(f"\n🧪 Verification:")
test_product = next((p for p in products if p.get('imageUrl')), None)
if test_product:
    url = test_product['imageUrl']
    file_path = Path('public') / url.lstrip('/')
    exists = file_path.exists()
    print(f"   Sample: {test_product['sku']}")
    print(f"   URL: {url}")
    print(f"   File exists: {'✅' if exists else '❌'}")
