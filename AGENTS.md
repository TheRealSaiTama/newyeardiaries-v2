# AGENTS.md — New Year Diaries V2

## Project Overview
E-commerce SPA for New Year Diaries — premium diaries, planners, and corporate gifts. Built with vanilla JS + Vite, Supabase backend (Postgres + Auth + Storage), deployed on Vercel. Clean URL SPA via History API.

---

## Essential Commands

```bash
npm run dev      # Dev server at http://localhost:5173
npm run build    # Production build to dist/
npm run preview  # Preview production build locally

# Supabase (if configured locally)
supabase login
supabase db push          # Push migrations to linked project
supabase db reset         # Reset local DB (destructive)
supabase functions serve   # Local function emulation
```

---

## Environment Variables

Required in `.env` (copy from project setup):

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_EMAILJS_SERVICE_ID=...
VITE_EMAILJS_TEMPLATE_ID=...
VITE_EMAILJS_PUBLIC_KEY=...
VITE_ADMIN_PASSWORD=nyd2026        # Default admin password (change in production!)
```

**Important**: All Supabase keys use the `VITE_` prefix because this is a client-side Vite app. They are publicly readable — never put service role keys here.

---

## Architecture

### Stack
- **Frontend**: Vanilla JS (ES modules), no framework — pages are render functions that return HTML strings
- **Build**: Vite with `appType: 'spa'` (SPA mode)
- **Backend**: Supabase (Postgres + Row Level Security + optional Auth)
- **Email**: EmailJS (client-side direct send — no server needed)
- **Deploy**: Vercel (SPA rewrite: all routes → `/`)

### Directory Structure

```
src/
├── main.js              # Entry point — loads content, sets up shell, registers routes
├── router.js            # Custom History API router (addRoute, navigateTo, resolveRoute)
├── style.css            # Entry CSS
├── data/
│   ├── products.js      # Product fetch with 30s client cache (getProducts, getProductBySlug)
│   ├── store.js         # Cart + Quote List (localStorage), toast notifications
│   ├── nyd_products.js  # Static product data (legacy/supplementary)
│   └── categories.js    # Category definitions and CATEGORY_GROUPS mapping
├── lib/
│   ├── supabase.js      # Supabase client singleton
│   ├── content.js       # Site content fetch with 60s cache (banners, settings, etc.)
│   ├── products.js      # Product fetch from Supabase (separate from data/products.js)
│   ├── notify.js        # EmailJS send wrappers (sendOrderEmail, sendQuoteEmail, sendContactEmail)
│   └── categories.js    # Category seeding + grouping logic
├── components/
│   ├── Header.js       # Header render + events, search modal, mega menu, mobile nav
│   ├── Footer.js       # Footer render
│   ├── ProductCard.js   # Product card HTML generator
│   ├── FilterSidebar.js
│   ├── Breadcrumbs.js
│   ├── QuickViewModal.js
│   ├── FaqChatbot.js
│   ├── TrustBadges.js
│   ├── Skeleton.js
│   └── AboutSection.js
├── pages/
│   ├── HomePage.js     # Homepage with dynamic banners/content
│   ├── ShopPage.js     # Product grid, filter, sort, pagination
│   ├── ProductDetailPage.js
│   ├── CartPage.js
│   ├── CheckoutPage.js
│   ├── BulkQuotePage.js
│   ├── QuoteListPage.js
│   ├── OrderSuccessPage.js
│   ├── EnquirySuccessPage.js
│   ├── LoginPage.js
│   ├── AccountPage.js
│   ├── AboutPage.js, ContactPage.js, FaqPage.js, PrivacyPolicyPage.js, TermsPage.js, ShippingReturnsPage.js, BrandingPage.js
│   └── AdminPage.js    # Full admin dashboard (products, categories, banners, homepage, footer, settings, enquiries)
└── styles/
    ├── variables.css   # CSS design tokens
    ├── reset.css, global.css, components.css, pages.css
```

---

## Key Patterns & Conventions

### Page Rendering Pattern
Every page exports a `render*Page()` async function. It receives `(params, appContent)` and writes directly to `document.getElementById('app')`. The shell (header/footer) is NOT re-rendered on each route change — only the main content area.

```js
// main.js pattern:
addRoute('/path', wrapPage(renderShopPage));

