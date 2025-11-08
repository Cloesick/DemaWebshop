export interface Product {
  // Core product identification
  sku: string;
  name: string;
  description: string;
  product_category: string;
  
  // PDF and documentation
  pdf_source: string;
  source_pages: number[];
  absk_codes?: string[];
  product_type?: string;
  matched_skus?: string[];
  
  // Technical specifications
  pressure_max_bar?: number;
  pressure_min_bar?: number;
  power_kw?: number;
  power_hp?: number;
  voltage_v?: number;
  spanning_v?: number;
  flow_l_min?: number;
  flow_l_min_list?: number[];
  debiet_m3_h?: number;
  rpm?: number;
  size_inch?: number | string;
  connection_types?: string[];
  aansluiting?: string | string[];
  length_m?: number;
  materials?: string[];
  volume_l?: number;
  vlotter?: boolean;
  
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
  category?: string; // alias of product_category
  product_category?: string;
  product_type?: string;
  pdf_source?: string;
  pdf?: string; // alias for pdf_source
  searchTerm?: string;
  sku?: string;
  
  // Price range
  minPrice?: number;
  maxPrice?: number;
  
  // Technical filters
  power_kw?: number;
  minPower?: number;
  maxPower?: number;
  voltage_v?: number;
  spanning_v?: number; // alias of voltage_v
  minPressure?: number;
  maxPressure?: number;
  pressure_max_bar?: number;
  pressure_min_bar?: number;
  flow_l_min_list?: number; // match if included in list
  debiet_m3_h?: number;
  rpm?: number;
  size_inch?: number | string;
  connection_types?: string;
  aansluiting?: string; // alias for connection_types
  length_m?: number;
  materials?: string;
  weight_kg?: number;
  volume_l?: number;
  vlotter?: boolean;
  
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
