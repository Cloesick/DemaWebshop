"""
Check current slangkoppelingen products
"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

slang_products = [p for p in catalog if 'slangkoppeling' in str(p.get('catalog', '')).lower()]

print("=" * 80)
print("SLANGKOPPELINGEN CURRENT STATE")
print("=" * 80)

print(f"\n📦 Found {len(slang_products)} slangkoppelingen products")

print(f"\n📋 SAMPLE PRODUCTS (first 20):")
for p in slang_products[:20]:
    sku = p.get('sku', 'N/A')
    diameter = p.get('diameter_mm', 'N/A')
    inner = p.get('inner_diameter_mm', 'N/A')
    outer = p.get('outer_diameter_mm', 'N/A')
    name = p.get('name', '')[:50]
    
    print(f"   {sku:20} | ø {str(diameter):6} | Inner: {str(inner):6} | Outer: {str(outer):6} | {name}")

print(f"\n📊 STATISTICS:")
with_diameter = len([p for p in slang_products if p.get('diameter_mm')])
with_inner = len([p for p in slang_products if p.get('inner_diameter_mm')])
with_outer = len([p for p in slang_products if p.get('outer_diameter_mm')])

print(f"   With diameter:        {with_diameter} / {len(slang_products)}")
print(f"   With inner diameter:  {with_inner} / {len(slang_products)}")
print(f"   With outer diameter:  {with_outer} / {len(slang_products)}")

print(f"\n{'='*80}")
print("✅ CHECK COMPLETE")
print("="*80)
