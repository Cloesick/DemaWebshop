// One-time (idempotent) import of the PDF-extracted catalog JSON into the database.
// Run with: npm run db:seed   (after `npx prisma migrate dev`)
//
// It does the cleanup the raw data never had:
//  - normalizes whitespace/newlines in SKUs
//  - derives `brand` from the source catalog (Makita / Airpress / Kränzle)
//  - flags extraction artifacts (spec tokens like PN10/IE3/RAL7037) and
//    placeholder names/descriptions, without throwing data away (qaFlags)
//  - lifts known technical fields into a normalized `specs` JSON

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const prisma = new PrismaClient();
const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'src', 'data');

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/\.pdf$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const brandForCatalog = (slug) => {
  if (/^makita/.test(slug)) return 'Makita';
  if (/^airpress/.test(slug)) return 'Airpress';
  if (/^kranzle/.test(slug)) return 'Kränzle';
  return null; // pumps / bearings / commodity fittings → enriched later (Step 3)
};

// Spec tokens that the PDF parser mistook for product codes.
const SPEC_TOKEN = /^(PN\d+|IE\d|SN\d+|RAL\d+|DN\d+|IP\d+|PE ?\d+|G ?\d\/\d)$/i;

const cleanSku = (raw) => String(raw ?? '').replace(/\s+/g, ' ').trim();

// Known numeric/technical fields to normalize into `specs`.
const SPEC_KEYS = [
  'pressure_max_bar', 'pressure_min_bar', 'power_kw', 'power_hp', 'voltage_v',
  'frequency_hz', 'current_a', 'phase_count', 'flow_l_min', 'flow_l_h',
  'debiet_m3_h', 'rpm', 'size_inch', 'length_m', 'length_mm', 'width_mm',
  'height_mm', 'diameter_mm', 'weight_kg', 'volume_l', 'noise_level_db',
  'tank_capacity_l', 'cable_length_m', 'materials', 'connection_types',
];

function pickSpecs(p) {
  const specs = {};
  for (const k of SPEC_KEYS) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== '') specs[k] = p[k];
  }
  return Object.keys(specs).length ? specs : null;
}

function qaFlagsFor(rawSku, cleaned, name, description) {
  const flags = [];
  if (rawSku !== cleaned || /\n/.test(rawSku)) flags.push('dirty_sku');
  if (cleaned.length <= 2 || SPEC_TOKEN.test(cleaned)) flags.push('artifact_suspect');
  const nameIsPlaceholder = /-\s*from\s/i.test(name) || name.trim() === cleaned;
  const descIsPlaceholder = /^product\b.*\bfrom\b.*\.pdf/i.test(String(description || ''));
  if (nameIsPlaceholder || descIsPlaceholder) flags.push('placeholder_content');
  return flags;
}

async function main() {
  const index = JSON.parse(readFileSync(join(dataDir, 'catalog_index.json'), 'utf-8'));
  const products = JSON.parse(readFileSync(join(dataDir, 'catalog_products.json'), 'utf-8'));

  console.log(`Seeding ${products.length} products across ${Object.keys(index.catalogs || {}).length} catalogs…`);

  // --- Catalogs ---
  const catalogSlugToId = new Map();
  for (const [key, c] of Object.entries(index.catalogs || {})) {
    const slug = slugify(c.name || key);
    const row = await prisma.catalog.upsert({
      where: { slug },
      update: {
        title: c.name || slug,
        brand: brandForCatalog(slug),
        pdfSource: key,
        productCount: c.product_count ?? 0,
      },
      create: {
        slug,
        title: c.name || slug,
        brand: brandForCatalog(slug),
        pdfSource: key,
        productCount: c.product_count ?? 0,
      },
    });
    catalogSlugToId.set(slug, row.id);
  }

  // --- Products (fresh load for idempotency) ---
  await prisma.product.deleteMany();

  const seenSlugs = new Set();
  const rows = [];
  let artifacts = 0, dirty = 0, placeholders = 0;

  for (const p of products) {
    const rawSku = String(p.sku ?? '');
    const sku = cleanSku(rawSku);
    if (!sku) continue;

    const catalogSlug = slugify(p.catalog || p.pdf_source || '');
    const flags = qaFlagsFor(rawSku, sku, p.name || '', p.description);
    if (flags.includes('artifact_suspect')) artifacts++;
    if (flags.includes('dirty_sku')) dirty++;
    if (flags.includes('placeholder_content')) placeholders++;

    let slug = p.seo?.slug || sku.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    while (seenSlugs.has(slug)) slug = `${slug}-${rows.length}`;
    seenSlugs.add(slug);

    const images = Array.isArray(p.image_paths) ? p.image_paths : [];

    rows.push({
      sku,
      slug,
      name: p.name || sku,
      description: p.description ?? null,
      brand: brandForCatalog(catalogSlug),
      brandSource: brandForCatalog(catalogSlug) ? 'catalog' : null,
      catalogId: catalogSlugToId.get(catalogSlug) ?? null,
      catalogSlug,
      price: p.price ?? null,
      priceMode: ['fixed', 'call_for_price', 'request_quote'].includes(p.priceMode) ? p.priceMode : 'request_quote',
      stockStatus: ['in_stock', 'out_of_stock'].includes(p.stock?.status) ? p.stock.status : 'unknown',
      stockQty: p.stock?.quantity ?? null,
      ean: p.ean ?? null,
      mpn: p.mpn ?? null,
      images,
      primaryImage: p.imageUrl || images[0] || null,
      specs: pickSpecs(p),
      attributes: p.attributes ?? null,
      pdfSource: p.pdf_source ?? null,
      sourcePages: Array.isArray(p.source_pages) ? p.source_pages.filter((n) => Number.isInteger(n)) : [],
      qaFlags: flags,
    });
  }

  // Chunked insert (createMany is far faster than per-row upsert for ~10k rows).
  const CHUNK = 1000;
  for (let i = 0; i < rows.length; i += CHUNK) {
    await prisma.product.createMany({ data: rows.slice(i, i + CHUNK), skipDuplicates: true });
    process.stdout.write(`  inserted ${Math.min(i + CHUNK, rows.length)}/${rows.length}\r`);
  }

  console.log(`\nDone. ${rows.length} products loaded.`);
  console.log(`Flags → artifact_suspect: ${artifacts}, dirty_sku: ${dirty}, placeholder_content: ${placeholders}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
