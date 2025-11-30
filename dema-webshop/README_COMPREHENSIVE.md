# 🏭 DemaWebshop - Complete Documentation

> **Comprehensive guide to the DemaWebshop industrial e-commerce platform**

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Key Features](#key-features)
4. [Tech Stack](#tech-stack)
5. [Project Structure](#project-structure)
6. [Data Architecture](#data-architecture)
7. [Component System](#component-system)
8. [Deployment](#deployment)
9. [Performance](#performance)
10. [Development Guide](#development-guide)
11. [API Reference](#api-reference)
12. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

**DemaWebshop** is a modern B2B e-commerce platform designed for industrial equipment sales. It features:

- **9,913 products** across 15+ catalogs
- **Universal specification system** with 25+ property types
- **Intelligent search** with real-time filtering
- **PDF catalog integration** with page highlighting
- **Quote request system** instead of traditional cart
- **Responsive design** optimized for desktop and mobile

**Built for:** Industrial suppliers, equipment dealers, B2B marketplaces

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 18+ 
- npm or yarn
- Git

### **Installation**

```bash
# 1. Clone repository
git clone https://github.com/Cloesick/DemaWebshop.git
cd DemaWebshop/dema-webshop

# 2. Install dependencies
npm install

# 3. Run development server
npm run dev

# 4. Open browser
# Navigate to http://localhost:3000
```

**⏱️ Setup time:** < 5 minutes

### **First Steps**

1. **Browse catalogs**: http://localhost:3000/catalog
2. **Search products**: Use the search bar
3. **View product**: Click any product card
4. **Request quote**: Add products to quote list

---

## ✨ Key Features

### **1. Universal Specification System**

Intelligent badge display system that adapts to each product type:

**Supported Properties (25+):**
- ⚡ Power (HP/kW combined)
- 🔌 Voltage/Frequency/Phase
- 🔧 Pressure (range or single)
- 💨 Flow rates (intake/outtake)
- 🗜️ Volume/Capacity
- 📏 Dimensions (multiple formats)
- ⚖️ Weight
- 🔩 Mechanical specs (pistons, RPM)
- 🌡️ Temperature ranges
- 🔬 Materials
- ...and more

**Smart Features:**
- ✅ Automatic property combination (HP + kW shown together)
- ✅ Fallback logic for missing data
- ✅ No duplicate values
- ✅ Catalog-agnostic (works for all product types)
- ✅ Color-coded for easy scanning

### **2. Advanced Product Search**

- Real-time search as you type
- Filter by catalog
- Filter by category
- Search by SKU, name, or description
- Instant results

### **3. PDF Catalog Integration**

- View original PDF catalogs in-app
- Automatic page highlighting for products
- Direct links to product pages
- Navigate between products and PDFs

### **4. Quote Request System**

Instead of traditional shopping cart:
- Add products to quote list
- Request bulk quotes via email
- No payment processing required
- Perfect for B2B sales

### **5. Responsive Design**

- Mobile-optimized
- Grid and list views
- Touch-friendly
- Fast loading

---

## 🛠️ Tech Stack

### **Core**
- **Next.js 16** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5.2** - Type safety
- **Tailwind CSS 3.4** - Utility-first styling

### **UI Components**
- **Lucide React** - Modern icons
- **@heroicons/react** - Additional icons
- **@radix-ui** - Accessible primitives
- **react-hot-toast** - Notifications

### **Data & State**
- **Zustand** - Lightweight state management
- **@tanstack/react-virtual** - Virtual scrolling
- **lodash** - Utility functions

### **PDF Integration**
- **pdfjs-dist 5.4** - PDF rendering
- Custom highlight system

### **Development**
- **ESLint** - Code linting
- **Autoprefixer** - CSS compatibility
- **PostCSS** - CSS processing

### **Optional (Ready but Not Implemented)**
- **Prisma** - Database ORM
- **NextAuth** - Authentication
- **Stripe** - Payments
- **Resend** - Email service

---

## 📁 Project Structure

```
dema-webshop/
├── public/                      # Static assets
│   ├── images/                  # Product images by catalog
│   │   ├── aandrijftechniek/
│   │   ├── airpress/
│   │   └── ...
│   └── data/                    # Public data files
│       ├── products_for_shop.json (11.5 MB)
│       └── Product_images.json
│
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── page.tsx            # Home page
│   │   ├── catalog/            # Catalog pages
│   │   ├── product/[sku]/      # Product detail pages
│   │   └── api/                # API routes
│   │       ├── products/       # Product API
│   │       ├── search/         # Search API
│   │       └── quote-request/  # Quote API
│   │
│   ├── components/              # React components
│   │   ├── CatalogProductCard.tsx      # Product cards
│   │   ├── UniversalSpecifications.tsx # Spec badges
│   │   ├── PDFViewerWithHighlight.tsx  # PDF viewer
│   │   ├── QuoteListSimplified.tsx     # Quote system
│   │   └── layout/             # Layout components
│   │
│   ├── contexts/                # React contexts
│   │   └── QuoteContext.tsx    # Quote state management
│   │
│   ├── data/                    # Data files
│   │   ├── catalog_products.json (19.8 MB)
│   │   └── catalog_index.json
│   │
│   └── utils/                   # Utility functions
│       └── productDisplayConfig.ts
│
├── scripts/                     # Utility scripts
│   ├── active/                  # Active utilities
│   └── archive/                 # Historical scripts
│
├── docs/                        # Documentation
│   ├── DEPLOYMENT_GUIDE.md
│   ├── PERFORMANCE_OPTIMIZATION.md
│   ├── CLEANUP_COMPLETE.md
│   ├── UNIVERSAL_SPECIFICATIONS.md
│   └── ...
│
└── Configuration files
    ├── next.config.js
    ├── tailwind.config.js
    ├── tsconfig.json
    └── package.json
```

---

## 💾 Data Architecture

### **Catalog Products (19.8 MB)**

Main product database:
```json
{
  "sku": "36744-E",
  "name": "HL 150-24 Compressor",
  "catalog": "airpress-catalogus-eng",
  "category": "Compressors",
  "images": ["/images/products/airpress/..."],
  
  // Universal properties (25+ types)
  "product_code": "HL 150-24",
  "power_hp": 1.5,
  "power_kw": 1.1,
  "voltage_v": 230,
  "frequency_hz": 50,
  "phase": 1,
  "intake_l_min": 150,
  "outtake_l_min": 120,
  "volume_l": 24,
  "pressure_min_bar": 6,
  "pressure_max_bar": 8,
  "piston_count": 1,
  "rpm": 2800,
  "noise_db": 93,
  "dimensions_mm": "580 × 255 × 580",
  "weight_kg": 25
}
```

### **Catalog Breakdown**

| Catalog | Products | Size | Key Properties |
|---------|----------|------|----------------|
| **airpress-catalogus-eng** | 1,108 | ~2 MB | Power, pressure, flow |
| **catalogus-aandrijftechniek** | 2,894 | ~5 MB | Bearings, specs |
| **kunststof-afvoerleidingen** | 337 | ~500 KB | Diameter, length, angle |
| **abs-persluchtbuizen** | 246 | ~400 KB | Diameter, pressure |
| **makita-catalogus** | 1,658 | ~3 MB | Power, voltage |
| **Other catalogs** | 3,670 | ~9 MB | Various |

**Total:** 9,913 products

---

## 🧩 Component System

### **Core Components**

#### **1. UniversalSpecifications**
Displays product specifications with intelligent badge system.

```typescript
// Usage
<UniversalSpecifications 
  product={product} 
  compact={false} // or true for grid view
/>
```

**Features:**
- Automatic property detection
- Smart combinations (HP+kW, V+Hz+Phase)
- Fallback for missing data
- No duplicates
- Color-coded badges

#### **2. CatalogProductCard**
Product card component with grid/list views.

```typescript
<CatalogProductCard
  product={product}
  viewMode="grid" // or "list"
  className="custom-class"
/>
```

#### **3. PDFViewerWithHighlight**
PDF viewer with product page highlighting.

```typescript
<PDFViewerWithHighlight
  pdfUrl="/pdfs/catalog.pdf"
  highlightPages={[5, 6]}
  productSku="36744-E"
/>
```

#### **4. QuoteListSimplified**
Quote management system.

```typescript
// Global context
const { items, addItem, removeItem, clearAll } = useQuote();

// Add to quote
addItem(product);
```

---

## 🚀 Deployment

### **Recommended: Vercel** ⭐

**Why Vercel:**
- ✅ Zero-config deployment
- ✅ Built by Next.js team
- ✅ Free tier perfect for start
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Preview deployments

**Steps:**

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import repository
   - Click Deploy

3. **Live in < 2 minutes** 🎉

**Cost:** $0/month (free tier)

### **Performance Before Deploy**

**Critical:** Remove large files:
```bash
# Add to .gitignore
echo "public/data/input_pdfs_analysis_v5.json" >> .gitignore
git rm --cached public/data/input_pdfs_analysis_v5.json
git commit -m "chore: Remove 56MB file"
```

**Optimization checklist:**
- [ ] Remove 56.6 MB file
- [ ] Enable image optimization (production)
- [ ] Test build: `npm run build`
- [ ] Verify all features work

**See:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete guide

---

## ⚡ Performance

### **Current Status**

| Metric | Status | Action Needed |
|--------|--------|---------------|
| **Bundle Size** | ⚠️ ~80 MB | Remove large JSON |
| **Initial Load** | ⚠️ 8-12s | Implement pagination |
| **Images** | ⚠️ Unoptimized | Enable for production |
| **Code Splitting** | ✅ Partial | Add dynamic imports |

### **Optimization Priorities**

**Phase 1 (Critical):**
1. Remove 56.6 MB file from repo
2. Enable image optimization
3. Test production build

**Phase 2 (High):**
1. Implement pagination API
2. Add React Query caching
3. Virtual scrolling for lists

**Phase 3 (Medium):**
1. Code splitting
2. Service worker
3. Advanced caching

**Expected Results:**
- Bundle: 80 MB → 25 MB (-69%)
- Load time: 8-12s → <2s (-83%)
- Lighthouse: 40 → >90 (+125%)

**See:** [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

---

## 👨‍💻 Development Guide

### **Development Scripts**

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint

# Sync images (if needed)
npm run sync-images
```

### **Code Style**

- **TypeScript** for type safety
- **Functional components** with hooks
- **Tailwind CSS** for styling
- **ESLint** for code quality

### **Adding New Features**

#### **Add New Catalog**

1. Add products to `catalog_products.json`
2. Add catalog images to `public/images/products/[catalog-name]/`
3. Test search and filtering
4. Verify UniversalSpecifications displays correctly

#### **Add New Property Type**

1. Update `UniversalSpecifications.tsx`:
   ```typescript
   {product.new_property && (
     <span className={`${badgeClass} bg-color-50 text-color-800`}>
       🔧 {product.new_property} unit
     </span>
   )}
   ```

2. Properties automatically work across all catalogs!

### **Testing**

```bash
# Test build
npm run build && npm start

# Test on localhost:3000
# Verify:
# - All pages load
# - Search works
# - Quote system works
# - PDF viewer loads
```

---

## 📖 API Reference

### **Products API**

#### **GET /api/products**
Get all products or filter by catalog.

```typescript
// Request
GET /api/products?catalog=airpress-catalogus-eng

// Response
{
  "products": [...],
  "total": 1108,
  "catalog": "airpress-catalogus-eng"
}
```

#### **GET /api/products/[sku]**
Get single product by SKU.

```typescript
// Request
GET /api/products/36744-E

// Response
{
  "sku": "36744-E",
  "name": "HL 150-24 Compressor",
  // ... product data
}
```

### **Search API**

#### **GET /api/search/suggestions**
Get search suggestions.

```typescript
// Request
GET /api/search/suggestions?query=compressor

// Response
{
  "suggestions": [
    "HL 150-24 Compressor",
    "HL 310-25 Compressor",
    // ...
  ]
}
```

### **Quote API**

#### **POST /api/quote-request**
Submit quote request.

```typescript
// Request
POST /api/quote-request
{
  "name": "John Doe",
  "email": "john@example.com",
  "company": "ACME Corp",
  "products": [
    { "sku": "36744-E", "quantity": 2 },
    // ...
  ]
}

// Response
{
  "success": true,
  "message": "Quote request sent"
}
```

---

## 🐛 Troubleshooting

### **Build Fails**

**Error:** Out of memory

**Solution:**
```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

### **Images Not Loading**

**Solution:** Check file paths in `public/images/products/`

### **Slow Loading**

**Solution:** See [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)

### **PDF Viewer Not Working**

**Solution:** Ensure `pdfjs-dist` is installed:
```bash
npm install pdfjs-dist@5.4.394
```

---

## 📚 Documentation

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - Performance tuning
- **[UNIVERSAL_SPECIFICATIONS.md](./UNIVERSAL_SPECIFICATIONS.md)** - Specs system docs
- **[CLEANUP_COMPLETE.md](./CLEANUP_COMPLETE.md)** - Project cleanup summary
- **[SCRIPT_MERGE_PLAN.md](./SCRIPT_MERGE_PLAN.md)** - Script consolidation

---

## 🤝 Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

MIT License - see LICENSE file

---

## 🙏 Acknowledgments

- **Next.js Team** - Amazing framework
- **Vercel** - Deployment platform
- **React Team** - UI library
- **Tailwind CSS** - Styling system

---

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/Cloesick/DemaWebshop/issues)
- **Discussions:** [GitHub Discussions](https://github.com/Cloesick/DemaWebshop/discussions)

---

**Status:** ✅ Production Ready  
**Version:** 1.0.0  
**Last Updated:** November 28, 2025  
**Maintainer:** Cloesick

**Deploy now:** [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2FCloesick%2FDemaWebshop)
