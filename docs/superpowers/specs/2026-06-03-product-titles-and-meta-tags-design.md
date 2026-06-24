# Design: Product Gallery Titles + Per-Product Meta Tags (2026-06-03)

## Overview
Two small improvements:
1. Change product card titles from ALL CAPS to normal mixed-case with friendlier e-commerce font.
2. Add SEO meta tags section (title, description, keywords, OG image) in the admin product form (after Description), stored in dedicated DB columns.

## Title Styling Change
- **Current**: `.ap-product-title` uses `text-transform: uppercase` + heavy font (all caps like "DIARY TEST 1").
- **New**: Remove uppercase transform; switch to `font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-weight: 600; text-transform: none;`.
- Rationale: Better readability, modern ecom standard, less shouting. No backend change.
- Scope: All usages of `renderProductCard` (Home sliders, ShopPage grid, etc.).
- Visual choice: Option B approved.

## Meta Tags Section (Admin)
- **Placement**: Immediately after the main "Description" textarea (Option A approved).
- **Fields** (all approved):
  - Meta Title (text input, ~60 char hint)
  - Meta Description (textarea, 150-160 char hint)
  - Meta Keywords (text, comma-separated)
  - OG Image URL (text/url input)
- **Storage**: New dedicated columns on `products` table: `meta_title`, `meta_description`, `meta_keywords`, `og_image_url` (Option A).
- **UI behavior**:
  - Prefill values on edit.
  - On save: include in payload (no special handling beyond existing).
  - Preview img not needed (OG image is just URL).
- **Frontend usage**: (future) ProductDetailPage will render `<meta>` tags from these (out of scope for this change).
- **DB impact**: Requires Supabase migration to add 4 nullable text columns (no RLS change).

## Non-Goals / YAGNI
- No auto-generation of meta from name/desc.
- No validation or char counters (just placeholders).
- No sitemap/robots integration.
- No change to existing product.name or short_description.

## Files Changed
- `src/styles/components.css` (title CSS)
- `src/pages/AdminPage.js` (add 4 form inputs + hidden handling if needed + payload fields)
- `supabase/migrations/XXXX_add_product_meta_columns.sql` (new migration)

## Success Criteria
- Titles render in mixed case with system font on all product cards.
- Admin can edit/save the 4 meta fields per product; values persist and prefill on edit.
- No breakage to existing product save flow.

## Open Questions
- Exact migration timestamp/number (to be generated on impl).
- Whether ProductDetailPage meta injection is part of this or separate.

Approved sections: Title style (yes), Meta placement/fields/storage (yes).
