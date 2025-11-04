import { Product, ProductFilters } from '@/types/product';

// Cache for products data
let productsCache: Product[] | null = null;

// Load products from the JSON file
export async function getProducts(filters?: ProductFilters): Promise<Product[]> {
  // Load data if not in cache
  if (!productsCache) {
    try {
      // In development, fetch from public folder
      // In production, this should be an API route
      const isDev = process.env.NODE_ENV === 'development';
      const url = isDev 
        ? '/data/Product_pdfs_analysis_v2.json' 
        : '/api/products/data';
      
      console.log(`Fetching products from: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error loading products:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Handle both direct array response and { products } response
      const productsArray = Array.isArray(data) ? data : (data.products || []);
      
      if (!Array.isArray(productsArray)) {
        console.error('Expected an array of products but got:', typeof data);
        return [];
      }
      
      console.log(`Successfully loaded ${productsArray.length} products`);
      
      // Transform and cache the data
      productsCache = productsArray.map((item: any, index: number) => ({
        // Required fields with defaults
        id: item.id || `product-${index}`,
        sku: item.sku || item.product_id || `product-${index}`,
        name: item.name || 'Unnamed Product',
        description: item.description || '',
        product_category: item.product_category || 'Uncategorized',
        
        // Optional fields with defaults
        price: typeof item.price === 'number' ? item.price : 0,
        imageUrl: item.imageUrl || '',
        inStock: item.inStock !== false,
        rating: typeof item.rating === 'number' ? item.rating : 0,
        reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : 0,
        
        // Technical specifications with defaults
        product_category: item.product_category || '',
        pdf_source: item.pdf_source || '',
        source_pages: Array.isArray(item.source_pages) ? item.source_pages : [],
        price: typeof item.price === 'number' ? item.price : 0,
        power_kw: typeof item.power_kw === 'number' ? item.power_kw : 0,
        power_hp: typeof item.power_hp === 'number' ? item.power_hp : 0,
        voltage_v: typeof item.voltage_v === 'number' ? item.voltage_v : 0,
        flow_l_min: typeof item.flow_l_min === 'number' ? item.flow_l_min : 0,
        pressure_max_bar: typeof item.pressure_max_bar === 'number' ? item.pressure_max_bar : 0,
        pressure_min_bar: typeof item.pressure_min_bar === 'number' ? item.pressure_min_bar : 0,
        dimensions_mm: item.dimensions_mm || {},
        weight_kg: typeof item.weight_kg === 'number' ? item.weight_kg : 0,
        in_stock: item.in_stock !== false,
        rating: typeof item.rating === 'number' ? item.rating : 0,
        review_count: typeof item.review_count === 'number' ? item.review_count : 0,
        // Add any additional fields that might be in your data
        ...item
      }));
    } catch (error: unknown) {
      console.error('Error loading product data:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      } else {
        console.error('Unknown error occurred:', error);
      }
      return [];
    }
  }

  let products: Product[] = productsData.map((item: any, index: number) => ({
    // Use product_id if available, otherwise generate a unique ID based on index
    sku: item.product_id || `product-${index}`,
    pdf_source: item.pdf_source || '',
    source_pages: item.source_pages || [],
    product_category: item.product_category || 'Uncategorized',
    description: item.description || '',
    pressure_max_bar: item.pressure_max_bar,
    dimensions_mm_list: item.dimensions_mm_list || [],
    length_mm: item.length_m,
    // Map any additional fields that might be in your Product type
    ...(item.weight_kg && { weight_kg: item.weight_kg }),
  }));

  // Apply filters if provided
  if (filters) {
    if (filters.category) {
      products = products.filter(
        (product) => product.product_category?.toLowerCase() === filters.category?.toLowerCase()
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      products = products.filter(
        (product) =>
          product.sku.toLowerCase().includes(query) ||
          product.description.toLowerCase().includes(query) ||
          product.product_category?.toLowerCase().includes(query)
      );
    }

    // Add more filters as needed
  }

  return products;
}

export async function getProductBySku(sku: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((product) => product.sku === sku);
}

export async function getUniqueProductCategories(): Promise<string[]> {
  const products = await getProducts();
  const categories = new Set<string>();
  
  products.forEach((product) => {
    if (product.product_category) {
      categories.add(product.product_category);
    }
  });

  return Array.from(categories).sort();
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
  const products = await getProducts();
  return products.filter(p => p.product_category === category);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const products = await getProducts();
  const q = query.toLowerCase();
  return products.filter(p => 
    p.product_category?.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q) ||
    p.sku.toLowerCase().includes(q)
  );
}

export async function getProductCategories(): Promise<string[]> {
  const products = await getProducts();
  const categories = new Set<string>();
  
  products.forEach((product) => {
    if (product.product_category) {
      categories.add(product.product_category);
    }
  });

  return Array.from(categories).sort();
}