function wrapPage(renderFn) {
  return (params) => {
    renderFn(params, appContent);   // writes to #app
    // header already in DOM — just refresh counts
    updateHeaderCounts();
  };
}
```

### Router
Custom History API router in `router.js`:
- `addRoute(path, handler)` — path params via `:paramName`
- `navigateTo(path)` — SPA navigation, prevents full reload
- `resolveRoute()` — called on init and popstate
- All `<a href="/...">` clicks are intercepted automatically
- **404**: Falls back to homepage

### Data Caching
Two independent caches:
- `src/data/products.js` → 30s TTL, loaded per-page (ShopPage fetches fresh each render)
- `src/lib/content.js` → 60s TTL, loaded once at startup

When admin changes content, call `bustContentCache()` from `content.js` to invalidate.

### Product Data Flow
- **ShopPage** uses `getProducts()` from `data/products.js` (client-side cached)
- **AdminPage** uses direct Supabase queries (bypasses cache)
- `src/lib/products.js` has duplicate `getProducts()` from `data/products.js` — they differ slightly. Prefer `data/products.js` for frontend pages.

### Cart & Quote List
Stored in `localStorage` as JSON arrays:
```js
// Cart: [{ productId, qty }, ...]
// QuoteList: [{ productId, qty }, ...]
```
`store.js` exposes: `getCart()`, `addToCart()`, `removeFromCart()`, `updateCartQty()`, `getQuoteList()`, `addToQuoteList()`, `removeFromQuoteList()`, `updateQuoteQty()`

Global helpers wired: `window.__addToCart(id, qty)` and `window.__addToQuote(id, qty)` for inline onclick handlers.

### Category System
Categories live in `categories` table with a `slug` field. `CATEGORY_GROUPS` in `categories.js` maps group names to arrays of category slugs. The header mega-menu uses `getCategoriesByGroup()` to organize.

`seedCategoriesIfEmpty()` auto-seeds 40+ categories on first load if DB is empty.

### Admin Dashboard (`AdminPage.js`)
- Auth: `sessionStorage.setItem('admin_auth', '1')` after password check
- Default password: `nyd2026` (set via `VITE_ADMIN_PASSWORD`)
- Tabs: products, categories, banners, homepage, header, footer, settings, enquiries
- All media uploads converted to base64 Data URLs (no Supabase Storage needed)
- Banner images validated at 1920×720px minimum (16:6 ratio)
- `bustContentCache()` called after homepage/banner/header/footer edits

### Supabase RLS Policies
Public can **insert** into `quote_requests`, `contact_submissions`, `enquiries` (form submissions). Only **authenticated users** can SELECT these tables. This means the admin reads them via the anon key but with `authenticated` policy — this works because Supabase auth sessions are recognized.

---

## Database Schema

**Core tables**: `products`, `categories`, `product_categories` (junction), `banners`, `announcements`

**Content tables**: `site_settings` (key-value), `site_content` (section+key), `homepage_sections` (section_key as upsert key)

**Enquiry tables**: `quote_requests`, `contact_submissions`, `enquiries`

**Migrations** live in `supabase/migrations/` and use sequential numbering. Always use the latest migration.

---

## Design System

CSS variables in `variables.css`:
- **Primary**: `#A0522D` (terracotta/rust)
- **Accent**: `#C4956A` (gold/tan)
- **Background**: `#FDF9F3` (warm cream)
- **Font**: Arimo (Google Fonts)
- **Header height**: `72px` (`--header-height`)
- **Announcement bar**: `36px` (`--announcement-height`)

All components use BEM-adjacent class naming with `ap-` prefix (e.g., `ap-product-card`, `ap-badge--new`).

---

## Gotchas & Non-Obvious Points

1. **`wrapPage()` re-renders the header on every navigation** — this is intentional to refresh cart/quote counts, but means any header state (expanded mega menu, mobile nav open) is lost on route change.

2. **ShopPage fetches products fresh every render** — it uses `getProducts()` from `data/products.js` which has a 30s cache, but the page re-calls the function. Filtering/sorting happens client-side after fetching all products.

3. **Two product fetch sources exist**: `data/products.js` (client-cache, used by frontend) and `lib/products.js` (no cache, used by some utilities). They normalize differently — `data/products.js` uses `category.name`, `lib/products.js` uses `category_id`. Admin uses direct Supabase queries.

4. **Inline onclick handlers** use `window.__addToCart` and `window.__addToQuote` — these are injected by `store.js`. Don't remove or rename them.

5. **Content caching**: `getContent()` caches for 60s. If you add new content tables, make sure to call `bustContentCache()` after edits, or the new content won't appear for up to 60 seconds.

6. **Admin uploads as base64**: Product images are stored as base64 data URLs in Supabase text columns. No Supabase Storage bucket is used. This avoids storage complexity but makes the DB rows large.

7. **Product categories junction**: Products don't store a single `category_id` as the canonical field — they use `product_categories` junction table. However, `products.category_id` IS set (to the first selected category) for simple queries. Admin product modal writes to both.

8. **Banner image validation**: `validateBannerImage()` requires exactly 1920×720px minimum. Uploads are rejected if smaller. The check is client-side only.

