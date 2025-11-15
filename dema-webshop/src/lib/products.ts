import { Product, ProductFilters } from '@/types/product';
import fs from 'fs/promises';
import path from 'path';

// Cache for products data
let productsCache: Product[] = [];
let productsCacheMtimeMs: number | null = null;

// Load products from the JSON file (server-side) and cache in memory
export async function getProducts(_filters?: ProductFilters): Promise<Product[]> {
  try {
    const filePath = path.resolve(process.cwd(), 'public', 'data', 'products_for_shop.json');
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
          // Strip HTML then normalize; keep both original case and lower
          const clean = String(desc).replace(/<[^>]*>/g, ' ');
          const text = clean.replace(/\s+/g, ' ').trim();
          const lower = text.toLowerCase();

          const number = (s: string) => {
            const n = parseFloat(s.replace(',', '.'));
            return !Number.isNaN(n) ? n : undefined;
          };

          // Pressure in bar: pick reasonable range or max
          const barMatches = Array.from(lower.matchAll(/(\d{1,3}(?:[.,]\d)?)\s*bar\b/g)).map(m => number(m[1])).filter((v): v is number => v !== undefined);
          if (barMatches.length) {
            const maxBar = Math.max(...barMatches);
            const minBar = Math.min(...barMatches);
            out.pressure_max_bar = maxBar;
            if (maxBar !== minBar) out.pressure_min_bar = minBar;
          }

          // Explicit overpressure (e.g., Toegelaten overdruk bar | MPa 160 | 16)
          const overMatch = lower.match(/overdruk[^\d]*bar\s*\|\s*mpa\s*(\d{1,3}(?:[.,]\d)?)\s*\|\s*(\d{1,3}(?:[.,]\d)?)/i);
          if (overMatch) {
            out.overpressure_bar = number(overMatch[1]);
            out.overpressure_mpa = number(overMatch[2]);
          }

          // Voltage V
          const vMatch = lower.match(/\b(\d{2,3})\s*v\b/);
          if (vMatch) out.voltage_v = number(vMatch[1]);

          // Electrical block: V | ~ | Hz | A  (e.g., 230 | 1 | 50 | 9.6)
          const elec = lower.match(/aansluiting[^\d]*([\d.,]{2,3})\s*\|\s*([\d.,]+)\s*\|\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
          if (elec) {
            out.voltage_v = out.voltage_v ?? number(elec[1]);
            out.phase_count = number(elec[2]);
            out.frequency_hz = number(elec[3]);
            out.current_a = number(elec[4]);
          }

          // Power kW and HP
          const kwMatch = lower.match(/\b(\d{1,2}(?:[.,]\d+)?)\s*k\s*w\b|\b(\d{1,2}(?:[.,]\d+)?)\s*kw\b/);
          if (kwMatch) out.power_kw = number(kwMatch[1] || kwMatch[2] || '');
          const hpMatch = lower.match(/\b(\d{1,2}(?:[.,]\d+)?)\s*hp\b/);
          if (hpMatch) out.power_hp = number(hpMatch[1]);

          // Power input | output kW  e.g. Vermogenopname | afgifte kW 2.2 | 1.65
          const pio = lower.match(/vermogen\s*opname\s*\|\s*afgifte\s*k?w?\s*([\d.,]+)\s*\|\s*([\d.,]+)/i) ||
                      lower.match(/vermogenopname\s*\|\s*afgifte\s*k?w?\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
          if (pio) {
            out.power_input_kw = number(pio[1]);
            out.power_output_kw = number(pio[2]);
          }

          // Flow L/min and L/h e.g. Doorloopcapaciteit l/min | l/h 7.5 | 450
          const flowBlock = lower.match(/doorloopcapaciteit[^\d]*l\s*\/\s*min\s*\|\s*l\s*\/?\s*h\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
          if (flowBlock) {
            out.flow_l_min = number(flowBlock[1]);
            out.flow_l_h = number(flowBlock[2]);
          } else {
            // Fallback: any L/min mention
            const flowMatch = lower.match(/\b(\d{1,4}(?:[.,]\d+)?)\s*(?:l\/?min|l\s*\/\s*min|lpm)\b/);
            if (flowMatch) out.flow_l_min = out.flow_l_min ?? number(flowMatch[1]);
          }

          // RPM e.g. Motortoerental tpm 2800
          const rpm = lower.match(/(motortoerental|toerental)[^\d]*([\d.,]{2,})/i);
          if (rpm) out.rpm = number(rpm[2]);

          // Cable length e.g. Aansluitkabel m 5
          const cable = lower.match(/aansluitkabel[^\d]*m[^\d]*([\d.,]+)/i);
          if (cable) out.cable_length_m = number(cable[1]);

          // Dimensions L | B | H mm 390 | 290 | 370
          const dims = lower.match(/afmetingen[^\d]*l\s*\|\s*b\s*\|\s*h\s*mm\s*([\d.,]+)\s*\|\s*([\d.,]+)\s*\|\s*([\d.,]+)/i);
          if (dims) {
            out.length_mm = number(dims[1]);
            out.width_mm = number(dims[2]);
            out.height_mm = number(dims[3]);
          }

          // Dimensions list like "32 mm" occurrences (unique few dozen)
          const sizeMatches = Array.from(lower.matchAll(/\b(\d{1,3})\s*mm\b/g)).map(m => parseInt(m[1], 10));
          if (sizeMatches.length) {
            const unique = Array.from(new Set(sizeMatches));
            // Keep reasonable bounds 1..1000
            const filtered = unique.filter(n => n > 0 && n <= 1000);
            if (filtered.length) out.dimensions_mm_list = filtered.sort((a,b) => a-b);
          }

          // Weight kg
          const weightMatch = lower.match(/\b(\d{1,3}(?:[.,]\d+)?)\s*kg\b/);
          if (weightMatch) out.weight_kg = number(weightMatch[1]);

          // Materials keywords
          const materials: string[] = [];
          if (/(?:\b|\s)(abs|a\.?b\.?s\.?)(?:\b|\s)/.test(lower)) materials.push('ABS');
          if (/(?:\b|\s)pvc(?:\b|\s)/.test(lower)) materials.push('PVC');
          if (/(?:\b|\s)hdpe(?:\b|\s)/.test(lower)) materials.push('HDPE');
          if (materials.length) out.materials = Array.from(new Set(materials));

          // Feature bullets following ►, ■, ●
          const featureMatches = Array.from(text.matchAll(/[►■●]\s*([^#\n\r]+?)(?=(?:[►■●#]|$))/g)).map(m => m[1].trim()).filter(Boolean);
          if (featureMatches.length) out.features = Array.from(new Set(featureMatches));

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

          // Extract webshop-specific fields from products_for_shop.json
          const category: string = item.product_category || item.category || item.catalog || 'Uncategorized';

          // Map source information from webshop feed to PDF source/pages
          const sourceObj = item.source || {};
          const pdfSources: string[] = Array.isArray(sourceObj.pdf_sources) ? sourceObj.pdf_sources : [];
          const sourcePages: number[] = Array.isArray(sourceObj.pages) ? sourceObj.pages : [];

          // Prefer the first pdf source if present
          const rawPdfSource: string = pdfSources[0] || item.pdf_source || '';

          // Derive a simple image URL from media array if available
          let imageFromMedia: string | undefined;
          if (Array.isArray(item.media) && item.media.length > 0) {
            const mainMedia = item.media.find((m: any) => m && m.role === 'main') || item.media[0];
            if (mainMedia && typeof mainMedia.url === 'string') {
              imageFromMedia = mainMedia.url;
            }
          }
          const parsed = parseFromDescription(description);

          const base: Product = {
            // Preserve any extra fields first so normalized fields override them
            ...item,

            // Core identity and labeling
            sku: item.sku || item.product_id || `product-${index}`,
            name: item.name || (description ? firstSentence(description, 60) : 'Unnamed Product'),
            description,
            product_category: category,

            // Normalized links/arrays
            pdf_source: resolvePdfSource(rawPdfSource || ''),
            source_pages: sourcePages,

            // Optional/technical fields (coerced)
            // products_for_shop.json has price as an object { amount, currency, ... }
            price: toNum(item.price?.amount ?? item.price),
            imageUrl:
              typeof item.imageUrl === 'string'
                ? item.imageUrl
                : typeof item.image === 'string'
                  ? item.image
                  : imageFromMedia,
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
            flow_l_h: (base as any).flow_l_h ?? (parsed as any).flow_l_h,
            dimensions_mm_list: (base.dimensions_mm_list && base.dimensions_mm_list.length)
              ? base.dimensions_mm_list
              : (parsed.dimensions_mm_list as number[] | undefined) ?? [],
            weight_kg: base.weight_kg ?? parsed.weight_kg,
            materials: (Array.isArray(base.materials) && base.materials.length)
              ? base.materials
              : parsed.materials,
            // New parsed metrics (non-destructive merge)
            overpressure_bar: (base as any).overpressure_bar ?? (parsed as any).overpressure_bar,
            overpressure_mpa: (base as any).overpressure_mpa ?? (parsed as any).overpressure_mpa,
            rpm: base.rpm ?? parsed.rpm,
            phase_count: (base as any).phase_count ?? (parsed as any).phase_count,
            frequency_hz: (base as any).frequency_hz ?? (parsed as any).frequency_hz,
            current_a: (base as any).current_a ?? (parsed as any).current_a,
            power_input_kw: (base as any).power_input_kw ?? (parsed as any).power_input_kw,
            power_output_kw: (base as any).power_output_kw ?? (parsed as any).power_output_kw,
            cable_length_m: (base as any).cable_length_m ?? (parsed as any).cable_length_m,
            length_mm: base.length_mm ?? parsed.length_mm,
            width_mm: base.width_mm ?? parsed.width_mm,
            height_mm: base.height_mm ?? parsed.height_mm,
            features: (Array.isArray((base as any).features) && (base as any).features.length)
              ? (base as any).features
              : (parsed as any).features,
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
