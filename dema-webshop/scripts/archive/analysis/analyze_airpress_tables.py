import json
import PyPDF2
import re
from collections import defaultdict

print("=" * 100)
print("AIRPRESS CATALOG TABLE ANALYSIS")
print("=" * 100)
print()

# Load existing products
with open('src/data/catalog_products.json', 'r', encoding='utf-8') as f:
    products = json.load(f)

# Find airpress products
airpress_products = [p for p in products if p.get('catalog') == 'airpress-catalogus-eng']
print(f"Found {len(airpress_products)} products in airpress-catalogus-eng")
print()

# Analyze what properties are currently assigned
property_stats = defaultdict(int)
property_examples = defaultdict(list)

for product in airpress_products[:50]:  # Sample first 50
    for key, value in product.items():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description']:
            if value:
                property_stats[key] += 1
                if len(property_examples[key]) < 3:
                    property_examples[key].append({
                        'sku': product['sku'],
                        'value': value
                    })

print("Current Property Distribution (first 50 products):")
print("-" * 100)
for prop, count in sorted(property_stats.items(), key=lambda x: -x[1]):
    print(f"{prop:30} : {count:3} products")
    for ex in property_examples[prop][:2]:
        print(f"  → {ex['sku']:20} = {ex['value']}")
print()

# Now let's analyze the PDF structure
pdf_path = 'public/documents/airpress-catalogus-eng.pdf'

print("=" * 100)
print("PDF TABLE STRUCTURE ANALYSIS")
print("=" * 100)
print()

try:
    with open(pdf_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        print(f"Total pages: {len(pdf_reader.pages)}")
        print()
        
        # Sample pages with tables (based on source_pages from products)
        sample_pages = set()
        for product in airpress_products[:30]:
            if product.get('source_pages'):
                sample_pages.update(product['source_pages'][:1])
        
        sample_pages = sorted(list(sample_pages))[:10]
        print(f"Analyzing sample pages: {sample_pages}")
        print()
        
        for page_num in sample_pages:
            if page_num < len(pdf_reader.pages):
                print(f"\n{'=' * 100}")
                print(f"PAGE {page_num + 1}")
                print('=' * 100)
                
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                # Split into lines
                lines = text.split('\n')
                
                # Look for table-like structures
                print("\nDetected lines (first 50):")
                print("-" * 100)
                for i, line in enumerate(lines[:50]):
                    # Detect potential table headers (lines with multiple columns)
                    if any(header in line.lower() for header in ['art.', 'type', 'capacity', 'pressure', 'power', 'voltage', 'rpm', 'weight', 'dimensions']):
                        print(f"{i:3} [HEADER?] {line}")
                    elif re.search(r'\d+\s+\d+', line):  # Lines with multiple numbers
                        print(f"{i:3} [DATA?]   {line}")
                    else:
                        print(f"{i:3}          {line[:80]}")
                
                # Try to detect common table patterns
                print("\n\nPotential Table Headers:")
                print("-" * 100)
                for i, line in enumerate(lines):
                    # Common header patterns
                    if re.search(r'(art\.|article|type|model|capacity|pressure|power|voltage|dimensions|weight)', line, re.IGNORECASE):
                        # Check if line has multiple potential column names
                        column_keywords = ['art', 'type', 'capacity', 'pressure', 'power', 'voltage', 'rpm', 'dimensions', 'weight', 'max']
                        keyword_count = sum(1 for kw in column_keywords if kw in line.lower())
                        if keyword_count >= 2:
                            print(f"Line {i}: {line}")
                            print(f"  → Detected {keyword_count} column keywords")
                            print()

except FileNotFoundError:
    print(f"PDF file not found: {pdf_path}")
    print("Please ensure the file exists in public/documents/")

print()
print("=" * 100)
print("DUPLICATE VALUE CHECK")
print("=" * 100)
print()

# Check for products with duplicate properties
duplicates_found = []

for product in airpress_products:
    seen_values = defaultdict(list)
    
    for key, value in product.items():
        if key not in ['sku', 'name', 'catalog', 'pdf_source', 'source_pages', 'pages', 'images', 'seo', 'description']:
            if value:
                value_str = str(value)
                seen_values[value_str].append(key)
    
    # Find duplicates
    for value, keys in seen_values.items():
        if len(keys) > 1:
            duplicates_found.append({
                'sku': product['sku'],
                'value': value,
                'properties': keys
            })

if duplicates_found:
    print(f"Found {len(duplicates_found)} products with duplicate values:")
    print("-" * 100)
    for dup in duplicates_found[:20]:
        print(f"SKU: {dup['sku']}")
        print(f"  Value '{dup['value']}' appears in: {', '.join(dup['properties'])}")
        print()
else:
    print("✅ No duplicate values found!")

print()
print("Analysis complete!")
