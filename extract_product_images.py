#!/usr/bin/env python3
"""Extract product images from PDF catalogs and link them to SKUs.

This script:
1. Reads existing JSON outputs from old_analyze_product_pdfs.py
2. Extracts images from PDFs using pymupdf (fitz)
3. Matches images to tables/SKUs using page number and bbox proximity
4. Converts images to WebP format for optimal web performance
5. Saves images with structured naming: {pdf_stem}/{category_slug}_{sku}.webp
6. Optionally updates JSON files with image paths

Usage:
    python extract_product_images.py [--update-json] [--quality 85] [--max-width 1200]
"""

import argparse
import io
import json
import re
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

try:
    import fitz  # pymupdf
except ImportError:
    print("ERROR: pymupdf not installed. Run: pip install pymupdf")
    sys.exit(1)

try:
    from PIL import Image
    import numpy as np
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow numpy")
    sys.exit(1)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PDF_DIR = Path(r"C:\Users\nicol\Projects\DemaWebshop\dema-webshop\public\documents\Product_pdfs")
JSON_DIR = PDF_DIR / "json"
IMAGE_OUTPUT_DIR = PDF_DIR / "images"

# Minimum image dimensions to extract (skip tiny icons/logos)
MIN_IMAGE_WIDTH = 50
MIN_IMAGE_HEIGHT = 50

# Maximum distance (in PDF points) between image bottom and table top
# for them to be considered related
MAX_IMAGE_TABLE_DISTANCE = 300


# ---------------------------------------------------------------------------
# Utilities
# ---------------------------------------------------------------------------

