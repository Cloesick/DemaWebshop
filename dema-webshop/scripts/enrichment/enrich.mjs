// Enrichment orchestrator (Step 3).
//   1. Try ICEcat (structured, licensed) by GTIN, else brand + part code.
//   2. Fall back to an Apify manufacturer-scrape actor.
//   3. Merge CONSERVATIVELY: only fill fields that are missing or still
//      placeholder, never overwrite real data we already trust.

import { icecatConfigured, fetchByGtin, fetchByBrandCode } from './icecat.mjs';
import { apifyConfigured, scrapeManufacturer } from './apify.mjs';

export function anySourceConfigured() {
  return icecatConfigured() || apifyConfigured();
}

export async function enrichProduct({ sku, brand, mpn, ean }) {
  // ICEcat first.
  if (icecatConfigured()) {
    try {
      const byGtin = ean ? await fetchByGtin(ean) : null;
      if (byGtin) return byGtin;
      // For branded items the SKU is usually the manufacturer part code.
      const code = mpn || sku;
      if (brand && code) {
        const byCode = await fetchByBrandCode(brand, code);
        if (byCode) return byCode;
      }
    } catch (e) {
      console.warn(`  icecat error for ${sku}: ${e.message}`);
    }
  }

  // Apify fallback.
  if (apifyConfigured()) {
    try {
      const scraped = await scrapeManufacturer({ brand, sku });
      if (scraped) return scraped;
    } catch (e) {
      console.warn(`  apify error for ${sku}: ${e.message}`);
    }
  }

  return null;
}

// A name/description is "placeholder" if it's the auto-generated PDF text.
const isPlaceholderName = (name, sku) =>
  !name || name.trim() === sku || /-\s*from\s/i.test(name);
const isPlaceholderDesc = (desc) =>
  !desc || /^product\b.*\bfrom\b.*\.pdf/i.test(String(desc));

// Returns the Prisma `update` payload (only the fields worth writing), or null.
export function buildUpdate(product, enriched) {
  if (!enriched) return null;
  const update = {};

  if (enriched.name && isPlaceholderName(product.name, product.sku)) {
    update.name = enriched.name;
  }
  if (enriched.description && isPlaceholderDesc(product.description)) {
    update.description = enriched.description;
  }
  if (enriched.ean && !product.ean) update.ean = String(enriched.ean);
  if (enriched.mpn && !product.mpn) update.mpn = String(enriched.mpn);
  if (enriched.brand && !product.brand) {
    update.brand = enriched.brand;
    update.brandSource = enriched.source;
  }
  if (Array.isArray(enriched.images) && enriched.images.length && !(product.images || []).length) {
    update.images = enriched.images;
    if (!product.primaryImage) update.primaryImage = enriched.images[0];
  }
  if (enriched.specs && Object.keys(enriched.specs).length) {
    // Merge new spec keys on top of whatever we parsed from the PDF.
    update.specs = { ...(product.specs || {}), ...enriched.specs };
  }

  if (Object.keys(update).length === 0) return null;
  update.enrichedAt = new Date();
  update.enrichmentSource = enriched.source;
  // Clear the placeholder flag once we've filled real content.
  if (update.name || update.description) {
    update.qaFlags = (product.qaFlags || []).filter((f) => f !== 'placeholder_content');
  }
  return update;
}
