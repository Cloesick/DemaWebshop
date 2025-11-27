import requests
import json

print("🧪 Testing API endpoint...\n")

try:
    response = requests.get("http://localhost:3000/api/products?sku=0-10")
    data = response.json()
    
    if data.get('products'):
        product = data['products'][0]
        print(f"✅ API returned product 0-10:")
        print(f"   Name: {product.get('name')}")
        print(f"   Has imageUrl: {bool(product.get('imageUrl'))}")
        print(f"   ImageUrl: {product.get('imageUrl', 'None')}")
    else:
        print("❌ No products returned")
        
except Exception as e:
    print(f"❌ Error: {e}")
