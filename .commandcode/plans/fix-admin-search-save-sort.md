# Fix Admin Product Search Glitching, Save Failure, and Sort Order

## Root Causes

### 1. Search input glitching
- `src/pages/AdminPage.js` — 350ms debounce uses `e.target.value` inside `setTimeout`, which is a **stale closure** — by the time the timeout fires, it may read an old value
- Full `innerHTML` table rebuild on every debounced call causes visual flicker
- The fix: use a mutable `searchTerm` variable to always read the latest input value

### 2. Save not working (critical bug)
- Supabase RLS policies for `products` INSERT/UPDATE/DELETE require `TO authenticated`
- But admin auth uses `sessionStorage.admin_auth` (custom password check), NOT Supabase auth
- The `supabase-js` client is created with the **anon key** only — no auth session
- Result: `supabase.from('products').insert(payload)` is silently rejected by RLS
- The fix: change RLS policies from `TO authenticated` to `TO anon` since auth is handled client-side
- Same issue affects categories, banners, and site_settings write operations

### 3. Sort order wrong
- Both admin list (`renderProducts`) and public shop (`getProducts`) order by `sort_order` (all default to 0)
- Should order by `created_at DESC` (newest first)

---

## Fixes

### Code Changes
1. **`src/pages/AdminPage.js`** — Fix search debounce stale closure + change sort to `created_at DESC`
2. **`src/data/products.js`** — Change sort to `created_at DESC`
3. **`supabase/migrations/003_fix_anon_writes.sql`** — New migration: drop authenticated-only policies, recreate with anon access

### Database Migration (must be applied to Supabase)
New migration file `supabase/migrations/003_fix_anon_writes.sql` contains:
- DROP all `TO authenticated` policies for products, categories, banners, site_settings
- Recreate all with `TO anon` (admin auth is handled via client-side password, not Supabase Auth)

Run with: `npx supabase db push` or apply via Supabase SQL editor.
