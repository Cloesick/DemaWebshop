"""
Merge dynamically extracted data into catalog
Intelligently updates products with header-driven properties
"""
import json
import shutil
from pathlib import Path
from datetime import datetime

# Paths
CATALOG_PATH = Path('src/data/catalog_products.json')
EXTRACTIONS = [
    ('aandrijftechniek', '../../PDF_Analyzer/output/aandrijftechniek_dynamic.json'),
    ('slangkoppelingen', '../../PDF_Analyzer/output/slangkoppelingen_dynamic.json'),
    ('plat-oprolbare-slangen', '../../PDF_Analyzer/output/plat_oprolbare_slangen_dynamic.json'),
    ('pomp-specials', '../../PDF_Analyzer/output/pomp_specials_dynamic.json'),
    ('abs-persluchtbuizen', '../../PDF_Analyzer/output/abs_persluchtbuizen_dynamic.json'),
]

# Properties to skip when merging (keep existing catalog values)
SKIP_PROPERTIES = {'id', 'name', 'category', 'images', 'imageUrl', 'price', 'seo'}

def load_extraction(extraction_path):
    """Load extracted data from JSON file"""
    with open(extraction_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def load_catalog():
    """Load catalog with backup"""
    with open(CATALOG_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def backup_catalog():
    """Create backup of catalog"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = CATALOG_PATH.parent / f'catalog_products_backup_{timestamp}.json'
    shutil.copy(CATALOG_PATH, backup_path)
    print(f"   ✓ Backup created: {backup_path.name}")
    return backup_path

def merge_product_data(existing_product, extracted_data):
    """Merge extracted data into existing product"""
    updates = {}
    
    for key, value in extracted_data.items():
        # Skip certain properties
        if key in SKIP_PROPERTIES:
            continue
        
        # Skip if value is None or empty
        if value is None or (isinstance(value, str) and value.strip() == ''):
            continue
        
        # Update if:
        # 1. Property doesn't exist in product
        # 2. Existing value is None/empty
        # 3. New value is more specific (has more info)
        if key not in existing_product or existing_product[key] is None:
            updates[key] = value
        elif isinstance(value, (int, float)) and value > 0:
            # Prefer numeric values over empty/zero
            if not existing_product[key] or existing_product[key] == 0:
                updates[key] = value
    
    return updates

def apply_conversions(product):
    """Apply standard conversions to extracted data"""
    conversions_applied = []
    
    # HP → kW conversion
    if 'power_hp' in product and 'power_kw' not in product:
        product['power_kw'] = round(product['power_hp'] * 0.746, 2)
        conversions_applied.append('HP→kW')
    
    # kW → HP conversion
    if 'power_kw' in product and 'power_hp' not in product:
        product['power_hp'] = round(product['power_kw'] / 0.746, 2)
        conversions_applied.append('kW→HP')
    
    # m³/h → L/min conversion
    if 'flow_m3_per_h' in product and 'flow_l_min' not in product:
        product['flow_l_min'] = round(product['flow_m3_per_h'] * 16.667, 1)
        conversions_applied.append('m³/h→L/min')
    
    # Pressure height (m) → bar conversion
    if 'pressure_height_m' in product and 'pressure_max_bar' not in product:
        product['pressure_max_bar'] = round(product['pressure_height_m'] / 10, 2)
        conversions_applied.append('m→bar')
    
    # Weight g/m → kg/m conversion
    if 'weight_kg' in product:
        weight_val = product['weight_kg']
        # If weight looks like grams (> 100), convert to kg
        if weight_val > 100:
            product['weight_kg'] = round(weight_val / 1000, 3)
            conversions_applied.append('g→kg')
    
    # Rename 'type' to specific types based on catalog
    if 'type' in product and 'pump_type' not in product:
        catalog = product.get('catalog', '')
        if 'pomp' in catalog:
            product['pump_type'] = product['type']
            del product['type']
            conversions_applied.append('type→pump_type')
    
    return conversions_applied

def merge_all():
    """Merge all dynamic extractions into catalog"""
    print("=" * 80)
    print("MERGING DYNAMIC EXTRACTIONS")
    print("=" * 80)
    
    # Backup
    print("\n💾 Creating backup...")
    backup_catalog()
    
    # Load catalog
    print("\n📂 Loading catalog...")
    catalog = load_catalog()
    print(f"   Total products in catalog: {len(catalog)}")
    
    # Create SKU index
    catalog_by_sku = {p['sku']: p for p in catalog}
    
    overall_stats = {
        'catalogs_processed': 0,
        'products_found': 0,
        'products_updated': 0,
        'properties_added': 0,
        'conversions_applied': 0
    }
    
    # Process each extraction
    for catalog_name, extraction_path in EXTRACTIONS:
        print(f"\n{'='*80}")
        print(f"PROCESSING: {catalog_name}")
        print(f"{'='*80}")
        
        try:
            extracted_products = load_extraction(extraction_path)
            print(f"   Extracted products: {len(extracted_products)}")
            
            stats = {
                'found': 0,
                'updated': 0,
                'properties_added': 0,
                'conversions': 0
            }
            
            for extracted in extracted_products:
                sku = extracted.get('sku')
                if not sku or sku not in catalog_by_sku:
                    continue
                
                stats['found'] += 1
                
                # Apply conversions first
                conversions = apply_conversions(extracted)
                if conversions:
                    stats['conversions'] += len(conversions)
                
                # Merge data
                existing = catalog_by_sku[sku]
                updates = merge_product_data(existing, extracted)
                
                if updates:
                    stats['updated'] += 1
                    stats['properties_added'] += len(updates)
                    existing.update(updates)
            
            # Show results
            print(f"   ✓ Products found in catalog: {stats['found']}")
            print(f"   ✓ Products updated: {stats['updated']}")
            print(f"   ✓ Properties added: {stats['properties_added']}")
            print(f"   ✓ Conversions applied: {stats['conversions']}")
            
            # Sample product
            if stats['updated'] > 0:
                sample = next(p for p in extracted_products if p.get('sku') in catalog_by_sku)
                sample_sku = sample['sku']
                sample_product = catalog_by_sku[sample_sku]
                print(f"\n   📋 SAMPLE: {sample_sku}")
                for key, value in sample_product.items():
                    if key not in ['id', 'sku', 'name', 'category', 'catalog', 'images', 'seo'] and value:
                        print(f"      {key}: {value}")
            
            overall_stats['catalogs_processed'] += 1
            overall_stats['products_found'] += stats['found']
            overall_stats['products_updated'] += stats['updated']
            overall_stats['properties_added'] += stats['properties_added']
            overall_stats['conversions_applied'] += stats['conversions']
        
        except Exception as e:
            print(f"   ❌ Error: {e}")
            continue
    
    # Save updated catalog
    print(f"\n{'='*80}")
    print("SAVING UPDATED CATALOG")
    print(f"{'='*80}")
    
    with open(CATALOG_PATH, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    print(f"   ✓ Saved to: {CATALOG_PATH}")
    
    # Final summary
    print(f"\n{'='*80}")
    print("MERGE SUMMARY")
    print(f"{'='*80}")
    print(f"   Catalogs processed:    {overall_stats['catalogs_processed']}")
    print(f"   Products found:        {overall_stats['products_found']}")
    print(f"   Products updated:      {overall_stats['products_updated']}")
    print(f"   Properties added:      {overall_stats['properties_added']}")
    print(f"   Conversions applied:   {overall_stats['conversions_applied']}")
    print("=" * 80)
    print("✅ DYNAMIC MERGE COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    merge_all()
