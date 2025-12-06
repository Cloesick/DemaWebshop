'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Search, Grid, List, Package, FileText, Wrench, Droplet } from 'lucide-react';
import { StatsBanner } from '@/components/StatsBanner';

// Catalog interface
interface Catalog {
  id: string;
  name: string;
  slug: string;
  url: string;
  icon: string;
  category: 'pumps' | 'pipes' | 'hoses' | 'tools' | 'technical' | 'other';
  totalProducts: number;
  productsWithImages: number;
  totalImages: number;
  imageCoverage: number;
  categories: number;
  avgImagesPerProduct: number;
  description: string;
}

// Legacy hardcoded catalogs as fallback
const FALLBACK_CATALOGS = [
  {
    id: 'bronpompen',
    name: 'Bronpompen',
    description: 'Well pumps for deep water extraction',
    url: '/catalog/bronpompen-grouped',
    icon: '🚰',
    groups: 23,
    variants: 576,
    imageCount: 14,
    coverage: 60.9,
    category: 'pumps'
  },
  {
    id: 'catalogus-aandrijftechniek-150922',
    name: 'Aandrijftechniek',
    description: 'Drive technology, bearings, and mechanical components',
    url: '/catalog/aandrijftechniek-grouped',
    icon: '⚙️',
    groups: 67,
    variants: 921,
    imageCount: 62,
    coverage: 92.5,
    category: 'technical'
  },
  {
    id: 'centrifugaalpompen',
    name: 'Centrifugaalpompen',
    description: 'Centrifugal pumps for various applications',
    url: '/catalog/centrifugaalpompen-grouped',
    icon: '💧',
    groups: 25,
    variants: 267,
    imageCount: 24,
    coverage: 96.0,
    category: 'pumps'
  },
  {
    id: 'digitale-versie-pompentoebehoren-compressed',
    name: 'Pompentoebehoren',
    description: 'Pump accessories and spare parts',
    url: '/catalog/pompentoebehoren-grouped',
    icon: '🔧',
    groups: 90,
    variants: 1229,
    imageCount: 87,
    coverage: 96.7,
    category: 'accessories'
  },
  {
    id: 'dompelpompen',
    name: 'Dompelpompen',
    description: 'Submersible pumps for drainage and sewage',
    url: '/catalog/dompelpompen-grouped',
    icon: '⬇️',
    groups: 36,
    variants: 319,
    imageCount: 36,
    coverage: 100.0,
    category: 'pumps'
  },
  {
    id: 'drukbuizen',
    name: 'Drukbuizen',
    description: 'Pressure pipes and tubing systems',
    url: '/catalog/drukbuizen-grouped',
    icon: '🌀',
    groups: 58,
    variants: 1390,
    imageCount: 58,
    coverage: 100.0,
    category: 'pipes'
  },
  {
    id: 'kunststof-afvoerleidingen',
    name: 'Kunststof Afvoerleidingen',
    description: 'Plastic drainage pipes and fittings',
    url: '/catalog/kunststof-afvoerleidingen-grouped',
    icon: '🚿',
    groups: 32,
    variants: 689,
    imageCount: 32,
    coverage: 100.0,
    category: 'pipes'
  },
  {
    id: 'messing-draadfittingen',
    name: 'Messing Draadfittingen',
    description: 'Brass threaded fittings and connectors',
    url: '/catalog/messing-draadfittingen-grouped',
    icon: '🔩',
    groups: 15,
    variants: 325,
    imageCount: 15,
    coverage: 100.0,
    category: 'fittings'
  }
];

const CATEGORIES = [
  { id: 'all', name: 'All Categories', icon: Package },
  { id: 'pumps', name: 'Pumps', icon: Droplet },
  { id: 'hoses', name: 'Hoses & Fittings', icon: Wrench },
  { id: 'tools', name: 'Tools & Equipment', icon: FileText },
  { id: 'technical', name: 'Technical', icon: Grid },
  { id: 'other', name: 'Other', icon: Package }
];

