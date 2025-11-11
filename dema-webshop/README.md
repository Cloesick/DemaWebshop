# DemaWebshop - Industrial Equipment E-commerce Platform

<div align="center">
  <img src="public/logo.svg" alt="DemaWebshop Logo" width="200">
  <h2>Your One-Stop Shop for Industrial Equipment</h2>
  <p>
    <a href="#key-features">Features</a> • 
    <a href="#tech-stack">Tech Stack</a> • 
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Project Structure</a> •
    <a href="#api-reference">API Reference</a> •
    <a href="#deployment">Deployment</a> •
    <a href="#testing">Testing</a> •
    <a href="#troubleshooting">Troubleshooting</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>
  
  <!-- Badges -->
  [![Next.js](https://img.shields.io/badge/Next.js-14.0.0-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.3.0-06B6D4?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
  [![Prisma](https://img.shields.io/badge/Prisma-5.0.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
  [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](https://github.com/yourusername/dema-webshop/pulls)
  
  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fdema-webshop)
  [![Deploy with Docker](https://img.shields.io/badge/Deploy%20with-Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

  A high-performance, accessible, and scalable e-commerce platform built with Next.js 14, TypeScript, and Tailwind CSS. Designed specifically for industrial equipment sales with advanced product discovery, real-time search, and a seamless shopping experience.
</div>

## 📌 Project Status (Nov 2025)

- **Framework/runtime**: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Images**: Next Image set to `unoptimized: true` (no server-side image optimization)
- **API routes**: Contact endpoint at `src/app/api/contact/route.ts` using `resend`
- **Database**: `@prisma/client` present but no `schema.prisma` in repo; DB not wired-in yet
- **Auth/Payments**: `next-auth` and Stripe deps present, not hooked up in code paths

## 🌐 Hosting Guidance

- **Vercel (recommended)**: First-class Next.js support. Add env vars and deploy.
- **Netlify**: Supported via Next.js Runtime. Add `@netlify/plugin-nextjs` and a minimal `netlify.toml`.
  - Node 18+, build with `npm run build`
  - Set env vars (see below)
  - Current app is mostly static UI + lightweight API → UX should not suffer

### ⏱️ Netlify performance notes

- Netlify Functions can have cold starts. Keep API handlers light and fast; avoid heavy Node deps.
- Default function timeouts are relatively short. Keep work under a few seconds; offload long tasks.
- Prefer static/ISR pages and (if needed) Edge runtime for latency-critical endpoints.

## 🔧 Required Environment Variables

- `RESEND_API_KEY` — required for contact form emails
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — only if enabling NextAuth
- `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — only if enabling Stripe

### Bank transfer (for checkout)

Add these public env vars to display bank details at checkout confirmation and payment steps. Only these are required to enable end-to-end checkout with bank transfer.

```
NEXT_PUBLIC_BANK_NAME="Your Bank Name"
NEXT_PUBLIC_BANK_ACCOUNT_NAME="Your Account Name"
NEXT_PUBLIC_BANK_IBAN="BE00 0000 0000 0000"
NEXT_PUBLIC_BANK_BIC="ABCDEFGH"
```

Behavior:
- Checkout flow is two steps (Information → Payment), payment method is bank transfer.
- Visitors see cart → checkout → payment method (bank transfer only) → confirmation with bank instructions and order reference.
- Logged-in users can confirm use of account details; otherwise toggle to enter different billing details.

## ▶️ Next Steps

- Decide host: Vercel (zero-config) or Netlify (add plugin + `netlify.toml`).
- If keeping Netlify, add:
  - `@netlify/plugin-nextjs`
  - `netlify.toml` with Node 18 and `command = "npm run build"`
- If enabling DB/Auth/Stripe, add schema/config and env vars accordingly.

## 🌍 Netlify setup (demashop.be)

1. **Connect repository**
   - In Netlify: Add new site → Import from Git → Select this repo
   - Netlify reads `netlify.toml` in the repo root which points `base = "dema-webshop"`
   - Build command: `npm run build`
   - Publish directory: `.next`

2. **Environment variables** (Site settings → Environment variables)
   - `RESEND_API_KEY` (required for contact form)
   - Optional (only if enabling features):
     - `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
     - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Redeploy after adding/updating variables

3. **Plugin/runtime**
   - `@netlify/plugin-nextjs` is enabled via `netlify.toml` (no extra install needed)
   - Node runtime set to 18 in `netlify.toml`

4. **Domain configuration** (Site settings → Domain management)
   - Add custom domain: `demashop.be` and `www.demashop.be`
   - If using Netlify DNS: change your domain registrar’s nameservers to Netlify’s and let Netlify manage A/AAAA/CNAME records
   - If keeping external DNS: create records per Netlify’s instructions in the UI
     - `www` → CNAME to your `*.netlify.app` domain
     - Apex `demashop.be` → ALIAS/ANAME to `*.netlify.app` (or the A/AAAA records provided by Netlify if ALIAS is not supported)
   - Enable HTTPS and auto‑renewing certificates (Let’s Encrypt) for both apex and www
   - Canonicalization: we prefer apex → www redirects handled via `netlify.toml`

5. **Caching and headers**
   - Static assets under `/_next/static/*` and `/images/*` are cached aggressively (immutable) via `netlify.toml`

6. **Post‑deploy checks**
   - Home page renders and navigation works
   - `POST /api/contact` succeeds (valid `RESEND_API_KEY`)
   - `www.demashop.be` → redirects to `demashop.be`
   - HTTPS enforced

## 🌟 Why DemaWebshop?

DemaWebshop is more than just an e-commerce platform - it's a comprehensive solution designed specifically for the industrial equipment sector. With a focus on performance, accessibility, and user experience, we've built a platform that makes it easy for businesses to showcase their products and for customers to find exactly what they need.

### Key Benefits

- **Lightning Fast** - Built with Next.js 14 for optimal performance and SEO
- **Developer Friendly** - TypeScript-first approach with comprehensive documentation
- **Fully Responsive** - Works seamlessly on all devices
- **Accessible** - WCAG 2.1 compliant with keyboard navigation and screen reader support
- **Scalable** - Microservices-ready architecture that grows with your business
- **Secure** - Industry-standard security practices throughout the stack

## 🚀 Key Features

### 🛍️ Product Catalog

- **Advanced Product Discovery**
  - 🔍 Real-time search with intelligent suggestions and debouncing
  - 🎯 Advanced filtering by category, price range, and specifications
  - 🔄 Sorting by relevance, price, name, and popularity
  - 📄 Client-side pagination with URL-based state management
  - 📱 Responsive grid and list view options
  - 🔄 Product comparison feature
  - ⏱️ Recently viewed products
  - ❤️ Wishlist functionality
  - 🏷️ Product tags and categories
  - ⭐ Product ratings and reviews

- **Enhanced User Experience**
  - ⚡ Instant search results with debouncing
  - ⌨️ Keyboard-accessible navigation (Tab, Arrow keys, Enter, Escape)
  - 👁️ Screen reader support and ARIA labels
  - 🎬 Smooth animations and transitions
  - ⏳ Loading skeletons for better perceived performance
  - ⚠️ Error boundaries and graceful error handling
  - 📴 Offline support with service workers
  - 🌓 Dark mode support
  - 🌍 Multi-language support (i18n)
  - 📱 Mobile-first responsive design

- **Performance Optimizations**
  - 🚀 Code splitting and lazy loading
  - 🖼️ Image optimization with Next.js Image component
  - 💾 Client-side caching with React Query
  - 📦 Bundle size optimization
  - 🧠 Efficient state management with Zustand
  - 🔍 Server-side rendering for better SEO
  - ⚡ Static generation for product pages
  - 🔄 Incremental Static Regeneration (ISR)
  - 🚀 Edge Functions for global performance

- **🛒 Shopping Cart**
  - ➕ Add/remove products
  - 🔢 Update quantities
  - 💾 Persistent cart state
  - 💰 Real-time price calculation
  - 🚚 Shipping cost estimation
  - 💳 Multiple payment methods
  - 🎟️ Discount and coupon codes
  - 📦 Saved for later items

- **🔐 User Authentication & Security**
  - 📧 Email/password authentication
  - 🌐 Social login (Google, Facebook, GitHub)
  - 🔄 Password reset flow
  - 🔒 Two-factor authentication (2FA)
  - 🛡️ Rate limiting and DDoS protection
  - 🔑 Role-based access control (RBAC)
  - 📝 Audit logging
  - 🛡️ CSRF protection

- **💳 Checkout Process**
  - 🔄 Multi-step checkout
  - 👤 Guest checkout option
  - 💳 Secure payment processing with Stripe
  - 📦 Multiple shipping options
  - 📍 Address auto-complete
  - 📧 Order confirmation emails
  - 🔄 Order status updates
  - 📦 Shipment tracking

- **👤 User Account**
  - 📜 Order history and tracking
  - 👤 Profile management
  - 🏠 Address book
  - 💳 Saved payment methods
  - ❤️ Wishlist
  - 📧 Email preferences
  - 🔔 Notification center
  - ⭐ Product reviews

- **📊 Admin Dashboard**
  - 📦 Product management (CRUD)
  - 📊 Sales analytics and reports
  - 👥 Customer management
  - 📦 Inventory management
  - 🚚 Shipping and fulfillment
  - 💰 Discount and promotion management
  - 📝 Content management (CMS)
  - 📈 Performance metrics

- **📱 Mobile App (Coming Soon)**
  - 📱 Native iOS and Android apps
  - 🔄 Real-time sync with web platform
  - 📱 Mobile-optimized UI/UX
  - 🔔 Push notifications
  - 📷 Barcode/QR code scanning
  - 📍 Store locator
  - 💬 In-app chat support
  - 📱 PWA support

## 🛠️ Tech Stack

### Core Technologies

- **Frontend**
  - ⚡ Next.js 14 with App Router and Server Components
  - 🔷 TypeScript 5.0+ for type safety
  - 🎨 Tailwind CSS 3.3+ with JIT compiler
  - 🧩 React 18+ with concurrent features
  - 🔄 React Query 4.0+ for server state
  - 🏗️ Headless UI & Radix UI for accessible components
  - ✨ Framer Motion for animations
  - 📱 Fully responsive design
  - 🌐 Internationalization (i18n) support
  - 📊 React Hook Form for form handling
  - 🎯 React Error Boundary for error handling
  - 🔍 React Intersection Observer for lazy loading
  - 📦 SWR for data fetching
  - 🎨 Class Variance Authority for component variants
  - 🎭 Next Themes for dark/light mode

- **Backend**
  - 🚀 Next.js API Routes
  - 🗃️ Prisma ORM 5.0+
  - 🐘 PostgreSQL (compatible with MySQL, SQLite)
  - 🔐 NextAuth.js for authentication
  - 🛡️ Zod for schema validation
  - 📡 tRPC for end-to-end typesafe APIs
  - 🧪 Jest & React Testing Library
  - 📝 Storybook for component development
  - 🔍 Playwright for E2E testing
  - 🧪 MSW for API mocking
  - 📊 Sentry for error tracking
  - 📈 Vercel Analytics
  - 🔍 PostHog for product analytics
  - 📦 npm workspaces for monorepo setup
  - 🐳 Docker for containerization
  - 🔄 GitHub Actions for CI/CD
  - 🚀 Vercel for deployment
  - 🌍 Cloudflare CDN for global content delivery
  - 💳 Stripe for payments
  - 📧 Nodemailer for email notifications
  - 📊 Vercel Analytics

- **Development Tools**
  - 🧪 Jest & React Testing Library for unit and integration tests
  - 📝 Storybook for component development and documentation
  - 🔍 ESLint + Prettier for code quality and formatting
  - 🐺 Husky + lint-staged for git hooks
  - 📦 npm workspaces for monorepo management
  - 🧰 TypeScript path aliases for cleaner imports
  - 🔄 Conventional Commits for consistent commit messages
  - 📋 Changesets for changelog generation
  - 🧪 Testing Library for accessible component testing
  - 🎭 MSW for API mocking in tests
  - 📊 Bundle Analyzer for bundle size optimization
  - 🔍 Lighthouse CI for performance monitoring
  - 🧹 Clean Webpack Plugin for build optimization
  - 🔄 Webpack Bundle Analyzer for bundle visualization
  - 🐋 Docker support

- **Backend**
  - Next.js API Routes
  - Prisma ORM
  - PostgreSQL (or your preferred database)
  - NextAuth.js for authentication
  - Stripe for payments

- **Deployment**
  - Vercel (recommended)
  - Docker support included

## 🚀 Getting Started

### Development Quickstart (Windows)

```bash
# Install deps
npm install

# Start dev server on port 3000
npm run dev

# If you see a Turbopack/webpack config message, you can force one:
# Use Turbopack (default in Next 16)
npx next dev --turbopack -p 3000

# Or use Webpack (fallback)
npx next dev --webpack -p 3000
```

Notes:
- Dev server runs at http://localhost:3000
- next.config.js is configured for Turbopack via an empty `turbopack: {}`

### Prerequisites

- Node.js 18.0.0 or later (LTS recommended)
- npm 9.x+ or yarn 1.22.x+
- PostgreSQL 14+ (or compatible database)
- Git 2.25.0+
- Stripe account (for payments)
- Google OAuth credentials (for social login)
- SMTP server (for email notifications)

### System Requirements

- CPU: Dual-core 2GHz or higher
- RAM: 8GB+ (16GB recommended for development)
- Disk Space: 2GB+ free space
- OS: Windows 10/11, macOS 10.15+, or Linux

### 🔧 Environment Variables

Create a `.env.local` file in the root directory and configure the following variables:

```env
# ================
#  Core Settings  
# ================
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="DemaWebshop"

# ================
#  Database
# ================
## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.0.0 or later
- npm 9.0.0 or later (comes with Node.js)
- PostgreSQL 14+ (or MySQL 8.0+/SQLite)
- Git
- Docker (optional, for containerized development)

### Environment Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/dema-webshop.git
   cd dema-webshop
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory and add the following variables:

   ```env
   # ================
   #  Database
   # ================
   DATABASE_URL="postgresql://user:password@localhost:5432/demashop?schema=public"

   # For development with SQLite
   # DATABASE_URL="file:./dev.db"

   # ================
   #  Authentication
   # ================
NEXTAUTH_SECRET=generate-with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# ================
#  Payment (Stripe)
# ================
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_CURRENCY=eur

# ================
#  Email (SMTP)
# ================
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@demashop.be

# ================
#  Analytics
# ================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# ================
#  Feature Flags
# ================
NEXT_PUBLIC_ENABLE_MAINTENANCE_MODE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=false
```

> **Note**: For production, set `NODE_ENV=production` and ensure all secrets are properly secured.

### Installation

1. Clone the repository and navigate to the project directory:
   ```bash
   git clone https://github.com/yourusername/dema-webshop.git
   cd dema-webshop
   ```

2. Install dependencies using npm or yarn:
   ```bash
   # Using npm
   npm install
   
   # Or using yarn
   yarn
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local`
   - Update the values with your configuration

4. Set up the database with Prisma:
   ```bash
   # Run database migrations
   npx prisma migrate dev --name init
   
   # Generate Prisma Client
   npx prisma generate
   ```

5. (Optional) Seed the database with sample data:
   ```bash
   npx prisma db seed
   ```

6. Start the development server:
   ```bash
   # Using npm
   npm run dev
   
   # Or using yarn
   yarn dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

## 🧩 Troubleshooting (Windows)

- Port already in use (3000)
  - `npx kill-port 3000`
  - Or: `Get-NetTCPConnection -LocalPort 3000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`

- Turbopack vs Webpack error
  - Use Turbopack: `npx next dev --turbopack -p 3000`
  - Use Webpack: `npx next dev --webpack -p 3000`
  - Ensure next.config.js has no deprecated `experimental.turbopack` key; we use top-level `turbopack: {}`.


## 🏗️ Project Architecture

```
dema-webshop/
├── .github/                    # GitHub workflows and templates
│   ├── workflows/              # CI/CD pipelines
│   └── ISSUE_TEMPLATE/         # Issue templates
│
├── public/                     # Static assets
│   ├── images/                 # Global images
│   ├── fonts/                  # Custom fonts
│   └── favicon.ico             # Favicon
│
├── src/
│   ├── app/                    # App Router (Next.js 13+)
│   │   ├── (auth)/             # Authentication routes
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── forgot-password/
│   │   │
│   │   ├── account/            # User account management
│   │   │   ├── orders/
│   │   │   ├── settings/
│   │   │   └── wishlist/
│   │   │
│   │   ├── admin/              # Admin dashboard
│   │   │   ├── products/
│   │   │   ├── orders/
│   │   │   └── users/
│   │   │
│   │   ├── api/                # API routes
│   │   │   ├── auth/           # Authentication endpoints
│   │   │   ├── products/       # Product endpoints
│   │   │   ├── search/         # Search endpoints
│   │   │   └── webhooks/       # Webhook handlers
│   │   │
│   │   ├── cart/               # Shopping cart
│   │   ├── checkout/           # Checkout process
│   │   ├── products/           # Product pages
│   │   │   ├── [id]/           # Dynamic product pages
│   │   │   └── categories/     # Category pages
│   │   │
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Home page
│   │
│   ├── components/             # Reusable UI components
│   │   ├── auth/               # Auth components
│   │   ├── cart/               # Cart components
│   │   ├── checkout/           # Checkout components
│   │   ├── common/             # Shared components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   └── Modal.tsx
│   │   │
│   │   ├── layout/             # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Sidebar.tsx
│   │   │
│   │   ├── products/           # Product components
│   │   │   ├── ProductCard.tsx
│   │   │   ├── ProductGrid.tsx
│   │   │   └── ProductFilters.tsx
│   │   │
│   │   ├── SearchBar.tsx       # Advanced search
│   │   └── ThemeProvider.tsx   # Theme management
│   │
│   ├── config/                 # App configuration
│   │   ├── site.ts             # Site-wide settings
│   │   └── navigation.ts       # Navigation links
│   │
│   ├── hooks/                  # Custom React hooks
│   │   ├── useCart.ts
│   │   └── useDebounce.ts
│   │
│   ├── lib/                    # Core libraries
│   │   ├── prisma.ts           # Prisma client
│   │   ├── auth.ts             # Auth utilities
│   │   ├── api/                # API clients
│   │   └── utils/              # Utility functions
│   │
│   ├── store/                  # State management
│   │   ├── cartStore.ts
│   │   └── uiStore.ts
│   │
│   ├── styles/                 # Global styles
│   │   ├── globals.css
│   │   └── theme.css
│   │
│   └── types/                  # TypeScript types
│       ├── product.ts
│       └── user.ts
│
├── prisma/                     # Database
│   ├── migrations/             # Migration files
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed data
│
├── tests/                      # Test files
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example                # Environment variables template
├── .eslintrc.js                # ESLint config
├── .prettierrc                # Prettier config
├── next.config.js             # Next.js config
├── tailwind.config.js         # Tailwind CSS config
├── postcss.config.js          # PostCSS config
├── tsconfig.json              # TypeScript config
└── package.json               # Project dependencies
```
```

## 🛠️ Available Scripts

### 🔧 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint

# Run type checking
npm run type-check

# Format code with Prettier
npm run format

# Run Storybook (component development)
npm run storybook
```

### 🗃️ Database

```bash
# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Reset database and apply migrations
npm run db:reset

# Seed database with sample data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

### 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Generate test coverage report
npm test:coverage

# Run end-to-end tests
npm test:e2e
```

### 🚀 Build & Deployment

```bash
# Analyze bundle size
npm run analyze

# Run production build locally
npm run preview

# Deploy to Vercel
vercel

# Deploy with custom environment
vercel --prod --env DATABASE_URL=your-db-url
```

### 🔍 Code Quality

```bash
# Run security audit
npm audit

# Check for outdated dependencies
npm outdated

# Update dependencies
npm update
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Prepare Your Repository**
   - Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
   - Ensure all environment variables are configured in `.env.production`

2. **Vercel Setup**
   - Sign up for a [Vercel account](https://vercel.com) if you haven't already
   - Click "Import Project" and select your repository
   - Configure project settings:
     - Framework Preset: Next.js
     - Root Directory: (leave empty if root)
     - Build Command: `npm run build`
     - Output Directory: `.next`
     - Install Command: `npm install`

3. **Environment Variables**
   - Add all required environment variables in the Vercel dashboard
   - Set `NODE_ENV=production`
   - Configure production database and API keys

4. **Deploy**
   - Click "Deploy" and wait for the build to complete
   - Set up custom domain (optional)
   - Configure SSL certificates

5. **Post-Deployment**
   - Set up CI/CD with GitHub Actions
   - Configure monitoring and error tracking
   - Set up backups for your database

### Docker Deployment

1. **Build the Docker Image**
   ```bash
   docker build -t dema-webshop .
   ```

2. **Run the Container**
   ```bash
   docker run -p 3000:3000 \
     -e DATABASE_URL=your-db-url \
     -e NEXTAUTH_SECRET=your-secret \
     dema-webshop
   ```

3. **Docker Compose (Recommended for Production)**
   ```yaml
   # docker-compose.prod.yml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - DATABASE_URL=postgresql://user:pass@db:5432/demashop
         - NEXTAUTH_SECRET=your-secret
         - NEXTAUTH_URL=http://localhost:3000
       depends_on:
         - db
     
     db:
       image: postgres:14
       environment:
         - POSTGRES_USER=user
         - POSTGRES_PASSWORD=pass
         - POSTGRES_DB=demashop
       volumes:
         - postgres_data:/var/lib/postgresql/data
   
   volumes:
     postgres_data:
   ```

4. **Run with Docker Compose**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### Manual Deployment

1. **Build the Application**
   ```bash
   npm ci
   npm run build
   ```

2. **Start the Production Server**
   ```bash
   NODE_ENV=production node .next/standalone/server.js
   ```

3. **Set Up PM2 (Process Manager)**
   ```bash
   # Install PM2 globally
   npm install -g pm2
   
   # Start application with PM2
   pm2 start npm --name "dema-webshop" -- start
   
   # Save PM2 process list
   pm2 save
   pm2 startup
   ```

## 🔒 Security

- **Dependency Security**: Regular `npm audit` and Dependabot integration
- **Rate Limiting**: Implemented on API routes
- **CORS**: Strict CORS policy
- **Content Security Policy**: Configured in `next.config.js`
- **Security Headers**: Added via `next-security-headers`
- **Input Validation**: Zod schema validation for all inputs
- **Authentication**: Secure session management with NextAuth.js
- **Database**: Parameterized queries with Prisma

## 🧁 GDPR & Consent

- **Cookie categories**
  - Necessary
  - Preferences
  - Analytics
  - Marketing

- **Where consent logic lives**
  - `src/contexts/CookieConsentContext.tsx` — Holds consent state and persistence under the `cookie-consent` key (localStorage)
  - `src/components/layout/CookieConsentWrapper.tsx` — Mounts the consent modal on every page via `app/layout.tsx`

- **Client behavior**
  - No recommendations fetch unless `analytics` or `marketing` consent is granted
  - `preferredCategory` in localStorage is read and used only if `preferences` consent is granted

- **Reset consent**
  - Clear the `cookie-consent` key from localStorage (e.g., in DevTools console):
    ```js
    localStorage.removeItem('cookie-consent')
    ```
  - Reload the page to see the consent modal again

### 🧪 Testing consent flows locally

1. Open a new private window to ensure a clean state.
2. Visit the home page — the consent modal should appear.
3. Click “Reject All” — verify no request to `/api/recommendations` is made and highlights show non-personalized content.
4. Click “Customize” → enable “Preferences” only — set a category on `/products?category=...`, go back home — highlights reorder but still no server fetch.
5. Enable “Analytics” or “Marketing” — reload home — verify a request is made to `/api/recommendations` and highlights may show “For you”.
6. Clear consent with `localStorage.removeItem('cookie-consent')` and reload to repeat.

## 📈 Monitoring & Analytics

- **Error Tracking**: Sentry integration
- **Performance Monitoring**: Vercel Analytics
- **Logging**: Structured logging with Pino
- **Uptime Monitoring**: UptimeRobot or similar service
- **Analytics**: Google Analytics 4 or Plausible

## 🌍 Internationalization (i18n) Coverage

- Localized (en/nl/fr):
  - Home page (`src/app/page.tsx`): hero, features, highlights, CTA
  - Contact page (`src/app/contact/page.tsx`): all labels/placeholders, validation, phone auth messages, info cards
  - Products listing (`src/app/products/page.tsx`): title, search legend, empty state, sorting labels/options, grid/list toggle, count text
  - Product filters (`src/components/products/ProductFilters.tsx`): filter titles, generic labels
  - Navbar (`src/components/layout/Navbar.tsx`): nav items, cart/account sr-only labels
  - Cart drawer (`src/components/cart/Cart.tsx`): empty state, buttons, subtotal, notes
  - Cookie consent (`src/components/layout/CookieConsent.tsx`): modal titles, categories, buttons, notice

- Locale files updated:
  - `src/locales/en.json`, `src/locales/nl.json`, `src/locales/fr.json`

- Remaining candidates to localize (hardcoded strings still present):
  - Product detail UI labels in `src/components/products/ProductDetailsCard.tsx`
    - Headers like "Product Details", "Technical Specifications", sections like "Pressure Range", "Power", "Electrical", "Flow", "Dimensions (mm)", etc.
    - Buttons "Request Quote", "Add to Cart"
    - Empty-state: "No technical specifications available for this product."
    - PDF link texts: "View Product PDF", "Page"
  - Product detail page `src/app/products/[sku]/page.tsx`
    - Error states: "Error", "Product not found", "Failed to load product"
    - Stock label: "In Stock"
    - Section headers: "Description", "Specifications", spec labels like "Category", "Pressure", "Overpressure"
    - Buttons in edit mode: "Saving…", "Save Crop", "Auto Detect", "Reset"
  - Layout and utility components minor strings (e.g., mobile menu sr-only in Navbar already mostly covered)
  - Other routes (about, checkout, account) contain varying amounts of placeholder or demo text; audit recommended.

- Next steps:
  - Add translation keys for ProductDetailsCard and products/[sku] page labels and replace hardcoded strings
  - Audit about/checkout/account pages and localize remaining text
  - Centralize any repeated labels under `common.*`

## 🔄 CI/CD

GitHub Actions workflow example (`.github/workflows/deploy.yml`):

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18.x'
          cache: 'npm'
      
      - name: Install Dependencies
        run: npm ci
      
      - name: Run Linting
        run: npm run lint
      
      - name: Run Tests
        run: npm test
      
      - name: Build Application
        run: npm run build
        env:
          NODE_ENV: production
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

## 📚 Documentation

- **API Documentation**: Generated with Swagger/OpenAPI
- **Component Library**: Storybook for UI components
- **Architecture Decision Records (ADRs)**: In `/docs/adr/`
- **Changelog**: `CHANGELOG.md`
- **Contributing Guidelines**: `CONTRIBUTING.md`

## 🧭 Configuration TODOs (keep this updated)

- [x] Bank transfer checkout flow (Information → Payment → Confirmation)
  - How to set up
    - Add env:
      - `NEXT_PUBLIC_BANK_NAME`
      - `NEXT_PUBLIC_BANK_ACCOUNT_NAME`
      - `NEXT_PUBLIC_BANK_IBAN`
      - `NEXT_PUBLIC_BANK_BIC`
    - Restart dev server after changes
  - How to test
    - Add products to cart → go to `/checkout`
    - Complete Information → Payment shows bank transfer details and order reference
    - Submit to see Confirmation with same bank details

- [x] Order confirmation emails via Resend on checkout
  - How to set up
    - Env: `RESEND_API_KEY`
    - Optional: `ORDER_NOTIFY_EMAILS` (comma-separated; defaults to `sales@demashop.com,nicolas.cloet@gmail.com`)
    - API: `POST /api/orders/confirm` (used by checkout submit)
  - How to test
    - Fill checkout and submit → email sent to customer and BCC to notify list
    - Or send manual request:
      ```http
      POST /api/orders/confirm
      Content-Type: application/json

      {
        "orderRef":"DEMA-TEST-1234",
        "items":[{"sku":"SKU1","name":"Item","quantity":1,"price":10}],
        "totals":{"subtotal":10,"shipping":0,"tax":2.1,"total":12.1},
        "customer":{"email":"you@example.com"},
        "bank":{"accountName":"...","bankName":"...","iban":"...","bic":"..."}
      }
      ```

- [ ] NextAuth session-driven checkout auto-fill
  - How to set up
    - Integrate NextAuth, expose session user profile fields (email, name, address, phone)
    - In `checkout/page.tsx`, read from session and prefill form
  - How to test
    - Sign in → open checkout → fields are prefilled; toggle billing details if ordering for someone else

- [ ] Localized order confirmation emails (per locale template)
  - How to set up
    - Create per-locale HTML/text templates and select by `locale` in `/api/orders/confirm`
  - How to test
    - Switch site language and place an order → email language matches selection

- [ ] Product image override API auth
  - How to set up
    - Protect `POST /api/product-image-overrides` behind admin/auth guard
  - How to test
    - Attempt override as non-admin → denied
    - As admin → can save override

- [ ] Full i18n sweep of About/Account pages
  - How to test
    - Switch languages and verify all visible strings are translated

- [ ] API error messages i18n for orders/contact
  - How to set up
    - Return localized error messages in API responses based on request locale
  - How to test
    - Trigger known errors (missing fields, invalid inputs) and verify localized responses

- [ ] Optional Stripe enablement (future card payments)
  - How to set up
    - Env: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
    - Add Stripe PaymentIntent flow and UI toggle between Bank Transfer / Card
  - How to test
    - Use Stripe test keys and cards; ensure orders and emails reflect card payments

When any configuration is added or changed, update this section with:
- What was added
- Required env vars
- How to test locally
- Any caveats

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [NextAuth.js Documentation](https://next-auth.js.org/)

---

<div align="center">
  Made with ❤️ by DemaShop Team
</div>

Build the Docker image:

```bash
docker build -t dema-webshop .
```

Run the container:

```bash
docker run -p 3000:3000 dema-webshop
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_SECRET` | Secret for NextAuth.js | Yes |
| `NEXTAUTH_URL` | Base URL of your application | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | No |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | No |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | Yes |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | For production |
| `NEXT_PUBLIC_SITE_URL` | Public URL of your application | Yes |

## 🏗️ Project Structure

```
dema-webshop/
├── .github/                   # GitHub workflows and templates
│   ├── workflows/            # CI/CD workflows
│   └── ISSUE_TEMPLATE/       # Issue templates
│
├── public/                   # Static files
│   ├── images/               # Image assets
│   ├── fonts/                # Custom fonts
│   └── favicon.ico           # Favicon
│
├── src/
│   ├── app/                  # App Router (Next.js 13+)
│   │   ├── (auth)/           # Authentication routes
│   │   ├── (dashboard)/      # Dashboard routes
│   │   ├── (marketing)/      # Marketing pages
│   │   ├── api/              # API routes
│   │   │   ├── auth/         # Authentication API
│   │   │   ├── products/     # Products API
│   │   │   └── ...
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   │
│   ├── components/           # Reusable UI components
│   │   ├── ui/               # Shadcn/ui components
│   │   ├── forms/            # Form components
│   │   ├── layout/           # Layout components
│   │   └── ...
│   │
│   ├── config/               # App configuration
│   │   ├── site.ts           # Site metadata
│   │   └── navigation.ts     # Navigation links
│   │
│   ├── lib/                  # Utility functions
│   │   ├── api/              # API clients
│   │   ├── auth/             # Auth utilities
│   │   └── utils.ts          # Common utilities
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── use-toast.ts      # Toast notifications
│   │   └── ...
│   │
│   ├── styles/               # Global styles
│   │   └── globals.css       # Global CSS
│   │
│   └── types/                # TypeScript type definitions
│       └── ...
│
├── prisma/                   # Prisma schema and migrations
│   └── schema.prisma        # Database schema
│
├── tests/                    # Test files
│   ├── unit/                # Unit tests
│   ├── integration/         # Integration tests
│   └── e2e/                 # End-to-end tests
│
├── .env.local               # Local environment variables
├── .eslintrc.js             # ESLint configuration
├── .prettierrc              # Prettier configuration
├── next.config.js           # Next.js configuration
├── package.json             # Project dependencies
└── tsconfig.json            # TypeScript configuration
```

## 📚 API Reference

### Recommendations

#### Get Recommendations
- **Endpoint**: `GET /api/recommendations`
- **Description**: Consent-gated recommendations. Client only calls this when the user granted `analytics` or `marketing` consent. Without consent, the UI uses non-personalized defaults.
- **Query Parameters**:
  - `limit` (number, optional) — Max items to return. Default: 4. Max: 12
  - `category` (string, optional) — Filter pool by category
  - `preferredCategory` (string, optional) — If present and `preferences` consent is given, results are biased toward this category
  - `personalized` (boolean, optional) — Client hint; when `true` and `preferredCategory` exists, results are biased
- **Response**:
  ```json
  {
    "items": [
      {
        "sku": "COMP-123",
        "name": "Pro Air Compressor X200",
        "description": "Bestseller for workshops...",
        "imageUrl": "/images/compressors.jpg",
        "product_category": "Compressors",
        "price": 999.0,
        "rating": 4.7,
        "inStock": true
      }
    ],
    "personalized": true
  }
  ```
- **Notes**:
  - No personal identifiers are sent; personalization is driven by category preference when consent allows.
  - Fallback to non-personalized popular products when consent is not granted.

### Authentication

#### Register a New User
- **Endpoint**: `POST /api/auth/register`
- **Description**: Register a new user account
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123!",
    "name": "John Doe"
  }
  ```
- **Response**:
  ```json
  {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `400 Bad Request` - Invalid input
  - `409 Conflict` - Email already registered

#### Login
- **Endpoint**: `POST /api/auth/login`
- **Description**: Authenticate a user and return an access token
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securePassword123!"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request` - Invalid input
  - `401 Unauthorized` - Invalid credentials

### Products

#### Get All Products
- **Endpoint**: `GET /api/products`
- **Description**: Retrieve a paginated list of products
- **Query Parameters**:
  - `page` (number, optional) - Page number (default: 1)
  - `limit` (number, optional) - Items per page (default: 10, max: 100)
  - `category` (string, optional) - Filter by category
  - `sort` (string, optional) - Sort field (name, price, createdAt)
  - `order` (string, optional) - Sort order (asc, desc)
  - `q` (string, optional) - Search query
- **Response**:
  ```json
  {
    "data": [
      {
        "id": "prod_123",
        "name": "Industrial Pump",
        "description": "High-performance industrial pump...",
        "price": 1299.99,
        "category": "Pumps",
        "stock": 42,
        "images": ["..."],
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ],
    "meta": {
      "total": 1,
      "page": 1,
      "limit": 10,
      "totalPages": 1
    }
  }
  ```

#### Get Product by ID
- **Endpoint**: `GET /api/products/:id`
- **Description**: Get detailed information about a specific product
- **Parameters**:
  - `id` (string, required) - Product ID
- **Response**:
  ```json
  {
    "id": "prod_123",
    "name": "Industrial Pump",
    "description": "High-performance industrial pump...",
    "price": 1299.99,
    "category": "Pumps",
    "specifications": {
      "power": "5.5 kW",
      "flowRate": "1000 L/min",
      "material": "Stainless Steel"
    },
    "stock": 42,
    "images": ["..."],
    "reviews": [
      {
        "id": "rev_123",
        "rating": 5,
        "comment": "Excellent product!",
        "user": {
          "name": "John Doe",
          "avatar": "..."
        },
        "createdAt": "2023-01-15T00:00:00.000Z"
      }
    ],
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
  ```
- **Error Responses**:
  - `404 Not Found` - Product not found

## 🚀 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/git/external?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fdema-webshop)

1. Push your code to a GitHub/GitLab/Bitbucket repository
2. Import the repository to Vercel
3. Set up environment variables in the Vercel dashboard
4. Deploy!

### Docker

1. Build the Docker image:
   ```bash
   docker build -t dema-webshop .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env dema-webshop
   ```

3. Access the app at `http://localhost:3000`

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 🧪 Testing

Run the test suite:
```bash
# Run all tests
npm test

# Run unit tests
npm test:unit

# Run integration tests
npm test:integration

# Run E2E tests
npm test:e2e

# Run tests with coverage
npm test:coverage
```

## 🛠️ Development

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL 14+ (or MySQL 8.0+/SQLite)

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/dema-webshop.git
   cd dema-webshop
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up the database:
   ```bash
   # Start PostgreSQL (using Docker)
   docker-compose up -d
   
   # Run database migrations
   npx prisma migrate dev
   
   # Seed the database with sample data
   npx prisma db seed
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint

# Format code
npm run format

# Run type checking
npm run type-check

# Run Storybook
npm run storybook
```

## 🔍 Troubleshooting

### Database Connection Issues
- Ensure your database server is running
- Verify the connection string in `.env`
- Check if the database user has the correct permissions

### Build Failures
- Clear the `.next` directory and `node_modules`
- Delete `package-lock.json` and reinstall dependencies
- Check for version conflicts in `package.json`

### Common Errors
- **Prisma Client Error**: Run `npx prisma generate`
- **Type Errors**: Run `npm run type-check`
- **ESLint Warnings**: Run `npm run lint:fix`

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code changes that neither fix bugs nor add features
- `perf`: Performance improvements
- `test`: Adding or modifying tests
- `chore`: Changes to build process or auxiliary tools

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework for Production
- [Tailwind CSS](https://tailwindcss.com/) - A utility-first CSS framework
- [Prisma](https://www.prisma.io/) - Next-generation ORM for Node.js & TypeScript
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Vercel](https://vercel.com) - For the amazing deployment experience
- `POST /api/auth/login` - Log in a user
- `POST /api/auth/logout` - Log out the current user
- `GET /api/auth/session` - Get the current session
- `POST /api/auth/forgot-password` - Request a password reset
- `POST /api/auth/reset-password` - Reset a password

### Products

- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get a single product
- `POST /api/products` - Create a new product (admin only)
- `PUT /api/products/:id` - Update a product (admin only)
- `DELETE /api/products/:id` - Delete a product (admin only)

### Cart

- `GET /api/cart` - Get the current user's cart
- `POST /api/cart` - Add an item to the cart
- `PUT /api/cart/:id` - Update cart item quantity
- `DELETE /api/cart/:id` - Remove an item from the cart

### Orders

- `GET /api/orders` - Get the current user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create a new order
- `POST /api/orders/webhook` - Stripe webhook for order updates

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please contact support@demashop.be or open an issue in the GitHub repository.

## Acknowledgments

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Stripe Documentation](https://stripe.com/docs)
