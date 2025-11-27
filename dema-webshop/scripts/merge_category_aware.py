"""
Merge category-aware extraction data into catalog
- Remove inappropriate properties (kW/V from fittings)
- Add correct properties (diameter, length, material)
"""
import json
from pathlib import Path
import shutil
from collections import defaultdict

# Category rules (same as extractor)
CATEGORY_RULES = {
    'slangkoppelingen': {
        'blocked': ['power_kw', 'power_hp', 'voltage_v', 'flow_l_min', 'rpm'],
    },
    'draadfittingen': {
        'blocked': ['power_kw', 'power_hp', 'voltage_v', 'flow_l_min', 'rpm'],
    },
    'slangklemmen': {
        'blocked': ['power_kw', 'power_hp', 'voltage_v', 'flow_l_min', 'rpm', 'pressure_max_bar'],
    },
    'plat-oprolbare-slangen': {
        'blocked': ['power_kw', 'power_hp', 'voltage_v', 'rpm'],
    },
    'afzuigslangen': {
        'blocked': ['power_kw', 'power_hp', 'voltage_v', 'flow_l_min', 'rpm'],
    },
}

def detect_product_category(product):
    """Detect product category from catalog field"""
    catalog = str(product.get('catalog', '')).lower()
    
    if 'slangkoppeling' in catalog:
        return 'slangkoppelingen'
    elif 'draad' in catalog and 'fitting' in catalog:
        return 'draadfittingen'
    elif 'slangklem' in catalog or 'klem' in catalog:
        return 'slangklemmen'
    elif 'plat' in catalog and 'slang' in catalog:
        return 'plat-oprolbare-slangen'
    elif 'afzuig' in catalog:
        return 'afzuigslangen'
    elif 'pomp' in catalog and 'special' in catalog:
        return 'pomp-specials'
    
    return None

def main():
    print("=" * 80)
    print("CATEGORY-AWARE MERGE AND CLEANUP")
    print("=" * 80)
    
    # Load catalog
    catalog_path = Path('src/data/catalog_products.json')
    print(f"\n📂 Loading catalog from {catalog_path}...")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    print(f"   ✓ {len(catalog)} products loaded")
    
    # Backup
    backup_path = Path('src/data/catalog_products_backup_category_aware.json')
    print(f"\n💾 Creating backup...")
    shutil.copy(catalog_path, backup_path)
    print(f"   ✓ Backup saved")
    
    # Load category-aware extraction
    enhanced_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/products_category_aware_20251127_164638.json')
    print(f"\n📂 Loading category-aware extraction...")
    with open(enhanced_path, 'r', encoding='utf-8') as f:
        enhanced_products = json.load(f)
    print(f"   ✓ {len(enhanced_products)} products loaded")
    
    # Build lookup by SKU
    print(f"\n🔍 Building SKU lookup...")
    enhanced_by_sku = {}
    for product in enhanced_products:
        sku = product.get('sku')
        if sku:
            if sku in enhanced_by_sku:
                # Merge if duplicate
                for key, value in product.items():
                    if value and key not in enhanced_by_sku[sku]:
                        enhanced_by_sku[sku][key] = value
            else:
                enhanced_by_sku[sku] = product
    print(f"   ✓ {len(enhanced_by_sku)} unique SKUs")
    
    # Process catalog products
    print(f"\n⚡ Processing products...")
    stats = {
        'total': len(catalog),
        'categorized': 0,
        'cleaned': 0,
        'enriched': 0,
        'properties_removed': defaultdict(int),
        'properties_added': defaultdict(int),
    }
    
    for product in catalog:
        sku = product.get('sku')
        category = detect_product_category(product)
        
        if category:
            stats['categorized'] += 1
            
            # Remove blocked properties for this category
            if category in CATEGORY_RULES:
                blocked = CATEGORY_RULES[category]['blocked']
                removed_any = False
                for prop in blocked:
                    if prop in product and product[prop] not in [None, '', [], {}]:
                        del product[prop]
                        stats['properties_removed'][prop] += 1
                        removed_any = True
                if removed_any:
                    stats['cleaned'] += 1
            
            # Add new properties from category-aware extraction
            if sku in enhanced_by_sku:
                enhanced_data = enhanced_by_sku[sku]
                added_any = False
                
                for key, value in enhanced_data.items():
                    if key in ['sku', 'page_in_pdf', 'table_row', 'category']:
                        continue
                    
                    # Only add if product doesn't have it or has None/empty
                    if not product.get(key):
                        product[key] = value
                        stats['properties_added'][key] += 1
                        added_any = True
                
                if added_any:
                    stats['enriched'] += 1
    
    # Save
    print(f"\n💾 Saving cleaned and enriched catalog...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Saved to {catalog_path}")
    
    # Statistics
    print(f"\n📊 CLEANUP & ENRICHMENT STATISTICS:")
    print(f"   Total products:              {stats['total']}")
    print(f"   Categorized products:        {stats['categorized']}")
    print(f"   Products cleaned:            {stats['cleaned']}")
    print(f"   Products enriched:           {stats['enriched']}")
    
    print(f"\n   🗑️ Properties REMOVED (inappropriate):")
    for prop, count in sorted(stats['properties_removed'].items(), key=lambda x: x[1], reverse=True):
        print(f"     {prop:25} {count:5} products")
    
    print(f"\n   ✅ Properties ADDED (correct):")
    for prop, count in sorted(stats['properties_added'].items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"     {prop:25} {count:5} products")
    
    # Sample products
    print(f"\n📋 SAMPLE CLEANED PRODUCTS:")
    
    # Show slangkoppelingen example
    slang_prod = [p for p in catalog if 'slangkoppeling' in str(p.get('catalog', '')).lower()][:1]
    if slang_prod:
        p = slang_prod[0]
        print(f"\n   🔗 Hose Fitting: {p['sku']}")
        print(f"      Catalog: {p.get('catalog')}")
        props_shown = ['diameter_mm', 'inner_diameter_mm', 'pressure_max_bar', 'material']
        for prop in props_shown:
            if p.get(prop):
                print(f"      {prop:25} {p[prop]}")
        # Show what's NOT there
        bad_props = ['power_kw', 'voltage_v']
        for prop in bad_props:
            if not p.get(prop):
                print(f"      ❌ {prop:25} (correctly removed)")
    
    # Show pomp-specials example
    pomp_prod = [p for p in catalog if 'pomp-special' in str(p.get('catalog', '')).lower()][:1]
    if pomp_prod:
        p = pomp_prod[0]
        print(f"\n   ⚙️ Pump Special: {p['sku']}")
        print(f"      Catalog: {p.get('catalog')}")
        props_shown = ['power_kw', 'voltage_v', 'flow_l_min', 'pressure_max_bar']
        for prop in props_shown:
            if p.get(prop):
                print(f"      {prop:25} {p[prop]}")
    
    print(f"\n{'='*80}")
    print("✅ CATEGORY-AWARE MERGE COMPLETE!")
    print("="*80)

if __name__ == '__main__':
    main()
