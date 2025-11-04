'use client';

'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Search, X, ChevronDown, ChevronUp, Filter, Search as SearchIcon } from 'lucide-react';
import { useDebounce } from 'use-debounce';

interface Product {
  sku: string;
  pdf_source: string;
  source_pages: number[];
  product_category?: string;
  description: string;
  pressure_min_bar?: number;
  pressure_max_bar?: number;
  dimensions_mm_list?: number[];
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  power_hp?: number;
  power_kw?: number;
  weight_kg?: number;
  voltage_v?: number;
  connection_types?: string[];
  noise_level_db?: number;
  airflow_l_min?: number;
  tank_capacity_l?: number;
}

interface FilterOption {
  type: string;
  value: string;
  label: string;
  count: number;
}

interface SearchSuggestion {
  type: 'product' | 'category' | 'sku';
  value: string;
  label: string;
}

interface ProductFiltersProps {
  products: Product[];
  onFilterChange?: (filters: Record<string, string[]>) => void;
  onSearch?: (query: string) => void;
  className?: string;
}

const FilterChip = ({ 
  label, 
  isActive, 
  onClick,
  count,
  className = ''
}: { 
  label: string; 
  isActive: boolean; 
  onClick: () => void;
  count?: number;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
      isActive 
        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400' 
        : 'bg-gray-800 text-gray-200 hover:bg-gray-700 hover:text-white'
    } ${className}`}
  >
    <span className="truncate">{label}</span>
    {count !== undefined && (
      <span className={`text-xs px-1.5 py-0.5 rounded-full ${
        isActive ? 'bg-black/10' : 'bg-white/10'
      }`}>
        {count}
      </span>
    )}
    {isActive && <X size={14} className="flex-shrink-0" />}
  </button>
);

const FilterSection = ({ 
  title, 
  children, 
  isOpen: isOpenProp = true,
  className = '' 
}: { 
  title: string; 
  children: React.ReactNode; 
  isOpen?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(isOpenProp);
  
  return (
    <div className={`border-b border-gray-700 pb-4 ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-2 text-left focus:outline-none"
      >
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {isOpen && (
        <div className="mt-2 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

export default function ProductFilters({ 
  products = [], 
  onFilterChange = () => {},
  onSearch = () => {},
  className = ''
}: ProductFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery] = useDebounce(searchQuery, 200);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [availableFilters, setAvailableFilters] = useState<Record<string, FilterOption[]>>({});

  // Extract all possible filters from products
  useEffect(() => {
    const filters: Record<string, Set<string>> = {
      category: new Set(),
      pressure: new Set(),
      power: new Set(),
      voltage: new Set(),
      connection: new Set(),
      size: new Set(),
      weight: new Set()
    };

    products.forEach(product => {
      if (product.product_category) {
        filters.category.add(product.product_category);
      }
      
      if (product.pressure_min_bar && product.pressure_max_bar) {
        filters.pressure.add(`${product.pressure_min_bar}-${product.pressure_max_bar} bar`);
      }
      
      if (product.power_hp) filters.power.add(`${product.power_hp} HP`);
      if (product.power_kw) filters.power.add(`${product.power_kw} kW`);
      
      if (product.voltage_v) filters.voltage.add(`${product.voltage_v}V`);
      
      product.connection_types?.forEach(type => {
        if (type) filters.connection.add(type);
      });
      
      product.dimensions_mm_list?.forEach(dim => {
        if (dim) filters.size.add(`${dim}mm`);
      });
      
      if (product.weight_kg) {
        filters.weight.add(`${product.weight_kg} kg`);
      }
    });

    // Convert sets to filter options with counts
    const filterOptions: Record<string, FilterOption[]> = {};
    
    Object.entries(filters).forEach(([type, values]) => {
      filterOptions[type] = Array.from(values).map(value => ({
        type,
        value,
        label: value,
        count: products.filter(p => {
          switch (type) {
            case 'category': return p.product_category === value;
            case 'pressure': 
              const [min, max] = value.split('-').map(Number);
              return p.pressure_min_bar === min && p.pressure_max_bar === max;
            case 'power':
              const [power, unit] = value.split(' ');
              return (unit === 'HP' && p.power_hp === Number(power)) || 
                     (unit === 'kW' && p.power_kw === Number(power));
            case 'voltage':
              return p.voltage_v === Number(value.replace('V', ''));
            case 'connection':
              return p.connection_types?.includes(value);
            case 'size':
              return p.dimensions_mm_list?.includes(Number(value.replace('mm', '')));
            case 'weight':
              return p.weight_kg === Number(value.replace(' kg', ''));
            default:
              return false;
          }
        }).length
      }));
    });

    setAvailableFilters(filterOptions);
  }, [products]);

  const handleFilterToggle = (type: string, value: string) => {
    setActiveFilters(prev => {
      const currentFilters = [...(prev[type] || [])];
      const newFilters = currentFilters.includes(value)
        ? currentFilters.filter(v => v !== value)
        : [...currentFilters, value];
      
      const updated: Record<string, string[]> = { ...prev };
      
      if (newFilters.length) {
        updated[type] = newFilters;
      } else {
        const { [type]: _, ...rest } = updated;
        return rest;
      }
      
      onFilterChange(updated);
      return updated;
    });
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    onFilterChange({});
  };

  const removeFilter = (type: string, value: string) => {
    setActiveFilters(prev => {
      const updated = { ...prev };
      
      if (updated[type]) {
        updated[type] = updated[type].filter(v => v !== value);
        if (!updated[type].length) {
          delete updated[type];
        }
      }
      
      onFilterChange(updated);
      return updated;
    });
  };

  const hasActiveFilters = Object.values(activeFilters).some(filters => filters?.length);
  const filterTypes = Object.entries(availableFilters).filter(([_, options]) => options.length > 0);
  const activeFiltersList = Object.entries(activeFilters).flatMap(([type, values]) => 
    values?.map(value => ({ type, value })) || []
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      if (!target.closest('.category-dropdown')) {
        setIsCategoryOpen(false);
      }
      
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Generate search suggestions
  useEffect(() => {
    if (!debouncedSearchQuery.trim()) {
      setSearchSuggestions([]);
      return;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const suggestions: SearchSuggestion[] = [];

    // Add product name matches
    products.forEach(product => {
      if (product.description?.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'product',
          value: product.sku,
          label: product.description.split('\n')[0] || 'Product'
        });
      }
    });

    // Add category matches
    const categories = new Set(products.map(p => p.product_category).filter(Boolean));
    categories.forEach(category => {
      if (category && category.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'category',
          value: category,
          label: category
        });
      }
    });

    // Add SKU matches
    products.forEach(product => {
      if (product.sku?.toLowerCase().includes(query)) {
        suggestions.push({
          type: 'sku',
          value: product.sku,
          label: `SKU: ${product.sku}`
        });
      }
    });

    // Limit to 5 suggestions and remove duplicates
    const uniqueSuggestions = Array.from(
      new Map(suggestions.map(s => [s.value + s.type, s])).values()
    ).slice(0, 5);

    setSearchSuggestions(uniqueSuggestions);
  }, [debouncedSearchQuery, products]);

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.label);
    setShowSuggestions(false);
    onSearch(suggestion.label);
  };

  // Extract unique categories from products
  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    products.forEach(product => {
      if (product.product_category) {
        categorySet.add(product.product_category);
      }
    });
    return Array.from(categorySet).sort();
  }, [products]);

  const handleCategoryChange = (category: string) => {
    const newFilters = { ...activeFilters };
    if (category) {
      newFilters['category'] = [category];
    } else {
      delete newFilters['category'];
    }
    onFilterChange(newFilters);
  };

  const currentCategory = activeFilters['category']?.[0] || '';

  // Sort size options from low to high
  const sortedSizes = useMemo(() => {
    if (!availableFilters.size) return [];
    return [...availableFilters.size].sort((a, b) => {
      const numA = parseFloat(a.value.replace('mm', ''));
      const numB = parseFloat(b.value.replace('mm', ''));
      return numA - numB;
    });
  }, [availableFilters.size]);

  // Get unique PDFs
  const pdfOptions = useMemo(() => {
    const pdfs = new Set<string>();
    const pdfCounts: Record<string, number> = {};
    
    products.forEach(product => {
      if (product.pdf_source) {
        pdfs.add(product.pdf_source);
        pdfCounts[product.pdf_source] = (pdfCounts[product.pdf_source] || 0) + 1;
      }
    });
    
    return Array.from(pdfs).map(pdf => ({
      value: pdf,
      label: pdf.split('/').pop() || 'PDF Document',
      count: pdfCounts[pdf] || 0
    }));
  }, [products]);

  const handleFilterChange = (type: string, value: string) => {
    const newFilters = { ...activeFilters };
    if (value) {
      newFilters[type] = [value];
    } else {
      delete newFilters[type];
    }
    setActiveFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search with suggestions */}
      <div className="relative" ref={searchRef}>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, categories, SKUs..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
              if (!e.target.value.trim()) {
                onSearch('');
              }
            }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                onSearch(searchQuery);
                setShowSuggestions(false);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-gray-100 placeholder-gray-400 text-sm transition duration-200"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                onSearch('');
                setSearchSuggestions([]);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Search Suggestions */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-gray-800 border border-gray-700 rounded-md shadow-lg overflow-hidden">
            <div className="py-1">
              {searchSuggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.value}`}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-gray-700 flex items-center gap-2"
                >
                  {suggestion.type === 'product' && (
                    <SearchIcon className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                  )}
                  {suggestion.type === 'category' && (
                    <svg className="h-4 w-4 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  )}
                  {suggestion.type === 'sku' && (
                    <svg className="h-4 w-4 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  )}
                  <span className="truncate">{suggestion.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Legend */}
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
          <span className="font-medium">Search for:</span>
          <div className="flex items-center gap-1">
            <SearchIcon className="h-3 w-3 text-yellow-400" />
            <span>Product names</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Categories</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>SKUs</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="h-3 w-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <span>PDF Documents</span>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {Object.keys(activeFilters).some(key => activeFilters[key].length > 0) && (
        <div className="space-y-2 bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-200">Active Filters</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-yellow-400 hover:text-yellow-300 hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(activeFilters).map(([type, values]) =>
              values.map(value => (
                <FilterChip
                  key={`${type}-${value}`}
                  label={`${type === 'category' ? '' : `${type}: `}${value}`}
                  isActive={true}
                  onClick={() => handleFilterChange(type, '')}
                  className="text-xs"
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Category filter */}
        <FilterSection title="Categories">
          <select
            id="category-filter"
            value={activeFilters.category?.[0] || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
          >
            <option value="">All Categories</option>
            {availableFilters.category?.map(({ value, label, count }) => (
              <option key={value} value={value} className="bg-gray-800">
                {label} ({count})
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Size filter */}
        {sortedSizes.length > 0 && (
          <FilterSection title="Sizes">
            <select
              id="size-filter"
              value={activeFilters.size?.[0] || ''}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
            >
              <option value="">All Sizes</option>
              {sortedSizes.map(({ value, label, count }) => (
                <option key={value} value={value} className="bg-gray-800">
                  {label} ({count})
                </option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* PDF filter */}
        {pdfOptions.length > 0 && (
          <FilterSection title="Documents">
            <select
              id="pdf-filter"
              value={activeFilters.pdf?.[0] || ''}
              onChange={(e) => handleFilterChange('pdf', e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
            >
              <option value="">All Documents</option>
              {pdfOptions.map(({ value, label, count }) => (
                <option key={value} value={value} className="bg-gray-800">
                  {label} ({count})
                </option>
              ))}
            </select>
          </FilterSection>
        )}
      </div>
    </div>
  );
};

export { FilterSection };