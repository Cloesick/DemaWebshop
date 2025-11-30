"""
Unified Catalog Data Verification Tool

Consolidates all verification scripts into a single utility with CLI interface.
Verifies product data integrity, display properties, and extraction quality.

Usage:
    python scripts/verify_catalog_data.py --all
    python scripts/verify_catalog_data.py --abs
    python scripts/verify_catalog_data.py --sku-diameters
    python scripts/verify_catalog_data.py --enrichment
    python scripts/verify_catalog_data.py --pomp
    python scripts/verify_catalog_data.py --updates
    python scripts/verify_catalog_data.py --sku-display
"""

import json
import argparse
import re
from typing import List, Dict, Any
from collections import defaultdict

# Load catalog data
def load_catalog() -> List[Dict[str, Any]]:
    """Load catalog products from JSON file"""
    with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
        return json.load(f)


# ============================================================================
# 1. VERIFY ABS DISPLAY
# ============================================================================
def verify_abs_display():
    """Verify ABS products have display properties"""
    print("\n" + "=" * 80)
    print("ABS PRODUCTS DISPLAY VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    abs_products = [p for p in catalog if 'abs-persluchtbuizen' in p.get('catalog', '').lower()]
    
    print(f"\n📦 Total ABS products: {len(abs_products)}")
    
    # Check coverage
    with_diameter = len([p for p in abs_products if p.get('diameter_mm')])
    with_pressure = len([p for p in abs_products if p.get('pressure_max_bar')])
    with_angle = len([p for p in abs_products if p.get('angle_degrees')])
    
    print(f"\n📊 PROPERTY COVERAGE:")
    print(f"   With diameter_mm:          {with_diameter} / {len(abs_products)} ({100*with_diameter/len(abs_products):.1f}%)")
    print(f"   With pressure_max_bar:     {with_pressure} / {len(abs_products)} ({100*with_pressure/len(abs_products):.1f}%)")
    print(f"   With angle_degrees:        {with_angle} / {len(abs_products)} ({100*with_angle/len(abs_products):.1f}%)")
    
    # Show samples
    print(f"\n📋 SAMPLE PRODUCTS:")
    
    print(f"\n   🔹 STRAIGHT PIPES (diameter only):")
    straight = [p for p in abs_products if p.get('diameter_mm') and not p.get('angle_degrees')][:3]
    for p in straight:
        print(f"      {p['sku']:15} | 📏 {p['diameter_mm']} mm | 🔧 {p.get('pressure_max_bar', 'N/A')} bar")
    
    print(f"\n   🔹 90° FITTINGS:")
    angle_90 = [p for p in abs_products if p.get('angle_degrees') == 90][:3]
    for p in angle_90:
        print(f"      {p['sku']:15} | 📏 {p.get('diameter_mm', 'N/A')} mm | 🔧 {p.get('pressure_max_bar', 'N/A')} bar | 📐 {p['angle_degrees']}°")
    
    print(f"\n{'='*80}")
    print("✅ ABS DISPLAY VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# 2. VERIFY SKU DIAMETERS
# ============================================================================
def verify_sku_diameters():
    """Verify diameter extraction from SKU patterns"""
    print("\n" + "=" * 80)
    print("SKU DIAMETER EXTRACTION VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    abs_products = [p for p in catalog if 'abs-perslucht' in str(p.get('catalog', '')).lower()]
    
    print(f"\n🔍 ABS-PERSLUCHTBUIZEN PRODUCTS: {len(abs_products)}")
    
    # ABSBU series
    print(f"\n📏 ABSBU Series (Diameter from SKU):")
    absbu_products = [p for p in abs_products if p['sku'].startswith('ABSBU')][:10]
    for p in absbu_products:
        sku = p['sku']
        diameter = p.get('diameter_mm', 'N/A')
        match = re.search(r'(\d+)$', sku)
        sku_number = int(match.group(1)) if match else 'N/A'
        status = "✅" if diameter == sku_number else "❓"
        print(f"   {status} {sku:15} → Diameter: 📏 {diameter} mm")
    
    # Statistics
    sku_extracted = len([p for p in catalog if p.get('diameter_source') == 'sku_pattern'])
    total_with_diameter = len([p for p in catalog if p.get('diameter_mm')])
    
    print(f"\n📊 STATISTICS:")
    print(f"   Total with diameter:          {total_with_diameter}")
    print(f"   From SKU pattern:             {sku_extracted}")
    print(f"   From PDF extraction:          {total_with_diameter - sku_extracted}")
    print(f"   SKU extraction contribution:  {sku_extracted/max(1,total_with_diameter)*100:.1f}%")
    
    print(f"\n{'='*80}")
    print("✅ SKU DIAMETER VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# 3. VERIFY ENRICHMENT
# ============================================================================
def verify_enrichment():
    """Verify data enrichment quality"""
    print("\n" + "=" * 80)
    print("DATA ENRICHMENT VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    
    # Count enriched properties
    properties = ['power_kw', 'voltage_v', 'pressure_max_bar', 'diameter_mm', 
                  'weight_kg', 'volume_l', 'flow_l_min']
    
    print(f"\n📊 PROPERTY ENRICHMENT COVERAGE:")
    for prop in properties:
        count = len([p for p in catalog if p.get(prop) is not None])
        percentage = (count / len(catalog)) * 100
        print(f"   {prop:20} : {count:4} / {len(catalog)} ({percentage:5.1f}%)")
    
    # Check catalogs
    catalogs = defaultdict(int)
    for p in catalog:
        catalogs[p.get('catalog', 'unknown')] += 1
    
    print(f"\n📦 PRODUCTS BY CATALOG:")
    for cat, count in sorted(catalogs.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"   {cat:40} : {count:4} products")
    
    print(f"\n{'='*80}")
    print("✅ ENRICHMENT VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# 4. VERIFY POMP EXTRACTION
# ============================================================================
def verify_pomp_extraction():
    """Verify pomp specials extraction"""
    print("\n" + "=" * 80)
    print("POMP SPECIALS EXTRACTION VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    pomp_products = [p for p in catalog if 'pomp-specials' in p.get('catalog', '').lower()]
    
    print(f"\n📦 Total pomp products: {len(pomp_products)}")
    
    # Check property coverage
    with_power = len([p for p in pomp_products if p.get('power_kw')])
    with_voltage = len([p for p in pomp_products if p.get('voltage_v')])
    with_flow = len([p for p in pomp_products if p.get('flow_l_min') or p.get('flow_m3_per_h')])
    
    print(f"\n📊 PROPERTY COVERAGE:")
    print(f"   With power_kw:        {with_power} / {len(pomp_products)} ({100*with_power/max(1,len(pomp_products)):.1f}%)")
    print(f"   With voltage_v:       {with_voltage} / {len(pomp_products)} ({100*with_voltage/max(1,len(pomp_products)):.1f}%)")
    print(f"   With flow:            {with_flow} / {len(pomp_products)} ({100*with_flow/max(1,len(pomp_products)):.1f}%)")
    
    # Sample products
    print(f"\n📋 SAMPLE PRODUCTS:")
    for p in pomp_products[:5]:
        print(f"   {p['sku']:15} | ⚡ {p.get('power_kw', 'N/A')} kW | 🔌 {p.get('voltage_v', 'N/A')}V")
    
    print(f"\n{'='*80}")
    print("✅ POMP EXTRACTION VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# 5. VERIFY CATALOG UPDATES
# ============================================================================
def verify_catalog_updates():
    """Verify all catalog updates are applied"""
    print("\n" + "=" * 80)
    print("CATALOG UPDATES VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    
    # Get catalog breakdown
    catalogs = defaultdict(lambda: {'count': 0, 'with_props': 0})
    
    for p in catalog:
        cat = p.get('catalog', 'unknown')
        catalogs[cat]['count'] += 1
        
        # Check if product has any technical properties
        has_props = any(p.get(prop) for prop in ['power_kw', 'voltage_v', 'pressure_max_bar', 
                                                   'diameter_mm', 'flow_l_min', 'weight_kg'])
        if has_props:
            catalogs[cat]['with_props'] += 1
    
    print(f"\n📊 CATALOG COVERAGE:")
    print(f"\n{'Catalog':<40} {'Products':>10} {'With Props':>12} {'Coverage':>10}")
    print("-" * 80)
    
    for cat in sorted(catalogs.keys()):
        data = catalogs[cat]
        coverage = (data['with_props'] / data['count']) * 100
        print(f"{cat:<40} {data['count']:>10} {data['with_props']:>12} {coverage:>9.1f}%")
    
    print(f"\n{'='*80}")
    print("✅ CATALOG UPDATES VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# 6. VERIFY SKU DISPLAY
# ============================================================================
def verify_sku_display():
    """Verify SKU display properties"""
    print("\n" + "=" * 80)
    print("SKU DISPLAY VERIFICATION")
    print("=" * 80)
    
    catalog = load_catalog()
    
    # Check for common display issues
    no_name = [p for p in catalog if not p.get('name')]
    no_sku = [p for p in catalog if not p.get('sku')]
    no_catalog = [p for p in catalog if not p.get('catalog')]
    
    print(f"\n🔍 DISPLAY ISSUES:")
    print(f"   Products without name:     {len(no_name)}")
    print(f"   Products without SKU:      {len(no_sku)}")
    print(f"   Products without catalog:  {len(no_catalog)}")
    
    # Check for very long SKUs (display issues)
    long_skus = [p for p in catalog if len(p.get('sku', '')) > 30]
    print(f"   SKUs over 30 chars:        {len(long_skus)}")
    
    if long_skus:
        print(f"\n   📋 Examples of long SKUs:")
        for p in long_skus[:5]:
            print(f"      {p['sku']}")
    
    # Check for duplicate SKUs
    skus = [p.get('sku') for p in catalog if p.get('sku')]
    duplicates = len(skus) - len(set(skus))
    print(f"\n   Duplicate SKUs:            {duplicates}")
    
    print(f"\n{'='*80}")
    print("✅ SKU DISPLAY VERIFICATION COMPLETE")
    print("="*80)


# ============================================================================
# MAIN CLI
# ============================================================================
def main():
    parser = argparse.ArgumentParser(
        description='Unified Catalog Data Verification Tool',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python scripts/verify_catalog_data.py --all
  python scripts/verify_catalog_data.py --abs --sku-diameters
  python scripts/verify_catalog_data.py --pomp
        """
    )
    
    parser.add_argument('--all', action='store_true', help='Run all verifications')
    parser.add_argument('--abs', action='store_true', help='Verify ABS display properties')
    parser.add_argument('--sku-diameters', action='store_true', help='Verify SKU diameter extraction')
    parser.add_argument('--enrichment', action='store_true', help='Verify data enrichment')
    parser.add_argument('--pomp', action='store_true', help='Verify pomp extraction')
    parser.add_argument('--updates', action='store_true', help='Verify catalog updates')
    parser.add_argument('--sku-display', action='store_true', help='Verify SKU display')
    
    args = parser.parse_args()
    
    # If no arguments, show help
    if not any(vars(args).values()):
        parser.print_help()
        return
    
    print("\n🔍 DEMAWEBSHOP CATALOG VERIFICATION TOOL")
    print("=" * 80)
    
    # Run selected verifications
    if args.all or args.abs:
        verify_abs_display()
    
    if args.all or args.sku_diameters:
        verify_sku_diameters()
    
    if args.all or args.enrichment:
        verify_enrichment()
    
    if args.all or args.pomp:
        verify_pomp_extraction()
    
    if args.all or args.updates:
        verify_catalog_updates()
    
    if args.all or args.sku_display:
        verify_sku_display()
    
    print("\n" + "=" * 80)
    print("🎉 VERIFICATION COMPLETE!")
    print("=" * 80 + "\n")


if __name__ == "__main__":
    main()
