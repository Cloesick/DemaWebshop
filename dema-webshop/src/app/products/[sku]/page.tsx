'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import ProductCard from '@/components/products/ProductCard';

// This is a client component that will be hydrated on the client
export default function ProductPage() {
  const params = useParams();
  const { t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recs, setRecs] = useState<Product[]>([]);
  const [recsLoading, setRecsLoading] = useState(false);

  useEffect(() => {
    const sku = Array.isArray(params.sku) ? params.sku[0] : params.sku;
    
    if (!sku) {
      setError('No product SKU provided');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products?sku=${encodeURIComponent(String(sku))}&limit=1`);
        if (!res.ok) throw new Error(`API ${res.status}`);
        const data = await res.json();
        const productData: Product | undefined = data?.products?.[0];
        if (!productData) {
          setError('Product not found');
          setProduct(null);
          return;
        }
        setProduct(productData);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.sku]);

  useEffect(() => {
    const sku = Array.isArray(params.sku) ? params.sku[0] : params.sku;
    if (!sku) return;
    setRecsLoading(true);
    const fetchBySku = async () => {
      try {
        const r = await fetch(`/api/recommendations?sku=${encodeURIComponent(String(sku))}&limit=4`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`REC ${r.status}`);
        const data = await r.json();
        const items = Array.isArray(data?.items) ? data.items : [];
        if (items.length > 0) {
          setRecs(items);
          return;
        }
        // Fallback by category if available
        if (product?.product_category) {
          const r2 = await fetch(`/api/recommendations?category=${encodeURIComponent(product.product_category)}&limit=4`, { cache: 'no-store' });
          if (r2.ok) {
            const d2 = await r2.json();
            const catItems = Array.isArray(d2?.items) ? d2.items : [];
            if (catItems.length > 0) {
              setRecs(catItems);
              return;
            }
          }
        }
        // Final fallback: top-rated/in-stock products
        const r3 = await fetch(`/api/products?limit=4`, { cache: 'no-store' });
        if (r3.ok) {
          const d3 = await r3.json();
          const p3 = Array.isArray(d3?.products) ? d3.products : [];
          setRecs(p3);
          return;
        }
        setRecs([]);
      } catch {
        // Fallback on error
        if (product?.product_category) {
          fetch(`/api/recommendations?category=${encodeURIComponent(product.product_category)}&limit=4`, { cache: 'no-store' })
            .then(async r2 => {
              if (!r2.ok) throw new Error('REC fallback');
              const d2 = await r2.json();
              const catItems = Array.isArray(d2?.items) ? d2.items : [];
              if (catItems.length > 0) {
                setRecs(catItems);
                return;
              }
              // Final fallback
              return fetch(`/api/products?limit=4`, { cache: 'no-store' })
                .then(async r3 => {
                  if (!r3.ok) throw new Error('REC final');
                  const d3 = await r3.json();
                  const p3 = Array.isArray(d3?.products) ? d3.products : [];
                  setRecs(p3);
                });
            })
            .catch(() => setRecs([]))
            .finally(() => setRecsLoading(false));
          return;
        }
        setRecs([]);
      } finally {
        setRecsLoading(false);
      }
    };
    fetchBySku();
  }, [params.sku, product?.product_category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Error</h1>
          <p className="mt-2">{error || 'Product not found'}</p>
        </div>
      </div>
    );
  }

  // Generate a placeholder color based on product SKU or category
  const getPlaceholderColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 70%, 90%)`;
  };

  const categoryForImage = product.product_category?.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'product';
  const placeholderColor = getPlaceholderColor(product.sku || categoryForImage);
  const placeholderImage = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='600' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='${encodeURIComponent(placeholderColor)}'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='24' text-anchor='middle' dominant-baseline='middle' fill='%23666'%3E${encodeURIComponent(categoryForImage)}%3C/text%3E%3C/svg%3E`;
  
  const priceNumber = product.dimensions_mm_list?.[0]
    ? product.dimensions_mm_list[0] * 0.5
    : 99.99;
  
  // Client component for cart functionality
  function AddToCart({ product }: { product: Product }) {
    const addToCart = useCartStore((state) => state.addToCart);
    
    return (
      <Button 
        onClick={() => addToCart(product)}
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700"
      >
        Add to Cart
      </Button>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to results */}
        <div className="mb-3">
          <Link href="/products" className="text-sm text-primary hover:underline">
            ← {t('products.back_to_results')}
          </Link>
        </div>

        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-4" aria-label="Breadcrumb">
          <ol className="list-none p-0 inline-flex gap-1">
            <li>
              <Link href="/" className="hover:underline">{t('nav.home')}</Link>
              <span className="mx-1">/</span>
            </li>
            <li>
              <Link href="/products" className="hover:underline">{t('nav.products')}</Link>
              <span className="mx-1">/</span>
            </li>
            <li aria-current="page" className="text-gray-700 font-medium truncate max-w-[50ch]">
              {product.description.split(' ').slice(0, 3).join(' ') || product.sku}
            </li>
          </ol>
        </nav>
        <div className="lg:grid lg:grid-cols-2 lg:gap-8">
          {/* Product Image */}
          <div className="mb-8 lg:mb-0">
            <div className="bg-gray-100 rounded-lg overflow-hidden">
              <div className="w-full h-full flex items-center justify-center bg-gray-100 p-8">
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-700 mb-2">
                    {product.product_category || 'Product'}
                  </div>
                  <div className="text-sm text-gray-500">
                    SKU: {product.sku}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Product Info */}
          <div className="lg:pl-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {product.description.split(' ').slice(0, 3).join(' ')}
            </h1>
            <p className="text-gray-500 text-sm mb-4">SKU: {product.sku}</p>
            
            <div className="mt-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {formatCurrency(priceNumber)}
              </h2>
              <p className="text-green-600 text-sm mt-1">In Stock</p>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Description</h3>
              <div className="mt-2 text-gray-700">
                <p>{product.description}</p>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
              <dl className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-700">
                {product.product_category && (
                  <>
                    <dt className="font-medium">Category</dt>
                    <dd>{product.product_category}</dd>
                  </>
                )}
                {product.pressure_max_bar && (
                  <>
                    <dt className="font-medium">Max Pressure</dt>
                    <dd>{product.pressure_max_bar} bar</dd>
                  </>
                )}
                {product.power_kw && (
                  <>
                    <dt className="font-medium">Power</dt>
                    <dd>{product.power_kw} kW</dd>
                  </>
                )}
                {product.voltage_v && (
                  <>
                    <dt className="font-medium">Voltage</dt>
                    <dd>{product.voltage_v} V</dd>
                  </>
                )}
                {product.flow_l_min && (
                  <>
                    <dt className="font-medium">Flow</dt>
                    <dd>{product.flow_l_min} L/min</dd>
                  </>
                )}
                {product.absk_codes && product.absk_codes.length > 0 && (
                  <>
                    <dt className="font-medium">ABSK Codes</dt>
                    <dd className="break-words">{product.absk_codes.join(', ')}</dd>
                  </>
                )}
                {product.weight_kg && (
                  <>
                    <dt className="font-medium">Weight</dt>
                    <dd>{product.weight_kg} kg</dd>
                  </>
                )}
                {Array.isArray(product.materials) && product.materials.length > 0 && (
                  <>
                    <dt className="font-medium">Materials</dt>
                    <dd>{product.materials.join(', ')}</dd>
                  </>
                )}
                {product.dimensions_mm_list && product.dimensions_mm_list.length > 0 && (
                  <>
                    <dt className="font-medium">Available Sizes</dt>
                    <dd>{product.dimensions_mm_list.join('mm, ')}mm</dd>
                  </>
                )}
              </dl>
            </div>
            
            <div className="mt-6" id="pdf">
              <h3 className="text-sm font-medium text-gray-900">Product Details</h3>
              <div className="mt-2 space-y-3">
                {product.pdf_source && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source</p>
                    <a
                      href={`${product.pdf_source}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1.5"
                    >
                      <span>{(() => { try { const u = new URL(product.pdf_source); return decodeURIComponent(u.pathname.split('/').pop() || 'PDF'); } catch { const p = product.pdf_source.split('?')[0]; return decodeURIComponent((p.split('/').pop() || 'PDF')); } })()}</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
                {product.pdf_source && product.source_pages && product.source_pages.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-500">Pdf Source Page</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {product.source_pages.map((p) => (
                        <a
                          key={`page-${p}`}
                          href={`${product.pdf_source}#page=${p}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-gray-100 rounded-md text-xs font-medium text-gray-700 hover:underline"
                        >
                          Page {p}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-8">
              <AddToCart product={product} />
            </div>
            
            <div className="mt-4 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span>Free shipping on orders over €100</span>
            </div>
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <svg className="flex-shrink-0 mr-2 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span>Delivery within 2-3 business days</span>
            </div>
          </div>
        </div>
        
        {/* Related Products */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">You may also like</h2>
          {recsLoading && (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="group relative animate-pulse">
                  <div className="w-full min-h-80 bg-gray-200 rounded-md overflow-hidden"></div>
                  <div className="mt-4 flex justify-between">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!recsLoading && (
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
              {recs.length > 0 ? (
                recs.map((rp) => (
                  <ProductCard key={rp.sku} product={rp} viewMode="grid" />
                ))
              ) : (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="group relative animate-pulse">
                    <div className="w-full min-h-80 bg-gray-200 rounded-md overflow-hidden"></div>
                    <div className="mt-4 flex justify-between">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
