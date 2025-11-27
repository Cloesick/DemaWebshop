"""
Simple fix: Find actual image files and update URLs
"""

import json
from pathlib import Path

PRODUCTS_JSON = Path("public/data/products_for_shop.json")
IMAGES_DIR = Path("public/product-images")

print("🔍 Building image index...")

# Build index of all available images
image_index = {}  # filename -> full_path
for catalog_dir in IMAGES_DIR.iterdir():
    if not catalog_dir.is_dir():
        continue
    
    for img_file in catalog_dir.glob("*.webp"):
        filename = img_file.name
        relative_path = img_file.relative_to(Path("public"))
        url = f"/{relative_path.as_posix()}"
        image_index[filename] = url

print(f"   Indexed {len(image_index)} images")

# Load products
print("\n🔧 Fixing product URLs...")
with PRODUCTS_JSON.open("r", encoding="utf-8") as f:
    products = json.load(f)

fixed = 0
missing = 0

for product in products:
    # Fix media array
    if product.get("media"):
        for media_item in product["media"]:
            url = media_item.get("url", "")
            
            # Extract filename
            if "/" in url:
                filename = url.split("/")[-1]
                
                # Look up correct URL
                if filename in image_index:
                    correct_url = image_index[filename]
                    if url != correct_url:
                        media_item["url"] = correct_url
                        fixed += 1
                else:
                    missing += 1
    
    # Fix image_paths
    if product.get("image_paths"):
        new_paths = []
        for path in product["image_paths"]:
            if "/" in path:
                filename = path.split("/")[-1]
                if filename in image_index:
                    new_paths.append(image_index[filename])
                else:
                    new_paths.append(path)
            else:
                new_paths.append(path)
        product["image_paths"] = new_paths
    
    # Fix imageUrl
    if product.get("imageUrl"):
        url = product["imageUrl"]
        if "/" in url:
            filename = url.split("/")[-1]
            if filename in image_index:
                product["imageUrl"] = image_index[filename]

# Save
with PRODUCTS_JSON.open("w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"\n✅ Done!")
print(f"   Fixed: {fixed} URLs")
print(f"   Missing files: {missing}")

# Show sample
with PRODUCTS_JSON.open("r", encoding="utf-8") as f:
    products = json.load(f)
    
sample = next((p for p in products if p.get("media")), None)
if sample:
    print(f"\n📋 Sample:")
    print(f"   SKU: {sample['sku']}")
    print(f"   Image: {sample['media'][0]['url']}")
