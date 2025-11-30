"""
Check Makita BL40XX series products and their images
"""
import json
from pathlib import Path

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("CHECKING MAKITA BL40XX SERIES PRODUCTS")
print("=" * 80)

# Find Makita BL40XX products
makita_bl40 = [p for p in catalog if 'BL40' in p.get('sku', '').upper()]

print(f"\nFound {len(makita_bl40)} Makita BL40XX products\n")

for product in makita_bl40:
    sku = product.get('sku')
    catalog_name = product.get('catalog')
    
    print(f"\nSKU: {sku}")
    print(f"Catalog: {catalog_name}")
    print(f"Name: {product.get('name', 'N/A')}")
    
    # Check images
    image_url = product.get('imageUrl')
    images = product.get('images', [])
    image_paths = product.get('image_paths', [])
    media = product.get('media', [])
    
    print(f"\nImage Information:")
    print(f"  imageUrl: {image_url}")
    print(f"  images count: {len(images)}")
    print(f"  image_paths count: {len(image_paths)}")
    print(f"  media count: {len(media)}")
    
    if image_paths:
        print(f"  image_paths:")
        for path in image_paths:
            print(f"    - {path}")
    
    if media:
        print(f"  media:")
        for m in media:
            print(f"    - {m}")
    
    # Check if image exists
    if image_url:
        image_file = Path(__file__).parent.parent / 'public' / image_url.lstrip('/')
        if image_file.exists():
            print(f"  ✅ Image file exists: {image_file}")
        else:
            print(f"  ❌ Image file NOT found: {image_file}")
    else:
        print(f"  ⚠️  No imageUrl set")
    
    print("-" * 80)

# Check all Makita products for image pattern
print("\n" + "=" * 80)
print("ALL MAKITA PRODUCTS IMAGE CHECK")
print("=" * 80)

makita_catalogs = ['makita-catalogus-2022-nl', 'makita-tuinfolder-2022-nl']
for cat in makita_catalogs:
    products = [p for p in catalog if p.get('catalog') == cat]
    print(f"\n{cat}: {len(products)} products")
    
    with_images = sum(1 for p in products if p.get('imageUrl'))
    without_images = sum(1 for p in products if not p.get('imageUrl'))
    
    print(f"  With images: {with_images}")
    print(f"  Without images: {without_images}")
    
    # Sample product
    if products:
        sample = products[0]
        print(f"\n  Sample SKU: {sample.get('sku')}")
        print(f"    imageUrl: {sample.get('imageUrl', 'N/A')}")
        if sample.get('image_paths'):
            print(f"    image_paths: {sample['image_paths'][:2]}")
