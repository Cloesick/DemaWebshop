import { Product } from '@/types/product';
import { formatCurrency } from '@/lib/utils';

export interface CardSpec {
  label: string;
  value: string;
}

export interface ProductCardVM {
  title: string;
  subtitle: string;
  image: string;
  priceLabel: string;
  badges: string[];
  specs: CardSpec[];
  pdfLabel?: string;
  pdfHref?: string;
  categoryLabel?: string;
}

function firstSentence(text?: string, maxLen = 140): string {
  if (!text) return '';
  const s = text.split(/\.|\n|\r/)[0].trim();
  return s.length > maxLen ? s.slice(0, maxLen - 1) + '…' : s;
}

function placeholderFor(category: string, title: string): string {
  const safe = (s: string) => s.replace(/[^a-z0-9]+/gi, '-');
  const text = (title || category || 'Product');
  const svg = `<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><text x="50%" y="50%" font-family="sans-serif" font-size="16" text-anchor="middle" fill="#9ca3af" dy=".3em">${text}</text></svg>`;
  // Use UTF-8 data URL to avoid btoa Unicode issues
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function fmtNumber(n?: number, unit?: string) {
  if (n === undefined || n === null || Number.isNaN(n)) return undefined;
  return unit ? `${n} ${unit}` : String(n);
}

export function formatProductForCard(p: Product): ProductCardVM {
  const title = (p as any).name || p.sku || 'Product';
  const subtitle = firstSentence(p.description);
  const image = (p as any).image || p.imageUrl || placeholderFor(p.product_category || 'product', title);

  // Price: prefer numeric; else "Price on request"
  const priceLabel = typeof p.price === 'number' ? formatCurrency(p.price) : 'Price on request';

  const badges: string[] = [];
  if (p.product_category) badges.push(p.product_category);
  if (p.inStock) badges.push('In Stock');
  if ((p as any).product_type) badges.push(String((p as any).product_type));

  // Category-aware top specs
  const specs: CardSpec[] = [];
  // Pressure
  if (typeof p.pressure_min_bar === 'number' || typeof p.pressure_max_bar === 'number') {
    const min = p.pressure_min_bar; const max = p.pressure_max_bar;
    const val = [min, max].filter(v => typeof v === 'number').join('–');
    if (val) specs.push({ label: 'Pressure', value: `${val} bar` });
  }
  // Power
  if (typeof p.power_kw === 'number') specs.push({ label: 'Power', value: fmtNumber(p.power_kw, 'kW')! });
  else if (typeof p.power_hp === 'number') specs.push({ label: 'Power', value: fmtNumber(p.power_hp, 'HP')! });
  // Voltage
  if (typeof p.voltage_v === 'number') specs.push({ label: 'Voltage', value: fmtNumber(p.voltage_v, 'V')! });
  // Sizes
  if (Array.isArray(p.dimensions_mm_list) && p.dimensions_mm_list.length) {
    const shown = p.dimensions_mm_list.slice(0, 3).join(', ');
    specs.push({ label: 'Sizes', value: `${shown}mm${p.dimensions_mm_list.length > 3 ? '…' : ''}` });
  }
  // Weight
  if (typeof p.weight_kg === 'number') specs.push({ label: 'Weight', value: fmtNumber(p.weight_kg, 'kg')! });
  // Flow
  if (Array.isArray(p.flow_l_min_list) && p.flow_l_min_list.length) {
    specs.push({ label: 'Flow', value: `${p.flow_l_min_list[0]} L/min` });
  } else if (typeof p.flow_l_min === 'number') {
    specs.push({ label: 'Flow', value: `${p.flow_l_min} L/min` });
  } else if (typeof p.debiet_m3_h === 'number') {
    specs.push({ label: 'Flow', value: `${p.debiet_m3_h} m³/h` });
  }

  const pdfHref = p.pdf_source ? p.pdf_source : undefined;
  const pdfLabel = pdfHref ? 'Datasheet' : undefined;

  return {
    title,
    subtitle,
    image,
    priceLabel,
    badges,
    specs: specs.slice(0, 5),
    pdfHref,
    pdfLabel,
    categoryLabel: p.product_category,
  };
}
