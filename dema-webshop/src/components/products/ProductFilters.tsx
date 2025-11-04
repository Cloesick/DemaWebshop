'use client';

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLocale } from '@/contexts/LocaleContext';
import { X, ChevronDown, ChevronUp, Filter } from 'lucide-react';

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
  const { t } = useLocale();
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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // (search UI removed)

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
      {/* Active filters */}
      {Object.keys(activeFilters).some(key => activeFilters[key].length > 0) && (
        <div className="space-y-2 bg-gray-800 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-yellow-500" />
              <h3 className="text-sm font-medium text-gray-200">{t('filters.active')}</h3>
            </div>
            <button
              onClick={clearAllFilters}
              className="text-xs text-yellow-400 hover:text-yellow-300 hover:underline"
            >
              {t('filters.clear_all')}
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
        <FilterSection title={t('filters.categories')}>
          <select
            id="category-filter"
            value={activeFilters.category?.[0] || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
          >
            <option value="">{t('filters.all_categories')}</option>
            {availableFilters.category?.map(({ value, label, count }) => (
              <option key={value} value={value} className="bg-gray-800">
                {label} ({count})
              </option>
            ))}
          </select>
        </FilterSection>

        {/* Size filter */}
        {sortedSizes.length > 0 && (
          <FilterSection title={t('filters.sizes')}>
            <select
              id="size-filter"
              value={activeFilters.size?.[0] || ''}
              onChange={(e) => handleFilterChange('size', e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
            >
              <option value="">{t('filters.all_sizes')}</option>
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
          <FilterSection title={t('filters.documents')}>
            <select
              id="pdf-filter"
              value={activeFilters.pdf?.[0] || ''}
              onChange={(e) => handleFilterChange('pdf', e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
            >
              <option value="">{t('filters.all_documents')}</option>
              {pdfOptions.map(({ value, label, count }) => (
                <option key={value} value={value} className="bg-gray-800">
                  {(label || t('filters.pdf_document'))} ({count})
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