# ⚡ Performance Optimization Guide

## 🎯 **Current Performance Issues**

### **Critical Issues (Fix Before Deploy):**

| Issue | Impact | Priority | Solution |
|-------|--------|----------|----------|
| 56.6 MB JSON file | ❌ Blocks deployment | 🔴 Critical | Remove from repo |
| 19.8 MB catalog data | ⚠️ Slow initial load | 🟠 High | Split by catalog |
| Unoptimized images | ⚠️ Slow page loads | 🟠 High | Enable Next Image optimization |
| No data pagination | ⚠️ Loads 10k+ products | 🟠 High | Implement pagination |
| Large bundle size | ⚠️ Slow TTI | 🟡 Medium | Code splitting |

---

## 🔧 **Optimization Solutions**

### **1. Remove Large Files** 🔴 Critical

**Action Required:**
```bash
# Add to .gitignore
echo "public/data/input_pdfs_analysis_v5.json" >> .gitignore
git rm --cached public/data/input_pdfs_analysis_v5.json
git commit -m "chore: Remove 56MB file from repo"
```

**Result:** -56.6 MB from deployment size

---

### **2. Implement Data Pagination** 🟠 High Priority

#### **Option A: API Route with Pagination**

Create `src/app/api/products/paginated/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import catalogProducts from '@/data/catalog_products.json';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const catalog = searchParams.get('catalog') || '';
  const search = searchParams.get('search') || '';
  
  // Filter by catalog
  let products = catalog 
    ? catalogProducts.filter(p => p.catalog === catalog)
    : catalogProducts;
  
  // Filter by search
  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(p => 
      p.name?.toLowerCase().includes(searchLower) ||
      p.sku?.toLowerCase().includes(searchLower)
    );
  }
  
  // Pagination
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedProducts = products.slice(start, end);
  
  return NextResponse.json({
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: products.length,
      totalPages: Math.ceil(products.length / limit),
      hasMore: end < products.length
    }
  });
}
```

#### **Option B: Split JSON by Catalog**

Create separate JSON files:
```bash
src/data/catalogs/
  ├── airpress-catalogus-eng.json       # 1,108 products (~2MB)
  ├── kunststof-afvoerleidingen.json    # 337 products (~500KB)
  ├── catalogus-aandrijftechniek.json   # Products (~1MB)
  ├── abs-persluchtbuizen.json          # Products (~500KB)
  └── ... (other catalogs)
```

Script to split:
```typescript
// scripts/split-catalog-by-source.ts
import fs from 'fs';
import catalogProducts from '../src/data/catalog_products.json';

const productsByCatalog = {};

catalogProducts.forEach(product => {
  const catalog = product.catalog || 'uncategorized';
  if (!productsByCatalog[catalog]) {
    productsByCatalog[catalog] = [];
  }
  productsByCatalog[catalog].push(product);
});

// Write separate files
Object.entries(productsByCatalog).forEach(([catalog, products]) => {
  const filename = `src/data/catalogs/${catalog}.json`;
  fs.writeFileSync(filename, JSON.stringify(products, null, 2));
  console.log(`✅ Created ${filename} with ${products.length} products`);
});
```

---

### **3. Enable Image Optimization** 🟠 High Priority

Update `next.config.js`:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    // Enable image optimization
    unoptimized: process.env.NODE_ENV === 'development', // Only in dev
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    
    // If using external images
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'your-cdn.com',
      },
    ],
  },
  
  // Enable production browser source maps
  productionBrowserSourceMaps: false, // Disable to reduce bundle size
  
  // Compress output
  compress: true,
  
  // Optimize fonts
  optimizeFonts: true,
  
  // SWC minification
  swcMinify: true,
};

module.exports = nextConfig;
```

---

### **4. Implement Dynamic Imports** 🟡 Medium Priority

For heavy components:
```typescript
// Instead of:
import PDFViewer from '@/components/PDFViewerWithHighlight';

// Use:
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(
  () => import('@/components/PDFViewerWithHighlight'),
  {
    loading: () => <div>Loading PDF viewer...</div>,
    ssr: false // Disable server-side rendering for this component
  }
);
```

Apply to:
- PDF Viewer
- Image galleries
- Large charts/graphs
- Heavy third-party components

---

### **5. Add React Query for Caching** 🟡 Medium Priority

Install:
```bash
npm install @tanstack/react-query
```

Setup provider:
```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        cacheTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

