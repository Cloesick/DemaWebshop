"""
Clean Integration of Makita Battery Products
=============================================
Integrates Makita batteries into existing products.json using the existing product format
"""

import json
from pathlib import Path
from datetime import datetime

# Paths
SOURCE_DATA = Path(__file__).parent.parent / "public" / "data" / "makita_batteries_source.json"
PRODUCTS_FILE = Path(__file__).parent.parent / "public" / "data" / "products.json"
BACKUP_DIR = Path(__file__).parent.parent / "backups"

def convert_makita_to_product_format(battery):
    """Convert Makita battery format to match existing product structure"""
    
    # Build specs array from properties
    specs = []
    if 'properties' in battery and battery['properties']:
        for key, prop in battery['properties'].items():
            specs.append({
                'label': prop.get('label', key),
                'value': prop.get('value', ''),
                'icon': prop.get('icon', '')
            })
    
    # Create product in existing format
    product = {
        "id": f"makita:{battery['sku']}",
        "sku": battery['sku'],
        "name": battery.get('product_name') or battery.get('name', battery['sku']),
        "brand": "Makita",
        "catalog": "makita",
        "category": battery.get('category', 'Battery Products'),
        "description": f"{battery.get('product_name', '')} - {battery.get('specifications', '')}",
        "attributes": {},
        "specs": specs,
        "media": [],
        "price": {
            "amount": battery['prices']['excl_vat'],
            "currency": "EUR",
            "display": f"€ {battery['prices']['excl_vat']:.2f}"
        },
        "stock": {
            "status": "in_stock",
            "quantity": 100
        },
        "seo": {
            "slug": battery['sku'].lower(),
            "meta_title": f"{battery.get('product_name', battery['sku'])} | Makita",
            "meta_description": f"Makita {battery.get('product_name', battery['sku'])} - {battery.get('specifications', '')}"
        },
        "source": {
            "pdf_sources": ["makita_batteries"],
            "pages": []
        },
        "pdf_source": "makita_batteries",
        "product_category": battery.get('category', 'Battery Products'),
        # Additional fields for compatibility
        "price_excl_vat": battery['prices']['excl_vat'],
        "price_incl_vat": battery['prices']['incl_vat'],
        "vat_rate": 0.21
    }
    
    return product

def main():
    print("=" * 80)
    print("INTEGRATING MAKITA BATTERY PRODUCTS")
    print("=" * 80)
    
    # Load source Makita data
    print("\n📦 Loading Makita battery data...")
    with open(SOURCE_DATA, 'r', encoding='utf-8') as f:
        makita_data = json.load(f)
    
    batteries = makita_data.get('products', [])
    print(f"   Found {len(batteries)} Makita battery products")
    
    # Load existing products
    print("\n📦 Loading existing products...")
    with open(PRODUCTS_FILE, 'r', encoding='utf-8') as f:
        products = json.load(f)
    
    original_count = len(products)
    print(f"   Current products: {original_count}")
    
    # Create backup
    BACKUP_DIR.mkdir(exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = BACKUP_DIR / f"products_before_makita_{timestamp}.json"
    
    print(f"\n💾 Creating backup...")
    with open(backup_file, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2)
    print(f"   ✅ Backup saved: {backup_file.name}")
    
    # Convert and add Makita products
    print(f"\n🔄 Converting Makita products to standard format...")
    makita_products = []
    for battery in batteries:
        product = convert_makita_to_product_format(battery)
        makita_products.append(product)
        print(f"   ✓ {battery['sku']}: {battery.get('product_name', battery['sku'])[:50]}")
    
    # Add to products list
    print(f"\n➕ Adding Makita products to products.json...")
    products.extend(makita_products)
    
    # Save updated products
    print(f"\n💾 Saving updated products.json...")
    with open(PRODUCTS_FILE, 'w', encoding='utf-8') as f:
        json.dump(products, f, indent=2)
    
    # Summary
    print("\n" + "=" * 80)
    print("✅ INTEGRATION COMPLETE")
    print("=" * 80)
    print(f"   Original products:    {original_count}")
    print(f"   Makita products:      {len(makita_products)}")
    print(f"   Total products:       {len(products)}")
    print(f"   Backup saved:         {backup_file.name}")
    print("\n💡 Makita batteries are now available:")
    print(f"   - Search for 'Makita' on /products page")
    print(f"   - Filter by catalog: 'makita'")
    print(f"   - Browse by category: {', '.join(set(b.get('category', '') for b in batteries))}")
    print("=" * 80 + "\n")

if __name__ == "__main__":
    main()
