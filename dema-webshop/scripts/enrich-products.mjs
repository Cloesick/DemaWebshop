// Batch product enrichment runner (Step 3).
//
//   npm run enrich -- --dry-run            # preview, write nothing
//   npm run enrich -- --brand Makita --limit 50
//   npm run enrich -- --limit 200          # all brands, real write
//
// Selects products that still need help (placeholder content, or no specs)
// and enriches them via ICEcat → Apify. Rate-limited and resumable
// (re-running only touches rows not yet enriched).
//
// Requires: a live DATABASE_URL + at least one of ICECAT_USERNAME /
// APIFY_TOKEN in .env.local. Reads env from the Next.js .env files.

import { PrismaClient } from '@prisma/client';
import { enrichProduct, buildUpdate, anySourceConfigured } from './enrichment/enrich.mjs';

const prisma = new PrismaClient();

function arg(name, def = undefined) {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return def;
  const next = process.argv[i + 1];
  return !next || next.startsWith('--') ? true : next;
}

const DRY_RUN = Boolean(arg('dry-run', false));
const LIMIT = Number(arg('limit', 100));
const BRAND = arg('brand', undefined);
const DELAY_MS = Number(arg('delay', 400)); // politeness between source calls

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  if (!anySourceConfigured()) {
    console.error(
      'No enrichment source configured. Set ICECAT_USERNAME and/or APIFY_TOKEN + APIFY_MANUFACTURER_ACTOR in .env.local.'
    );
    process.exit(1);
  }

  const where = {
    // Start with rows that actually need it.
    OR: [{ qaFlags: { has: 'placeholder_content' } }, { specs: { equals: null } }],
    enrichedAt: null,
    ...(BRAND ? { brand: BRAND } : { brand: { not: null } }), // branded first (ICEcat works best)
  };

  const products = await prisma.product.findMany({
    where,
    take: LIMIT,
    orderBy: { sku: 'asc' },
  });

  console.log(
    `${DRY_RUN ? '[DRY RUN] ' : ''}Enriching ${products.length} products` +
      `${BRAND ? ` (brand=${BRAND})` : ' (all branded)'}…`
  );

  let updated = 0,
    skipped = 0,
    failed = 0;

  for (const p of products) {
    try {
      const enriched = await enrichProduct({ sku: p.sku, brand: p.brand, mpn: p.mpn, ean: p.ean });
      const update = buildUpdate(p, enriched);
      if (!update) {
        skipped++;
        process.stdout.write(`  -  ${p.sku}: no new data\n`);
      } else {
        const fields = Object.keys(update).filter((k) => !['enrichedAt', 'enrichmentSource'].includes(k));
        if (!DRY_RUN) await prisma.product.update({ where: { id: p.id }, data: update });
        updated++;
        console.log(`  ✓  ${p.sku} [${enriched.source}]: ${fields.join(', ')}`);
      }
    } catch (e) {
      failed++;
      console.warn(`  ✗  ${p.sku}: ${e.message}`);
    }
    await sleep(DELAY_MS);
  }

  console.log(`\nDone. updated=${updated} skipped=${skipped} failed=${failed}${DRY_RUN ? ' (dry run — nothing written)' : ''}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