9. **Supabase RLS for enquiries**: Anonymous inserts are allowed; authenticated reads. This is an unusual pattern — it works because Supabase treats anon-key requests as `anon` role and authenticated sessions as `authenticated`. Admin uses anon key but reads via the browser session.

10. **No test suite** — project has no tests. Playwright is listed in devDependencies but no test scripts exist.

11. **Vercel SPA rewrite** — `vercel.json` rewrites everything to `/`. The History API router handles clean URLs from there. No server-side rendering.

---

## Adding New Pages

1. Create `src/pages/NewPage.js` with an async `renderNewPage(params, appContent)` function
2. Export it from `src/main.js`
3. Register the route: `addRoute('/new-page', wrapPage(renderNewPage))`
4. Add CSS in `styles/pages.css`

---

## Supabase Setup

```bash
# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push

# Reset DB (destructive)
supabase db reset
```

Migrations are SQL files in `supabase/migrations/`. Apply them via `supabase db push` after linking.

---

## Deployment

Vercel auto-deploys on push to `main`. Configure in Vercel dashboard:
- **Build command**: `npm run build`
- **Output directory**: `dist`
- **Environment variables**: Add all `VITE_*` vars and `SUPABASE_*` vars

### Which host serves what (verified 2026-10-10)

This is NOT the same thing as `VITE_SITE_URL`. Two separate systems are live:

| Host | Serves | Notes |
|---|---|---|
| `newyeardiaries-v2.vercel.app` | **This V2 SPA** | Vercel build of this repo. Confirmed live, serves the chunked Vite output (`admin`, `branding`, `bulk-quote`, `checkout` chunks from `vite.config.js` `manualChunks`). |
| `newyeardiaries.in` | **WordPress + WooCommerce** | The long-standing cPanel/hostinger store. `robots.txt` disallows `/wp-admin/` and lists `wp-content/uploads/wc-logs/`; sitemap is `sitemap_index.xml` (WP-generated). |

**Gotcha**: `VITE_SITE_URL=https://newyeardiaries.in` and the `og:url`/canonical defaults in
`index.html` point at the **WordPress** site, not at the V2 deployment. So the V2 SPA emits
canonical/OG tags for a host that serves different content. When verifying "is V2 live" or
checking a V2 bug, always hit `newyeardiaries-v2.vercel.app`, never the `.in` domain.
`newyeardiaries-v2.vercel.app` is also the hardcoded default in `src/lib/notify.js` and an
allowed origin in both Edge Functions (`verify-admin`, `send-order-email`).

### Supabase project: free tier, auto-pauses (verified 2026-10-10)

Project `cqrnmyssytgfvgrhhfoz` ("New Year Diaries Project", org `glwmpewqwakelmcchfgk`) is on the
**FREE plan, region `ap-northeast-1` (Tokyo), nano compute**. Two consequences that bit us on
2026-10-10:

1. **It auto-pauses after 7 days of inactivity.** While paused, `*.supabase.co` stops resolving
   (DNS returns **NXDOMAIN**, confirmed via Google Public DNS), so the whole SPA silently dies
   while Vercel still returns HTTP 200. **Do not diagnose NXDOMAIN as "project deleted."** Check
   Supabase dashboard → project status first. A paused project is restorable for 90 days with data
   intact, no data loss.
2. **Dashboard reads "LAST BACKUP: No backups".** Free tier gets zero automated backups. Only
   Pro/Team/Enterprise get daily snapshots (7/14/30 days). There is no server-side safety net.

**Recovery drill**: to restore the SPA, Supabase dashboard → the project → Restore. Takes ~2 min,
boots in ~1 min. No code change or redeploy needed, the `.env` project ref is unchanged.

**Backup gap**: this repo has NO Postgres dump of any kind.
- `NYD.sql` is a trap. It is a 344-line **MySQL/MariaDB phpMyAdmin dump of a different, unrelated
  database** (`NYD`, 7 tables like `code_items`). It is NOT a Supabase backup. Do not attempt to
  restore from it.
- `supabase/products_seed.sql` has only 4 sample INSERTs, not the real catalog.
- `wc-product-export-2-8-2026-1785685087657.csv` holds 9,780 **WooCommerce** rows and is the only
  bulk product data on disk, but it predates the V2 model and lacks V2 fields (sort_order, meta
  tags, base64 images, bulk pricing).
- `backups/` (gitignored) holds JSON exports taken via the anon REST key. Covers products,
  categories, banners, content, quote_requests, contact_submissions. It **cannot** cover
  `orders`, `order_items`, or `enquiries`, because RLS restricts those to the `authenticated` role.

**To get a real full dump** you need the DB password: dashboard → Connect → Session pooler
connection string, then `supabase db dump --linked --file <path>` (CLI 2.111.0 is installed
locally; `psql`/`pg_dump` are NOT on this machine). Do this before anything else touches it.