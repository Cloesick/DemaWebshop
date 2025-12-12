"""
Batch Extract Images from All PDF Catalogs
==========================================
Processes all PDF catalogs in a folder, extracts images with SKU detection,
converts to WebP, and organizes by catalog.

Works on entire catalog library automatically!
"""

import fitz  # PyMuPDF
import re
import io
from pathlib import Path
from PIL import Image
from collections import defaultdict
import json
from datetime import datetime
import time

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
PDF_INPUT_DIR = PROJECT_ROOT / "documents" / "Product_pdfs"
OUTPUT_BASE_DIR = PROJECT_ROOT / "public" / "product-images" / "extracted-catalogs"

# SKU pattern for various catalogs
SKU_PATTERNS = [
    r'\b[A-Z]{2,}\d{2,}[A-Z]{0,}\d*\b',  # Makita style: DHP484, BL1860B
    r'\b\d{6}\b',  # 6-digit codes
    r'\b\d{5}-\d\b',  # Hyphenated: 19171-8
    r'\b\d{4,5}\b',  # 4-5 digit codes
    r'\b[A-Z]{1,2}\s?\d{2,4}\b',  # L 11, L11, etc.
    r'\b\d+-\d+\b',  # Range style: 0-41
]

# Settings
WEBP_QUALITY = 85
MIN_IMAGE_SIZE = 100  # pixels
MAX_SKUS_IN_FILENAME = 8
OCR_ENABLED = False  # Disabled by default for speed

def extract_skus_from_text(text):
    """Extract SKU codes from text using patterns"""
    skus = set()
    
    for pattern in SKU_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        skus.update(matches)
    
    # Filter out common false positives
    filtered_skus = set()
    for sku in skus:
        # Skip very small numbers
        if sku.isdigit() and len(sku) < 4:
            continue
        # Skip if all letters
        if sku.isalpha() and len(sku) < 4:
            continue
        # Skip common words
        if sku.upper() in ['PAGE', 'VOLT', 'WATT', 'TYPE']:
            continue
        filtered_skus.add(sku)
    
    return filtered_skus

def extract_text_from_bbox(page, bbox, expand=50):
    """Extract text from a bounding box area"""
    x0, y0, x1, y1 = bbox
    expanded_bbox = (
        max(0, x0 - expand),
        max(0, y0 - expand),
        min(page.rect.width, x1 + expand),
        min(page.rect.height, y1 + expand)
    )
    text = page.get_text("text", clip=expanded_bbox)
    return text

def detect_table_structure(text_lines):
    """Detect if text represents a table and extract SKUs from top row"""
    skus = set()
    lines = [line.strip() for line in text_lines.split('\n') if line.strip()]
    
    for i, line in enumerate(lines[:5]):
        line_skus = extract_skus_from_text(line)
        if len(line_skus) >= 2:
            skus.update(line_skus)
            # Check next lines for additional SKUs
            for next_line in lines[i+1:min(i+4, len(lines))]:
                additional_skus = extract_skus_from_text(next_line)
                if additional_skus:
                    skus.update(additional_skus)
    
    return skus

def create_filename_from_skus(skus, page, index, max_skus=8):
    """Create a filename from SKUs"""
    if not skus:
        return f"page{page:03d}_img{index:02d}"
    
    sku_list = sorted(list(skus))
    
    if len(sku_list) > max_skus:
        filename_skus = sku_list[:max_skus]
        filename = '+'.join(filename_skus) + f'+{len(sku_list)-max_skus}more'
    else:
        filename = '+'.join(sku_list)
    
    filename = f"{filename}_p{page:03d}_i{index:02d}"
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    if len(filename) > 150:
        import hashlib
        hash_suffix = hashlib.md5(filename.encode()).hexdigest()[:8]
        filename = filename[:140] + '_' + hash_suffix
    
    return filename

def convert_to_webp(pil_image, output_path, quality=WEBP_QUALITY):
    """Convert PIL image to WebP format"""
    try:
        if pil_image.mode in ('RGBA', 'LA', 'P'):
            if pil_image.mode == 'RGBA':
                background = Image.new('RGB', pil_image.size, (255, 255, 255))
                background.paste(pil_image, mask=pil_image.split()[-1])
                pil_image = background
            else:
                pil_image = pil_image.convert('RGB')
        
        pil_image.save(output_path, 'WEBP', quality=quality, method=6)
        return True
    except Exception as e:
        return False

