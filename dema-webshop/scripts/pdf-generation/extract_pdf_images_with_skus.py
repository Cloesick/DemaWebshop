"""
Extract Images from PDF with SKU Detection
==========================================
Extracts images from PDFs (like PDF24 tool), detects nearby SKUs from tables,
converts to WebP, and names files with all related SKUs.

Works specifically for Makita catalog structure where:
- SKUs are in the top row of tables
- Properties are in the left column
- Images are near related tables
"""

import fitz  # PyMuPDF
import re
import io
from pathlib import Path
from PIL import Image
from collections import defaultdict
import pytesseract
from datetime import datetime

# Paths
PROJECT_ROOT = Path(__file__).parent.parent.parent
PDF_DIR = PROJECT_ROOT / "public" / "documents"
OUTPUT_DIR = PROJECT_ROOT / "public" / "product-images" / "extracted-makita"

# SKU pattern for Makita products
SKU_PATTERNS = [
    r'\b[A-Z]{2,}\d{2,}[A-Z]{0,}\d*\b',  # e.g., DHP484, BL1860B, DC18RC
    r'\b\d{6}\b',  # 6-digit SKUs
    r'\b\d{5}-\d\b',  # e.g., 19171-8
]

# Settings
WEBP_QUALITY = 85
MIN_IMAGE_SIZE = 100  # pixels
OCR_ENABLED = True
TESSERACT_PATH = r"C:\Program Files\Tesseract-OCR\tesseract.exe"  # Update if different

def setup_tesseract():
    """Configure Tesseract OCR"""
    try:
        pytesseract.pytesseract.tesseract_cmd = TESSERACT_PATH
        # Test if working
        pytesseract.get_tesseract_version()
        return True
    except Exception as e:
        print(f"⚠️  Tesseract OCR not available: {e}")
        print(f"   OCR features will be disabled")
        return False

def extract_skus_from_text(text):
    """Extract SKU codes from text using patterns"""
    skus = set()
    
    for pattern in SKU_PATTERNS:
        matches = re.findall(pattern, text, re.IGNORECASE)
        skus.update(matches)
    
    # Filter out common false positives
    filtered_skus = set()
    for sku in skus:
        # Skip very common numbers that aren't SKUs
        if sku.isdigit() and len(sku) < 5:
            continue
        # Skip if all letters (likely not a SKU)
        if sku.isalpha():
            continue
        filtered_skus.add(sku)
    
    return filtered_skus

def extract_text_from_bbox(page, bbox, expand=20):
    """Extract text from a bounding box area (with expansion for nearby text)"""
    # Expand bbox to catch nearby text/tables
    x0, y0, x1, y1 = bbox
    expanded_bbox = (
        max(0, x0 - expand),
        max(0, y0 - expand),
        min(page.rect.width, x1 + expand),
        min(page.rect.height, y1 + expand)
    )
    
    # Extract text from expanded area
    text = page.get_text("text", clip=expanded_bbox)
    return text

def detect_table_structure(text_lines):
    """Detect if text represents a table and extract SKUs from top row"""
    skus = set()
    
    # Look for horizontal patterns that suggest table headers
    # Typically: SKU1  SKU2  SKU3  SKU4
    lines = [line.strip() for line in text_lines.split('\n') if line.strip()]
    
    for i, line in enumerate(lines[:5]):  # Check first 5 lines for header
        # Check if line contains multiple potential SKUs
        line_skus = extract_skus_from_text(line)
        
        if len(line_skus) >= 2:  # Table header typically has multiple SKUs
            skus.update(line_skus)
            print(f"      📋 Found table header with {len(line_skus)} SKUs: {', '.join(list(line_skus)[:5])}...")
            
            # Also check next few lines for additional SKUs
            for next_line in lines[i+1:min(i+4, len(lines))]:
                additional_skus = extract_skus_from_text(next_line)
                if additional_skus:
                    skus.update(additional_skus)
    
    return skus

def ocr_image_for_skus(image):
    """Use OCR to detect SKUs within the image itself"""
    if not OCR_ENABLED:
        return set()
    
    try:
        # Convert PIL Image to format suitable for OCR
        text = pytesseract.image_to_string(image)
        skus = extract_skus_from_text(text)
        return skus
    except Exception as e:
        print(f"      ⚠️  OCR failed: {e}")
        return set()

