"""
Optimize JSON by removing indentation to reduce file size
"""

import json
from pathlib import Path

PRODUCTS_FILE = Path('public/data/products_for_shop.json')

print("📦 Optimizing JSON file size...\n")

# Load
products = json.load(open(PRODUCTS_FILE))
print(f"   Products: {len(products)}")

# Get original size
original_size = PRODUCTS_FILE.stat().st_size / 1024 / 1024
print(f"   Original size: {original_size:.1f} MB")

# Save without indentation (compact)
with PRODUCTS_FILE.open('w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, separators=(',', ':'))

# Get new size
new_size = PRODUCTS_FILE.stat().st_size / 1024 / 1024
print(f"   Optimized size: {new_size:.1f} MB")
print(f"   Saved: {original_size - new_size:.1f} MB ({(1 - new_size/original_size)*100:.1f}%)")

print(f"\n✅ JSON optimized!")
