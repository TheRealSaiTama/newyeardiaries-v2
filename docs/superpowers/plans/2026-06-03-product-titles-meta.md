# Product Titles + Meta Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update product gallery titles to mixed-case normal font and add meta tags section in admin product form with DB columns.

**Architecture:** CSS-only for titles; extend existing product modal form + payload in AdminPage.js; new nullable columns on products table.

**Tech Stack:** Vanilla JS, Supabase (Postgres), Vite build, existing CSS vars.

---

### Task 1: Title CSS update

**Files:**
- Modify: `src/styles/components.css:1480`

- [ ] **Step 1: Read current rule**
Run: `sed -n '1480,1490p' src/styles/components.css`

- [ ] **Step 2: Replace with normal title style**
```css
.ap-product-title {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: var(--fs-sm);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--space-1);
  line-height: 1.3;
  /* removed text-transform: uppercase */
}
```

- [ ] **Step 3: Commit**
```bash
git add src/styles/components.css
git commit -m "style: normal mixed-case product titles with system font"
```

### Task 2: Add meta fields to product modal HTML

**Files:**
- Modify: `src/pages/AdminPage.js:631-636` (after description)

- [ ] **Step 1: Insert the SEO section HTML after description textarea**
Edit to add after line 631:
```html
        <div class="form-group"><label>Description</label><textarea name="description">${product?.description || ''}</textarea></div>
        <div class="form-group">
          <label>SEO / Meta Tags <small style="color:var(--color-text-tertiary)">(for product detail page & social)</small></label>
          <input name="meta_title" value="${product?.meta_title || ''}" placeholder="Meta title (≤60 chars)">
          <textarea name="meta_description" placeholder="Meta description (150-160 chars)" style="min-height:60px">${product?.meta_description || ''}</textarea>
          <input name="meta_keywords" value="${product?.meta_keywords || ''}" placeholder="Keywords (comma separated)">
          <input name="og_image_url" value="${product?.og_image_url || ''}" placeholder="OG image URL (optional)">
        </div>
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/AdminPage.js
git commit -m "feat: add SEO meta fields section after description in product modal"
```

### Task 3: Wire meta fields into form submit payload

**Files:**
- Modify: `src/pages/AdminPage.js:818-831` (payload construction)

- [ ] **Step 1: Extend payload with meta fields**
After `tags: ...` add:
```js
      meta_title: fd.get('meta_title') || null,
      meta_description: fd.get('meta_description') || null,
      meta_keywords: fd.get('meta_keywords') || null,
      og_image_url: fd.get('og_image_url') || null,
```

- [ ] **Step 2: Commit**
```bash
git add src/pages/AdminPage.js
git commit -m "feat: include meta fields in product save payload"
```

### Task 4: Create DB migration for new columns

**Files:**
- Create: `supabase/migrations/20260603001_add_product_meta_columns.sql`

- [ ] **Step 1: Write migration SQL**
```sql
-- Add per-product SEO meta columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS meta_title text,
  ADD COLUMN IF NOT EXISTS meta_description text,
  ADD COLUMN IF NOT EXISTS meta_keywords text,
  ADD COLUMN IF NOT EXISTS og_image_url text;
```

- [ ] **Step 2: Commit**
```bash
git add supabase/migrations/20260603001_add_product_meta_columns.sql
git commit -m "feat(db): add meta_title/desc/keywords/og_image columns to products"
```

### Task 5: Verification (manual, since no test suite)

**Files:** none

- [ ] **Step 1: Run dev server**
`npm run dev`

- [ ] **Step 2: Verify title style**
Open homepage/shop, inspect product card <h3.ap-product-title> — confirm no uppercase, system font, mixed case.

- [ ] **Step 3: Verify admin meta section**
Login admin → products → add/edit product → scroll to after Description → confirm 4 meta inputs prefill on edit, save works, values persist in DB.

- [ ] **Step 4: Commit verification note (optional)**
```bash
git commit --allow-empty -m "chore: manual verification of titles + meta admin UI complete"
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-product-titles-meta.md`.**
