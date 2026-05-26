# Open-Source E-Commerce Frameworks — Research & Recommendations

> Last updated: May 26, 2026
> Context: Evaluated for use with our Agnostic ecommerce-starter (Next.js 14, TypeScript, Tailwind, Prisma) and upcoming projects like Hairdresser.

---

## Our Current Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5.x |
| Styling | Tailwind CSS |
| ORM | Prisma |
| Auth | NextAuth.js |
| Payments | Stripe |
| State | Zustand |
| Data fetching | React Query / tRPC |
| Deploy | Netlify / Vercel |

---

## Recommendation: What's Best for This Project

### Best Overall Match: **Vercel Next.js Commerce** + **MedusaJS**

**Why this combination wins for us:**

1. **Vercel Next.js Commerce** (`vercel/commerce` — 13.7k stars) is the closest to our existing stack. It's a pure Next.js storefront template using App Router, React Server Components, Server Actions, Suspense, and `useOptimistic`. We can study its patterns and port them directly into our `ecommerce-starter/`.

2. **MedusaJS** (`medusajs/medusa` — 31.3k stars) is the best headless backend for JS/TS teams. REST API (simple, cacheable), Node.js/Express, PostgreSQL — mirrors our stack perfectly. When we outgrow a Prisma-based API routes setup, Medusa is the natural graduation path.

### Why NOT the others (for us):

| Platform | Why it's not ideal for our stack |
|---|---|
| **Saleor** (22.4k stars) | Python/Django — different ecosystem, GraphQL-only adds ceremony |
| **Vendure** (6.9k stars) | NestJS — great but different paradigm from our Next.js API routes |
| **Bagisto** (24.7k stars) | PHP/Laravel — completely different stack |
| **Spree** (15.1k stars) | Ruby on Rails — different ecosystem |
| **EverShop** | Promising but smaller community, less battle-tested |

---

## Tier 1 — Study These (Same DNA as Our Stack)

### 1. Vercel Next.js Commerce
- **Repo:** https://github.com/vercel/commerce
- **Stars:** 13.7k
- **Stack:** Next.js 14, TypeScript, Tailwind CSS, React Server Components
- **What to learn:**
  - Provider architecture — abstract commerce interface, swap backends
  - App Router patterns (RSC, Server Actions, Suspense, `useOptimistic`)
  - Shopify integration as reference for our own backend adapter
  - Orama search integration (client-side vector search)
  - Performance optimization patterns
- **How to use:** Fork and replace `lib/shopify` with our own Prisma/API layer
- **License:** MIT

### 2. MedusaJS
- **Repo:** https://github.com/medusajs/medusa
- **Stars:** 31.3k
- **Stack:** Node.js, Express, TypeScript, PostgreSQL, Redis
- **API:** REST (primary) + GraphQL
- **What to learn:**
  - Modular commerce architecture (products, carts, orders as separate modules)
  - Payment & fulfillment plugin patterns
  - Cart/checkout flow implementation
  - Returns, exchanges, subscriptions
  - How to structure a composable commerce backend
- **Starter storefront:** `medusajs/nextjs-starter-medusa` (Next.js 15)
- **License:** MIT

### 3. Skateshop
- **Repo:** https://github.com/sadmann7/skateshop
- **Stars:** ~4k
- **Stack:** Next.js 14, TypeScript, Tailwind, Drizzle ORM, Stripe, Clerk Auth
- **What to learn:**
  - Full Stripe integration (products, checkout, webhooks)
  - File uploads with Uploadthing
  - Email with React Email + Resend
  - Modern Next.js 14 patterns in a real ecommerce context
  - Simpler than Vercel Commerce — easier to understand
- **Best for:** Learning modern patterns, quick reference implementation
- **License:** MIT

### 4. QuickCart
- **Repo:** https://github.com/GreatStackDev/QuickCart
- **Stack:** Next.js, Tailwind CSS
- **What to learn:**
  - Minimal, clean ecommerce UI patterns
  - Responsive product grid layouts
  - Simple cart implementation
- **Best for:** UI/UX reference, minimal template
- **License:** MIT

---

## Tier 2 — Reference When Needed (Different Stack but Great Architecture)

### 5. MedusaJS Next.js Starter
- **Repo:** https://github.com/medusajs/nextjs-starter-medusa
- **Stack:** Next.js 15, React 19, TypeScript, Tailwind
- **What to learn:**
  - How a professional storefront connects to a headless API
  - Cart state management patterns
  - Checkout flow with Stripe
  - Product page with variants, options, pricing

