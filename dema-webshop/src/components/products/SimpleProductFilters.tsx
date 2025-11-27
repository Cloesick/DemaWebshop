'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { ChevronUp, ChevronDown, Search, X } from 'lucide-react';

interface Product {
  sku: string;
  pdf_source?: string;
  power_kw?: number;
  pressure_max_bar?: number;
  voltage_v?: number;
  weight_kg?: number;
  connection_types?: string[];
  dimensions_mm_list?: number[];
  [key: string]: any;
}

interface ProductFiltersProps {
  products: Product[];
  onFilterChange?: (filters: Record<string, string[]>) => void;
  onSearch?: (search: string) => void;
  className?: string;
}

interface FilterOption {
  type: string;
  value: string;
  label: string;
  count: number;
}

const FilterSection = ({ 
  title, 
  children, 
  defaultOpen = true,
  className = '' 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
  className?: string;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`border-b border-gray-200 pb-4 ${className}`}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-2 text-left focus:outline-none"
      >
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
          {title}
        </h3>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-600" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-600" />
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

export default function SimpleProductFilters({ 
  products = [], 
  onFilterChange = () => {},
  onSearch = () => {},
  className = ''
}: ProductFiltersProps) {
  const [activeFilters, setActiveFilters] = useState<Record<string, string[]>>({});
  const [availableFilters, setAvailableFilters] = useState<Record<string, FilterOption[]>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<Array<{type: string, value: string, product: Product}>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Extract all possible filters from products
  useEffect(() => {
    const filters: Record<string, Set<string>> = {
      pdf_source: new Set(),
      power_kw: new Set(),
      pressure_max_bar: new Set(),
      voltage_v: new Set(),
      weight_kg: new Set(),
      connection_types: new Set(),
    };

    // Extract actual values from products (no static lists!)
    products.forEach(product => {
      if (product.pdf_source) filters.pdf_source.add(product.pdf_source);
      
      // Power - round to 1 decimal for grouping (only if > 0)
      if (typeof product.power_kw === 'number' && product.power_kw > 0) {
        filters.power_kw.add(String(Math.round(product.power_kw * 10) / 10));
      }
      if (typeof product.power_kw_derived === 'number' && product.power_kw_derived > 0) {
        filters.power_kw.add(String(Math.round(product.power_kw_derived * 10) / 10));
      }
      
      // Pressure - round to whole numbers (only if > 0)
      if (typeof product.pressure_max_bar === 'number' && product.pressure_max_bar > 0) {
        filters.pressure_max_bar.add(String(Math.round(product.pressure_max_bar)));
      }
      
      // Voltage - round to whole numbers (only if > 0)
      if (typeof product.voltage_v === 'number' && product.voltage_v > 0) {
        filters.voltage_v.add(String(Math.round(product.voltage_v)));
      }
      
      // Weight - round to 1 decimal (only if > 0)
      if (typeof product.weight_kg === 'number' && product.weight_kg > 0) {
        filters.weight_kg.add(String(Math.round(product.weight_kg * 10) / 10));
      }
      
      // Connection types
      if (Array.isArray(product.connection_types)) {
        product.connection_types.forEach(v => { if (v) filters.connection_types.add(String(v)); });
      }
      if (product.connection_type) {
        filters.connection_types.add(String(product.connection_type));
      }
    });

    // Convert sets to filter options with counts
    const filterOptions: Record<string, FilterOption[]> = {};
    
    Object.entries(filters).forEach(([type, values]) => {
      filterOptions[type] = Array.from(values).map(value => {
        // Count products for all filter types (only those with actual values > 0)
        const count = products.filter(p => {
          switch (type) {
            case 'pdf_source':
              return p.pdf_source === value;
            case 'power_kw':
              const power = p.power_kw || p.power_kw_derived;
              if (!power || power <= 0) return false;
              return String(Math.round(power * 10) / 10) === value;
            case 'pressure_max_bar':
              if (!p.pressure_max_bar || p.pressure_max_bar <= 0) return false;
              return String(Math.round(p.pressure_max_bar)) === value;
            case 'voltage_v':
              if (!p.voltage_v || p.voltage_v <= 0) return false;
              return String(Math.round(p.voltage_v)) === value;
            case 'weight_kg':
              if (!p.weight_kg || p.weight_kg <= 0) return false;
              return String(Math.round(p.weight_kg * 10) / 10) === value;
            case 'connection_types':
              return (Array.isArray(p.connection_types) && p.connection_types.includes(value)) ||
                     p.connection_type === value;
            default:
              return false;
          }
        }).length;
        
        return {
          type,
          value,
          label: value,
          count
        };
      }).sort((a, b) => {
        // Sort by count descending for PDF sources, numerically for numbers, alphabetically for strings
        if (type === 'pdf_source') return b.count - a.count;
        if (type === 'power_kw' || type === 'pressure_max_bar' || type === 'voltage_v' || type === 'weight_kg') {
          return parseFloat(a.value) - parseFloat(b.value);
        }
        return a.value.localeCompare(b.value);
      });
    });

    setAvailableFilters(filterOptions);
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

  // Search suggestions logic
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      const suggestions: Array<{type: string, value: string, product: Product}> = [];
      const seen = new Set<string>();

      products.forEach(product => {
        // Search in SKU
        if (product.sku && product.sku.toLowerCase().includes(query)) {
          const key = `sku-${product.sku}`;
          if (!seen.has(key) && suggestions.length < 10) {
            suggestions.push({ type: 'SKU', value: product.sku, product });
            seen.add(key);
          }
        }
        // Search in name
        if (product.name && product.name.toLowerCase().includes(query)) {
          const key = `name-${product.name}`;
          if (!seen.has(key) && suggestions.length < 10) {
            suggestions.push({ type: 'Name', value: product.name, product });
            seen.add(key);
          }
        }
        // Search in catalog PDF
        if (product.pdf_source && product.pdf_source.toLowerCase().includes(query)) {
          const key = `pdf-${product.pdf_source}`;
          if (!seen.has(key) && suggestions.length < 10) {
            suggestions.push({ type: 'Catalog PDF', value: product.pdf_source, product });
            seen.add(key);
          }
        }
        // Search in page number
        if (product.page_in_pdf && String(product.page_in_pdf).includes(query)) {
          const key = `page-${product.sku}-${product.page_in_pdf}`;
          if (!seen.has(key) && suggestions.length < 10) {
            suggestions.push({ type: 'PDF Page', value: `Page ${product.page_in_pdf} in ${product.pdf_source}`, product });
            seen.add(key);
          }
        }
      });

      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setSearchSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearch(value);
  };

  const handleSuggestionClick = (suggestion: {type: string, value: string, product: Product}) => {
    setSearchQuery(suggestion.value);
    onSearch(suggestion.value);
    setShowSuggestions(false);
  };

  const resetFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onFilterChange({});
    onSearch('');
  };

  const hasActiveFilters = Object.keys(activeFilters).length > 0 || searchQuery.length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Bar with Legend */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 mb-6" style={{ borderColor: '#00ADEF' }}>
        <div className="space-y-3">
          {/* Search Legend */}
          <div className="flex items-center gap-2 text-xs text-gray-600 flex-wrap">
            <Search className="h-4 w-4" style={{ color: '#00ADEF' }} />
            <span className="font-medium">Search by:</span>
            <span className="px-2 py-1 bg-gray-100 rounded">SKU</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Product Name</span>
            <span className="px-2 py-1 bg-gray-100 rounded">Catalog PDF</span>
            <span className="px-2 py-1 bg-gray-100 rounded">PDF Page</span>
          </div>

          {/* Search Input */}
          <div ref={searchRef} className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                placeholder="Start typing to search products... (min. 2 characters)"
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent text-base"
                style={{ '--tw-ring-color': '#00ADEF' } as React.CSSProperties}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Search Suggestions Dropdown */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
                {searchSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <span 
                        className="px-2 py-1 text-xs font-medium rounded text-white flex-shrink-0"
                        style={{ backgroundColor: '#00ADEF' }}
                      >
                        {suggestion.type}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {suggestion.value}
                        </div>
                        {suggestion.product.name && suggestion.type !== 'Name' && (
                          <div className="text-xs text-gray-500 truncate mt-1">
                            {suggestion.product.name}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="w-full py-2 px-4 border-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center gap-2"
              style={{ 
                borderColor: '#00ADEF',
                color: '#00ADEF',
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#00ADEF';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#00ADEF';
              }}
            >
              <X className="h-4 w-4" />
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      {/* 1. PDF source filter */}
      <FilterSection title="Catalog / PDF Document">
        {(availableFilters.pdf_source?.length > 0) ? (
          <select
            id="pdf-source-filter"
            value={activeFilters.pdf_source?.[0] || ''}
            onChange={(e) => handleFilterChange('pdf_source', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Catalogs</option>
            {availableFilters.pdf_source.map(({ value, count }) => (
              <option key={value} value={value}>
                {value.replace('.pdf', '')} ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No catalogs available</div>
        )}
      </FilterSection>

      {/* 2. Power filter */}
      <FilterSection title="Power (kW)">
        {(availableFilters.power_kw?.length > 0) ? (
          <select
            id="power-filter"
            value={activeFilters.power_kw?.[0] || ''}
            onChange={(e) => handleFilterChange('power_kw', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Power Ratings</option>
            {availableFilters.power_kw.map(({ value, count }) => (
              <option key={value} value={value}>
                {value} kW ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No power options</div>
        )}
      </FilterSection>

      {/* 3. Pressure filter */}
      <FilterSection title="Pressure (bar)">
        {(availableFilters.pressure_max_bar?.length > 0) ? (
          <select
            id="pressure-filter"
            value={activeFilters.pressure_max_bar?.[0] || ''}
            onChange={(e) => handleFilterChange('pressure_max_bar', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Pressures</option>
            {availableFilters.pressure_max_bar.map(({ value, count }) => (
              <option key={value} value={value}>
                {value} bar ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No pressure options</div>
        )}
      </FilterSection>

      {/* 4. Voltage filter */}
      <FilterSection title="Voltage (V)">
        {(availableFilters.voltage_v?.length > 0) ? (
          <select
            id="voltage-filter"
            value={activeFilters.voltage_v?.[0] || ''}
            onChange={(e) => handleFilterChange('voltage_v', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Voltages</option>
            {availableFilters.voltage_v.map(({ value, count }) => (
              <option key={value} value={value}>
                {value} V ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No voltage options</div>
        )}
      </FilterSection>

      {/* 5. Weight filter */}
      <FilterSection title="Weight (kg)">
        {(availableFilters.weight_kg?.length > 0) ? (
          <select
            id="weight-filter"
            value={activeFilters.weight_kg?.[0] || ''}
            onChange={(e) => handleFilterChange('weight_kg', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Weights</option>
            {availableFilters.weight_kg.map(({ value, count }) => (
              <option key={value} value={value}>
                {value} kg ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No weight options</div>
        )}
      </FilterSection>

      {/* 6. Connection types filter */}
      <FilterSection title="Connection Type">
        {(availableFilters.connection_types?.length > 0) ? (
          <select
            id="connection-filter"
            value={activeFilters.connection_types?.[0] || ''}
            onChange={(e) => handleFilterChange('connection_types', e.target.value)}
            className="w-full rounded-md bg-white border border-gray-300 text-gray-900 text-sm p-2 focus:ring-2 focus:border-transparent transition duration-200"
          >
            <option value="">All Connection Types</option>
            {availableFilters.connection_types.map(({ value, count }) => (
              <option key={value} value={value}>
                {value} ({count})
              </option>
            ))}
          </select>
        ) : (
          <div className="text-sm text-gray-500">No connection types</div>
        )}
      </FilterSection>
    </div>
  );
}
