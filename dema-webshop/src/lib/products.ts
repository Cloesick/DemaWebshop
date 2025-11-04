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
        const firstSentence = (text?: string, maxLen = 200) => {
          if (!text) return '';
          const s = String(text).split(/\.|\n|\r/)[0].trim();
          return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
        };

        const toNum = (v: any): number | undefined => {
          const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v;
          return typeof n === 'number' && !Number.isNaN(n) ? n : undefined;
        };

        const toNumArray = (arr: any): number[] | undefined => {
          if (!Array.isArray(arr)) return undefined;
          const out = arr.map(toNum).filter((n): n is number => typeof n === 'number');
          return out.length ? out : undefined;
        };

        productsCache = productsArray.map((item: any, index: number): Product => ({
          sku: item.sku || item.product_id || `product-${index}`,
          name: item.name || (item.description ? firstSentence(item.description, 60) : 'Unnamed Product'),
          description: String(item.description || ''),
          product_category: item.product_category || 'Uncategorized',
          pdf_source: item.pdf_source || '',
          source_pages: Array.isArray(item.source_pages) ? item.source_pages : [],

          // Optional/technical fields (coerced)
          price: toNum(item.price),
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : (typeof item.image === 'string' ? item.image : undefined),
          inStock: item.inStock !== false,
          rating: toNum(item.rating),
          reviewCount: toNum(item.reviewCount),
          pressure_max_bar: toNum(item.pressure_max_bar),
          pressure_min_bar: toNum(item.pressure_min_bar),
          power_kw: toNum(item.power_kw),
          power_hp: toNum(item.power_hp),
          voltage_v: toNum(item.voltage_v),
          flow_l_min: toNum(item.flow_l_min),
          flow_l_min_list: toNumArray(item.flow_l_min_list),
          dimensions_mm_list: toNumArray(item.dimensions_mm_list),
          length_mm: toNum(item.length_mm),
          width_mm: toNum(item.width_mm),
          height_mm: toNum(item.height_mm),
          weight_kg: toNum(item.weight_kg),

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
