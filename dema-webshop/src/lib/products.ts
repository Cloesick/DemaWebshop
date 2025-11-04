import { Product, ProductFilters } from '@/types/product';
import fs from 'fs/promises';
import path from 'path';

// Cache for products data
let productsCache: Product[] | null = null;

// Load products from the JSON file (server-side) and cache in memory
export async function getProducts(_filters?: ProductFilters): Promise<Product[]> {
  if (!productsCache) {
    try {
      const filePath = path.resolve(process.cwd(), 'public', 'data', 'Product_pdfs_analysis_v2.json');
      const file = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(file);

      const productsArray = Array.isArray(data) ? data : (data.products || []);
      if (!Array.isArray(productsArray)) {
        console.error('Expected an array of products but got:', typeof data);
        productsCache = [];
      } else {
        productsCache = productsArray.map((item: any, index: number): Product => ({
          sku: item.sku || item.product_id || `product-${index}`,
          name: item.name || 'Unnamed Product',
          description: item.description || '',
          product_category: item.product_category || 'Uncategorized',
          pdf_source: item.pdf_source || '',
          source_pages: Array.isArray(item.source_pages) ? item.source_pages : [],

          // Optional/technical fields
          price: typeof item.price === 'number' ? item.price : undefined,
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
          inStock: item.inStock !== false,
          rating: typeof item.rating === 'number' ? item.rating : undefined,
          reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : undefined,
          pressure_max_bar: typeof item.pressure_max_bar === 'number' ? item.pressure_max_bar : undefined,
          pressure_min_bar: typeof item.pressure_min_bar === 'number' ? item.pressure_min_bar : undefined,
          power_kw: typeof item.power_kw === 'number' ? item.power_kw : undefined,
          power_hp: typeof item.power_hp === 'number' ? item.power_hp : undefined,
          voltage_v: typeof item.voltage_v === 'number' ? item.voltage_v : undefined,
          flow_l_min: typeof item.flow_l_min === 'number' ? item.flow_l_min : undefined,
          flow_l_min_list: Array.isArray(item.flow_l_min_list) ? item.flow_l_min_list : undefined,
          dimensions_mm_list: Array.isArray(item.dimensions_mm_list) ? item.dimensions_mm_list : undefined,
          length_mm: typeof item.length_mm === 'number' ? item.length_mm : undefined,
          width_mm: typeof item.width_mm === 'number' ? item.width_mm : undefined,
          height_mm: typeof item.height_mm === 'number' ? item.height_mm : undefined,
          weight_kg: typeof item.weight_kg === 'number' ? item.weight_kg : undefined,

          // Preserve any extra fields
          ...item,
        }));
      }
    } catch (error) {
      console.error('Error loading product data from file:', error);
      productsCache = [];
    }
  }

  // Note: Filtering is applied in the API route; return all products here.
  return productsCache;
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
