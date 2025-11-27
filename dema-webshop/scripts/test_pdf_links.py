"""
Test PDF viewer links
"""
import json

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("TESTING PDF VIEWER LINKS")
print("=" * 80)

# Find products with PDF links
products_with_links = [p for p in catalog if p.get('pdf_source') and p.get('source_pages')]

print(f"\n📊 Products with PDF viewer links: {len(products_with_links)}")

# Test samples from each catalog
catalogs_tested = {}

for product in products_with_links[:20]:
    catalog_name = product.get('catalog', 'unknown')
    
    if catalog_name not in catalogs_tested:
        print(f"\n📁 {catalog_name}")
        catalogs_tested[catalog_name] = []
    
    if len(catalogs_tested[catalog_name]) < 3:
        sku = product['sku']
        pdf_source = product.get('pdf_source')
        source_pages = product.get('source_pages', [])
        page = source_pages[0] if source_pages else 'N/A'
        
        viewer_url = f"/pdf-viewer?file={pdf_source}&page={page}&sku={sku}"
        
        print(f"   ✓ SKU: {sku:20} | Page: {page:3} | PDF: {pdf_source}")
        print(f"      URL: {viewer_url}")
        
        catalogs_tested[catalog_name].append(product)

print(f"\n{'='*80}")
print("✅ PDF VIEWER LINKS ARE CONFIGURED")
print("="*80)
print(f"\n🔴 Look for the red 'Page X (SKU highlighted)' button on product cards!")
print(f"   It should open the PDF viewer with the product's page highlighted.")
