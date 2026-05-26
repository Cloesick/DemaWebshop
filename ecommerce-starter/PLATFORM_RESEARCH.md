# Platform Research: Lovable, Wix, Shopify, Squarespace

## What We Can Learn & Apply to Our E-commerce Starter

---

## 1. Shopify (Industry Leader)

### Key API Capabilities
- **Storefront API (GraphQL)** — Customer-facing, handles products, collections, cart, checkout
- **Admin API (GraphQL)** — Full store management: products, orders, inventory, customers, discounts, metafields
- **Webhooks** — 80+ event topics (cart created, order paid, product updated, fulfillment created, etc.)
- **Metafields** — Arbitrary custom data on any resource (products, orders, customers)
- **Multi-location inventory** — Stock tracked per warehouse/location
- **Discount rules** — Automatic discounts, discount codes, buy-X-get-Y, percentage/fixed/free-shipping

### What to Adopt
| Feature | Priority | How to Implement |
|---------|----------|-----------------|
| **Metafields system** | HIGH | Add a `Metafield` model (entity, key, value, type). Allows custom data on any resource without schema changes |
| **Webhook system** | HIGH | Add `/api/webhooks/register` + event emitter pattern. Fire events on order.created, product.updated, etc. |
| **Multi-location inventory** | MEDIUM | Add `Location` model + pivot `InventoryLevel` (locationId, variantId, available) |
| **Automatic discounts** | HIGH | Add `Discount` model with rules engine (percentage, fixed, BOGO, min-purchase, date range) |
| **Collections / Smart Collections** | MEDIUM | Products grouped manually OR by auto-rules (price > X, tag = Y) |
| **Draft Orders** | MEDIUM | Orders created by admin on behalf of customer (phone orders, B2B quotes) |
| **Abandoned Checkout Recovery** | HIGH | Track incomplete checkouts, send reminder emails after X hours |

---

## 2. Wix eCommerce API

### Key Capabilities
- **Cart API** — Full cart lifecycle management with server-side persistence
- **Abandoned Checkout Recovery** — Automatic detection + recovery flow with email triggers
- **Discount Rules API** — Programmable discount logic (conditions + effects)
- **Recommendations API** — Product recommendations based on behavior/catalog
- **Service Plugins** — Extensible architecture for shipping rates, additional fees, payment providers, custom catalogs, checkout validation
- **Fulfillment API** — Order preparation, tracking, delivery status
- **Order Transactions API** — Full payment transaction history per order

### What to Adopt
| Feature | Priority | How to Implement |
|---------|----------|-----------------|
| **Service Plugin Architecture** | HIGH | Define interfaces for ShippingProvider, PaymentProvider, TaxCalculator — makes the platform extensible |
| **Checkout Validation Hooks** | HIGH | Pre-checkout validation pipeline: stock check, address validation, fraud check, minimum order |
| **Product Recommendations** | MEDIUM | "Frequently bought together", "Customers also viewed" — track views + co-purchases |
| **Additional Fees system** | MEDIUM | Configurable fees (handling, gift wrapping, rush delivery) added at checkout |
| **Fulfillment tracking** | HIGH | Carrier integration, tracking number, shipment status updates, customer notifications |

---

## 3. Squarespace Commerce API

### Key Capabilities
- **Contacts API** — Unified customer/subscriber/donor management with address books + marketing preferences
- **Analytics API** — Aggregated commerce data (order counts, revenue totals, per-contact)
- **Inventory API** — Stock per variant with adjustment operations (not just set, but increment/decrement)
- **Orders API** — Including subscription orders + third-party order import
- **Products API** — Physical, service, gift card, and download product types
- **Transactions API** — Financial transaction records separate from orders
- **Webhook Subscriptions** — Event-driven notifications (order.created, inventory.changed)

### What to Adopt
| Feature | Priority | How to Implement |
|---------|----------|-----------------|
| **Multiple product types** | HIGH | Add `productType` field: PHYSICAL, DIGITAL, SERVICE, GIFT_CARD — each with different checkout/fulfillment logic |
| **Inventory adjustments (not just set)** | MEDIUM | API: `POST /api/inventory/adjust` with reason codes (sale, restock, damage, count) + audit log |
| **Contact/Customer unification** | MEDIUM | Merge guest orders with registered accounts, marketing preferences, address book |
| **Commerce Analytics API** | HIGH | Aggregated endpoints: revenue by period, top products, conversion rate, average order value |
| **Gift cards** | MEDIUM | Gift card product type → generates redeemable codes → used as payment method at checkout |
| **Subscription orders** | LOW | Recurring billing for products on a schedule (weekly, monthly) |

