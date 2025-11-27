"""
Verify diameter extraction from SKU patterns
"""
import json

with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("VERIFICATION: SKU DIAMETER EXTRACTION")
print("=" * 80)

# Find products from abs-persluchtbuizen
abs_products = [p for p in catalog if 'abs-perslucht' in str(p.get('catalog', '')).lower()]

print(f"\n🔍 ABS-PERSLUCHTBUIZEN PRODUCTS: {len(abs_products)}")
print("-" * 80)

# Show examples with ABSBU pattern
absbu_products = [p for p in abs_products if p['sku'].startswith('ABSBU')][:15]

print(f"\n📏 ABSBU Series (Diameter from SKU):")
for p in absbu_products:
    sku = p['sku']
    diameter = p.get('diameter_mm', 'N/A')
    source = p.get('diameter_source', 'unknown')
    
    # Extract number from SKU for verification
    import re
    match = re.search(r'(\d+)$', sku)
    sku_number = int(match.group(1)) if match else 'N/A'
    
    status = "✅" if diameter == sku_number else "❓"
    print(f"   {status} {sku:15} → SKU ends with {sku_number:3} → Diameter: 📏 {diameter} mm ({source})")

# Show other patterns
print(f"\n📏 Other ABS Products:")
other_abs = [p for p in abs_products if not p['sku'].startswith('ABSBU') and p.get('diameter_mm')][:10]
for p in other_abs:
    sku = p['sku']
    diameter = p.get('diameter_mm', 'N/A')
    source = p.get('diameter_source', 'unknown')
    print(f"   ✓ {sku:15} → Diameter: 📏 {diameter} mm ({source})")

# Check slangkoppelingen
slang_products = [p for p in catalog if 'slangkoppeling' in str(p.get('catalog', '')).lower() 
                  and p.get('diameter_source') == 'sku_pattern'][:10]

print(f"\n📏 SLANGKOPPELINGEN (Diameter from SKU):")
for p in slang_products:
    print(f"   ✓ {p['sku']:20} → 📏 {p['diameter_mm']} mm")

# Statistics
sku_extracted = len([p for p in catalog if p.get('diameter_source') == 'sku_pattern'])
total_with_diameter = len([p for p in catalog if p.get('diameter_mm')])

print(f"\n📊 OVERALL STATISTICS:")
print(f"   Total products with diameter:     {total_with_diameter}")
print(f"   Diameter from SKU pattern:        {sku_extracted}")
print(f"   Diameter from PDF extraction:     {total_with_diameter - sku_extracted}")
print(f"   SKU extraction contribution:      {sku_extracted/max(1,total_with_diameter)*100:.1f}%")

print(f"\n{'='*80}")
print("✅ VERIFICATION COMPLETE")
print("="*80)
