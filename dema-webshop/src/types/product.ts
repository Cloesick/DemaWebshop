export interface Product {
  // Core product identification
  sku: string;
  name: string;
  description: string;
  product_category: string;
  
  // PDF and documentation
  pdf_source: string;
  source_pages: number[];
  
  // Technical specifications
  pressure_max_bar?: number;
  pressure_min_bar?: number;
  power_kw?: number;
  power_hp?: number;
  voltage_v?: number;
  flow_l_min?: number;
  flow_l_min_list?: number[];
  
  // Dimensions and weight
  dimensions_mm_list?: number[];
  length_mm?: number;
  width_mm?: number;
  height_mm?: number;
  weight_kg?: number;
  
  // Product details
  price?: number;
  imageUrl?: string;
  inStock?: boolean;
  rating?: number;
  reviewCount?: number;
  
  // Additional metadata
  [key: string]: any;
}

export interface ProductFilters {
  // Category and search
  category?: string;
  searchTerm?: string;
  
  // Price range
  minPrice?: number;
  maxPrice?: number;
  
  // Technical filters
  minPower?: number;
  maxPower?: number;
  minPressure?: number;
  maxPressure?: number;
  
  // Pagination
  limit?: number;
  skip?: number;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProductApiResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
  filters: ProductFilters;
}
