'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import ProductCard from '@/components/products/ProductCard';
import { 
  FiSearch, 
  FiFilter, 
  FiX, 
  FiChevronDown, 
  FiChevronUp, 
  FiChevronLeft,
  FiChevronRight,
  FiSliders,
  FiGrid,
  FiList
} from 'react-icons/fi';
import type { Product as BaseProduct } from '@/types/product';

// Types
type ViewMode = 'grid' | 'list';
type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';

// Number of products per page
const ITEMS_PER_PAGE = 12;

// Mock categories
const categories = [
  { id: 'compressors', name: 'Compressors', count: 42 },
  { id: 'tools', name: 'Pneumatic Tools', count: 128 },
  { id: 'hoses', name: 'Hoses & Fittings', count: 75 },
  { id: 'filters', name: 'Air Treatment', count: 36 },
  { id: 'lubrication', name: 'Lubrication', count: 24 },
];

// Function to generate a placeholder image URL with text
const getPlaceholderImage = (text: string, category: string = 'product') => {
  const colorMap: Record<string, string> = {
    'compressors': 'bg-blue-100 text-blue-800',
    'tools': 'bg-green-100 text-green-800',
    'hoses': 'bg-yellow-100 text-yellow-800',
    'filters': 'bg-purple-100 text-purple-800',
    'lubrication': 'bg-red-100 text-red-800',
    'default': 'bg-gray-100 text-gray-800'
  };
  
  const bgColor = colorMap[category.toLowerCase()] || colorMap.default;
  const displayText = text.split(' ').slice(0, 3).join(' ').substring(0, 20);
  
  const svg = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
      <rect width="100%" height="100%" fill="currentColor" class="${bgColor.split(' ')[0]}" />
      <text x="50%" y="50%" font-family="sans-serif" font-size="16" text-anchor="middle" fill="currentColor" class="${bgColor}" dy=".3em">
        ${displayText}
      </text>
    </svg>
  `.trim().replace(/\s+/g, ' ');
  
  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

// Mock products with generated placeholder images
const mockProducts: (BaseProduct & {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  reviewCount: number;
  inStock: boolean;
  brand: string;
  oldPrice?: number;
  flow_l_min_list?: number[];
  pressure_max_bar?: number;
  power_kw?: number;
  weight_kg?: number;
})[] = [
  {
    sku: 'AC-2000',
    pdf_source: '/catalogs/compressors.pdf',
    source_pages: [1, 2, 3],
    product_category: 'compressors',
    description: 'High-performance industrial air compressor for heavy-duty applications',
    id: '1',
    name: 'Industrial Air Compressor',
    price: 1299.99,
    image: getPlaceholderImage('Industrial Air Compressor', 'compressors'),
    category: 'compressors',
    rating: 4.5,
    reviewCount: 24,
    inStock: true,
    brand: 'Atlas Copco',
    oldPrice: 1499.99,
    flow_l_min_list: [100, 200, 300],
    pressure_max_bar: 10,
    power_kw: 5.5,
    weight_kg: 150
  },
  {
    sku: 'IR-231G',
    pdf_source: '/catalogs/tools.pdf',
    source_pages: [5, 6],
    product_category: 'tools',
    description: '1/2\" drive air impact wrench with 780 ft-lbs of torque',
    id: '2',
    name: 'Pneumatic Impact Wrench',
    price: 189.99,
    image: getPlaceholderImage('Pneumatic Impact Wrench', 'tools'),
    category: 'tools',
    rating: 4.2,
    reviewCount: 156,
    inStock: true,
    brand: 'Ingersoll Rand',
    oldPrice: 219.99,
    flow_l_min_list: [50, 100],
    pressure_max_bar: 8,
    weight_kg: 2.3
  },
  {
    sku: 'HFZ-5050',
    pdf_source: '/catalogs/hoses.pdf',
    source_pages: [3, 4],
    product_category: 'hoses',
    description: '50ft hybrid air hose, lightweight and kink-resistant',
    id: '3',
    name: 'Air Hose - 50ft',
    price: 49.99,
    image: getPlaceholderImage('Air Hose - 50ft', 'hoses'),
    category: 'hoses',
    rating: 4.7,
    reviewCount: 89,
    inStock: true,
    brand: 'Flexzilla',
    oldPrice: 59.99,
    flow_l_min_list: [500, 1000],
    pressure_max_bar: 20,
    weight_kg: 1.5
  },
  {
    sku: 'AF30-03',
    pdf_source: '/pdfs/AF30-03.pdf',
    source_pages: [1, 2],
    product_category: 'filters',
    description: 'Precision air filter regulator for clean, dry air supply',
    id: '4',
    name: 'Air Filter Regulator',
    price: 34.99,
    image: getPlaceholderImage('Air Filter Regulator', 'filters'),
    category: 'filters',
    rating: 4.3,
    reviewCount: 8,
    inStock: true,
    brand: 'SMC',
    flow_l_min_list: [150, 250],
    pressure_max_bar: 10,
    power_kw: 0.5,
    weight_kg: 0.8
  },
  {
    id: '5',
    name: 'Air Tool Oil',
    price: 12.99,
    image: getPlaceholderImage('Air Tool Oil', 'lubrication'),
    category: 'lubrication',
    rating: 4.7,
    reviewCount: 32,
    inStock: true,
    brand: 'Ingersoll Rand',
    sku: 'TKO600',
    description: 'Premium air tool oil for extended tool life',
    product_category: 'lubrication',
    pdf_source: '/pdfs/TKO600.pdf',
    source_pages: [1],
    flow_l_min_list: [],
    pressure_max_bar: 0,
    power_kw: 0,
    weight_kg: 0.5
  }
];

export default function AllProductsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [products, setProducts] = useState<typeof mockProducts>(mockProducts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    category: searchParams.get('category')?.split(',') || [],
    q: searchParams.get('q') || '',
    page: searchParams.get('page') || '1',
  });

  // Handle filter changes
  const handleFilterChange = (filterType: string, value: string, isChecked: boolean) => {
    setFilters(prev => {
      const currentFilters = prev[filterType as keyof typeof prev];
      let newFilters: string[] = [];
      
      if (Array.isArray(currentFilters)) {
        newFilters = isChecked
          ? [...currentFilters, value]
          : currentFilters.filter((item: string) => item !== value);
      }
      
      return {
        ...prev,
        [filterType]: newFilters,
        page: '1',
      };
    });
    setCurrentPage(1);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      q: e.target.value,
      page: '1',
    }));
    setCurrentPage(1);
  };

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category.length > 0) {
      params.set('category', filters.category.join(','));
    }
    
    if (filters.q) {
      params.set('q', filters.q);
    }
    
    params.set('page', currentPage.toString());
    
    // Update URL without page reload
    router.push(`${pathname}?${params.toString()}`);
  }, [filters, currentPage, pathname, router]);

  // Filter UI components
  const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-b border-gray-200 py-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );

  const FilterCheckbox = ({ 
    id, 
    name, 
    label, 
    count,
    checked,
    onChange 
  }: { 
    id: string; 
    name: string; 
    label: string; 
    count?: number;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  }) => (
    <div className="flex items-center">
      <input
        id={id}
        name={name}
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        checked={checked}
        onChange={onChange}
      />
      <label htmlFor={id} className="ml-3 text-sm text-gray-600">
        {label}
        {count !== undefined && (
          <span className="ml-1 text-gray-400">({count})</span>
        )}
      </label>
    </div>
  );

  // Filter and sort products
  const filteredAndSortedProducts = useMemo(() => {
    let result = [...mockProducts];

    // Apply category filter
    if (filters.category && filters.category.length > 0) {
      result = result.filter(product => 
        filters.category.includes(product.category)
      );
    }

    // Apply search filter
    if (filters.q) {
      const searchTerm = filters.q.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.brand.toLowerCase().includes(searchTerm)
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      // 'relevance' is the default sorting
      default:
        break;
    }

    return result;
  }, [filters, sortBy]);

  // Calculate pagination
  const totalItems = filteredAndSortedProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Products</h1>
          <p className="mt-2 text-sm text-gray-600">
            Browse our wide range of industrial equipment and tools
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters - Desktop */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-medium text-gray-900">Filters</h2>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:text-blue-800"
                  onClick={() => {
                    setFilters({
                      category: [],
                      q: '',
                      page: '1',
                    });
                    setCurrentPage(1);
                  }}
                >
                  Clear all
                </button>
              </div>

              <FilterSection title="Categories">
                {categories.map((category) => (
                  <FilterCheckbox
                    key={category.id}
                    id={`category-${category.id}`}
                    name="category"
                    label={category.name}
                    count={category.count}
                    checked={filters.category?.includes(category.id) || false}
                    onChange={(e) => handleFilterChange('category', category.id, e.target.checked)}
                  />
                ))}
              </FilterSection>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
              <div className="flex flex-col sm:flex-row w-full sm:w-auto sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Search products..."
                    value={filters.q}
                    onChange={handleSearchChange}
                  />
                </div>
                
                {/* View Toggle Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <FiGrid className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
                    onClick={() => setViewMode('list')}
                  >
                    <FiList className="h-5 w-5" />
                  </button>
                </div>
                
                <p className="text-sm text-gray-600">
                  Showing {paginatedProducts.length} of {totalItems} products
                </p>
              </div>

              <div className="w-full md:w-auto">
                <div className="flex items-center">
                  <label htmlFor="sort" className="mr-2 text-sm font-medium text-gray-700">
                    Sort by:
                  </label>
                  <select
                    id="sort"
                    name="sort"
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                  >
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price: Low to High</option>
                    <option value="price-desc">Price: High to Low</option>
                    <option value="name-asc">Name: A to Z</option>
                    <option value="name-desc">Name: Z to A</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Mobile filter dialog */}
            <div className="md:hidden mb-6">
              <button
                type="button"
                className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <FiFilter className="mr-2 h-5 w-5" />
                Filters
              </button>
            </div>

            {/* Products */}
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Try Again
                </button>
              </div>
            ) : paginatedProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">No products found. Try adjusting your filters.</p>
                <button
                  onClick={() => {
                    setFilters({
                      category: [],
                      q: '',
                      page: '1',
                    });
                    setCurrentPage(1);
                  }}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Clear all filters
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="grid"
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    viewMode="list"
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {products.length > 0 && (
              <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage >= totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)}
                      </span>{' '}
                      of <span className="font-medium">{totalItems}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Previous</span>
                        <FiChevronLeft className="h-5 w-5" />
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Always show first page
                        if (i === 0) return 1;
                        // Always show last page
                        if (i === 4 && totalPages > 4) return totalPages;
                        // Show current page and surrounding pages
                        const pageNum = Math.min(
                          Math.max(2, currentPage - 1 + i - 1),
                          totalPages - 1
                        );
                        return pageNum;
                      })
                      .filter((page, index, array) => array.indexOf(page) === index) // Remove duplicates
                      .map((page) => (
                        <button
                          key={`page-${page}`}
                          onClick={() => setCurrentPage(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === page
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage(prev => prev + 1)}
                        disabled={currentPage >= totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                      >
                        <span className="sr-only">Next</span>
                        <FiChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter dialog */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-40 overflow-y-auto p-4 sm:p-6 md:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileFiltersOpen(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl flex flex-col w-full max-w-xs h-full max-h-[90vh]">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Filters</h2>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setMobileFiltersOpen(false)}
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-8">
              <FilterSection title="Categories">
                {categories.map((category) => (
                  <FilterCheckbox
                    key={category.id}
                    id={`mobile-category-${category.id}`}
                    name="category"
                    label={category.name}
                    count={category.count}
                    checked={filters.category?.includes(category.id) || false}
                    onChange={(e) => handleFilterChange('category', category.id, e.target.checked)}
                  />
                ))}
              </FilterSection>
            </div>
            <div className="p-4 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setFilters({
                    category: [],
                    q: '',
                    page: '1',
                  });
                  setCurrentPage(1);
                  setMobileFiltersOpen(false);
                }}
              >
                Clear all
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={() => setMobileFiltersOpen(false)}
              >
                Apply filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
