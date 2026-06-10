#!/usr/bin/env python3
"""Extract product images from PDF catalogs and link them to SKUs.

This script:
1. Reads existing JSON outputs from old_analyze_product_pdfs.py
2. Extracts images from PDFs using pymupdf (fitz)
3. Matches images to specific series using vertical proximity on the page
4. Converts images to WebP format for optimal web performance
5. Saves images with structured naming: {pdf_stem}/{series_slug}_{sku}.webp
6. Updates JSON files with accurate image paths per series
7. Generates image-sku-mapping.json with complete SKU lists per image

Key improvements over naive page-level matching:
- Groups SKUs by series_name on each page
- Matches images to the nearest series below them (images appear above tables)
- Handles multiple series per page correctly
- Uses series_id for consistent image naming

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

# Optional OCR for SKU detection on images
try:
    import easyocr
    OCR_AVAILABLE = True
    OCR_READER = None  # Lazy initialization
except ImportError:
    OCR_AVAILABLE = False
    OCR_READER = None


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

PDF_DIR = Path(r"C:\Users\nicol\Projects\DemaWebshop\dema-webshop\public\documents\Product_pdfs")
JSON_DIR = PDF_DIR / "json"
IMAGE_OUTPUT_DIR = PDF_DIR / "images"
IMAGE_SKU_MAPPING_FILE = IMAGE_OUTPUT_DIR / "image-sku-mapping.json"

# Minimum image dimensions to extract (skip tiny icons/logos)
MIN_IMAGE_WIDTH = 100
MIN_IMAGE_HEIGHT = 100

# Minimum area (width * height) for product images
# Filters out small logos, icons, and brand marks
MIN_IMAGE_AREA = 10000  # e.g., 100x100 or 114x103 (rubber-slangen accessory images)

# Maximum aspect ratio deviation from square (filters out banners/strips)
# Ratio > 3.0 means very wide or very tall (likely a banner or logo strip)
MAX_ASPECT_RATIO = 4.0  # Allow slightly wider images (rubber-slangen hose images are ~3.05)

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


def group_records_by_series(records: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Group records by series_id for accurate image matching.
    
    Returns dict: series_id -> list of records
    """
    from collections import defaultdict
    groups: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    
    for rec in records:
        series_id = rec.get("series_id") or rec.get("series_name") or "unknown"
        groups[series_id].append(rec)
    
    return dict(groups)


