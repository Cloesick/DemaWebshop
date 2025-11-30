import json
import re

print("=" * 100)
print("REPARSING AIRPRESS CATALOG WITH CORRECT TABLE STRUCTURE")
print("=" * 100)
print()

# Load existing products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Sample table data provided by user
sample_data = """
HL 150-24 36744-E 150 L/min 120 L/min 24 L 1,5 hp / 1,1 kW 6 bar 8 bar 1 1 2800 rpm 93 dB(A) 230V / 50 Hz / 1 580 x 255 x 580 mm 25 kg
HL 310-25 36839-1 196 L/min 157 L/min 24 L 2 hp / 1,5 kW 6 bar 8 bar 1 1 2850 rpm 96 dB(A) 230V / 50 Hz / 1 600 x 330 x 560 mm 27 kg
HL 155-50 36830 155 L/min 124 L/min 50 L 1,5 hp / 1,1 kW 6 bar 8 bar 1 1 2850 rpm 93 dB(A) 230V / 50 Hz / 1 720 x 420 x 690 mm 31 kg
HL 275-50 36856 275 L/min 220 L/min 50 L 2 hp / 1,5 kW 6 bar 8 bar 1 1 2850 rpm 96 dB(A) 230V / 50 Hz / 1 720 x 420 x 690 mm 33 kg
HL 325-50 36832 325 L/min 260 L/min 50 L 2,5 hp / 1,8 kW 6 bar 8 bar 1 1 2850 rpm 93 dB(A) 230V / 50 Hz / 1 770 x 330 x 730 mm 36,5 kg
HL 360-50 36852 288 L/min 231 L/min 50 L 2,5 hp / 1,8 kW 6 bar 8 bar 1 1 2850 rpm 97 dB(A) 230V / 50 Hz / 1 480 x 410 x 1050 mm 35 kg
HL 340-90 36844-E 340 L/min 272 L/min 90 L 3 hp / 2,2 kW 8 bar 10 bar 2 1 1400 rpm 97 dB(A) 230V / 50 Hz / 1 1230 x 440 x 740 mm 63 kg
"""

print("TABLE STRUCTURE IDENTIFIED:")
print("-" * 100)
print("Column 1:  Product Code (e.g., HL 150-24)")
print("Column 2:  SKU (e.g., 36744-E)")
print("Column 3:  Intake air (L/min)")
print("Column 4:  Outtake volume (L/min)")
print("Column 5:  Capacity (L)")
print("Column 6:  Power (hp / kW)")
print("Column 7:  Min pressure (bar)")
print("Column 8:  Max pressure (bar)")
print("Column 9:  Piston amount")
print("Column 10: Not relevant")
print("Column 11: RPM")
print("Column 12: Noise level dB(A)")
print("Column 13: Voltage / Frequency / Phase")
print("Column 14: Dimensions (L × W × H mm)")
print("Column 15: Weight (kg)")
print()

def parse_airpress_row(line):
    """
    Parse a single row of airpress table data
    """
    # Pattern to match the table structure
    # Product Code | SKU | Intake | Outtake | Capacity | Power | MinBar | MaxBar | Pistons | ? | RPM | dB | Voltage | Dimensions | Weight
    
    # Remove extra whitespace
    line = ' '.join(line.split())
    
    # Extract components using regex
    pattern = r'([\w\s-]+?)\s+(\S+)\s+(\d+)\s+L/min\s+(\d+)\s+L/min\s+(\d+)\s+L\s+([\d,]+)\s+hp\s+/\s+([\d,]+)\s+kW\s+(\d+)\s+bar\s+(\d+)\s+bar\s+(\d+)\s+(\d+)\s+(\d+)\s+rpm\s+(\d+)\s+dB\(A\)\s+(\d+)V\s+/\s+(\d+)\s+Hz\s+/\s+(\d+)\s+([\d\sx]+)\s+mm\s+([\d,]+)\s+kg'
    
    match = re.match(pattern, line)
    
    if match:
        product_code = match.group(1).strip()
        sku = match.group(2)
        intake_l_min = int(match.group(3))
        outtake_l_min = int(match.group(4))
        capacity_l = int(match.group(5))
        power_hp = float(match.group(6).replace(',', '.'))
        power_kw = float(match.group(7).replace(',', '.'))
        pressure_min_bar = int(match.group(8))
        pressure_max_bar = int(match.group(9))
        piston_count = int(match.group(10))
        rpm = int(match.group(12))
        noise_db = int(match.group(13))
        voltage_v = int(match.group(14))
        frequency_hz = int(match.group(15))
        phase = int(match.group(16))
        dimensions_str = match.group(17)
        weight_kg = float(match.group(18).replace(',', '.'))
        
        # Parse dimensions (L x W x H)
        dims = re.findall(r'(\d+)', dimensions_str)
        if len(dims) >= 3:
            length_mm = int(dims[0])
            width_mm = int(dims[1])
            height_mm = int(dims[2])
        else:
            length_mm = width_mm = height_mm = None
        
        return {
            'product_code': product_code,
            'sku': sku,
            'intake_l_min': intake_l_min,
            'outtake_l_min': outtake_l_min,
            'volume_l': capacity_l,
            'power_hp': power_hp,
            'power_kw': power_kw,
            'pressure_min_bar': pressure_min_bar,
            'pressure_max_bar': pressure_max_bar,
            'piston_count': piston_count,
            'rpm': rpm,
            'noise_db': noise_db,
            'voltage_v': voltage_v,
            'frequency_hz': frequency_hz,
            'phase': phase,
            'length_mm': length_mm,
            'width_mm': width_mm,
            'height_mm': height_mm,
            'dimensions_mm': f"{length_mm} × {width_mm} × {height_mm}" if all([length_mm, width_mm, height_mm]) else None,
            'weight_kg': weight_kg
        }
    
    return None

