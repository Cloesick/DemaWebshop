"""Check if tube lengths are captured from PDFs"""
import json

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Check length_m field
with_length = [p for p in catalog if p.get('length_m')]

print("=" * 80)
print("TUBE LENGTH CAPTURE VERIFICATION")
print("=" * 80)

print(f"\n📊 LENGTH STATISTICS:")
print(f"   Total products:           {len(catalog)}")
print(f"   Products with length:     {len(with_length)} ({len(with_length)/len(catalog)*100:.1f}%)")

# Group by catalog
from collections import defaultdict
by_catalog = defaultdict(list)
for p in with_length:
    by_catalog[p.get('catalog', 'unknown')].append(p)

print(f"\n📦 LENGTH DATA BY CATALOG:")
for catalog_name, products in sorted(by_catalog.items(), key=lambda x: len(x[1]), reverse=True)[:10]:
    print(f"   {catalog_name:40} {len(products):5} products with length")

# Show samples
print(f"\n📋 SAMPLE PRODUCTS WITH LENGTH:")
for p in with_length[:15]:
    print(f"\n   SKU: {p.get('sku')}")
    print(f"   Catalog: {p.get('catalog')}")
    print(f"   Length: {p.get('length_m')} m")
    if p.get('diameter_mm'):
        print(f"   Diameter: {p.get('diameter_mm')} mm")

# Check enhanced extraction source
print(f"\n" + "=" * 80)
print("CHECKING ENHANCED EXTRACTION SOURCE")
print("=" * 80)

enhanced_path = 'C:/Users/prova/Documents/Projects/PDF_Analyzer/output/products_enhanced_20251127_142226.json'
try:
    with open(enhanced_path, 'r', encoding='utf-8') as f:
        enhanced = json.load(f)
    
    enhanced_with_length = [p for p in enhanced if p.get('length_m')]
    print(f"\n✅ Enhanced extraction loaded")
    print(f"   Total products in extraction: {len(enhanced)}")
    print(f"   Products with length_m:       {len(enhanced_with_length)} ({len(enhanced_with_length)/len(enhanced)*100:.1f}%)")
    
    # Check if header "Lengte" or "Length" was captured
    print(f"\n📋 SAMPLE FROM ENHANCED EXTRACTION:")
    for p in enhanced_with_length[:10]:
        print(f"\n   SKU: {p.get('sku')}")
        print(f"   PDF: {p.get('pdf_source')}")
        print(f"   Page: {p.get('page_in_pdf')}")
        print(f"   Length: {p.get('length_m')} m")
        if p.get('table_row'):
            print(f"   From table row: {p.get('table_row')}")
        
except FileNotFoundError:
    print(f"❌ Enhanced extraction file not found at {enhanced_path}")

print(f"\n" + "=" * 80)
print("✅ VERIFICATION COMPLETE")
print("=" * 80)
