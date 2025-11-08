import { Product, ProductFilters } from '@/types/product';
import fs from 'fs/promises';
import path from 'path';

// Cache for products data
let productsCache: Product[] = [];
let productsCacheMtimeMs: number | null = null;

// Load products from the JSON file (server-side) and cache in memory
export async function getProducts(_filters?: ProductFilters): Promise<Product[]> {
  try {
    const filePath = path.resolve(process.cwd(), 'public', 'data', 'Product_pdfs_analysis_v2.json');
    // Invalidate cache in development or when the file changes
    const stat = await fs.stat(filePath);
    const mtimeMs = stat.mtimeMs;
    const shouldReload =
      !productsCache ||
      productsCacheMtimeMs === null ||
      mtimeMs !== productsCacheMtimeMs ||
      process.env.NODE_ENV === 'development';

    if (shouldReload) {
      const file = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(file);
      productsCacheMtimeMs = mtimeMs;

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

        // Extract product intel from free-text description using regexes
        const parseFromDescription = (desc?: string) => {
          const out: Partial<Product> = {};
          if (!desc) return out;
          const text = desc.replace(/\s+/g, ' ').toLowerCase();

          const number = (s: string) => {
            const n = parseFloat(s.replace(',', '.'));
            return !Number.isNaN(n) ? n : undefined;
          };

          // Pressure in bar: pick reasonable range or max
          const barMatches = Array.from(text.matchAll(/(\d{1,3}(?:[.,]\d)?)\s*bar\b/g)).map(m => number(m[1])).filter((v): v is number => v !== undefined);
          if (barMatches.length) {
            const maxBar = Math.max(...barMatches);
            const minBar = Math.min(...barMatches);
            out.pressure_max_bar = maxBar;
            if (maxBar !== minBar) out.pressure_min_bar = minBar;
          }

          // Voltage V
          const vMatch = text.match(/\b(\d{2,3})\s*v\b/);
          if (vMatch) out.voltage_v = number(vMatch[1]);

          // Power kW and HP
          const kwMatch = text.match(/\b(\d{1,2}(?:[.,]\d+)?)\s*k\s*w\b|\b(\d{1,2}(?:[.,]\d+)?)\s*kw\b/);
          if (kwMatch) out.power_kw = number(kwMatch[1] || kwMatch[2] || '');
          const hpMatch = text.match(/\b(\d{1,2}(?:[.,]\d+)?)\s*hp\b/);
          if (hpMatch) out.power_hp = number(hpMatch[1]);

          // Flow L/min
          const flowMatch = text.match(/\b(\d{1,4}(?:[.,]\d+)?)\s*(?:l\/?min|l\s*\/\s*min|lpm)\b/);
          if (flowMatch) out.flow_l_min = number(flowMatch[1]);

          // Dimensions list like "32 mm" occurrences (unique few dozen)
          const sizeMatches = Array.from(text.matchAll(/\b(\d{1,3})\s*mm\b/g)).map(m => parseInt(m[1], 10));
          if (sizeMatches.length) {
            const unique = Array.from(new Set(sizeMatches));
            // Keep reasonable bounds 1..1000
            const filtered = unique.filter(n => n > 0 && n <= 1000);
            if (filtered.length) out.dimensions_mm_list = filtered.sort((a,b) => a-b);
          }

          // Weight kg
          const weightMatch = text.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*kg\b/);
          if (weightMatch) out.weight_kg = number(weightMatch[1]);

          // Materials keywords
          const materials: string[] = [];
          if (/(?:\b|\s)(abs|a\.?b\.?s\.?)(?:\b|\s)/.test(text)) materials.push('ABS');
          if (/(?:\b|\s)pvc(?:\b|\s)/.test(text)) materials.push('PVC');
          if (/(?:\b|\s)hdpe(?:\b|\s)/.test(text)) materials.push('HDPE');
          if (materials.length) out.materials = Array.from(new Set(materials));

          return out;
        };

        const resolvePdfSource = (v: any): string => {
          if (!v) return '';
          const s = String(v).trim();
          // Absolute URL
          if (/^(?:https?:)?\/\//i.test(s)) return s;
          // Already an absolute path
          if (s.startsWith('/')) return s;
          // Bare filename -> map to uploaded public path
          if (/\.pdf$/i.test(s)) return `/documents/Product_pdfs/${encodeURIComponent(s)}`;
          return s;
        };

        productsCache = productsArray.map((item: any, index: number): Product => {
          const description: string = String(item.description || '');
          const parsed = parseFromDescription(description);

          const base: Product = {
            // Preserve any extra fields first so normalized fields override them
            ...item,

            // Core identity and labeling
            sku: item.sku || item.product_id || `product-${index}`,
            name: item.name || (description ? firstSentence(description, 60) : 'Unnamed Product'),
            description,
            product_category: item.product_category || 'Uncategorized',

            // Normalized links/arrays
            pdf_source: resolvePdfSource(item.pdf_source || ''),
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
          } as Product;

          // Merge parsed fields without overwriting explicit values
          const merged: Product = {
            ...base,
            pressure_max_bar: base.pressure_max_bar ?? parsed.pressure_max_bar,
            pressure_min_bar: base.pressure_min_bar ?? parsed.pressure_min_bar,
            power_kw: base.power_kw ?? parsed.power_kw,
            power_hp: base.power_hp ?? parsed.power_hp,
            voltage_v: base.voltage_v ?? parsed.voltage_v,
            flow_l_min: base.flow_l_min ?? parsed.flow_l_min,
            dimensions_mm_list: (base.dimensions_mm_list && base.dimensions_mm_list.length)
              ? base.dimensions_mm_list
              : (parsed.dimensions_mm_list as number[] | undefined) ?? [],
            weight_kg: base.weight_kg ?? parsed.weight_kg,
            materials: (Array.isArray(base.materials) && base.materials.length)
              ? base.materials
              : parsed.materials,
          } as Product;

          return merged;
        });
      }
    }
  } catch (error) {
    console.error('Error loading product data from file:', error);
    productsCache = [];
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
