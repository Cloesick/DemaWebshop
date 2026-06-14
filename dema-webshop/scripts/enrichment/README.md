# Product enrichment (Step 3)

Fills the gaps in the PDF-extracted data — real names/descriptions, technical
specs, EAN/GTIN, and clean images — using a **hybrid** source strategy:

1. **ICEcat** (primary): licensed structured datasheets, matched by GTIN or
   brand + part code. Best for branded items (Makita / Airpress / Kränzle).
2. **Apify** (fallback): a manufacturer-site scrape actor for what ICEcat
   doesn't cover. Competitor scraping is intentionally *not* wired in.

## Setup

In `.env.local` (never commit secrets):

```
DATABASE_URL=...            # must be live (Step 2)
ICECAT_USERNAME=...         # + ICECAT_API_TOKEN for full content
APIFY_TOKEN=...             # the ROTATED token
APIFY_MANUFACTURER_ACTOR=user~actor-name
```

At least one source (ICEcat or Apify) must be configured.

## Run

```bash
npm run enrich -- --dry-run             # preview, writes nothing
npm run enrich -- --brand Makita --limit 50
npm run enrich -- --limit 200           # all branded products
```

- **Conservative merge**: only fills fields that are missing or still
  placeholder — never overwrites data we already trust.
- **Resumable**: only touches rows with `enrichedAt = null`, so re-running
  continues where it left off.
- Clears the `placeholder_content` qaFlag once real name/description land.

## Files

| File | Role |
|---|---|
| `icecat.mjs` | ICEcat API client + response normalizer |
| `apify.mjs` | Apify actor runner + output normalizer |
| `enrich.mjs` | orchestrator (ICEcat → Apify) + conservative merge |
| `../enrich-products.mjs` | batch runner (Prisma query → enrich → write back) |

> Response shapes for ICEcat/Apify are defensive but were written without a
> live call — verify field mappings on the first real run and adjust the
> `normalize*` functions if a provider returns a different shape.
