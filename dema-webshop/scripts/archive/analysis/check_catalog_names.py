import json
from pathlib import Path

catalog_path = Path(__file__).parent.parent / 'src/data/catalog_products.json'
with open(catalog_path, 'r', encoding='utf-8') as f:
    catalog = json.load(f)

cats = ['pomp-specials', 'plat-oprolbare-slangen', 'abs-persluchtbuizen', 
        'slangkoppelingen', 'catalogus-aandrijftechniek-150922']

print('Products per catalog:')
for cat in cats:
    products = [p for p in catalog if p.get('catalog') == cat]
    print(f'  {cat}: {len(products)}')
    
    # Sample one product with properties
    if products:
        sample = products[0]
        print(f'    Sample SKU: {sample.get("sku")}')
        props = [k for k in sample.keys() if k not in ['id', 'sku', 'name', 'category', 'catalog', 
                 'images', 'imageUrl', 'image_paths', 'media', 'source', 'attributes',
                 'description', 'priceMode', 'stock', 'seo'] and sample.get(k)]
        print(f'    Has {len(props)} technical properties')
        print(f'    Properties: {", ".join(props[:5])}...')
