import json
from pathlib import Path
from collections import defaultdict

products = json.load(open('public/data/products_for_shop.json'))
images_dir = Path('public/product-images')

# Get all available catalog folders
available_catalogs = set()
if images_dir.exists():
    for folder in images_dir.iterdir():
        if folder.is_dir():
            # Remove .pdf extension for comparison
            catalog_name = folder.name.replace('.pdf', '')
            available_catalogs.add(catalog_name)

print(f"📁 Available catalog folders: {len(available_catalogs)}")

# Check which products have images by catalog
by_catalog = defaultdict(lambda: {'total': 0, 'with_images': 0})

for p in products:
    catalog = p.get('catalog', '')
    by_catalog[catalog]['total'] += 1
    if p.get('imageUrl'):
        by_catalog[catalog]['with_images'] += 1

print(f"\n📊 Products by catalog:\n")
print(f"{'Catalog':<45} {'Total':>8} {'Images':>8} {'%':>6} {'Folder':>8}")
print("-" * 80)

for catalog in sorted(by_catalog.keys()):
    stats = by_catalog[catalog]
    total = stats['total']
    with_imgs = stats['with_images']
    pct = (with_imgs / total * 100) if total > 0 else 0
    has_folder = '✅' if catalog in available_catalogs else '❌'
    
    print(f"{catalog:<45} {total:>8} {with_imgs:>8} {pct:>5.1f}% {has_folder:>8}")

print("\n❌ Catalogs without image folders:")
missing = [c for c in by_catalog.keys() if c not in available_catalogs]
for c in missing:
    print(f"   - {c} ({by_catalog[c]['total']} products)")
