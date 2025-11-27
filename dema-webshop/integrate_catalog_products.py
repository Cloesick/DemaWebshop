"""
Integrate PDF Catalog Products into DemaWebshop
Copies product data, images, and PDFs from PDF_Analyzer to DemaWebshop
"""

import json
import shutil
from pathlib import Path

# Paths
PDF_ANALYZER = Path(r"C:\Users\prova\Documents\Projects\PDF_Analyzer")
DEMA_WEBSHOP = Path(r"C:\Users\prova\Documents\Projects\DemaWebshop\dema-webshop")

# Source paths
SOURCE_JSON = PDF_ANALYZER / "output" / "products_v2.3_20251127_003020.json"
SOURCE_IMAGES = PDF_ANALYZER / "product-images-by-pdf"
SOURCE_PDFS = PDF_ANALYZER / "input_pdfs"

# Destination paths
DEST_DATA = DEMA_WEBSHOP / "src" / "data"
DEST_IMAGES = DEMA_WEBSHOP / "public" / "product-images"
DEST_PDFS = DEMA_WEBSHOP / "public" / "documents"

# Stats
stats = {
    'products': 0,
    'images_copied': 0,
    'pdfs_copied': 0,
    'skipped': 0
}

def transform_product(product):
    """Transform PDF analyzer product to DemaWebshop format"""
    
    # Get primary image
    primary_image = None
    media = []
    image_paths = []
    
    if product.get('images'):
        for idx, img in enumerate(product['images']):
            # Convert path to web format
            img_path = img['path'].replace('\\', '/')
            # Extract relative path from product-images-by-pdf onwards
            if 'product-images-by-pdf' in img_path:
                relative_path = '/product-images/' + img_path.split('product-images-by-pdf/')[-1]
            else:
                relative_path = f"/product-images/{img['filename']}"
            
            image_paths.append(relative_path)
            
            media.append({
                'url': relative_path,
                'role': 'main' if idx == 0 else 'gallery',
                'type': 'image',
                'format': 'webp'
            })
            
            if idx == 0:
                primary_image = relative_path
    
    # Build transformed product
    transformed = {
        'id': product['sku'],
        'sku': product['sku'],
        'name': f"{product['sku']} - From {product['pdf_source'].replace('.pdf', '')}",
        'catalog': product['pdf_source'].replace('.pdf', ''),
        'brand': None,
        'category': 'Catalog Products',
        'description': f"Product {product['sku']} from {product['pdf_source']}. Available on pages: {', '.join(map(str, product['pages']))}",
        'price': None,  # Request quote
        'priceMode': 'request_quote',
        'inStock': None,
        'stock': {
            'status': 'unknown',
            'quantity': None
        },
        'imageUrl': primary_image,
        'image_paths': image_paths,
        'media': media,
        'source': {
            'pdf_sources': [f"/documents/{product['pdf_source']}"],
            'pages': product['pages']
        },
        'pdf_source': product['pdf_source'],
        'source_pages': product['pages'],
        'seo': {
            'slug': product['sku'].lower().replace('/', '-').replace(' ', '-'),
            'meta_title': f"{product['sku']} | DemaWebshop",
            'meta_description': f"View product {product['sku']} from our catalog. High-quality images and detailed specifications."
        },
        'attributes': {
            'pdf_source': product['pdf_source'],
            'pages': product['pages'],
            'image_count': len(product['images']),
            'shared_with': [img.get('shared_with_skus', []) for img in product['images']]
        }
    }
    
    return transformed

def copy_images():
    """Copy product images to DemaWebshop public folder"""
    print("\n📸 Copying product images...")
    
    if not SOURCE_IMAGES.exists():
        print(f"  ⚠️ Source images folder not found: {SOURCE_IMAGES}")
        return
    
    DEST_IMAGES.mkdir(parents=True, exist_ok=True)
    
    # Copy all catalog folders
    for catalog_folder in SOURCE_IMAGES.iterdir():
        if catalog_folder.is_dir():
            dest_catalog = DEST_IMAGES / catalog_folder.name
            
            if dest_catalog.exists():
                print(f"  ⏩ Skipping existing: {catalog_folder.name}")
                continue
            
            print(f"  📁 Copying: {catalog_folder.name} ({len(list(catalog_folder.glob('*.webp')))} images)")
            shutil.copytree(catalog_folder, dest_catalog)
            stats['images_copied'] += len(list(catalog_folder.glob('*.webp')))
    
    print(f"  ✅ Total images copied: {stats['images_copied']}")

