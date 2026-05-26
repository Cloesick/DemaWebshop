
## 🧭 New Client Setup Checklist

Use this starter as a base for any new client project. For each new client, walk through this checklist:

1. **Clone or copy this starter**
   - Create a new repo or folder from `ecommerce-starter`.
   - Initialize Git and push to your remote.

2. **Update project metadata**
   - In `package.json`:
     - Change `name` to the client/project name.
     - Optionally update `description` and `author`.
   - In `src/app/layout.tsx`:
     - Set `metadata.title` and `metadata.description` to the client brand.

3. **Configure environment variables**
   - Create `.env.local` (development) and `.env`/`.env.production` for deployment.
   - Set at least:
     - `NEXT_PUBLIC_SITE_URL=https://client-domain.example`
     - `DATABASE_URL=postgresql://user:password@host:5432/clientdb?schema=public`
     - Auth providers (e.g. `NEXTAUTH_URL`, OAuth client IDs/secrets).
     - Payment provider keys (e.g. Stripe) and currency.
     - SMTP settings for transactional emails.

4. **Set up database**
   - Customize `prisma/schema.prisma` to match the client domain (products, users, orders, etc.).
   - Run Prisma migrations to create/update the database.
   - (Optionally) seed the database with sample products.

5. **Branding & theming**
   - Replace logo and brand assets in `public/`.
   - Adjust base styles in `src/styles/globals.css` and any theme/config files.
   - Update navigation and footer links in `src/config` and layout components.

6. **Enable/disable features**
   - Decide which modules to use for this client (cart, wishlist, reviews, admin dashboard, etc.).
   - Toggle or remove routes/components that are not needed.

7. **Analytics, monitoring, and SEO**
   - Configure analytics (GA4, Plausible, etc.) env vars and scripts.
   - Set up error tracking (e.g. Sentry) if required.
   - Review SEO/meta tags, Open Graph images, and sitemap/robots.

8. **Deployment**
   - Choose a target (Vercel, Docker, custom server).
   - Ensure environment variables are set in the hosting platform.
   - Run a production build locally (`npm run build`) before deploying.

9. **Smoke test**
   - Verify auth, product listing, cart, checkout, and emails in a staging environment.
   - Fix any client-specific issues before going live.

You can evolve this checklist as your workflow matures (e.g. add QA steps, design review, or security audit steps).
