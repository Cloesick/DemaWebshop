"""
Advanced enrichment with multiple sources and property inheritance
"""
import json
import re
from pathlib import Path
from collections import defaultdict

def load_json(path):
    """Load JSON file"""
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return None

def extract_sku_base(sku):
    """Extract base SKU pattern (remove numbers/variants)"""
    # Remove trailing numbers and common suffixes
    base = re.sub(r'\d+$', '', sku)
    base = re.sub(r'[_-]\d+$', '', base)
    return base.upper()

def merge_specs(existing, new):
    """Merge specs, keeping existing values priority"""
    merged = existing.copy() if existing else {}
    for key, value in (new or {}).items():
        if value is not None and key not in merged:
            merged[key] = value
    return merged

def main():
    print("=" * 80)
    print("ADVANCED PRODUCT ENRICHMENT")
    print("Multi-source + Property Inheritance")
    print("=" * 80)
    
    # Paths
    catalog_path = Path('src/data/catalog_products.json')
    analyzer_base = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output')
    backup_path = Path('src/data/catalog_products_backup_v2.json')
    
    # Load catalog
    print(f"\n📂 Loading catalog...")
    catalog = load_json(catalog_path)
    print(f"   ✓ {len(catalog)} products loaded")
    
    # Backup
    print(f"\n💾 Creating backup...")
    with open(backup_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Backup saved")
    
    # Load multiple analysis versions
    print(f"\n📊 Loading technical specs from multiple sources...")
    all_specs = {}  # SKU -> specs dict
    
    sources = ['v8', 'v2', 'v1', 'v9']
    for version in sources:
        file_path = analyzer_base / f'input_pdfs_analysis_{version}.json'
        data = load_json(file_path)
        if not data:
            print(f"   ⚠ {version}: Failed to load")
            continue
        
        tech_fields = [
            'power_hp', 'power_kw', 'power_kw_derived',
            'voltage_v', 'pressure_max_bar', 'pressure_min_bar',
            'weight_kg', 'volume_l', 'length_m',
            'flow_l_min', 'flow_l_min_list', 'rpm',
            'connection_type', 'connection_types',
            'materials', 'size_inch', 'dimensions_mm_list',
            'product_type', 'vlotter', 'product_category'
        ]
        
        count = 0
        for item in data:
            sku = item.get('sku')
            if not sku:
                continue
            
            specs = {k: item.get(k) for k in tech_fields if item.get(k) is not None}
            if specs:
                # Merge with existing specs (don't overwrite)
                all_specs[sku] = merge_specs(all_specs.get(sku), specs)
                count += 1
        
        print(f"   ✓ {version}: {len(data)} products, {count} with specs")
    
    print(f"\n   📦 Total unique SKUs with specs: {len(all_specs)}")
    
    # Phase 1: Direct SKU matching
    print(f"\n⚡ Phase 1: Direct SKU matching...")
    direct_matches = 0
    for product in catalog:
        sku = product.get('sku')
        if sku and sku in all_specs:
            for key, value in all_specs[sku].items():
                if key not in product or product[key] is None:
                    product[key] = value
            direct_matches += 1
    print(f"   ✓ {direct_matches} products enriched")
    
    # Phase 2: Property inheritance by catalog
    print(f"\n🔄 Phase 2: Property inheritance by catalog...")
    catalog_specs = defaultdict(lambda: defaultdict(list))
    
    # Collect specs by catalog
    for product in catalog:
        cat = product.get('catalog')
        if not cat:
            continue
        for field in ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg']:
            if product.get(field) is not None:
                catalog_specs[cat][field].append(product[field])
    
    # Apply most common value to products missing specs
    inherited = 0
    for product in catalog:
        cat = product.get('catalog')
        if not cat:
            continue
        
        for field, values in catalog_specs[cat].items():
            if product.get(field) is None and values:
                # Use most common value
                most_common = max(set(values), key=values.count)
                if values.count(most_common) >= 3:  # At least 3 products have this value
                    product[field] = most_common
                    inherited += 1
    
    print(f"   ✓ {inherited} properties inherited")
    
    # Phase 3: SKU pattern matching
    print(f"\n🔍 Phase 3: SKU pattern matching...")
    sku_patterns = defaultdict(list)
    
    # Group products by SKU base pattern
    for product in catalog:
        sku = product.get('sku')
        if sku:
            base = extract_sku_base(sku)
            if base:
                sku_patterns[base].append(product)
    
    # Propagate specs within SKU families
    pattern_enriched = 0
    for base, products in sku_patterns.items():
        if len(products) < 2:
            continue
        
        # Collect all specs from this SKU family
        family_specs = defaultdict(list)
        for p in products:
            for field in ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg', 'connection_types']:
                if p.get(field) is not None:
                    family_specs[field].append(p[field])
        
        # Apply to products missing these specs
        for product in products:
            for field, values in family_specs.items():
                if product.get(field) is None and values:
                    # For numeric fields, use average
                    if field in ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg']:
                        numeric_values = [v for v in values if isinstance(v, (int, float))]
                        if numeric_values:
                            product[field] = round(sum(numeric_values) / len(numeric_values), 2)
                            pattern_enriched += 1
                    # For list fields (like connection_types), skip or use first
                    elif isinstance(values[0], list):
                        # Use the first non-empty list
                        for val in values:
                            if val:
                                product[field] = val
                                pattern_enriched += 1
                                break
                    # For strings, use most common
                    else:
                        try:
                            most_common = max(set(values), key=values.count)
                            product[field] = most_common
                            pattern_enriched += 1
                        except:
                            # Skip if unhashable
                            pass
    
    print(f"   ✓ {pattern_enriched} properties propagated within SKU families")
    
    # Statistics
    print(f"\n📊 FINAL STATISTICS:")
    stats = defaultdict(int)
    for product in catalog:
        for field in ['power_kw', 'voltage_v', 'pressure_max_bar', 'weight_kg', 'connection_types', 'dimensions_mm_list']:
            if product.get(field) is not None:
                stats[field] += 1
    
    print(f"   Total products: {len(catalog)}")
    print(f"\n   Products with technical specs:")
    for field, count in sorted(stats.items(), key=lambda x: x[1], reverse=True):
        pct = count / len(catalog) * 100
        print(f"     - {field:25} {count:6} ({pct:5.1f}%)")
    
    # Save
    print(f"\n💾 Saving enriched catalog...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Saved to {catalog_path}")
    
    # Sample
    enriched_samples = [p for p in catalog if p.get('power_kw') or p.get('voltage_v')]
    if enriched_samples:
        print(f"\n📦 SAMPLE ENRICHED PRODUCTS:")
        for sample in enriched_samples[:3]:
            print(f"\n   {sample.get('sku')} - {sample.get('name', 'N/A')[:50]}")
            if sample.get('power_kw'):
                print(f"     Power:    {sample.get('power_kw')} kW")
            if sample.get('voltage_v'):
                print(f"     Voltage:  {sample.get('voltage_v')} V")
            if sample.get('pressure_max_bar'):
                print(f"     Pressure: {sample.get('pressure_max_bar')} bar")
            if sample.get('weight_kg'):
                print(f"     Weight:   {sample.get('weight_kg')} kg")
    
    print(f"\n" + "=" * 80)
    print("✅ ADVANCED ENRICHMENT COMPLETE!")
    print("=" * 80)
    print(f"\n💡 Backup saved to: {backup_path}")

if __name__ == '__main__':
    main()
