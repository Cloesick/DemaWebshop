"""Check aandrijftechniek product data"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

aandrijf = [p for p in catalog if 'aandrijftechniek' in str(p.get('catalog', '')).lower()]

print(f"Found {len(aandrijf)} aandrijftechniek products")
print("\nSample product keys:")
if aandrijf:
    print(json.dumps(aandrijf[0], indent=2, ensure_ascii=False)[:800])
