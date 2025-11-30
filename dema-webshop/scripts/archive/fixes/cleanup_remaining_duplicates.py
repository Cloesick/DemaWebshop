"""
Cleanup remaining duplicate diameter properties
For products with both inner and outer diameter, remove diameter_mm if it matches either
"""
import json
import shutil
from pathlib import Path
from datetime import datetime

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'

def backup_catalog():
    """Create backup of catalog"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    backup_path = catalog_path.parent / f'catalog_products_backup_{timestamp}.json'
    shutil.copy(catalog_path, backup_path)
    print(f"✓ Backup created: {backup_path.name}")
    return backup_path

def cleanup_catalog():
    """Clean up remaining diameter duplicates"""
    print("=" * 80)
    print("CLEANING UP REMAINING DIAMETER DUPLICATES")
    print("=" * 80)
    
    # Backup
    print("\n💾 Creating backup...")
    backup_catalog()
    
    # Load catalog
    print("\n📂 Loading catalog...")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"   Total products: {len(catalog)}")
    
    # Clean up remaining cases
    print("\n🧹 Cleaning products with both inner and outer diameters...")
    
    removed = 0
    samples = []
    
    for product in catalog:
        sku = product.get('sku')
        diam = product.get('diameter_mm')
        inner = product.get('inner_diameter_mm')
        outer = product.get('outer_diameter_mm')
        
        # Case: Has all three dimensions
        if diam and inner and outer:
            # If diameter_mm matches either inner or outer, remove it
            if diam == inner:
                del product['diameter_mm']
                removed += 1
                if len(samples) < 5:
                    samples.append(f"{sku}: removed diameter_mm={diam} (matches inner={inner}, keeping outer={outer})")
            elif diam == outer:
                del product['diameter_mm']
                removed += 1
                if len(samples) < 5:
                    samples.append(f"{sku}: removed diameter_mm={diam} (matches outer={outer}, keeping inner={inner})")
            else:
                # Keep all three if they're different (might be nominal size)
                if len(samples) < 5:
                    samples.append(f"{sku}: kept all three (diameter={diam}, inner={inner}, outer={outer})")
    
    # Save cleaned catalog
    print("\n💾 Saving cleaned catalog...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    # Report
    print("\n" + "=" * 80)
    print("CLEANUP SUMMARY")
    print("=" * 80)
    print(f"Redundant diameter_mm removed:  {removed}")
    
    if samples:
        print("\nSample changes:")
        for sample in samples:
            print(f"  {sample}")
    
    print("\n✅ CLEANUP COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    cleanup_catalog()
