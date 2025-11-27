"""
Analyze properties by product category to identify issues
"""
import json
from collections import defaultdict

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Categories to analyze
target_categories = [
    'slangkoppelingen',
    'draadfittingen', 
    'slangklemmen',
    'plat-oprolbare-slangen',
    'pomp-specials',
    'afzuigslangen'
]

print("=" * 80)
print("CATEGORY-SPECIFIC PROPERTY ANALYSIS")
print("=" * 80)

for category in target_categories:
    # Find products in this category
    products = [p for p in catalog if category.lower() in str(p.get('catalog', '')).lower()]
    
    if not products:
        print(f"\n❌ {category}: No products found")
        continue
    
    print(f"\n📦 {category.upper()}: {len(products)} products")
    print("-" * 80)
    
    # Count properties
    props = defaultdict(int)
    for p in products:
        for key in p.keys():
            if p[key] not in [None, '', [], {}, 0]:
                props[key] += 1
    
    # Show relevant technical properties
    tech_props = ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg', 
                  'flow_l_min', 'diameter_mm', 'length_m', 'material', 'materials']
    
    print("\n  Technical Properties:")
    for prop in tech_props:
        count = props.get(prop, 0)
        if count > 0:
            pct = count / len(products) * 100
            print(f"    {prop:20} {count:5} products ({pct:5.1f}%)")
    
    # Show sample product
    if products:
        print(f"\n  📋 Sample Product: {products[0].get('sku')}")
        sample = products[0]
        for prop in tech_props:
            if sample.get(prop):
                print(f"    {prop:20} {sample[prop]}")

print(f"\n{'='*80}")
print("✅ ANALYSIS COMPLETE")
print("="*80)
