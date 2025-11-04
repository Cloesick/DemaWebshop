import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/products';
import type { Product, ProductFilters, ProductApiResponse } from '@/types/product';

// Helper function to parse query parameters with type safety
function parseQueryParams(params: URLSearchParams): ProductFilters {
  const getParam = <T>(key: string, type: 'string' | 'number' | 'boolean' = 'string', defaultValue?: T): T | undefined => {
    const value = params.get(key);
    if (value === null) return defaultValue;
    
    try {
      switch (type) {
        case 'number': {
          const num = parseFloat(value);
          return (isNaN(num) ? defaultValue : num) as T;
        }
        case 'boolean':
          return (value === 'true') as T;
        default:
          return value as T;
      }
    } catch (error) {
      console.warn(`Failed to parse ${key} as ${type}:`, value);
      return defaultValue;
    }
  };

  return {
    // Category and search
    category: getParam('category'),
    searchTerm: getParam('searchTerm') || getParam('q'),
    
    // Price range
    minPrice: getParam('minPrice', 'number'),
    maxPrice: getParam('maxPrice', 'number'),
    
    // Technical filters
    minPower: getParam('minPower', 'number'),
    maxPower: getParam('maxPower', 'number'),
    minPressure: getParam('minPressure', 'number'),
    maxPressure: getParam('maxPressure', 'number'),
    
    // Pagination
    limit: Math.min(100, Math.max(1, getParam('limit', 'number') || 24)),
    skip: Math.max(0, getParam('skip', 'number') || 0),
    
    // Sorting
    sortBy: getParam('sortBy') || 'name',
    sortOrder: (getParam('sortOrder') as 'asc' | 'desc') || 'asc',
  };
}

// Helper function to check if a string contains a search term (case-insensitive)
function matchesSearch(text: string | undefined, searchTerm: string): boolean {
  if (!text) return false;
  return text.toLowerCase().includes(searchTerm.toLowerCase());
}

// Helper function to filter products based on the provided filters
function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  if (!products || !Array.isArray(products)) {
    console.warn('No products array provided to filterProducts');
    return [];
  }

  return products.filter(product => {
    // Filter by category (exact match)
    if (filters.category && product.product_category !== filters.category) {
      return false;
    }
    
    // Filter by price range
    const productPrice = product.price || 0;
    if (filters.minPrice !== undefined && productPrice < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice !== undefined && productPrice > filters.maxPrice) {
      return false;
    }
    
    // Filter by power range (kW)
    const productPower = product.power_kw || 0;
    if (filters.minPower !== undefined && productPower < filters.minPower) {
      return false;
    }
    if (filters.maxPower !== undefined && productPower > filters.maxPower) {
      return false;
    }
    
    // Filter by pressure range (bar)
    const maxPressure = product.pressure_max_bar || 0;
    const minPressure = product.pressure_min_bar || 0;
    
    if (filters.minPressure !== undefined && maxPressure < filters.minPressure) {
      return false;
    }
    if (filters.maxPressure !== undefined && minPressure > filters.maxPressure) {
      return false;
    }
    
    // Search in multiple fields (case-insensitive)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      
      // Check multiple fields for search matches
      const searchFields = [
        product.name,
        product.description,
        product.sku,
        product.product_category,
        // Add any other fields you want to search in
      ];
      
      // Check if any field contains the search term
      const hasMatch = searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
      
      if (!hasMatch) {
        return false;
      }
    }
    
    return true;
  });
}

// Helper function to sort products
function sortProducts(products: Product[], sortBy: string, sortOrder: 'asc' | 'desc'): Product[] {
  return [...products].sort((a, b) => {
    let valueA = a[sortBy as keyof Product];
    let valueB = b[sortBy as keyof Product];
    
    // Handle undefined/null values
    if (valueA === undefined || valueA === null) valueA = '';
    if (valueB === undefined || valueB === null) valueB = '';
    
    // Convert to string for comparison if needed
    const strA = String(valueA).toLowerCase();
    const strB = String(valueB).toLowerCase();
    
    // Compare based on sort order
    return sortOrder === 'asc' 
      ? strA.localeCompare(strB) 
      : strB.localeCompare(strA);
  });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filters = parseQueryParams(searchParams);
    
    console.log('Fetching products with filters:', JSON.stringify(filters, null, 2));
    
    // Load products from the data source
    const allProducts = await getProducts();
    
    // Apply filters
    const filteredProducts = filterProducts(allProducts, filters);
    
    // Apply sorting
    const sortedProducts = sortProducts(
      filteredProducts,
      filters.sortBy || 'name',
      filters.sortOrder || 'asc'
    );
    
    // Apply pagination
    const page = Math.floor((filters.skip || 0) / (filters.limit || 24)) + 1;
    const limit = filters.limit || 24;
    const skip = (page - 1) * limit;
    const total = sortedProducts.length;
    const totalPages = Math.ceil(total / limit);
    
    const paginatedProducts = sortedProducts.slice(skip, skip + limit);
    
    // Prepare the response
    const response: ProductApiResponse = {
      products: paginatedProducts,
      total,
      page,
      limit,
      totalPages,
      hasMore: skip + limit < total,
      filters
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error in /api/products:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.message : 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && { 
          stack: error instanceof Error ? error.stack : undefined 
        })
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const product = await request.json();
    // In a real app, you would save the product to a database here
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create product', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
