# CODEMAP — New Year Diaries V2

**Generated**: 2026-05-24 (via parallel explore agents + direct analysis)  
**Project**: Vanilla JS + Vite SPA e-commerce for premium diaries/planners/corporate gifts. Supabase (Postgres + RLS) backend, Vercel deploy, EmailJS + Cerebras (LLM) client integrations. No framework, History API router.

This document + AGENTS.md + the three subagent reports (in chat history) give complete "where's what".

---

## 1. Stack & Runtime (STACK.md equivalent)

- **Frontend**: Vanilla ES modules (no React/Vue/etc). Pages = `render*Page(params, content?)` fns that do `document.getElementById('app').innerHTML = ...` + post-mount `addEventListener` / `init*()`.
- **Build**: Vite 8 (`appType: 'spa'`), port 5173 on `npm run dev`. Outputs to `dist/`.
- **Backend**: Supabase JS client (`@supabase/supabase-js` v2) using **only anon key** everywhere. Direct PostgREST queries from browser. No Edge Functions, Realtime, or Storage bucket used in app code (despite dep).
- **Data / State**: 30s client cache (products), 60s (content), localStorage (cart/quote lists), sessionStorage (admin flag).
- **Email**: EmailJS direct fetch (client → api.emailjs.com). Hardcoded recipient in src/lib/notify.js:15.
- **AI Chat**: Cerebras (`VITE_CEREBRAS_API_KEY`) — direct browser fetch to `api.cerebras.ai` (llama3.1-8b) in FaqChatbot.js. Hybrid static FAQs + LLM.
- **Deploy**: Vercel SPA rewrite (all → /) + Vite build. `vercel.json`.
- **Other**: WhatsApp float buttons (hardcoded numbers), Material Symbols icons, Arimo font (Google).

**Key config files**:
- `package.json`, `vite.config.js` (spa + open), `.env` (all VITE_*), `vercel.json`.

**Env vars** (client-readable):
- `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
- `VITE_EMAILJS_*`
- `VITE_ADMIN_PASSWORD` (default nyd2026)
- `VITE_CEREBRAS_API_KEY` (new, for chatbot)

---

## 2. Architecture & Data Flow (ARCHITECTURE.md)

**Shell + Content Area Pattern** (main.js):
- One-time `setupShell()` builds `#shell` with persistent `#header-area`, modals, `<main id="app">`, footer, floating buttons, FAQ chatbot.
- Pages **only** mutate `#app` (and sometimes re-render header-area).
- `wrapPage(renderFn)` (main.js:99) always re-renders header on nav + calls inits.
- Admin route special-cases: hides header/footer entirely.

**Router** (src/router.js):
- Regex-based (`:slug` → capture groups).
- `navigateTo(path)` → pushState + resolve.
- Global click hijack (internal links only).
- `popstate` listener.
- Cleanup hook support (defined but **unused** — no page returns a cleanup fn).
- 404 → homepage.

**Rendering Lifecycle**:
1. `loadContent()` (lib/content.js) + `preloadCategories()`
2. `setupShell()` + inits
3. `initRouter()` → initial `resolveRoute()`
4. Nav → handler(params) → write `#app` → re-init header bits.

**Primary Data Flows**:
- **Products**: `getProducts()` (cached in data/products.js) → client filter/sort/paginate (Shop) or find (PDP/Cart). Admin bypasses cache, direct Supabase.
- **Content/Banners/Home**: Aggregated in `lib/content.js:getContent()` (5 tables, 60s cache). Admin edits call `bustContentCache()`.
- **Cart/Quote**: `data/store.js` (LS + `updateHeaderCounts()` + toast). Globals `window.__addToCart` / `__addToQuote` (defined but unused in source).
- **Forms**: Direct Supabase insert + `send*Email()` (notify.js) → success page.
- **Reviews**: Duplicated fns → `product_reviews` table (only PDP uses).
- **Admin**: Everything direct via anon client after sessionStorage password gate. Tabs for products (multi-cat via junction), categories, banners (strict 1920x720 validation + base64), homepage_sections, header/footer/settings, enquiries (3 tables).

**External Calls (all client-side, no proxy)**:
- Supabase PostgREST
- EmailJS
- Cerebras LLM
- WhatsApp wa.me links

---

## 3. Directory Structure & Key Files (STRUCTURE.md)

