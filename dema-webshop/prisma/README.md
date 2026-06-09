# Database (Step 2 — single source of truth)

Replaces the fragmented JSON file reads (`catalog_products.json`,
`products_for_shop.json`, `Product_images.json`, …) with one Postgres DB.

## One-time setup

1. **Create a Postgres database** (any of these — same schema):
   - [Neon](https://neon.tech) (recommended, serverless free tier), or
   - Vercel Postgres (if deploying on Vercel — same engine), or
   - [Supabase](https://supabase.com).
2. Put the connection string in `.env`:
   ```
   DATABASE_URL=postgresql://user:pass@host/demashop?sslmode=require
   ```
3. Install deps and create the schema + load data:
   ```bash
   npm install                 # pulls in the prisma CLI
   npx prisma migrate dev --name init
   npm run db:seed
   ```

`db:seed` reads the existing PDF-extracted JSON, cleans the dirty SKUs,
derives brands (Makita / Airpress / Kränzle), flags extraction artifacts and
placeholder content (`qaFlags`), and loads ~9.9k products + catalogs.

## Handy commands

| Command | What |
|---|---|
| `npm run db:migrate` | create/apply a migration after editing `schema.prisma` |
| `npm run db:seed` | (re)load products from the catalog JSON (idempotent) |
| `npm run db:studio` | browse the data in Prisma Studio |
| `npm run db:push` | push schema without a migration (prototyping only) |

## Notes

- `build` runs `prisma generate` first, so deploys get a fresh client.
- The seed is **non-destructive about quality**: suspected artifacts (spec
  tokens like `PN10`, `IE3`) are imported but tagged in `qaFlags` so Step 3
  enrichment / the admin UI can triage rather than silently dropping rows.
