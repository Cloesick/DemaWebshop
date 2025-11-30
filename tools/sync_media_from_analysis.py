import json
import os
import shutil
from collections import defaultdict

"""
Sync product images for the DemaWebshop from the PDF_Analyzer output.

Steps:
- Read input_pdfs_analysis_v5.json (per-SKU image info from PDF_Analyzer).
- Group images by (pdf_source, page, index_on_page) so SKUs that share a table/image share one file.
- Copy each unique image into dema-webshop/public/media with a SKU-based filename.
- Update products_for_shop.json so each product has a media array with relative URLs like /media/<filename>.

Run this script from anywhere with Python 3 installed.
"""

# Paths: adjust here if your layout changes
ANALYSIS_JSON = r"C:\Users\prova\Documents\Projects\PDF_Analyzer\output\input_pdfs_analysis_v5.json"
PRODUCTS_JSON = r"C:\Users\prova\Documents\Projects\DemaWebshop\dema-webshop\public\data\products_for_shop.json"
PUBLIC_MEDIA_DIR = r"C:\Users\prova\Documents\Projects\DemaWebshop\dema-webshop\public\media"

os.makedirs(PUBLIC_MEDIA_DIR, exist_ok=True)


def sanitize_for_filename(value: str, max_length: int = 120) -> str:
    """Sanitize a string so it is safe to use as a Windows filename component."""
    # Replace characters that are invalid in Windows filenames
    invalid_chars = '<>:"/\\|?*'
    sanitized = ''.join('_' if c in invalid_chars else c for c in value)
    # Strip leading/trailing spaces
    sanitized = sanitized.strip()
    # Collapse very long names
    if len(sanitized) > max_length:
        sanitized = sanitized[:max_length]
    # Avoid empty string
    return sanitized or "item"

# 1. Load files
with open(ANALYSIS_JSON, "r", encoding="utf-8") as f:
    analysis = json.load(f)

with open(PRODUCTS_JSON, "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Loaded {len(analysis)} analysis records")
print(f"Loaded {len(products)} products")

# 2. Build a map: (pdf_source, page, index_on_page) -> list of (sku, image_path)
from collections import defaultdict

grouped = defaultdict(list)

for record in analysis:
    sku = record.get("sku")
    images = record.get("images") or []
    for img in images:
        pdf_source = img.get("pdf_source")
        page = img.get("page")
        idx = img.get("index_on_page")
        image_path = img.get("image_path")
        if not (sku and pdf_source and page is not None and idx is not None and image_path):
            continue
        key = (pdf_source, int(page), int(idx))
        grouped[key].append((sku, image_path))

print(f"Found {len(grouped)} unique (pdf,page,index) image groups.")

# 3. Decide a shared filename for each image group and copy file
group_to_filename = {}  # key -> filename
copied = 0

for key, sku_imgs in grouped.items():
    pdf_source, page, idx = key
    skus = sorted({sku for sku, _ in sku_imgs})

    # Decide filename:
    # - If one SKU: <SKU>_<pdfbase>_pXXX_imgYYY.ext
    # - If multiple SKUs: <SKU1+SKU2+...>_<pdfbase>_pXXX_imgYYY.ext (trim if very long)
    raw_pdf_base = os.path.splitext(os.path.basename(pdf_source))[0]
    raw_sku_part = "+".join(skus)
    if len(raw_sku_part) > 40:
        # keep it manageable
        raw_sku_part = "+".join(skus[:5]) + "+etc"

    pdf_base = sanitize_for_filename(raw_pdf_base)
    sku_part = sanitize_for_filename(raw_sku_part)

    # Preserve original extension from first image_path
    first_path = sku_imgs[0][1]
    _, ext = os.path.splitext(first_path)
    if not ext:
        ext = ".webp"

    filename = f"{sku_part}_{pdf_base}_p{page:03d}_img{idx:03d}{ext}"
    dest_path = os.path.join(PUBLIC_MEDIA_DIR, filename)

    # Copy only once, from the first existing src
    if not os.path.exists(dest_path):
        src_used = None
        for _, src_path in sku_imgs:
            if os.path.exists(src_path):
                try:
                    shutil.copy2(src_path, dest_path)
                    copied += 1
                    src_used = src_path
                    print(f"Copied {src_path} -> {dest_path}")
                except Exception as e:
                    print(f"ERROR copying {src_path} -> {dest_path}: {e}")
                break
        if src_used is None:
            print(f"WARNING: no existing source file for group {key}")
            continue

    group_to_filename[key] = filename

print(f"Copied {copied} unique images.")

# 4. Build a helper index: for each SKU, which filenames belong to it?
sku_to_filenames = defaultdict(list)

for key, sku_imgs in grouped.items():
    filename = group_to_filename.get(key)
    if not filename:
        continue
    for sku, _ in sku_imgs:
        if filename not in sku_to_filenames[sku]:
            sku_to_filenames[sku].append(filename)

# 5. Update products_for_shop.json: set media to relative URLs using shared filenames
sku_to_product = {p.get("sku"): p for p in products}

updated = 0
for sku, filenames in sku_to_filenames.items():
    product = sku_to_product.get(sku)
    if not product:
        continue

    media = []
    if filenames:
        # First filename as main
        media.append({
            "url": f"/media/{filenames[0]}",
            "role": "main",
        })
        # Others as gallery
        for fn in filenames[1:]:
            media.append({
                "url": f"/media/{fn}",
                "role": "gallery",
            })

    product["media"] = media
    updated += 1

print(f"Updated media for {updated} products based on analysis file.")

# 6. Write updated products JSON (backup first!)
backup_path = PRODUCTS_JSON + ".backup"
if not os.path.exists(backup_path):
    shutil.copy2(PRODUCTS_JSON, backup_path)
    print(f"Created backup at {backup_path}")

with open(PRODUCTS_JSON, "w", encoding="utf-8") as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print(f"Wrote updated products JSON to {PRODUCTS_JSON}")