def extract_images_from_pdf(pdf_path, output_dir, catalog_name):
    """Extract all images from PDF with their locations"""
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"   ❌ Error opening PDF: {e}")
        return [], {}
    
    images_data = []
    total_images = 0
    skipped_small = 0
    total_pages = len(doc)
    
    print(f"   📖 Pages: {total_pages}")
    
    try:
        for page_num in range(total_pages):
            try:
                page = doc[page_num]
                image_list = page.get_images(full=True)
                
                if image_list and (page_num + 1) % 10 == 0:
                    print(f"      Progress: Page {page_num + 1}/{total_pages} ({len(image_list)} images)")
                
                for img_index, img_info in enumerate(image_list):
                    total_images += 1
                    
                    try:
                        xref = img_info[0]
                        base_image = doc.extract_image(xref)
                        image_bytes = base_image["image"]
                        pil_image = Image.open(io.BytesIO(image_bytes))
                        
                        if pil_image.width < MIN_IMAGE_SIZE or pil_image.height < MIN_IMAGE_SIZE:
                            skipped_small += 1
                            continue
                        
                        img_rects = page.get_image_rects(xref)
                        bbox = img_rects[0] if img_rects else (0, 0, page.rect.width, page.rect.height)
                        
                        nearby_text = extract_text_from_bbox(page, bbox, expand=50)
                        table_skus = detect_table_structure(nearby_text)
                        all_nearby_skus = extract_skus_from_text(nearby_text)
                        all_skus = table_skus | all_nearby_skus
                        
                        images_data.append({
                            'page': page_num + 1,
                            'index': img_index,
                            'image': pil_image,
                            'skus': all_skus,
                            'bbox': bbox,
                        })
                        
                    except Exception as e:
                        continue
                        
            except Exception as e:
                print(f"      ⚠️  Error on page {page_num + 1}: {str(e)[:50]}")
                continue
                
    finally:
        doc.close()
    
    stats = {
        'total_scanned': total_images,
        'extracted': len(images_data),
        'skipped_small': skipped_small,
        'pages': total_pages
    }
    
    return images_data, stats

def save_images(images_data, output_dir, catalog_name):
    """Save extracted images as WebP with SKU-based names"""
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    saved_count = 0
    total_size = 0
    all_skus = set()
    
    for img_data in images_data:
        filename = create_filename_from_skus(
            img_data['skus'],
            img_data['page'],
            img_data['index'],
            max_skus=MAX_SKUS_IN_FILENAME
        )
        
        output_path = output_dir / f"{filename}.webp"
        
        if convert_to_webp(img_data['image'], output_path):
            file_size = output_path.stat().st_size
            total_size += file_size
            saved_count += 1
            all_skus.update(img_data['skus'])
    
    return saved_count, total_size, all_skus

def create_sku_mapping(images_data, output_dir, catalog_name):
    """Create a mapping file of SKUs to images"""
    
    mapping_file = output_dir / 'sku_to_image_mapping.json'
    sku_to_images = defaultdict(list)
    
    for img_data in images_data:
        filename = create_filename_from_skus(
            img_data['skus'],
            img_data['page'],
            img_data['index'],
            max_skus=MAX_SKUS_IN_FILENAME
        ) + '.webp'
        
        for sku in img_data['skus']:
            sku_to_images[sku].append({
                'filename': filename,
                'page': img_data['page'],
                'all_skus': sorted(list(img_data['skus']))
            })
    
    mapping_data = {
        'catalog': catalog_name,
        'generated': datetime.now().isoformat(),
        'total_skus': len(sku_to_images),
        'total_images': len(images_data),
        'mapping': dict(sku_to_images)
    }
    
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, indent=2)
    
    return len(sku_to_images)

