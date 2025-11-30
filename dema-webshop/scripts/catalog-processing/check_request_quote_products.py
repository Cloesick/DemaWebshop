"""
Check which products have request_quote priceMode
"""
import json
from pathlib import Path

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 100)
print("CHECKING REQUEST QUOTE PRODUCTS")
print("=" * 100)

# Count by priceMode
with_request_quote = [p for p in catalog if p.get('priceMode') == 'request_quote']
with_price = [p for p in catalog if p.get('price')]
no_price_no_mode = [p for p in catalog if not p.get('price') and not p.get('priceMode')]

print(f"\nTotal products: {len(catalog)}")
print(f"With 'request_quote' priceMode: {len(with_request_quote)}")
print(f"With price: {len(with_price)}")
print(f"No price, no priceMode: {len(no_price_no_mode)}")

print(f"\n📊 Breakdown by catalog:")

catalogs = {}
for product in catalog:
    cat = product.get('catalog', 'unknown')
    if cat not in catalogs:
        catalogs[cat] = {'total': 0, 'request_quote': 0, 'has_price': 0}
    
    catalogs[cat]['total'] += 1
    if product.get('priceMode') == 'request_quote':
        catalogs[cat]['request_quote'] += 1
    if product.get('price'):
        catalogs[cat]['has_price'] += 1

for cat_name, stats in sorted(catalogs.items()):
    print(f"\n{cat_name}:")
    print(f"  Total: {stats['total']}")
    print(f"  Request Quote: {stats['request_quote']}")
    print(f"  Has Price: {stats['has_price']}")
    should_have_quote = stats['total'] - stats['has_price']
    if stats['request_quote'] < should_have_quote:
        print(f"  ⚠️ Missing request_quote on {should_have_quote - stats['request_quote']} products!")

print("\n" + "=" * 100)
