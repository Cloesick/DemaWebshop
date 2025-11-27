import json
from collections import Counter

products = json.load(open('public/data/products_for_shop.json'))

with_images = [p for p in products if p.get('imageUrl')]

print(f"Products with imageUrl: {len(with_images)}")

# Check file extensions
extensions = []
for p in with_images:
    url = p.get('imageUrl', '')
    if '.' in url:
        ext = url.split('.')[-1]
        extensions.append(ext)

ext_counts = Counter(extensions)
print(f"\nImage URL extensions:")
for ext, count in ext_counts.most_common():
    print(f"  .{ext}: {count}")

# Show samples
print(f"\nSample image URLs:")
for p in with_images[:5]:
    print(f"  {p['sku']}: {p['imageUrl']}")