def process_single_catalog(pdf_path):
    """Process a single PDF catalog"""
    
    catalog_name = pdf_path.stem
    output_dir = OUTPUT_BASE_DIR / catalog_name
    
    print(f"\n{'='*80}")
    print(f"📄 Processing: {pdf_path.name}")
    print(f"{'='*80}")
    print(f"   📁 Output: {output_dir.name}/")
    
    start_time = time.time()
    
    # Extract images
    images_data, extract_stats = extract_images_from_pdf(pdf_path, output_dir, catalog_name)
    
    if not images_data:
        print(f"   ⚠️  No images extracted!")
        return None
    
    print(f"   ✓ Extracted: {extract_stats['extracted']} images")
    print(f"   ⏭️  Skipped: {extract_stats['skipped_small']} (too small)")
    
    # Save images
    print(f"   💾 Converting to WebP...")
    saved_count, total_size, all_skus = save_images(images_data, output_dir, catalog_name)
    
    # Create mapping
    unique_skus = create_sku_mapping(images_data, output_dir, catalog_name)
    
    elapsed_time = time.time() - start_time
    
    print(f"   ✅ Saved: {saved_count} images")
    print(f"   🏷️  SKUs: {unique_skus} unique")
    print(f"   💿 Size: {total_size / 1024 / 1024:.1f} MB")
    print(f"   ⏱️  Time: {elapsed_time:.1f}s")
    
    return {
        'catalog': catalog_name,
        'pdf_name': pdf_path.name,
        'pages': extract_stats['pages'],
        'images_saved': saved_count,
        'total_size': total_size,
        'unique_skus': unique_skus,
        'processing_time': elapsed_time
    }

def main():
    print("=" * 80)
    print("BATCH EXTRACT ALL PDF CATALOGS")
    print("=" * 80)
    print()
    
    # Find all PDFs
    if not PDF_INPUT_DIR.exists():
        print(f"❌ Input directory not found: {PDF_INPUT_DIR}")
        return
    
    pdf_files = sorted(PDF_INPUT_DIR.glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ No PDF files found in: {PDF_INPUT_DIR}")
        return
    
    print(f"📚 Found {len(pdf_files)} PDF catalogs")
    print(f"📁 Input: {PDF_INPUT_DIR}")
    print(f"📁 Output: {OUTPUT_BASE_DIR}")
    print()
    
    # Process all PDFs
    results = []
    errors = []
    
    for i, pdf_path in enumerate(pdf_files, 1):
        print(f"\n[{i}/{len(pdf_files)}] ", end='')
        
        try:
            result = process_single_catalog(pdf_path)
            if result:
                results.append(result)
            else:
                errors.append(pdf_path.name)
        except Exception as e:
            print(f"   ❌ Error: {e}")
            errors.append(pdf_path.name)
    
    # Final summary
    print("\n" + "=" * 80)
    print("📊 BATCH PROCESSING COMPLETE")
    print("=" * 80)
    
    if results:
        total_images = sum(r['images_saved'] for r in results)
        total_size = sum(r['total_size'] for r in results)
        total_skus = sum(r['unique_skus'] for r in results)
        total_time = sum(r['processing_time'] for r in results)
        
        print(f"✅ Successfully processed: {len(results)}/{len(pdf_files)} catalogs")
        print(f"   📸 Total images: {total_images:,}")
        print(f"   🏷️  Total SKUs: {total_skus:,}")
        print(f"   💿 Total size: {total_size / 1024 / 1024:.1f} MB")
        print(f"   ⏱️  Total time: {total_time:.1f}s")
        print(f"   📁 Output: {OUTPUT_BASE_DIR}")
        
        print(f"\n📋 Top 10 Catalogs by Image Count:")
        for i, result in enumerate(sorted(results, key=lambda x: x['images_saved'], reverse=True)[:10], 1):
            print(f"   {i:2d}. {result['catalog']:40s} - {result['images_saved']:4d} images, {result['unique_skus']:4d} SKUs")
    
    if errors:
        print(f"\n⚠️  Failed: {len(errors)} catalogs")
        for err in errors:
            print(f"   - {err}")
    
    print("\n💡 NEXT STEPS:")
    print("   1. Review extracted images in: public/product-images/extracted-catalogs/")
    print("   2. Check sku_to_image_mapping.json in each catalog folder")
    print("   3. Run variant analysis to find image sharing opportunities")
    print("   4. Update products.json with new image paths")
    
    # Save batch summary
    OUTPUT_BASE_DIR.mkdir(parents=True, exist_ok=True)
    summary_file = OUTPUT_BASE_DIR / '_batch_summary.json'
    summary_data = {
        'generated': datetime.now().isoformat(),
        'total_catalogs': len(pdf_files),
        'successful': len(results),
        'failed': len(errors),
        'total_images': sum(r['images_saved'] for r in results) if results else 0,
        'total_skus': sum(r['unique_skus'] for r in results) if results else 0,
        'catalogs': results,
        'errors': errors
    }
    
    with open(summary_file, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, indent=2)
    
    print(f"   📝 Batch summary saved: {summary_file.name}")
    
    print("=" * 80 + "\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
