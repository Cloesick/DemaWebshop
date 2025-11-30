# Scripts Cleanup Analysis

## 📊 **Current Status:**

**Location:** `dema-webshop/scripts/`  
**Total Scripts:** 70 Python files  
**Total Size:** ~250 KB

---

## 🗂️ **Script Categories:**

### **1. One-Time Analysis Scripts (18 scripts)** ✅ Can Archive/Delete

These scripts were used to analyze data but are no longer needed:

| Script | Purpose | Status |
|--------|---------|--------|
| `analyze_aandrijf_images.py` | Image analysis | ✅ Done |
| `analyze_airpress_products.py` | Airpress analysis | ✅ Done |
| `analyze_airpress_tables.py` | Table analysis | ✅ Done |
| `analyze_categories.py` | Category analysis | ✅ Done |
| `analyze_kunststof_sku.py` | SKU analysis | ✅ Done |
| `check_aandrijf_data.py` | Data check | ✅ Done |
| `check_abs_diameters.py` | Diameter check | ✅ Done |
| `check_abs_duplicates.py` | Duplicate check | ✅ Done |
| `check_airpress_data.py` | Airpress check | ✅ Done |
| `check_all_catalog_duplicates.py` | Duplicate check | ✅ Done |
| `check_all_duplicates_detailed.py` | Detailed check | ✅ Done |
| `check_available_airpress_props.py` | Property check | ✅ Done |
| `check_catalog_names.py` | Name check | ✅ Done |
| `check_duplicate_properties.py` | Duplicate check | ✅ Done |
| `check_lengths.py` | Length check | ✅ Done |
| `check_makita_images.py` | Image check | ✅ Done |
| `check_pdf_properties.py` | PDF check | ✅ Done |
| `check_properties.py` | Property check | ✅ Done |

**Recommendation:** ✅ **ARCHIVE** - These analysis scripts served their purpose.

---

### **2. One-Time Fix Scripts (15 scripts)** ✅ Can Archive

These scripts fixed data issues that are now resolved:

| Script | Purpose | Status |
|--------|---------|--------|
| `cleanup_abs_duplicates.py` | Fixed duplicates | ✅ Done |
| `cleanup_duplicate_properties.py` | Fixed duplicates | ✅ Done |
| `cleanup_remaining_duplicates.py` | Fixed duplicates | ✅ Done |
| `fix_aandrijf_skus.py` | Fixed SKUs | ✅ Done |
| `fix_abs_diameters.py` | Fixed diameters | ✅ Done |
| `fix_airpress_duplicates.py` | Fixed duplicates | ✅ Done |
| `fix_pdf_viewer_links.py` | Fixed links | ✅ Done |
| `fix_slangkoppelingen_duplicates.py` | Fixed duplicates | ✅ Done |
| `extract_abs_diameter_and_angle.py` | Extracted data | ✅ Done |
| `extract_diameter_from_sku.py` | Extracted data | ✅ Done |
| `parse_kunststof_sku_codes.py` | Parsed SKUs | ✅ Done |
| `reparse_airpress_tables.py` | Reparsed tables | ✅ Done |
| `apply_kunststof_properties.py` | Applied properties | ✅ Done |
| `add_abs_table_products.py` | Added products | ✅ Done |
| `replace_aandrijf_products.py` | Replaced data | ✅ Done |

**Recommendation:** ✅ **ARCHIVE** - Data is fixed, scripts no longer needed.

---

### **3. One-Time Merge Scripts (11 scripts)** ✅ Can Archive

These scripts merged data from various sources:

| Script | Purpose | Status |
|--------|---------|--------|
| `merge_aandrijf_specs.py` | Merged specs | ✅ Done |
| `merge_abs_table_specs.py` | Merged specs | ✅ Done |
| `merge_category_aware.py` | Merged data | ✅ Done |
| `merge_dynamic_extraction.py` | Merged extraction | ✅ Done |
| `merge_enhanced_extraction.py` | Merged data | ✅ Done |
| `merge_plat_oprolbare_specs.py` | Merged specs | ✅ Done |
| `merge_pomp_corrected.py` | Merged corrections | ✅ Done |
| `merge_pomp_specials_specs.py` | Merged specs | ✅ Done |
| `merge_product_data.py` | Merged products | ✅ Done |
| `merge_simple.py` | Simple merge | ✅ Done |
| `merge_slangkoppelingen_specs.py` | Merged specs | ✅ Done |

**Recommendation:** ✅ **ARCHIVE** - Merges complete, no longer needed.

---

### **4. Verification Scripts (10 scripts)** ⚠️ Keep for Now

These verify data integrity (might be useful):