### 6. Spree Storefront
- **Repo:** https://github.com/spree/storefront
- **Stack:** Next.js 16, React 19, TypeScript
- **What to learn:**
  - One-page checkout implementation
  - Multi-shipment handling
  - Apple Pay / Google Pay via Stripe
  - Guest vs authenticated checkout flows

### 7. Saleor (architecture reference)
- **Repo:** https://github.com/saleor/saleor
- **Stars:** 22.4k
- **Stack:** Python/Django, GraphQL
- **What to learn:**
  - Multi-channel / multi-market data modeling
  - Permission system design
  - Product attribute/variant modeling (best in class)
  - Admin dashboard UX patterns (React-based)

### 8. Vendure (architecture reference)
- **Repo:** https://github.com/vendure-ecommerce/vendure
- **Stars:** 6.9k
- **Stack:** TypeScript, NestJS, GraphQL
- **What to learn:**
  - Plugin architecture patterns
  - Background worker for heavy tasks (emails, fulfillment)
  - Order state machine design
  - How to structure a typed commerce API

---

## Tier 3 — Storefront-Only Templates (UI Reference)

### 9. SvelteKit Commerce
- **Repo:** https://github.com/vercel/sveltekit-commerce
- **What to learn:** Clean storefront UI, alternative framework approach

### 10. Vue Storefront (Alokai) — 10.9k stars
- **Repo:** https://github.com/vuestorefront/vue-storefront
- **What to learn:** Universal storefront abstraction layer, middleware patterns

### 11. Svelte Commerce
- **Repo:** https://github.com/itswadesh/svelte-commerce
- **What to learn:** PWA storefront patterns, headless connector approach

---

## Tier 4 — Traditional Platforms (Not Our Stack, but Proven at Scale)

| Platform | Stars | Stack | Good to study for... |
|---|---|---|---|
| Magento 2 | 12k | PHP | Enterprise catalog modeling |
| WooCommerce | 10.1k | PHP/WordPress | Plugin ecosystem design |
| PrestaShop | 8.7k | PHP | Multi-language/currency UX |
| OpenCart | 7.9k | PHP | Simplicity, 13k+ extensions |
| nopCommerce | 9.9k | C#/.NET | .NET commerce patterns |
| Sylius | 8.3k | PHP/Symfony | Modern PHP, API-first |
| Bagisto | 24.7k | PHP/Laravel | Multi-vendor marketplace |
| Django Oscar | 6.5k | Python | Domain-driven commerce |

---

## Action Plan for Our Ecommerce Starter

### Phase 1: Learn & Steal Patterns
1. Clone `vercel/commerce` — study the provider abstraction in `lib/shopify`
2. Clone `sadmann7/skateshop` — study Stripe integration, auth, file uploads
3. Read MedusaJS module source — understand cart/order/payment module boundaries

### Phase 2: Apply to Our Starter
1. Port the provider pattern from Vercel Commerce into our `ecommerce-starter/lib/`
2. Implement Stripe checkout following Skateshop's pattern
3. Build product/variant data model in Prisma inspired by Saleor's attribute system
4. Add cart state management (Zustand) following Medusa starter patterns

### Phase 3: Scale When Ready
1. If we outgrow Next.js API routes → migrate backend to MedusaJS
2. Keep our Next.js storefront, just swap `lib/` to call Medusa's REST API
3. This is exactly what Vercel Commerce's provider pattern enables

---

## Key Repos to Clone

```bash
# Storefront reference (our stack)
git clone https://github.com/vercel/commerce.git

# Backend reference (JS/TS)
git clone https://github.com/medusajs/medusa.git

# Learning reference (simpler, same stack)
git clone https://github.com/sadmann7/skateshop.git

# Quick UI reference
git clone https://github.com/GreatStackDev/QuickCart.git

# Medusa + Next.js connected starter
git clone https://github.com/medusajs/nextjs-starter-medusa.git
```

---

## Summary Decision Matrix

| Need | Best Pick | Why |
|---|---|---|
| **Storefront patterns** | Vercel Next.js Commerce | Same stack, provider architecture |
| **Backend when we scale** | MedusaJS | JS/TS, REST, modular, huge community |
| **Quick learning** | Skateshop | Simple, real Stripe integration |
| **UI inspiration** | QuickCart | Minimal, clean |
| **Data model reference** | Saleor | Best product/variant/attribute modeling |
| **Plugin architecture** | Vendure | Cleanest plugin system |
| **Multi-vendor** | Spree or Bagisto | Built-in marketplace support |
