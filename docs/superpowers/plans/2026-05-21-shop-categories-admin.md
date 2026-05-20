# Shop Categories Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add admin management UI for homepage "Shop by Category" section using existing `shop_categories` table, with category selector dropdown, auto-filled link, image upload.

**Architecture:** AdminPage.js renders a new management card inside the homepage tab. A modal handles add/edit with a dropdown populated from `categories` table. HomePage.js switches from fetching all `categories` to fetching only `shop_categories` entries.

**Tech Stack:** Vanilla JS, Supabase (anon key), base64 data URL for images

---

### Task 1: Add Shop Categories admin form in AdminPage.js

**Files:**
- Modify: `src/pages/AdminPage.js` — replace static "Shop by Category" message with full management UI

**Overview:** Replace the static admin-card at the bottom of `renderHomepageSection()` with a live management table + modal. Re-use existing patterns: `admin-table`, `admin-modal`, `readFileAsDataUrl`, `closeModal`, `showConfirmDialog`, `showToast`.

- [ ] **Step 1: Add fetch for shop_categories and categories inside renderHomepageSection**

In `renderHomepageSection()`, add parallel fetch for `shop_categories` and `categories`:

```js
const { data: shopCats } = await supabase.from('shop_categories').select('*').order('sort_order');
const { data: primaryCats } = await supabase.from('categories').select('id, name, slug').eq('active', true).order('sort_order');
```

- [ ] **Step 2: Replace static "Shop by Category" card with live table + add button**

Find this block starting at line 1682:

```js
    <div class="admin-card">
      <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6)">
        <h2 style="font-size:var(--fs-lg)">🗂️ Shop by Category — displayed from Categories tab</h2>
        <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">Manage categories in the Categories tab. Homepage auto-displays all active categories.</p>
      </div>
    </div>
```

Replace with:

```js
    <div class="admin-card" style="padding:0;overflow:hidden">
      <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6);display:flex;align-items:center;justify-content:space-between">
        <div>
          <h2 style="font-size:var(--fs-lg);margin:0">🗂️ Shop by Category</h2>
          <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">Categories displayed in the homepage "SHOP BY CATEGORY" section</p>
        </div>
        <button class="admin-btn admin-btn-primary" id="add-shop-cat-btn">
          <span class="material-symbols-outlined">add</span> Add Category
        </button>
      </div>
      ${shopCats?.length ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Image</th><th>Title</th><th>Link</th><th>Order</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody>
          ${shopCats.map(c => `<tr data-id="${c.id}">
            <td><img src="${c.image_url || '/images/placeholder.jpg'}" style="width:48px;height:48px;object-fit:cover;border-radius:4px" /></td>
            <td><strong>${c.title}</strong></td>
            <td style="font-size:var(--fs-sm);color:var(--color-text-tertiary)">${c.link}</td>
            <td>${c.sort_order || 0}</td>
            <td><span class="badge ${c.active !== false ? 'badge-active' : 'badge-inactive'}">${c.active !== false ? 'Active' : 'Inactive'}</span></td>
            <td class="col-actions">
              <button class="edit-shop-cat-btn"><span class="material-symbols-outlined">edit</span></button>
              <button class="delete-shop-cat-btn"><span class="material-symbols-outlined">delete</span></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state" style="padding:var(--space-6)"><span class="material-symbols-outlined">category</span><p>No shop categories added yet</p></div>`}
    </div>
```

- [ ] **Step 3: Wire Add button and Edit/Delete buttons**

After `container.innerHTML = ...` and after event handlers for hero/cta forms, add:

```js
  document.getElementById('add-shop-cat-btn').onclick = () => openShopCategoryModal(container, null, primaryCats);
  document.querySelectorAll('.edit-shop-cat-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      openShopCategoryModal(container, shopCats.find(c => c.id === id), primaryCats);
    };
  });
  document.querySelectorAll('.delete-shop-cat-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this shop category?', async () => {
        await supabase.from('shop_categories').delete().eq('id', id);
        showToast('Shop category deleted!');
        renderHomepageSection(container);
      });
    };
  });
