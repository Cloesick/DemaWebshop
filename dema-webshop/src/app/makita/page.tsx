'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Product {
  sku: string;
  name: string;
  category: string;
  price_excl_vat?: number;
  price_incl_vat?: number;
  specs?: Array<{ label: string; value: string; icon?: string }>;
  media?: Array<{ url: string; role?: string }>;
  imageUrl?: string;
}

export default function MakitaPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadMakitaProducts();
  }, []);

  const loadMakitaProducts = async () => {
    try {
      const response = await fetch('/api/catalog?catalog=makita&limit=100');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Not JSON response');
      }
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Error loading Makita products:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: 'all', name: 'All Products', count: products.length },
    { id: 'Batteries', name: 'Batteries', count: products.filter(p => p.category === 'Batteries').length },
    { id: 'Powerpacks', name: 'Powerpacks', count: products.filter(p => p.category === 'Powerpacks').length },
    { id: 'Chargers', name: 'Chargers', count: products.filter(p => p.category === 'Chargers').length },
    { id: 'Adapters', name: 'Adapters', count: products.filter(p => p.category === 'Adapters').length },
  ];

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden" style={{ 
        background: 'linear-gradient(135deg, #00B8A9 0%, #008E7E 100%)' 
      }}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="max-w-4xl">
            <div className="inline-block bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white font-semibold mb-6">
              ⚡ Professional Power Solutions
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Makita Battery<br/>Products
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl">
              Professional-grade XGT 40V MAX batteries, chargers, and accessories. 
              Power your tools with industry-leading performance and reliability.
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Link 
                href="#products" 
                className="px-8 py-4 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
              >
                Browse Products →
              </Link>
              <Link 
                href="/products?catalog=makita" 
                className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition border-2 border-white/30"
              >
                View in Catalog
              </Link>
            </div>
          </div>
        </div>
        
        {/* Decorative wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">{products.length}</div>
              <div className="text-gray-600 mt-2">Products</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">40V</div>
              <div className="text-gray-600 mt-2">Max Power</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">2.0-8.0</div>
              <div className="text-gray-600 mt-2">Ah Range</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-teal-600">XGT</div>
              <div className="text-gray-600 mt-2">Technology</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Makita XGT?</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3">High Performance</h3>
              <p className="text-gray-600">
                40V MAX XGT platform delivers superior power and runtime for demanding professional applications.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🔋</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Extended Runtime</h3>
              <p className="text-gray-600">
                Choose from 2.0Ah to 8.0Ah capacity options to match your application needs and work duration.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🛡️</span>
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Protection</h3>
              <p className="text-gray-600">
                Built-in protection features safeguard against overloading, over-discharging, and overheating.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Browse Products</h2>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-3 justify-center mb-12">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedCategory === cat.id
                    ? 'bg-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat.name} {cat.count > 0 && `(${cat.count})`}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-600 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-600">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <Link
                  key={product.sku}
                  href={`/products/${product.sku.toLowerCase()}`}
                  className="bg-white rounded-xl shadow-md hover:shadow-xl transition overflow-hidden group"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center relative overflow-hidden">
                    {product.imageUrl || (product.media && product.media.length > 0) ? (
                      <Image
                        src={product.imageUrl || (product.media && product.media[0]?.url) || ''}
                        alt={product.name}
                        width={800}
                        height={800}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-6xl">
                        {product.category === 'Batteries' && '🔋'}
                        {product.category === 'Powerpacks' && '⚡'}
                        {product.category === 'Chargers' && '🔌'}
                        {product.category === 'Adapters' && '🔗'}
                      </div>
                    )}
                    <div className="absolute top-3 right-3 bg-teal-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {product.category}
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="text-sm text-gray-500 mb-1">{product.sku}</div>
                    <h3 className="font-semibold text-gray-900 mb-3 group-hover:text-teal-600 transition line-clamp-2">
                      {product.name}
                    </h3>
                    
                    {/* Key Specs */}
                    {product.specs && product.specs.length > 0 && (
                      <div className="space-y-1 mb-3">
                        {product.specs.slice(0, 2).map((spec, idx) => (
                          <div key={idx} className="flex items-center text-sm text-gray-600">
                            <span className="mr-2">{spec.icon || '•'}</span>
                            <span className="font-medium mr-2">{spec.label}:</span>
                            <span>{spec.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Price */}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-xs text-gray-500">Ex BTW</div>
                          <div className="text-lg font-bold text-gray-900">
                            € {product.price_excl_vat?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Incl BTW</div>
                          <div className="text-sm font-semibold text-teal-600">
                            € {product.price_incl_vat?.toFixed(2) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
          
          {/* View All Link */}
          <div className="text-center mt-12">
            <Link 
              href="/products?catalog=makita"
              className="inline-block px-8 py-4 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition shadow-lg"
            >
              View All in Product Catalog →
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-teal-600 to-teal-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Power Your Work?</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Browse our complete catalog of Makita XGT batteries, chargers, and accessories.
          </p>
          <Link 
            href="/products?catalog=makita"
            className="inline-block px-8 py-4 bg-white text-teal-600 font-semibold rounded-lg hover:bg-gray-100 transition shadow-xl"
          >
            Shop Makita Products
          </Link>
        </div>
      </section>
    </div>
  );
}
