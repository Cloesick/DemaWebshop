"""
Enrich existing catalog_products.json with technical specifications from PDF analysis
"""
import json
from pathlib import Path
from collections import defaultdict

def load_json(path):
    """Load JSON file"""
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(data, path):
    """Save JSON file"""
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def extract_technical_specs(analysis_item):
    """Extract technical specs from an analysis item"""
    specs = {}
    
    # List of technical fields to extract
    tech_fields = [
        'power_hp', 'power_kw', 'power_kw_derived',
        'voltage_v', 'pressure_max_bar', 'pressure_min_bar',
        'weight_kg', 'volume_l', 'length_m',
        'flow_l_min', 'flow_l_min_list', 'rpm',
        'connection_type', 'connection_types',
        'materials', 'size_inch', 'dimensions_mm_list',
        'product_type', 'vlotter'
    ]
    
    for field in tech_fields:
        if field in analysis_item and analysis_item[field] is not None:
            specs[field] = analysis_item[field]
    
    return specs

def main():
    print("=" * 80)
    print("ENRICHING CATALOG PRODUCTS WITH TECHNICAL SPECIFICATIONS")
    print("=" * 80)
    
    # Paths
    catalog_path = Path('src/data/catalog_products.json')
    analysis_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/input_pdfs_analysis_v8.json')
    output_path = Path('src/data/catalog_products.json')  # Overwrite original
    backup_path = Path('src/data/catalog_products_backup.json')  # Backup
    
    # Load existing catalog
    print(f"\n📂 Loading existing catalog from {catalog_path}...")
    catalog_products = load_json(catalog_path)
    print(f"   ✓ Loaded {len(catalog_products)} products")
    
    # Backup original
    print(f"\n💾 Creating backup at {backup_path}...")
    save_json(catalog_products, backup_path)
    print(f"   ✓ Backup created")
    
    # Load analysis data
    print(f"\n📂 Loading technical specs from {analysis_path}...")
    try:
        # Try to load as valid JSON first
        analysis_data = load_json(analysis_path)
        print(f"   ✓ Loaded {len(analysis_data)} analysis records")
    except:
        # Fall back to line-by-line parsing
        print("   ⚠ JSON parsing failed, trying alternative method...")
        import re
        with open(analysis_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        analysis_data = []
        objects = re.split(r'\},\s*\n\s*\{', content)
        for obj_str in objects:
            if not obj_str.strip().startswith('{'):
                obj_str = '{' + obj_str
            if not obj_str.strip().endswith('}'):
                obj_str = obj_str + '}'
            try:
                obj = json.loads(obj_str.strip().strip('[').strip(']').strip(','))
                analysis_data.append(obj)
            except:
                continue
        print(f"   ✓ Parsed {len(analysis_data)} analysis records")
    
    # Create lookup by SKU
    print(f"\n🔍 Building technical specs lookup by SKU...")
    specs_by_sku = {}
    for item in analysis_data:
        sku = item.get('sku')
        if sku:
            specs = extract_technical_specs(item)
            if specs:  # Only add if there are actual specs
                specs_by_sku[sku] = specs
    
    print(f"   ✓ Found technical specs for {len(specs_by_sku)} SKUs")
    
    # Enrich catalog products
    print(f"\n⚡ Enriching products with technical specifications...")
    enriched_count = 0
    fields_added = defaultdict(int)
    
    for product in catalog_products:
        sku = product.get('sku')
        if sku and sku in specs_by_sku:
            specs = specs_by_sku[sku]
            # Add each technical spec to the product
            for field, value in specs.items():
                if value is not None:
                    product[field] = value
                    fields_added[field] += 1
            enriched_count += 1
    
    print(f"   ✓ Enriched {enriched_count} products")
    
    # Show statistics
    print(f"\n📊 ENRICHMENT STATISTICS:")
    print(f"   Total products:        {len(catalog_products)}")
    print(f"   Products enriched:     {enriched_count}")
    print(f"   Coverage:              {enriched_count/len(catalog_products)*100:.1f}%")
    print(f"\n   Fields added:")
    for field, count in sorted(fields_added.items(), key=lambda x: x[1], reverse=True):
        print(f"     - {field:25} {count:6} products")
    
    # Save enriched catalog
    print(f"\n💾 Saving enriched catalog to {output_path}...")
    save_json(catalog_products, output_path)
    print(f"   ✓ Saved successfully")
    
    # Show sample enriched product
    enriched_samples = [p for p in catalog_products if p.get('power_kw') or p.get('voltage_v') or p.get('pressure_max_bar')]
    if enriched_samples:
        print(f"\n📦 SAMPLE ENRICHED PRODUCT:")
        sample = enriched_samples[0]
        print(f"   SKU:           {sample.get('sku')}")
        print(f"   Name:          {sample.get('name')}")
        print(f"   Catalog:       {sample.get('catalog')}")
        if sample.get('power_kw'):
            print(f"   Power:         {sample.get('power_kw')} kW")
        if sample.get('voltage_v'):
            print(f"   Voltage:       {sample.get('voltage_v')} V")
        if sample.get('pressure_max_bar'):
            print(f"   Pressure:      {sample.get('pressure_max_bar')} bar")
        if sample.get('weight_kg'):
            print(f"   Weight:        {sample.get('weight_kg')} kg")
    
    print(f"\n" + "=" * 80)
    print("✅ ENRICHMENT COMPLETE!")
    print("=" * 80)
    print(f"\n💡 Original backed up to: {backup_path}")
    print(f"📄 Enriched catalog at:   {output_path}")

if __name__ == '__main__':
    main()
