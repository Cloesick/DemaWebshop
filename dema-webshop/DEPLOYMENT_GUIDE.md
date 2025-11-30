# 🚀 DemaWebshop Deployment Guide

## 📋 **Pre-Deployment Checklist**

### **✅ Performance Optimization (Critical)**

Before deploying, optimize these large data files:

| File | Current Size | Issue | Solution |
|------|--------------|-------|----------|
| `public/data/input_pdfs_analysis_v5.json` | 56.6 MB | ❌ Too large for deployment | Move to `.gitignore` |
| `src/data/catalog_products_enriched.json` | 32.6 MB | ⚠️ Large | Consider pagination |
| `src/data/catalog_products.json` | 19.8 MB | ⚠️ Moderate | Split by catalog |
| `public/data/products_for_shop.json` | 11.5 MB | ✅ Acceptable | Keep |

---

## 🔧 **Performance Optimizations**

### **1. Remove Unnecessary Files from Deployment**

```bash
# Add to .gitignore (already done)
public/data/input_pdfs_analysis_v5.json
**/catalog_products_backup*.json
```

### **2. Implement Data Pagination** ⭐ **High Priority**

Current issue: Loading 10,000+ products at once.

**Solution A: API-based Pagination** (Recommended)
```typescript
// src/app/api/products/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  const catalog = searchParams.get('catalog');
  
  const products = await getProducts({ page, limit, catalog });
  
  return Response.json({
    products: products.slice((page - 1) * limit, page * limit),
    total: products.length,
    page,
    totalPages: Math.ceil(products.length / limit)
  });
}
```

**Solution B: Split JSON by Catalog**
```javascript
// Split into smaller files
src/data/catalogs/
  ├── airpress.json (1,108 products ~2MB)
  ├── kunststof.json (337 products ~500KB)
  ├── aandrijftechniek.json (~1MB)
  └── ...
```

### **3. Enable Image Optimization**

Update `next.config.js`:
```javascript
const nextConfig = {
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    unoptimized: false, // Enable optimization for production
  },
};
```

### **4. Implement Code Splitting**

```javascript
// Dynamic imports for heavy components
const PDFViewer = dynamic(() => import('@/components/PDFViewerWithHighlight'), {
  loading: () => <p>Loading PDF viewer...</p>,
  ssr: false
});
```

### **5. Add Compression**

Install compression middleware:
```bash
npm install compression
```

Add to middleware:
```typescript
// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const response = NextResponse.next();
  response.headers.set('Content-Encoding', 'gzip');
  return response;
}
```

---

## 🌐 **Hosting Platform Comparison**

### **Option 1: Vercel** ⭐ **Recommended**

**Pros:**
- ✅ Built by Next.js creators
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Edge network (global CDN)
- ✅ Instant rollbacks
- ✅ Preview deployments for PRs
- ✅ Built-in analytics
- ✅ Serverless functions included

**Cons:**
- ⚠️ 100GB bandwidth limit (free tier)
- ⚠️ Function execution time: 10s (hobby), 60s (pro)

**Pricing:**
- **Free (Hobby):** Perfect for preview
  - 100GB bandwidth/month
  - 100 deployments/day
  - Serverless function executions: 100 hours/month
- **Pro:** $20/month
  - 1TB bandwidth
  - Unlimited deployments
  - Advanced analytics

**Best For:** ✅ Quick deployment, testing, and production

---

### **Option 2: Netlify**

**Pros:**
- ✅ Good Next.js support
- ✅ Free tier generous
- ✅ Built-in forms
- ✅ Split testing
- ✅ Easy custom domains

**Cons:**
- ⚠️ Build minutes limited (free: 300 min/month)
- ⚠️ Function execution time: 10s (free)
- ⚠️ Requires @netlify/plugin-nextjs

**Pricing:**
- **Free (Starter):**
  - 100GB bandwidth/month
  - 300 build minutes/month
- **Pro:** $19/month
  - 1TB bandwidth

**Best For:** ⚠️ Good alternative, but Vercel is better for Next.js

---

### **Option 3: DigitalOcean App Platform**

**Pros:**
- ✅ Good pricing
- ✅ Managed databases included
- ✅ Simple scaling
- ✅ Predictable costs

**Cons:**
- ⚠️ More manual setup
- ⚠️ Slower deployment than Vercel

**Pricing:**
- **Basic:** $5/month
  - 1 vCPU, 512MB RAM
  - 40GB bandwidth/month
- **Professional:** $12/month
  - 1 vCPU, 1GB RAM
  - 100GB bandwidth/month

**Best For:** ⚠️ Budget-conscious, need database

---

### **Option 4: AWS Amplify**

**Pros:**
- ✅ Full AWS integration
- ✅ Powerful scaling
- ✅ Custom domains

**Cons:**
- ⚠️ Complex setup
- ⚠️ Pay-as-you-go (unpredictable)
- ⚠️ Steeper learning curve

**Best For:** ⚠️ Already using AWS ecosystem

---

### **Option 5: Railway**

**Pros:**
- ✅ Simple deployment
- ✅ Good free tier
- ✅ Database included
- ✅ Nice UI

**Cons:**
- ⚠️ Smaller company
- ⚠️ Limited free tier resources

**Pricing:**
- **Free (Developer):**
  - $5 credit/month
  - No credit card required
- **Hobby:** $5/month + usage
- **Pro:** $20/month + usage