def copy_pdfs():
    """Copy PDF catalogs to DemaWebshop public folder"""
    print("\n📄 Copying PDF catalogs...")
    
    if not SOURCE_PDFS.exists():
        print(f"  ⚠️ Source PDFs folder not found: {SOURCE_PDFS}")
        return
    
    DEST_PDFS.mkdir(parents=True, exist_ok=True)
    
    # Copy all PDFs
    for pdf_file in SOURCE_PDFS.glob("*.pdf"):
        dest_pdf = DEST_PDFS / pdf_file.name
        
        if dest_pdf.exists():
            print(f"  ⏩ Skipping existing: {pdf_file.name}")
            continue
        
        print(f"  📄 Copying: {pdf_file.name}")
        shutil.copy2(pdf_file, dest_pdf)
        stats['pdfs_copied'] += 1
    
    print(f"  ✅ Total PDFs copied: {stats['pdfs_copied']}")

def integrate_products():
    """Load and transform product data"""
    print("\n🔄 Integrating product data...")
    
    if not SOURCE_JSON.exists():
        print(f"  ❌ Source JSON not found: {SOURCE_JSON}")
        return
    
    # Load source data
    with open(SOURCE_JSON, 'r', encoding='utf-8') as f:
        source_products = json.load(f)
    
    print(f"  📦 Found {len(source_products)} products")
    
    # Transform products
    transformed_products = []
    for product in source_products:
        try:
            transformed = transform_product(product)
            transformed_products.append(transformed)
            stats['products'] += 1
        except Exception as e:
            print(f"  ⚠️ Error transforming {product.get('sku', 'unknown')}: {e}")
            stats['skipped'] += 1
    
    # Save to DemaWebshop
    DEST_DATA.mkdir(parents=True, exist_ok=True)
    
    # Save full catalog
    catalog_file = DEST_DATA / "catalog_products.json"
    with open(catalog_file, 'w', encoding='utf-8') as f:
        json.dump(transformed_products, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ Saved {len(transformed_products)} products to: catalog_products.json")
    
    # Create catalog index (by PDF source)
    catalogs_by_pdf = {}
    for product in transformed_products:
        pdf_source = product['pdf_source']
        if pdf_source not in catalogs_by_pdf:
            catalogs_by_pdf[pdf_source] = []
        catalogs_by_pdf[pdf_source].append(product)
    
    catalog_index = DEST_DATA / "catalog_index.json"
    with open(catalog_index, 'w', encoding='utf-8') as f:
        json.dump({
            'total_products': len(transformed_products),
            'total_catalogs': len(catalogs_by_pdf),
            'catalogs': {
                pdf: {
                    'name': pdf.replace('.pdf', ''),
                    'product_count': len(products),
                    'products': [p['sku'] for p in products[:10]]  # First 10 SKUs
                }
                for pdf, products in catalogs_by_pdf.items()
            }
        }, f, ensure_ascii=False, indent=2)
    
    print(f"  ✅ Created catalog index: {len(catalogs_by_pdf)} catalogs")

def main():
    print("\n" + "="*80)
    print("🔗 INTEGRATING PDF CATALOG INTO DEMAWEBSHOP")
    print("="*80)
    
    # Step 1: Copy images
    copy_images()
    
    # Step 2: Copy PDFs
    copy_pdfs()
    
    # Step 3: Transform and save product data
    integrate_products()
    
    # Print summary
    print("\n" + "="*80)
    print("✅ INTEGRATION COMPLETE")
    print("="*80)
    print(f"\n📊 Summary:")
    print(f"  Products integrated:    {stats['products']:,}")
    print(f"  Images copied:          {stats['images_copied']:,}")
    print(f"  PDFs copied:            {stats['pdfs_copied']}")
    print(f"  Skipped/errors:         {stats['skipped']}")
    
    print(f"\n📁 Files created:")
    print(f"  • {DEST_DATA / 'catalog_products.json'}")
    print(f"  • {DEST_DATA / 'catalog_index.json'}")
    print(f"  • {DEST_IMAGES}/ (product images)")
    print(f"  • {DEST_PDFS}/ (PDF catalogs)")
    
    print(f"\n🎯 Next steps:")
    print(f"  1. Run 'npm run dev' in DemaWebshop")
    print(f"  2. Visit /catalog to see your products")
    print(f"  3. Products are now integrated with existing components!")
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    main()
