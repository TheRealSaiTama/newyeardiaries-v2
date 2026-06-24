# Editable Site Title Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the browser <title> editable via admin settings so the year can be updated without code edits.

**Architecture:** Store in existing site_settings, set document.title in main.js after content load, add input in admin settings tab.

**Tech Stack:** Vite, Supabase, vanilla JS, existing admin settings form.

---

### Task 1: Set document.title dynamically in main.js

**Files:**
- Modify: `src/main.js:1-50` (after getContent in init)

- [ ] **Step 1: Read current init**
Run: `sed -n '1,50p' src/main.js`

- [ ] **Step 2: Add title set after content load**
After the getContent() call in the main init function, add:
```js
  const siteTitle = content.siteSettings?.site_title || 'New Year Diaries | Premium Diaries & Corporate Planners | Manufacturer Direct';
  document.title = siteTitle;
```

- [ ] **Step 3: Commit**
```bash
git add src/main.js
git commit -m "feat: set editable site title from site_settings on load"
```

### Task 2: Add input in admin settings tab

**Files:**
- Modify: `src/pages/AdminPage.js` (settings tab render + save)

- [ ] **Step 1: Add input in settings form**
In the settings tab form, after other inputs, add:
```html
        <div class="form-group"><label>Site Title (browser tab)</label><input name="site_title" value="${settings.site_title || ''}" placeholder="New Year Diaries | Premium Diaries & Corporate Planners | Manufacturer Direct"></div>
```

- [ ] **Step 2: Include in save payload**
In the settings onsubmit, add to the updates:
```js
    site_title: fd.get('site_title') || null,
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/AdminPage.js
git commit -m "feat: add site_title input in admin settings tab"
```

### Task 3: Remove or fallback static title in index.html

**Files:**
- Modify: `index.html:7`

- [ ] **Step 1: Change to dynamic-friendly fallback**
```html
  <title>New Year Diaries</title>
```

- [ ] **Step 2: Commit**
```bash
git add index.html
git commit -m "chore: fallback title in index.html"
```

### Task 4: Verification

**Files:** none

- [ ] **Step 1: Run dev**
`npm run dev`

- [ ] **Step 2: Check admin**
Admin settings tab shows the input, edit, save, reload → title updates in tab.

- [ ] **Step 3: Commit note**
```bash
git commit --allow-empty -m "chore: manual verification of editable site title complete"
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-editable-site-title.md`.**
