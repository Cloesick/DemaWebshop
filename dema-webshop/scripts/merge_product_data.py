"""
Merge technical specifications from PDF analysis with catalog products
"""
import json
import os
from pathlib import Path

def load_json(file_path):
    """Load JSON file with error handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading {file_path}: {e}")
        return None

def merge_product_data():
    """Merge technical specs from analysis into catalog products"""
    
    # Paths
    analysis_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/input_pdfs_analysis_v3.json')
    catalog_path = Path('src/data/catalog_products.json')
    output_path = Path('src/data/catalog_products_enriched.json')
    
    print("Loading data files...")
    
    # Load existing catalog products
    catalog_products = load_json(catalog_path)
    if not catalog_products:
        print("Failed to load catalog products")
        return
    
    # Try to load analysis data (handle potential JSON errors)
    analysis_data = []
    try:
        with open(analysis_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            # Try fixing the JSON
            lines = content.split('\n')
            fixed_lines = []
            for i, line in enumerate(lines):
                # Check if line starts with a field but doesn't have opening brace
                stripped = line.strip()
                if stripped.startswith('"') and i > 0 and lines[i-1].strip() in ['},', '']:
                    fixed_lines.append('    {')
                fixed_lines.append(line)
            
            fixed_content = '\n'.join(fixed_lines)
            analysis_data = json.loads(fixed_content)
            print("Successfully parsed JSON after fixing")
    except Exception as e:
        print(f"Error loading analysis file: {e}")
        print("Trying alternative parsing...")
        try:
            # Alternative: read and parse object by object
            with open(analysis_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            
            # Find all complete JSON objects using regex-like approach
            import re
            # Split by "},\n" pattern to get individual objects
            objects = re.split(r'\},\s*\n\s*\{', content)
            for i, obj_str in enumerate(objects):
                # Add back the braces
                if not obj_str.strip().startswith('{'):
                    obj_str = '{' + obj_str
                if not obj_str.strip().endswith('}'):
                    obj_str = obj_str + '}'
                
                try:
                    obj = json.loads(obj_str.strip().strip('[').strip(']').strip(','))
                    analysis_data.append(obj)
                except Exception as e3:
                    # Skip malformed objects
                    continue
            
            print(f"Parsed {len(analysis_data)} objects using alternative method")
        except Exception as e2:
            print(f"Alternative parsing also failed: {e2}")
            return
    
    if not analysis_data:
        print("No analysis data loaded")
        return
    
    print(f"Loaded {len(catalog_products)} catalog products")
    print(f"Loaded {len(analysis_data)} analysis records")
    
    # Create lookup dictionary by SKU
    analysis_by_sku = {}
    for item in analysis_data:
        sku = item.get('sku')
        if sku:
            # Store technical specs
            analysis_by_sku[sku] = {
                'power_hp': item.get('power_hp'),
                'power_kw': item.get('power_kw_derived') or item.get('power_kw'),
                'voltage_v': item.get('voltage_v'),
                'volume_l': item.get('volume_l'),
                'length_m': item.get('length_m'),
                'weight_kg': item.get('weight_kg'),
                'pressure_max_bar': item.get('pressure_max_bar'),
                'pressure_min_bar': item.get('pressure_min_bar'),
                'connection_types': item.get('connection_types') or item.get('connection_type'),
                'flow_l_min': item.get('flow_l_min'),
                'rpm': item.get('rpm'),
            }
    
    print(f"Created lookup for {len(analysis_by_sku)} SKUs with technical specs")
    
    # Merge data
    enriched_count = 0
    for product in catalog_products:
        sku = product.get('sku')
        if sku and sku in analysis_by_sku:
            specs = analysis_by_sku[sku]
            # Add non-null technical specs to product
            for key, value in specs.items():
                if value is not None:
                    product[key] = value
                    enriched_count += 1
    
    print(f"Enriched {enriched_count} product fields")
    
    # Save enriched data
    print(f"Saving to {output_path}...")
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(catalog_products, f, ensure_ascii=False, indent=2)
    
    print("✅ Done! Created catalog_products_enriched.json")
    
    # Show sample enriched product
    enriched_samples = [p for p in catalog_products if p.get('power_kw') or p.get('voltage_v')]
    if enriched_samples:
        print("\nSample enriched product:")
        sample = enriched_samples[0]
        print(f"  SKU: {sample.get('sku')}")
        print(f"  Power: {sample.get('power_kw')} kW")
        print(f"  Voltage: {sample.get('voltage_v')} V")
        print(f"  Weight: {sample.get('weight_kg')} kg")

if __name__ == '__main__':
    merge_product_data()
