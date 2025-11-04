export interface Product {
  sku: string;
  pdf_source: string;
  source_pages: number[];
  product_category: string;
  description: string;
  pressure_min_bar?: number;
  pressure_max_bar?: number;
  dimensions_mm_list?: number[];
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  power_hp?: number;
  power_kw?: number;
  voltage_v?: number;
  flow_l_min_list?: number[];
  // Additional fields we'll add
  name?: string;
  shortDescription?: string;
  price?: number;
  imageUrl?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
}

export const normalizeProduct = (product: any): Product => {
  // Return a minimal valid product if input is invalid
  if (!product || typeof product !== 'object') {
    return {
      sku: 'unknown',
      pdf_source: '',
      source_pages: [],
      product_category: 'unknown',
      description: 'Invalid product data',
      name: 'Unknown Product',
      shortDescription: 'No description available',
      price: 0,
      imageUrl: getImageUrl(undefined),
      inStock: false,
      rating: 0,
      reviewCount: 0
    };
  }
  
  try {
    // Handle missing or invalid description
    const description = product.description || 'No description available';
    
    // Extract the first line of description as the product name
    const firstLine = description.split('\n')[0] || 'Unnamed Product';
    const name = firstLine.length > 50 
      ? `${firstLine.substring(0, 47)}...` 
      : firstLine;

    // Generate a short description (first 150 chars of description)
    const shortDescription = description.length > 150
      ? `${description.substring(0, 147)}...`
      : description;

    // Generate a placeholder price based on SKU and category
    const sku = product.sku || 'unknown';
    const category = product.product_category || 'unknown';
    const price = generatePrice(sku, category);

    return {
      sku,
      pdf_source: product.pdf_source || '',
      source_pages: Array.isArray(product.source_pages) ? product.source_pages : [],
      product_category: category,
      description: description,
      ...(product.pressure_min_bar !== undefined && { pressure_min_bar: Number(product.pressure_min_bar) }),
      ...(product.pressure_max_bar !== undefined && { pressure_max_bar: Number(product.pressure_max_bar) }),
      ...(product.dimensions_mm_list && { dimensions_mm_list: product.dimensions_mm_list }),
      ...(product.length_mm !== undefined && { length_mm: Number(product.length_mm) }),
      ...(product.width_mm !== undefined && { width_mm: Number(product.width_mm) }),
      ...(product.height_mm !== undefined && { height_mm: Number(product.height_mm) }),
      ...(product.power_hp !== undefined && { power_hp: Number(product.power_hp) }),
      ...(product.power_kw !== undefined && { power_kw: Number(product.power_kw) }),
      ...(product.voltage_v !== undefined && { voltage_v: Number(product.voltage_v) }),
      ...(product.flow_l_min_list && { flow_l_min_list: product.flow_l_min_list }),
      name,
      shortDescription,
      price,
      imageUrl: getImageUrl(product),
      inStock: true, // Default to true, could be calculated based on inventory
      rating: Math.floor(Math.random() * 3) + 3, // Random rating between 3-5
      reviewCount: Math.floor(Math.random() * 50) // Random review count up to 50
    };
  } catch (error) {
    console.error('Error normalizing product:', error, product);
    // Return a minimal valid product in case of any error
    return {
      sku: product?.sku || 'error',
      pdf_source: product?.pdf_source || '',
      source_pages: Array.isArray(product?.source_pages) ? product.source_pages : [],
      product_category: product?.product_category || 'error',
      description: 'Error loading product data',
      name: product?.name || 'Error Loading Product',
      shortDescription: 'There was an error loading this product',
      price: 0,
      imageUrl: getImageUrl(undefined),
      inStock: false,
      rating: 0,
      reviewCount: 0
    };
  }
};

const generatePrice = (sku: string, category: string): number => {
  // Simple hash function to generate consistent prices based on SKU
  const hash = sku.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // Base price based on category
  let basePrice = 0;
  if (category.includes('COMPRESSOR')) {
    basePrice = 500 + (hash % 5000);
  } else if (category.includes('BUIZEN')) {
    basePrice = 5 + (hash % 200);
  } else if (category.includes('TOOLS')) {
    basePrice = 20 + (hash % 1000);
  } else {
    basePrice = 10 + (hash % 200);
  }
  
  // Round to nearest 0.99
  return Math.round((basePrice - 0.01) * 100) / 100;
};

const getImageUrl = (product?: Product | null): string => {
  // Default SVG placeholder
  const defaultPlaceholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDAwIDMwMCI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZmlGw9IiNmM2Y0ZjYiLz4KICA8dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM5Y2EzYWYiPk5vIEltYWdlIEF2YWlsYWJsZTwvdGV4dD4KPC9zdmc+';
  
  // If product is not provided, return default placeholder
  if (!product) {
    return defaultPlaceholder;
  }
  
  // If the product has an image URL, use it
  if ('image' in product && product.image) {
    return product.image;
  }
  
  try {
    // Generate a simple SVG placeholder with the product name
    const productName = product.name || product.sku || 'Product';
    const encodedName = encodeURIComponent(productName.substring(0, 30));
    const svg = `
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#9ca3af" dy=".3em">${encodedName}</text>
      </svg>
    `.trim().replace(/\s+/g, ' ');
    
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  } catch (error) {
    console.error('Error generating image URL:', error);
    return defaultPlaceholder;
  }
};

export const filterProducts = (
  products: Product[], 
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minPressure?: number;
    maxPressure?: number;
    searchTerm?: string;
  }
): Product[] => {
  return products.filter(product => {
    // Category filter
    if (filters.category && product.product_category !== filters.category) {
      return false;
    }
    
    // Price range filter
    if (filters.minPrice && (product.price || 0) < filters.minPrice) {
      return false;
    }
    if (filters.maxPrice && (product.price || 0) > filters.maxPrice) {
      return false;
    }
    
    // Pressure range filter
    if (filters.minPressure && (product.pressure_max_bar || 0) < filters.minPressure) {
      return false;
    }
    if (filters.maxPressure && (product.pressure_min_bar || 0) > filters.maxPressure) {
      return false;
    }
    
    // Search term filter (searches in name, description, and SKU)
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      return (
        product.name?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
};

export const getUniqueCategories = (products: Product[]): string[] => {
  const categories = new Set<string>();
  products.forEach(product => {
    if (product.product_category) {
      categories.add(product.product_category);
    }
  });
  return Array.from(categories).sort();
};
