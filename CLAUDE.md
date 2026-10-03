# CLAUDE.md — DemaWebshop

B2B/B2C webshop for Dema (demashop.be): industrial equipment catalog (pumps, pipes,
fittings, hoses, Makita / Airpress / Kränzle tools) built from PDF-extracted product
data (~9.9k products), with quote requests and a hybrid fixed-price / quote-only model.

## Repo layout (read this first)
- This outer repo (branch `chore/stabilize-cleanup`, remote `origin` =
  github.com/Cloesick/DemaWebshop) tracks everything, including `dema-webshop/`.
  `new-origin` (DemaUltMidDec) is an old Dec-2025 snapshot already contained here.
- **`dema-webshop/` is the Next.js app** and is *also* a separate nested git repo
  (remote DemaNew, branch `main`). Both repos track the same files; commit app changes
  in the outer repo first. Do not change remotes without the user.
- Root-level `.txt` notes and `tools/` (Python media sync) are data-pipeline helpers.

## Stack
Next.js 14 (App Router, TypeScript), Tailwind 3, NextAuth (credentials + Google),
Prisma 6 + Postgres (Neon/Supabase/Vercel Postgres), Zustand cart, Firebase admin/client
helpers, i18n via `src/locales/{nl,fr,en}.json`.

## Commands (run inside `dema-webshop/`)
- `npm run dev` (port 3000, binds 0.0.0.0, Turbopack disabled) · `npm run build` (`prisma generate && next build`) · `npm start` · `npm run lint`
- DB: `npm run db:generate | db:migrate | db:push | db:seed | db:studio` (see `prisma/README.md`)
- `npm run enrich` — ICEcat (primary) + Apify (fallback) product enrichment (`scripts/enrichment/`)
- `npm run hash-password -- '<pw>'` — scrypt hash for `ADMIN_PASSWORD_HASH`
- `npm run sync-images`
- Tests: none automated yet (`__tests__/` dirs are empty, no test runner installed); `tests/contact-api.http` for manual API checks.
- Env: copy `dema-webshop/.env.example`; never commit `.env*` other than the example.

## Deploy
`netlify.toml` (repo root) builds with base `dema-webshop`, `@netlify/plugin-nextjs`,
Node 18, and redirects www -> apex `demashop.be`. `.github/workflows/nextjs.yml` is a
GitHub Pages sample workflow and does not match the Netlify/serverless setup.

## Key directories (`dema-webshop/`)
- `src/app/` — routes; catalogs render via the dynamic `catalog/group/[slug]` route
  backed by `src/lib/catalogs.ts` (the old per-catalog `*-grouped` pages were removed)
- `src/app/api/` — products, search, quote/quote-request, orders, contact, admin, pdf-catalog …
- `src/auth.ts` — admin = `ADMIN_EMAILS` allowlist only; credentials login verified against `ADMIN_PASSWORD_HASH`
- `src/store/cartStore.ts`, `src/app/checkout/` — cart totals use real `item.price`; items without a price show "request quote"
- `prisma/` — schema (`Product.price` optional, `PriceMode` = fixed | call_for_price | request_quote) and seed from JSON
- `documents/Product_pdfs/` — source PDFs + extracted JSON (large; do not add more >5 MB files)

## Conventions
- Never fabricate prices: no price -> `request_quote`. Never collect raw card data in app state.
- User-facing strings in all three locales (nl/fr/en).
- Prefer the DB (Prisma) over reading the legacy JSON files directly.

## Known open launch blockers
- **No payment provider:** card fields were removed; only bank transfer / cash on delivery.
  Stripe (or Mollie) still has to be wired for the fixed-price subset.
- **Real prices missing:** most products have no price (quote-only); a price list import is needed.
- **Database not provisioned in-repo:** `DATABASE_URL` and the initial migrate + seed are pending.
- Admin auth needs `ADMIN_EMAILS` + `ADMIN_PASSWORD_HASH` + `NEXTAUTH_SECRET` set in the host.
- Nested `dema-webshop` repo is behind/diverged from DemaNew `origin/main` (needs a manual merge).