def extract_images_from_pdf(pdf_path):
    """Extract all images from PDF with their locations"""
    
    print(f"\n📄 Processing: {pdf_path.name}")
    
    try:
        doc = fitz.open(pdf_path)
    except Exception as e:
        print(f"   ❌ Error opening PDF: {e}")
        return []
    
    images_data = []
    total_images = 0
    
    print(f"   📖 Total pages: {len(doc)}")
    print(f"   🔍 Extracting images and detecting SKUs...\n")
    
    for page_num in range(len(doc)):
        page = doc[page_num]
        image_list = page.get_images(full=True)
        
        if image_list:
            print(f"   Page {page_num + 1}: Found {len(image_list)} images")
        
        for img_index, img_info in enumerate(image_list):
            total_images += 1
            
            try:
                # Get image reference
                xref = img_info[0]
                
                # Extract image
                base_image = doc.extract_image(xref)
                image_bytes = base_image["image"]
                image_ext = base_image["ext"]
                
                # Convert to PIL Image
                pil_image = Image.open(io.BytesIO(image_bytes))
                
                # Skip very small images (likely icons/decorations)
                if pil_image.width < MIN_IMAGE_SIZE or pil_image.height < MIN_IMAGE_SIZE:
                    print(f"      ⏭️  Skipped small image ({pil_image.width}x{pil_image.height})")
                    continue
                
                # Get image position on page
                img_rects = page.get_image_rects(xref)
                if img_rects:
                    bbox = img_rects[0]  # Use first occurrence
                else:
                    bbox = (0, 0, page.rect.width, page.rect.height)
                
                # Extract text near image (potential table)
                nearby_text = extract_text_from_bbox(page, bbox, expand=50)
                
                # Detect SKUs from nearby tables
                table_skus = detect_table_structure(nearby_text)
                
                # Also extract all SKUs from nearby text
                all_nearby_skus = extract_skus_from_text(nearby_text)
                
                # OCR the image itself for embedded SKUs
                image_skus = ocr_image_for_skus(pil_image)
                
                # Combine all SKUs
                all_skus = table_skus | all_nearby_skus | image_skus
                
                print(f"      ✓ Image {img_index + 1}: {pil_image.width}x{pil_image.height}")
                print(f"         SKUs found: {len(all_skus)} - {', '.join(sorted(all_skus)[:5])}{'...' if len(all_skus) > 5 else ''}")
                
                images_data.append({
                    'page': page_num + 1,
                    'index': img_index,
                    'image': pil_image,
                    'skus': all_skus,
                    'bbox': bbox,
                    'original_ext': image_ext
                })
                
            except Exception as e:
                print(f"      ❌ Error extracting image {img_index}: {e}")
                continue
    
    doc.close()
    
    print(f"\n   ✅ Extracted {len(images_data)} images (total scanned: {total_images})")
    return images_data

def create_filename_from_skus(skus, page, index, max_skus=10):
    """Create a filename from SKUs"""
    
    if not skus:
        return f"page{page:03d}_img{index:02d}"
    
    # Sort SKUs for consistency
    sku_list = sorted(list(skus))
    
    # Limit number of SKUs in filename to avoid too long names
    if len(sku_list) > max_skus:
        # Use first few and add indicator
        filename_skus = sku_list[:max_skus]
        filename = '+'.join(filename_skus) + f'+{len(sku_list)-max_skus}more'
    else:
        filename = '+'.join(sku_list)
    
    # Add page and index for uniqueness
    filename = f"{filename}_p{page:03d}_i{index:02d}"
    
    # Clean filename (remove invalid characters)
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    
    # Limit total filename length (Windows has 260 char path limit)
    if len(filename) > 150:
        # Truncate and add hash
        import hashlib
        hash_suffix = hashlib.md5(filename.encode()).hexdigest()[:8]
        filename = filename[:140] + '_' + hash_suffix
    
    return filename

def convert_to_webp(pil_image, output_path, quality=WEBP_QUALITY):
    """Convert PIL image to WebP format"""
    try:
        # Convert to RGB if necessary (WebP doesn't support all modes)
        if pil_image.mode in ('RGBA', 'LA', 'P'):
            # Convert RGBA to RGB with white background
            if pil_image.mode == 'RGBA':
                background = Image.new('RGB', pil_image.size, (255, 255, 255))
                background.paste(pil_image, mask=pil_image.split()[-1])
                pil_image = background
            else:
                pil_image = pil_image.convert('RGB')
        
        # Save as WebP
        pil_image.save(output_path, 'WEBP', quality=quality, method=6)
        return True
    except Exception as e:
        print(f"      ❌ Error converting to WebP: {e}")
        return False