export default function CatalogsPage() {
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load catalogs from JSON
  useEffect(() => {
    fetch('/catalogs_metadata.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Not JSON response');
        }
        return response.json();
      })
      .then(data => {
        setCatalogs(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading catalogs:', error);
        setLoading(false);
      });
  }, []);

  // Filter catalogs
  const filteredCatalogs = catalogs.filter((catalog: Catalog) => {
    const matchesSearch = catalog.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         catalog.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || catalog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Calculate totals from dynamic data
  const totalProducts = catalogs.reduce((sum: number, c: Catalog) => sum + c.totalProducts, 0);
  const totalImages = catalogs.reduce((sum: number, c: Catalog) => sum + c.totalImages, 0);
  const avgCoverage = catalogs.length > 0 ? catalogs.reduce((sum: number, c: Catalog) => sum + c.imageCoverage, 0) / catalogs.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#00ADEF] to-blue-500 text-white">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-bold mb-4">📚 Product Catalogs</h1>
          <p className="text-xl opacity-90">
            {loading ? 'Loading catalogs...' : `Browse our ${catalogs.length} comprehensive product catalogs with ${totalProducts.toLocaleString()} products`}
          </p>
        </div>
      </div>

      {/* Stats Banner - Dynamic from JSON */}
      <StatsBanner />

      {/* Search & Filter Bar */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="🔍 Search catalogs..."
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

      {/* Category Filter */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map(category => {
              const Icon = category.icon;
              const count = category.id === 'all' 
                ? catalogs.length 
                : catalogs.filter((c: Catalog) => c.category === category.id).length;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full border-2 transition flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-[#00ADEF] border-[#00ADEF] text-white'
                      : 'border-gray-300 hover:border-[#00ADEF]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {category.name}
                  <span className="text-xs opacity-75">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Catalogs Grid/List */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4 animate-pulse">⏳</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Loading catalogs...</h3>
            <p className="text-gray-600">Please wait while we fetch the latest catalog data</p>
          </div>
        ) : filteredCatalogs.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">No catalogs found</h3>
            <p className="text-gray-600">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {filteredCatalogs.map(catalog => (
              <Link
                key={catalog.id}
                href={catalog.url}
                className={`bg-white rounded-lg shadow-sm hover:shadow-lg transition-all border-2 border-transparent hover:border-[#00ADEF] ${
                  viewMode === 'list' ? 'flex items-center gap-6 p-6' : 'p-6'
                }`}
              >
                {/* Icon */}
                <div className={`${viewMode === 'grid' ? 'text-6xl mb-4' : 'text-5xl'}`}>
                  {catalog.icon}
                </div>

                <div className="flex-1">
                  {/* Title */}
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {catalog.name}
                  </h2>

                  {/* Description */}
                  <p className="text-gray-600 mb-4">
                    {catalog.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xl font-bold text-[#00ADEF]">{catalog.totalProducts.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Products</div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xl font-bold text-[#00ADEF]">{catalog.totalImages.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Images</div>
                    </div>
                  </div>

                  {/* Image Coverage Badge */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      catalog.imageCoverage === 100
                        ? 'bg-green-100 text-green-800'
                        : catalog.imageCoverage >= 90
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {catalog.imageCoverage.toFixed(1)}% Coverage
                    </div>
                    <div className="text-sm text-gray-500">
                      {catalog.productsWithImages.toLocaleString()}/{catalog.totalProducts.toLocaleString()} with images
                    </div>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div className={`${viewMode === 'list' ? '' : 'mt-4'} flex justify-end`}>
                  <div className="w-10 h-10 rounded-full bg-[#00ADEF] text-white flex items-center justify-center">
                    →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="bg-gray-100 border-t mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p className="text-lg mb-2">
              All catalogs feature <strong>table-based grouping</strong> with SKU dropdowns and property display
            </p>
            <p className="text-sm">
              Total: {catalogs.length} catalogs • {totalProducts.toLocaleString()} products • {totalImages.toLocaleString()} images • {avgCoverage.toFixed(1)}% avg coverage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