Use in components:
```typescript
import { useQuery } from '@tanstack/react-query';

function ProductList({ catalog }) {
  const { data, isLoading } = useQuery({
    queryKey: ['products', catalog],
    queryFn: () => fetch(`/api/products?catalog=${catalog}`).then(r => r.json()),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  // ... render products
}
```

---

### **6. Implement Virtual Scrolling** 🟡 Medium Priority

For large product lists, use `@tanstack/react-virtual` (already installed):

```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

function VirtualProductList({ products }) {
  const parentRef = useRef(null);
  
  const virtualizer = useVirtualizer({
    count: products.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 350, // Estimated height of each product card
    overscan: 5, // Render 5 extra items above/below viewport
  });
  
  return (
    <div ref={parentRef} style={{ height: '800px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <div
            key={virtualRow.index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            <ProductCard product={products[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Result:** Only render visible products + buffer, dramatically improves performance with 1000+ products.

---

### **7. Add Service Worker for Offline Support** 🟢 Low Priority

Create `public/sw.js`:
```javascript
const CACHE_NAME = 'dema-webshop-v1';
const urlsToCache = [
  '/',
  '/catalog',
  '/api/products',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
```

Register in `_app.tsx`:
```typescript
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);
```

---

## 📊 **Performance Metrics**

### **Before Optimization:**
```
File Sizes:
├── catalog_products.json: 19.8 MB
├── input_pdfs_analysis_v5.json: 56.6 MB
└── Total deployed: ~80 MB

Loading Times:
├── Initial page load: ~8-12s
├── Catalog page: ~5-8s
└── Product details: ~2-3s

Lighthouse Score:
├── Performance: ~40
├── Accessibility: ~85
├── Best Practices: ~75
└── SEO: ~80
```

### **After Optimization (Target):**
```
File Sizes:
├── Removed input_pdfs_analysis: -56.6 MB
├── Split catalogs: ~2 MB per catalog
└── Total deployed: ~25 MB

Loading Times:
├── Initial page load: < 2s
├── Catalog page: < 1.5s
└── Product details: < 1s

Lighthouse Score:
├── Performance: > 90
├── Accessibility: > 95
├── Best Practices: > 90
└── SEO: > 90
```

---

## 🚀 **Implementation Checklist**

### **Phase 1: Critical (Before Deploy)** 🔴
- [ ] Remove 56.6 MB file from repo
- [ ] Add large files to .gitignore
- [ ] Test build without large files
- [ ] Verify all functionality works

### **Phase 2: High Priority (Week 1)** 🟠
- [ ] Split JSON by catalog OR implement pagination API
- [ ] Enable image optimization
- [ ] Add dynamic imports for heavy components
- [ ] Test loading times

### **Phase 3: Medium Priority (Week 2)** 🟡
- [ ] Implement React Query caching
- [ ] Add virtual scrolling for product lists
- [ ] Code splitting for routes
- [ ] Add loading skeletons

### **Phase 4: Low Priority (Week 3+)** 🟢
- [ ] Service worker for offline support
- [ ] Advanced caching strategies
- [ ] Performance monitoring
- [ ] A/B testing

---

## 🧪 **Testing Performance**

### **1. Local Testing**

```bash
# Build production version
npm run build

# Start production server
npm start

# Measure performance
npm install -g lighthouse
lighthouse http://localhost:3000 --view
```

### **2. Analyze Bundle**

```bash
# Add to package.json
"analyze": "ANALYZE=true next build"

# Install analyzer
npm install @next/bundle-analyzer

# Run analysis
npm run analyze
```

### **3. Monitor in Production**

Use Vercel Analytics or add:
```typescript
// src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

---

## 📈 **Expected Results**

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Bundle Size** | ~80 MB | ~25 MB | **-69%** |
| **Initial Load** | 8-12s | < 2s | **-83%** |
| **TTI** | ~10s | < 3s | **-70%** |
| **Lighthouse** | 40 | > 90 | **+125%** |
| **User Satisfaction** | ⚠️ | ✅ | **Excellent** |

---

## 🎯 **Next Steps**

1. ✅ Read this guide
2. ✅ Implement Phase 1 (Critical)
3. ✅ Deploy to Vercel for testing
4. ✅ Monitor performance
5. ✅ Implement Phase 2 based on results
6. ✅ Iterate and optimize

---

**Status:** ✅ READY TO OPTIMIZE  
**Time Required:** 4-6 hours  
**Impact:** Massive performance improvement  
**Priority:** High - Do before public launch
