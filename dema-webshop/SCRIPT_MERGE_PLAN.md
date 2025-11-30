# Script Merge Plan - Consolidating Related Functionalities

## 🎯 **Goal:** Merge Python files with related functionalities into unified modules

---

## 📊 **DemaWebshop Scripts Analysis**

**Current:** 16 scripts (~60 KB)  
**After Merge:** 7 consolidated scripts (~60 KB)  
**Reduction:** 9 fewer files (56% reduction)

---

### **Merge Group 1: Verification Scripts** ⭐ Priority 1

**Merge into:** `verify_catalog_data.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `verify_abs_display.py` | 2.65 KB | Verify ABS display |
| `verify_all_catalog_updates.py` | 4.33 KB | Verify updates |
| `verify_enrichment.py` | 2.69 KB | Verify enrichment |
| `verify_new_pomp_extraction.py` | 4.81 KB | Verify pomp |
| `verify_sku_diameters.py` | 2.41 KB | Verify SKU diameters |
| `verify_sku_display.py` | 3.16 KB | Verify SKU display |

**Total:** 6 files → **1 unified file** (~20 KB)

**New Structure:**
```python
# verify_catalog_data.py
"""Unified catalog data verification utility"""

def verify_abs_display():
    """Verify ABS display properties"""
    pass

def verify_catalog_updates():
    """Verify all catalog updates"""
    pass

def verify_enrichment():
    """Verify data enrichment"""
    pass

def verify_pomp_extraction():
    """Verify pomp extraction"""
    pass

def verify_sku_diameters():
    """Verify SKU diameter properties"""
    pass

def verify_sku_display():
    """Verify SKU display properties"""
    pass

def verify_all():
    """Run all verifications"""
    pass

if __name__ == "__main__":
    # CLI with argparse to run specific verifications
    pass
```

**Benefits:**
- ✅ Single entry point for all verifications
- ✅ Easier to run multiple checks
- ✅ Shared utility functions
- ✅ Consistent output format

---

### **Merge Group 2: Pomp Scripts** ⭐ Priority 2

**Merge into:** `pomp_catalog_utils.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `check_pomp_specials.py` | 1.64 KB | Check pomp specials |
| `check_pomp_specials_display.py` | 2.11 KB | Check display |
| `compare_pomp_values.py` | 4.48 KB | Compare values |

**Total:** 3 files → **1 unified file** (~8 KB)

**New Structure:**
```python
# pomp_catalog_utils.py
"""Pomp catalog utilities - checking, display, comparison"""

def check_pomp_specials():
    """Check pomp specials catalog"""
    pass

def check_pomp_display():
    """Verify pomp display properties"""
    pass

def compare_pomp_values():
    """Compare pomp values across sources"""
    pass

if __name__ == "__main__":
    # CLI interface
    pass
```

---

### **Merge Group 3: Enrichment Scripts** ⭐ Priority 3

**Merge into:** `catalog_enrichment.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `enrich_catalog.py` | 5.92 KB | Basic enrichment |
| `advanced_enrichment.py` | 8.85 KB | Advanced enrichment |

**Total:** 2 files → **1 unified file** (~15 KB)

**New Structure:**
```python
# catalog_enrichment.py
"""Catalog data enrichment utilities - basic and advanced"""

def enrich_basic(catalog_data):
    """Basic catalog enrichment"""
    pass

def enrich_advanced(catalog_data):
    """Advanced enrichment with AI/ML"""
    pass

def enrich_all(catalog_data, mode='basic'):
    """Unified enrichment pipeline"""
    pass

if __name__ == "__main__":
    # CLI interface
    pass
```

---

### **Keep Separate (Good Reasons):** ✅

| File | Size | Reason to Keep Separate |
|------|------|------------------------|
| `check_request_quote_products.py` | 1.69 KB | Specific to quote system |
| `clean_and_remerge.py` | 5.64 KB | Data cleanup utility |
| `find_best_source.py` | 1.41 KB | Source selection utility |
| `map_aandrijf_images.py` | 4.77 KB | Catalog-specific mapping |
| `test_pdf_links.py` | 1.48 KB | PDF link testing |

**Reason:** These are standalone utilities with distinct purposes.

---

## 📊 **PDF_Analyzer Scripts Analysis**

**Current:** 38 scripts  
**After Merge:** ~28 scripts  
**Reduction:** 10 fewer files (26% reduction)

---

### **Merge Group 1: Analysis Scripts** ⭐ Priority 1

**Merge into:** `analyze_catalog_data.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `analyze_products.py` | 9.65 KB | Product analysis |
| `analyze_sku_coverage.py` | 2.91 KB | SKU coverage |
| `show_coverage_by_pdf.py` | 1.89 KB | PDF coverage |

**Total:** 3 files → **1 unified file** (~15 KB)

---

### **Merge Group 2: Image Check Scripts** ⭐ Priority 2

