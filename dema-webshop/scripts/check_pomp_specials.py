"""
Check current pomp-specials products
"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

pomp_products = [p for p in catalog if 'pomp-special' in str(p.get('catalog', '')).lower()]

print("=" * 80)
print("POMP-SPECIALS CURRENT STATE")
print("=" * 80)

print(f"\n📦 Found {len(pomp_products)} pomp-specials products")

print(f"\n📋 SAMPLE PRODUCTS (first 10):")
for p in pomp_products[:10]:
    sku = p.get('sku', 'N/A')
    power_hp = p.get('power_hp', 'N/A')
    power_kw = p.get('power_kw', 'N/A')
    rpm = p.get('rpm', 'N/A')
    flow = p.get('flow_l_min', 'N/A')
    pressure = p.get('pressure_max_bar', 'N/A')
    
    print(f"   {sku:20} | HP: {str(power_hp):6} | kW: {str(power_kw):6} | RPM: {str(rpm):6} | Flow: {str(flow):8} | Pressure: {str(pressure):6}")

print(f"\n📊 STATISTICS:")
with_hp = len([p for p in pomp_products if p.get('power_hp')])
with_kw = len([p for p in pomp_products if p.get('power_kw')])
with_rpm = len([p for p in pomp_products if p.get('rpm')])
with_flow = len([p for p in pomp_products if p.get('flow_l_min')])
with_pressure = len([p for p in pomp_products if p.get('pressure_max_bar')])

print(f"   With power (HP):          {with_hp} / {len(pomp_products)}")
print(f"   With power (kW):          {with_kw} / {len(pomp_products)}")
print(f"   With RPM:                 {with_rpm} / {len(pomp_products)}")
print(f"   With flow:                {with_flow} / {len(pomp_products)}")
print(f"   With pressure:            {with_pressure} / {len(pomp_products)}")

print(f"\n{'='*80}")
print("✅ CHECK COMPLETE")
print("="*80)