```

- [ ] **Step 4: Create `openShopCategoryModal` function**

Add after the `renderHomepageSection` function (before `renderFooterSection`):

```js
function openShopCategoryModal(container, shopCat, primaryCats) {
  const isEdit = !!shopCat;
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h2>${isEdit ? 'Edit' : 'Add'} Shop Category</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form class="admin-form" id="shop-cat-form">
        <div class="form-group">
          <label>Primary Category</label>
          <select name="category_ref" id="cat-ref-select">
            <option value="">— Select a category —</option>
            ${(primaryCats || []).map(c => `
              <option value="${c.slug}" data-name="${c.name}" ${isEdit && shopCat.link === '/shop?cat=' + c.slug ? 'selected' : ''}>${c.name}</option>
            `).join('')}
          </select>
        </div>
        <div class="form-group"><label>Title *</label><input name="title" id="shop-cat-title" required value="${shopCat?.title || ''}"></div>
        <div class="form-group"><label>CTA Link *</label><input name="link" id="shop-cat-link" required value="${shopCat?.link || ''}"></div>
        <div class="form-group">
          <label>Image</label>
          ${shopCat?.image_url ? `<div style="margin-bottom:var(--space-2)"><img src="${shopCat.image_url}" style="max-width:200px;max-height:120px;border-radius:4px;object-fit:cover" /></div>` : ''}
          <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp" ${isEdit ? '' : ''}>
          <small style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Upload will replace existing image. Max 8MB.</small>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="${shopCat?.sort_order || 0}"></div>
          <div class="form-group checkbox"><input name="active" type="checkbox" id="shop-cat-active" ${shopCat?.active !== false ? 'checked' : ''}><label for="shop-cat-active">Active</label></div>
        </div>
        <input type="hidden" name="existing_image" value="${shopCat?.image_url || ''}">
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save Changes' : 'Add Category'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  document.getElementById('cat-ref-select').onchange = (e) => {
    const opt = e.target.selectedOptions[0];
    if (opt && opt.value) {
      document.getElementById('shop-cat-title').value = opt.dataset.name;
      document.getElementById('shop-cat-link').value = '/shop?cat=' + opt.value;
    }
  };

  document.getElementById('shop-cat-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = fd.get('title').trim();
    const link = fd.get('link').trim();
    if (!title || !link) { showToast('Title and Link are required.', 'error'); return; }

    let imageUrl = fd.get('existing_image') || '';
    const fileInput = e.target.querySelector('[name="image_file"]');
    if (fileInput?.files?.length) {
      try {
        const uploaded = await readMediaFiles(fileInput, IMAGE_TYPES);
        if (uploaded.length) imageUrl = uploaded[0];
      } catch (err) {
        showToast(err.message, 'error');
        return;
      }
    }

    const payload = {
      title,
      link,
      image_url: imageUrl || null,
      sort_order: Number(fd.get('sort_order')) || 0,
      active: fd.get('active') === 'on',
    };

    const { error } = isEdit
      ? await supabase.from('shop_categories').update(payload).eq('id', shopCat.id)
      : await supabase.from('shop_categories').insert(payload);
    if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    closeModal();
    showToast(isEdit ? 'Shop category updated!' : 'Shop category added!');
    renderHomepageSection(container);
  };
}
```

**IMPORTANT**: Make sure `IMAGE_TYPES` and `readMediaFiles`, `closeModal`, `showConfirmDialog`, `showToast` are already available in scope (they are — used throughout the file).

---

### Task 2: Update HomePage.js to use shop_categories

**Files:**
- Modify: `src/pages/HomePage.js` — switch category section to use `shop_categories` table

- [ ] **Step 1: Add supabase import and remove getCategories from import**

```js
// At top of file, add supabase import:
import { supabase } from '../lib/supabase.js';

// Remove getCategories from the products import line:
import { getProducts } from '../lib/products.js';
```

- [ ] **Step 2: Replace the categories fetch with shop_categories fetch**

In `renderHomePage()`, find:
```js
const [content, allCategories] = await Promise.all([
    getContent(),
    getCategories(),
  ]);
```

Replace with:
```js
  const [content] = await Promise.all([
    getContent(),
  ]);
```

And add after the existing Promise.all calls (around line 37):
```js
  const { data: shopCategories } = await supabase
    .from('shop_categories')
    .select('*')
    .eq('active', true)
    .order('sort_order');
```

- [ ] **Step 3: Update the SHOP BY CATEGORY section to use shopCategories**

Find the section that maps `allCategories` (around line 78):

```js
              ${allCategories.map(cat => `
                <div class="ap-cat-card-wrap">
                  <a href="/shop?cat=${cat.slug}" class="ap-cat-card">
                    <div class="ap-cat-img-wrapper">
                      <img src="${cat.image_url || '/images/placeholder.jpg'}" alt="${cat.name}" loading="lazy" />
                    </div>
                    <div class="ap-cat-label">${cat.name}</div>
                  </a>
                </div>
              `).join('')}
```

Replace with:

```js
              ${(shopCategories || []).map(sc => `
                <div class="ap-cat-card-wrap">
                  <a href="${sc.link}" class="ap-cat-card">
                    <div class="ap-cat-img-wrapper">
                      <img src="${sc.image_url || '/images/placeholder.jpg'}" alt="${sc.title}" loading="lazy" />
                    </div>
                    <div class="ap-cat-label">${sc.title}</div>
                  </a>
                </div>
              `).join('')}
```

- [ ] **Step 4: Remove the `catMap` variable if it's no longer needed**

Check if `catMap` (line 22: `const catMap = Object.fromEntries(allCategories.map(c => [c.slug, c]));`) is used elsewhere (it is — for `SECTION_CATS` lookups on lines 32-37). The `getCategories()` call was also providing `allCategories` for `catMap`. We need to keep getting the categories for catMap.

Instead of removing `getCategories()` entirely, add a separate fetch:

```js
  const [content, allCategories] = await Promise.all([
    getContent(),
    getCategories(),
  ]);
```

Keep this as-is (for `catMap` used by product sections). Then add the shopCategories fetch separately:

```js
  const { data: shopCategories } = await supabase
    .from('shop_categories')
    .select('*')
    .eq('active', true)
    .order('sort_order');
```

This means `allCategories` stays for the product slider sections (leather, combo, premium), while `shopCategories` drives the "SHOP BY CATEGORY" section.
