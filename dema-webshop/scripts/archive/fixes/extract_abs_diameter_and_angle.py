"""
Extract BOTH diameter and angle from ABS-Persluchtbuizen SKUs
Pattern analysis:
- ABSBU016 → 16mm diameter, no angle (straight pipe)
- ABSK01690 → 16mm diameter, 90° angle (elbow)
- ABST02045 → 20mm diameter, 45° angle (T-fitting)
- BSB02090 → 20mm diameter, 90° angle
"""
import json
from pathlib import Path
import shutil

# Load catalog
catalog_path = Path('src/data/catalog_products.json')
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

print("=" * 80)
print("EXTRACTING ABS DIAMETER AND ANGLE")
print("=" * 80)

# Backup
backup_path = Path('src/data/catalog_products_backup_abs_diameter_angle.json')
print(f"\n💾 Creating backup...")
shutil.copy(catalog_path, backup_path)
print(f"   ✓ Backup saved")

# Find ABS products
abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
print(f"\n📦 Found {len(abs_products)} abs-persluchtbuizen products")

stats = {
    'products_checked': 0,
    'diameter_set': 0,
    'angle_set': 0,
    'straight_pipes': 0,
    'angled_fittings': 0
}

print(f"\n⚡ Extracting diameter and angle...")

for product in abs_products:
    stats['products_checked'] += 1
    sku = product.get('sku', '')
    diameter = None
    angle = None
    product_type = None
    
    # Pattern 1: ABSBU### (Straight pipes - no angle)
    if sku.startswith('ABSBU') and len(sku) >= 8:
        try:
            diameter = int(sku[-3:])
            product_type = 'Straight pipe'
            stats['straight_pipes'] += 1
        except ValueError:
            pass
    
    # Pattern 2: ABSK#####° (Elbow fittings - has angle)
    elif sku.startswith('ABSK') and len(sku) >= 9:
        try:
            # Extract diameter from positions 5-7 (e.g., ABSK01690 → 016)
            diameter = int(sku[4:7])
            # Extract angle from last 2 digits (e.g., ABSK01690 → 90)
            angle = int(sku[-2:])
            product_type = 'Elbow'
            stats['angled_fittings'] += 1
        except ValueError:
            pass
    
    # Pattern 3: ABST#####° (T-fittings - has angle)
    elif sku.startswith('ABST') and len(sku) >= 9:
        try:
            # Extract diameter from positions 5-7 (e.g., ABST02045 → 020)
            diameter = int(sku[4:7])
            # Extract angle from last 2 digits (e.g., ABST02045 → 45)
            angle = int(sku[-2:])
            product_type = 'T-fitting'
            stats['angled_fittings'] += 1
        except ValueError:
            pass
    
    # Pattern 4: BSB##### (Components - may have angle)
    elif sku.startswith('BSB') and len(sku) >= 8:
        try:
            # Extract diameter from positions 4-6 (e.g., BSB02090 → 020)
            diameter = int(sku[3:6])
            # Try to extract angle from last 2 digits
            if len(sku) >= 8:
                angle = int(sku[-2:])
            product_type = 'Component'
            stats['angled_fittings'] += 1
        except ValueError:
            pass
    
    # Update product with extracted values
    if diameter:
        product['diameter_mm'] = diameter
        product['diameter_source'] = 'sku_pattern'
        stats['diameter_set'] += 1
    
    if angle and angle in [9, 45, 90]:  # Valid angles only
        product['angle_degrees'] = angle
        stats['angle_set'] += 1
    
    # Log first 15 updates
    if stats['products_checked'] <= 15:
        diameter_str = f"{diameter:3} mm" if diameter else "N/A"
        angle_str = f"{angle:2}°" if angle else "N/A"
        print(f"   ✓ {sku:15} | ø {diameter_str} | ∠ {angle_str:4} | {product_type}")

# Save updated catalog
print(f"\n💾 Saving updated catalog...")
with open(catalog_path, 'w', encoding='utf-8') as f:
    json.dump(catalog, f, ensure_ascii=False, indent=2)
print(f"   ✓ Saved to {catalog_path}")

# Statistics
print(f"\n📊 EXTRACTION STATISTICS:")
print(f"   Products checked:          {stats['products_checked']}")
print(f"   Diameters set:             {stats['diameter_set']}")
print(f"   Angles set:                {stats['angle_set']}")
print(f"   Straight pipes (no angle): {stats['straight_pipes']}")
print(f"   Angled fittings:           {stats['angled_fittings']}")

# Show samples
print(f"\n📋 SAMPLE PRODUCTS BY TYPE:")

# Straight pipes
straight = [p for p in abs_products if p.get('diameter_mm') and not p.get('angle_degrees')]
if straight:
    print(f"\n   Straight Pipes (no angle):")
    for p in straight[:3]:
        print(f"      {p['sku']:15} → ø {p['diameter_mm']} mm")

# 90° fittings
angle_90 = [p for p in abs_products if p.get('angle_degrees') == 90]
if angle_90:
    print(f"\n   90° Fittings:")
    for p in angle_90[:3]:
        print(f"      {p['sku']:15} → ø {p['diameter_mm']} mm, ∠ 90°")

# 45° fittings
angle_45 = [p for p in abs_products if p.get('angle_degrees') == 45]
if angle_45:
    print(f"\n   45° Fittings:")
    for p in angle_45[:3]:
        print(f"      {p['sku']:15} → ø {p['diameter_mm']} mm, ∠ 45°")

print(f"\n{'='*80}")
print("✅ DIAMETER AND ANGLE EXTRACTED!")
print("="*80)