```
newyeardiaries-v2/
├── src/
│   ├── main.js                 # Entry: styles, shell, routes, loadContent, wrapPage
│   ├── router.js               # History router + click intercept
│   ├── style.css + styles/     # Global + variables/reset/global/components/pages.css (BEM-ish `ap-`? + CSS vars)
│   ├── components/
│   │   ├── Header.js           # Mega menu, search, mobile, counts (reads LS directly)
│   │   ├── Footer.js
│   │   ├── ProductCard.js      # Card + slideshow init
│   │   ├── FilterSidebar.js    # Shop filters
│   │   ├── QuickViewModal.js
│   │   ├── FaqChatbot.js       # Static + Cerebras LLM
│   │   ├── Breadcrumbs.js, Skeleton.js, TrustBadges.js, AboutSection.js
│   ├── pages/                  # ~20 render*Page + some init*
│   │   ├── HomePage.js         # Hero, sections, product sliders (uses lib/products)
│   │   ├── ShopPage.js         # Full grid + client filters + pagination (data/products)
│   │   ├── ProductDetailPage.js# Gallery, reviews, related, MOQ
│   │   ├── CartPage.js / QuoteListPage.js
│   │   ├── CheckoutPage.js     # Multi-step, sessionStorage state
│   │   ├── BulkQuotePage.js, ContactPage.js (forms + inserts)
│   │   ├── AdminPage.js        # 1965 LOC monster: tabs, CRUD, modals, base64 uploads, auth
│   │   └── static pages (About, Faq, Terms, Branding, etc.)
│   ├── data/
│   │   ├── products.js         # Cached fetch + normalize + reviews + getCategories + static filters
│   │   ├── store.js            # Cart/Quote LS + toasts + window globals
│   │   └── nyd_products.js     # DEAD legacy static data (0 imports)
│   └── lib/
│       ├── supabase.js         # Thin createClient singleton (anon only)
│       ├── content.js          # 5-table aggregator + 60s cache + bust + helpers
│       ├── products.js         # Uncached, paginated/search version + category images map + reviews dupe
│       ├── categories.js       # Hardcoded CATEGORY_GROUPS + seedCategoriesIfEmpty + getByGroup
│       ├── notify.js           # EmailJS wrappers (hardcoded recipient)
│       └── enquiry-code.js     # NYD- prefix generator
├── supabase/
│   ├── migrations/             # 001–009 (with duplicates)
│   │   └── ... (see DB section)
│   ├── seed*.sql, products_seed.sql (huge), fix_rls_policies.sql
│   └── config.toml
├── public/                     # Source assets (images mirrored in dist/ after build)
├── dist/                       # Build output (Vite)
├── package.json, vite.config.js, vercel.json
├── AGENTS.md                   # Excellent but slightly stale overview
├── CODEMAP.md                  # This file (live map)
└── Root scripts (mostly one-off):
    *.py (image scrapers — obsolete), update_db.js, check_site.js, show_env.js, various seed_*.sql
```

**Hotspots** (from wc + agent analysis):
- AdminPage.js (~1965 LOC) — by far the largest/complex.
- CheckoutPage (~406), ProductDetailPage (~366), ShopPage (~300), Header (~391), HomePage (~231).

---

## 4. Conventions & Patterns (CONVENTIONS.md)

