'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductGroupWithVariants from '@/components/products/ProductGroupWithVariants';
import Link from 'next/link';

export default function ProductGroupPage() {
  const params = useParams();
  const [productGroup, setProductGroup] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const groupId = Array.isArray(params.groupId) ? params.groupId[0] : params.groupId;
    
    if (!groupId) {
      setError('No product group ID provided');
      setLoading(false);
      return;
    }

    const fetchProductGroup = async () => {
      try {
        setLoading(true);
        // Load from the grouped JSON file
        const res = await fetch('/data/abs_persluchtbuizen_grouped.json');
        if (!res.ok) throw new Error(`Failed to load product groups`);
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Not JSON response');
        }
        const groups = await res.json();
        const group = groups.find((g: any) => g.group_id === groupId);
        
        if (!group) {
          setError('Product group not found');
          setProductGroup(null);
          return;
        }
        
        setProductGroup(group);
      } catch (err) {
        console.error('Error fetching product group:', err);
        setError('Failed to load product group');
      } finally {
        setLoading(false);
      }
    };

    fetchProductGroup();
  }, [params.groupId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product group...</p>
        </div>
      </div>
    );
  }

  if (error || !productGroup) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-3xl font-bold text-red-600 mb-2">Product Group Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The product group you are looking for does not exist.'}</p>
          <Link 
            href="/catalog"
            className="inline-block px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm text-gray-600">
            <li>
              <Link href="/" className="hover:text-blue-600 transition-colors">
                Home
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li>
              <Link href="/catalog" className="hover:text-blue-600 transition-colors">
                Catalog
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
            </li>
            <li className="font-semibold text-gray-900">{productGroup.name}</li>
          </ol>
        </nav>

        {/* Product Group Component */}
        <ProductGroupWithVariants 
          productGroup={productGroup}
          onAddToQuote={(sku) => {
            console.log('Added to quote:', sku);
          }}
        />

        {/* Back to Catalog Button */}
        <div className="mt-8 text-center">
          <Link 
            href="/catalog"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-gray-700 font-semibold rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:text-blue-600 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Catalog</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
