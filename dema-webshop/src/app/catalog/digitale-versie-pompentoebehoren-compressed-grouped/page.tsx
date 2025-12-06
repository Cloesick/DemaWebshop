'use client';

import { useState, useEffect } from 'react';
import ImageBasedProductCard from '@/components/ImageBasedProductCard';
import SimpleProductFilters from '@/components/products/SimpleProductFilters';
import { Grid, List, Search, ArrowLeft } from 'lucide-react';
import { fetchJsonSafe } from '@/lib/fetchJson';
import Link from 'next/link';

export default function DigitaleVersiePompentoebehorenCompressedCatalogPage() {
  const [productGroups, setProductGroups] = useState<any[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetchJsonSafe('/data/digitale_versie_pompentoebehoren_compressed_products.json')
      .then(data => {
        console.log('Loaded Pompentoebehoren:', data.length, 'groups');
        setProductGroups(data);
        setFilteredGroups(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading product groups:', err);
        setLoading(false);
      });
  }, []);

  // Convert product groups to flat products for filtering
  const flatProducts = productGroups.flatMap(group =>
    (group.products || []).map((p: any) => ({
      ...p.properties,
      sku: p.sku,
      name: p.sku,
      image: group.image,
      catalog: group.catalog,
      pdf_source: group.source_pdf,
      page_in_pdf: p.page
    }))
  );

  // Apply search and filters
  useEffect(() => {
    let filtered = productGroups;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(group =>
        group.catalog.toLowerCase().includes(query) ||
        group.products.some((p: any) =>
          p.sku?.toLowerCase().includes(query) ||
          Object.values(p.properties || {}).some(v => 
            String(v).toLowerCase().includes(query)
          )
        )
      );
    }

    // Advanced filters
    if (Object.keys(filters).length > 0) {
      const matchingImages = new Set(
        flatProducts
          .filter(product => {
            return Object.entries(filters).every(([filterType, filterValues]) => {
              if (!filterValues || filterValues.length === 0) return true;
              return filterValues.some(value => {
                const propValue = product[filterType];
                return propValue && String(propValue).toLowerCase().includes(value.toLowerCase());
              });
            });
          })
          .map(p => p.image)
      );

      filtered = filtered.filter(group => matchingImages.has(group.image));
    }

    setFilteredGroups(filtered);
  }, [searchQuery, filters, productGroups]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#00ADEF] border-t-transparent"></div>
      </div>
    );
  }

  const totalProducts = productGroups.reduce((sum, g) => sum + (g.products?.length || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00ADEF] to-[#0066CC] text-white">
        <div className="container mx-auto px-4 py-12">
          <Link 
            href="/catalogs-new" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Catalogs
          </Link>
          <h1 className="text-4xl font-bold mb-4">🎨 Pompentoebehoren</h1>
          <p className="text-xl opacity-90">
            {productGroups.length} image groups with {totalProducts} SKUs • Icon-Based Property Display
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00ADEF]">{filteredGroups.length}</div>
              <div className="text-gray-600">Image Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00ADEF]">{totalProducts}</div>
              <div className="text-gray-600">Total SKUs</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-[#00ADEF]">
                {productGroups.length > 0 ? (totalProducts / productGroups.length).toFixed(1) : '0'}
              </div>
              <div className="text-gray-600">Avg SKUs/Image</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & View Toggle */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Search by SKU, properties, or values..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00ADEF] focus:border-transparent"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-3 rounded-lg border-2 transition ${
                  viewMode === 'grid'
                    ? 'bg-[#00ADEF] border-[#00ADEF] text-white'
                    : 'border-gray-300 hover:border-[#00ADEF]'
                }`}
              >
                <Grid className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-3 rounded-lg border-2 transition ${
                  viewMode === 'list'
                    ? 'bg-[#00ADEF] border-[#00ADEF] text-white'
                    : 'border-gray-300 hover:border-[#00ADEF]'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-32">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Filters</h2>
              <SimpleProductFilters
                products={flatProducts}
                onFilterChange={setFilters}
                onSearch={setSearchQuery}
              />
            </div>
          </aside>

          {/* Product Groups Grid/List */}
          <section className="flex-1">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No product groups found</h3>
                <p className="text-gray-600">Try adjusting your search or filters</p>
                <p className="text-sm text-gray-500 mt-2">
                  Total groups loaded: {productGroups.length}
                </p>
              </div>
            ) : (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                    : 'space-y-4'
                }
              >
                {filteredGroups.map((group, index) => (
                  <ImageBasedProductCard
                    key={index}
                    productGroup={group}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