- **Pages**: Async `export async function renderXXXPage(params = {}, appContent)` → direct `#app` write. Post-render: querySelectorAll + listeners + `init*` calls.
- **Components**: `renderFoo()` returns HTML string. Optional `initFoo()` for events after mount.
- **Imports**: Prefer relative. Two parallel product APIs (see gotchas).
- **State**: LS for user carts, sessionStorage for admin, URLSearchParams for Shop filters (some pages mix with router params).
- **Navigation**: Always `navigateTo('/path')` or `<a href>`. Avoid `location.href` (Shop pagination still uses it — minor full-reload risk).
- **Styling**: CSS custom props in variables.css (primary #A0522D terracotta, cream bg). Global entry in main.js.
- **Error/Loading**: Minimal. PDP has skeleton. No boundaries.
- **Inline handlers**: Legacy `onclick="window.__addToCart..."` pattern supported via globals but not used in current source.

**Admin "auth"**: Password compare (env) → `sessionStorage.setItem('admin_auth','1')`. No real Supabase auth.

---

## 5. Testing, Quality, Dead Code (TESTING.md + part of CONCERNS)

- **No tests**. Playwright in devDeps only (check_site.js uses Puppeteer actually?).
- **Dead / unused** (confirmed by agents):
  - `src/data/nyd_products.js` (full static dump, 0 imports)
  - `data/products.js:getProductsByCategory` (exported, never called)
  - `data/products.js:getCategories` + several imports in PDP (destructured but unused)
  - `window.__addToCart/__addToQuote` (defined, 0 calls in src)
  - `ProductCard.js` imports `formatPrice` but never uses it
  - `orders`/`order_items` table + policies (created 003, zero usage — cart is pure LS)
  - `getProductBySlug` called with slug in reviews path (likely wrong PK type)

---

## 6. Integrations (INTEGRATIONS.md)

- **Supabase**: Primary (products, categories, junction, banners, content KV, submissions, reviews). Full anon RLS.
- **EmailJS**: Form notifications (quote/contact/order).
- **Cerebras AI**: FAQ chatbot LLM fallback (client-only, llama3.1-8b).
- **WhatsApp**: Floating + inline enquiry links (hardcoded +919899223130).
- **Vercel**: Hosting + rewrites.
- **No others** (no payments SDK, no analytics visible in code).

---

## 7. Concerns, Debt & Gotchas (CONCERNS.md — critical)

**High Severity (security / correctness / maintenance)**:
1. **Permissive anon RLS everywhere** (core architectural choice): All tables allow `anon` full writes (products, categories, submissions, junction, reviews...). Admin uses public anon key + client password gate only. Anyone with `VITE_SUPABASE_*` can mutate data directly. Original "authenticated read" intent (001) was abandoned. High production risk.
2. **Duplicate conflicting product modules** (`data/products.js` vs `lib/products.js`):
   - Different shapes (`category` = name str vs `categoryName`/`categoryId`)
   - One cached, one not
   - Dupe review/category fns
   - Usage split (most pages on data/, Home/Header on lib/)
   - Causes real bugs: ShopPage group/cat filters rely on `p.category` being name but CATEGORY_GROUPS uses slugs; CorporatePage has hardcoded string match; PDP related products etc. fragile.
3. **Migration chaos**: Duplicate filenames (003 x3, 005 x2). Lexical sort ambiguous. Many tables (`announcements`, `site_content`, `homepage_sections`, `shop_categories`) have **no CREATE TABLE** in any migration — only RLS/INSERTs. `supabase db reset` cannot reproduce schema.
4. **Base64 images in DB** (products.images TEXT[], banners etc.): Bloats rows, slow, no optimization. Admin converts uploads via FileReader. No Storage bucket used.
5. **Scattered/hardcoded contact data**: Phones, emails, WA numbers duplicated across main.js, HomePage, ContactPage, Footer fallback (old 9311 number), Chatbot facts, notify.js recipient (iamravi11 — probably personal).
6. **Client secrets exposure**: Cerebras key, EmailJS, Supabase anon, admin password all in bundle. Cerebras allows direct abuse.

**Medium / Other**:
- Client-side only "admin auth" (tab-only, no real sessions).
- Shop pagination uses `location.href` instead of `navigateTo` (potential reload).
- No cleanup fns used despite router support.
- PDP reviews query uses slug vs expected product UUID id.
- Toast implementation duplicated (store + pages + Admin).
- Many one-off root scripts + huge obsolete seeds still in tree.
- `update_db.js` hardcodes prod Supabase URL.
- LoginPage/AccountPage are stubs (no real auth flows).
- Category groups have overlaps and slug/name mismatches in filters.

**AGENTS.md accuracy**: Excellent high-level guide, but drifted on:
- `src/data/categories.js` no longer exists (only lib/).
- Two products libs and their exact split not fully detailed.
- Cerebras integration missing.
- Some dead code and specific filter bugs not called out.

---

## Quick Navigation — "What's Where"

**I want to...**
- Change homepage banners/sections → `lib/content.js`, AdminPage (homepage tab), `bustContentCache()`
- Add/edit product or categories → AdminPage (products/categories tabs) + junction handling + `data/products.js` normalize if needed
- Work on cart/quote → `data/store.js` + Header counts + pages that import it
- Fix Shop filtering → `pages/ShopPage.js` + `components/FilterSidebar.js` + `data/products.js` + `lib/categories.js` (CATEGORY_GROUPS)
- Tweak FAQ AI → `components/FaqChatbot.js` (SYSTEM_PROMPT + CEREBRAS_KEY)
- Modify header mega menu → `components/Header.js` + `lib/categories.js`
- Add a new page → Create `src/pages/NewPage.js` (render fn), import + `addRoute` in main.js, CSS in styles/pages.css
- Debug Supabase query → `lib/supabase.js` singleton + any `supabase.from(...)` call
- See DB schema history → `supabase/migrations/` (read in order, watch for 003/005 dups)
- Understand RLS for forms vs admin → 001 + 007 + 008 + 009 migrations + AdminPage direct queries

**Entry points for code reading**:
1. `src/main.js:135` (load + shell + routes)
2. `src/router.js:28` (resolveRoute)
3. `src/pages/ShopPage.js:44` or `src/pages/AdminPage.js:12` (largest surfaces)
4. `src/data/products.js:41` + `src/lib/products.js:37` (the duplication root)
5. `src/lib/content.js:12` (dynamic content)

---

## Recommended Next Actions (from map)

- **Consolidate product access**: Pick one module (recommend enhancing the cached `data/products.js`), delete or alias the other, fix all callers + normalize shapes.
- **Audit & tighten RLS** + consider real Supabase Auth for admin (or at least service_role for server-side admin ops).
- **Add missing CREATEs** to migrations or a fresh init script so `db reset` works.
- **Replace base64** with Supabase Storage (or external CDN) for images.
- **Centralize contacts** into site_settings or a constants file.
- **Clean dead code** (nyd_products, unused exports, orders table if truly abandoned).
- **Run full map again** after fixes: `gsd-map-codebase` (or this process).

---

**Sources for this map**:
- Direct reads: package.json, vite/vercel, main/router, all lib/data, key pages, all migrations.
- Parallel subagents (explore type): Frontend UI/routing (55 tool calls), Data duplication (55), Backend+DB+tooling (69).
- AGENTS.md (strong starting point).
- Grep for imports, patterns, hardcodes, RLS policies.

This CODEMAP + the live chat context from the three agents gives the definitive current state. Use it to navigate, refactor safely, or feed into `/gsd-new-project` or planning phases.

For the absolute latest on any file, read it directly.