def slugify(text: str) -> str:
    """Convert text to URL-friendly slug."""
    if not text:
        return ""
    text = text.lower().strip()
    text = re.sub(r"[äàáâã]", "a", text)
    text = re.sub(r"[ëèéê]", "e", text)
    text = re.sub(r"[ïìíî]", "i", text)
    text = re.sub(r"[öòóôõ]", "o", text)
    text = re.sub(r"[üùúû]", "u", text)
    text = re.sub(r"[ñ]", "n", text)
    text = re.sub(r"[ß]", "ss", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text


def load_json_records(json_path: Path) -> List[Dict[str, Any]]:
    """Load records from a JSON file."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # Handle both list and dict payloads
        if isinstance(data, list):
            return data
        elif isinstance(data, dict):
            # Try to extract records from common structures
            if "variations" in data:
                return data["variations"]
            elif "products" in data:
                return data["products"]
            elif "items" in data:
                return data["items"]
            else:
                # Return as single-item list
                return [data]
        return []
    except Exception as e:
        print(f"  Warning: Could not load {json_path}: {e}")
        return []


def get_page_records(records: List[Dict[str, Any]], page_num: int) -> List[Dict[str, Any]]:
    """Get all records from a specific page.
    
    Supports both flat format (page field) and legacy format (_context.page_number).
    """
    page_records = []
    for rec in records:
        # Try flat format first
        rec_page = rec.get("page")
        if rec_page is None:
            # Fallback to legacy format
            ctx = rec.get("_context") or {}
            rec_page = ctx.get("page_number")
        
        if rec_page == page_num:
            page_records.append(rec)
    return page_records


def get_category_from_records(records: List[Dict[str, Any]]) -> Optional[str]:
    """Extract category from a list of records.
    
    Supports both flat format (series_name) and legacy format (_context.category).
    """
    for rec in records:
        # Try flat format first
        category = rec.get("series_name")
        if category:
            return category
        # Fallback to legacy format
        ctx = rec.get("_context") or {}
        category = ctx.get("category")
        if category:
            return category
    return None


def get_skus_from_records(records: List[Dict[str, Any]]) -> List[str]:
    """Extract all SKUs from a list of records."""
    skus = []
    for rec in records:
        sku = rec.get("sku")
        if sku:
            skus.append(str(sku))
    return skus


def get_sku_series(skus: List[str]) -> Optional[str]:
    """Extract common prefix from SKUs to form a series identifier."""
    if not skus:
        return None
    
    # Find common prefix
    if len(skus) == 1:
        # Single SKU - use first part before digits change
        sku = skus[0]
        match = re.match(r"^([A-Za-z]+\d*)", sku)
        if match:
            return match.group(1)
        return sku[:8] if len(sku) > 8 else sku
    
    # Multiple SKUs - find common prefix
    prefix = skus[0]
    for sku in skus[1:]:
        while prefix and not sku.startswith(prefix):
            prefix = prefix[:-1]
    
    return prefix if prefix else skus[0][:8]


# ---------------------------------------------------------------------------
# Image Extraction
# ---------------------------------------------------------------------------

def extract_images_from_page(
    page: fitz.Page,
    doc: fitz.Document,
    min_width: int = MIN_IMAGE_WIDTH,
    min_height: int = MIN_IMAGE_HEIGHT,
) -> List[Dict[str, Any]]:
    """Extract all images from a PDF page with their bounding boxes."""
    images = []
    
    for img_info in page.get_images(full=True):
        xref = img_info[0]
        
        try:
            # Get image data
            base_image = doc.extract_image(xref)
            if not base_image:
                continue
            
            image_bytes = base_image.get("image")
            image_ext = base_image.get("ext", "png")
            width = base_image.get("width", 0)
            height = base_image.get("height", 0)
            
            # Skip small images (icons, logos, etc.)
            if width < min_width or height < min_height:
                continue
            
            # Get image position on page
            img_rects = page.get_image_rects(xref)
            if not img_rects:
                continue
            
            # Use first rect (image might appear multiple times)
            rect = img_rects[0]
            
            images.append({
                "xref": xref,
                "bbox": (rect.x0, rect.y0, rect.x1, rect.y1),
                "width": width,
                "height": height,
                "bytes": image_bytes,
                "ext": image_ext,
            })
        except Exception as e:
            print(f"    Warning: Could not extract image xref={xref}: {e}")
            continue
    
    return images


def has_black_background(img: Image.Image, threshold: int = 30, edge_sample_pct: float = 0.1) -> bool:
    """Detect if an image has a predominantly black background.
    
    Samples pixels from the edges of the image and checks if they are
    predominantly dark (close to black).
    
    Args:
        img: PIL Image to analyze
        threshold: Maximum RGB value to consider as "black" (0-255)
        edge_sample_pct: Percentage of edge pixels to sample
    
    Returns:
        True if the image appears to have a black background
    """
    try:
        # Convert to RGB for consistent analysis
        if img.mode != "RGB":
            analyze_img = img.convert("RGB")
        else:
            analyze_img = img
        
        arr = np.array(analyze_img)
        height, width = arr.shape[:2]
        
        # Sample pixels from all 4 edges
        edge_pixels = []
        
        # Top and bottom edges
        sample_step = max(1, int(width * (1 - edge_sample_pct)))
        for x in range(0, width, max(1, width // 20)):
            edge_pixels.append(arr[0, x])  # Top
            edge_pixels.append(arr[height - 1, x])  # Bottom
        
        # Left and right edges
        for y in range(0, height, max(1, height // 20)):
            edge_pixels.append(arr[y, 0])  # Left
            edge_pixels.append(arr[y, width - 1])  # Right
        
        if not edge_pixels:
            return False
        
        edge_arr = np.array(edge_pixels)
        
        # Check if most edge pixels are dark (all RGB channels below threshold)
        is_dark = np.all(edge_arr < threshold, axis=1)
        dark_ratio = np.mean(is_dark)
        
        return dark_ratio > 0.7  # 70% of edge pixels are dark
        
    except Exception:
        return False


def replace_black_with_white(img: Image.Image, threshold: int = 30) -> Image.Image:
    """Replace black/near-black pixels with white.
    
    Args:
        img: PIL Image to process
        threshold: Maximum RGB value to consider as "black" (0-255)
    
    Returns:
        New image with black pixels replaced by white
    """
    try:
        # Convert to RGBA to handle transparency properly
        if img.mode != "RGBA":
            img = img.convert("RGBA")
        
        arr = np.array(img)
        
        # Find pixels where all RGB channels are below threshold
        # (ignore alpha channel for detection)
        is_black = np.all(arr[:, :, :3] < threshold, axis=2)
        
        # Replace black pixels with white (255, 255, 255, 255)
        arr[is_black] = [255, 255, 255, 255]
        
        return Image.fromarray(arr, mode="RGBA")
        
    except Exception:
        return img


def convert_to_webp(
    image_bytes: bytes,
    output_path: Path,
    quality: int = 85,
    max_width: Optional[int] = None,
) -> bool:
    """Convert image bytes to WebP format and save."""
    try:
        img = Image.open(io.BytesIO(image_bytes))
        
        # Check for black background and replace with white
        if has_black_background(img):
            img = replace_black_with_white(img)
        
        # Convert to RGB if necessary (WebP doesn't support all modes)
        if img.mode in ("RGBA", "LA", "P"):
            # Keep alpha for RGBA
            if img.mode == "RGBA":
                pass  # WebP supports RGBA
            else:
                img = img.convert("RGBA")
        elif img.mode != "RGB":
            img = img.convert("RGB")
        
        # Resize if max_width specified
        if max_width and img.width > max_width:
            ratio = max_width / img.width
            new_height = int(img.height * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)
        
        # Save as WebP
        output_path.parent.mkdir(parents=True, exist_ok=True)
        img.save(output_path, "WEBP", quality=quality, method=6)
        return True
    except Exception as e:
        print(f"    Warning: Could not convert image to WebP: {e}")
        return False


def generate_image_filename(
    pdf_stem: str,
    page_num: int,
    category: Optional[str],
    sku_series: Optional[str],
    skus: List[str],
    image_index: int,
    max_length: int = 200,  # Leave room for path + extension
) -> str:
    """Generate a descriptive filename for an extracted image.
    
    Format: {pdf}__p{page}__{category}__{sku_series}__{skus}[__{index}].webp
    
    Components:
    - pdf: PDF filename stem (e.g., "zuigerpompen")
    - page: Page number with 'p' prefix (e.g., "p5")
    - category: Slugified category (e.g., "hercules-2000")
    - sku_series: Common SKU prefix (e.g., "x0330")
    - skus: First few SKUs joined (e.g., "x0330233-x0330186")
    - index: Image index if multiple on same page (e.g., "2")
    
    Total filename is capped at max_length to stay under filesystem limits.
    """
    parts = []
    
    # 1. PDF stem (always include)
    pdf_slug = slugify(pdf_stem) or "unknown"
    parts.append(pdf_slug[:30])  # Cap PDF name
    
    # 2. Page number (always include)
    parts.append(f"p{page_num}")
    
    # 3. Category (if available)
    if category:
        cat_slug = slugify(category)
        if cat_slug:
            parts.append(cat_slug[:40])  # Cap category
    
    # 4. SKU series (if available)
    if sku_series:
        series_slug = slugify(sku_series)
        if series_slug:
            parts.append(series_slug[:20])  # Cap series
    
    # 5. SKUs (first 3, joined with hyphen)
    if skus:
        sku_slugs = [slugify(s) or s.lower() for s in skus[:3]]
        sku_part = "-".join(sku_slugs)
        if sku_part:
            parts.append(sku_part[:50])  # Cap SKUs
    
    # 6. Image index (if multiple images on same page)
    if image_index > 0:
        parts.append(f"img{image_index + 1}")
    
    # Join with double underscore for readability
    filename = "__".join(parts)
    
    # Ensure we don't exceed max length (leave room for .webp)
    if len(filename) > max_length - 5:
        filename = filename[:max_length - 5]
        # Clean up any trailing underscores or hyphens
        filename = filename.rstrip("-_")
    
    return filename + ".webp"


# ---------------------------------------------------------------------------
# Main Processing
# ---------------------------------------------------------------------------

def process_pdf(
    pdf_path: Path,
    json_records: List[Dict[str, Any]],
    output_dir: Path,
    quality: int = 85,
    max_width: Optional[int] = None,
) -> List[Dict[str, Any]]:
    """Process a single PDF and extract images linked to SKUs."""
    extracted = []
    pdf_stem = pdf_path.stem
    pdf_output_dir = output_dir / slugify(pdf_stem)
    
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        print(f"  Error opening PDF: {e}")
        return []
    
    print(f"  Processing {pdf_path.name} ({len(doc)} pages)...")
    
    # Group records by page (supports both flat and legacy formats)
    pages_with_records = set()
    for rec in json_records:
        # Try flat format first
        page_num = rec.get("page")
        if page_num is None:
            # Fallback to legacy format
            ctx = rec.get("_context") or {}
            page_num = ctx.get("page_number")
        if page_num:
            pages_with_records.add(page_num)
    
    for page_num in sorted(pages_with_records):
        if page_num < 1 or page_num > len(doc):
            continue
        
        page = doc[page_num - 1]  # 0-indexed
        page_records = get_page_records(json_records, page_num)
        
        if not page_records:
            continue
        
        # Extract images from this page
        images = extract_images_from_page(page, doc)
        
        if not images:
            continue
        
        # Get category and SKUs for this page
        category = get_category_from_records(page_records)
        skus = get_skus_from_records(page_records)
        sku_series = get_sku_series(skus)
        
        # Sort images by vertical position (top to bottom)
        images.sort(key=lambda x: x["bbox"][1])
        
        for img_idx, img_data in enumerate(images):
            filename = generate_image_filename(
                pdf_stem, page_num, category, sku_series, skus, img_idx
            )
            output_path = pdf_output_dir / filename
            
            # Convert and save
            if convert_to_webp(
                img_data["bytes"],
                output_path,
                quality=quality,
                max_width=max_width,
            ):
                relative_path = f"images/{slugify(pdf_stem)}/{filename}"
                
                extracted.append({
                    "pdf": pdf_path.name,
                    "page": page_num,
                    "category": category,
                    "sku_series": sku_series,
                    "skus": skus,
                    "image_path": relative_path,
                    "original_size": (img_data["width"], img_data["height"]),
                })
                
                print(f"    Page {page_num}: {filename} ({img_data['width']}x{img_data['height']})")
    
    doc.close()
    return extracted


def update_json_with_images(
    json_path: Path,
    image_mappings: List[Dict[str, Any]],
) -> int:
    """Update JSON file with image paths for matching records.
    
    Adds two fields:
    - series_image: The first/main image for the page (shared by all SKUs on that page)
    - image: Same as series_image for now (can be per-SKU in future)
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  Warning: Could not read {json_path}: {e}")
        return 0
    
    updated_count = 0
    
    # Build page -> image mapping (first image per page = series image)
    page_images: Dict[int, str] = {}
    for mapping in image_mappings:
        page = mapping.get("page")
        image_path = mapping.get("image_path")
        if page and image_path:
            # Use first image for each page (usually the main product image)
            if page not in page_images:
                page_images[page] = image_path
    
    def update_record(rec: Dict[str, Any]) -> bool:
        # Support both flat format (page) and legacy format (_context.page_number)
        page_num = rec.get("page")
        if page_num is None:
            ctx = rec.get("_context") or {}
            page_num = ctx.get("page_number")
        
        if page_num and page_num in page_images:
            image_path = page_images[page_num]
            # series_image: shared by all SKUs on this page
            rec["series_image"] = image_path
            # image: per-SKU image (same as series_image for now, can be overridden later)
            if not rec.get("image"):
                rec["image"] = image_path
            return True
        return False
    
    # Handle both list and dict structures
    if isinstance(data, list):
        for rec in data:
            if isinstance(rec, dict) and update_record(rec):
                updated_count += 1
    elif isinstance(data, dict):
        # Try common nested structures
        for key in ["variations", "products", "items"]:
            if key in data and isinstance(data[key], list):
                for rec in data[key]:
                    if isinstance(rec, dict) and update_record(rec):
                        updated_count += 1
    
    if updated_count > 0:
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    return updated_count


def main():
    parser = argparse.ArgumentParser(
        description="Extract product images from PDF catalogs"
    )
    parser.add_argument(
        "--update-json",
        action="store_true",
        help="Update JSON files with image paths",
    )
    parser.add_argument(
        "--quality",
        type=int,
        default=85,
        help="WebP quality (1-100, default: 85)",
    )
    parser.add_argument(
        "--max-width",
        type=int,
        default=1200,
        help="Maximum image width in pixels (default: 1200)",
    )
    parser.add_argument(
        "--pdf",
        type=str,
        help="Process only this PDF (filename)",
    )
    
    args = parser.parse_args()
    
    print("=" * 60)
    print("Product Image Extraction")
    print("=" * 60)
    print(f"PDF directory: {PDF_DIR}")
    print(f"JSON directory: {JSON_DIR}")
    print(f"Output directory: {IMAGE_OUTPUT_DIR}")
    print(f"Quality: {args.quality}")
    print(f"Max width: {args.max_width}px")
    print(f"Update JSON: {args.update_json}")
    print("=" * 60)
    
    # Create output directory
    IMAGE_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    
    # Find all PDFs and their corresponding JSONs
    pdf_files = list(PDF_DIR.glob("*.pdf"))
    
    if args.pdf:
        pdf_files = [p for p in pdf_files if p.name.lower() == args.pdf.lower()]
        if not pdf_files:
            print(f"ERROR: PDF not found: {args.pdf}")
            sys.exit(1)
    
    total_images = 0
    total_updated = 0
    
    for pdf_path in sorted(pdf_files):
        json_path = JSON_DIR / f"{pdf_path.stem}.json"
        
        if not json_path.exists():
            print(f"\nSkipping {pdf_path.name} (no JSON found)")
            continue
        
        print(f"\n{pdf_path.name}")
        
        # Load JSON records
        records = load_json_records(json_path)
        if not records:
            print("  No records found in JSON")
            continue
        
        # Extract images
        image_mappings = process_pdf(
            pdf_path,
            records,
            IMAGE_OUTPUT_DIR,
            quality=args.quality,
            max_width=args.max_width,
        )
        
        total_images += len(image_mappings)
        
        # Update JSON if requested
        if args.update_json and image_mappings:
            updated = update_json_with_images(json_path, image_mappings)
            total_updated += updated
            if updated:
                print(f"  Updated {updated} records with image paths")
    
    print("\n" + "=" * 60)
    print(f"Total images extracted: {total_images}")
    if args.update_json:
        print(f"Total records updated: {total_updated}")
    print("=" * 60)


if __name__ == "__main__":
    main()