def get_series_info(records: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Extract series metadata from a group of records.
    
    Returns dict with:
    - series_id: Unique identifier for the series
    - series_name: Human-readable name
    - skus: List of SKUs in this series
    - first_sku: First SKU (for naming)
    """
    if not records:
        return {"series_id": "unknown", "series_name": "Unknown", "skus": [], "first_sku": None}
    
    first = records[0]
    skus = [r.get("sku") for r in records if r.get("sku")]
    
    return {
        "series_id": first.get("series_id") or slugify(first.get("series_name", "unknown")),
        "series_name": first.get("series_name") or "Unknown",
        "skus": skus,
        "first_sku": skus[0] if skus else None,
    }


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
# Text/Table Position Detection
# ---------------------------------------------------------------------------

def find_text_positions_on_page(
    page: fitz.Page,
    search_texts: List[str],
) -> Dict[str, Tuple[float, float, float, float]]:
    """Find bounding boxes of specific text strings on a page.
    
    Returns dict: text -> (x0, y0, x1, y1) bbox
    """
    positions = {}
    
    for text in search_texts:
        if not text:
            continue
        # Search for the text on the page
        text_instances = page.search_for(text, quads=False)
        if text_instances:
            # Use first occurrence
            rect = text_instances[0]
            positions[text] = (rect.x0, rect.y0, rect.x1, rect.y1)
    
    return positions


def find_series_positions_on_page(
    page: fitz.Page,
    series_groups: Dict[str, List[Dict[str, Any]]],
) -> List[Dict[str, Any]]:
    """Find vertical positions of each series on a page.
    
    Uses SKU text search to determine where each series appears.
    Returns list of dicts with series_id, y_top, y_bottom, and series info.
    """
    series_positions = []
    
    for series_id, records in series_groups.items():
        info = get_series_info(records)
        skus = info["skus"]
        
        if not skus:
            continue
        
        # Search for SKUs to find table position
        y_positions = []
        for sku in skus[:5]:  # Check first 5 SKUs
            instances = page.search_for(sku, quads=False)
            for rect in instances:
                y_positions.append(rect.y0)
        
        if y_positions:
            y_top = min(y_positions)
            y_bottom = max(y_positions) + 20  # Add some padding
            
            series_positions.append({
                "series_id": series_id,
                "series_name": info["series_name"],
                "skus": skus,
                "first_sku": info["first_sku"],
                "y_top": y_top,
                "y_bottom": y_bottom,
            })
    
    # Sort by vertical position (top to bottom)
    series_positions.sort(key=lambda x: x["y_top"])
    
    return series_positions


def match_image_to_series(
    image_bbox: Tuple[float, float, float, float],
    series_positions: List[Dict[str, Any]],
    max_distance: float = 200,
) -> Optional[Dict[str, Any]]:
    """Match an image to the nearest series below it.
    
    Images typically appear above their corresponding tables.
    Returns the matched series info or None.
    """
    img_x0, img_y0, img_x1, img_y1 = image_bbox
    img_bottom = img_y1
    
    best_match = None
    best_distance = float("inf")
    
    for series in series_positions:
        series_top = series["y_top"]
        
        # Image should be above or overlapping with the series
        if img_bottom <= series_top + max_distance:
            distance = series_top - img_bottom
            if distance < 0:
                distance = abs(distance)  # Overlapping
            
            if distance < best_distance:
                best_distance = distance
                best_match = series
    
    # If no match found looking down, try matching to nearest series
    if best_match is None and series_positions:
        for series in series_positions:
            series_top = series["y_top"]
            distance = abs(img_bottom - series_top)
            if distance < best_distance and distance < max_distance * 2:
                best_distance = distance
                best_match = series
    
    return best_match


# ---------------------------------------------------------------------------
# Image Extraction
# ---------------------------------------------------------------------------

def get_ocr_reader():
    """Get or initialize the OCR reader (lazy loading)."""
    global OCR_READER
    if OCR_AVAILABLE and OCR_READER is None:
        print("  Initializing OCR reader (first time only)...")
        OCR_READER = easyocr.Reader(['en'], gpu=False, verbose=False)
    return OCR_READER


def extract_skus_from_image(image_bytes: bytes, known_sku_patterns: List[str] = None) -> List[str]:
    """Use OCR to detect SKU/product numbers visible on the image.
    
    Looks for patterns like:
    - Pure numbers: 36744, 369007
    - Alphanumeric codes: ABSB02090, LF1201, 369430-2IVR
    - Model numbers with dashes/dots
    
    Note: OCR is slow and may not find SKUs on all images. 
    Falls back gracefully if no SKUs detected.
    
    Returns list of detected SKUs, sorted by confidence.
    """
    if not OCR_AVAILABLE:
        return []
    
    try:
        reader = get_ocr_reader()
        if reader is None:
            return []
        
        # Convert bytes to PIL Image
        img = Image.open(io.BytesIO(image_bytes))
        
        # Run OCR
        results = reader.readtext(np.array(img), detail=1)
        
        detected_skus = []
        
        # SKU patterns to look for - must be specific enough to avoid false positives
        sku_patterns = [
            r'\b\d{5,8}\b',  # 5-8 digit numbers (e.g., 36744, 369007)
            r'\b[A-Z]{2,5}\d{3,6}[A-Z]?\b',  # Letter prefix + numbers (e.g., ABSB02090)
            r'\b\d{5,6}[-/]\d{1,3}[A-Z]*\b',  # Numbers with suffix (e.g., 369430-2IVR)
            r'\b[A-Z]{1,3}\d{4,5}\b',  # Short prefix + numbers (e.g., LF1201)
        ]
        
        # Words to exclude (brand names, common text)
        exclude_words = {'AIRPRESS', 'COMPRESSOREN', 'WWW', 'NET', 'COMBI', 'DRY', 'APS'}
        
        for bbox, text, confidence in results:
            if confidence < 0.6:  # Higher threshold for reliability
                continue
            
            text = text.strip().upper()
            
            # Skip if it's a known brand/common word
            if text in exclude_words:
                continue
            
            # Check against known SKU patterns
            for pattern in sku_patterns:
                matches = re.findall(pattern, text)
                for match in matches:
                    if len(match) >= 5 and match not in exclude_words:  # Minimum length for SKU
                        detected_skus.append(match)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_skus = []
        for sku in detected_skus:
            if sku not in seen:
                seen.add(sku)
                unique_skus.append(sku)
        
        return unique_skus[:3]  # Return up to 3 SKUs
        
    except Exception as e:
        return []


def is_likely_logo_or_brand(
    width: int,
    height: int,
    min_area: int = MIN_IMAGE_AREA,
    max_aspect_ratio: float = MAX_ASPECT_RATIO,
) -> bool:
    """Detect if an image is likely a logo or brand image rather than a product.
    
    Filters based on:
    - Area too small (logos/icons)
    - Extreme aspect ratio (banners/strips)
    """
    area = width * height
    if area < min_area:
        return True
    
    # Check aspect ratio (both wide and tall extremes)
    if height > 0:
        ratio = max(width / height, height / width)
        if ratio > max_aspect_ratio:
            return True
    
    return False


def is_background_image(image_bytes: bytes, bar_height_pct: float = 0.1, threshold: int = 20) -> bool:
    """Detect if an image is a background/decorative image rather than a product.
    
    Checks for:
    - Solid black bars at top or bottom (cropped backgrounds)
    - Very uniform color distribution (floor/wall textures)
    - Wide banner-style images with dark colors (factory/lifestyle shots)
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        arr = np.array(img)
        h, w = arr.shape[:2]
        bar_h = max(5, int(h * bar_height_pct))
        
        # Check top bar for solid black
        top_bar = arr[:bar_h, :, :]
        top_mean = np.mean(top_bar)
        top_std = np.std(top_bar)
        
        # Check bottom bar for solid black
        bottom_bar = arr[-bar_h:, :, :]
        bottom_mean = np.mean(bottom_bar)
        bottom_std = np.std(bottom_bar)
        
        # Solid black bar: very dark (mean < threshold) and uniform (std < threshold)
        has_black_top = top_mean < threshold and top_std < threshold
        has_black_bottom = bottom_mean < threshold and bottom_std < threshold
        
        if has_black_top or has_black_bottom:
            return True
        
        # Check for very uniform images (likely floor/wall textures)
        overall_std = np.std(arr)
        if overall_std < 25:
            return True
        
        # Check for wide banner-style images with dark colors (factory/lifestyle shots)
        # These are typically decorative images, not product photos
        aspect_ratio = w / h
        brightness = np.mean(arr)
        
        # Wide images (ratio > 2.0) that are dark (brightness < 130) are likely factory shots
        if aspect_ratio > 2.0 and brightness < 130:
            return True
        
        # Very wide images (ratio > 2.5) are almost always decorative banners
        if aspect_ratio > 2.5:
            return True
        
        return False
        
    except Exception:
        return False


def extract_images_from_page(
    page: fitz.Page,
    doc: fitz.Document,
    min_width: int = MIN_IMAGE_WIDTH,
    min_height: int = MIN_IMAGE_HEIGHT,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Extract all images from a PDF page with their bounding boxes.
    
    Returns:
        Tuple of (product_images, brand_images)
        
    Product images pass all filters.
    Brand images are those filtered out due to size/aspect ratio.
    """
    product_images = []
    brand_images = []
    
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
            
            # Get image position on page
            img_rects = page.get_image_rects(xref)
            if not img_rects:
                continue
            
            # Use first rect (image might appear multiple times)
            rect = img_rects[0]
            
            img_data = {
                "xref": xref,
                "bbox": (rect.x0, rect.y0, rect.x1, rect.y1),
                "width": width,
                "height": height,
                "bytes": image_bytes,
                "ext": image_ext,
                "ocr_skus": [],  # Will be populated for product images
            }
            
            # Categorize: filter out non-product images
            if width < min_width or height < min_height:
                brand_images.append(img_data)
            elif is_likely_logo_or_brand(width, height):
                brand_images.append(img_data)
            elif is_background_image(image_bytes):
                brand_images.append(img_data)  # Background/decorative images
            else:
                # For product images, try to detect SKUs via OCR
                ocr_skus = extract_skus_from_image(image_bytes)
                img_data["ocr_skus"] = ocr_skus
                product_images.append(img_data)
                
        except Exception as e:
            print(f"    Warning: Could not extract image xref={xref}: {e}")
            continue
    
    return product_images, brand_images


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
    series_id: Optional[str] = None,
    series_name: Optional[str] = None,
    first_sku: Optional[str] = None,
    skus: Optional[List[str]] = None,
    ocr_skus: Optional[List[str]] = None,
    image_index: int = 0,
    total_images: int = 1,
    max_length: int = 200,
) -> str:
    """Generate a comprehensive filename linking image to its source and SKUs.
    
    Format: {pdf}__p{page}__{series_id}__{skus}[__v{N}].webp
    
    Components:
    - pdf: Source PDF name (e.g., "abs-persluchtbuizen")
    - page: Page number with 'p' prefix (e.g., "p5")
    - series_id: Product series/category (e.g., "abs-bocht-90")
    - skus: Up to 3 SKUs - prefers OCR-detected SKUs from image, falls back to table SKUs
    - v{N}: Variant number if multiple images for same series (e.g., "v2")
    
    Examples:
    - abs-persluchtbuizen__p5__abs-bocht-90__ABSB02090-ABSB02590-ABSB03290.webp
    - drukbuizen__p12__pvc-bocht-45__LF1201-LF1202__v2.webp
    
    This naming allows:
    - Tracing back to source PDF and page
    - Identifying which series/category
    - Knowing exactly which SKUs the image represents (from OCR if available)
    - Distinguishing multiple images for same series
    """
    parts = []
    
    # 1. PDF stem (source document)
    pdf_slug = slugify(pdf_stem) or "unknown"
    parts.append(pdf_slug[:30])
    
    # 2. Page number
    parts.append(f"p{page_num}")
    
    # 3. Series ID (product category)
    if series_id:
        parts.append(series_id[:40])
    
    # 4. SKUs - prefer OCR-detected SKUs (directly visible on image), then table SKUs
    sku_list = []
    if ocr_skus:
        # OCR-detected SKUs are most accurate - they're visible on the image
        sku_list = [str(s).strip() for s in ocr_skus[:3] if s]
    
    if not sku_list and skus:
        # Fall back to table SKUs
        sku_list = [str(s).strip() for s in skus[:3] if s]
    
    if not sku_list and first_sku:
        sku_list = [str(first_sku).strip()]
    
    if sku_list:
        # Join with hyphen, limit total length
        sku_part = "-".join(sku_list)
        if len(sku_part) > 50:
            # Truncate but keep at least first SKU
            sku_part = sku_list[0][:50]
        parts.append(sku_part)
    
    # 5. Variant number (only if multiple images)
    if total_images > 1:
        parts.append(f"v{image_index + 1}")
    
    # Join with double underscore
    filename = "__".join(parts)
    
    # Ensure we don't exceed max length
    if len(filename) > max_length - 5:
        filename = filename[:max_length - 5].rstrip("-_")
    
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
    save_brands: bool = True,
) -> List[Dict[str, Any]]:
    """Process a single PDF and extract images linked to specific series.
    
    Uses series-based matching to correctly link images to SKUs when
    multiple series appear on the same page.
    
    Brand/logo images are saved to images/brands/{pdf_stem}/ folder.
    """
    extracted = []
    pdf_stem = pdf_path.stem
    pdf_output_dir = output_dir / slugify(pdf_stem)
    brand_output_dir = output_dir / "brands" / slugify(pdf_stem)
    
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        print(f"  Error opening PDF: {e}")
        return []
    
    print(f"  Processing {pdf_path.name} ({len(doc)} pages)...")
    
    # Group records by page
    from collections import defaultdict
    records_by_page: Dict[int, List[Dict[str, Any]]] = defaultdict(list)
    for rec in json_records:
        page_num = rec.get("page")
        if page_num is None:
            ctx = rec.get("_context") or {}
            page_num = ctx.get("page_number")
        if page_num:
            records_by_page[page_num].append(rec)
    
    # Track which series have been assigned images (for deduplication)
    series_image_count: Dict[str, int] = defaultdict(int)
    
    for page_num in sorted(records_by_page.keys()):
        if page_num < 1 or page_num > len(doc):
            continue
        
        page = doc[page_num - 1]  # 0-indexed
        page_records = records_by_page[page_num]
        
        if not page_records:
            continue
        
        # Extract images from this page (product and brand images)
        images, brand_images = extract_images_from_page(page, doc)
        
        # Save brand images to separate folder
        if save_brands and brand_images:
            brand_output_dir.mkdir(parents=True, exist_ok=True)
            for idx, brand_img in enumerate(brand_images):
                brand_filename = f"{slugify(pdf_stem)}__p{page_num}__brand_{idx + 1}.webp"
                brand_path = brand_output_dir / brand_filename
                convert_to_webp(
                    brand_img["bytes"],
                    brand_path,
                    quality=quality,
                    max_width=max_width,
                )
        
        if not images:
            continue
        
        # Group records by series on this page
        series_groups = group_records_by_series(page_records)
        
        # Find vertical positions of each series
        series_positions = find_series_positions_on_page(page, series_groups)
        
        # Sort images by vertical position (top to bottom)
        images.sort(key=lambda x: x["bbox"][1])
        
        # First pass: count images per series to know totals
        image_series_assignments = []
        for img_data in images:
            matched_series = match_image_to_series(
                img_data["bbox"],
                series_positions,
                max_distance=MAX_IMAGE_TABLE_DISTANCE,
            )
            
            if matched_series:
                series_id = matched_series["series_id"]
            else:
                category = get_category_from_records(page_records)
                series_id = slugify(category) if category else f"page-{page_num}"
            
            image_series_assignments.append((img_data, matched_series, series_id))
        
        # Count total images per series on this page
        from collections import Counter
        page_series_counts = Counter(sid for _, _, sid in image_series_assignments)
        
        # Second pass: generate filenames with correct totals
        page_series_index: Dict[str, int] = defaultdict(int)
        
        for img_data, matched_series, series_id in image_series_assignments:
            if matched_series:
                series_name = matched_series["series_name"]
                skus = matched_series["skus"]
                first_sku = matched_series["first_sku"]
            else:
                category = get_category_from_records(page_records)
                series_name = category
                skus = get_skus_from_records(page_records)
                first_sku = skus[0] if skus else None
            
            # Get index and total for this series on this page
            img_idx = page_series_index[series_id]
            page_series_index[series_id] += 1
            total_on_page = page_series_counts[series_id]
            
            # For total images, consider global count across all pages
            total_images = max(total_on_page, series_image_count.get(series_id, 0) + total_on_page)
            
            # Get OCR-detected SKUs from the image (if any)
            ocr_skus = img_data.get("ocr_skus", [])
            
            filename = generate_image_filename(
                pdf_stem=pdf_stem,
                page_num=page_num,
                series_id=series_id,
                series_name=series_name,
                first_sku=first_sku,
                skus=skus,
                ocr_skus=ocr_skus,  # Pass OCR-detected SKUs
                image_index=series_image_count[series_id] + img_idx,
                total_images=total_images,
            )
            
            # Update global count after generating filename
            if img_idx == total_on_page - 1:
                series_image_count[series_id] += total_on_page
            
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
                    "series_id": series_id if matched_series else None,
                    "series_name": matched_series["series_name"] if matched_series else None,
                    "skus": matched_series["skus"] if matched_series else skus,
                    "ocr_skus": ocr_skus,  # SKUs detected directly on the image
                    "image_path": relative_path,
                    "original_size": (img_data["width"], img_data["height"]),
                })
                
                series_label = series_id if matched_series else "unmatched"
                print(f"    Page {page_num} [{series_label}]: {filename}")
    
    doc.close()
    return extracted


def load_image_sku_mapping() -> Dict[str, Any]:
    """Load existing image-SKU mapping or return empty dict."""
    if IMAGE_SKU_MAPPING_FILE.exists():
        try:
            with open(IMAGE_SKU_MAPPING_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def save_image_sku_mapping(mapping: Dict[str, Any]) -> None:
    """Save image-SKU mapping to JSON file."""
    with open(IMAGE_SKU_MAPPING_FILE, "w", encoding="utf-8") as f:
        json.dump(mapping, f, ensure_ascii=False, indent=2)
    print(f"  Saved image-SKU mapping to {IMAGE_SKU_MAPPING_FILE.name}")


def update_image_sku_mapping(
    mapping: Dict[str, Any],
    image_mappings: List[Dict[str, Any]],
    json_path: Path,
) -> int:
    """Update the image-SKU mapping with complete SKU lists.
    
    Args:
        mapping: Existing mapping dict to update
        image_mappings: List of image extraction results
        json_path: Path to the product JSON file
        
    Returns:
        Number of images added/updated in the mapping
    """
    from collections import defaultdict
    
    # Load all SKUs from the JSON grouped by series_id
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            products = json.load(f)
    except Exception:
        return 0
    
    if not isinstance(products, list):
        return 0
    
    # Build series_id -> all SKUs mapping from the product data
    series_to_all_skus: Dict[str, List[str]] = defaultdict(list)
    for product in products:
        series_id = product.get("series_id")
        sku = product.get("sku")
        if series_id and sku:
            if sku not in series_to_all_skus[series_id]:
                series_to_all_skus[series_id].append(sku)
    
    updated = 0
    for img_data in image_mappings:
        image_path = img_data.get("image_path")
        series_id = img_data.get("series_id")
        
        if not image_path:
            continue
        
        # Get ALL SKUs for this series from the product JSON
        all_skus = series_to_all_skus.get(series_id, []) if series_id else []
        
        # Fall back to the SKUs from extraction if no series match
        if not all_skus:
            all_skus = img_data.get("skus", [])
        
        mapping[image_path] = {
            "series_id": series_id,
            "series_name": img_data.get("series_name"),
            "pdf": img_data.get("pdf"),
            "page": img_data.get("page"),
            "skus": sorted(all_skus),  # Complete list of ALL SKUs
            "sku_count": len(all_skus),
        }
        updated += 1
    
    return updated


def generate_mapping_from_existing() -> Dict[str, Any]:
    """Generate image-SKU mapping from existing images and JSON files.
    
    This can be run without re-extracting images to build the mapping
    from current state.
    """
    from collections import defaultdict
    
    mapping = {}
    
    # Find all image directories
    for img_dir in IMAGE_OUTPUT_DIR.iterdir():
        if not img_dir.is_dir():
            continue
        
        pdf_stem = img_dir.name
        json_path = JSON_DIR / f"{pdf_stem}.json"
        
        if not json_path.exists():
            continue
        
        # Load products and build series -> SKUs mapping
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                products = json.load(f)
        except Exception:
            continue
        
        if not isinstance(products, list):
            continue
        
        series_to_skus: Dict[str, List[str]] = defaultdict(list)
        series_to_name: Dict[str, str] = {}
        
        for product in products:
            series_id = product.get("series_id")
            sku = product.get("sku")
            series_name = product.get("series_name")
            if series_id and sku:
                if sku not in series_to_skus[series_id]:
                    series_to_skus[series_id].append(sku)
                if series_name:
                    series_to_name[series_id] = series_name
        
        # Find all images and extract series_id from filename
        for img_file in img_dir.glob("*.webp"):
            # Parse filename: {pdf}__p{page}__{series_slug}__{skus}__v{N}.webp
            match = re.match(r"[^_]+__p(\d+)__([a-z0-9-]+)__", img_file.name)
            if not match:
                continue
            
            page = int(match.group(1))
            series_slug = match.group(2)  # e.g., "abs-knie-90"
            
            # Construct full series_id with PDF prefix (new format)
            full_series_id = f"{pdf_stem}__{series_slug}"
            
            relative_path = f"images/{pdf_stem}/{img_file.name}"
            all_skus = series_to_skus.get(full_series_id, [])
            
            mapping[relative_path] = {
                "series_id": full_series_id,
                "series_name": series_to_name.get(full_series_id),
                "pdf": f"{pdf_stem}.pdf",
                "page": page,
                "skus": sorted(all_skus),
                "sku_count": len(all_skus),
            }
    
    return mapping


def update_json_with_images(
    json_path: Path,
    image_mappings: List[Dict[str, Any]],
) -> int:
    """Update JSON file with image paths for matching records.
    
    Uses series_id for accurate matching. Stores all available images
    for each series so the frontend can choose which to display.
    
    Adds fields:
    - image: Primary image path (v1 or only image)
    - images: List of all image paths for this series [v1, v2, ...]
    - series_id: Confirmed series identifier for image lookup
    """
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"  Warning: Could not read {json_path}: {e}")
        return 0
    
    updated_count = 0
    
    # Build series_id -> list of images (ordered by variant)
    from collections import defaultdict
    series_all_images: Dict[str, List[str]] = defaultdict(list)
    # Also build page -> images as fallback
    page_all_images: Dict[int, List[str]] = defaultdict(list)
    # And SKU -> images for direct matches
    sku_all_images: Dict[str, List[str]] = defaultdict(list)
    
    for mapping in image_mappings:
        series_id = mapping.get("series_id")
        page = mapping.get("page")
        image_path = mapping.get("image_path")
        skus = mapping.get("skus") or []
        
        if not image_path:
            continue
        
        # Collect all images per series
        if series_id:
            series_all_images[series_id].append(image_path)
        
        if page:
            page_all_images[page].append(image_path)
        
        for sku in skus:
            if sku:
                sku_all_images[sku].append(image_path)
    
    def update_record(rec: Dict[str, Any]) -> bool:
        sku = rec.get("sku")
        series_id = rec.get("series_id")
        page_num = rec.get("page")
        if page_num is None:
            ctx = rec.get("_context") or {}
            page_num = ctx.get("page_number")
        
        images = []
        
        # Priority 1: Series match (most accurate)
        if series_id and series_id in series_all_images:
            images = series_all_images[series_id]
        # Priority 2: Direct SKU match
        elif sku and sku in sku_all_images:
            images = sku_all_images[sku]
        # Priority 3: Page fallback
        elif page_num and page_num in page_all_images:
            images = page_all_images[page_num]
        
        if images:
            # Primary image is first (v1)
            rec["image"] = images[0]
            # Store all images if multiple
            if len(images) > 1:
                rec["images"] = images
            elif "images" in rec:
                del rec["images"]  # Clean up if only one image now
            return True
        return False
    
    # Handle both list and dict structures
    if isinstance(data, list):
        for rec in data:
            if isinstance(rec, dict) and update_record(rec):
                updated_count += 1
    elif isinstance(data, dict):
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
    parser.add_argument(
        "--generate-mapping",
        action="store_true",
        help="Generate image-SKU mapping from existing images (no extraction)",
    )
    
    args = parser.parse_args()
    
    # Handle --generate-mapping mode (no extraction needed)
    if args.generate_mapping:
        print("=" * 60)
        print("Generating Image-SKU Mapping from Existing Data")
        print("=" * 60)
        mapping = generate_mapping_from_existing()
        save_image_sku_mapping(mapping)
        print(f"\nTotal images mapped: {len(mapping)}")
        total_skus = sum(m.get("sku_count", 0) for m in mapping.values())
        print(f"Total SKUs covered: {total_skus}")
        print("=" * 60)
        return
    
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
    total_mapped = 0
    
    # Load existing image-SKU mapping (to preserve data from previous runs)
    image_sku_mapping = load_image_sku_mapping()
    
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
        
        # Update image-SKU mapping with complete SKU lists
        if image_mappings:
            mapped = update_image_sku_mapping(image_sku_mapping, image_mappings, json_path)
            total_mapped += mapped
        
        # Update JSON if requested
        if args.update_json and image_mappings:
            updated = update_json_with_images(json_path, image_mappings)
            total_updated += updated
            if updated:
                print(f"  Updated {updated} records with image paths")
    
    # Save the complete image-SKU mapping
    if total_mapped > 0:
        save_image_sku_mapping(image_sku_mapping)
    
    print("\n" + "=" * 60)
    print(f"Total images extracted: {total_images}")
    print(f"Total images in SKU mapping: {len(image_sku_mapping)}")
    if args.update_json:
        print(f"Total records updated: {total_updated}")
    print("=" * 60)


if __name__ == "__main__":
    main()