def save_images(images_data, output_dir):
    """Save extracted images as WebP with SKU-based names"""
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"\n💾 Saving images to: {output_dir}")
    print()
    
    saved_count = 0
    skipped_count = 0
    
    for img_data in images_data:
        # Create filename
        filename = create_filename_from_skus(
            img_data['skus'],
            img_data['page'],
            img_data['index']
        )
        
        output_path = output_dir / f"{filename}.webp"
        
        # Convert and save
        if convert_to_webp(img_data['image'], output_path):
            file_size = output_path.stat().st_size / 1024  # KB
            print(f"   ✅ {output_path.name}")
            print(f"      Size: {file_size:.1f} KB, Dimensions: {img_data['image'].width}x{img_data['image'].height}")
            print(f"      SKUs: {len(img_data['skus'])} - {', '.join(sorted(img_data['skus'])[:5])}...")
            print()
            saved_count += 1
        else:
            skipped_count += 1
    
    return saved_count, skipped_count

def create_sku_mapping(images_data, output_dir):
    """Create a mapping file of SKUs to images"""
    
    mapping_file = output_dir / 'sku_to_image_mapping.json'
    
    import json
    
    # Create mapping: SKU -> list of images
    sku_to_images = defaultdict(list)
    
    for img_data in images_data:
        filename = create_filename_from_skus(
            img_data['skus'],
            img_data['page'],
            img_data['index']
        ) + '.webp'
        
        for sku in img_data['skus']:
            sku_to_images[sku].append({
                'filename': filename,
                'page': img_data['page'],
                'all_skus': sorted(list(img_data['skus']))
            })
    
    # Save mapping
    mapping_data = {
        'generated': datetime.now().isoformat(),
        'total_skus': len(sku_to_images),
        'total_images': len(images_data),
        'mapping': dict(sku_to_images)
    }
    
    with open(mapping_file, 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, indent=2)
    
    print(f"   📝 SKU mapping saved: {mapping_file.name}")
    print(f"      {len(sku_to_images)} unique SKUs mapped to images")

def main():
    print("=" * 80)
    print("EXTRACT PDF IMAGES WITH SKU DETECTION")
    print("=" * 80)
    print()
    
    # Setup OCR
    global OCR_ENABLED
    OCR_ENABLED = setup_tesseract()
    
    # Find Makita catalog PDF
    pdf_file = PDF_DIR / "makita-catalogus-2022-nl.pdf"
    
    if not pdf_file.exists():
        print(f"❌ PDF not found: {pdf_file}")
        print(f"\n📁 Available PDFs in {PDF_DIR}:")
        for pdf in PDF_DIR.glob("*.pdf"):
            print(f"   - {pdf.name}")
        return
    
    # Extract images
    images_data = extract_images_from_pdf(pdf_file)
    
    if not images_data:
        print("\n⚠️  No images extracted!")
        return
    
    # Save images
    saved, skipped = save_images(images_data, OUTPUT_DIR)
    
    # Create SKU mapping
    create_sku_mapping(images_data, OUTPUT_DIR)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 SUMMARY")
    print("=" * 80)
    print(f"   ✅ Images saved: {saved}")
    print(f"   ⏭️  Images skipped: {skipped}")
    print(f"   📁 Output directory: {OUTPUT_DIR}")
    print(f"   💾 Format: WebP (quality {WEBP_QUALITY})")
    
    # Calculate total SKUs found
    all_skus = set()
    for img_data in images_data:
        all_skus.update(img_data['skus'])
    
    print(f"   🏷️  Unique SKUs detected: {len(all_skus)}")
    
    # Calculate storage
    total_size = sum(f.stat().st_size for f in OUTPUT_DIR.glob("*.webp"))
    print(f"   💿 Total size: {total_size / 1024 / 1024:.1f} MB")
    
    print("\n💡 NEXT STEPS:")
    print("   1. Review extracted images in output directory")
    print("   2. Check sku_to_image_mapping.json for SKU associations")
    print("   3. Update products.json with new image paths")
    print("   4. Verify SKU detection accuracy")
    
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
