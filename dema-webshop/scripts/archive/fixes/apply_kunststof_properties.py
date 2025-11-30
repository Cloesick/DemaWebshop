import json
import re

print("=" * 80)
print("APPLYING SKU-BASED PROPERTIES TO KUNSTSTOF-AFVOERLEIDINGEN PRODUCTS")
print("=" * 80)
print()

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
    Example: AB0322 → diameter: 32mm, length: 2m
    """
    match = re.match(r'^[A-Z]{2}(\d{3})(\d)$', sku)
    if match:
        diameter = int(match.group(1))  # 032 -> 32
        length = int(match.group(2))     # 2 -> 2
        return {
            'diameter_mm': diameter,
            'length_m': length,
            'pattern': 'AB0322'
        }
    return None

def parse_sku_pattern2(sku):
    """
    Pattern 2: T032453 (T + 6 digits)
    - T = type indicator
    - 032 = diameter in mm (32mm) - 3 digits
    - 45 = angle in degrees (45°) - 2 digits
    - 3 = length in meters (3m) - 1 digit
    Example: T032453 → diameter: 32mm, angle: 45°, length: 3m
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
            'pattern': 'T032453'
        }
    return None

def parse_sku_pattern3(sku):
    """
    Pattern 3: EB032452 (2 letters + 6 digits)
    - EB/other = type indicator
    - 032 = diameter in mm (32mm) - 3 digits
    - 45 = angle in degrees (45°) - 2 digits
    - 2 = length in meters (2m) - 1 digit
    Example: EB032452 → diameter: 32mm, angle: 45°, length: 2m
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
            'pattern': 'EB032452'
        }
    return None

def parse_sku_pattern4(sku):
    """
    Pattern 4: T11090 (T + 5 digits)
    - T = type indicator
    - 110 = diameter in mm (110mm) - 3 digits
    - 90 = angle in degrees (90°) - 2 digits
    Example: T11090 → diameter: 110mm, angle: 90°
    """
    match = re.match(r'^T(\d{3})(\d{2})$', sku)
    if match:
        diameter = int(match.group(1))  # 110 -> 110mm
        angle = int(match.group(2))     # 90 -> 90 degrees
        return {
            'diameter_mm': diameter,
            'angle_degrees': angle,
            'pattern': 'T11090'
        }
    return None

# Analyze all products
print("Analyzing SKU patterns...")
print()

pattern_counts = {'AB0322': 0, 'T032453': 0, 'EB032452': 0, 'T11090': 0}
unparsed = []

for product in kunststof_products:
    sku = product.get('sku', '')
    
    parsed = False
    for parse_func, pattern_key in [
        (parse_sku_pattern1, 'AB0322'),
        (parse_sku_pattern2, 'T032453'),
        (parse_sku_pattern3, 'EB032452'),
        (parse_sku_pattern4, 'T11090')
    ]:
        result = parse_func(sku)
        if result:
            pattern_counts[pattern_key] += 1
            parsed = True
            break
    
    if not parsed:
        unparsed.append(sku)

total_parsed = sum(pattern_counts.values())

print("Pattern Analysis:")
print("-" * 60)
for pattern, count in pattern_counts.items():
    if count > 0:
        print(f"  {pattern:15} : {count:4} products")
print("-" * 60)
print(f"Total parseable  : {total_parsed:4} products ({(total_parsed/len(kunststof_products)*100):.1f}%)")
print(f"Could not parse  : {len(unparsed):4} products")
print()

if unparsed[:5]:
    print(f"Sample unparsed SKUs: {', '.join(unparsed[:5])}")
    print()

# Apply changes
print("Applying properties to catalog...")
print()

updates_made = 0
examples = []

for product in kunststof_products:
    sku = product.get('sku', '')
    
    # Try all patterns
    for parse_func in [parse_sku_pattern1, parse_sku_pattern2, parse_sku_pattern3, parse_sku_pattern4]:
        result = parse_func(sku)
        if result:
            # Store example for first 5
            if len(examples) < 5:
                examples.append({
                    'sku': sku,
                    'pattern': result['pattern'],
                    'diameter_mm': result.get('diameter_mm'),
                    'angle_degrees': result.get('angle_degrees'),
                    'length_m': result.get('length_m')
                })
            
            # Apply properties
            product['diameter_mm'] = result['diameter_mm']
            if 'length_m' in result:
                product['length_m'] = result['length_m']
            if 'angle_degrees' in result:
                product['angle_degrees'] = result['angle_degrees']
            updates_made += 1
            break

# Show examples
print("Examples of applied properties:")
print("-" * 80)
for ex in examples:
    print(f"SKU: {ex['sku']:12} ({ex['pattern']})")
    print(f"  → Diameter: {ex['diameter_mm']}mm", end="")
    if ex.get('angle_degrees'):
        print(f", Angle: {ex['angle_degrees']}°", end="")
    if ex.get('length_m'):
        print(f", Length: {ex['length_m']}m", end="")
    print()
print()

# Save updated catalog
with open('src/data/catalog_products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("=" * 80)
print("✅ SUCCESS!")
print("=" * 80)
print(f"Total products updated: {updates_made}/{len(kunststof_products)}")
print(f"Properties added:")
print(f"  - diameter_mm: Product diameter in millimeters")
print(f"  - length_m: Product length in meters (where applicable)")
print(f"  - angle_degrees: Angle in degrees (where applicable)")
print()
print(f"Catalog saved to: src/data/catalog_products.json")
print("=" * 80)
