'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Product } from '@/types/product';
import Link from 'next/link';
import { useLocale } from '@/contexts/LocaleContext';
import ProductDetailsCard from '@/components/products/ProductDetailsCard';
import DynamicConfigurator from '@/components/products/DynamicConfigurator';

// This is a client component that will be hydrated on the client
export default function ProductPage() {
  const params = useParams();
  const { t } = useLocale();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryProducts, setCategoryProducts] = useState<Product[] | null>(null);

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
        // Fetch products in same category for configurator
        if (productData.product_category) {
          const catRes = await fetch(`/api/products?product_category=${encodeURIComponent(productData.product_category)}&limit=250`);
          if (catRes.ok) {
            const catData = await catRes.json();
            setCategoryProducts(catData?.products || []);
          } else {
            setCategoryProducts([]);
          }
        } else {
          setCategoryProducts([]);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.sku]);

  // Build initial selection for configurator from current product's scalar attributes
  const initialSelection = useMemo(() => {
    if (!product) return undefined;
    const sel: Record<string, string> = {};
    for (const [k, v] of Object.entries(product)) {
      if (v === null || v === undefined) continue;
      if (Array.isArray(v)) continue;
      if (typeof v === 'object') continue;
      // Avoid core meta fields
      if ([
        'sku','name','description','product_category','pdf_source','source_pages','price','inStock','rating','reviewCount'
      ].includes(k)) continue;
      sel[k] = String(v);
    }
    return sel;
  }, [product]);

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

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back to results */}
        <div className="mb-4">
          <Link href="/products" className="text-sm text-primary hover:underline">
            ← {t('products.back_to_results')}
          </Link>
        </div>

        {/* Structured product details */}
        <ProductDetailsCard product={product} />

        {/* Configure similar */}
        {categoryProducts && categoryProducts.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Configure similar</h2>
            <DynamicConfigurator
              products={categoryProducts}
              activeCategory={product.product_category}
              initialSelection={initialSelection}
            />
          </div>
        )}
      </div>
    </div>
  );
}
