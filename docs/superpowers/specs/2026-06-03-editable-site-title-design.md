# Design: Editable Site <title> (2026-06-03)

## Overview (Sub-project 1 of 3)
Make the browser tab <title> (near favicon) editable via admin so the year can be updated without code change.

## Approach
- Store value in existing site_settings table (key: 'site_title').
- On app init in main.js (after getContent), set `document.title = content.siteSettings?.site_title || default`.
- Add input field in the existing Admin "settings" tab (or footer/settings) for editing + saving the value.
- No new tables or migrations.

## Files
- Modify: `index.html` (remove static title or keep fallback)
- Modify: `src/main.js` (set document.title after content load)
- Modify: `src/pages/AdminPage.js` (add input in settings tab + save)

## Success
- Admin can change the title; it updates in browser tab immediately on save + reload.
- Default fallback preserved.

(Approved approach A)
