"""
Check ABS-Persluchtbuizen diameter extraction
"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]

print("=" * 80)
print("ABS-PERSLUCHTBUIZEN DIAMETER CHECK")
print("=" * 80)

print(f"\n📦 Found {len(abs_products)} abs-persluchtbuizen products")

print(f"\n📋 SAMPLE PRODUCTS:")
for p in abs_products[:15]:
    sku = p.get('sku', 'N/A')
    diameter = p.get('diameter_mm', 'N/A')
    source = p.get('diameter_source', 'N/A')
    
    # Extract expected diameter from SKU (last 3 digits)
    expected = 'N/A'
    if sku.startswith('ABSBU') and len(sku) >= 8:
        try:
            expected = int(sku[-3:])
        except:
            expected = 'N/A'
    
    match = '✅' if str(diameter) == str(expected) else '❌'
    print(f"   {match} SKU: {sku:15} | Diameter: {str(diameter):6} | Expected: {str(expected):6} | Source: {source}")

print(f"\n📊 STATISTICS:")
with_diameter = len([p for p in abs_products if p.get('diameter_mm')])
correct_diameter = 0

for p in abs_products:
    sku = p.get('sku', '')
    diameter = p.get('diameter_mm')
    
    if sku.startswith('ABSBU') and len(sku) >= 8:
        try:
            expected = int(sku[-3:])
            if diameter == expected:
                correct_diameter += 1
        except:
            pass

print(f"   With diameter:             {with_diameter} / {len(abs_products)}")
print(f"   Correct diameter:          {correct_diameter} / {len(abs_products)}")

print(f"\n{'='*80}")
print("✅ CHECK COMPLETE")
print("="*80)
