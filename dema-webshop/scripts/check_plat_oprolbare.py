"""
Check current plat-oprolbare-slangen products
"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

plat_products = [p for p in catalog if 'plat-oprolbare' in str(p.get('catalog', '')).lower()]

print("=" * 80)
print("PLAT-OPROLBARE-SLANGEN CURRENT STATE")
print("=" * 80)

print(f"\n📦 Found {len(plat_products)} plat-oprolbare-slangen products")

print(f"\n📋 SAMPLE PRODUCTS (first 10):")
for p in plat_products[:10]:
    sku = p.get('sku', 'N/A')
    diameter = p.get('diameter_mm', 'N/A')
    inner = p.get('inner_diameter_mm', 'N/A')
    pressure = p.get('pressure_max_bar', 'N/A')
    weight = p.get('weight_kg', 'N/A')
    length = p.get('length_m', 'N/A')
    
    print(f"   {sku:20} | ø {str(diameter):6} | Inner: {str(inner):6} | Press: {str(pressure):6} | Weight: {str(weight):6} | Length: {str(length):6}")

print(f"\n📊 STATISTICS:")
with_inner = len([p for p in plat_products if p.get('inner_diameter_mm')])
with_pressure = len([p for p in plat_products if p.get('pressure_max_bar')])
with_weight = len([p for p in plat_products if p.get('weight_kg')])
with_length = len([p for p in plat_products if p.get('length_m')])

print(f"   With inner diameter:      {with_inner} / {len(plat_products)}")
print(f"   With pressure:            {with_pressure} / {len(plat_products)}")
print(f"   With weight:              {with_weight} / {len(plat_products)}")
print(f"   With length:              {with_length} / {len(plat_products)}")

print(f"\n{'='*80}")
print("✅ CHECK COMPLETE")
print("="*80)
