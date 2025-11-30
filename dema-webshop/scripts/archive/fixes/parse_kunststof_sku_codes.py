import json
import re

# Load catalog
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find products from kunststof-afvoerleidingen
kunststof_products = [p for p in products if p.get('catalog') == 'kunststof-afvoerleidingen']

print(f"Found {len(kunststof_products)} products in kunststof-afvoerleidingen catalog")
print()

def parse_sku_pattern1(sku):
    """
    Pattern 1: AB0322 (2 letters + 4 digits)
    - First 3 digits (032) = diameter in mm (32mm)
    - Last digit (2) = length in meters (2m)
    """
    match = re.match(r'^[A-Z]{2}(\d{3})(\d)$', sku)
    if match:
        diameter = int(match.group(1))  # 032 -> 32
        length = int(match.group(2))     # 2 -> 2
        return {
            'diameter_mm': diameter,
            'length_m': length,
            'pattern': 'AB0322: 2 letters + diameter(3) + length(1)'
        }
    return None

def parse_sku_pattern2(sku):
    """
    Pattern 2: T032453 (T + 6 digits)
    - T = type indicator
    - 032 = diameter in mm (32mm) - 3 digits
    - 45 = angle in degrees (45°) - 2 digits
    - 3 = length in meters (3m) - 1 digit
    """
    match = re.match(r'^T(\d{3})(\d{2})(\d)$', sku)
    if match:
        diameter = int(match.group(1))  # 032 -> 32mm
        angle = int(match.group(2))     # 45 -> 45 degrees
        length = int(match.group(3))    # 3 -> 3m
        return {
            'diameter_mm': diameter,
            'angle_degrees': angle,
            'length_m': length,
            'pattern': 'T032453: T + diameter(3) + angle(2) + length(1)'
        }
    return None

def parse_sku_pattern3(sku):
    """
    Pattern 3: EB032452 (2 letters + 6 digits)
    - EB/other = type indicator
    - 032 = diameter in mm (32mm) - 3 digits
    - 45 = angle in degrees (45°) - 2 digits
    - 2 = length in meters (2m) - 1 digit
    """
    match = re.match(r'^[A-Z]{2}(\d{3})(\d{2})(\d)$', sku)
    if match:
        diameter = int(match.group(1))  # 032 -> 32mm
        angle = int(match.group(2))     # 45 -> 45 degrees
        length = int(match.group(3))    # 2 -> 2m
        return {
            'diameter_mm': diameter,
            'angle_degrees': angle,
            'length_m': length,
            'pattern': 'EB032452: 2 letters + diameter(3) + angle(2) + length(1)'
        }
    return None

def parse_sku_pattern4(sku):
    """
    Pattern 4: T11090 (T + 5 digits)
    - T = type indicator
    - 110 = diameter in mm (110mm) - 3 digits
    - 90 = angle in degrees (90°) - 2 digits
    Note: No length specified in SKU
    """
    match = re.match(r'^T(\d{3})(\d{2})$', sku)
    if match:
        diameter = int(match.group(1))  # 110 -> 110mm
        angle = int(match.group(2))     # 90 -> 90 degrees
        return {
            'diameter_mm': diameter,
            'angle_degrees': angle,
            'pattern': 'T11090: T + diameter(3) + angle(2)'
        }
    return None

# Sample first 20 products to understand patterns
print("=" * 80)
print("SAMPLE SKU ANALYSIS (First 20 products)")
print("=" * 80)

parsed_count = 0
pattern_counts = {'Pattern1': 0, 'Pattern2': 0, 'Pattern3': 0, 'Pattern4': 0}
unparsed_skus = []

for i, product in enumerate(kunststof_products[:30]):
    sku = product.get('sku', '')
    print(f"\n{i+1}. SKU: {sku}")
    
    # Try all patterns
    for parse_func, pattern_key in [
        (parse_sku_pattern1, 'Pattern1'),
        (parse_sku_pattern2, 'Pattern2'),
        (parse_sku_pattern3, 'Pattern3'),
        (parse_sku_pattern4, 'Pattern4')
    ]:
        result = parse_func(sku)
        if result:
            print(f"   ✅ {result['pattern']}")
            print(f"   → Diameter: {result['diameter_mm']}mm")
            if 'angle_degrees' in result:
                print(f"   → Angle: {result['angle_degrees']}°")
            if 'length_m' in result:
                print(f"   → Length: {result['length_m']}m")
            parsed_count += 1
            pattern_counts[pattern_key] += 1
            break
    else:
        # Could not parse
        print(f"   ❌ Could not parse SKU: {sku}")
        unparsed_skus.append(sku)

print()
print("=" * 80)
print("SAMPLE SUMMARY")
print("=" * 80)
print(f"Total sampled: 30 products")
for pattern_key, count in pattern_counts.items():
    print(f"{pattern_key}: {count}")
print(f"Successfully parsed: {parsed_count}/30")
print(f"Could not parse: {len(unparsed_skus)}")

if unparsed_skus:
    print(f"\nUnparsed SKUs: {', '.join(unparsed_skus[:10])}")

print()
print("=" * 80)
print("FULL CATALOG ANALYSIS")
print("=" * 80)

# Analyze all products
all_pattern_counts = {'Pattern1': 0, 'Pattern2': 0, 'Pattern3': 0, 'Pattern4': 0}
all_unparsed = []

for product in kunststof_products:
    sku = product.get('sku', '')
    
    parsed = False
    for parse_func, pattern_key in [
        (parse_sku_pattern1, 'Pattern1'),
        (parse_sku_pattern2, 'Pattern2'),
        (parse_sku_pattern3, 'Pattern3'),
        (parse_sku_pattern4, 'Pattern4')
    ]:
        if parse_func(sku):
            all_pattern_counts[pattern_key] += 1
            parsed = True
            break
    
    if not parsed:
        all_unparsed.append(sku)

total_parsed = sum(all_pattern_counts.values())

print(f"Total products: {len(kunststof_products)}")
for pattern_key, count in all_pattern_counts.items():
    print(f"  {pattern_key}: {count}")
print(f"Successfully parseable: {total_parsed}")
print(f"Could not parse: {len(all_unparsed)}")
print(f"Success rate: {(total_parsed / len(kunststof_products) * 100):.1f}%")

if all_unparsed:
    print(f"\nFirst 10 unparsed SKUs:")
    for sku in all_unparsed[:10]:
        print(f"  - {sku}")

print()
input("Press Enter to apply changes to catalog_products.json (or Ctrl+C to cancel)...")

# Apply changes
updates_made = 0
for product in kunststof_products:
    sku = product.get('sku', '')
    
    # Try all patterns
    for parse_func in [parse_sku_pattern1, parse_sku_pattern2, parse_sku_pattern3, parse_sku_pattern4]:
        result = parse_func(sku)
        if result:
            product['diameter_mm'] = result['diameter_mm']
            if 'length_m' in result:
                product['length_m'] = result['length_m']
            if 'angle_degrees' in result:
                product['angle_degrees'] = result['angle_degrees']
            updates_made += 1
            break

# Save updated catalog
with open('src/data/catalog_products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print()
print("=" * 80)
print("✅ UPDATES APPLIED")
print("=" * 80)
print(f"Total products updated: {updates_made}")
print(f"Catalog saved to: src/data/catalog_products.json")
print()
print("Properties added:")
print("  - diameter_mm: Product diameter in millimeters")
print("  - length_m: Product length in meters")
print("  - angle_degrees: Angle (for T/TO type products)")
