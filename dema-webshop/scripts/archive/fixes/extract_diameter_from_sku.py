"""
Extract diameter from SKU patterns like ABSBU016 where 016 = 16mm diameter
"""
import json
import re
from pathlib import Path
from collections import defaultdict

def extract_diameter_from_sku(sku: str, product_catalog: str = '') -> int:
    """
    Extract diameter from SKU patterns
    Common patterns:
    - ABSBU016 -> 16mm
    - ABSBU025 -> 25mm
    - PN10 -> 10mm
    - GMI46013 -> 13mm (last digits)
    - P52 -> 52mm
    """
    
    catalog_lower = product_catalog.lower()
    sku_upper = str(sku).upper()
    
    # Pattern 1: ABSBU016 style (letters + 3 digits)
    match = re.search(r'[A-Z]+(\d{3})$', sku_upper)
    if match:
        num = int(match.group(1))
        # Remove leading zeros: 016 -> 16
        return num
    
    # Pattern 2: PN10 style (letters + 2 digits)
    match = re.search(r'[A-Z]+(\d{2})$', sku_upper)
    if match:
        num = int(match.group(1))
        # Valid diameter range for hoses/pipes
        if 6 <= num <= 150:
            return num
    
    # Pattern 3: GMI46013 style (last 2-3 digits after other numbers)
    match = re.search(r'\d{2,}(\d{2,3})$', sku_upper)
    if match:
        num = int(match.group(1))
        if 6 <= num <= 150:
            return num
    
    # Pattern 4: P52 style (letter + 2 digits)
    match = re.search(r'^[A-Z](\d{2})$', sku_upper)
    if match:
        num = int(match.group(1))
        if 10 <= num <= 150:
            return num
    
    # Pattern 5: Numbers in SKU that match common diameters
    # Extract all numbers
    numbers = re.findall(r'\d+', sku_upper)
    for num_str in numbers:
        num = int(num_str)
        # Common hose/pipe diameters
        common_diameters = [6, 8, 10, 12, 13, 16, 19, 20, 25, 32, 38, 40, 50, 52, 63, 75, 80, 100, 110, 125, 150]
        if num in common_diameters:
            return num
    
    return None

def main():
    print("=" * 80)
    print("EXTRACT DIAMETER FROM SKU PATTERNS")
    print("=" * 80)
    
    # Load catalog
    catalog_path = Path('src/data/catalog_products.json')
    print(f"\n📂 Loading catalog from {catalog_path}...")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    print(f"   ✓ {len(catalog)} products loaded")
    
    # Backup
    backup_path = Path('src/data/catalog_products_backup_sku_diameter.json')
    print(f"\n💾 Creating backup...")
    import shutil
    shutil.copy(catalog_path, backup_path)
    print(f"   ✓ Backup saved")
    
    # Target categories for diameter extraction
    target_categories = [
        'abs-persluchtbuizen',
        'slangkoppeling',
        'slangklem',
        'plat-oprolbare-slang',
        'afzuigslang',
        'pu-afzuigslang',
        'rubber-slang',
        'pe-buizen',
        'pvc',
        'drain',
        'drukbuizen',
        'verzinkte-buizen',
    ]
    
    stats = {
        'total_processed': 0,
        'diameter_extracted': 0,
        'diameter_updated': 0,
        'by_category': defaultdict(int),
        'diameter_distribution': defaultdict(int),
    }
    
    print(f"\n⚡ Extracting diameter from SKU patterns...")
    
    for product in catalog:
        sku = product.get('sku', '')
        catalog_name = str(product.get('catalog', '')).lower()
        
        # Check if product is in target categories
        is_target = any(cat in catalog_name for cat in target_categories)
        
        if not is_target:
            continue
        
        stats['total_processed'] += 1
        
        # Try to extract diameter from SKU
        extracted_diameter = extract_diameter_from_sku(sku, catalog_name)
        
        if extracted_diameter:
            stats['diameter_extracted'] += 1
            stats['diameter_distribution'][extracted_diameter] += 1
            
            # Only update if product doesn't have diameter_mm or has 0
            current_diameter = product.get('diameter_mm')
            
            if not current_diameter or current_diameter == 0:
                product['diameter_mm'] = extracted_diameter
                product['diameter_source'] = 'sku_pattern'
                stats['diameter_updated'] += 1
                stats['by_category'][catalog_name] += 1
                
                if stats['diameter_updated'] <= 10:  # Show first 10 examples
                    print(f"   ✓ {sku:20} -> 📏 {extracted_diameter} mm (from SKU)")
    
    # Save updated catalog
    print(f"\n💾 Saving updated catalog...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    print(f"   ✓ Saved to {catalog_path}")
    
    # Statistics
    print(f"\n📊 EXTRACTION STATISTICS:")
    print(f"   Products processed:          {stats['total_processed']}")
    print(f"   Diameters extracted from SKU: {stats['diameter_extracted']}")
    print(f"   Products updated:            {stats['diameter_updated']}")
    print(f"   Coverage: {stats['diameter_updated']/max(1,stats['total_processed'])*100:.1f}%")
    
    print(f"\n   📦 By Category:")
    for cat, count in sorted(stats['by_category'].items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"     {cat:40} {count:5} products")
    
    print(f"\n   📏 Diameter Distribution (Top 15):")
    for diameter, count in sorted(stats['diameter_distribution'].items(), key=lambda x: x[1], reverse=True)[:15]:
        print(f"     {diameter:3} mm  {'█' * min(50, count)} {count} products")
    
    # Show some examples
    print(f"\n📋 SAMPLE UPDATED PRODUCTS:")
    examples = [p for p in catalog if p.get('diameter_source') == 'sku_pattern'][:5]
    for p in examples:
        print(f"\n   SKU: {p['sku']}")
        print(f"   Catalog: {p.get('catalog')}")
        print(f"   📏 Diameter: {p['diameter_mm']} mm (extracted from SKU)")
    
    print(f"\n{'='*80}")
    print("✅ DIAMETER EXTRACTION COMPLETE!")
    print("="*80)

if __name__ == '__main__':
    main()
