"""
Fix aandrijftechniek catalog SKUs
The catalog has wrong SKUs (P200, P204 - which are bearing housing codes!)
The correct SKUs are RLNUCP204, RLFUCP204, CARBU..., etc. from the PDF tables
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

# Load extracted specs with correct SKUs
specs_path = Path('C:/Users/prova/Documents/Projects/PDF_Analyzer/output/aandrijftechniek_specs.json')
with open(specs_path, 'r', encoding='utf-8') as f:
    specs_data = json.load(f)

print("=" * 80)
print("FIXING AANDRIJFTECHNIEK SKUs")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_fix_skus.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Find aandrijftechniek products
aandrijf_products = [p for p in catalog if 'aandrijftechniek' in str(p.get('catalog', '')).lower()]
print(f"\n📦 Found {len(aandrijf_products)} aandrijftechniek products in catalog")
print(f"📄 Found {len(specs_data)} products with correct SKUs in extraction")

# Build mapping by page and bearing housing
# The catalog products have wrong SKUs but correct pages
# The extracted products have correct SKUs and bearing housing
# We can match by page + bearing housing

specs_by_page_bearing = {}
for spec in specs_data:
    page = spec.get('page_in_pdf')
    bearing = spec.get('bearing_housing')
    if page and bearing:
        key = f"p{page}_{bearing}"
        specs_by_page_bearing[key] = spec

print(f"\n🔍 Built mapping for {len(specs_by_page_bearing)} products")

stats = {
    'updated': 0,
    'not_found': 0
}

print(f"\n⚡ Updating SKUs...")

for product in aandrijf_products:
    old_sku = product.get('sku')
    
    # Try to find correct SKU by matching with specs
    # Option 1: Direct match (if catalog SKU happens to match extracted SKU)
    matching_spec = next((s for s in specs_data if s.get('sku') == old_sku), None)
    
    # Option 2: Match by bearing housing in description or properties
    if not matching_spec:
        # Check if old SKU looks like a bearing housing (P204, P205, etc.)
        if old_sku and (old_sku.startswith('P') or old_sku.startswith('F')):
            # This might be a bearing housing, try to find a spec with this bearing
            matching_spec = next((s for s in specs_data if s.get('bearing_housing') == old_sku), None)
    
    # Option 3: Extract page from description and try to match
    if not matching_spec:
        import re
        desc = product.get('description', '')
        page_match = re.search(r'pages?:\s*(\d+)', desc)
        if page_match:
            page = int(page_match.group(1))
            # Find specs from this page
            page_specs = [s for s in specs_data if s.get('page_in_pdf') == page]
            if len(page_specs) == 1:
                matching_spec = page_specs[0]
            elif len(page_specs) > 1:
                # Multiple on same page, try to match by any available info
                # For now, take first one as fallback
                matching_spec = page_specs[0]
    
    if matching_spec:
        new_sku = matching_spec.get('sku')
        if new_sku and new_sku != old_sku:
            # Update SKU and add all properties
            product['sku'] = new_sku
            product['old_sku'] = old_sku  # Keep reference
            
            # Add all extracted properties
            if 'diameter_mm' in matching_spec:
                product['diameter_mm'] = matching_spec['diameter_mm']
            if 'inner_diameter_mm' in matching_spec:
                product['inner_diameter_mm'] = matching_spec['inner_diameter_mm']
            if 'bearing_housing' in matching_spec:
                product['bearing_housing'] = matching_spec['bearing_housing']
            if 'pillow_block_bearing' in matching_spec:
                product['pillow_block_bearing'] = matching_spec['pillow_block_bearing']
            if 'min_temp_c' in matching_spec:
                product['min_temp_c'] = matching_spec['min_temp_c']
                product['max_temp_c'] = matching_spec['max_temp_c']
            if 'type' in matching_spec:
                product['bearing_type'] = matching_spec['type']
            if 'application' in matching_spec:
                product['application'] = matching_spec['application']
            
            stats['updated'] += 1
            
            if stats['updated'] <= 20:
                print(f"   ✓ {old_sku:20} → {new_sku:20} (bearing: {matching_spec.get('bearing_housing', 'N/A')})")
    else:
        stats['not_found'] += 1
        if stats['not_found'] <= 10:
            print(f"   ✗ {old_sku:20} → No match found")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 UPDATE STATISTICS:")
print(f"   Total aandrijf products:  {len(aandrijf_products)}")
print(f"   SKUs updated:             {stats['updated']}")
print(f"   No match found:           {stats['not_found']}")
print(f"   Success rate:             {stats['updated']/len(aandrijf_products)*100:.1f}%")

# Show sample updated products
updated_products = [p for p in aandrijf_products if p.get('old_sku')][:5]
if updated_products:
    print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
    for p in updated_products:
        print(f"\n   Old SKU: {p['old_sku']}")
        print(f"   New SKU: {p['sku']}")
        if p.get('diameter_mm'):
            print(f"   📏 Diameter: {p['diameter_mm']} mm")
        if p.get('bearing_housing'):
            print(f"   🏠 Bearing Housing: {p['bearing_housing']}")
        if p.get('pillow_block_bearing'):
            print(f"   🔩 Pillow Block: {p['pillow_block_bearing']}")

print(f"\n{'='*80}")
print("✅ SKU FIX COMPLETE!")
print("="*80)
