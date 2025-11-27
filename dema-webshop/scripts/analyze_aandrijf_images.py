"""
Analyze images for catalogus-aandrijftechniek products
"""
import json
from pathlib import Path
from collections import defaultdict

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("AANDRIJFTECHNIEK IMAGE ANALYSIS")
print("=" * 80)

# Find aandrijftechniek products
aandrijf_products = [p for p in catalog if 'aandrijftechniek' in str(p.get('catalog', '')).lower()]

print(f"\n📦 Found {len(aandrijf_products)} aandrijftechniek products")

# Analyze images
brand_images = defaultdict(list)
valid_images = []
no_images = []

for product in aandrijf_products:
    sku = product.get('sku')
    images = product.get('images', [])
    
    if not images:
        no_images.append(sku)
        continue
    
    # Check if images are brand logos
    first_image = images[0]
    image_name = Path(first_image).stem.lower() if first_image else ''
    
    # Common brand names that appear as logos
    brands = ['ntn', 'fk', 'snr', 'skf', 'fag', 'timken', 'koyo', 'nsk']
    
    is_brand_logo = any(brand in image_name for brand in brands)
    
    if is_brand_logo:
        brand_name = next((brand for brand in brands if brand in image_name), 'unknown')
        brand_images[brand_name].append({
            'sku': sku,
            'image': first_image,
            'total_images': len(images),
            'name': product.get('product_name', '')
        })
    else:
        valid_images.append(sku)

print(f"\n📊 IMAGE STATISTICS:")
print(f"   Products with brand logos:  {sum(len(v) for v in brand_images.values())}")
print(f"   Products with valid images: {len(valid_images)}")
print(f"   Products without images:    {len(no_images)}")

print(f"\n🏷️ BRAND LOGOS FOUND:")
for brand, products in sorted(brand_images.items(), key=lambda x: len(x[1]), reverse=True):
    print(f"\n   {brand.upper()}: {len(products)} products")
    for p in products[:5]:  # Show first 5
        print(f"      {p['sku']:20} {p['total_images']} images - {p['image']}")
    if len(products) > 5:
        print(f"      ... and {len(products) - 5} more")

# Check PDF source
print(f"\n📄 PDF SOURCE ANALYSIS:")
pdf_sources = defaultdict(int)
for product in aandrijf_products:
    pdf = product.get('pdf_source', 'unknown')
    pdf_sources[pdf] += 1

for pdf, count in sorted(pdf_sources.items(), key=lambda x: x[1], reverse=True):
    print(f"   {pdf:40} {count:5} products")

print(f"\n📋 SAMPLE PRODUCTS WITH BRAND LOGOS:")
for i, product in enumerate(aandrijf_products[:10]):
    if product.get('images'):
        print(f"\n   Product {i+1}:")
        print(f"   SKU:    {product['sku']}")
        print(f"   Name:   {product.get('product_name', 'N/A')}")
        print(f"   PDF:    {product.get('pdf_source', 'N/A')}")
        print(f"   Page:   {product.get('page_in_pdf', 'N/A')}")
        print(f"   Images: {len(product['images'])}")
        for img in product['images'][:3]:
            print(f"           {img}")

print(f"\n{'='*80}")
print("✅ ANALYSIS COMPLETE")
print("="*80)
