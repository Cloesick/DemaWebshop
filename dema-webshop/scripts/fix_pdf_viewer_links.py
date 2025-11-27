"""
Fix PDF viewer links by mapping page_in_pdf to source_pages
and setting pdf_source from catalog names
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("FIXING PDF VIEWER LINKS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_pdf_links.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Catalog name to PDF filename mapping
CATALOG_TO_PDF = {
    'catalogus-aandrijftechniek-150922': 'catalogus-aandrijftechniek-150922.pdf',
    'plat-oprolbare-slangen': 'plat-oprolbare-slangen.pdf',
    'slangkoppelingen': 'slangkoppelingen.pdf',
    'pomp-specials': 'pomp-specials.pdf',
}

stats = {
    'products_checked': 0,
    'pdf_source_added': 0,
    'source_pages_added': 0,
    'page_in_pdf_found': 0
}

print(f"\n⚡ Fixing PDF links...")

for product in catalog:
    stats['products_checked'] += 1
    catalog_name = product.get('catalog', '')
    
    # Set pdf_source if missing
    if not product.get('pdf_source') and catalog_name:
        # Try exact match first
        if catalog_name in CATALOG_TO_PDF:
            product['pdf_source'] = CATALOG_TO_PDF[catalog_name]
            stats['pdf_source_added'] += 1
        else:
            # Try to find a matching catalog name (case insensitive, partial match)
            for cat_key, pdf_file in CATALOG_TO_PDF.items():
                if cat_key.lower() in catalog_name.lower():
                    product['pdf_source'] = pdf_file
                    stats['pdf_source_added'] += 1
                    break
    
    # Map page_in_pdf to source_pages if available
    if 'page_in_pdf' in product and product['page_in_pdf']:
        stats['page_in_pdf_found'] += 1
        
        # Only set source_pages if it doesn't exist or is empty
        if not product.get('source_pages'):
            product['source_pages'] = [product['page_in_pdf']]
            stats['source_pages_added'] += 1
            
            if stats['source_pages_added'] <= 10:
                print(f"   ✓ {product['sku']:20} | Page {product['page_in_pdf']} | {product.get('pdf_source', 'N/A')}")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 FIX STATISTICS:")
print(f"   Products checked:          {stats['products_checked']}")
print(f"   PDF sources added:         {stats['pdf_source_added']}")
print(f"   Page_in_pdf found:         {stats['page_in_pdf_found']}")
print(f"   Source_pages added:        {stats['source_pages_added']}")

# Verify samples
print(f"\n📋 VERIFICATION - Products with PDF links:")
with_pdf_links = [p for p in catalog if p.get('pdf_source') and p.get('source_pages')]
print(f"   Total with working PDF links: {len(with_pdf_links)}")

# Show samples from each catalog
print(f"\n📄 SAMPLES BY CATALOG:")
for cat_name in CATALOG_TO_PDF.keys():
    cat_products = [p for p in with_pdf_links if cat_name.lower() in p.get('catalog', '').lower()]
    if cat_products:
        sample = cat_products[0]
        print(f"\n   {cat_name}:")
        print(f"      SKU: {sample['sku']}")
        print(f"      PDF: {sample.get('pdf_source')}")
        print(f"      Pages: {sample.get('source_pages')}")
        print(f"      Total products: {len(cat_products)}")

print(f"\n{'='*80}")
print("✅ PDF LINKS FIXED!")
print("="*80)
print(f"\n🔴 The red 'Page X (SKU highlighted)' buttons should now work!")
