"""
Fix image URLs in products JSON to include catalog folder
"""

import json
from pathlib import Path

PRODUCTS_JSON = Path("public/data/products_for_shop.json")
IMAGES_DIR = Path("public/product-images")

print("🔧 Fixing image URLs...")

# Load products
with PRODUCTS_JSON.open("r", encoding="utf-8") as f:
    products = json.load(f)

fixed = 0
already_correct = 0
not_found = 0

for product in products:
    catalog = product.get("catalog", "")
    
    # Fix media array
    if product.get("media"):
        for media_item in product["media"]:
            url = media_item.get("url", "")
            
            # Skip if already has catalog folder
            if f"/{catalog}.pdf/" in url:
                already_correct += 1
                continue
            
            # Extract filename from URL
            if url.startswith("/product-images/"):
                filename = url.split("/")[-1]
                
                # Construct new URL with catalog folder
                new_url = f"/product-images/{catalog}.pdf/{filename}"
                
                # Verify file exists
                file_path = Path("public") / new_url.lstrip("/")
                if file_path.exists():
                    media_item["url"] = new_url
                    fixed += 1
                else:
                    not_found += 1
    
    # Fix image_paths array
    if product.get("image_paths"):
        new_paths = []
        for path in product["image_paths"]:
            if f"/{catalog}.pdf/" in path:
                new_paths.append(path)
                continue
            
            if path.startswith("/product-images/"):
                filename = path.split("/")[-1]
                new_path = f"/product-images/{catalog}.pdf/{filename}"
                
                file_path = Path("public") / new_path.lstrip("/")
                if file_path.exists():
                    new_paths.append(new_path)
                else:
                    new_paths.append(path)  # Keep original if not found
            else:
                new_paths.append(path)
        
        product["image_paths"] = new_paths
    
    # Fix imageUrl
    if product.get("imageUrl"):
        url = product["imageUrl"]
        if f"/{catalog}.pdf/" not in url and url.startswith("/product-images/"):
            filename = url.split("/")[-1]
            new_url = f"/product-images/{catalog}.pdf/{filename}"
            
            file_path = Path("public") / new_url.lstrip("/")
            if file_path.exists():
                product["imageUrl"] = new_url

# Save fixed products
with PRODUCTS_JSON.open("w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"\n✅ Done!")
print(f"   Fixed: {fixed} image URLs")
print(f"   Already correct: {already_correct}")
print(f"   Not found: {not_found}")
print(f"\n📝 Updated: {PRODUCTS_JSON}")