| Script | Purpose | Status |
|--------|---------|--------|
| `verify_abs_display.py` | Verify display | ⚠️ Useful |
| `verify_all_catalog_updates.py` | Verify updates | ⚠️ Useful |
| `verify_enrichment.py` | Verify enrichment | ⚠️ Useful |
| `verify_new_pomp_extraction.py` | Verify extraction | ⚠️ Useful |
| `verify_sku_diameters.py` | Verify diameters | ⚠️ Useful |
| `verify_sku_display.py` | Verify display | ⚠️ Useful |
| `check_request_quote_products.py` | Check quotes | ⚠️ Useful |
| `compare_pomp_values.py` | Compare data | ⚠️ Useful |
| `test_pdf_links.py` | Test links | ⚠️ Useful |
| `check_pomp_specials_display.py` | Check display | ⚠️ Useful |

**Recommendation:** ⚠️ **KEEP** - May need for future verification.

---

### **5. Inspection/Debug Scripts (9 scripts)** ✅ Can Delete

These were temporary debugging scripts:

| Script | Purpose | Status |
|--------|---------|--------|
| `find_frontend_duplicate_displays.py` | Debug duplicates | ✅ Done |
| `inspect_duplicate_displays.py` | Inspect duplicates | ✅ Done |
| `list_unparsed_kunststof.py` | List unparsed | ✅ Done |
| `save_airpress_analysis.py` | Save analysis | ✅ Done |
| `save_unparsed_kunststof.py` | Save unparsed | ✅ Done |
| `debug_aandrijf_skus.py` | Debug SKUs | ✅ Done |
| `check_sku_17130231.py` | Check specific SKU | ✅ Done |
| `check_plat_oprolbare.py` | Check catalog | ✅ Done |
| `check_slangkoppelingen.py` | Check catalog | ✅ Done |

**Recommendation:** ✅ **DELETE** - Debugging complete.

---

### **6. Utility Scripts (7 scripts)** ✅ Keep

These might be reused:

| Script | Purpose | Status |
|--------|---------|--------|
| `advanced_enrichment.py` | Enrich data | ✅ Keep |
| `enrich_catalog.py` | Enrich catalog | ✅ Keep |
| `find_best_source.py` | Find sources | ✅ Keep |
| `clean_and_remerge.py` | Clean/merge utility | ✅ Keep |
| `map_aandrijf_images.py` | Map images | ✅ Keep |

**Recommendation:** ✅ **KEEP** - Reusable utilities.

---

## 📊 **Summary:**

| Category | Scripts | Action |
|----------|---------|--------|
| **Analysis Scripts** | 18 | ✅ Archive |
| **Fix Scripts** | 15 | ✅ Archive |
| **Merge Scripts** | 11 | ✅ Archive |
| **Verification Scripts** | 10 | ⚠️ Keep |
| **Debug Scripts** | 9 | ✅ Delete |
| **Utility Scripts** | 7 | ✅ Keep |
| **Total** | **70** | |

**Action Plan:**
- ✅ **Archive:** 44 scripts (63%)
- ✅ **Delete:** 9 scripts (13%)
- ✅ **Keep:** 17 scripts (24%)

---

## 🎯 **Recommended Action:**

### **Create Archive Folder:**
```
scripts/
  ├── active/              ← Keep 17 scripts here
  ├── archive/
  │   ├── analysis/        ← 18 analysis scripts
  │   ├── fixes/           ← 15 fix scripts
  │   ├── merges/          ← 11 merge scripts
  │   └── debug/           ← 9 debug scripts (can delete later)
  └── verification/        ← 10 verification scripts
```

### **Benefits:**
- ✅ Cleaner main scripts folder
- ✅ Keep history in archive
- ✅ Easy to find active scripts
- ✅ Can delete archive later if never needed

---

## ✅ **Active Scripts (Keep in `scripts/` or `scripts/active/`):**

1. `advanced_enrichment.py`
2. `enrich_catalog.py`
3. `find_best_source.py`
4. `clean_and_remerge.py`
5. `map_aandrijf_images.py`
6. `verify_abs_display.py`
7. `verify_all_catalog_updates.py`
8. `verify_enrichment.py`
9. `verify_new_pomp_extraction.py`
10. `verify_sku_diameters.py`
11. `verify_sku_display.py`
12. `check_request_quote_products.py`
13. `compare_pomp_values.py`
14. `test_pdf_links.py`
15. `check_pomp_specials_display.py`
16. `check_pomp_specials.py`
17. `check_plat_oprolbare.py` (optional)

---

**Space Impact:**
- Archive: ~180 KB (keep for reference)
- Delete: ~70 KB (debug scripts)
- Keep active: ~50 KB (17 scripts)

Would you like me to execute this cleanup and organize the scripts?
