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
  spanning_v?: number;
  connection_types?: string[];
  noise_level_db?: number;
  airflow_l_min?: number;
  tank_capacity_l?: number;
  // Extra fields potentially present in dataset
  product_type?: string;
  flow_l_min_list?: number[];
  rpm?: number;
  size_inch?: number | string;
  length_m?: number;
  materials?: string[];
  volume_l?: number;
  vlotter?: boolean;
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
      weight: new Set(),
      product_type: new Set(),
      pdf_source: new Set(),
      pressure_max_bar: new Set(),
      power_kw: new Set(),
      voltage_v: new Set(),
      flow_l_min_list: new Set(),
      rpm: new Set(),
      size_inch: new Set(),
      connection_types: new Set(),
      length_m: new Set(),
      materials: new Set(),
      weight_kg: new Set(),
      volume_l: new Set(),
      vlotter: new Set(),
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

      if (product.product_type) filters.product_type.add(product.product_type);
      if (product.pdf_source) filters.pdf_source.add(product.pdf_source);
      if (typeof product.pressure_max_bar === 'number') filters.pressure_max_bar.add(String(product.pressure_max_bar));
      if (typeof product.power_kw === 'number') filters.power_kw.add(String(product.power_kw));
      if (typeof product.voltage_v === 'number') filters.voltage_v.add(String(product.voltage_v));
      product.flow_l_min_list?.forEach(v => { if (typeof v === 'number') filters.flow_l_min_list.add(String(v)); });
      if (typeof product.rpm === 'number') filters.rpm.add(String(product.rpm));
      if (product.size_inch !== undefined && product.size_inch !== null) filters.size_inch.add(String(product.size_inch));
      product.connection_types?.forEach(v => { if (v) filters.connection_types.add(String(v)); });
      if (typeof product.length_m === 'number') filters.length_m.add(String(product.length_m));
      product.materials?.forEach(m => { if (m) filters.materials.add(String(m)); });
      if (typeof product.weight_kg === 'number') filters.weight_kg.add(String(product.weight_kg));
      if (typeof product.volume_l === 'number') filters.volume_l.add(String(product.volume_l));
      if (typeof product.vlotter === 'boolean') filters.vlotter.add(String(product.vlotter));
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
            // New fields counts
            case 'product_type':
              return (p as any).product_type === value;
            case 'pdf_source':
              return (p as any).pdf_source === value;
            case 'pressure_max_bar':
              return (p as any).pressure_max_bar === Number(value);
            case 'power_kw':
              return (p as any).power_kw === Number(value);
            case 'voltage_v':
              return (p as any).voltage_v === Number(value);
            case 'flow_l_min_list':
              return Array.isArray((p as any).flow_l_min_list) && (p as any).flow_l_min_list.includes(Number(value));
            case 'rpm':
              return (p as any).rpm === Number(value);
            case 'size_inch':
              return String((p as any).size_inch).toLowerCase() === String(value).toLowerCase();
            case 'connection_types':
              return Array.isArray((p as any).connection_types) && (p as any).connection_types.map(String).includes(String(value));
            case 'length_m':
              return (p as any).length_m === Number(value);
            case 'materials':
              return Array.isArray((p as any).materials) && (p as any).materials.map((m: any) => String(m).toLowerCase()).includes(String(value).toLowerCase());
            case 'weight_kg':
              return (p as any).weight_kg === Number(value);
            case 'volume_l':
              return (p as any).volume_l === Number(value);
            case 'vlotter':
              return Boolean((p as any).vlotter) === (value === 'true');
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

  // Helper: localized title or fallback to title-case
  const titleFor = (key: string) => {
    const localized = t(`filters.${key}` as any);
    if (localized !== `filters.${key}`) return localized;
    return key.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());
  };

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

        {/* PDF source filter (uses availableFilters) */}
        {availableFilters.pdf_source && availableFilters.pdf_source.length > 0 && (
          <FilterSection title={t('filters.documents')}>
            <select
              id="pdf-source-filter"
              value={activeFilters.pdf_source?.[0] || ''}
              onChange={(e) => handleFilterChange('pdf_source', e.target.value)}
              className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
            >
              <option value="">{t('filters.all_documents')}</option>
              {availableFilters.pdf_source.map(({ value, count }) => (
                <option key={value} value={value} className="bg-gray-800">
                  {(value.split('/').pop() || 'PDF Document')} ({count})
                </option>
              ))}
            </select>
          </FilterSection>
        )}

        {/* Generic added filters */}
        {['product_type','pressure_max_bar','power_kw','voltage_v','flow_l_min_list','rpm','size_inch','connection_types','length_m','materials','weight_kg','volume_l','vlotter']
          .filter((key) => availableFilters[key as keyof typeof availableFilters]?.length)
          .map((key) => (
            <FilterSection key={key} title={titleFor(key)}>
              <select
                id={`${key}-filter`}
                value={activeFilters[key]?.[0] || ''}
                onChange={(e) => handleFilterChange(key, e.target.value)}
                className="w-full rounded-md bg-gray-800 border border-gray-700 text-gray-100 text-sm p-2 focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition duration-200"
              >
                <option value="">{t('filters.all_generic')}</option>
                {availableFilters[key]?.map(({ value, count }) => (
                  <option key={value} value={value} className="bg-gray-800">
                    {String(value)} ({count})
                  </option>
                ))}
              </select>
            </FilterSection>
          ))}
      </div>
    </div>
  );
};

export { FilterSection };