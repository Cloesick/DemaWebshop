"""
Pomp Catalog Utilities

Consolidated utility for checking, validating, and comparing pomp-specials catalog data.

Usage:
    python scripts/pomp_catalog_utils.py --check
    python scripts/pomp_catalog_utils.py --display
    python scripts/pomp_catalog_utils.py --compare
    python scripts/pomp_catalog_utils.py --all
"""

import json
import argparse
from pathlib import Path
from typing import List, Dict, Any


def load_catalog() -> List[Dict[str, Any]]:
    """Load catalog products"""
    catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'
    with open(catalog_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_pomp_products(catalog: List[Dict]) -> List[Dict]:
    """Filter pomp-specials products"""
    return [p for p in catalog if 'pomp-special' in str(p.get('catalog', '')).lower()]


# ============================================================================
# 1. CHECK POMP PRODUCTS
# ============================================================================
def check_pomp_products():
    """Check current state of pomp-specials products"""
    print("\n" + "=" * 80)
    print("POMP-SPECIALS CURRENT STATE")
    print("=" * 80)
    
    catalog = load_catalog()
    pomp_products = get_pomp_products(catalog)
    
    print(f"\n📦 Found {len(pomp_products)} pomp-specials products")
    
    print(f"\n📋 SAMPLE PRODUCTS (first 10):")
    print(f"\n{'SKU':<20} {'HP':>8} {'kW':>8} {'RPM':>8} {'Flow':>10} {'Pressure':>10}")
    print("-" * 80)
    
    for p in pomp_products[:10]:
        sku = p.get('sku', 'N/A')
        power_hp = p.get('power_hp', 'N/A')
        power_kw = p.get('power_kw', 'N/A')
        rpm = p.get('rpm', 'N/A')
        flow = p.get('flow_l_min', 'N/A')
        pressure = p.get('pressure_max_bar', 'N/A')
        
        print(f"{sku:<20} {str(power_hp):>8} {str(power_kw):>8} {str(rpm):>8} {str(flow):>10} {str(pressure):>10}")
    
    print(f"\n📊 STATISTICS:")
    with_hp = len([p for p in pomp_products if p.get('power_hp')])
    with_kw = len([p for p in pomp_products if p.get('power_kw')])
    with_rpm = len([p for p in pomp_products if p.get('rpm')])
    with_flow = len([p for p in pomp_products if p.get('flow_l_min')])
    with_pressure = len([p for p in pomp_products if p.get('pressure_max_bar')])
    
    total = len(pomp_products)
    print(f"   With power (HP):          {with_hp:3} / {total} ({100*with_hp/max(1,total):.1f}%)")
    print(f"   With power (kW):          {with_kw:3} / {total} ({100*with_kw/max(1,total):.1f}%)")
    print(f"   With RPM:                 {with_rpm:3} / {total} ({100*with_rpm/max(1,total):.1f}%)")
    print(f"   With flow:                {with_flow:3} / {total} ({100*with_flow/max(1,total):.1f}%)")
    print(f"   With pressure:            {with_pressure:3} / {total} ({100*with_pressure/max(1,total):.1f}%)")
    
    print(f"\n{'='*80}")
    print("✅ CHECK COMPLETE")
    print("="*80)


# ============================================================================
# 2. CHECK DISPLAY PROPERTIES
# ============================================================================
def check_pomp_display():
    """Check display properties for pomp-specials"""
    print("\n" + "=" * 80)
    print("POMP-SPECIALS DISPLAY VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    pomp_products = get_pomp_products(catalog)
    
    print(f"\n📦 Total pomp-specials products: {len(pomp_products)}")
    
    # Check coverage
    with_type = len([p for p in pomp_products if p.get('pump_type')])
    with_power = len([p for p in pomp_products if p.get('power_kw') or p.get('power_hp')])
    with_rpm = len([p for p in pomp_products if p.get('rpm')])
    with_flow = len([p for p in pomp_products if p.get('flow_l_min') or p.get('flow_m3_per_h')])
    with_pressure = len([p for p in pomp_products if p.get('pressure_max_bar') or p.get('pressure_height_m')])
    
    total = len(pomp_products)
    print(f"\n📊 PROPERTY COVERAGE:")
    print(f"   With pump_type:            {with_type:3} / {total} ({100*with_type/max(1,total):.1f}%)")
    print(f"   With power (kW/HP):        {with_power:3} / {total} ({100*with_power/max(1,total):.1f}%)")
    print(f"   With RPM:                  {with_rpm:3} / {total} ({100*with_rpm/max(1,total):.1f}%)")
    print(f"   With flow:                 {with_flow:3} / {total} ({100*with_flow/max(1,total):.1f}%)")
    print(f"   With pressure/height:      {with_pressure:3} / {total} ({100*with_pressure/max(1,total):.1f}%)")
    
    # Show detailed samples
    print(f"\n📋 SAMPLE PRODUCTS (display preview):")
    for p in pomp_products[:5]:
        sku = p.get('sku', 'N/A')
        pump_type = p.get('pump_type', 'N/A')
        power_kw = p.get('power_kw', 'N/A')
        power_hp = p.get('power_hp', 'N/A')
        rpm = p.get('rpm', 'N/A')
        flow_l_min = p.get('flow_l_min', 'N/A')
        flow_m3 = p.get('flow_m3_per_h', 'N/A')
        pressure_bar = p.get('pressure_max_bar', 'N/A')
        pressure_m = p.get('pressure_height_m', 'N/A')
        
        print(f"\n   🏭 {sku}:")
        print(f"      Type: {pump_type}")
        print(f"      ⚡ Power: {power_kw} kW ({power_hp} HP)")
        print(f"      🔄 RPM: {rpm}")
        print(f"      💨 Flow: {flow_l_min} L/min ({flow_m3} m³/h)")
        print(f"      🔧 Pressure: {pressure_bar} bar ({pressure_m} m)")
    
    print(f"\n{'='*80}")
    print("✅ DISPLAY CHECK COMPLETE")
    print("="*80)


# ============================================================================
# 3. COMPARE WITH PDF VALUES
# ============================================================================
def compare_pomp_values():
    """Compare catalog values with actual PDF table data"""
    print("\n" + "=" * 100)
    print("POMP-SPECIALS VALUE COMPARISON (Catalog vs PDF)")
    print("=" * 100)
    
    catalog = load_catalog()
    pomp_products = get_pomp_products(catalog)
    
    # Actual values from PDF
    actual_values = {
        '17130230': {'Type': 'T2-40', 'Power_pK': 40, 'RPM': 460, 'Flow_m3h': 66, 'Height_m': 59},
        '17130231': {'Type': 'T1-40', 'Power_pK': 25, 'RPM': 510, 'Flow_m3h': 30, 'Height_m': 105},
        '17130290': {'Type': 'T1-40', 'Power_pK': 25, 'RPM': 550, 'Flow_m3h': 35, 'Height_m': 87},
        '50960019': {'Type': 'F III-60', 'Power_kW': 25, 'RPM': 540, 'Flow_m3h': 80, 'Height_m': 85, 'Weight_kg': 48},
        '18540001': {'Type': 'F-IV-80', 'Power_kW': 40, 'RPM': 540, 'Flow_m3h': 90, 'Height_m': 120, 'Weight_kg': 73},
    }
    
    print("\n📋 Comparing 5 reference products:\n")
    
    matches = 0
    total_checks = 0
    
    for sku in actual_values.keys():
        product = next((p for p in pomp_products if p['sku'] == sku), None)
        
        if not product:
            print(f"❌ SKU {sku} NOT FOUND in catalog")
            continue
        
        print(f"\n{'='*100}")
        print(f"SKU: {sku}")
        print(f"{'='*100}")
        
        actual = actual_values[sku]
        
        print(f"\n{'Property':<20} {'ACTUAL (PDF)':<30} {'CATALOG':<30} {'Status'}")
        print("-" * 100)
        
        # Compare each property
        checks = []
        
        # Type
        if 'Type' in actual:
            actual_type = actual['Type']
            catalog_type = product.get('pump_type')
            match = actual_type == catalog_type
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Type':<20} {str(actual_type):<30} {str(catalog_type):<30} {status}")
        
        # Power (HP/pK)
        if 'Power_pK' in actual:
            actual_power = actual['Power_pK']
            catalog_power = product.get('power_hp')
            match = actual_power == catalog_power
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Power (HP/pK)':<20} {str(actual_power):<30} {str(catalog_power):<30} {status}")
        
        # Power (kW)
        if 'Power_kW' in actual:
            actual_power = actual['Power_kW']
            catalog_power = product.get('power_kw')
            match = actual_power == catalog_power
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Power (kW)':<20} {str(actual_power):<30} {str(catalog_power):<30} {status}")
        
        # RPM
        if 'RPM' in actual:
            actual_rpm = actual['RPM']
            catalog_rpm = product.get('rpm')
            match = actual_rpm == catalog_rpm
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'RPM':<20} {str(actual_rpm):<30} {str(catalog_rpm):<30} {status}")
        
        # Flow
        if 'Flow_m3h' in actual:
            actual_flow = actual['Flow_m3h']
            catalog_flow = product.get('flow_m3_per_h')
            match = actual_flow == catalog_flow
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Flow (m³/h)':<20} {str(actual_flow):<30} {str(catalog_flow):<30} {status}")
        
        # Height
        if 'Height_m' in actual:
            actual_height = actual['Height_m']
            catalog_height = product.get('pressure_height_m')
            match = actual_height == catalog_height
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Height (m)':<20} {str(actual_height):<30} {str(catalog_height):<30} {status}")
        
        # Weight
        if 'Weight_kg' in actual:
            actual_weight = actual['Weight_kg']
            catalog_weight = product.get('weight_kg')
            match = actual_weight == catalog_weight
            checks.append(match)
            status = "✅" if match else "❌"
            print(f"{'Weight (kg)':<20} {str(actual_weight):<30} {str(catalog_weight):<30} {status}")
        
        matches += sum(checks)
        total_checks += len(checks)
    
    # Summary
    print("\n" + "=" * 100)
    print(f"📊 COMPARISON SUMMARY:")
    print(f"   Matching values:  {matches} / {total_checks} ({100*matches/max(1,total_checks):.1f}%)")
    print("=" * 100)


# ============================================================================
# MAIN CLI
# ============================================================================
def main():
    parser = argparse.ArgumentParser(
        description='Pomp Catalog Utilities - Check, validate, and compare pomp-specials data',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/pomp_catalog_utils.py --check
  python scripts/pomp_catalog_utils.py --display
  python scripts/pomp_catalog_utils.py --compare
  python scripts/pomp_catalog_utils.py --all
        """
    )
    
    parser.add_argument('--all', action='store_true', help='Run all checks')
    parser.add_argument('--check', action='store_true', help='Check current state')
    parser.add_argument('--display', action='store_true', help='Check display properties')
    parser.add_argument('--compare', action='store_true', help='Compare with PDF values')
    
    args = parser.parse_args()
    
    # If no arguments, show help
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    print("\n🏭 POMP CATALOG UTILITIES")
    print("=" * 80)
    
    # Run selected checks
    if args.all or args.check:
        check_pomp_products()
    
    if args.all or args.display:
        check_pomp_display()
    
    if args.all or args.compare:
        compare_pomp_values()
    
    print("\n" + "=" * 80)
    print("🎉 POMP UTILITIES COMPLETE!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
