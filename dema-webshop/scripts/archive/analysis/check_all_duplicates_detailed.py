"""
Check for duplicate values across all specified catalogs with detailed examples
"""
import json
from pathlib import Path

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 100)
print("CHECKING DUPLICATE VALUES ACROSS CATALOGS - DETAILED REPORT")
print("=" * 100)

catalogs_to_check = [
    'abs-persluchtbuizen',
    'makita-catalogus-2022-nl',
    'airpress-catalogus-eng',
    'airpress-catalogus-nl-fr',
    'slangkoppelingen'
]

for catalog_name in catalogs_to_check:
    products = [p for p in catalog if p.get('catalog') == catalog_name]
    
    if not products:
        continue
    
    print(f"\n{'='*100}")
    print(f"CATALOG: {catalog_name.upper()}")
    print(f"{'='*100}")
    print(f"Total products: {len(products)}")
    
    # Collect all properties used
    all_props = {}
    for product in products:
        for key, value in product.items():
            if key in ['sku', 'name', 'catalog', 'imageUrl', 'images', 'image_paths', 'media', 'description', 'price']:
                continue
            
            if key not in all_props:
                all_props[key] = []
            all_props[key].append((product['sku'], value))
    
    # Check for duplicates within the same product
    print(f"\n🔍 Checking for duplicate property patterns:")
    
    issues_found = 0
    
    for product in products[:20]:  # Check first 20 products
        sku = product.get('sku')
        
        # Check for length properties
        length_props = [k for k in product.keys() if 'length' in k.lower() or 'lengte' in k.lower()]
        if len(length_props) > 1:
            values = {k: product[k] for k in length_props}
            unique_values = set(str(v) for v in values.values())
            if len(unique_values) == 1:  # All same value
                print(f"\n  ❌ SKU {sku}: Duplicate length properties")
                for k, v in values.items():
                    print(f"      {k}: {v}")
                issues_found += 1
                if issues_found >= 3:
                    break
        
        # Check for weight properties
        weight_props = [k for k in product.keys() if 'weight' in k.lower() or 'gewicht' in k.lower()]
        if len(weight_props) > 1:
            values = {k: product[k] for k in weight_props}
            # Check if any are the same
            weight_values = list(values.values())
            if len(weight_values) != len(set(str(v) for v in weight_values)):
                print(f"\n  ❌ SKU {sku}: Duplicate weight properties")
                for k, v in values.items():
                    print(f"      {k}: {v}")
                issues_found += 1
                if issues_found >= 3:
                    break
        
        # Check for volume/flow properties
        volume_props = [k for k in product.keys() if any(x in k.lower() for x in ['volume', 'flow', 'debiet', 'capaciteit'])]
        if len(volume_props) > 1:
            values = {k: product[k] for k in volume_props}
            # Check if they're the same value (excluding unit conversions)
            volume_values = {}
            for k, v in values.items():
                if v and isinstance(v, (int, float)):
                    volume_values[k] = v
            
            if len(volume_values) > 1:
                vals_list = list(volume_values.values())
                # Check if any two are exactly the same
                for i, v1 in enumerate(vals_list):
                    for v2 in vals_list[i+1:]:
                        if v1 == v2:
                            print(f"\n  ❌ SKU {sku}: Duplicate volume/flow properties")
                            for k, v in volume_values.items():
                                print(f"      {k}: {v}")
                            issues_found += 1
                            break
                    if issues_found >= 3:
                        break
        
        if issues_found >= 3:
            print(f"\n  ... (showing first 3 examples)")
            break
    
    if issues_found == 0:
        print(f"\n  ✅ No obvious duplicate patterns found in sample")

print("\n" + "=" * 100)
