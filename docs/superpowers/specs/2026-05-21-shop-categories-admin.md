# Shop by Category Admin Management

## Problem
HomePage "SHOP BY CATEGORY" section renders ALL active categories from `categories` table. Admin has no control over which categories appear on homepage or their display images. Admin homepage tab shows a static message.

## Solution
Use existing `shop_categories` table to manage homepage-displayed categories with a dedicated admin UI in the homepage tab.

## Changes

### 1. Admin Homepage Tab — Shop Categories Form
New form section replacing the static message:
- **Table list** of existing `shop_categories` entries (image thumbnail, title, link, sort order, active status, edit/delete actions)
- **Add Category button** opens modal with:
  - Dropdown selecting from `categories` table (primary product categories)
  - On category select → auto-fill link as `/shop?cat={slug}`, auto-fill title
  - Editable CTA Link text field
  - Image upload → base64 data URL (same pattern as products/banners)
  - Sort order number input
  - Active checkbox
- **Edit** modal same as add, pre-filled
- **Delete** with confirmation dialog

### 2. HomePage.js Update
Replace `getCategories()` fetch with `shop_categories` table fetch for the "SHOP BY CATEGORY" section.

### 3. No Schema Changes
`shop_categories` table already exists: `id`, `title`, `image_url`, `link`, `sort_order`, `active`.

## Files Changed
- `src/pages/AdminPage.js` — add `renderShopCategories()` with modal, integrate into `renderHomepageSection()`
- `src/pages/HomePage.js` — fetch from `shop_categories` instead of `categories` for the cat section
