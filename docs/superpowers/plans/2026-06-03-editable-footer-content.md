# Editable Footer Content Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add editable footer paragraphs via new footer_sections table and admin UI.

**Architecture:** Dedicated footer_sections table (like homepage_sections) + upsert in admin footer tab + load in getContent + render in Footer.

**Tech Stack:** Supabase Postgres, vanilla JS admin form, existing content cache.

---

### Task 1: Create footer_sections migration

**Files:**
- Create: `supabase/migrations/20260603002_create_footer_sections.sql`

- [ ] **Step 1: Write the migration file**
```sql
-- Create footer_sections table for editable footer blocks
CREATE TABLE IF NOT EXISTS footer_sections (
  id serial PRIMARY KEY,
  section_key text UNIQUE NOT NULL,
  title text,
  content text,
  sort_order int DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed initial keys (empty content, admin will fill)
INSERT INTO footer_sections (section_key, title, content, sort_order) VALUES
('about_left', 'About Left', '', 1),
('exporter_right', 'Exporter Right', '', 2),
('services_list', 'Services List', '', 3)
ON CONFLICT (section_key) DO NOTHING;
```

- [ ] **Step 2: Commit**
```bash
git add supabase/migrations/20260603002_create_footer_sections.sql
git commit -m "feat(db): create footer_sections table for editable footer content"
```

### Task 2: Load footer_sections in getContent()

**Files:**
- Modify: `src/lib/content.js:20-34` (Promise.all + _cache)

- [ ] **Step 1: Add fetch to Promise.all**
After announcements fetch, add:
```js
    { data: footerSections },
    supabase.from('footer_sections').select('*').eq('active', true).order('sort_order'),
```

- [ ] **Step 2: Add to _cache object**
After announcements line:
```js
    footerSections: Object.fromEntries((footerSections || []).map(s => [s.section_key, s])),
```

- [ ] **Step 3: Commit**
```bash
git add src/lib/content.js
git commit -m "feat: load footer_sections into content cache"
```

### Task 3: Add textareas + save logic in admin footer tab

**Files:**
- Modify: `src/pages/AdminPage.js` (footer tab render + onsubmit)

- [ ] **Step 1: Insert 3 textareas in footer form**
After existing contact fields in the footer tab template, add:
```html
        <div class="form-group">
          <label>About Left Paragraph</label>
          <textarea name="footer_about_left" style="min-height:120px">${content.footerSections?.about_left?.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Exporter Right Paragraph</label>
          <textarea name="footer_exporter_right" style="min-height:120px">${content.footerSections?.exporter_right?.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Services / Products List</label>
          <textarea name="footer_services_list" style="min-height:120px">${content.footerSections?.services_list?.content || ''}</textarea>
        </div>
```

- [ ] **Step 2: Add upsert calls in footer save handler**
In the footer form onsubmit, after site_settings updates, add:
```js
    const footerKeys = ['about_left', 'exporter_right', 'services_list'];
    for (const key of footerKeys) {
      const val = fd.get(`footer_${key}`);
      if (val !== null) {
        await supabase.from('footer_sections').upsert({
          section_key: key,
          content: val,
          active: true
        }, { onConflict: 'section_key' });
      }
    }
```

- [ ] **Step 3: Commit**
```bash
git add src/pages/AdminPage.js
git commit -m "feat: add 3 footer textareas + upsert save in admin footer tab"
```

### Task 4: Use footerSections in Footer component

**Files:**
- Modify: `src/components/Footer.js` (the two paragraph areas)

- [ ] **Step 1: Replace hardcoded footer text with content**
In the left column about text:
```js
${content.footerSections?.about_left?.content || 'Default about text...'}
```
Same for right exporter paragraph and services list div.

- [ ] **Step 2: Commit**
```bash
git add src/components/Footer.js
git commit -m "feat: render editable footer paragraphs from footerSections"
```

### Task 5: Verification

**Files:** none

- [ ] **Step 1: Run dev + admin**
`npm run dev`

- [ ] **Step 2: Check admin**
Login admin → footer tab → confirm 3 new textareas, edit, save, reload shows persisted.

- [ ] **Step 3: Check homepage footer**
View site footer → confirm edited paragraphs appear.

- [ ] **Step 4: Commit note**
```bash
git commit --allow-empty -m "chore: manual verification of editable footer content complete"
```

**Plan complete and saved to `docs/superpowers/plans/2026-06-03-editable-footer-content.md`.**
