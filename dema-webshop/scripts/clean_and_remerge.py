"""
Clean invalid values from catalog and re-merge with validated extraction
"""
import json
from pathlib import Path
from collections import defaultdict

def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def validate_value(prop_name, value):
    """Check if a value is reasonable for its property"""
    if value is None or (isinstance(value, (int, float)) and value < 0):
        return False
    
    validation_rules = {
        'length_m': (0.01, 200),
        'diameter_mm': (0.1, 2000),
        'weight_kg': (0.001, 10000),
        'volume_l': (0.1, 10000),
        'pressure_max_bar': (0.1, 500),
        'voltage_v': (1, 1000),
        'power_kw': (0.01, 1000),
        'power_hp': (0.01, 1500),
        'flow_l_min': (0.1, 100000),
        'rpm': (1, 50000),
    }
    
    if prop_name in validation_rules and isinstance(value, (int, float)):
        min_val, max_val = validation_rules[prop_name]
        return min_val <= value <= max_val
    
    return True

def main():
    print("=" * 80)
    print("CLEAN INVALID VALUES AND RE-MERGE VALIDATED EXTRACTION")
    print("=" * 80)
    
    # Load catalog
    catalog_path = Path('src/data/catalog_products.json')
    print(f"\n📂 Loading catalog...")
    catalog = load_json(catalog_path)
    print(f"   ✓ {len(catalog)} products loaded")
    
    # Backup
    backup_path = Path('src/data/catalog_products_backup_cleaned.json')
    print(f"\n💾 Creating backup...")
    save_json(catalog, backup_path)
    print(f"   ✓ Backup saved")
    
    # Clean invalid values
    print(f"\n🧹 Cleaning invalid values...")
    cleaned_count = defaultdict(int)
    
    tech_fields = [
        'length_m', 'diameter_mm', 'weight_kg', 'volume_l',
        'pressure_max_bar', 'voltage_v', 'power_kw', 'power_hp',
        'flow_l_min', 'rpm'
    ]
    
    for product in catalog:
        for field in tech_fields:
            if field in product and product[field] is not None:
                if not validate_value(field, product[field]):
                    print(f"   ❌ Removed invalid {field}={product[field]} from {product.get('sku')}")
                    product[field] = None
                    cleaned_count[field] += 1
    
    print(f"\n   Total invalid values cleaned:")
    for field, count in sorted(cleaned_count.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"     {field:20} {count:5} values")
    
    # Load validated extraction
    enhanced_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/products_enhanced_20251127_145043.json')
    print(f"\n📂 Loading validated extraction...")
    enhanced_products = load_json(enhanced_path)
    print(f"   ✓ {len(enhanced_products)} products loaded")
    
    # Build lookup
    print(f"\n🔍 Building SKU lookup...")
    enhanced_by_sku = {}
    for product in enhanced_products:
        sku = product.get('sku')
        if sku:
            if sku in enhanced_by_sku:
                for key, value in product.items():
                    if value and key not in enhanced_by_sku[sku]:
                        enhanced_by_sku[sku][key] = value
            else:
                enhanced_by_sku[sku] = product
    
    print(f"   ✓ {len(enhanced_by_sku)} unique SKUs")
    
    # Re-merge
    print(f"\n⚡ Re-merging validated data...")
    enriched_count = 0
    new_props_count = defaultdict(int)
    
    for product in catalog:
        sku = product.get('sku')
        if not sku or sku not in enhanced_by_sku:
            continue
        
        enhanced_data = enhanced_by_sku[sku]
        has_new_data = False
        
        for field in tech_fields:
            if field in enhanced_data and enhanced_data[field]:
                # Only update if catalog doesn't have it or has None
                if not product.get(field):
                    product[field] = enhanced_data[field]
                    new_props_count[field] += 1
                    has_new_data = True
        
        if has_new_data:
            enriched_count += 1
    
    print(f"   ✓ Re-enriched {enriched_count} products")
    
    print(f"\n   New properties added:")
    for field, count in sorted(new_props_count.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"     {field:20} {count:5} products")
    
    # Final stats
    print(f"\n📊 FINAL VALIDATED COVERAGE:")
    final_stats = defaultdict(int)
    for product in catalog:
        for field in tech_fields:
            if product.get(field) not in [None, '', [], {}, 0]:
                final_stats[field] += 1
    
    for field in sorted(final_stats.keys(), key=lambda x: final_stats[x], reverse=True):
        count = final_stats[field]
        pct = count / len(catalog) * 100
        print(f"     {field:20} {count:6} ({pct:5.1f}%)")
    
    # Save
    print(f"\n💾 Saving cleaned and re-merged catalog...")
    save_json(catalog, catalog_path)
    print(f"   ✓ Saved to {catalog_path}")
    
    # Show clean samples
    clean_lengths = [p for p in catalog if p.get('length_m') and 0.01 <= p['length_m'] <= 200][:5]
    if clean_lengths:
        print(f"\n📏 SAMPLE VALIDATED LENGTHS:")
        for p in clean_lengths:
            print(f"   {p['sku']:15} {p.get('catalog', 'N/A'):30} {p['length_m']} m")
    
    print(f"\n" + "=" * 80)
    print("✅ CLEANUP AND RE-MERGE COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    main()
