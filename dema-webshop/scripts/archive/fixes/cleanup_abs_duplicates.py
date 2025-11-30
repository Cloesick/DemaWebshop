"""
Cleanup ABS-persluchtbuizen duplicate properties
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

def cleanup_abs_product(product):
    """Clean up duplicate properties for ABS products"""
    changes = []
    
    # 1. Remove pressure_work_bar if it equals pressure_max_bar (redundant)
    if (product.get('pressure_work_bar') and 
        product.get('pressure_max_bar') and 
        product['pressure_work_bar'] == product['pressure_max_bar']):
        del product['pressure_work_bar']
        changes.append(f"removed redundant pressure_work_bar (equals pressure_max_bar={product['pressure_max_bar']})")
    
    # 2. Remove dimensions_mm_list if it's just the diameter repeated
    if product.get('dimensions_mm_list'):
        dml = product['dimensions_mm_list']
        if isinstance(dml, list):
            # If all values are the same
            if len(set(dml)) == 1:
                # And it matches diameter_mm
                if product.get('diameter_mm') and dml[0] == product['diameter_mm']:
                    del product['dimensions_mm_list']
                    changes.append(f"removed redundant dimensions_mm_list (just diameter {dml[0]} repeated)")
            # If list is just 2 values that are the same
            elif len(dml) == 2 and dml[0] == dml[1]:
                if product.get('diameter_mm') and dml[0] == product['diameter_mm']:
                    del product['dimensions_mm_list']
                    changes.append(f"removed redundant dimensions_mm_list [2x {dml[0]}]")
    
    return changes

def cleanup_catalog():
    """Clean up ABS products in catalog"""
    print("=" * 80)
    print("CLEANING UP ABS-PERSLUCHTBUIZEN DUPLICATES")
    print("=" * 80)
    
    # Backup
    print("\n💾 Creating backup...")
    backup_catalog()
    
    # Load catalog
    print("\n📂 Loading catalog...")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    abs_products = [p for p in catalog if p.get('catalog') == 'abs-persluchtbuizen']
    print(f"   Total products: {len(catalog)}")
    print(f"   ABS products: {len(abs_products)}")
    
    # Clean up ABS products
    print("\n🧹 Cleaning ABS products...")
    
    stats = {
        'total_abs': len(abs_products),
        'cleaned': 0,
        'changes': 0,
        'by_type': {}
    }
    
    samples = []
    
    for product in catalog:
        if product.get('catalog') != 'abs-persluchtbuizen':
            continue
        
        changes = cleanup_abs_product(product)
        
        if changes:
            stats['cleaned'] += 1
            stats['changes'] += len(changes)
            
            # Sample
            if len(samples) < 5:
                samples.append({
                    'sku': product.get('sku'),
                    'changes': changes
                })
            
            # Count by change type
            for change in changes:
                change_type = change.split('(')[0].strip()
                stats['by_type'][change_type] = stats['by_type'].get(change_type, 0) + 1
    
    # Save cleaned catalog
    print("\n💾 Saving cleaned catalog...")
    with open(catalog_path, 'w', encoding='utf-8') as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)
    
    # Report
    print("\n" + "=" * 80)
    print("CLEANUP SUMMARY")
    print("=" * 80)
    print(f"ABS products:                  {stats['total_abs']}")
    print(f"Products cleaned:              {stats['cleaned']}")
    print(f"Total changes made:            {stats['changes']}")
    
    print("\nChanges by type:")
    for change_type, count in sorted(stats['by_type'].items(), key=lambda x: -x[1]):
        print(f"  {change_type:50} {count:5}")
    
    if samples:
        print("\nSample products cleaned:")
        for sample in samples:
            print(f"\n  SKU: {sample['sku']}")
            for change in sample['changes']:
                print(f"    - {change}")
    
    print("\n✅ CLEANUP COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    cleanup_catalog()
