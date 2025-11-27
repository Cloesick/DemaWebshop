"""
Relink products to actual existing image files
"""

import json
from pathlib import Path
from collections import defaultdict

PRODUCTS_FILE = Path('public/data/products_for_shop.json')
IMAGES_DIR = Path('public/product-images')

print("🔧 Relinking products to actual image files...\n")

# Step 1: Build index of actual files by catalog
print("📁 Indexing actual image files...")
catalog_images = defaultdict(list)

for catalog_dir in IMAGES_DIR.iterdir():
    if not catalog_dir.is_dir():
        continue
    
    catalog_name = catalog_dir.name.replace('.pdf', '')
    
    # Get all .webp files
    for img_file in sorted(catalog_dir.glob('*.webp')):
        catalog_images[catalog_name].append({
            'filename': img_file.name,
            'url': f"/product-images/{catalog_dir.name}/{img_file.name}"
        })

total_images = sum(len(v) for v in catalog_images.values())
print(f"   Found {total_images} .webp images across {len(catalog_images)} catalogs")

# Step 2: Load products
products = json.load(open(PRODUCTS_FILE))
print(f"\n📄 Loaded {len(products)} products")

# Step 3: Group products by catalog
products_by_catalog = defaultdict(list)
for p in products:
    catalog = p.get('catalog', '')
    if catalog:
        products_by_catalog[catalog].append(p)

# Step 4: Distribute images to products within each catalog
updated = 0
images_per_product = 3  # Default number of images per product

for catalog, catalog_products in products_by_catalog.items():
    if catalog not in catalog_images or not catalog_images[catalog]:
        continue
    
    available_images = catalog_images[catalog]
    total_products = len(catalog_products)
    
    # Calculate how many images each product can get
    images_to_distribute = len(available_images)
    if total_products > 0:
        images_per_product = max(1, images_to_distribute // total_products)
    
    # Distribute images evenly
    img_index = 0
    for product in catalog_products:
        # Assign images to this product
        product_images = []
        for _ in range(min(images_per_product, len(available_images) - img_index)):
            if img_index < len(available_images):
                product_images.append(available_images[img_index])
                img_index += 1
        
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

print(f"\n✅ Updated {updated} products with images")

# Save
print(f"\n💾 Saving updated JSON...")
with PRODUCTS_FILE.open('w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"   Saved to: {PRODUCTS_FILE}")

# Stats
with_images = len([p for p in products if p.get('imageUrl')])
print(f"\n📊 Final stats:")
print(f"   Products with images: {with_images}/{len(products)} ({with_images/len(products)*100:.1f}%)")

# Show samples per catalog
print(f"\n📋 Sample by catalog:")
for catalog in sorted(catalog_images.keys())[:10]:
    catalog_prods = [p for p in products if p.get('catalog') == catalog and p.get('imageUrl')]
    if catalog_prods:
        print(f"   {catalog}: {len(catalog_prods)} products with images")
