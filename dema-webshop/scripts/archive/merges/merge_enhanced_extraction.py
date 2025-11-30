"""
Merge enhanced extraction data into webshop catalog
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

def main():
    print("=" * 80)
    print("MERGING ENHANCED EXTRACTION INTO WEBSHOP CATALOG")
    print("=" * 80)
    
    # Load catalog
    catalog_path = Path('src/data/catalog_products.json')
    print(f"\n📂 Loading catalog from {catalog_path}...")
    catalog = load_json(catalog_path)
    print(f"   ✓ {len(catalog)} products loaded")
    
    # Backup
    backup_path = Path('src/data/catalog_products_backup_enhanced.json')
    print(f"\n💾 Creating backup...")
    save_json(catalog, backup_path)
    print(f"   ✓ Backup saved")
    
    # Load enhanced extraction (use the latest validated version)
    enhanced_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/products_enhanced_20251127_145043.json')
    print(f"\n📂 Loading enhanced extraction from {enhanced_path}...")
    enhanced_products = load_json(enhanced_path)
    print(f"   ✓ {len(enhanced_products)} products loaded")
    
    # Build lookup by SKU
    print(f"\n🔍 Building SKU lookup...")
    enhanced_by_sku = {}
    for product in enhanced_products:
        sku = product.get('sku')
        if sku:
            # If multiple entries for same SKU, merge them
            if sku in enhanced_by_sku:
                # Merge properties
                for key, value in product.items():
                    if value and key not in enhanced_by_sku[sku]:
                        enhanced_by_sku[sku][key] = value
            else:
                enhanced_by_sku[sku] = product
    
    print(f"   ✓ {len(enhanced_by_sku)} unique SKUs in enhanced data")
    
    # Merge into catalog
    print(f"\n⚡ Merging enhanced data into catalog...")
    enriched_count = 0
    new_props_count = defaultdict(int)
    
    tech_fields = [
        'power_kw', 'power_hp', 'voltage_v', 
        'pressure_max_bar', 'pressure_burst_bar', 'pressure_min_bar',
        'weight_kg', 'volume_l', 'length_m',
        'flow_l_min', 'rpm', 'diameter_mm',
        'inner_diameter_mm', 'outer_diameter_mm', 'size_mm',
        'connection_type', 'thread_type', 'material',
        'product_type', 'model', 'description'
    ]
    
    for product in catalog:
        sku = product.get('sku')
        if not sku or sku not in enhanced_by_sku:
            continue
        
        enhanced_data = enhanced_by_sku[sku]
        has_new_data = False
        
        # Merge technical fields
        for field in tech_fields:
            if field in enhanced_data and enhanced_data[field]:
                value = enhanced_data[field]
                # Only update if catalog doesn't have it or has a default/empty value
                if field not in product or not product[field] or product[field] in [0, '', [], {}]:
                    product[field] = value
                    new_props_count[field] += 1
                    has_new_data = True
        
        # Also add icon meanings if present
        for key in enhanced_data:
            if '_icons' in key and key not in product:
                product[key] = enhanced_data[key]
                has_new_data = True
        
        if has_new_data:
            enriched_count += 1
    
    print(f"   ✓ Enriched {enriched_count} products with new data")
    
    # Statistics
    print(f"\n📊 ENRICHMENT STATISTICS:")
    print(f"   Total catalog products:    {len(catalog)}")
    print(f"   Products enriched:         {enriched_count}")
    print(f"   Coverage:                  {enriched_count/len(catalog)*100:.1f}%")
    
    print(f"\n   New properties added:")
    for field, count in sorted(new_props_count.items(), key=lambda x: x[1], reverse=True):
        if count > 0:
            print(f"     {field:30} {count:6} products")
    
    # Final coverage stats
    print(f"\n📊 FINAL TECHNICAL SPEC COVERAGE:")
    final_stats = defaultdict(int)
    for product in catalog:
        for field in tech_fields:
            if product.get(field) not in [None, '', [], {}, 0]:
                final_stats[field] += 1
    
    for field in sorted(final_stats.keys(), key=lambda x: final_stats[x], reverse=True):
        count = final_stats[field]
        pct = count / len(catalog) * 100
        print(f"     {field:30} {count:6} ({pct:5.1f}%)")
    
    # Save enriched catalog
    print(f"\n💾 Saving enriched catalog...")
    save_json(catalog, catalog_path)
    print(f"   ✓ Saved to {catalog_path}")
    
    # Show sample
    enriched_samples = [p for p in catalog if p.get('diameter_mm') or p.get('flow_l_min')][:2]
    if enriched_samples:
        print(f"\n📦 SAMPLE ENRICHED PRODUCTS:")
        for sample in enriched_samples:
            print(f"\n   {sample.get('sku')} - {sample.get('name', 'N/A')[:50]}")
            for field in tech_fields:
                if sample.get(field) not in [None, '', [], {}, 0]:
                    print(f"     {field:25} {sample[field]}")
    
    print(f"\n" + "=" * 80)
    print("✅ MERGE COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    main()
