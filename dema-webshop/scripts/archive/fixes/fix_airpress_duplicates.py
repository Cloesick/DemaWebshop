import json
from collections import defaultdict

print("=" * 100)
print("FIXING AIRPRESS DUPLICATE VALUES")
print("=" * 100)
print()

# Load existing products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find airpress products
airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']

print(f"Total airpress products: {len(airpress_products)}")
print()

fixes_applied = {
    'power_hp_removed': 0,
    'suspicious_duplicates': []
}

for product in airpress_products:
    sku = product['sku']
    
    # Fix 1: Remove power_hp if it equals power_kw (likely a parsing error)
    if 'power_hp' in product and 'power_kw' in product:
        if product['power_hp'] == product['power_kw']:
            print(f"Removing power_hp from {sku} (duplicate of power_kw: {product['power_hp']})")
            del product['power_hp']
            fixes_applied['power_hp_removed'] += 1
    
    # Check for other suspicious duplicates
    seen_values = defaultdict(list)
    for key, value in product.items():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description', 'image_paths', 'media', 'imageUrl', 'attributes', 'source', 'priceMode', 'stock', 'category', 'id']:
            if value is not None and value != '':
                value_str = str(value)
                seen_values[value_str].append(key)
    
    # Find remaining duplicates
    for value, keys in seen_values.items():
        if len(keys) > 1:
            # Skip if they're related properties that can legitimately have same value
            # e.g., flow_l_min and flow_l_min_list might both exist
            if not ('flow_l_min' in keys and 'flow_l_min_list' in keys):
                fixes_applied['suspicious_duplicates'].append({
                    'sku': sku,
                    'value': value,
                    'properties': keys
                })

print()
print("=" * 100)
print("FIX SUMMARY")
print("=" * 100)
print(f"✅ Removed power_hp from {fixes_applied['power_hp_removed']} products")
print()

if fixes_applied['suspicious_duplicates']:
    print(f"⚠️  {len(fixes_applied['suspicious_duplicates'])} products still have potential duplicates:")
    print("-" * 100)
    for dup in fixes_applied['suspicious_duplicates']:
        print(f"  SKU: {dup['sku']}")
        print(f"    Value '{dup['value']}' in: {', '.join(dup['properties'])}")
        
        # These might be legitimate - two unrelated properties with same value
        # e.g., volume_l=6 and pressure_min_bar=6 on different products
        print(f"    Note: May be legitimate if properties are unrelated")
        print()
else:
    print("✅ No remaining suspicious duplicates!")

print()
print("Saving updated catalog...")

# Save updated catalog
with open('src/data/catalog_products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print()
print("=" * 100)
print("✅ COMPLETE!")
print("=" * 100)
print(f"Updated catalog saved to: src/data/catalog_products.json")
print(f"Total fixes applied: {fixes_applied['power_hp_removed']}")
print()

# Save detailed report
with open('AIRPRESS_FIX_REPORT.txt', 'w', encoding='utf-8') as f:
    f.write("=" * 100 + "\n")
    f.write("AIRPRESS DUPLICATE FIX REPORT\n")
    f.write("=" * 100 + "\n\n")
    f.write(f"Total products processed: {len(airpress_products)}\n")
    f.write(f"power_hp removed: {fixes_applied['power_hp_removed']}\n\n")
    
    if fixes_applied['suspicious_duplicates']:
        f.write("=" * 100 + "\n")
        f.write("REMAINING POTENTIAL DUPLICATES\n")
        f.write("=" * 100 + "\n\n")
        f.write(f"These {len(fixes_applied['suspicious_duplicates'])} products have properties with identical values.\n")
        f.write("Review these manually to determine if they're legitimate or parsing errors.\n\n")
        
        for dup in fixes_applied['suspicious_duplicates']:
            f.write(f"SKU: {dup['sku']}\n")
            f.write(f"  Value '{dup['value']}' appears in: {', '.join(dup['properties'])}\n")
            f.write(f"  Note: May be legitimate if properties are unrelated\n\n")
    else:
        f.write("\n✅ No remaining duplicates!\n")

print(f"📄 Detailed report saved to: AIRPRESS_FIX_REPORT.txt")
