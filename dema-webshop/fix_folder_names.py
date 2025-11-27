"""
Fix image folder names for zuigerpompen and zwarte-draad-en-lasfittingen
"""

import json
from pathlib import Path

products_file = Path('public/data/products_for_shop.json')
images_dir = Path('public/product-images')

print("🔧 Fixing image folder references...")

products = json.load(open(products_file))

fixed = 0
newly_linked = 0

for product in products:
    catalog = product.get('catalog', '')
    
    # Check if this is one of the affected catalogs
    if catalog not in ['zuigerpompen', 'zwarte-draad-en-lasfittingen']:
        continue
    
    # Check if product already has images
    if product.get('imageUrl'):
        fixed += 1
        continue
    
    # Try to find images in the correct folder
    catalog_folder = images_dir / f"{catalog}.pdf"
    if not catalog_folder.exists():
        continue
    
    # Get page numbers from product
    source_pages = product.get('source_pages', [])
    if not source_pages:
        # Try getting from source dict
        if product.get('source') and product['source'].get('pages'):
            source_pages = product['source']['pages']
    
    if not source_pages:
        continue
    
    # Find images for this product's pages
    images = []
    for page_num in source_pages:
        # Look for images on this page
        page_images = list(catalog_folder.glob(f"*_p{page_num:03d}_img*.webp"))
        images.extend(page_images)
    
    if images:
        # Update product with images
        media = []
        image_paths = []
        
        for idx, img_path in enumerate(sorted(images, key=lambda p: p.name)):
            url = f"/product-images/{catalog}.pdf/{img_path.name}"
            media.append({
                "url": url,
                "role": "main" if idx == 0 else "gallery",
                "type": "image",
                "format": "webp"
            })
            image_paths.append(url)
        
        product['media'] = media
        product['image_paths'] = image_paths
        product['imageUrl'] = media[0]['url']
        newly_linked += 1

# Save
with products_file.open('w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"\n✅ Done!")
print(f"   Already had images: {fixed}")
print(f"   Newly linked: {newly_linked}")

# Verify
products = json.load(open(products_file))
zuiger_with = len([p for p in products if p.get('catalog') == 'zuigerpompen' and p.get('imageUrl')])
zwarte_with = len([p for p in products if p.get('catalog') == 'zwarte-draad-en-lasfittingen' and p.get('imageUrl')])

print(f"\n📊 Results:")
print(f"   zuigerpompen: {zuiger_with}/30 with images")
print(f"   zwarte-draad-en-lasfittingen: {zwarte_with}/307 with images")
