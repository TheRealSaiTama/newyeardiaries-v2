# Design: Editable Footer Content via footer_sections Table (2026-06-03)

## Overview
Make the long descriptive paragraphs and lists in the site footer editable from the existing 'footer' tab in the admin panel. Use a new dedicated `footer_sections` table (modeled exactly after `homepage_sections`) for the content blocks, while keeping existing contact/address fields in site_settings/site_content.

## Data Model
New table `footer_sections`:
- id (serial pk)
- section_key (text, unique) — e.g. 'about_left', 'exporter_right', 'services_list'
- title (text, nullable)
- content (text) — the paragraph or bullet list
- sort_order (int, default 0)
- active (bool, default true)

Admin upserts by section_key. getContent() loads them into `content.footerSections = Object.fromEntries(...)`.

Approved approach B (dedicated table).

## Admin UI (footer tab)
Extend the current footer editing form (in AdminPage.js renderFooterTab / save handler):
- Three new <textarea> fields after the existing contact fields.
- Labels: "About Left Paragraph", "Exporter Right Paragraph", "Services / Products List".
- Prefill from footer_sections on load.
- On save: upsert each into footer_sections (section_key + content).

No new tab or modal. Consistent with homepage sections editing.

## Frontend (Footer.js + lib/content.js)
- getContent() adds:
  ```js
  { data: footerSections },
  supabase.from('footer_sections').select('*').eq('active', true).order('sort_order')
  ```
  then `footerSections: Object.fromEntries((footerSections||[]).map(s => [s.section_key, s]))`
- Update getFooterContent() or Footer render to pull `content.footerSections.about_left?.content` etc for the two paragraphs and list.
- Existing contact fields (tagline, address, phone...) remain unchanged.

## Non-Goals
- No rich-text editor (plain textarea).
- No auto-migration of old hardcoded footer text (admin will re-enter once).
- No change to WhatsApp button or layout.

## Files
- New migration: supabase/migrations/20260603002_create_footer_sections.sql
- Modify: src/lib/content.js (fetch + map)
- Modify: src/pages/AdminPage.js (admin form + save)
- Modify: src/components/Footer.js (use new content keys)

## Success Criteria
- Admin footer tab shows 3 new textareas; edits save and persist.
- Homepage footer displays the edited paragraphs/lists.
- Existing contact info continues to work.

Approved in sections: data model (yes), admin UI (yes), frontend (yes).
