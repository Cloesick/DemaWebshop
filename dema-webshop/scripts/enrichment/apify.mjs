// Apify client — fallback enrichment source (Step 3).
//
// For products ICEcat doesn't cover (long-tail / commodity, or brands without
// a datasheet), run an Apify actor that scrapes the manufacturer site. The
// actor id is configurable so you can swap in whichever actor/task you set up.
//
// Env:
//   APIFY_TOKEN              - your Apify API token (store in .env.local, never commit)
//   APIFY_MANUFACTURER_ACTOR - actor id or "user~actor-name" to run (required for fallback)
//
// Uses the run-sync-get-dataset-items endpoint so one HTTP call returns the
// scraped rows. Keep actor runs small/rate-limited from the batch runner.

const API = 'https://api.apify.com/v2';

export function apifyConfigured() {
  return Boolean(process.env.APIFY_TOKEN && process.env.APIFY_MANUFACTURER_ACTOR);
}

export async function runActorSync(actorId, input) {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error('APIFY_TOKEN not set');
  const id = String(actorId).replace('/', '~');
  const res = await fetch(
    `${API}/acts/${id}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input || {}),
    }
  );
  if (!res.ok) throw new Error(`Apify HTTP ${res.status}`);
  const items = await res.json();
  return Array.isArray(items) ? items : [];
}

export async function scrapeManufacturer({ brand, sku, query }) {
  if (!apifyConfigured()) return null;
  const actor = process.env.APIFY_MANUFACTURER_ACTOR;
  const items = await runActorSync(actor, {
    brand,
    sku,
    query: query || `${brand || ''} ${sku || ''}`.trim(),
    maxItems: 1,
  });
  return items.length ? normalizeApifyItem(items[0], brand) : null;
}

// Actor outputs vary; map the most common field names defensively.
function normalizeApifyItem(item, brand) {
  if (!item || typeof item !== 'object') return null;
  const images = []
    .concat(item.images || item.imageUrls || item.image || [])
    .filter(Boolean);
  return {
    source: 'apify',
    name: item.name || item.title || null,
    description: item.description || item.longDescription || null,
    brand: item.brand || brand || null,
    ean: item.ean || item.gtin || item.barcode || null,
    mpn: item.mpn || item.sku || item.partNumber || null,
    images,
    specs:
      item.specs && typeof item.specs === 'object'
        ? item.specs
        : item.specifications && typeof item.specifications === 'object'
        ? item.specifications
        : null,
  };
}
