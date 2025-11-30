"""
Simple merge - just copy products_ready_for_webshop.json to catalog_products_enriched.json
since it already has the correct structure
"""
import json
import shutil
from pathlib import Path

# Source file (from PDF analyzer)
source = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/products_ready_for_webshop.json')

# Destination (in webshop)
dest = Path('src/data/catalog_products_enriched.json')

print(f"Copying {source} to {dest}...")

try:
    # Load source
    with open(source, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Loaded {len(data)} products")
    
    # Save to destination
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Successfully saved {len(data)} products to {dest}")
    print("\nSample product:")
    if data:
        sample = data[0]
        print(f"  SKU: {sample.get('sku')}")
        print(f"  Name: {sample.get('name')}")
        print(f"  Catalog: {sample.get('catalog')}")
        print(f"  Has images: {len(sample.get('image_paths', []))} images")
    
except Exception as e:
    print(f"Error: {e}")
