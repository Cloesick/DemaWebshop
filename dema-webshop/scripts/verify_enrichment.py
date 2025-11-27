"""Verify catalog enrichment status"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("CATALOG ENRICHMENT VERIFICATION")
print("=" * 80)

# Find fully enriched products
fully_enriched = [p for p in catalog if p.get('power_kw') and p.get('voltage_v') and p.get('pressure_max_bar')]

print(f"\n✅ ENRICHMENT STATUS:")
print(f"   Total products:              {len(catalog)}")
print(f"   Products with any specs:     {sum(1 for p in catalog if any(p.get(k) for k in ['power_kw','voltage_v','pressure_max_bar','weight_kg','flow_l_min','diameter_mm']))}")
print(f"   Fully enriched (3+ specs):   {len(fully_enriched)}")

# Show detailed example
if fully_enriched:
    print(f"\n🎯 EXAMPLE FULLY ENRICHED PRODUCT:")
    p = fully_enriched[0]
    print(f"\n   SKU:        {p.get('sku')}")
    print(f"   Name:       {p.get('name')}")
    print(f"   Catalog:    {p.get('catalog')}")
    print(f"\n   Technical Specs:")
    if p.get('power_kw'):
        print(f"     ⚡ Power:      {p['power_kw']} kW")
    if p.get('voltage_v'):
        print(f"     🔌 Voltage:    {p['voltage_v']} V")
    if p.get('pressure_max_bar'):
        print(f"     🔧 Pressure:   {p['pressure_max_bar']} bar")
    if p.get('weight_kg'):
        print(f"     ⚖️ Weight:     {p['weight_kg']} kg")
    if p.get('flow_l_min'):
        print(f"     💨 Flow:       {p['flow_l_min']} L/min")
    if p.get('volume_l'):
        print(f"     🗜️ Volume:     {p['volume_l']} L")
    if p.get('rpm'):
        print(f"     🔄 RPM:        {p['rpm']} RPM")
    if p.get('diameter_mm'):
        print(f"     📏 Diameter:   {p['diameter_mm']} mm")

# Check card component
import os
card_path = 'src/components/CatalogProductCard.tsx'
with open(card_path, 'r', encoding='utf-8') as f:
    card_content = f.read()

has_specs_display = 'product.power_kw' in card_content and 'Technical Specifications' in card_content

print(f"\n🎨 CARD COMPONENT STATUS:")
print(f"   File: {card_path}")
print(f"   Has technical specs display: {'✅ YES' if has_specs_display else '❌ NO'}")

if has_specs_display:
    specs_badges = ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg', 'flow_l_min', 'diameter_mm', 'volume_l', 'rpm']
    for badge in specs_badges:
        if f'product.{badge}' in card_content:
            print(f"     ✅ {badge} badge")

print(f"\n{'='*80}")
print("✅ VERIFICATION COMPLETE")
print("="*80)
print("\n💡 To see the enriched cards:")
print("   1. Restart dev server: npm run dev")
print("   2. Open: http://localhost:3000/products")
print("   3. Look for colored spec badges on product cards!")
