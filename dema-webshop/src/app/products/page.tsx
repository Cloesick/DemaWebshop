'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Product, ProductFilters } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, X } from 'lucide-react';

// Default filters
const DEFAULT_FILTERS: ProductFilters = {
  category: undefined,
  searchTerm: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  minPower: undefined,
  maxPower: undefined,
  minPressure: undefined,
  maxPressure: undefined,
  limit: 24,
  skip: 0,
  sortBy: 'name',
  sortOrder: 'asc',
} as const;

const ProductsPage = () => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // State for products and loading
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  
  // Initialize filters state
  const [filters, setFilters] = useState<ProductFilters>(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    return {
      ...DEFAULT_FILTERS,
      category: params.get('category') || undefined,
      searchTerm: params.get('searchTerm') || undefined,
      minPrice: params.get('minPrice') ? Number(params.get('minPrice')) : undefined,
      maxPrice: params.get('maxPrice') ? Number(params.get('maxPrice')) : undefined,
      minPower: params.get('minPower') ? Number(params.get('minPower')) : undefined,
      maxPower: params.get('maxPower') ? Number(params.get('maxPower')) : undefined,
      minPressure: params.get('minPressure') ? Number(params.get('minPressure')) : undefined,
      maxPressure: params.get('maxPressure') ? Number(params.get('maxPressure')) : undefined,
      limit: params.get('limit') ? Number(params.get('limit')) : DEFAULT_FILTERS.limit,
      skip: params.get('skip') ? Number(params.get('skip')) : DEFAULT_FILTERS.skip,
      sortBy: (params.get('sortBy') as keyof Product) || DEFAULT_FILTERS.sortBy,
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };
  });
      sortOrder: (params.get('sortOrder') as 'asc' | 'desc') || DEFAULT_FILTERS.sortOrder,
    };
  });
  
  // Update URL when filters change
  const updateURL = useCallback((newFilters: Partial<ProductFilters>) => {
    const params = new URLSearchParams();
    
    // Set all filter values
    Object.entries({ ...DEFAULT_FILTERS, ...filters, ...newFilters }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    
    // Remove default values to keep URL clean
    Object.entries(DEFAULT_FILTERS).forEach(([key, defaultValue]) => {
      if (params.get(key) === String(defaultValue)) {
        params.delete(key);
      }
    });
    
    // Update URL without causing a full page reload
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, pathname, router]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters(prev => {
      const updatedFilters = {
        ...prev,
        ...newFilters,
        skip: 0, // Reset to first page when filters change
      };
      updateURL(updatedFilters);
      return updatedFilters;
    });
  }, [updateURL]);
  
  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    handleFilterChange({ searchTerm: searchTerm || undefined });
  }, [handleFilterChange]);
  
  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    if (sortBy && (sortOrder === 'asc' || sortOrder === 'desc')) {
      handleFilterChange({
        sortBy: sortBy as keyof Product,
        sortOrder: sortOrder as 'asc' | 'desc',
        skip: 0, // Reset to first page when sorting changes
      });
    }
  }, [handleFilterChange]);
  
  // Handle load more
  const handleLoadMore = useCallback(() => {
    const newSkip = (filters.skip || 0) + (filters.limit || 24);
    handleFilterChange({ skip: newSkip });
  }, [filters.skip, filters.limit, handleFilterChange]);
  
  // Update filters when URL changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const newFilters: Partial<ProductFilters> = {};
    
    // Only update filters that have changed
    (Object.keys(filters) as Array<keyof ProductFilters>).forEach(key => {
      const paramValue = params.get(key);
      
      if (paramValue === null) {
        if (filters[key] !== undefined) {
          newFilters[key] = undefined;
        }
      } else {
        const currentValue = filters[key];
        let parsedValue: any = paramValue;
        
        // Parse numbers
        if ([
          'minPrice', 'maxPrice', 'minPower', 'maxPower', 
          'minPressure', 'maxPressure', 'limit', 'skip'
        ].includes(key)) {
          parsedValue = paramValue ? Number(paramValue) : undefined;
        }
        
        // Only update if value has changed
        if (currentValue !== parsedValue) {
          newFilters[key] = parsedValue;
        }
      }
    });
    
    if (Object.keys(newFilters).length > 0) {
      setFilters(prev => ({
        ...prev,
        ...newFilters,
      }));
    }
  }, [searchParams, filters]);
  
  // Fetch products with current filters
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Convert filters to URLSearchParams
      const params = new URLSearchParams();
      
      // Only include defined, non-null, and non-empty string values
      (Object.entries(filters) as [keyof ProductFilters, any][]).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, String(value));
        }
      });
      
      // Add cache-busting parameter to prevent stale data
      params.set('_t', Date.now().toString());
      
      console.log('Fetching products with params:', Object.fromEntries(params.entries()));
      
      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received products data:', { 
        count: data.products?.length || 0, 
        total: data.total,
        hasMore: data.hasMore,
        filters: data.filters
      });
      
      // If we're loading more, append to existing products
      if (filters.skip && filters.skip > 0) {
        setProducts(prev => {
          const newProducts = [...prev, ...(data.products || [])];
          console.log(`Appended ${data.products?.length || 0} products, total: ${newProducts.length}`);
          return newProducts;
        });
      } else {
        console.log(`Loaded ${data.products?.length || 0} products`);
        setProducts(data.products || []);
      }
      
      setTotalProducts(data.total || 0);
      setHasMore(data.hasMore || false);
      
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err instanceof Error ? err.message : 'Failed to load products');
      setProducts([]);
      setTotalProducts(0);
      setHasMore(false);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);
  
  // Update URL when filters change
  const updateURL = useCallback((newFilters: Partial<ProductFilters>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove params based on new filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    
    // Reset pagination when filters change
    if (newFilters.category || newFilters.searchTerm || newFilters.minPrice || 
        newFilters.maxPrice || newFilters.minPower || newFilters.maxPower || 
        newFilters.minPressure || newFilters.maxPressure) {
      params.delete('skip');
    }
    
    // Update URL without causing a full page reload
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  }, [pathname, router, searchParams]);
  
  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: Partial<ProductFilters>) => {
    setFilters((prev: ProductFilters) => ({
      ...prev,
      ...newFilters,
      skip: 0 // Reset to first page when filters change
    }));
    
    updateURL(newFilters);
  }, [updateURL]);
  
  // Handle search
  const handleSearch = useCallback((searchTerm: string) => {
    handleFilterChange({ searchTerm });
  }, [handleFilterChange]);
  
  // Handle sort change
  const handleSortChange = useCallback((value: string) => {
    const [sortBy, sortOrder] = value.split('_');
    if (sortBy && (sortOrder === 'asc' || sortOrder === 'desc')) {
      handleFilterChange({ 
        sortBy, 
        sortOrder,
        skip: 0 // Reset to first page when sorting changes
      });
    }
  }, [handleFilterChange]);
  
  // Handle pagination
  const handleLoadMore = useCallback(() => {
    if (isLoading || !hasMore) return;
    
    const newSkip = (filters.skip || 0) + (filters.limit || 24);
    updateURL({ skip: newSkip });
  }, [filters.skip, filters.limit, hasMore, isLoading, updateURL]);
  
  // Initial data fetch and when filters change
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Our Products</h1>
      
      {/* Search and filter bar */}
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                className="w-full pl-9"
                value={filters.searchTerm || ''}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
        
        <Select 
          value={`${filters.sortBy}_${filters.sortOrder}`}
          onValueChange={handleSortChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
            <SelectItem value="price_asc">Price (Low to High)</SelectItem>
            <SelectItem value="price_desc">Price (High to Low)</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={() => updateURL({})}
        >
          <X className="h-4 w-4 mr-2" />
          Clear filters
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="md:col-span-1">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-medium mb-4">Filters</h3>
            {/* Category filter */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Category</label>
              <Select 
                value={filters.category || 'all'}
                onValueChange={(value) => handleFilterChange({ category: value === 'all' ? undefined : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {Array.from(new Set(products.map(p => p.product_category)))
                    .filter(Boolean)
                    .map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            {/* Price range */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Price Range</label>
              <div className="grid gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice || ''}
                  onChange={(e) => handleFilterChange({ 
                    minPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
              <div className="grid gap-1">
                <Input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice || ''}
                  onChange={(e) => handleFilterChange({ 
                    maxPrice: e.target.value ? Number(e.target.value) : undefined 
                  })}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Product list */}
        <div className="md:col-span-3">
          {isLoading && products.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-48 w-full rounded-lg" />
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-4 w-1/2 rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button 
                onClick={fetchProducts}
              >
                Retry
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No products found. Try adjusting your filters.</p>
              <Button 
                variant="outline"
                onClick={() => updateURL({})}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-500">
                Showing {products.length} of {totalProducts} products
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div 
                    key={product.sku} 
                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/products/${product.sku}`)}
                  >
                    <div className="aspect-square bg-gray-100 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img 
                          src={product.imageUrl} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400">No image</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium">{product.name}</h3>
                      <p className="text-sm text-gray-500">{product.product_category}</p>
                      {product.price !== undefined && (
                        <p className="mt-2 font-semibold">
                          ${product.price.toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {hasMore && (
                <div className="mt-8 text-center">
                  <Button 
                    onClick={handleLoadMore}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
