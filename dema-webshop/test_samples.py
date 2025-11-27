import json
from pathlib import Path

products = json.load(open('public/data/products_for_shop.json'))
samples = [p for p in products if p.get('imageUrl')][:10]

print("Testing sample products:\n")

all_exist = True
for p in samples:
    url = p['imageUrl']
    file_path = Path('public') / url.lstrip('/')
    exists = file_path.exists()
    status = '✅' if exists else '❌'
    print(f"{status} {p['sku']}: {exists}")
    if not exists:
        all_exist = False
        print(f"   Expected: {file_path}")

print(f"\n{'✅ All files exist!' if all_exist else '❌ Some files missing'}")