**Merge into:** `image_quality_checks.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `check_image_formats.py` | 2.08 KB | Check formats |
| `check_v9_images.py` | 0.74 KB | Check v9 images |

**Total:** 2 files → **1 unified file** (~3 KB)

---

### **Merge Group 3: Build Scripts** ⭐ Priority 3

**Merge into:** `build_webshop_feed.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `build_shop_feed.py` | 12.29 KB | Build shop feed |
| `build_enriched_webshop_feed.py` | 11.77 KB | Enriched feed |
| `build_complete_webshop_feed.py` | 17.17 KB | Complete feed |

**Total:** 3 files → **1 unified file** (~25 KB with shared code)

**New Structure:**
```python
# build_webshop_feed.py
"""Unified webshop feed builder"""

def build_basic_feed():
    """Build basic shop feed"""
    pass

def build_enriched_feed():
    """Build enriched feed"""
    pass

def build_complete_feed():
    """Build complete feed with all data"""
    pass

if __name__ == "__main__":
    # CLI: python build_webshop_feed.py --mode [basic|enriched|complete]
    pass
```

---

### **Merge Group 4: Catalog Extraction Scripts** ⭐ Priority 4

**Consider merging similar catalog extractors:**

| Current File | Size | Purpose |
|--------------|------|---------|
| `extract_pomp_specials_correct.py` | 9.36 KB | Pomp v1 |
| `extract_pomp_specials_correct_v2.py` | 6.97 KB | Pomp v2 |

**Merge into:** `extract_pomp_specials.py` (keep latest version, remove duplicates)

---

### **Merge Group 5: Image Processing Scripts** ⭐ Priority 5

**Merge into:** `process_images.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `convert_to_webp.py` | 3.20 KB | Convert to WebP |
| `clean_airpress_images.py` | 6.55 KB | Clean images |
| `fix_webshop_images.py` | 4.02 KB | Fix images |

**Total:** 3 files → **1 unified file** (~14 KB)

---

### **Merge Group 6: Sync Scripts** ⭐ Priority 6

**Merge into:** `sync_to_webshop.py`

| Current File | Size | Purpose |
|--------------|------|---------|
| `full_sync_images.py` | 1.58 KB | Full sync |
| `sync_images_and_rebuild.py` | 5.57 KB | Sync + rebuild |
| `sync_webp_to_webshop.py` | 1.43 KB | WebP sync |
| `rewrite_media_urls.py` | 1.01 KB | URL rewrite |

**Total:** 4 files → **1 unified file** (~10 KB)

---

## 📊 **Summary:**

### **DemaWebshop:**
| Category | Before | After | Change |
|----------|--------|-------|--------|
| **Verification** | 6 files | 1 file | -5 files |
| **Pomp Utils** | 3 files | 1 file | -2 files |
| **Enrichment** | 2 files | 1 file | -1 file |
| **Standalone** | 5 files | 5 files | No change |
| **Total** | **16 files** | **8 files** | **-50%** |

### **PDF_Analyzer:**
| Category | Before | After | Change |
|----------|--------|-------|--------|
| **Analysis** | 3 files | 1 file | -2 files |
| **Image Checks** | 2 files | 1 file | -1 file |
| **Build** | 3 files | 1 file | -2 files |
| **Extraction** | 2 files | 1 file | -1 file |
| **Image Process** | 3 files | 1 file | -2 files |
| **Sync** | 4 files | 1 file | -3 files |
| **Other** | 21 files | 21 files | No change |
| **Total** | **38 files** | **27 files** | **-29%** |

---

## ✅ **Benefits of Merging:**

1. **Fewer Files:**
   - ✅ 50% reduction in DemaWebshop scripts
   - ✅ 29% reduction in PDF_Analyzer scripts

2. **Better Organization:**
   - ✅ Related functions grouped together
   - ✅ Shared utilities in one place
   - ✅ Single import for related features

3. **Easier Maintenance:**
   - ✅ Update logic in one place
   - ✅ Less duplication
   - ✅ Consistent patterns

4. **Better CLI:**
   - ✅ Single command with options
   - ✅ `python verify_catalog_data.py --all`
   - ✅ `python build_webshop_feed.py --mode complete`

5. **Shared Code:**
   - ✅ Common functions deduplicated
   - ✅ Consistent error handling
   - ✅ Unified logging

---

## 🎯 **Implementation Priority:**

### **Phase 1 (High Impact, Low Risk):**
1. ✅ Merge verification scripts (DemaWebshop)
2. ✅ Merge pomp scripts (DemaWebshop)
3. ✅ Merge analysis scripts (PDF_Analyzer)

### **Phase 2 (Medium Impact):**
4. ✅ Merge enrichment scripts (DemaWebshop)
5. ✅ Merge image check scripts (PDF_Analyzer)
6. ✅ Merge sync scripts (PDF_Analyzer)

### **Phase 3 (Larger Changes):**
7. ✅ Merge build scripts (PDF_Analyzer)
8. ✅ Merge image processing scripts (PDF_Analyzer)
9. ✅ Consolidate extraction scripts (PDF_Analyzer)

---

## 📝 **Implementation Pattern:**

For each merge:
1. Create new unified file
2. Import functions from old files
3. Add CLI with argparse
4. Test all functions work
5. Delete old files
6. Update any imports in other files

---

**Would you like me to execute these merges?**  
We can start with Phase 1 (high-impact, low-risk merges) first! 🚀