**Best For:** ✅ Good Vercel alternative

---

## 🏆 **Recommendation: Use Vercel**

**Why Vercel:**
1. ✅ **Zero-config** - Just connect GitHub and deploy
2. ✅ **Best Next.js support** - Built by the same team
3. ✅ **Free tier perfect** for preview/testing
4. ✅ **Automatic optimization** - Edge caching, image optimization
5. ✅ **Instant preview** - Every PR gets a preview URL
6. ✅ **Production-ready** - Used by major companies

---

## 📦 **Deployment Steps (Vercel)**

### **Step 1: Prepare Your Repository**

```bash
# 1. Commit all changes
git add .
git commit -m "feat: Prepare for production deployment"

# 2. Push to GitHub
git push origin main
```

### **Step 2: Create Vercel Account**

1. Go to [vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Import your repository

### **Step 3: Configure Project**

```yaml
# Build Settings (auto-detected)
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Development Command: npm run dev
```

### **Step 4: Environment Variables**

Add these in Vercel dashboard:

```bash
# Email (if using Resend)
RESEND_API_KEY=your_key_here

# Database (if using Prisma)
DATABASE_URL=your_database_url

# NextAuth (if using authentication)
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_secret_here

# Stripe (if using payments)
STRIPE_PUBLIC_KEY=your_public_key
STRIPE_SECRET_KEY=your_secret_key
```

### **Step 5: Deploy**

Click **Deploy** button!

Your site will be live at: `https://your-project-name.vercel.app`

---

## ⚡ **Performance Benchmarks (Target)**

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| **First Contentful Paint** | < 1.8s | TBD | 🔄 |
| **Time to Interactive** | < 3.8s | TBD | 🔄 |
| **Speed Index** | < 3.4s | TBD | 🔄 |
| **Total Blocking Time** | < 200ms | TBD | 🔄 |
| **Largest Contentful Paint** | < 2.5s | TBD | 🔄 |
| **Cumulative Layout Shift** | < 0.1 | TBD | 🔄 |

---

## 🔍 **Post-Deployment Monitoring**

### **1. Lighthouse Score**

Run Lighthouse after deployment:
```bash
npm install -g lighthouse
lighthouse https://your-site.vercel.app --view
```

**Target Scores:**
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90

### **2. Vercel Analytics**

Enable in Vercel dashboard:
- Real User Monitoring
- Core Web Vitals
- Page views and visits

### **3. Error Tracking**

Consider adding:
- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay
- [Vercel Analytics](https://vercel.com/analytics) - Built-in

---

## 🚨 **Common Issues & Solutions**

### **Issue 1: Build Fails - Out of Memory**

**Solution:**
```json
// package.json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

### **Issue 2: Large Bundle Size**

**Solution:**
```bash
# Analyze bundle
npm run build
# Check .next/server/pages for large files
```

Then:
- Remove unused dependencies
- Use dynamic imports
- Split large JSON files

### **Issue 3: Slow API Routes**

**Solution:**
- Implement caching
- Use Redis for frequently accessed data
- Move heavy processing to background jobs

### **Issue 4: Images Not Loading**

**Solution:**
```javascript
// next.config.js
module.exports = {
  images: {
    domains: ['your-image-domain.com'],
  },
};
```

---

## 📊 **Cost Estimate (First Month)**

### **Vercel Free Tier:**
- **Hosting:** $0
- **Bandwidth:** 100GB (free)
- **Function Executions:** Unlimited
- **Team Members:** 1

**Expected Cost:** **$0/month** ✅

### **When to Upgrade to Pro ($20/month):**
- > 100GB bandwidth/month
- Need team collaboration
- Want advanced analytics
- Need priority support

---

## 🎯 **Next Steps After Deployment**

### **Week 1: Monitor & Optimize**
1. ✅ Monitor Vercel Analytics
2. ✅ Run Lighthouse tests
3. ✅ Fix any performance issues
4. ✅ Test all functionality

### **Week 2: SEO & Marketing**
1. ✅ Add sitemap.xml
2. ✅ Configure robots.txt
3. ✅ Set up Google Analytics
4. ✅ Submit to Google Search Console

### **Week 3: Advanced Features**
1. ✅ Implement caching
2. ✅ Add rate limiting
3. ✅ Set up monitoring
4. ✅ Configure backups

---

## 🔒 **Security Checklist**

Before going live:

- [ ] Environment variables secure
- [ ] API routes have rate limiting
- [ ] CORS configured properly
- [ ] Input validation on all forms
- [ ] HTTPS enforced
- [ ] Headers configured (CSP, X-Frame-Options, etc.)
- [ ] Dependencies updated
- [ ] No sensitive data in git history

---

## 📱 **Custom Domain Setup**

### **Step 1: Buy Domain**
- Namecheap, Google Domains, or Vercel Domains

### **Step 2: Add to Vercel**
1. Go to Project Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### **Step 3: Configure DNS**
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

**Propagation:** 24-48 hours

---

## 🎉 **You're Ready to Deploy!**

**Timeline:**
- Preparation: 1-2 hours
- Deployment: 5-10 minutes
- Testing: 1 hour
- **Total:** ~3 hours to production! 🚀

**Support:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Community: https://github.com/vercel/next.js/discussions

---

**Status:** ✅ READY FOR DEPLOYMENT  
**Recommended Platform:** Vercel  
**Expected Cost:** $0-20/month  
**Time to Live:** < 10 minutes
