# 📊 Data Directory - Grouped Product JSON Files

## ⚠️ Current Status: PLACEHOLDER FILES

All `*_grouped.json` files in this directory are currently **empty placeholder arrays `[]`**.

These files were created to prevent 404 errors, but they need to be populated with actual grouped product data.

---

## 📁 Files Created

### Catalog Grouped Files (26 files)
- `pomp_specials_grouped.json`
- `messing_draadfittingen_grouped.json`
- `rvs_draadfittingen_grouped.json`
- `slangkoppelingen_grouped.json`
- `pe_buizen_grouped.json`
- `rubber_slangen_grouped.json`
- `slangklemmen_grouped.json`
- `pu_afzuigslangen_grouped.json`
- `zwarte_draad_en_lasfittingen_grouped.json`
- `kunststof_afvoerleidingen_grouped.json`
- `verzinkte_buizen_grouped.json`
- `zuigerpompen_grouped.json`
- `plat-oprolbare-slangen_grouped.json`
- `makita-catalogus-2022-nl_grouped.json`
- `makita-tuinfolder-2022-nl_grouped.json`
- `kranzle-catalogus-2021-nl-1_grouped.json`
- `airpress-catalogus-eng_grouped.json`
- `airpress-catalogus-nl-fr_grouped.json`
- `bronpompen_grouped.json`
- `centrifugaalpompen_grouped.json`
- `dompelpompen_grouped.json`
- `drukbuizen_grouped.json`
- `catalogus-aandrijftechniek-150922_grouped.json`
- `pompentoebehoren_grouped.json`
- `abs_persluchtbuizen_grouped.json`
- `products_all_grouped.json` (combined file)

### Mapping Files (3 files)
- `verzinkte_buizen_image_mapping.json`
- `pompentoebehoren_image_mapping.json`
- `Product_images.json`

---

## 🔧 How to Populate with Real Data

### Option 1: Use Existing Catalog JSON Files
The actual product data already exists in:
```
documents/Product_pdfs/json/[catalog-name].json
```

You can either:
1. **Redirect pages** to load from `documents/Product_pdfs/json/` instead
2. **Copy/process files** from `documents/Product_pdfs/json/` to this directory
3. **Create a build script** to generate grouped data

### Option 2: Generate Grouped Data
Create a Node.js script to:
1. Load products from `documents/Product_pdfs/json/*.json`
2. Group products by series/family
3. Calculate variants and properties
4. Save to `public/data/*_grouped.json`

### Example Grouped Structure
```json
[
  {
    "group_id": "series-001",
    "name": "Series Name",
    "family": "Product Family",
    "catalog": "catalog-name",
    "brand": "Brand Name",
    "category": "Category",
    "variant_count": 5,
    "variants": [
      {
        "sku": "12345",
        "label": "Variant A",
        "page_in_pdf": 42,
        "properties": { ... },
        "attributes": { ... }
      }
    ],
    "images": ["image1.webp", "image2.webp"]
  }
]
```

---

## 📝 Alternative: Update Pages to Use Catalog JSONs

Instead of generating grouped files, you can modify the catalog pages to:
1. Load directly from `/documents/Product_pdfs/json/[catalog].json`
2. Group products client-side using JavaScript
3. Cache results in component state

This approach works well for the **Catalog Explorer** and **Featured Products** pages.

---

## 🚀 Quick Fix Applied

For now, **empty array placeholders** allow the app to:
- ✅ Load without 404 errors
- ✅ Render pages successfully
- ✅ Show empty states gracefully

But you'll need to populate these files to display actual products on the catalog pages.

---

## 📊 Data Sources

- **Original PDFs**: `documents/Product_pdfs/*.pdf`
- **Extracted JSON**: `documents/Product_pdfs/json/*.json`
- **Images**: `documents/Product_pdfs/images/*/`
- **Image Mappings**: `public/product-images/extracted-catalogs/*/sku_to_image_mapping.json`

---

**Created**: December 2025  
**Purpose**: Prevent 404 errors until proper data pipeline is implemented