print("PARSING SAMPLE DATA:")
print("=" * 100)
print()

parsed_rows = []
for line in sample_data.strip().split('\n'):
    if line.strip():
        result = parse_airpress_row(line)
        if result:
            parsed_rows.append(result)
            print(f"✅ SKU: {result['sku']}")
            print(f"   Code: {result['product_code']}")
            print(f"   Intake: {result['intake_l_min']} L/min")
            print(f"   Outtake: {result['outtake_l_min']} L/min")
            print(f"   Volume: {result['volume_l']} L")
            print(f"   Power: {result['power_hp']} hp / {result['power_kw']} kW")
            print(f"   Pressure: {result['pressure_min_bar']}-{result['pressure_max_bar']} bar")
            print(f"   Pistons: {result['piston_count']}")
            print(f"   RPM: {result['rpm']}")
            print(f"   Noise: {result['noise_db']} dB(A)")
            print(f"   Voltage: {result['voltage_v']}V / {result['frequency_hz']}Hz / {result['phase']} phase")
            print(f"   Dimensions: {result['dimensions_mm']} mm")
            print(f"   Weight: {result['weight_kg']} kg")
            print()
        else:
            print(f"❌ Failed to parse: {line[:50]}...")
            print()

print("=" * 100)
print(f"Successfully parsed: {len(parsed_rows)} / {len([l for l in sample_data.strip().split('\n') if l.strip()])} rows")
print()

# Now update the actual products
print("=" * 100)
print("UPDATING CATALOG PRODUCTS")
print("=" * 100)
print()

airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']
print(f"Total airpress products: {len(airpress_products)}")
print()

# Create a mapping of parsed data by SKU
parsed_map = {row['sku']: row for row in parsed_rows}

# Update products with parsed data
updates_made = 0
for product in airpress_products:
    sku = product['sku']
    if sku in parsed_map:
        data = parsed_map[sku]
        
        # Update properties (removing any existing incorrect values)
        product['intake_l_min'] = data['intake_l_min']
        product['outtake_l_min'] = data['outtake_l_min']
        product['volume_l'] = data['volume_l']
        product['power_hp'] = data['power_hp']
        product['power_kw'] = data['power_kw']
        product['pressure_min_bar'] = data['pressure_min_bar']
        product['pressure_max_bar'] = data['pressure_max_bar']
        product['piston_count'] = data['piston_count']
        product['rpm'] = data['rpm']
        product['noise_db'] = data['noise_db']
        product['voltage_v'] = data['voltage_v']
        product['frequency_hz'] = data['frequency_hz']
        product['phase'] = data['phase']
        product['length_mm'] = data['length_mm']
        product['width_mm'] = data['width_mm']
        product['height_mm'] = data['height_mm']
        product['dimensions_mm'] = data['dimensions_mm']
        product['weight_kg'] = data['weight_kg']
        product['product_code'] = data['product_code']
        
        updates_made += 1
        print(f"✅ Updated {sku} ({data['product_code']})")

print()
print(f"Updated {updates_made} products from sample data")
print()

# Save updated catalog
with open('src/data/catalog_products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, ensure_ascii=False, indent=2)

print("=" * 100)
print("✅ CATALOG UPDATED")
print("=" * 100)
print(f"File saved: src/data/catalog_products.json")
print(f"Products updated: {updates_made}")
print()
print("Next steps:")
print("1. Run a full PDF extraction with this new parser")
print("2. Apply to all airpress products")
print("3. Verify no duplicate values remain")
