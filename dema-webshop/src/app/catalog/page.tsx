'use client';

import { useState, useEffect } from 'react';
import CatalogProductCard from '@/components/CatalogProductCard';
import SimpleProductFilters from '@/components/products/SimpleProductFilters';
import Link from 'next/link';

export default function CatalogPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [rawProducts, setRawProducts] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCatalog, setSelectedCatalog] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 0 });
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadProducts();
  }, [search, selectedCatalog]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        ...(search && { search }),
        ...(selectedCatalog && { catalog: selectedCatalog })
      });

      const response = await fetch(`/api/catalog?${params}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Not JSON response');
      }
      const data = await response.json();
      
      setRawProducts(data.products || []);
      if (data.catalogs) {
        setCatalogs(data.catalogs);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters client-side
  useEffect(() => {
    let filtered = [...rawProducts];

    // Apply each filter type
    Object.entries(filters).forEach(([filterType, filterValues]) => {
      if (!filterValues || filterValues.length === 0) return;

      filtered = filtered.filter(product => {
        return filterValues.some(value => {
          switch (filterType) {
            case 'pdf_source':
              return product.pdf_source === value;
            case 'power_kw':
              const power = product.power_kw || product.power_kw_derived;
              if (!power || power <= 0) return false;
              const productPower = Math.round(power * 10) / 10;
              return String(productPower) === value;
            case 'pressure_max_bar':
              if (!product.pressure_max_bar || product.pressure_max_bar <= 0) return false;
              const productPressure = Math.round(product.pressure_max_bar);
              return String(productPressure) === value;
            case 'voltage_v':
              if (!product.voltage_v || product.voltage_v <= 0) return false;
              const productVoltage = Math.round(product.voltage_v);
              return String(productVoltage) === value;
            case 'weight_kg':
              if (!product.weight_kg || product.weight_kg <= 0) return false;
              const productWeight = Math.round(product.weight_kg * 10) / 10;
              return String(productWeight) === value;
            case 'connection_types':
              return (Array.isArray(product.connection_types) && product.connection_types.includes(value)) ||
                     product.connection_type === value;
            default:
              return false;
          }
        });
      });
    });

    // Pagination
    const start = (page - 1) * 24;
    const end = start + 24;
    const paginated = filtered.slice(start, end);

    setProducts(paginated);
    setPagination({
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / 24)
    });
  }, [rawProducts, filters, page]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="text-white" style={{ background: 'linear-gradient(to right, #00ADEF, #0088CC)' }}>
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">📦 Product Catalog</h1>
          <p className="text-xl opacity-90">
            {pagination.total.toLocaleString()} products from 26 industrial catalogs
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#00ADEF' }}>
                {pagination.total.toLocaleString()}
              </div>
              <div className="text-gray-600">Total Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#00ADEF' }}>
                {Object.keys(catalogs).length}
              </div>
              <div className="text-gray-600">Catalogs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#00ADEF' }}>9,495</div>
              <div className="text-gray-600">Product Images</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <input
                type="text"
                placeholder="🔍 Search products by SKU, name, or catalog..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': '#00ADEF' } as any}
                onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #00ADEF40'}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters ({Object.keys(filters).length})
            </button>
            <select
              value={selectedCatalog}
              onChange={(e) => {
                setSelectedCatalog(e.target.value);
                setPage(1);
              }}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': '#00ADEF' } as any}
              onFocus={(e) => e.currentTarget.style.boxShadow = '0 0 0 2px #00ADEF40'}
            >
              <option value="">All Catalogs</option>
              {Object.entries(catalogs).map(([pdf, data]: [string, any]) => (
                <option key={pdf} value={pdf}>
                  {data.name} ({data.product_count})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Content with Filters */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Collapsible Sidebar with filters */}
          {showFilters && (
            <aside className="lg:w-80 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <SimpleProductFilters
                  products={rawProducts}
                  onFilterChange={(newFilters: Record<string, string[]>) => {
                    setFilters(newFilters);
                    setPage(1);
                  }}
                  onSearch={(searchTerm: string) => {
                    setSearch(searchTerm);
                    setPage(1);
                  }}
                />
              </div>
            </aside>
          )}

          {/* Main content area */}
          <section className="flex-1 min-w-0">
            {loading ? (
              <div className="text-center py-20">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent" style={{ borderColor: '#00ADEF', borderTopColor: 'transparent' }}></div>
                <p className="mt-4 text-gray-600">Loading products...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product: any) => (
                    <CatalogProductCard key={product.id} product={product} viewMode="grid" />
                  ))}
                </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="mt-12 flex justify-center items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  ← Previous
                </button>
                
                <div className="flex gap-2">
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                    if (pageNum > pagination.totalPages) return null;
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`px-4 py-2 border rounded-lg ${
                          page === pageNum
                            ? 'text-white'
                            : 'hover:bg-gray-50'
                        }`}
                        style={page === pageNum ? { backgroundColor: '#00ADEF' } : {}}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next →
                </button>
              </div>
            )}

                {/* Results Info */}
                <div className="mt-6 text-center text-gray-600">
                  Showing {((page - 1) * 24) + 1} - {Math.min(page * 24, pagination.total)} of{' '}
                  {pagination.total.toLocaleString()} products
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-white mt-16" style={{ background: 'linear-gradient(to right, #00ADEF, #0088CC)' }}>
        <div className="container mx-auto px-4 py-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Need Help Finding a Product?</h2>
          <p className="text-xl opacity-90 mb-6">
            Our team is here to assist you with product selection and technical specifications
          </p>
          <Link
            href="/contact"
            className="inline-block bg-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            style={{ color: '#00ADEF' }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
