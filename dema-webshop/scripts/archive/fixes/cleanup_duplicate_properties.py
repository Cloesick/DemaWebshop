"""
Cleanup duplicate and redundant properties in catalog
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

def cleanup_product(product):
    """Clean up duplicate and redundant properties for a single product"""
    changes = []
    
    # 1. Remove redundant diameter_mm if it matches inner_diameter_mm
    if (product.get('diameter_mm') and 
        product.get('inner_diameter_mm') and 
        product['diameter_mm'] == product['inner_diameter_mm'] and
        not product.get('outer_diameter_mm')):
        del product['diameter_mm']
        changes.append('removed redundant diameter_mm (matches inner_diameter_mm)')
    
    # 2. Remove redundant diameter_mm if it matches outer_diameter_mm
    elif (product.get('diameter_mm') and 
          product.get('outer_diameter_mm') and 
          product['diameter_mm'] == product['outer_diameter_mm'] and
          not product.get('inner_diameter_mm')):
        del product['diameter_mm']
        changes.append('removed redundant diameter_mm (matches outer_diameter_mm)')
    
    # 3. Consolidate pressure properties - keep new naming convention
    # Keep pressure_work_bar, remove work_pressure_bar if they match
    if (product.get('work_pressure_bar') and product.get('pressure_work_bar')):
        if product['work_pressure_bar'] == product['pressure_work_bar']:
            del product['work_pressure_bar']
            changes.append('removed duplicate work_pressure_bar')
        else:
            # Keep pressure_work_bar (new convention)
            changes.append(f'kept pressure_work_bar ({product["pressure_work_bar"]}), removed work_pressure_bar ({product["work_pressure_bar"]})')
            del product['work_pressure_bar']
    
    # Keep pressure_burst_bar, remove rupture_pressure_bar if they match
    if (product.get('rupture_pressure_bar') and product.get('pressure_burst_bar')):
        if product['rupture_pressure_bar'] == product['pressure_burst_bar']:
            del product['rupture_pressure_bar']
            changes.append('removed duplicate rupture_pressure_bar')
        else:
            # Keep pressure_burst_bar (new convention)
            changes.append(f'kept pressure_burst_bar ({product["pressure_burst_bar"]}), removed rupture_pressure_bar ({product["rupture_pressure_bar"]})')
            del product['rupture_pressure_bar']
    
    # 4. Consolidate weight properties
    # If weight_kg and weight_g_per_m exist and weight_kg > 100 (likely in grams, not kg)
    if (product.get('weight_kg') and 
        product.get('weight_g_per_m') and 
        product['weight_kg'] > 100):
        # weight_kg is actually in grams, weight_g_per_m is correct
        # Convert weight_kg to actual kg
        correct_kg = product['weight_kg'] / 1000
        if abs(correct_kg - product.get('weight_kg_per_m', 0)) < 0.01:
            # It's the per meter weight, remove weight_kg
            del product['weight_kg']
            changes.append('removed weight_kg (was duplicate of weight_kg_per_m in wrong unit)')
        else:
            product['weight_kg'] = round(correct_kg, 3)
            changes.append(f'converted weight_kg from grams to kg')
    
    # If weight_kg and weight_kg_per_m are the same, keep weight_kg_per_m only
    if (product.get('weight_kg') and 
        product.get('weight_kg_per_m') and 
        abs(product['weight_kg'] - product['weight_kg_per_m']) < 0.01):
        del product['weight_kg']
        changes.append('removed weight_kg (duplicate of weight_kg_per_m)')
    
    # Remove weight_g_per_m if weight_kg_per_m exists (redundant)
    if product.get('weight_g_per_m') and product.get('weight_kg_per_m'):
        del product['weight_g_per_m']
        changes.append('removed weight_g_per_m (redundant with weight_kg_per_m)')
    
    # 5. Convert remaining weight_g_per_m to weight_kg_per_m
    if product.get('weight_g_per_m') and not product.get('weight_kg_per_m'):
        product['weight_kg_per_m'] = round(product['weight_g_per_m'] / 1000, 3)
        del product['weight_g_per_m']
        changes.append('converted weight_g_per_m to weight_kg_per_m')
    
    return changes

def cleanup_catalog():
    """Clean up entire catalog"""
    print("=" * 80)
    print("CLEANING UP DUPLICATE PROPERTIES")
    print("=" * 80)
    
    # Backup
    print("\n💾 Creating backup...")
    backup_catalog()
    
    # Load catalog
    print("\n📂 Loading catalog...")
    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog = json.load(f)
    
    print(f"   Total products: {len(catalog)}")
    
    # Clean up each product
    print("\n🧹 Cleaning products...")
    stats = {
        'total': len(catalog),
        'cleaned': 0,
        'changes': 0,
        'by_type': {}
    }
    
    for product in catalog:
        changes = cleanup_product(product)
        
        if changes:
            stats['cleaned'] += 1
            stats['changes'] += len(changes)
            
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
    print(f"Total products:               {stats['total']}")
    print(f"Products cleaned:             {stats['cleaned']}")
    print(f"Total changes made:           {stats['changes']}")
    
    print("\nChanges by type:")
    for change_type, count in sorted(stats['by_type'].items(), key=lambda x: -x[1]):
        print(f"  {change_type:50} {count:5}")
    
    print("\n✅ CLEANUP COMPLETE!")
    print("=" * 80)

if __name__ == '__main__':
    cleanup_catalog()
