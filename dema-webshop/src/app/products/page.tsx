'use client';

import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import ProductFilters from '@/components/products/ProductFilters';
import ProductList from '@/components/products/ProductList';
import ProductCard from '@/components/products/ProductCard';
import type { Product } from '@/types/product';
import { useLocale } from '@/contexts/LocaleContext';

// API-driven products list

export default function ProductsPage() {
  const router = useRouter();
  const { t } = useLocale();
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestions, setSuggestions] = useState<{ type: 'product' | 'category' | 'sku'; value: string; label: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Build filtered count text from products array
  const filtered = products;

  const handleFilterChange = useCallback((next: Record<string, string[]>) => {
    setFilters(next);
    setActiveCategory(next.category?.[0]);
  }, []);

  // Fetch all products once for filter options
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      try {
        const res = await fetch('/api/products?limit=1000');
        const data = await res.json();
        if (!cancelled && data?.products) {
          setAllProducts(data.products as Product[]);
        }
      } catch (e) {
        console.error('Failed to load products:', e);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, []);

  // Fetch filtered products when filters/search change
  useEffect(() => {
    let cancelled = false;
    const fetchFiltered = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // Map single-select filters
        Object.entries(filters).forEach(([k, v]) => {
          if (v && v[0]) params.set(k, v[0]);
        });
        const term = searchTerm.trim();
        if (term) params.set('q', term);
        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data?.products || []);
        }
      } catch (e) {
        console.error('Failed to load filtered products:', e);
        if (!cancelled) setProducts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFiltered();
    return () => { cancelled = true; };
  }, [filters, searchTerm]);

  // Build suggestions locally (debounced ~150ms)
  useEffect(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q || q.length < 2) {
      setSuggestions([]);
      return;
    }
    const t = setTimeout(() => {
      const sugg: { type: 'product' | 'category' | 'sku'; value: string; label: string }[] = [];
      // products by description/name
      allProducts.forEach((p: Product) => {
        const title = ((p as any).name || p.sku || 'Product') as string;
        const desc = p.description || '';
        if (title.toLowerCase().includes(q) || desc.toLowerCase().includes(q)) {
          sugg.push({ type: 'product', value: p.sku, label: title });
        }
      });
      // categories
      const categories = Array.from(new Set(allProducts.map((p: Product) => p.product_category).filter(Boolean))) as string[];
      categories.forEach(cat => {
        if (cat && cat.toLowerCase().includes(q)) {
          sugg.push({ type: 'category', value: cat, label: cat });
        }
      });
      // skus
      allProducts.forEach((p: Product) => {
        if (p.sku.toLowerCase().includes(q)) {
          sugg.push({ type: 'sku', value: p.sku, label: `SKU: ${p.sku}` });
        }
      });
      // de-duplicate by type+value and limit
      const unique: typeof sugg = [];
      const seen = new Set<string>();
      for (const s of sugg) {
        const key = `${s.type}:${s.value.toLowerCase()}`;
        if (!seen.has(key)) {
          unique.push(s);
          seen.add(key);
        }
        if (unique.length >= 10) break;
      }
      setSuggestions(unique);
    }, 150);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Outside click to close suggestions
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-1">
        <h1 className="text-3xl font-bold mb-6">{t('products.title')}</h1>

        {/* Container-width search input with local suggestions */}
        <div className="mb-6 relative" ref={searchRef}>
          <input
            placeholder={t('search.placeholder.extended')}
            className="w-full pl-10 pr-9 py-2.5 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-100 placeholder-gray-400 text-sm transition duration-200"
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
          />
          {/* Magnifier icon */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          {/* Clear button */}
          {searchTerm && (
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
              onClick={() => {
                setSearchTerm('');
                setSuggestions([]);
                setShowSuggestions(false);
              }}
              aria-label={t('search.clear')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
          {/* Suggestions dropdown */}
          {showSuggestions && searchTerm.trim().length >= 2 && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
              <div className="py-1">
                {suggestions.map((s) => (
                  <button
                    key={`${s.type}-${s.value}`}
                    type="button"
                    onClick={() => {
                      if (s.type === 'category') {
                        setActiveCategory(s.value);
                      } else {
                        // navigate to product detail page for product or SKU
                        router.push(`/products/${s.value}`);
                      }
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                  >
                    {s.type === 'product' && (
                      <svg className="h-4 w-4 text-yellow-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="9" />
                      </svg>
                    )}
                    {s.type === 'category' && (
                      <svg className="h-4 w-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                      </svg>
                    )}
                    {s.type === 'sku' && (
                      <svg className="h-4 w-4 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 7h16M4 12h10M4 17h7" />
                      </svg>
                    )}
                    <span className="truncate">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-black">
          <span className="font-medium">{t('search.legend.title')}</span>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>{t('search.legend.products')}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>{t('search.legend.categories')}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>{t('search.legend.skus')}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>{t('search.legend.pdfs')}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters (UI-only; mapped to local state) */}
          <aside className="md:col-span-1">
            <ProductFilters
              products={allProducts}
              onFilterChange={handleFilterChange}
              onSearch={(q) => setSearchTerm(q)}
            />
          </aside>

          {/* List */}
          <section className="md:col-span-3">
            <div className="mb-4 text-sm text-gray-600">
              {t('products.count',).replace('{shown}', String(filtered.length)).replace('{total}', String(allProducts.length || filtered.length))}
            </div>
            {filtered.length === 0 ? (
              <div className="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md p-6">
                {t('products.empty')}
              </div>
            ) : (
              <ProductList
                products={filtered}
                loading={loading}
                hasMore={false}
                renderProduct={(product) => (
                  <div className="p-2">
                    <ProductCard product={product} />
                  </div>
                )}
              />
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