---

## 4. Lovable (AI-First App Builder)

### Key Patterns
- **Built-in AI Connector** — No API key management; AI runs through secure backend edge functions
- **Gateway-based auth** — OAuth + token refresh handled automatically, credentials never exposed
- **20+ App Connectors** — Plug-and-play integrations (Stripe, Supabase, Algolia, HubSpot, Google Maps, etc.)
- **Managed secrets** — One project-level API key handles all connector auth
- **Streaming responses** — SSE for real-time AI responses (chatbot, summaries)

### What to Adopt
| Feature | Priority | How to Implement |
|---------|----------|-----------------|
| **AI-powered product descriptions** | MEDIUM | Edge function that calls an LLM to generate/improve product descriptions from basic specs |
| **AI-powered search** | HIGH | Semantic search with embeddings — "show me something for a cold office" → heaters, blankets, warm drinks |
| **Integration connector pattern** | HIGH | Define a standard `Connector` interface with `init()`, `execute()`, `webhookHandler()` for pluggable integrations |
| **Secure edge functions** | MEDIUM | Server-side API route pattern for sensitive operations (already doing this with Next.js API routes) |
| **AI chatbot for customer support** | LOW | Embed a chat widget that answers product questions using catalog data as context |

---

## Priority Roadmap: What to Build Next

### Phase 1 — Core Commerce Gaps (High Impact)
1. **Discount/Coupon system** — Model + API + checkout integration
2. **Abandoned cart recovery** — Track + email after 1h/24h
3. **Webhook event system** — Internal event bus for order.created, etc.
4. **Multiple product types** — Physical, digital, service, gift card
5. **Checkout validation pipeline** — Stock, address, fraud, minimum order

### Phase 2 — Intelligence & Growth
6. **Commerce analytics dashboard** — Revenue, orders, AOV, conversion funnel
7. **Product recommendations** — "Also bought", "Similar items"
8. **AI-powered search** — Full-text + semantic search with Algolia or custom embeddings
9. **Metafields/custom attributes** — Extensible data on any entity
10. **Fulfillment & shipment tracking** — Carrier API, tracking page

### Phase 3 — Platform Features
11. **Multi-location inventory**
12. **Gift cards & store credit**
13. **Service plugin architecture** — Shipping, tax, payment providers
14. **Draft orders / B2B quotes**
15. **Subscription/recurring orders**
16. **AI product description generator**

---

## Architecture Patterns Worth Adopting

### From Shopify: Event-Driven Webhooks
```
// Internal event system
EventBus.emit("order.created", { orderId, customerId, total })
EventBus.emit("inventory.low", { productId, variantId, remaining })
EventBus.emit("checkout.abandoned", { checkoutId, email, items })
```

### From Wix: Service Plugin Interface
```typescript
interface ShippingProvider {
  name: string;
  calculateRates(items: CartItem[], address: Address): Promise<ShippingRate[]>;
}

interface PaymentProvider {
  name: string;
  createSession(order: Order): Promise<PaymentSession>;
  handleWebhook(payload: unknown): Promise<void>;
}

interface TaxCalculator {
  calculate(items: CartItem[], address: Address): Promise<TaxResult>;
}
```

### From Squarespace: Inventory Adjustments
```typescript
// Instead of just "set stock = X", track WHY it changed
interface InventoryAdjustment {
  variantId: string;
  quantity: number; // positive = add, negative = remove
  reason: "sale" | "restock" | "damage" | "count" | "return";
  note?: string;
}
```

### From Lovable: Connector Pattern
```typescript
interface Connector {
  id: string;
  name: string;
  init(config: Record<string, string>): Promise<void>;
  execute(action: string, params: unknown): Promise<unknown>;
  handleWebhook?(req: Request): Promise<Response>;
}
```

---

## Summary

| Platform | Best Lesson | Our Biggest Gap It Fills |
|----------|-------------|------------------------|
| **Shopify** | Metafields + Webhooks + Discounts | Extensibility without schema changes |
| **Wix** | Service plugins + Abandoned cart | Pluggable providers + revenue recovery |
| **Squarespace** | Product types + Analytics + Inventory ops | Multi-type catalog + business intelligence |
| **Lovable** | AI connector + Integration gateway | Smart search + AI features + clean integration patterns |

The single highest-ROI additions to our platform right now are:
1. **Discount/coupon system** (every store needs it)
2. **Abandoned cart recovery** (directly recovers revenue)
3. **Analytics dashboard** (business intelligence)
4. **AI-powered search** (competitive advantage)
