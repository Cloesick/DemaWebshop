"""
Debug SKU matching for aandrijftechniek products
"""
import json
from pathlib import Path

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/aandrijftechniek_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

# Find aandrijftechniek products in catalog
aandrijf_catalog = [p for p in catalog if 'aandrijftechniek' in str(p.get('catalog', '')).lower()]

print("=" * 80)
print("AANDRIJFTECHNIEK SKU MATCHING DEBUG")
print("=" * 80)

print(f"\n📦 Catalog has {len(aandrijf_catalog)} aandrijftechniek products")
print(f"📄 Extracted {len(specs_data)} products from PDF")

# Show sample catalog SKUs
print(f"\n📋 SAMPLE CATALOG SKUs (first 20):")
for p in aandrijf_catalog[:20]:
    sku = p.get('sku')
    has_bearing = 'bearing_housing' in p
    has_diameter = 'diameter_mm' in p
    print(f"   {sku:20} | Bearing: {'✓' if has_bearing else '✗'} | Diameter: {'✓' if has_diameter else '✗'}")

# Show sample extracted SKUs
print(f"\n📋 SAMPLE EXTRACTED SKUs (first 20):")
for p in specs_data[:20]:
    sku = p.get('sku')
    diameter = p.get('diameter_mm', 'N/A')
    bearing = p.get('bearing_housing', 'N/A')
    print(f"   {sku:20} | Diameter: {str(diameter):8} | Bearing: {bearing}")

# Check matching
catalog_skus = set(p.get('sku') for p in aandrijf_catalog if p.get('sku'))
extracted_skus = set(p.get('sku') for p in specs_data if p.get('sku'))

matched_skus = catalog_skus & extracted_skus
catalog_only = catalog_skus - extracted_skus
extracted_only = extracted_skus - catalog_skus

print(f"\n🔍 SKU MATCHING ANALYSIS:")
print(f"   Catalog SKUs:     {len(catalog_skus)}")
print(f"   Extracted SKUs:   {len(extracted_skus)}")
print(f"   Matched SKUs:     {len(matched_skus)}")
print(f"   Catalog only:     {len(catalog_only)}")
print(f"   Extracted only:   {len(extracted_only)}")

print(f"\n❌ CATALOG SKUs NOT FOUND IN EXTRACTION (first 30):")
for sku in sorted(catalog_only)[:30]:
    print(f"   {sku}")

print(f"\n🆕 EXTRACTED SKUs NOT IN CATALOG (first 30):")
for sku in sorted(extracted_only)[:30]:
    print(f"   {sku}")

print(f"\n{'='*80}")
print("✅ DEBUG COMPLETE")
print("="*80)
