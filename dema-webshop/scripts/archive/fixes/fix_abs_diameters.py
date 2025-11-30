"""
Fix ABS-Persluchtbuizen diameter extraction for all product variants
Pattern analysis:
- ABSBU016 → 16mm (last 3 digits)
- ABSK01690 → 016mm diameter, 90° angle (digits 5-7)
- ABST02045 → 020mm diameter, 45° angle (digits 5-7)
"""
import json
from pathlib import Path
import shutil
import re

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("FIXING ABS-PERSLUCHTBUIZEN DIAMETERS")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_abs_diameters.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Find ABS products
abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
print(f"\n📦 Found {len(abs_products)} abs-persluchtbuizen products")

stats = {
    'products_checked': 0,
    'diameters_updated': 0,
    'already_correct': 0,
    'patterns': {
        'ABSBU': 0,  # ABSBU016 → 16mm
        'ABSK': 0,   # ABSK01690 → 16mm, 90°
        'ABST': 0,   # ABST02045 → 20mm, 45°
        'BSB': 0,    # BSB02090 → 20mm, 90°
        'other': 0
    }
}

print(f"\n⚡ Fixing diameters...")

for product in abs_products:
    stats['products_checked'] += 1
    sku = product.get('sku', '')
    current_diameter = product.get('diameter_mm')
    new_diameter = None
    pattern_type = 'other'
    
    # Pattern 1: ABSBU### (last 3 digits are diameter)
    if sku.startswith('ABSBU') and len(sku) >= 8:
        try:
            new_diameter = int(sku[-3:])
            pattern_type = 'ABSBU'
        except ValueError:
            pass
    
    # Pattern 2: ABSK###XX or ABST###XX (digits at position 5-7 are diameter, last 2 are angle)
    elif (sku.startswith('ABSK') or sku.startswith('ABST')) and len(sku) >= 9:
        try:
            # Extract diameter from positions 5-7 (e.g., ABSK01690 → 016)
            diameter_str = sku[4:7]
            new_diameter = int(diameter_str)
            pattern_type = 'ABSK' if sku.startswith('ABSK') else 'ABST'
        except ValueError:
            pass
    
    # Pattern 3: BSB###XX (similar pattern)
    elif sku.startswith('BSB') and len(sku) >= 8:
        try:
            # Extract diameter from positions 4-6 (e.g., BSB02090 → 020)
            diameter_str = sku[3:6]
            new_diameter = int(diameter_str)
            pattern_type = 'BSB'
        except ValueError:
            pass
    
    # Update if we found a diameter
    if new_diameter:
        stats['patterns'][pattern_type] += 1
        
        if current_diameter == new_diameter:
            stats['already_correct'] += 1
        else:
            product['diameter_mm'] = new_diameter
            product['diameter_source'] = 'sku_pattern'
            stats['diameters_updated'] += 1
            
            if stats['diameters_updated'] <= 15:
                print(f"   ✓ {sku:15} | {current_diameter if current_diameter else 'N/A':>6} → {new_diameter:3} mm ({pattern_type})")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 FIX STATISTICS:")
print(f"   Products checked:          {stats['products_checked']}")
print(f"   Diameters updated:         {stats['diameters_updated']}")
print(f"   Already correct:           {stats['already_correct']}")

print(f"\n📋 BY PATTERN:")
for pattern, count in stats['patterns'].items():
    if count > 0:
        print(f"   {pattern:10} → {count} products")

# Verify
print(f"\n✅ VERIFICATION:")
abs_products_updated = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
with_diameter = len([p for p in abs_products_updated if p.get('diameter_mm')])
print(f"   Products with diameter:    {with_diameter} / {len(abs_products_updated)}")

# Show samples
print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
for p in abs_products_updated[:10]:
    sku = p.get('sku')
    diameter = p.get('diameter_mm', 'N/A')
    print(f"   {sku:15} → {diameter:3} mm")

print(f"\n{'='*80}")
print("✅ DIAMETERS FIXED!")
print("="*80)
