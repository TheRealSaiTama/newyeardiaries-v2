import { supabase } from '../lib/supabase.js';
import { navigateTo } from '../router.js';
import { bustContentCache } from '../lib/content.js';
import { CATEGORY_GROUPS, getCategoriesByGroup, fetchCategories, fetchCategoryGroups, bustCategoriesCache } from '../lib/categories.js';

let currentTab = 'products';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'nyd2026';
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const SECONDARY_MEDIA_TYPES = [...IMAGE_TYPES, 'video/mp4'];
const MAX_MEDIA_SIZE = 8 * 1024 * 1024;

export function renderAdminPage() {
  const isAuthed = sessionStorage.getItem('admin_auth') === '1';

  if (!isAuthed) {
    return `
      <div class="admin-login-wrap">
        <div class="admin-login-card">
          <div class="admin-login-logo">
            <span class="material-symbols-outlined">lock</span>
            <h1>Admin Access</h1>
          </div>
          <form class="admin-login-form" id="admin-login-form">
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="admin-pass" placeholder="Enter admin password" required autofocus>
            </div>
            <button type="submit" class="admin-btn admin-btn-primary" style="width:100%">Enter Dashboard</button>
          </form>
          <p class="admin-login-hint">Contact uncle ji if you don't have the password</p>
        </div>
      </div>
      <style>
      .admin-login-wrap { min-height: calc(100vh - var(--header-height)); display: flex; align-items: center; justify-content: center; background: var(--color-surface-alt); }
      .admin-login-card { background: var(--color-surface); padding: var(--space-10); border-radius: var(--radius-xl); box-shadow: var(--shadow-xl); width: 100%; max-width: 400px; }
      .admin-login-logo { text-align: center; margin-bottom: var(--space-8); }
      .admin-login-logo .material-symbols-outlined { font-size: 48px; color: var(--color-primary); margin-bottom: var(--space-4); }
      .admin-login-logo h1 { font-size: var(--fs-2xl); font-weight: var(--fw-bold); color: var(--color-text-primary); }
      .admin-login-form { display: flex; flex-direction: column; gap: var(--space-4); }
      .admin-login-hint { text-align: center; font-size: var(--fs-xs); color: var(--color-text-tertiary); margin-top: var(--space-4); }
      </style>
    `;
  }

  return `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-logo">
          <a href="/" class="admin-back">
            <span class="material-symbols-outlined">arrow_back</span>
            Back to Site
          </a>
        </div>
        <nav class="admin-nav">
          <button class="admin-nav-item ${currentTab === 'homepage' ? 'active' : ''}" data-tab="homepage">
            <span class="material-symbols-outlined">home</span>
            Homepage
          </button>
          <button class="admin-nav-item ${currentTab === 'header' ? 'active' : ''}" data-tab="header">
            <span class="material-symbols-outlined">campaign</span>
            Header
          </button>
          <button class="admin-nav-item ${currentTab === 'products' ? 'active' : ''}" data-tab="products">
            <span class="material-symbols-outlined">inventory_2</span>
            Products
          </button>
          <button class="admin-nav-item ${currentTab === 'categories' ? 'active' : ''}" data-tab="categories">
            <span class="material-symbols-outlined">category</span>
            Categories
          </button>
          <button class="admin-nav-item ${currentTab === 'banners' ? 'active' : ''}" data-tab="banners">
            <span class="material-symbols-outlined">perm_media</span>
            Banners
          </button>
          <button class="admin-nav-item ${currentTab === 'footer' ? 'active' : ''}" data-tab="footer">
            <span class="material-symbols-outlined">footer</span>
            Footer
          </button>
          <button class="admin-nav-item ${currentTab === 'settings' ? 'active' : ''}" data-tab="settings">
            <span class="material-symbols-outlined">settings</span>
            Settings
          </button>
          <button class="admin-nav-item ${currentTab === 'enquiries' ? 'active' : ''}" data-tab="enquiries">
            <span class="material-symbols-outlined">inbox</span>
            Enquiries
          </button>
        </nav>
      </aside>
      <main class="admin-main" id="admin-content">
        <div class="admin-loading">
          <span class="material-symbols-outlined spin">progress_activity</span>
          Loading...
        </div>
      </main>
    </div>
    <style>
    .admin-shell { display: flex; min-height: calc(100vh - var(--header-height)); }
    .admin-sidebar { width: 240px; background: var(--color-footer-bg); color: var(--color-footer-text); flex-shrink: 0; padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .admin-back { display: flex; align-items: center; gap: var(--space-2); color: var(--color-footer-link); text-decoration: none; font-size: var(--fs-sm); padding: var(--space-2); border-radius: var(--radius-md); transition: var(--transition-fast); }
    .admin-back:hover { color: var(--color-footer-link-hover); background: rgba(255,255,255,0.05); }
    .admin-nav { display: flex; flex-direction: column; gap: var(--space-1); margin-top: var(--space-4); }
    .admin-nav-item { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); border: none; background: transparent; color: var(--color-footer-link); border-radius: var(--radius-md); cursor: pointer; font-size: var(--fs-base); font-family: inherit; text-align: left; transition: var(--transition-fast); width: 100%; }
    .admin-nav-item:hover { background: rgba(255,255,255,0.08); color: var(--color-footer-link-hover); }
    .admin-nav-item.active { background: var(--color-primary); color: #fff; }
    .admin-nav-item .material-symbols-outlined { font-size: 20px; }
    .admin-main { flex: 1; padding: var(--space-8); overflow-y: auto; background: var(--color-surface-alt); }
    .admin-loading { display: flex; align-items: center; gap: var(--space-3); color: var(--color-text-secondary); padding: var(--space-8); }
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* Shared admin table styles */
    .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-6); gap: var(--space-4); flex-wrap: wrap; }
    .admin-header-left { display: flex; flex-direction: column; gap: var(--space-1); }
    .admin-header h1 { font-size: var(--fs-2xl); font-weight: var(--fw-bold); color: var(--color-text-primary); }
    .admin-header-stats { font-size: var(--fs-sm); color: var(--color-text-secondary); }
    .admin-search-wrap { position: relative; flex: 1; max-width: 320px; }
    .admin-search-wrap .material-symbols-outlined { position: absolute; left: var(--space-3); top: 50%; transform: translateY(-50%); font-size: 18px; color: var(--color-text-tertiary); pointer-events: none; }
    .admin-search { width: 100%; padding: var(--space-2) var(--space-3) var(--space-2) 36px; border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: var(--fs-base); background: var(--color-surface); color: var(--color-text-primary); transition: var(--transition-fast); }
    .admin-search:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.1); }
    .admin-filter-select { padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: var(--fs-base); background: var(--color-surface); color: var(--color-text-primary); cursor: pointer; }
    .admin-filter-select:focus { outline: none; border-color: var(--color-primary); }
    .admin-btn { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-4); border-radius: var(--radius-md); border: none; cursor: pointer; font-family: inherit; font-size: var(--fs-base); font-weight: var(--fw-medium); transition: var(--transition-fast); white-space: nowrap; }
    .admin-btn-primary { background: var(--color-primary); color: #fff; }
    .admin-btn-primary:hover { background: var(--color-primary-hover); transform: translateY(-1px); box-shadow: var(--shadow-md); }
    .admin-btn-danger { background: var(--color-error); color: #fff; }
    .admin-btn-danger:hover { background: #a12020; }
    .admin-btn-ghost { background: transparent; color: var(--color-text-secondary); border: 1px solid var(--color-border); }
    .admin-btn-ghost:hover { background: var(--color-surface); }
    .admin-btn-success { background: var(--color-success); color: #fff; }
    .admin-btn-success:hover { background: #1a7a3a; }
    .admin-card { background: var(--color-surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); overflow: hidden; }
    .admin-table-wrap { overflow-x: auto; }
    .admin-table { width: 100%; border-collapse: collapse; min-width: 600px; }
    .admin-table th { text-align: left; padding: var(--space-3) var(--space-4); background: var(--color-surface-alt); font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: var(--ls-wider); border-bottom: 1px solid var(--color-border); white-space: nowrap; }
    .admin-table td { padding: var(--space-3) var(--space-4); border-bottom: 1px solid var(--color-border-light); font-size: var(--fs-base); vertical-align: middle; }
    .admin-table tr:last-child td { border-bottom: none; }
    .admin-table tbody tr { transition: var(--transition-fast); }
    .admin-table tbody tr:hover td { background: rgba(160, 82, 45, 0.03); }
    .admin-table .col-image { width: 80px; }
    .admin-table .col-image img { width: 64px; height: 64px; object-fit: cover; border-radius: var(--radius-md); background: var(--color-surface-alt); border: 1px solid var(--color-border-light); transition: var(--transition-fast); cursor: pointer; }
    .admin-table .col-image img:hover { transform: scale(1.1); box-shadow: var(--shadow-lg); }
    .admin-table .col-name strong { display: block; font-weight: var(--fw-semibold); color: var(--color-text-primary); }
    .admin-table .col-name span { font-size: var(--fs-xs); color: var(--color-text-tertiary); }
    .admin-table .col-actions { width: 132px; }
    .admin-table .col-actions { display: flex; gap: var(--space-2); }
    .admin-table .col-actions button { width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); border: 1px solid var(--color-border); cursor: pointer; background: var(--color-surface); color: var(--color-text-secondary); transition: var(--transition-fast); }
    .admin-table .col-actions button:hover { background: var(--color-surface-alt); color: var(--color-text-primary); border-color: var(--color-primary); }
    .admin-table .col-actions button.delete:hover { color: var(--color-error); border-color: var(--color-error); background: var(--color-error-bg); }
    .admin-table .col-actions button .material-symbols-outlined { font-size: 16px; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: var(--radius-full); font-size: var(--fs-xs); font-weight: var(--fw-semibold); letter-spacing: 0.02em; }
    .badge-active { background: var(--color-success-bg); color: var(--color-success); }
    .badge-inactive { background: var(--color-error-bg); color: var(--color-error); }
    .badge-new { background: rgba(160,82,45,0.1); color: var(--color-primary); }
    .badge-reviewed { background: var(--color-success-bg); color: var(--color-success); }

    /* Pagination */
    .admin-pagination { display: flex; align-items: center; justify-content: center; gap: var(--space-2); padding: var(--space-4); }
    .admin-pagination button { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; font-family: inherit; font-size: var(--fs-base); transition: var(--transition-fast); }
    .admin-pagination button:hover:not(:disabled) { background: var(--color-surface-alt); color: var(--color-text-primary); border-color: var(--color-primary); }
    .admin-pagination button:disabled { opacity: 0.4; cursor: not-allowed; }
    .admin-pagination button.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
    .admin-pagination .page-info { font-size: var(--fs-sm); color: var(--color-text-secondary); padding: 0 var(--space-3); }

    /* Modal */
    .admin-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: var(--space-4); backdrop-filter: blur(4px); }
    .admin-modal { background: var(--color-surface); border-radius: var(--radius-xl); width: 100%; max-width: 640px; max-height: 90vh; overflow-y: auto; box-shadow: var(--shadow-modal); animation: modalIn 0.2s ease; }
    @keyframes modalIn { from { opacity: 0; transform: translateY(16px) scale(0.98); } to { opacity: 1; transform: none; } }
    .admin-modal-header { display: flex; justify-content: space-between; align-items: center; padding: var(--space-6); border-bottom: 1px solid var(--color-border); position: sticky; top: 0; background: var(--color-surface); z-index: 1; }
    .admin-modal-header h2 { font-size: var(--fs-xl); font-weight: var(--fw-bold); }
    .admin-modal-close { background: none; border: none; cursor: pointer; color: var(--color-text-secondary); padding: var(--space-1); border-radius: var(--radius-sm); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; transition: var(--transition-fast); }
    .admin-modal-close:hover { background: var(--color-surface-alt); color: var(--color-text-primary); }
    .admin-form { padding: var(--space-6); display: flex; flex-direction: column; gap: var(--space-4); }
    .form-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .form-group label { font-size: var(--fs-sm); font-weight: var(--fw-medium); color: var(--color-text-secondary); }
    .form-group input, .form-group select, .form-group textarea { padding: var(--space-3) var(--space-4); border: 1px solid var(--color-border); border-radius: var(--radius-md); font-family: inherit; font-size: var(--fs-base); background: var(--color-surface); color: var(--color-text-primary); transition: var(--transition-fast); }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: var(--color-primary); box-shadow: 0 0 0 3px rgba(160, 82, 45, 0.12); }
    .form-group input[readonly] { background: var(--color-surface-alt); color: var(--color-text-secondary); cursor: not-allowed; }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-group.checkbox { flex-direction: row; align-items: center; gap: var(--space-3); }
    .form-group.checkbox input { width: 18px; height: 18px; accent-color: var(--color-primary); }
    .admin-media-picker { display: flex; flex-direction: column; gap: var(--space-3); padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface-alt); }
    .admin-media-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: var(--space-3); min-height: 148px; }
    .admin-media-empty { min-height: 148px; display: flex; align-items: center; justify-content: center; border: 1px dashed var(--color-border); border-radius: var(--radius-md); color: var(--color-text-tertiary); font-size: var(--fs-sm); text-align: center; padding: var(--space-4); background: var(--color-surface); }
    .admin-media-tile { position: relative; aspect-ratio: 1 / 1; overflow: hidden; border-radius: var(--radius-md); background: var(--color-surface); border: 1px solid var(--color-border-light); box-shadow: var(--shadow-sm); }
    .admin-media-tile img, .admin-media-tile video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .admin-media-remove { position: absolute; top: 6px; right: 6px; width: 28px; height: 28px; border: none; border-radius: var(--radius-full); background: rgba(0,0,0,0.72); color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; line-height: 1; }
    .admin-media-remove .material-symbols-outlined { font-size: 18px; }
    .admin-media-name { position: absolute; left: 0; right: 0; bottom: 0; padding: 7px 8px; background: linear-gradient(transparent, rgba(0,0,0,0.72)); color: #fff; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .admin-media-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--space-3); flex-wrap: wrap; }
    .admin-media-actions small { color: var(--color-text-tertiary); font-size: var(--fs-xs); }
    .admin-media-add { display: inline-flex; align-items: center; gap: var(--space-2); padding: var(--space-2) var(--space-3); border-radius: var(--radius-md); border: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text-primary); cursor: pointer; font-size: var(--fs-sm); font-weight: var(--fw-medium); transition: var(--transition-fast); }
    .admin-media-add:hover { border-color: var(--color-primary); color: var(--color-primary); box-shadow: var(--shadow-sm); }
    .admin-media-add .material-symbols-outlined { font-size: 18px; }
    .admin-media-input { position: absolute; inline-size: 1px; block-size: 1px; opacity: 0; pointer-events: none; }
    .admin-cat-checkboxes { display: flex; flex-wrap: wrap; gap: var(--space-2); max-height: 160px; overflow-y: auto; padding: var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); }
    .admin-cat-checkbox { display: flex; align-items: center; gap: var(--space-2); font-size: var(--fs-sm); cursor: pointer; padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); transition: background 0.15s; }
    .admin-cat-group-label { font-size: var(--fs-xs); font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-tertiary); padding: var(--space-2) var(--space-2) var(--space-1); margin-top: var(--space-2); border-bottom: 1px solid var(--color-border-light); width: 100%; }
    .admin-cat-group-label:first-child { margin-top: 0; }
    .admin-cat-checkboxes { flex-direction: column; align-items: stretch !important; }
    .admin-cat-checkbox:hover { background: var(--color-surface-alt); }
    .admin-cat-checkbox input { accent-color: var(--color-primary); }
    .admin-modal-actions { display: flex; gap: var(--space-3); justify-content: flex-end; padding: var(--space-6); border-top: 1px solid var(--color-border); }
    .empty-state { text-align: center; padding: var(--space-16); color: var(--color-text-secondary); }
    .empty-state .material-symbols-outlined { font-size: 48px; margin-bottom: var(--space-4); }
    .toast { position: fixed; bottom: var(--space-6); right: var(--space-6); padding: var(--space-3) var(--space-5); background: var(--color-footer-bg); color: #fff; border-radius: var(--radius-md); font-size: var(--fs-base); z-index: 2000; box-shadow: var(--shadow-xl); animation: slideIn 0.3s ease; display: flex; align-items: center; gap: var(--space-2); }
    .toast.success { background: var(--color-success); }
    .toast.error { background: var(--color-error); }
    .toast .material-symbols-outlined { font-size: 18px; }
    @keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

    /* Image lightbox */
    .img-lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.85); z-index: 3000; display: flex; align-items: center; justify-content: center; cursor: zoom-out; }
    .img-lightbox img { max-width: 90vw; max-height: 90vh; object-fit: contain; border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); }

    /* Settings form */
    .settings-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-6); }
    .settings-section { background: var(--color-surface); border-radius: var(--radius-lg); padding: var(--space-6); box-shadow: var(--shadow-md); }
    .settings-section h3 { font-size: var(--fs-lg); font-weight: var(--fw-bold); margin-bottom: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-border); }

    /* Enquiry tabs */
    .enquiry-tabs { display: flex; gap: var(--space-2); margin-bottom: var(--space-6); border-bottom: 1px solid var(--color-border); padding-bottom: var(--space-2); }
    .enquiry-tab { padding: var(--space-2) var(--space-4); border: none; background: transparent; color: var(--color-text-secondary); cursor: pointer; font-family: inherit; font-size: var(--fs-base); border-radius: var(--radius-md); transition: var(--transition-fast); position: relative; }
    .enquiry-tab:hover { background: var(--color-surface); color: var(--color-text-primary); }
    .enquiry-tab.active { background: var(--color-primary); color: #fff; }
    .enquiry-tab .count-badge { display: inline-flex; align-items: center; justify-content: center; min-width: 20px; height: 20px; padding: 0 6px; background: rgba(255,255,255,0.2); border-radius: var(--radius-full); font-size: 11px; margin-left: var(--space-2); }
    .enquiry-tab:not(.active) .count-badge { background: var(--color-surface-alt); color: var(--color-text-secondary); }
    .enquiry-detail-modal { max-width: 700px; }
    .enquiry-field { display: flex; flex-direction: column; gap: var(--space-1); padding: var(--space-3) 0; border-bottom: 1px solid var(--color-border-light); }
    .enquiry-field:last-child { border-bottom: none; }
    .enquiry-field label { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: var(--ls-wider); }
    .enquiry-field .value { font-size: var(--fs-base); color: var(--color-text-primary); }

    /* Confirm dialog */
    .confirm-dialog { max-width: 400px; }
    .confirm-dialog p { font-size: var(--fs-base); color: var(--color-text-secondary); margin: 0; }

    /* ===== Products filesystem directory ===== */
    .fs-breadcrumb { display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap; padding: var(--space-3) var(--space-4); background: var(--color-surface-alt); border: 1px solid var(--color-border-light); border-radius: var(--radius-md); margin-bottom: var(--space-5); font-size: var(--fs-sm); }
    .fs-back { display: inline-flex; align-items: center; gap: 4px; padding: var(--space-1) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-md); background: var(--color-surface); color: var(--color-text-secondary); cursor: pointer; font-family: inherit; font-size: var(--fs-sm); font-weight: var(--fw-medium); transition: var(--transition-fast); }
    .fs-back:hover:not(:disabled) { background: var(--color-surface); color: var(--color-primary); border-color: var(--color-primary); }
    .fs-back:disabled { opacity: .4; cursor: not-allowed; }
    .fs-back .material-symbols-outlined { font-size: 18px; }
    .fs-path { display: flex; align-items: center; gap: var(--space-1); flex-wrap: wrap; }
    .fs-crumb { background: none; border: none; padding: var(--space-1) var(--space-2); color: var(--color-text-secondary); cursor: pointer; font-family: inherit; font-size: var(--fs-sm); font-weight: var(--fw-medium); border-radius: var(--radius-sm); transition: var(--transition-fast); }
    .fs-crumb:hover:not(:disabled) { color: var(--color-primary); background: var(--color-surface-alt); }
    .fs-crumb:disabled { color: var(--color-text-primary); font-weight: var(--fw-semibold); cursor: default; }
    .fs-crumb-sep { color: var(--color-text-tertiary); font-size: 16px; }
    .fs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: var(--space-4); }
    .fs-folder { position: relative; display: flex; flex-direction: column; align-items: flex-start; gap: var(--space-3); padding: var(--space-5); background: var(--color-surface); border: 1px solid var(--color-border-light); border-radius: var(--radius-lg); cursor: pointer; transition: var(--transition-fast); text-align: left; font-family: inherit; min-height: 130px; }
    .fs-folder:hover { border-color: var(--color-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .fs-folder__icon { font-size: 40px; color: var(--color-accent); line-height: 1; }
    .fs-folder--system .fs-folder__icon { color: var(--color-text-tertiary); }
    .fs-folder__name { font-size: var(--fs-base); font-weight: var(--fw-semibold); color: var(--color-text-primary); line-height: 1.3; }
    .fs-folder__meta { font-size: var(--fs-xs); color: var(--color-text-tertiary); text-transform: uppercase; letter-spacing: var(--ls-wider); margin-top: auto; }
    .fs-folder__count { position: absolute; top: var(--space-3); right: var(--space-3); min-width: 24px; height: 24px; padding: 0 var(--space-2); display: inline-flex; align-items: center; justify-content: center; background: var(--color-surface-alt); border: 1px solid var(--color-border-light); border-radius: 999px; font-size: var(--fs-xs); font-weight: var(--fw-semibold); color: var(--color-text-secondary); }
    .fs-empty { text-align: center; padding: var(--space-12) var(--space-6); color: var(--color-text-tertiary); }
    .fs-empty .material-symbols-outlined { font-size: 48px; opacity: .4; margin-bottom: var(--space-3); }
    </style>
  `;
}

function showToast(message, type = 'success') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info';
  toast.innerHTML = `<span class="material-symbols-outlined">${icon}</span>${message}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export async function initAdminPage() {
  const isAuthed = sessionStorage.getItem('admin_auth') === '1';

  if (!isAuthed) {
    const form = document.getElementById('admin-login-form');
    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      const pass = document.getElementById('admin-pass').value;
      if (pass === ADMIN_PASS) {
        sessionStorage.setItem('admin_auth', '1');
        document.getElementById('app').innerHTML = renderAdminPage();
        initAdminPage();
      } else {
        const err = document.createElement('p');
        err.className = 'login-error';
        err.textContent = 'Wrong password. Try again.';
        err.style.cssText = 'color:var(--color-error);text-align:center;font-size:var(--fs-sm);margin-top:var(--space-2)';
        form.after(err);
        document.getElementById('admin-pass').value = '';
        document.getElementById('admin-pass').focus();
        setTimeout(() => err.remove(), 3000);
      }
    });
    return;
  }

  // Logout button in sidebar
  const nav = document.querySelector('.admin-nav');
  const logoutBtn = document.createElement('button');
  logoutBtn.className = 'admin-nav-item';
  logoutBtn.dataset.action = 'logout';
  logoutBtn.innerHTML = '<span class="material-symbols-outlined">logout</span> Logout';
  logoutBtn.style.marginTop = 'auto';
  logoutBtn.style.color = 'var(--color-footer-link)';
  nav.appendChild(logoutBtn);

  document.querySelectorAll('.admin-nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTab = btn.dataset.tab;
      document.querySelectorAll('.admin-nav-item[data-tab]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      loadTab(currentTab);
    });
  });

  logoutBtn.addEventListener('click', () => {
    sessionStorage.removeItem('admin_auth');
    document.getElementById('app').innerHTML = renderAdminPage();
    initAdminPage();
  });

  await loadTab(currentTab);
}

async function loadTab(tab) {
  const content = document.getElementById('admin-content');
  content.innerHTML = '<div class="admin-loading"><span class="material-symbols-outlined spin">progress_activity</span> Loading...</div>';
  switch (tab) {
    case 'homepage': await renderHomepageSection(content); break;
    case 'header': await renderHeaderSection(content); break;
    case 'products': await renderProducts(content); break;
    case 'categories': await renderCategories(content); break;
    case 'banners': await renderBanners(content); break;
    case 'footer': await renderFooterSection(content); break;
    case 'settings': await renderSettings(content); break;
    case 'enquiries': await renderEnquiries(content); break;
  }
}

function closeModal() {
  document.getElementById('modal-overlay')?.remove();
}

function showConfirmDialog(message, onConfirm) {
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal confirm-dialog">
      <div class="admin-modal-header">
        <h2>Confirm</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="admin-form">
        <p>${message}</p>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="button" class="admin-btn admin-btn-danger" id="confirm-yes">Delete</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — only the X button (or Cancel) closes; clicking the
  // backdrop is a no-op so dad doesn't lose filled data from a stray click.
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  document.getElementById('confirm-yes').onclick = () => { closeModal(); onConfirm(); };
}

// ===== PRODUCTS =====
const PRODUCTS_PER_PAGE = 20;

// ===== PRODUCTS — Filesystem Directory =====
// 3-level nav: Root → Group → Category → Products
// Search box overrides to global flat search across all products.
async function renderProducts(container, page = 1, search = '', filterActive = '', nav = { level: 'root', group: null, category: null }) {
  // Persist nav across re-renders via container dataset
  if (container.dataset.fsNav) {
    try { nav = JSON.parse(container.dataset.fsNav); } catch {}
  }
  container.dataset.fsNav = JSON.stringify(nav);

  const toolbar = `
    <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;justify-content:flex-end">
      <div class="admin-search-wrap">
        <span class="material-symbols-outlined">search</span>
        <input type="text" class="admin-search" id="product-search" placeholder="Search all products by name, slug, SKU..." value="${search}">
      </div>
      <select class="admin-filter-select" id="filter-active">
        <option value="" ${filterActive === '' ? 'selected' : ''}>All Status</option>
        <option value="true" ${filterActive === 'true' ? 'selected' : ''}>Active</option>
        <option value="false" ${filterActive === 'false' ? 'selected' : ''}>Inactive</option>
      </select>
      <button class="admin-btn admin-btn-primary" id="add-product-btn">
        <span class="material-symbols-outlined">add</span> Add Product
      </button>
    </div>
  `;

  const header = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Products</h1>
        <span class="admin-header-stats">Browse by category folder</span>
      </div>
      ${toolbar}
    </div>
  `;

  // Search-override: if search term present, show global flat results (ignore folder nav)
  if (search && search.trim()) {
    await renderProductRows(container, header, { search, filterActive, page });
    return;
  }

  const level = nav.level;
  const breadcrumb = renderFsBreadcrumb(nav);

  if (level === 'root') {
    await renderFolderGrid(container, header, breadcrumb, { type: 'groups' });
  } else if (level === 'group') {
    await renderFolderGrid(container, header, breadcrumb, { type: 'categories', group: nav.group });
  } else if (level === 'category') {
    await renderProductRows(container, header, { filterCategory: nav.category, filterActive, page }, breadcrumb);
  }
}

// Breadcrumb: Root › Group › Category
function renderFsBreadcrumb(nav) {
  const crumbs = [{ label: 'Products', nav: { level: 'root', group: null, category: null } }];
  if (nav.level !== 'root' && nav.group) {
    crumbs.push({ label: nav.group, nav: { level: 'group', group: nav.group, category: null } });
  }
  if (nav.level === 'category' && nav.categoryName) {
    crumbs.push({ label: nav.categoryName, nav });
  }
  return `
    <div class="fs-breadcrumb">
      <button class="fs-back" ${nav.level === 'root' ? 'disabled' : ''} id="fs-back">
        <span class="material-symbols-outlined">arrow_back</span> Back
      </button>
      <div class="fs-path">
        ${crumbs.map((c, i) => `
          <button class="fs-crumb" data-nav='${JSON.stringify(c.nav)}' ${i === crumbs.length - 1 ? 'disabled' : ''}>${c.label}</button>
          ${i < crumbs.length - 1 ? '<span class="material-symbols-outlined fs-crumb-sep">chevron_right</span>' : ''}
        `).join('')}
      </div>
    </div>
  `;
}

// Folder grid view (root shows Groups, group-level shows Categories)
async function renderFolderGrid(container, header, breadcrumb, opts) {
  // Fetch all categories + product_categories counts (single query each, no N+1)
  const [{ data: categories }, { data: pcRows }] = await Promise.all([
    supabase.from('categories').select('id, name, slug, active').order('name'),
    supabase.from('product_categories').select('category_id'),
  ]);
  const countByCat = new Map();
  (pcRows || []).forEach(r => countByCat.set(r.category_id, (countByCat.get(r.category_id) || 0) + 1));
  const activeCats = (categories || []).filter(c => c.active !== false);
  const catBySlug = new Map(activeCats.map(c => [c.slug, c]));

  let folders = [];
  let totalProducts = 0;

  if (opts.type === 'groups') {
    // One folder per Category Group, plus an Uncategorized system folder
    folders = Object.keys(CATEGORY_GROUPS).map(groupName => {
      const slugs = CATEGORY_GROUPS[groupName];
      const cats = slugs.map(s => catBySlug.get(s)).filter(Boolean);
      const productCount = cats.reduce((sum, c) => sum + (countByCat.get(c.id) || 0), 0);
      totalProducts += productCount;
      return {
        key: groupName,
        name: groupName,
        count: productCount,
        meta: `${cats.length} categor${cats.length === 1 ? 'y' : 'ies'}`,
        icon: 'folder',
        nav: { level: 'group', group: groupName, category: null },
        system: false,
      };
    });
    // Uncategorized = products whose category_id is null OR not in any group
    const allGroupedSlugs = new Set(Object.values(CATEGORY_GROUPS).flat());
    const groupedCatIds = new Set(activeCats.filter(c => allGroupedSlugs.has(c.slug)).map(c => c.id));
    const uncatCount = (pcRows || []).filter(r => !groupedCatIds.has(r.category_id)).length;
    if (uncatCount > 0) {
      folders.push({
        key: '__uncategorized',
        name: 'Uncategorized',
        count: uncatCount,
        meta: 'unassigned',
        icon: 'folder_off',
        nav: { level: 'group', group: '__uncategorized', category: null },
        system: true,
      });
    }
  } else if (opts.type === 'categories') {
    const groupName = opts.group;
    if (groupName === '__uncategorized') {
      // Show categories not in any group (or products with no category)
      const allGroupedSlugs = new Set(Object.values(CATEGORY_GROUPS).flat());
      const cats = activeCats.filter(c => !allGroupedSlugs.has(c.slug));
      folders = cats.map(c => ({
        key: c.id,
        name: c.name,
        count: countByCat.get(c.id) || 0,
        meta: 'category',
        icon: 'folder',
        nav: { level: 'category', group: groupName, category: c.id, categoryName: c.name },
        system: false,
      }));
    } else {
      const slugs = CATEGORY_GROUPS[groupName] || [];
      folders = slugs.map(s => catBySlug.get(s)).filter(Boolean).map(c => ({
        key: c.id,
        name: c.name,
        count: countByCat.get(c.id) || 0,
        meta: 'category',
        icon: 'folder',
        nav: { level: 'category', group: groupName, category: c.id, categoryName: c.name },
        system: false,
      }));
    }
    totalProducts = folders.reduce((sum, f) => sum + f.count, 0);
  }

  const body = folders.length ? `
    <div class="fs-grid">
      ${folders.map(f => `
        <button class="fs-folder${f.system ? ' fs-folder--system' : ''}" data-nav='${JSON.stringify(f.nav)}'>
          <span class="material-symbols-outlined fs-folder__icon">${f.icon}</span>
          <span class="fs-folder__name">${f.name}</span>
          <span class="fs-folder__meta">${f.meta}</span>
          <span class="fs-folder__count">${f.count}</span>
        </button>
      `).join('')}
    </div>
  ` : `
    <div class="fs-empty">
      <span class="material-symbols-outlined">folder_off</span>
      <p>No folders here yet.</p>
    </div>
  `;

  container.innerHTML = header + breadcrumb + body;

  wireFsShared(container);
  document.querySelectorAll('.fs-folder').forEach(btn => {
    btn.onclick = () => {
      const next = JSON.parse(btn.dataset.nav);
      container.dataset.fsNav = JSON.stringify(next);
      renderProducts(container, 1, '', '');
    };
  });
  document.getElementById('fs-back')?.addEventListener('click', () => fsGoBack(container, opts.type === 'groups' ? { level: 'root' } : null));
  document.querySelectorAll('.fs-crumb').forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const next = JSON.parse(btn.dataset.nav);
      container.dataset.fsNav = JSON.stringify(next);
      renderProducts(container, 1, '', '');
    };
  });
}

// Product rows view (inside a category folder, or global search)
async function renderProductRows(container, header, opts, breadcrumb = '') {
  const { search, filterCategory, filterActive, page } = opts;

  let query = supabase
    .from('products')
    .select('*, category:categories!products_category_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (filterCategory) {
    const { data: pcFilter } = await supabase.from('product_categories').select('product_id').eq('category_id', filterCategory);
    const filterIds = (pcFilter || []).map(r => r.product_id);
    if (filterIds.length) {
      query = query.in('id', filterIds);
    } else {
      query = query.in('id', ['00000000-0000-0000-0000-000000000000']);
    }
  }
  if (filterActive !== '') {
    query = query.eq('active', filterActive === 'true');
  }

  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data: products, error, count } = await query;

  const productIds = (products || []).map(p => p.id);
  const { data: pcRows } = productIds.length
    ? await supabase.from('product_categories').select('product_id, category_id, categories(name)').in('product_id', productIds)
    : { data: [] };

const catMapByProduct = {};
  (pcRows || []).forEach(r => {
    const name = r.categories?.name || r.category?.name;
    if (name) {
      if (!catMapByProduct[r.product_id]) catMapByProduct[r.product_id] = [];
      if (!catMapByProduct[r.product_id].includes(name)) catMapByProduct[r.product_id].push(name);
    }
  });
  const totalPages = Math.ceil((count || 0) / PRODUCTS_PER_PAGE);

  const searchBanner = search ? `
    <div class="fs-breadcrumb">
      <span class="material-symbols-outlined" style="font-size:18px;color:var(--color-text-tertiary)">search</span>
      <span style="color:var(--color-text-secondary)">${count || 0} result${count === 1 ? '' : 's'} for "<strong>${search}</strong>"</span>
      <button class="fs-back" id="fs-search-clear" style="margin-left:auto"><span class="material-symbols-outlined">close</span> Clear</button>
    </div>
  ` : '';

  container.innerHTML = header + searchBanner + breadcrumb + `
    <div class="admin-card">
      ${(products?.length && !error) ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr>
          <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody id="products-tbody">
          ${products.map(p => {
            return `
            <tr class="product-row" data-id="${p.id}" ${pc ? `data-pc-id="${pc.pc_id}"` : ''} data-product-id="${p.id}">
              <td class="col-image">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" data-src="${p.images[0]}">` : '<div style="width:64px;height:64px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border-light)"><span class="material-symbols-outlined" style="font-size:24px;color:var(--color-text-tertiary)">image</span></div>'}</td>
              <td class="col-name"><strong>${p.name}</strong><span>${p.slug}</span></td>
              <td>${(catMapByProduct[p.id] || []).join(', ') || p.category?.name || '—'}</td>
              <td><strong>₹${Number(p.price).toLocaleString()}</strong>${p.original_price && p.original_price > p.price ? `<br><s style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">₹${Number(p.original_price).toLocaleString()}</s>` : ''}</td>
              <td>${p.in_stock ? `<span style="color:var(--color-success);font-weight:var(--fw-medium)">In Stock</span>` : '<span style="color:var(--color-error)">Out of stock</span>'}</td>
              <td><span class="badge ${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
              <td class="col-actions">
                <button class="edit-btn" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                <button class="duplicate-btn" title="Duplicate"><span class="material-symbols-outlined">content_copy</span></button>
                <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
              </td>
            </tr>`;
          }).join('')}
        </tbody>
      </table></div>` : `<div class="fs-empty"><span class="material-symbols-outlined">inventory_2</span><p>${error ? 'Error loading products' : 'No products in this folder'}</p></div>`}
    </div>
    ${totalPages > 1 ? `
    <div class="admin-pagination">
      <button ${page <= 1 ? 'disabled' : ''} id="page-prev"><span class="material-symbols-outlined">chevron_left</span></button>
      ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
        let pNum;
        if (totalPages <= 5) pNum = i + 1;
        else if (page <= 3) pNum = i + 1;
        else if (page >= totalPages - 2) pNum = totalPages - 4 + i;
        else pNum = page - 2 + i;
        return `<button class="${pNum === page ? 'active' : ''}" data-page="${pNum}">${pNum}</button>`;
      }).join('')}
      <button ${page >= totalPages ? 'disabled' : ''} id="page-next"><span class="material-symbols-outlined">chevron_right</span></button>
      <span class="page-info">${count} total</span>
    </div>` : ''}
  `;

  wireFsShared(container);

  // Image lightbox
  document.querySelectorAll('.col-image img').forEach(img => {
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'img-lightbox';
      overlay.innerHTML = `<img src="${img.dataset.src}" alt="">`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
    });
  });

  // Search-clear returns to folder view
  document.getElementById('fs-search-clear')?.addEventListener('click', () => {
    renderProducts(container, 1, '', '');
  });

  document.getElementById('fs-back')?.addEventListener('click', () => fsGoBack(container));

  document.querySelectorAll('.fs-crumb').forEach(btn => {
    btn.onclick = () => {
      if (btn.disabled) return;
      const next = JSON.parse(btn.dataset.nav);
      container.dataset.fsNav = JSON.stringify(next);
      renderProducts(container, 1, '', '');
    };
  });

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const product = products.find(p => p.id === id);
      openProductModal(container, product);
    };
  });

  document.querySelectorAll('.duplicate-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.closest('tr').dataset.id;
      const product = products.find(p => p.id === id);
      if (!product) return;
      btn.disabled = true;
      try {
        await duplicateProduct(product, container);
      } finally {
        btn.disabled = false;
      }
    };
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this product? This action cannot be undone.', async () => {
        await supabase.from('products').delete().eq('id', id);
        showToast('Product deleted!');
        const nav = container.dataset.fsNav ? JSON.parse(container.dataset.fsNav) : { level: 'root' };
        renderProducts(container, 1, document.getElementById('product-search')?.value || '', document.getElementById('filter-active')?.value || '', nav);
      });
    };
  });

  // Pagination
  document.getElementById('page-prev')?.addEventListener('click', () => {
    rerenderRows(container, header, opts, breadcrumb, page - 1);
  });
  document.getElementById('page-next')?.addEventListener('click', () => {
    rerenderRows(container, header, opts, breadcrumb, page + 1);
  });
  document.querySelectorAll('.admin-pagination button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      rerenderRows(container, header, opts, breadcrumb, parseInt(btn.dataset.page));
    });
  });
}

// Re-render just the rows view at a new page (preserves search/nav context)
function rerenderRows(container, header, opts, breadcrumb, newPage) {
  const search = document.getElementById('product-search')?.value || '';
  const filterActive = document.getElementById('filter-active')?.value || '';
  if (search && search.trim()) {
    renderProductRows(container, header, { search, filterActive, page: newPage });
  } else {
    const nav = container.dataset.fsNav ? JSON.parse(container.dataset.fsNav) : { level: 'root' };
    renderProductRows(container, header, { filterCategory: nav.category, filterActive, page: newPage }, breadcrumb);
  }
}

// Navigate one level up
function fsGoBack(container, fallbackNav) {
  const nav = container.dataset.fsNav ? JSON.parse(container.dataset.fsNav) : { level: 'root' };
  let next;
  if (fallbackNav) next = fallbackNav;
  else if (nav.level === 'category') next = { level: 'group', group: nav.group, category: null };
  else if (nav.level === 'group') next = { level: 'root', group: null, category: null };
  else next = { level: 'root' };
  container.dataset.fsNav = JSON.stringify(next);
  renderProducts(container, 1, '', '');
}

// Shared event wiring for search + add button + status filter (on every render)
function wireFsShared(container) {
  let searchTimeout;
  const searchInput = document.getElementById('product-search');
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const val = e.target.value;
    const filterActive = document.getElementById('filter-active')?.value || '';
    searchTimeout = setTimeout(() => {
      renderProducts(container, 1, val, filterActive);
    }, 350);
  });

  document.getElementById('filter-active')?.addEventListener('change', (e) => {
    const nav = container.dataset.fsNav ? JSON.parse(container.dataset.fsNav) : { level: 'root' };
    renderProducts(container, 1, document.getElementById('product-search')?.value || '', e.target.value, nav);
  });

  document.getElementById('add-product-btn').onclick = () => openProductModal(container);
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function parseMediaList(value) {
  return (value || '')
    .split('\n')
    .flatMap(line => {
      const clean = line.trim();
      if (!clean) return [];
      return clean.startsWith('data:') ? [clean] : clean.split(',').map(item => item.trim()).filter(Boolean);
    });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function readMediaFilesFromList(files, allowedTypes) {
  const invalid = files.find(file => !allowedTypes.includes(file.type));
  if (invalid) throw new Error(`${invalid.name} is not an allowed file type.`);
  const tooLarge = files.find(file => file.size > MAX_MEDIA_SIZE);
  if (tooLarge) throw new Error(`${tooLarge.name} is larger than 8 MB.`);
  return Promise.all(files.map(readFileAsDataUrl));
}

async function readMediaFiles(input, allowedTypes) {
  return readMediaFilesFromList(Array.from(input?.files || []), allowedTypes);
}

async function validateBannerImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const minW = 1920;
      const minH = 720;
      if (img.width < minW || img.height < minH) {
        reject(new Error(`Banner image must be at least ${minW}×${minH} pixels (16:6 ratio). Current: ${img.width}×${img.height}`));
      } else {
        resolve();
      }
    };
    img.onerror = () => reject(new Error('Invalid image file'));
    img.src = URL.createObjectURL(file);
  });
}

function isVideoMedia(src, type = '') {
  return type === 'video/mp4' || /\\.mp4($|[?#])/i.test(src);
}


// Deep-clone an existing product. Copies every column verbatim, including
// images and category junctions. Only the name (and slug) is changed.
// Naming: "Copy of <name>" → "Copy of <name> (1)" → ... (file-system style).
async function duplicateProduct(source, container) {
  // Fetch fresh source + its category junctions (the list-row copy may
  // miss the junction rows).
  const [{ data: fullSrc }, { data: catRows }] = await Promise.all([
    supabase.from('products').select('*').eq('id', source.id).single(),
    supabase.from('product_categories').select('category_id').eq('product_id', source.id),
  ]);
  if (!fullSrc) { showToast('Source product not found.', 'error'); return; }

  // Build a unique name + slug.
  const baseName = `Copy of ${fullSrc.name}`;
  const { data: existing } = await supabase
    .from('products')
    .select('name')
    .ilike('name', `${baseName.replace(/[%_]/g, '\$&')}%`);
  const taken = new Set((existing || []).map(r => r.name));
  let newName = baseName;
  if (taken.has(newName)) {
    let i = 1;
    while (taken.has(`${baseName} (${i})`)) i++;
    newName = `${baseName} (${i})`;
  }
  const baseSlug = generateSlug(newName);
  const { data: slugRows } = await supabase
    .from('products')
    .select('slug')
    .ilike('slug', `${baseSlug}%`);
  const takenSlugs = new Set((slugRows || []).map(r => r.slug));
  let newSlug = baseSlug;
  if (takenSlugs.has(newSlug)) {
    let i = 1;
    while (takenSlugs.has(`${baseSlug}-${i}`)) i++;
    newSlug = `${baseSlug}-${i}`;
  }

  // Strip the immutable / PK columns, keep everything else.
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = fullSrc;
  const payload = { ...rest, name: newName, slug: newSlug };

  const { data: inserted, error } = await supabase
    .from('products')
    .insert(payload)
    .select('id')
    .single();
  if (error) { showToast(`Failed: ${error.message}`, 'error'); return; }

  if (inserted?.id && catRows?.length) {
    const rows = catRows.map(r => ({ product_id: inserted.id, category_id: r.category_id }));
    const { error: pcError } = await supabase.from('product_categories').insert(rows);
    if (pcError) console.error('Category copy failed:', pcError);
  }

  showToast(`Duplicated as "${newName}"`);
  // Re-render the current list view (preserves search/filter/nav).
  const nav = container.dataset.fsNav ? JSON.parse(container.dataset.fsNav) : { level: 'root' };
  const search = document.getElementById('product-search')?.value || '';
  const filterActive = document.getElementById('filter-active')?.value || '';
  await renderProducts(container, 1, search, filterActive, nav);
}

async function openProductModal(container, product = null) {
  // Use fetchCategories() so the list mirrors the navbar's grouping (DB
  // group_id with the hardcoded CATEGORY_GROUPS fallback). Linear, with
  // group labels as section headers and a tab indent before each item.
  const [allCategories, existingCats] = await Promise.all([
    fetchCategories(),
    product?.id ? supabase.from('product_categories').select('category_id').eq('product_id', product.id) : Promise.resolve({ data: [] }),
  ]);

  // Group categories by their group_name. Group order matches the navbar
  // (sort_order on category_groups), then the hardcoded fallback order,
  // then any orphan group last.
  const groups = await fetchCategoryGroups();
  const groupOrder = groups.map(g => g.name);
  const groupSortByName = new Map(groups.map(g => [g.name, g.sort_order || 0]));
  const FALLBACK_ORDER = Object.keys(CATEGORY_GROUPS);

  // Buckets: groupName -> [cat]
  const buckets = new Map();
  const orphans = [];
  for (const c of allCategories || []) {
    const gName = c.group_name || null;
    if (gName) {
      if (!buckets.has(gName)) buckets.set(gName, []);
      buckets.get(gName).push(c);
    } else {
      orphans.push(c);
    }
  }
  // Compose the final ordered list: [group, [cat...]], [group, [cat...]], ...
  const ordered = [];
  const seen = new Set();
  const pushBucket = (name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const items = (buckets.get(name) || []).slice().sort((a, b) => {
      const so = (a.sort_order || 0) - (b.sort_order || 0);
      if (so !== 0) return so;
      return (a.name || '').localeCompare(b.name || '');
    });
    if (items.length) ordered.push({ name, items });
  };
  for (const n of groupOrder) pushBucket(n);
  for (const n of FALLBACK_ORDER) pushBucket(n);
  if (orphans.length) {
    const sorted = orphans.slice().sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    ordered.push({ name: 'Other', items: sorted });
  }
  // Sort groups that came only from the fallback by their hardcoded index.
  ordered.forEach(g => {
    if (groupSortByName.has(g.name)) return;
    const idx = FALLBACK_ORDER.indexOf(g.name);
    g._fallbackIdx = idx === -1 ? 9999 : idx;
  });
  // Stable order: DB group sort_order, then fallback order, then 'Other' last.
  // (groupOrder/FALLBACK_ORDER iteration above already does this.)
  const isEdit = !!product;
  const primaryImage = product?.images?.[0] || '';
  const secondaryImages = product?.images?.slice(1) || [];
  const selectedSecondaryFiles = [];
  const secondaryObjectUrls = new Map();
  const selectedCatIds = new Set((existingCats?.data || []).map(r => r.category_id));

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal" style="max-width:860px">
      <div class="admin-modal-header">
        <h2>${isEdit ? 'Edit Product' : 'Add Product'}</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form class="admin-form" id="product-form">
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input name="name" value="${product?.name || ''}" required id="p-name"></div>
          <div class="form-group"><label>Slug *</label><input name="slug" value="${product?.slug || ''}" required id="p-slug"><small style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Auto-generated from name if blank</small></div>
        </div>
        <div class="form-row">
          <div class="form-group" style="flex:1"><label>Categories</label>
            <div class="admin-cat-checkboxes">
              ${ordered.map(g => `
                <div class="admin-cat-group-label">${g.name}</div>
                ${g.items.map(c => `<label class="admin-cat-checkbox" style="padding-left:24px"><input type="checkbox" name="category_ids" value="${c.id}" ${selectedCatIds.has(c.id) ? 'checked' : ''}> ${c.name}</label>`).join('')}
              `).join('')}
            </div>
          </div>
          <div class="form-group"><label>Price *</label><input name="price" type="number" step="0.01" value="${product?.price || ''}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Original Price</label><input name="original_price" type="number" step="0.01" value="${product?.original_price || ''}"></div>
          <div class="form-group"><label>SKU</label><input name="sku" value="${product?.sku || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Badge (e.g. "New", "Bestseller")</label><input name="badge" value="${product?.badge || ''}"></div>
          <div class="form-group"><label>Min Bulk Order</label><input name="min_bulk_order" type="number" value="${product ? product.min_bulk_order : 100}" placeholder="100"></div>
        </div>
        <div class="form-group">
          <label>Product Highlights</label>
          <div style="display:flex;gap:var(--space-6);flex-wrap:wrap;padding:var(--space-3);border:1px solid var(--color-border);border-radius:var(--radius-md);background:var(--color-surface-alt);">
            <label class="admin-cat-checkbox"><input type="checkbox" name="has_shipping_badge" id="has_shipping_badge" ${product?.hasShippingBadge !== false ? 'checked' : ''}><span style="color:#e53935;font-weight:var(--fw-medium)">moq restriction</span></label>
            <label class="admin-cat-checkbox"><input type="checkbox" name="has_warranty_badge" id="has_warranty_badge" ${product?.hasWarrantyBadge !== false ? 'checked' : ''}><span style="color:#1565c0;font-weight:var(--fw-medium)">no COD</span></label>
          </div>
        </div>
        <div class="form-group"><label>Tags / Keywords <small style="color:var(--color-text-tertiary)">(comma-separated)</small></label><input name="tags" value="${product?.tags || ''}" placeholder="leather, diary, premium, corporate gift"></div>
        <div class="form-group"><label>Short Description <small style="color:var(--color-text-tertiary)">(product highlights)</small></label><textarea name="short_description" id="rte-short-description" class="nyd-rte">${product?.short_description || ''}</textarea></div>
        <div class="form-group"><label>Description</label><textarea name="description" id="rte-description" class="nyd-rte">${product?.description || ''}</textarea></div>
        <div class="form-group">
          <label>SEO / Meta Tags <small style="color:var(--color-text-tertiary)">(for product detail page & social)</small></label>
          <input name="meta_title" value="${product?.meta_title || ''}" placeholder="Meta title (≤60 chars)">
          <textarea name="meta_description" placeholder="Meta description (150-160 chars)" style="min-height:60px">${product?.meta_description || ''}</textarea>
          <input name="meta_keywords" value="${product?.meta_keywords || ''}" placeholder="Keywords (comma separated)">
          <input name="og_image_url" value="${product?.og_image_url || ''}" placeholder="OG image URL (optional)">
        </div>
         <div class="form-group">
           <label>Primary Image <small style="color:var(--color-text-tertiary)">(display image)</small></label>
           <input name="primary_image_url" value="${primaryImage && primaryImage.startsWith('http') ? primaryImage : ''}" placeholder="https://example.com/product.jpg">
           <input name="primary_image_file" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp">
           ${primaryImage ? `<input type="hidden" name="existing_primary_image" value="${primaryImage}">` : ''}
           ${primaryImage ? `<img src="${primaryImage}" style="max-width:120px;max-height:120px;object-fit:cover;border-radius:4px;border:1px solid var(--color-border-light);margin-top:4px;">` : ''}
           ${primaryImage ? '<small style="color:var(--color-text-tertiary);font-size:var(--fs-xs);margin-top:var(--space-1)">Leave URL/file empty to keep current image</small>' : ''}
         </div>
        <div class="form-group">
          <label>Secondary Images / Media <small style="color:var(--color-text-tertiary)">(one URL per line, jpg/png/webp/mp4)</small></label>
          <div class="admin-media-picker">
            <div class="admin-media-grid" id="secondary-media-grid"></div>
            <div class="admin-media-actions">
              <label class="admin-media-add">
                <span class="material-symbols-outlined">add_photo_alternate</span>
                Add images
                <input class="admin-media-input" name="secondary_image_files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.mp4,image/jpeg,image/png,image/webp,video/mp4">
              </label>
              <small>Select multiple local files. Remove unwanted items from the tiles before saving.</small>
            </div>
          </div>
          <textarea name="secondary_images" placeholder="https://example.com/angle-2.jpg&#10;https://example.com/demo.mp4" style="min-height:80px">${secondaryImages.join('\n')}</textarea>
        </div>
        <div class="form-row">
          <div class="form-group checkbox"><input name="in_stock" type="checkbox" id="in_stock" ${product?.in_stock !== false ? 'checked' : ''}><label for="in_stock">In Stock</label></div>
          <div class="form-group checkbox"><input name="active" type="checkbox" id="active" ${product?.active !== false ? 'checked' : ''}><label for="active">Active</label></div>
        </div>
        <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="${product?.sort_order || 0}"></div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save Changes' : 'Add Product'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  // ===== Rich text editors (TinyMCE) for Short Description and Description =====
  // Loaded lazily from CDN the first time the product modal opens. Reused
  // across openings via the module-level promise.
  const TINYMCE_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/tinymce.min.js';
  if (!window.__tinymceLoadPromise) {
    window.__tinymceLoadPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-tinymce]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.tinymce));
        existing.addEventListener('error', reject);
        return;
      }
      // Load the TinyMCE skin CSS first (icons + popup chrome)
      if (!document.querySelector('link[data-tinymce-skin]')) {
        const skinLink = document.createElement('link');
        skinLink.rel = 'stylesheet';
        skinLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/skins/ui/oxide/content.min.css';
        skinLink.dataset.tinymceSkin = '1';
        document.head.appendChild(skinLink);
        const skinDark = document.createElement('link');
        skinDark.rel = 'stylesheet';
        skinDark.href = 'https://cdnjs.cloudflare.com/ajax/libs/tinymce/6.8.5/skins/ui/oxide-dark/content.min.css';
        skinDark.dataset.tinymceSkin = '1';
        document.head.appendChild(skinDark);
      }
      const script = document.createElement('script');
      script.src = TINYMCE_CDN;
      script.async = true;
      script.dataset.tinymce = '1';
      script.referrerPolicy = 'no-referrer';
      script.onload = () => resolve(window.tinymce);
      script.onerror = (e) => { window.__tinymceLoadPromise = null; reject(e); };
      document.head.appendChild(script);
    });
  }

  const rteInstances = [];
  const teardownRtes = () => {
    if (window.tinymce) {
      rteInstances.forEach(id => {
        try { window.tinymce.remove(`#${id}`); } catch (_) { /* ignore */ }
      });
    }
    rteInstances.length = 0;
  };
  const initRtes = async () => {
    try {
      const tinymce = await window.__tinymceLoadPromise;
      const baseConfig = {
        height: 220,
        menubar: false,
        branding: false,
        promotion: false,
        skin: 'oxide',
        content_css: 'default',
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
          'preview', 'anchor', 'searchreplace', 'visualblocks', 'code',
          'fullscreen', 'insertdatetime', 'media', 'table', 'help', 'wordcount',
          'emoticons', 'autosave',
        ],
        toolbar:
          'undo redo | blocks | bold italic underline strikethrough | ' +
          'forecolor backcolor | highlight | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'link image table | blockquote code | removeformat | help',
        toolbar_mode: 'wrap',
        statusbar: true,
        elementpath: false,
        resize: true,
        browser_spellcheck: true,
        contextmenu: 'link image table',
      };
      // Short description: smaller height
      await tinymce.init({
        ...baseConfig,
        selector: '#rte-short-description',
        height: 140,
        toolbar:
          'undo redo | bold italic underline | forecolor backcolor | ' +
          'highlight | link | bullist numlist | blockquote | removeformat',
        statusbar: false,
      });
      rteInstances.push('rte-short-description');

      // Description: full toolbar
      await tinymce.init({
        ...baseConfig,
        selector: '#rte-description',
        height: 360,
      });
      rteInstances.push('rte-description');
    } catch (e) {
      console.warn('[product] TinyMCE failed to load, using plain textareas:', e);
      // Fallback: leave the textareas as-is; the form still works.
    }
  };
  initRtes();

  const closeProductModal = () => {
    teardownRtes();
    secondaryObjectUrls.forEach(url => URL.revokeObjectURL(url));
    closeModal();
  };
  // Close handlers — only the X button (or Cancel) closes. Backdrop click
  // and ESC are intentionally no-ops so dad doesn't lose form data from a
  // stray click. ponytail: keep the X/Cancel handlers since TinyMCE's
  // iframe can swallow normal click events, so mousedown is still used.
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeProductModal();
  });
  overlay.querySelector('.modal-cancel').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeProductModal();
  });

  const secondaryTextarea = overlay.querySelector('[name="secondary_images"]');
  const secondaryGrid = overlay.querySelector('#secondary-media-grid');
  const secondaryFileInput = overlay.querySelector('[name="secondary_image_files"]');

  const renderSecondaryMediaGrid = () => {
    if (!secondaryGrid) return;
    secondaryGrid.innerHTML = '';

    const urlMedia = parseMediaList(secondaryTextarea.value);
    if (!urlMedia.length && !selectedSecondaryFiles.length) {
      const empty = document.createElement('div');
      empty.className = 'admin-media-empty';
      empty.textContent = 'Selected media previews will appear here';
      secondaryGrid.appendChild(empty);
      return;
    }

    urlMedia.forEach((src, index) => {
      const tile = document.createElement('div');
      tile.className = 'admin-media-tile';

      const media = document.createElement(isVideoMedia(src) ? 'video' : 'img');
      media.src = src;
      if (media.tagName === 'VIDEO') {
        media.muted = true;
        media.playsInline = true;
        media.controls = true;
      }
      tile.appendChild(media);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'admin-media-remove';
      remove.setAttribute('aria-label', 'Remove media URL');
      remove.innerHTML = '<span class="material-symbols-outlined">close</span>';
      remove.onclick = () => {
        const next = parseMediaList(secondaryTextarea.value).filter((_, i) => i !== index);
        secondaryTextarea.value = next.join('\n');
        renderSecondaryMediaGrid();
      };
      tile.appendChild(remove);

      const name = document.createElement('div');
      name.className = 'admin-media-name';
      name.textContent = src.split('/').pop() || 'Media URL';
      tile.appendChild(name);
      secondaryGrid.appendChild(tile);
    });

    selectedSecondaryFiles.forEach((file, index) => {
      let objectUrl = secondaryObjectUrls.get(file);
      if (!objectUrl) {
        objectUrl = URL.createObjectURL(file);
        secondaryObjectUrls.set(file, objectUrl);
      }

      const tile = document.createElement('div');
      tile.className = 'admin-media-tile';

      const media = document.createElement(isVideoMedia(objectUrl, file.type) ? 'video' : 'img');
      media.src = objectUrl;
      if (media.tagName === 'VIDEO') {
        media.muted = true;
        media.playsInline = true;
        media.controls = true;
      }
      tile.appendChild(media);

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'admin-media-remove';
      remove.setAttribute('aria-label', `Remove ${file.name}`);
      remove.innerHTML = '<span class="material-symbols-outlined">close</span>';
      remove.onclick = () => {
        URL.revokeObjectURL(objectUrl);
        secondaryObjectUrls.delete(file);
        selectedSecondaryFiles.splice(index, 1);
        renderSecondaryMediaGrid();
      };
      tile.appendChild(remove);

      const name = document.createElement('div');
      name.className = 'admin-media-name';
      name.textContent = file.name;
      tile.appendChild(name);
      secondaryGrid.appendChild(tile);
    });
  };

  secondaryTextarea?.addEventListener('input', renderSecondaryMediaGrid);
  secondaryFileInput?.addEventListener('change', async () => {
    const incoming = Array.from(secondaryFileInput.files || []);
    try {
      await readMediaFilesFromList(incoming, SECONDARY_MEDIA_TYPES);
    } catch (err) {
      showToast(err.message, 'error');
      secondaryFileInput.value = '';
      return;
    }

    incoming.forEach(file => {
      const alreadySelected = selectedSecondaryFiles.some(selected =>
        selected.name === file.name &&
        selected.size === file.size &&
        selected.lastModified === file.lastModified
      );
      if (!alreadySelected) selectedSecondaryFiles.push(file);
    });
    secondaryFileInput.value = '';
    renderSecondaryMediaGrid();
  });
  renderSecondaryMediaGrid();

  // Auto-generate slug from name
  const nameInput = document.getElementById('p-name');
  const slugInput = document.getElementById('p-slug');
  nameInput?.addEventListener('input', () => {
    if (!isEdit && !slugInput.dataset.manual) {
      slugInput.value = generateSlug(nameInput.value);
    }
  });
  slugInput?.addEventListener('input', () => {
    if (slugInput.value) slugInput.dataset.manual = '1';
  });

  document.getElementById('product-form').onsubmit = async (e) => {
    e.preventDefault();
    // Sync TinyMCE editor content into the underlying textareas so FormData
    // picks up the latest HTML.
    if (window.tinymce) {
      try { window.tinymce.triggerSave(); } catch (_) { /* ignore */ }
    }
    const fd = new FormData(e.target);
    let slug = fd.get('slug') || generateSlug(fd.get('name'));
    let uploadedPrimary = [];
    let uploadedSecondary = [];
    try {
      uploadedPrimary = await readMediaFiles(e.target.primary_image_file, IMAGE_TYPES);
      uploadedSecondary = await readMediaFilesFromList(selectedSecondaryFiles, SECONDARY_MEDIA_TYPES);
    } catch (err) {
      showToast(err.message, 'error');
      return;
    }

    let primaryImages = [...uploadedPrimary, ...parseMediaList(fd.get('primary_image_url'))];
    if (!primaryImages.length) {
      const existing = fd.get('existing_primary_image');
      if (existing) primaryImages = [existing];
    }
    const secondaryMedia = [...parseMediaList(fd.get('secondary_images')), ...uploadedSecondary];
    const images = [...primaryImages.slice(0, 1), ...secondaryMedia];

    const selectedCatIds = fd.getAll('category_ids');

    const payload = {
      name: fd.get('name'),
      slug: slug,
      category_id: selectedCatIds[0] || null,
      price: Number(fd.get('price')),
      original_price: fd.get('original_price') ? Number(fd.get('original_price')) : null,
      sku: fd.get('sku') || null,
      badge: fd.get('badge') || null,
      short_description: fd.get('short_description') || null,
      description: fd.get('description') || null,
      images,
      min_bulk_order: Number(fd.get('min_bulk_order')) || 100,
      in_stock: fd.get('in_stock') === 'on',
      active: fd.get('active') === 'on',
      sort_order: Number(fd.get('sort_order')) || 0,
      has_shipping_badge: fd.get('has_shipping_badge') === 'on',
      has_warranty_badge: fd.get('has_warranty_badge') === 'on',
      tags: fd.get('tags') || null,
      meta_title: fd.get('meta_title') || null,
      meta_description: fd.get('meta_description') || null,
      meta_keywords: fd.get('meta_keywords') || null,
      og_image_url: fd.get('og_image_url') || null,
    };

    let savedProduct;
    if (isEdit) {
      const { error: updateError } = await supabase.from('products').update(payload).eq('id', product.id);
      if (updateError) {
        console.error('Product save failed:', updateError);
        showToast(`Failed: ${updateError.message}`, 'error');
        return;
      }
      savedProduct = product;
    } else {
      const { data: inserted, error: insertError } = await supabase.from('products').insert(payload).select('id').single();
      if (insertError) {
        console.error('Product save failed:', insertError);
        showToast(`Failed: ${insertError.message}`, 'error');
        return;
      }
      savedProduct = inserted;
    }

    if (savedProduct?.id) {
      // Preserve existing per-category sort_order so the list column stays
      // populated. ponytail: 2 queries, but junction is small per product.
      const { data: existingPc } = await supabase
        .from('product_categories')
        .select('category_id, sort_order')
        .eq('product_id', savedProduct.id);
      const sortByCat = new Map((existingPc || []).map(r => [r.category_id, r.sort_order]));

      const { error: delError } = await supabase.from('product_categories').delete().eq('product_id', savedProduct.id);
      if (delError) console.error('Category delete failed:', delError);
      if (selectedCatIds.length) {
        const productSort = Number(payload.sort_order) || null;
        const rows = selectedCatIds.map(cid => ({
          product_id: savedProduct.id,
          category_id: cid,
          // If the per-category row had a sort, keep it; otherwise seed from
          // the product-level sort_order so the list column shows something.
          sort_order: sortByCat.has(cid) ? sortByCat.get(cid) : (productSort != null && productSort >= 1 && productSort <= 100 ? productSort : null),
        }));
        const { error: pcError } = await supabase.from('product_categories').insert(rows);
        if (pcError) {
          console.error('Category assignment failed:', pcError);
          showToast(`Category assignment failed: ${pcError.message}`, 'error');
        }
      }
    }

    closeProductModal();
    showToast(isEdit ? 'Product updated!' : 'Product added!');
    await renderProducts(container);
  };
}

// ===== CATEGORIES =====
// ===== CATEGORIES (collapsible groups, DB-backed) =====
function renderCategoryTable(cats, group, opts = {}) {
  const groupName = group?.name || opts.fallbackName || 'Uncategorized';
  const groupId = group?.id || '';
  const collapsed = opts.collapsed || false;
  const hasCategories = (cats?.length || 0) > 0;
  return `
    <div class="admin-card admin-cat-group" style="margin-bottom:var(--space-4);" data-group-id="${groupId}" data-group-name="${groupName.replace(/"/g, '&quot;')}">
      <div class="admin-cat-group-header" style="padding:var(--space-4) var(--space-6);border-bottom:${hasCategories ? '1px solid var(--color-border-light)' : 'none'};background:var(--color-surface-alt);border-radius:var(--radius-lg) var(--radius-lg) 0 0;display:flex;align-items:center;gap:var(--space-3);">
        <button class="admin-cat-toggle" data-group="${groupName.replace(/"/g, '&quot;')}" aria-expanded="${!collapsed}" aria-label="${collapsed ? 'Expand' : 'Collapse'} group" style="background:none;border:none;cursor:pointer;padding:0;display:flex;align-items:center;color:var(--color-text-secondary);">
          <span class="material-symbols-outlined admin-cat-toggle-icon" style="transition:transform 0.2s ease;${collapsed ? 'transform:rotate(-90deg);' : ''}">expand_more</span>
        </button>
        <div style="flex:1;min-width:0;">
          <h3 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin:0;">${groupName}</h3>
          <span style="font-size:var(--fs-sm);color:var(--color-text-tertiary);">${cats?.length || 0} item${(cats?.length || 0) !== 1 ? 's' : ''}</span>
        </div>
        <div class="admin-cat-group-actions" style="display:flex;gap:var(--space-2);flex-shrink:0;">
          <button class="admin-btn admin-btn-ghost admin-btn-sm" data-add-to-group="${groupName.replace(/"/g, '&quot;')}" title="Add subcategory to ${groupName}">
            <span class="material-symbols-outlined" style="font-size:18px;">add</span>
            <span>Add</span>
          </button>
          ${groupId ? `<button class="admin-btn admin-btn-ghost admin-btn-sm" data-rename-group="${groupId}" data-group-name="${groupName.replace(/"/g, '&quot;')}" title="Rename group">
            <span class="material-symbols-outlined" style="font-size:18px;">edit</span>
          </button>` : ''}
          <button class="admin-btn admin-btn-ghost admin-btn-sm" data-delete-group="${groupId}" data-group-name="${groupName.replace(/"/g, '&quot;')}" title="Delete group (subcategories move to Uncategorized)" style="color:var(--color-error, #c0392b);">
            <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
          </button>
        </div>
      </div>
      ${hasCategories ? `
      <div class="admin-cat-group-body" style="display:${collapsed ? 'none' : 'block'};">
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead><tr><th>Name</th><th>Slug</th><th>Group</th><th>Sort Order</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
            <tbody>
              ${cats.map(c => `<tr class="cat-row" data-id="${c.id}">
                <td class="col-name"><strong>${c.name}</strong><span>${c.slug}</span></td>
                <td><span style="color:var(--color-text-tertiary)">${c.slug}</span></td>
                <td><span class="badge badge-new">${groupName}</span></td>
                <td>${c.sort_order || 0}</td>
                <td><span class="badge ${c.active !== false ? 'badge-active' : 'badge-inactive'}">${c.active !== false ? 'Active' : 'Inactive'}</span></td>
                <td class="col-actions">
                  <button class="edit-btn" title="Edit category"><span class="material-symbols-outlined">edit</span></button>
                  <button class="delete delete-btn" title="Delete category"><span class="material-symbols-outlined">delete</span></button>
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>` : `<div class="admin-cat-group-body" style="display:${collapsed ? 'none' : 'block'};padding:var(--space-6);text-align:center;color:var(--color-text-tertiary);font-size:var(--fs-sm);">
        No subcategories yet. <button class="admin-btn admin-btn-ghost admin-btn-sm" data-add-to-group="${groupName.replace(/"/g, '&quot;')}" style="margin-left:var(--space-2);"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle;">add</span> Add one</button>
      </div>`}
    </div>
  `;
}

async function renderCategories(container) {
  // Always read fresh from the DB (with 60s cache inside fetchCategories)
  const [categories, groups] = await Promise.all([
    fetchCategories(),
    fetchCategoryGroups(),
  ]);

  const grouped = getCategoriesByGroup(categories || []);
  const uncategorized = (categories || []).filter(c => !c.group_name);

  // Preserve collapsed state across re-renders
  const collapsedSet = new Set(
    JSON.parse(sessionStorage.getItem('admin_cat_collapsed') || '[]')
  );

  // Preserve add-to-group scroll/focus intent if the caller asked for it
  const expandGroup = sessionStorage.getItem('admin_cat_expand_once') || null;
  if (expandGroup) {
    collapsedSet.delete(expandGroup);
    sessionStorage.removeItem('admin_cat_expand_once');
    sessionStorage.setItem('admin_cat_collapsed', JSON.stringify([...collapsedSet]));
  }

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Categories</h1>
        <span class="admin-header-stats">${categories?.length || 0} items in ${groups.length} group${groups.length !== 1 ? 's' : ''}</span>
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:center;flex:1;justify-content:flex-end;flex-wrap:wrap;">
        <div class="admin-search-wrap">
          <span class="material-symbols-outlined">search</span>
          <input type="text" class="admin-search" id="cat-search" placeholder="Search categories...">
        </div>
        <button class="admin-btn admin-btn-ghost" id="add-group-btn" title="Create a new category group">
          <span class="material-symbols-outlined">create_new_folder</span>
          New Group
        </button>
        <button class="admin-btn admin-btn-primary" id="add-cat-btn">
          <span class="material-symbols-outlined">add</span>
          Add Category
        </button>
      </div>
    </div>
    <div id="cats-container">
      ${groups.map(g => renderCategoryTable(grouped[g.name], g, {
        collapsed: collapsedSet.has(g.name),
        fallbackName: g.name,
      })).join('')}
      ${uncategorized.length ? renderCategoryTable(uncategorized, { id: '', name: 'Uncategorized' }, {
        collapsed: collapsedSet.has('Uncategorized'),
      }) : ''}
      ${groups.length === 0 && uncategorized.length === 0 ? `
        <div class="admin-card" style="padding:var(--space-12);text-align:center;">
          <span class="material-symbols-outlined" style="font-size:48px;color:var(--color-text-tertiary);">category</span>
          <h3 style="margin-top:var(--space-4);">No categories yet</h3>
          <p style="color:var(--color-text-tertiary);">Create your first group to organize the navigation menu.</p>
          <button class="admin-btn admin-btn-primary" id="add-group-btn-empty" style="margin-top:var(--space-4);">
            <span class="material-symbols-outlined">create_new_folder</span> Create First Group
          </button>
        </div>
      ` : ''}
    </div>
  `;

  const persistCollapsed = () => {
    sessionStorage.setItem('admin_cat_collapsed', JSON.stringify([...collapsedSet]));
  };

  // ===== Wire interactions =====
  document.getElementById('cat-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.cat-row').forEach(row => {
      const name = row.querySelector('.col-name strong')?.textContent.toLowerCase() || '';
      const slug = row.querySelector('.col-name span')?.textContent.toLowerCase() || '';
      const groupCard = row.closest('.admin-cat-group');
      row.style.display = (name.includes(q) || slug.includes(q)) ? '' : 'none';
      if (groupCard) {
        const visible = groupCard.querySelectorAll('.cat-row:not([style*="none"])').length;
        groupCard.style.display = visible > 0 ? '' : 'none';
      }
    });
  });

  // Collapse/expand toggle
  document.querySelectorAll('.admin-cat-toggle').forEach(btn => {
    btn.onclick = () => {
      const name = btn.dataset.group;
      const card = btn.closest('.admin-cat-group');
      const body = card?.querySelector('.admin-cat-group-body');
      const icon = btn.querySelector('.admin-cat-toggle-icon');
      if (!body) return;
      const isCollapsed = body.style.display === 'none';
      if (isCollapsed) {
        body.style.display = 'block';
        if (icon) icon.style.transform = '';
        collapsedSet.delete(name);
      } else {
        body.style.display = 'none';
        if (icon) icon.style.transform = 'rotate(-90deg)';
        collapsedSet.add(name);
      }
      btn.setAttribute('aria-expanded', String(isCollapsed));
      persistCollapsed();
    };
  });

  // Add to specific group (sets the group in the modal)
  document.querySelectorAll('[data-add-to-group]').forEach(btn => {
    btn.onclick = () => openCategoryModal(container, null, btn.dataset.addToGroup);
  });

  // Rename group
  document.querySelectorAll('[data-rename-group]').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.dataset.renameGroup;
      const oldName = btn.dataset.groupName;
      const newName = prompt('Rename group:', oldName);
      if (!newName || newName.trim() === oldName) return;
      const { error } = await supabase.from('category_groups').update({ name: newName.trim() }).eq('id', id);
      if (error) { showToast(`Rename failed: ${error.message}`, 'error'); return; }
      bustCategoriesCache();
      showToast('Group renamed.');
      await renderCategories(container);
    };
  });

  // Delete group (moves its categories to Uncategorized, then deletes the group)
  document.querySelectorAll('[data-delete-group]').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.deleteGroup;
      const name = btn.dataset.groupName;
      if (!id) { showToast('Cannot delete an unsaved group.', 'error'); return; }
      showConfirmDialog(
        `Delete group "${name}"? Subcategories will move to Uncategorized.`,
        async () => {
          // Clear group_id on any categories in this group, then delete the group
          await supabase.from('categories').update({ group_id: null }).eq('group_id', id);
          const { error } = await supabase.from('category_groups').delete().eq('id', id);
          if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return; }
          bustCategoriesCache();
          showToast('Group deleted.');
          await renderCategories(container);
        }
      );
    };
  });

  // New group
  const onAddGroup = async () => {
    const name = prompt('New group name:');
    if (!name || !name.trim()) return;
    // Compute next sort_order
    const nextOrder = (groups[groups.length - 1]?.sort_order || 0) + 1;
    const { error } = await supabase.from('category_groups').insert({ name: name.trim(), sort_order: nextOrder });
    if (error) { showToast(`Create failed: ${error.message}`, 'error'); return; }
    bustCategoriesCache();
    showToast('Group created.');
    // Expand the new group so the user can immediately add subcategories
    sessionStorage.setItem('admin_cat_expand_once', name.trim());
    await renderCategories(container);
  };
  document.getElementById('add-group-btn')?.addEventListener('click', onAddGroup);
  document.getElementById('add-group-btn-empty')?.addEventListener('click', onAddGroup);

  // Add category (no group preselected)
  document.getElementById('add-cat-btn')?.addEventListener('click', () => openCategoryModal(container, null, null));

  // Per-row actions
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const cat = categories.find(c => c.id === id);
      openCategoryModal(container, cat, cat?.group_name || null);
    };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const cat = categories.find(c => c.id === id);
      showConfirmDialog(
        `Delete category "${cat?.name}"?${
          cat?.image_url ? ' This will not delete the image file (base64 is in the row).' : ''
        }`,
        async () => {
          // Also clean up product_categories junction rows pointing here
          await supabase.from('product_categories').delete().eq('category_id', id);
          const { error } = await supabase.from('categories').delete().eq('id', id);
          if (error) { showToast(`Delete failed: ${error.message}`, 'error'); return; }
          bustCategoriesCache();
          showToast('Category deleted.');
          await renderCategories(container);
        }
      );
    };
  });
}

async function openCategoryModal(container, category = null, presetGroupName = null) {
  const isEdit = !!category;
  // Always read groups fresh so the dropdown reflects the current DB state
  const groups = await fetchCategoryGroups();
  const currentGroup = isEdit
    ? (category?.group_name || null)
    : (presetGroupName || null);

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Category</h2><button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button></div>
      <form class="admin-form" id="cat-form">
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input name="name" value="${category?.name || ''}" required id="cat-name"></div>
          <div class="form-group"><label>Slug *</label><input name="slug" value="${category?.slug || ''}" required id="cat-slug"><small style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Auto-generated from name if blank</small></div>
        </div>
        <div class="form-group">
          <label>Group</label>
          <select name="group_id" id="cat-group-select">
            <option value="">— Uncategorized —</option>
            ${groups.map(g => `<option value="${g.id}" ${g.name === currentGroup ? 'selected' : ''}>${g.name}</option>`).join('')}
          </select>
          <small style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Determines which menu group this category appears under on the live site.</small>
        </div>
        <div class="form-group"><label>Icon (material symbol name)</label><input name="icon" value="${category?.icon || ''}" placeholder="auto_stories"></div>
        <div class="form-group"><label>Description</label><textarea name="description">${category?.description || ''}</textarea></div>
        <div class="form-group"><label>Image URL</label><input name="image_url" value="${category?.image_url || ''}"></div>
        <div class="form-row">
          <div class="form-group checkbox"><input name="active" type="checkbox" id="cat_active" ${category?.active !== false ? 'checked' : ''}><label for="cat_active">Active</label></div>
          <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="${category?.sort_order || 0}"></div>
        </div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save Changes' : 'Add Category'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — only the X button (or Cancel) closes. Backdrop click
  // is intentionally a no-op so dad doesn't lose form data from a stray click.
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  document.getElementById('cat-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name');
    const rawSlug = fd.get('slug');
    const slug = rawSlug ? rawSlug.trim() : generateSlug(name);
    if (!name || !name.trim()) { showToast('Category name is required.', 'error'); return; }
    if (!slug) { showToast('Slug is required.', 'error'); return; }

    // Resolve group_id from the selected option. If the user picks an
    // existing group, we use its id; if they pick a different group than the
    // current one, the slug may no longer match the old mapping — we don't
    // auto-migrate, we just save the new mapping.
    const groupIdRaw = fd.get('group_id');
    const groupId = groupIdRaw && groupIdRaw !== '' ? groupIdRaw : null;

    const payload = {
      name: name.trim(),
      slug,
      group_id: groupId,
      icon: fd.get('icon') || null,
      description: fd.get('description') || null,
      image_url: fd.get('image_url') || null,
      active: fd.get('active') === 'on',
      sort_order: Number(fd.get('sort_order')) || 0,
    };

    const { error: catError } = isEdit
      ? await supabase.from('categories').update(payload).eq('id', category.id)
      : await supabase.from('categories').insert(payload);
    if (catError) {
      console.error('Category save failed:', catError);
      showToast(`Failed: ${catError.message}`, 'error');
      return;
    }
    bustCategoriesCache();
    closeModal();
    showToast(isEdit ? 'Category updated!' : 'Category added!');
    await renderCategories(container);
  };

  const catNameInput = document.getElementById('cat-name');
  const catSlugInput = document.getElementById('cat-slug');
  catNameInput?.addEventListener('input', () => {
    if (!isEdit && !catSlugInput.dataset.manual) {
      catSlugInput.value = generateSlug(catNameInput.value);
    }
  });
  catSlugInput?.addEventListener('input', () => {
    if (catSlugInput.value) catSlugInput.dataset.manual = '1';
  });
}

// ===== BANNERS =====
async function renderBanners(container) {
  const { data: banners } = await supabase.from('banners').select('*').order('order_index');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Banners</h1>
        <span class="admin-header-stats">${banners?.length || 0} items</span>
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:center;flex:1;justify-content:flex-end">
        <button class="admin-btn admin-btn-primary" id="add-banner-btn">
          <span class="material-symbols-outlined">add</span> Add Banner
        </button>
      </div>
    </div>
    <div class="admin-card">
      ${banners?.length ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Image</th><th>Title</th><th>Subtitle</th><th>CTA</th><th>Order</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody id="banners-tbody">
          ${banners.map(b => `<tr class="banner-row" data-id="${b.id}">
            <td class="col-image">${b.image_url ? `<img src="${b.image_url}" alt="${b.title}" data-src="${b.image_url}">` : '<div style="width:64px;height:64px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border-light)"><span class="material-symbols-outlined" style="font-size:24px;color:var(--color-text-tertiary)">image</span></div>'}</td>
            <td class="col-name"><strong>${b.title}</strong><span>${b.subtitle || ''}</span></td>
            <td style="color:var(--color-text-secondary);font-size:var(--fs-sm)">${b.subtitle || '—'}</td>
            <td>${b.cta_text ? `<span style="font-size:var(--fs-sm)">${b.cta_text}</span><br><span style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">${b.cta_link || '—'}</span>` : '—'}</td>
            <td>${b.order_index || 0}</td>
            <td><span class="badge ${b.active ? 'badge-active' : 'badge-inactive'}">${b.active ? 'Active' : 'Inactive'}</span></td>
            <td class="col-actions">
              <button class="edit-btn"><span class="material-symbols-outlined">edit</span></button>
              <button class="delete delete-btn"><span class="material-symbols-outlined">delete</span></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><span class="material-symbols-outlined">perm_media</span><p>No banners found</p></div>`}
    </div>
  `;

  document.querySelectorAll('.banner-row .col-image img').forEach(img => {
    img.addEventListener('click', () => {
      const overlay = document.createElement('div');
      overlay.className = 'img-lightbox';
      overlay.innerHTML = `<img src="${img.dataset.src}" alt="">`;
      overlay.onclick = () => overlay.remove();
      document.body.appendChild(overlay);
    });
  });

  document.getElementById('add-banner-btn').onclick = () => openBannerModal(container);
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => { const id = btn.closest('tr').dataset.id; openBannerModal(container, banners.find(b => b.id === id)); };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this banner?', async () => {
        await supabase.from('banners').delete().eq('id', id);
        showToast('Banner deleted!');
        await renderBanners(container);
      });
    };
  });
}

function openBannerModal(container, banner = null) {
  const isEdit = !!banner;
  let selectedFile = null;
  let previewUrl = null;
  const BANNER_MIN_W = 1920;
  const BANNER_MIN_H = 720;

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';

  const renderPreview = (src) => {
    const preview = overlay.querySelector('#banner-preview');
    if (preview) {
      preview.innerHTML = src
        ? `<img src="${src}" style="max-width:100%;max-height:200px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--color-border-light);">`
        : `<div style="height:120px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary);font-size:var(--fs-sm);border:1px dashed var(--color-border)">No image selected</div>`;
    }
  };

  overlay.innerHTML = `
    <div class="admin-modal" style="max-width:540px">
      <div class="admin-modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Banner</h2><button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button></div>
      <form class="admin-form" id="banner-form">
        <div class="form-group"><label>Title *</label><input name="title" value="${banner?.title || ''}" required></div>
        <div class="form-group"><label>Subtitle</label><input name="subtitle" value="${banner?.subtitle || ''}"></div>
        <div class="form-row">
          <div class="form-group"><label>CTA Text</label><input name="cta_text" value="${banner?.cta_text || ''}"></div>
          <div class="form-group"><label>CTA Link</label><input name="cta_link" value="${banner?.cta_link || ''}"></div>
        </div>
        <div class="form-group">
          <label>Banner Image *</label>
          <div id="banner-preview">
            ${banner?.image_url
              ? `<img src="${banner.image_url}" style="max-width:100%;max-height:200px;object-fit:cover;border-radius:var(--radius-md);border:1px solid var(--color-border-light);">`
              : `<div style="height:120px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary);font-size:var(--fs-sm);border:1px dashed var(--color-border)">No image selected</div>`
            }
          </div>
          <input name="image_file" type="file" id="banner-file-input" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" style="margin-top:var(--space-3)">
          <small style="color:var(--color-text-tertiary);font-size:var(--fs-xs);margin-top:var(--space-1)">
            Accepted: JPG, PNG, WebP &middot; Required size: ${BANNER_MIN_W}&times;${BANNER_MIN_H}px (16:6 ratio)
          </small>
          ${banner?.image_url ? '<small style="color:var(--color-text-tertiary);font-size:var(--fs-xs);margin-top:var(--space-1)">Leave file empty to keep current image</small>' : ''}
        </div>
        <div class="form-row">
          <div class="form-group checkbox"><input name="active" type="checkbox" id="banner_active" ${banner?.active !== false ? 'checked' : ''}><label for="banner_active">Active</label></div>
          <div class="form-group"><label>Sort Order</label><input name="order_index" type="number" value="${banner?.order_index || 0}"></div>
        </div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save Changes' : 'Add Banner'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);

  const fileInput = overlay.querySelector('#banner-file-input');
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      showToast('Invalid file type. Use JPG, PNG, or WebP.', 'error');
      fileInput.value = '';
      renderPreview(banner?.image_url || null);
      return;
    }

    if (file.size > MAX_MEDIA_SIZE) {
      showToast(`File too large. Max size is 8 MB.`, 'error');
      fileInput.value = '';
      renderPreview(banner?.image_url || null);
      return;
    }

    try {
      await validateBannerImage(file);
      selectedFile = file;
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(file);
      renderPreview(previewUrl);
    } catch (err) {
      showToast(err.message, 'error');
      fileInput.value = '';
      selectedFile = null;
      renderPreview(banner?.image_url || null);
    }
  });

  // Close handlers — robust against nested editors
  const closeBannerModal = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    closeModal();
  };
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeBannerModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeBannerModal();
  });

  document.getElementById('banner-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    let imageUrl = banner?.image_url || '';

    if (selectedFile) {
      try {
        imageUrl = await readFileAsDataUrl(selectedFile);
      } catch (err) {
        showToast('Failed to process image.', 'error');
        return;
      }
    }

    if (!imageUrl) {
      showToast('Banner image is required.', 'error');
      return;
    }

    const payload = {
      title: fd.get('title'),
      subtitle: fd.get('subtitle') || null,
      cta_text: fd.get('cta_text') || null,
      cta_link: fd.get('cta_link') || null,
      image_url: imageUrl,
      active: fd.get('active') === 'on',
      order_index: Number(fd.get('order_index')) || 0,
    };
    const { error: bannerError } = isEdit
      ? await supabase.from('banners').update(payload).eq('id', banner.id)
      : await supabase.from('banners').insert(payload);
    if (bannerError) {
      showToast(`Failed: ${bannerError.message}`, 'error');
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    bustContentCache();
    closeModal();
    showToast(isEdit ? 'Banner updated!' : 'Banner added!');
    await renderBanners(container);
  };
}

// ===== SETTINGS =====
async function renderSettings(container) {
  const { data: settings } = await supabase.from('site_settings').select('*').order('key');

  const getSetting = (key, fallback = '') => settings?.find(s => s.key === key)?.value || fallback;

  container.innerHTML = `
    <div class="admin-header">
      <h1>Site Settings</h1>
    </div>
    <form id="settings-form">
      <div class="settings-grid">
        <div class="settings-section">
          <h3>General</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            <div class="form-group"><label>Site Name</label><input name="site_name" value="${getSetting('site_name')}"></div>
            <div class="form-group"><label>Tagline</label><input name="tagline" value="${getSetting('tagline')}"></div>
            <div class="form-group"><label>Site Title (browser tab)</label><input name="site_title" value="${getSetting('site_title')}" placeholder="New Year Diaries | Premium Diaries & Corporate Planners | Manufacturer Direct"></div>
          </div>
        </div>
        <div class="settings-section">
          <h3>Contact Information</h3>
          <div style="display:flex;flex-direction:column;gap:var(--space-4)">
            <div class="form-group"><label>Contact Email</label><input name="contact_email" type="email" value="${getSetting('contact_email')}"></div>
            <div class="form-group"><label>Contact Phone</label><input name="contact_phone" value="${getSetting('contact_phone')}"></div>
            <div class="form-group"><label>Contact Address</label><textarea name="contact_address" rows="3">${getSetting('contact_address')}</textarea></div>
          </div>
        </div>
      </div>
      <div style="margin-top:var(--space-6);display:flex;justify-content:flex-end">
        <button type="submit" class="admin-btn admin-btn-primary"><span class="material-symbols-outlined">save</span> Save Settings</button>
      </div>
    </form>
  `;

  document.getElementById('settings-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const fields = [
      { key: 'site_name', value: fd.get('site_name') },
      { key: 'tagline', value: fd.get('tagline') },
      { key: 'site_title', value: fd.get('site_title') },
      { key: 'contact_email', value: fd.get('contact_email') },
      { key: 'contact_phone', value: fd.get('contact_phone') },
      { key: 'contact_address', value: fd.get('contact_address') },
    ];
    for (const field of fields) {
      const existing = settings?.find(s => s.key === field.key);
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value: field.value }).eq('id', existing.id);
        if (error) {
          showToast(`Failed to save ${field.key}: ${error.message}`, 'error');
          return;
        }
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: field.key, value: field.value });
        if (error) {
          showToast(`Failed to save ${field.key}: ${error.message}`, 'error');
          return;
        }
      }
    }
    bustContentCache();
    showToast('Settings saved!');
    await renderSettings(container);
  };
}

// ===== ENQUIRIES =====
let enquiryTab = 'contact';

async function renderEnquiries(container, tab = 'contact') {
  enquiryTab = tab;

  const { data: contacts, count: contactCount } = await supabase
    .from('contact_submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  const { data: enquiries, count: enquiryCount } = await supabase
    .from('enquiries')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });
  const { data: orders, count: orderCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const renderContactTable = () => (contacts?.length ? `
    <table class="admin-table">
      <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Mobile</th><th>State</th><th>Message</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${contacts.map(c => `<tr data-id="${c.id}">
          <td><code style="font-size:var(--fs-xs);background:var(--color-surface-alt);padding:2px 6px;border-radius:var(--radius-sm);">${c.enquiry_code || '—'}</code></td>
          <td>${c.name}${c.address ? `<br><span style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">${c.address}</span>` : ''}</td>
          <td><a href="mailto:${c.email}">${c.email}</a></td>
          <td>${c.mobile ? `<a href="tel:${c.mobile}">${c.mobile}</a>` : '—'}</td>
          <td>${c.state || '—'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(c.message || '').replace(/"/g, '&quot;')}">${c.message || '—'}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${c.status === 'reviewed' ? 'badge-reviewed' : 'badge-new'}">${c.status === 'reviewed' ? 'Reviewed' : 'New'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
            <button class="review-btn" title="${c.status === 'reviewed' ? 'Mark pending' : 'Mark reviewed'}"><span class="material-symbols-outlined">${c.status === 'reviewed' ? 'undo' : 'check'}</span></button>
            <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No contact submissions</p></div>');

  const renderEnquiryTable = () => (enquiries?.length ? `
    <table class="admin-table">
      <thead><tr><th>Code</th><th>Name</th><th>Email</th><th>Company</th><th>Products</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${enquiries.map(e => `<tr data-id="${e.id}">
          <td><code style="font-size:var(--fs-xs);background:var(--color-surface-alt);padding:2px 6px;border-radius:var(--radius-sm);">${e.enquiry_code || '—'}</code></td>
          <td>${e.name}</td>
          <td><a href="mailto:${e.email}">${e.email}</a></td>
          <td>${e.company || '—'}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.product_names || e.products || '—'}</td>
          <td>${new Date(e.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${e.status === 'reviewed' ? 'badge-reviewed' : 'badge-new'}">${e.status === 'reviewed' ? 'Reviewed' : 'New'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
            <button class="review-btn" title="${e.status === 'reviewed' ? 'Mark pending' : 'Mark reviewed'}"><span class="material-symbols-outlined">${e.status === 'reviewed' ? 'undo' : 'check'}</span></button>
            <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No bulk enquiries</p></div>');

  const renderOrdersTable = () => (orders?.length ? `
    <table class="admin-table">
      <thead><tr><th>Order #</th><th>Name</th><th>Email</th><th>Phone</th><th>Total</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${orders.map(o => `<tr data-id="${o.id}">
          <td><code style="font-size:var(--fs-xs);background:var(--color-surface-alt);padding:2px 6px;border-radius:var(--radius-sm);">${o.order_number || '—'}</code></td>
          <td>${o.first_name} ${o.last_name}</td>
          <td><a href="mailto:${o.email}">${o.email}</a></td>
          <td>${o.phone || '—'}</td>
          <td>₹${o.total}</td>
          <td>${new Date(o.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${o.status === 'pending' ? 'badge-new' : 'badge-reviewed'}">${o.status || 'Pending'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No orders yet</p></div>');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Enquiries & Submissions</h1>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-4);margin-bottom:var(--space-8)">
      <div class="admin-card" style="padding:var(--space-6);cursor:pointer" id="stat-contacts">
        <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:var(--ls-wider);margin-bottom:var(--space-2)">Contact Messages</div>
        <div style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${contactCount || contacts?.length || 0}</div>
      </div>
      <div class="admin-card" style="padding:var(--space-6);cursor:pointer" id="stat-enquiries">
        <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:var(--ls-wider);margin-bottom:var(--space-2)">Bulk Enquiries</div>
        <div style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${enquiryCount || enquiries?.length || 0}</div>
      </div>
      <div class="admin-card" style="padding:var(--space-6);cursor:pointer" id="stat-orders">
        <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:var(--ls-wider);margin-bottom:var(--space-2)">Orders</div>
        <div style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${orderCount || orders?.length || 0}</div>
      </div>
    </div>

    <div class="enquiry-tabs">
      <button class="enquiry-tab ${tab === 'contact' ? 'active' : ''}" data-etab="contact">
        Contact Messages <span class="count-badge">${contactCount || contacts?.length || 0}</span>
      </button>
      <button class="enquiry-tab ${tab === 'enquiry' ? 'active' : ''}" data-etab="enquiry">
        Bulk Enquiries <span class="count-badge">${enquiryCount || enquiries?.length || 0}</span>
      </button>
      <button class="enquiry-tab ${tab === 'orders' ? 'active' : ''}" data-etab="orders">
        Orders <span class="count-badge">${orderCount || orders?.length || 0}</span>
      </button>
    </div>

    <div class="admin-card">
      ${tab === 'contact' ? renderContactTable() : tab === 'enquiry' ? renderEnquiryTable() : renderOrdersTable()}
    </div>
  `;

  // Stat card navigation
  document.getElementById('stat-contacts')?.addEventListener('click', () => renderEnquiries(container, 'contact'));
  document.getElementById('stat-enquiries')?.addEventListener('click', () => renderEnquiries(container, 'enquiry'));
  document.getElementById('stat-orders')?.addEventListener('click', () => renderEnquiries(container, 'orders'));

  // Tab switching
  document.querySelectorAll('.enquiry-tab').forEach(btn => {
    btn.addEventListener('click', () => renderEnquiries(container, btn.dataset.etab));
  });

  // Action handlers
  const currentData = tab === 'contact' ? contacts : tab === 'enquiry' ? enquiries : orders;
  const tableName = tab === 'contact' ? 'contact_submissions' : tab === 'enquiry' ? 'enquiries' : 'orders';

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const item = currentData.find(d => d.id === id);
      openEnquiryDetailModal(item, tab);
    };
  });

  document.querySelectorAll('.review-btn').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.closest('tr').dataset.id;
      const item = currentData.find(d => d.id === id);
      const newStatus = item.status === 'reviewed' ? 'pending' : 'reviewed';
      await supabase.from(tableName).update({ status: newStatus }).eq('id', id);
      showToast(newStatus === 'reviewed' ? 'Marked as reviewed!' : 'Marked as pending!');
      await renderEnquiries(container, tab);
    };
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this item permanently?', async () => {
        await supabase.from(tableName).delete().eq('id', id);
        showToast('Deleted!');
        await renderEnquiries(container, tab);
      });
    };
  });
}

function openEnquiryDetailModal(item, type) {
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';

  const fields = type === 'contact'
    ? [
        { label: 'Enquiry Code', value: item.enquiry_code || '—' },
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Phone', value: item.phone || '—' },
        { label: 'Subject', value: item.subject || '—' },
        { label: 'Message', value: item.message || '—' },
        { label: 'Status', value: item.status || 'pending' },
        { label: 'Submitted', value: new Date(item.created_at).toLocaleString() },
      ]
    : type === 'enquiry'
    ? [
        { label: 'Enquiry Code', value: item.enquiry_code || '—' },
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Company', value: item.company || '—' },
        { label: 'Products', value: item.product_names || item.products || '—' },
        { label: 'Message', value: item.message || '—' },
        { label: 'Status', value: item.status || 'pending' },
        { label: 'Submitted', value: new Date(item.created_at).toLocaleString() },
      ]
    : [
        { label: 'Enquiry Code', value: item.enquiry_code || '—' },
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Phone', value: item.phone || '—' },
        { label: 'Company', value: item.company || '—' },
        { label: 'Product Interest', value: item.product_type || '—' },
        { label: 'Products', value: item.product_names || '—' },
        { label: 'Quantity', value: item.quantity || '—' },
        { label: 'Requirements', value: item.custom_requirements || '—' },
        { label: 'Status', value: item.status || 'pending' },
        { label: 'Submitted', value: new Date(item.created_at).toLocaleString() },
      ];

  overlay.innerHTML = `
    <div class="admin-modal enquiry-detail-modal">
      <div class="admin-modal-header">
        <h2>${type === 'contact' ? 'Contact Message' : type === 'enquiry' ? 'Bulk Enquiry' : 'Quote Request'} Details</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div class="admin-form">
        ${fields.map(f => `
          <div class="enquiry-field">
            <label>${f.label}</label>
            <div class="value">${f.value}</div>
          </div>
        `).join('')}
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Close</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
}

// ===== HEADER SECTION =====
async function renderHeaderSection(container) {
  const { data: ann } = await supabase.from('announcements').select('*').order('sort_order');
  const { data: contentRows } = await supabase.from('site_content').select('*').eq('section', 'header');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Header</h1>
        <span class="admin-header-stats">Announcement bar</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">
      <div class="admin-card">
        <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6)">
          <h2 style="font-size:var(--fs-lg)">Announcement Items</h2>
          <button class="admin-btn admin-btn-primary" id="add-ann-btn" style="padding:var(--space-1) var(--space-3)">
            <span class="material-symbols-outlined" style="font-size:16px">add</span> Add
          </button>
        </div>
        <div id="ann-list" style="padding:var(--space-4) var(--space-6);display:flex;flex-direction:column;gap:var(--space-3)">
          ${(ann || []).map((a, i) => `
            <div style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3);background:var(--color-surface-alt);border-radius:var(--radius-md);border:1px solid var(--color-border-light)">
              <div style="flex:1">
                <div style="font-weight:var(--fw-medium)">${a.text}</div>
                ${a.link ? `<div style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">→ ${a.link}</div>` : ''}
              </div>
              <button class="ann-edit-btn" data-id="${a.id}" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);cursor:pointer"><span class="material-symbols-outlined" style="font-size:16px">edit</span></button>
              <button class="ann-del-btn" data-id="${a.id}" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:var(--color-surface);color:var(--color-error);cursor:pointer"><span class="material-symbols-outlined" style="font-size:16px">delete</span></button>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="admin-card" style="padding:var(--space-6)">
        <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin-bottom:var(--space-6)">Header Settings</h2>
        <form id="header-form" style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="form-group"><label>Announcement Bar Text</label>
            <textarea name="announcement_text" rows="3" placeholder="Use | to separate items">${contentRows?.find(c => c.key === 'announcement_text')?.value || ''}</textarea>
          </div>
          <div class="form-group"><label>Announcement Link (last item)</label>
            <input name="announcement_link" value="${contentRows?.find(c => c.key === 'announcement_link')?.value || '/bulk-quote'}">
          </div>
          <button type="submit" class="admin-btn admin-btn-primary" style="align-self:flex-start">Save Header</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('add-ann-btn').onclick = () => openAnnModal(container);
  document.querySelectorAll('.ann-edit-btn').forEach(btn => {
    btn.onclick = () => openAnnModal(container, ann.find(a => a.id === btn.dataset.id));
  });
  document.querySelectorAll('.ann-del-btn').forEach(btn => {
    btn.onclick = () => {
      if (confirm('Delete this announcement?')) {
        supabase.from('announcements').delete().eq('id', btn.dataset.id).then(() => renderHeaderSection(container));
      }
    };
  });
  document.getElementById('header-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const rows = [
      { key: 'announcement_text', value: fd.get('announcement_text'), section: 'header' },
      { key: 'announcement_link', value: fd.get('announcement_link'), section: 'header' },
    ];
    for (const row of rows) {
      const { error } = await supabase.from('site_content').upsert(row, { onConflict: 'section,key' });
      if (error) {
        showToast(`Failed to save header: ${error.message}`, 'error');
        return;
      }
    }
    bustContentCache();
    showToast('Header saved!');
    renderHeaderSection(container);
  };
}

function openAnnModal(container, ann = null) {
  const isEdit = !!ann;
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Announcement</h2><button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button></div>
      <form class="admin-form" id="ann-form">
        <div class="form-group"><label>Text *</label><input name="text" value="${ann?.text || ''}" required placeholder="e.g. Free Shipping on Orders 500+"></div>
        <div class="form-group"><label>Link (optional)</label><input name="link" value="${ann?.link || ''}" placeholder="/bulk-quote"></div>
        <div class="form-row">
          <div class="form-group"><label>Sort Order</label><input name="sort_order" type="number" value="${ann?.sort_order || 0}"></div>
          <div class="form-group checkbox"><input name="active" type="checkbox" id="ann_active" ${ann?.active !== false ? 'checked' : ''}><label for="ann_active">Active</label></div>
        </div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — robust against nested editors
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
    }
  });
  overlay.querySelector('.admin-modal').addEventListener('mousedown', (e) => e.stopPropagation());
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  document.getElementById('ann-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { text: fd.get('text'), link: fd.get('link') || null, sort_order: Number(fd.get('sort_order')) || 0, active: fd.get('active') === 'on' };
    const { error: annError } = isEdit
      ? await supabase.from('announcements').update(payload).eq('id', ann.id)
      : await supabase.from('announcements').insert(payload);
    if (annError) {
      showToast(`Failed: ${annError.message}`, 'error');
      return;
    }
    bustContentCache();
    closeModal();
    showToast(isEdit ? 'Announcement updated!' : 'Announcement added!');
    renderHeaderSection(document.getElementById('admin-content'));
  };
}

// ===== HOMEPAGE SECTION =====
async function renderHomepageSection(container) {
  const { data: hero } = await supabase.from('homepage_sections').select('*').eq('section_key', 'hero').single();
  const { data: cta } = await supabase.from('homepage_sections').select('*').eq('section_key', 'cta').single();
  const { data: shopCats } = await supabase.from('shop_categories').select('*').order('sort_order');
  const { data: primaryCats } = await supabase.from('categories').select('id, name, slug').eq('active', true).order('sort_order');
  const { data: trustBadges } = await supabase.from('trust_badges').select('*').order('position');
  const { data: sliderSections } = await supabase.from('homepage_slider_sections').select('*').order('sort_order');
  const { data: sliderItems } = await supabase.from('homepage_slider_items').select('*').order('position');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Homepage</h1>
        <span class="admin-header-stats">Hero, Trust Badges, Sliders, CTA & Shop by Category</span>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6);margin-bottom:var(--space-6)">
      <div class="admin-card" style="padding:var(--space-6)">
        <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin-bottom:var(--space-4)">🏠 Hero Banner</h2>
        <form id="hero-form" style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="form-group"><label>Title</label><input name="title" value="${hero?.title || ''}"></div>
          <div class="form-group"><label>Subtitle</label><input name="subtitle" value="${hero?.subtitle || ''}"></div>
          <div class="form-row">
            <div class="form-group"><label>CTA Text</label><input name="cta_text" value="${hero?.cta_text || ''}"></div>
            <div class="form-group"><label>CTA Link</label><input name="cta_link" value="${hero?.cta_link || ''}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>2nd CTA Text</label><input name="second_cta_text" value="${hero?.second_cta_text || ''}"></div>
            <div class="form-group"><label>2nd CTA Link</label><input name="second_cta_link" value="${hero?.second_cta_link || ''}"></div>
          </div>
          <button type="submit" class="admin-btn admin-btn-primary" style="align-self:flex-start">Save Hero</button>
        </form>
      </div>

      <div class="admin-card" style="padding:var(--space-6)">
        <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold);margin-bottom:var(--space-4)">📣 CTA Section</h2>
        <form id="cta-form" style="display:flex;flex-direction:column;gap:var(--space-4)">
          <div class="form-group"><label>Title</label><input name="title" value="${cta?.title || ''}"></div>
          <div class="form-group"><label>Subtitle</label><textarea name="subtitle" rows="3">${cta?.subtitle || ''}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>CTA Text</label><input name="cta_text" value="${cta?.cta_text || ''}"></div>
            <div class="form-group"><label>CTA Link</label><input name="cta_link" value="${cta?.cta_link || ''}"></div>
          </div>
          <button type="submit" class="admin-btn admin-btn-primary" style="align-self:flex-start">Save CTA</button>
        </form>
      </div>
    </div>

    <div class="admin-card" style="padding:0;overflow:hidden;margin-bottom:var(--space-6)">
      <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6);display:flex;align-items:center;justify-content:space-between">
        <div>
          <h2 style="font-size:var(--fs-lg);margin:0">⭐ Trust Badges</h2>
          <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">The 4 USP cards shown above the "Ready for Corporate Orders?" section (icon, title, description)</p>
        </div>
        <button class="admin-btn admin-btn-primary" id="add-trust-badge-btn">
          <span class="material-symbols-outlined">add</span> Add Badge
        </button>
      </div>
      ${trustBadges?.length ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th style="width:60px">Icon</th><th>Title</th><th>Description</th><th style="width:60px">Position</th><th style="width:80px">Status</th><th style="width:90px;text-align:right">Actions</th></tr></thead>
        <tbody>
          ${trustBadges.map(b => `<tr data-id="${b.id}">
            <td><span class="material-symbols-outlined" style="color:var(--color-accent)">${b.icon || 'verified'}</span></td>
            <td><strong>${b.title || ''}</strong><div style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">${b.icon || ''}</div></td>
            <td style="font-size:var(--fs-sm);color:var(--color-text-secondary)">${b.description || ''}</td>
            <td>${b.position || 0}</td>
            <td><span class="badge ${b.active !== false ? 'badge-active' : 'badge-inactive'}">${b.active !== false ? 'Active' : 'Inactive'}</span></td>
            <td class="col-actions">
              <button class="edit-trust-badge-btn" title="Edit"><span class="material-symbols-outlined">edit</span></button>
              <button class="delete-trust-badge-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state" style="padding:var(--space-6)"><span class="material-symbols-outlined">verified</span><p>No trust badges added yet</p></div>`}
    </div>

        <div class="admin-card" style="padding:0;overflow:hidden;margin-bottom:var(--space-6)">
      <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6);display:flex;align-items:center;justify-content:space-between">
        <div>
          <h2 style="font-size:var(--fs-lg);margin:0">🎠 Slider Sections</h2>
          <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">The 5 product carousels on the homepage — edit title, "View All" link, background, and the products shown (up to 10 each).</p>
        </div>
      </div>
      ${sliderSections?.length ? `<div style="padding:var(--space-2)">
        ${sliderSections.map(sec => {
          const secItems = (sliderItems || []).filter(it => it.section_id === sec.id);
          return `
          <div style="display:grid;grid-template-columns:1fr 80px 70px 90px 130px;gap:var(--space-3);align-items:center;padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--color-border-light)">
            <div>
              <strong style="font-size:var(--fs-md)">${sec.title}</strong>
              <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary);margin-top:2px">${sec.view_all_link || '— no view all —'} · <span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${sec.bg_color || '#FAF8F5'};border:1px solid var(--color-border-light);vertical-align:middle"></span> ${sec.bg_color || '#FAF8F5'}</div>
            </div>
            <div style="text-align:center"><span class="badge ${sec.active !== false ? 'badge-active' : 'badge-inactive'}">${sec.active !== false ? 'Active' : 'Inactive'}</span></div>
            <div style="text-align:center;font-weight:var(--fw-semibold)">${secItems.length}/10</div>
            <div style="text-align:right">
              <button class="admin-btn admin-btn-ghost edit-slider-section-btn" data-id="${sec.id}" title="Edit section"><span class="material-symbols-outlined">edit</span> Edit</button>
            </div>
            <div style="text-align:right;display:flex;gap:var(--space-2);justify-content:flex-end">
              <button class="admin-btn admin-btn-primary pick-slider-products-btn" data-id="${sec.id}" title="Choose products"><span class="material-symbols-outlined">add_photo_alternate</span> Products</button>
            </div>
          </div>`;
        }).join('')}
      </div>` : `<div class="empty-state" style="padding:var(--space-6)"><span class="material-symbols-outlined">view_carousel</span><p>No slider sections yet. Run migration 20260620002 to seed the 5 default sections.</p></div>`}
    </div>

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
  `;

  document.getElementById('hero-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('homepage_sections').upsert({ section_key: 'hero', title: fd.get('title'), subtitle: fd.get('subtitle'), cta_text: fd.get('cta_text'), cta_link: fd.get('cta_link'), second_cta_text: fd.get('second_cta_text'), second_cta_link: fd.get('second_cta_link') }, { onConflict: 'section_key' });
    bustContentCache();
    showToast('Hero saved!');
  };
  document.getElementById('cta-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('homepage_sections').upsert({ section_key: 'cta', title: fd.get('title'), subtitle: fd.get('subtitle'), cta_text: fd.get('cta_text'), cta_link: fd.get('cta_link') }, { onConflict: 'section_key' });
    bustContentCache();
    showToast('CTA saved!');
  };

  document.getElementById('add-trust-badge-btn').onclick = () => openTrustBadgeModal(container, null, trustBadges);
  document.querySelectorAll('.edit-trust-badge-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      openTrustBadgeModal(container, trustBadges.find(b => b.id === id), trustBadges);
    };
  });
  document.querySelectorAll('.delete-trust-badge-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this trust badge?', async () => {
        await supabase.from('trust_badges').delete().eq('id', id);
        bustContentCache();
        showToast('Trust badge deleted!');
        renderHomepageSection(container);
      });
    };
  });

  document.querySelectorAll('.edit-slider-section-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      openSliderSectionModal(container, sliderSections.find(s => s.id === id));
    };
  });
  document.querySelectorAll('.pick-slider-products-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.id;
      const sec = sliderSections.find(s => s.id === id);
      const currentIds = (sliderItems || []).filter(it => it.section_id === id).map(it => it.product_id);
      openSliderPickerModal(container, sec, currentIds);
    };
  });

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
}

function openTrustBadgeModal(container, badge, allBadges) {
  const isEdit = !!badge;
  const nextPosition = isEdit
    ? (badge.position || 0)
    : ((allBadges && allBadges.length) ? Math.max(...allBadges.map(b => b.position || 0)) + 1 : 1);

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h2>${isEdit ? 'Edit' : 'Add'} Trust Badge</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form class="admin-form" id="trust-badge-form">
        <div class="form-group">
          <label>Material Symbol Icon *</label>
          <input name="icon" required value="${badge?.icon || 'verified'}" placeholder="e.g. draw, factory, workspace_premium, local_shipping">
          <small style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">Browse icons at <a href="https://fonts.google.com/icons" target="_blank" rel="noopener">fonts.google.com/icons</a> (use the exact name, lowercase, underscores).</small>
        </div>
        <div class="form-group"><label>Title *</label><input name="title" required value="${badge?.title || ''}" placeholder="e.g. Customized Diaries"></div>
        <div class="form-group"><label>Description</label><input name="description" value="${badge?.description || ''}" placeholder="e.g. Your Brand Logo Embossed"></div>
        <div class="form-row">
          <div class="form-group"><label>Position</label><input name="position" type="number" value="${nextPosition}"></div>
          <div class="form-group checkbox"><input name="active" type="checkbox" id="trust-badge-active" ${badge?.active !== false ? 'checked' : ''}><label for="trust-badge-active">Active</label></div>
        </div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">${isEdit ? 'Save Changes' : 'Add Badge'}</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — robust against nested editors
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
    }
  });
  overlay.querySelector('.admin-modal').addEventListener('mousedown', (e) => e.stopPropagation());
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  document.getElementById('trust-badge-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const icon = (fd.get('icon') || '').toString().trim();
    const title = (fd.get('title') || '').toString().trim();
    if (!icon || !title) { showToast('Icon and Title are required.', 'error'); return; }

    const payload = {
      icon,
      title,
      description: (fd.get('description') || '').toString().trim() || null,
      position: Number(fd.get('position')) || 0,
      active: fd.get('active') === 'on',
    };

    const { error } = isEdit
      ? await supabase.from('trust_badges').update(payload).eq('id', badge.id)
      : await supabase.from('trust_badges').insert(payload);
    if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    bustContentCache();
    closeModal();
    showToast(isEdit ? 'Trust badge updated!' : 'Trust badge added!');
    renderHomepageSection(container);
  };
}

function openSliderSectionModal(container, section) {
  const isEdit = !!section;
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header">
        <h2>Edit Slider Section</h2>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <form class="admin-form" id="slider-section-form">
        <div class="form-group"><label>Title *</label><input name="title" required value="${section?.title || ''}" placeholder="e.g. Leather Diary 2026"></div>
        <div class="form-group"><label>View All Link</label><input name="view_all_link" value="${section?.view_all_link || ''}" placeholder="e.g. /shop?cat=leather-diaries"></div>
        <div class="form-group"><label>Background Color</label>
          <div style="display:flex;gap:var(--space-2);align-items:center">
            <input type="color" name="bg_color_picker" value="${section?.bg_color || '#FAF8F5'}" style="width:50px;height:36px;border:1px solid var(--color-border);border-radius:4px;cursor:pointer">
            <input name="bg_color" value="${section?.bg_color || '#FAF8F5'}" placeholder="#FAF8F5" style="flex:1">
          </div>
        </div>
        <div class="form-group checkbox"><input name="active" type="checkbox" id="slider-active" ${section?.active !== false ? 'checked' : ''}><label for="slider-active">Active</label></div>
        <div class="admin-modal-actions">
          <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
          <button type="submit" class="admin-btn admin-btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — robust against nested editors
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
    }
  });
  overlay.querySelector('.admin-modal').addEventListener('mousedown', (e) => e.stopPropagation());
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  // Sync color picker ↔ text input
  const colorPicker = overlay.querySelector('[name="bg_color_picker"]');
  const colorText = overlay.querySelector('[name="bg_color"]');
  colorPicker.addEventListener('input', (e) => { colorText.value = e.target.value; });
  colorText.addEventListener('input', (e) => {
    const v = e.target.value.trim();
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v)) colorPicker.value = v;
  });

  document.getElementById('slider-section-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const title = (fd.get('title') || '').toString().trim();
    if (!title) { showToast('Title is required.', 'error'); return; }
    const payload = {
      title,
      view_all_link: (fd.get('view_all_link') || '').toString().trim() || null,
      bg_color: (fd.get('bg_color') || '').toString().trim() || '#FAF8F5',
      active: fd.get('active') === 'on',
    };
    const { error } = await supabase.from('homepage_slider_sections').update(payload).eq('id', section.id);
    if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    bustContentCache();
    closeModal();
    showToast('Slider section updated!');
    renderHomepageSection(container);
  };
}

// ============ Slider Product Picker Modal ============
// Folder-style browser: Root → Groups → Categories → Products with checkboxes.
// Selection limit: 10 products per section. Already-selected products from
// other sections don't conflict; only the cap matters.
const SLIDER_PICKER_LIMIT = 10;
const SLIDER_PICKER_STATE = { level: 'root', group: null, category: null, search: '', selected: [], allProducts: [] };

async function openSliderPickerModal(container, section, currentProductIds) {
  SLIDER_PICKER_STATE.selected = Array.isArray(currentProductIds) ? currentProductIds.slice() : [];

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal" style="max-width:880px;width:90vw">
      <div class="admin-modal-header">
        <div>
          <h2>Choose products for "${escHtml(section.title)}"</h2>
          <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">Pick up to ${SLIDER_PICKER_LIMIT} products. Selected products appear at the bottom of the modal.</p>
        </div>
        <button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button>
      </div>
      <div id="slider-picker-body" style="padding:var(--space-4) var(--space-6);min-height:300px;max-height:60vh;overflow-y:auto">
        ${renderSliderPickerLoading()}
      </div>
      <div class="admin-modal-actions" style="flex-direction:column;align-items:stretch;gap:var(--space-3)">
        <div id="slider-picker-chips" style="display:flex;flex-wrap:wrap;gap:var(--space-2);min-height:38px;padding:var(--space-3);background:var(--color-surface-alt);border-radius:var(--radius-md)"></div>
        <div style="display:flex;gap:var(--space-3);justify-content:space-between;align-items:center">
          <span id="slider-picker-count" style="font-size:var(--fs-sm);color:var(--color-text-tertiary)">0/${SLIDER_PICKER_LIMIT} selected</span>
          <div style="display:flex;gap:var(--space-2)">
            <button type="button" class="admin-btn admin-btn-ghost modal-cancel">Cancel</button>
            <button type="button" class="admin-btn admin-btn-primary" id="slider-picker-save">Save Selection</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  // Close handlers — robust against nested editors
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
    }
  });
  overlay.querySelector('.admin-modal').addEventListener('mousedown', (e) => e.stopPropagation());
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

  // Load all products once for the chip strip and for direct search
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, slug, images, price')
    .order('name');
  SLIDER_PICKER_STATE.allProducts = allProducts || [];
  const productMap = new Map((allProducts || []).map(p => [p.id, p]));

  function refresh() {
    const chipsEl = document.getElementById('slider-picker-chips');
    const countEl = document.getElementById('slider-picker-count');
    if (chipsEl) {
      chipsEl.innerHTML = SLIDER_PICKER_STATE.selected.length === 0
        ? '<span style="color:var(--color-text-tertiary);font-size:var(--fs-sm)">No products selected yet.</span>'
        : SLIDER_PICKER_STATE.selected.map((id, i) => {
            const p = productMap.get(id);
            if (!p) return '';
            const img = (p.images && p.images[0]) || '/images/placeholder.jpg';
            return `<span style="display:inline-flex;align-items:center;gap:6px;background:#fff;border:1px solid var(--color-border-light);border-radius:999px;padding:3px 10px 3px 3px;font-size:var(--fs-xs)">
              <img src="${img}" alt="" style="width:24px;height:24px;border-radius:50%;object-fit:cover">
              <span style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(p.name)}</span>
              <button type="button" class="slider-chip-remove" data-idx="${i}" style="background:none;border:none;cursor:pointer;color:var(--color-text-tertiary);padding:0;line-height:1" title="Remove"><span class="material-symbols-outlined" style="font-size:16px">close</span></button>
            </span>`;
          }).join('');
      chipsEl.querySelectorAll('.slider-chip-remove').forEach(b => {
        b.onclick = () => {
          const idx = Number(b.dataset.idx);
          SLIDER_PICKER_STATE.selected.splice(idx, 1);
          refresh();
        };
      });
    }
    if (countEl) {
      const n = SLIDER_PICKER_STATE.selected.length;
      countEl.textContent = `${n}/${SLIDER_PICKER_LIMIT} selected`;
      countEl.style.color = n >= SLIDER_PICKER_LIMIT ? 'var(--color-error)' : 'var(--color-text-tertiary)';
    }
  }

  async function renderLevel() {
    const body = document.getElementById('slider-picker-body');
    if (!body) return;
    if (SLIDER_PICKER_STATE.level === 'root') {
      body.innerHTML = renderSliderPickerBreadcrumb() + await renderSliderPickerFolders();
    } else if (SLIDER_PICKER_STATE.level === 'group') {
      body.innerHTML = renderSliderPickerBreadcrumb() + await renderSliderPickerCategories();
    } else if (SLIDER_PICKER_STATE.level === 'category') {
      body.innerHTML = renderSliderPickerBreadcrumb() + renderSliderPickerLoading();
      body.innerHTML = renderSliderPickerBreadcrumb() + await renderSliderPickerProducts();
    }
    wireSliderPickerFolderClicks();
  }

  document.getElementById('slider-picker-save').onclick = async () => {
    if (SLIDER_PICKER_STATE.selected.length === 0) {
      showToast('Please select at least one product.', 'error');
      return;
    }
    if (SLIDER_PICKER_STATE.selected.length > SLIDER_PICKER_LIMIT) {
      showToast(`Maximum ${SLIDER_PICKER_LIMIT} products.`, 'error');
      return;
    }
    // Replace all items for this section
    await supabase.from('homepage_slider_items').delete().eq('section_id', section.id);
    if (SLIDER_PICKER_STATE.selected.length > 0) {
      const rows = SLIDER_PICKER_STATE.selected.map((productId, i) => ({
        section_id: section.id,
        product_id: productId,
        position: i,
      }));
      const { error } = await supabase.from('homepage_slider_items').insert(rows);
      if (error) { showToast('Failed: ' + error.message, 'error'); return; }
    }
    bustContentCache();
    closeModal();
    showToast(`${SLIDER_PICKER_STATE.selected.length} product(s) saved!`);
    renderHomepageSection(container);
  };

  function wireSliderPickerFolderClicks() {
    const body = document.getElementById('slider-picker-body');
    if (!body) return;
    body.querySelectorAll('[data-picker-nav]').forEach(b => {
      b.onclick = () => {
        const nav = JSON.parse(b.dataset.pickerNav);
        SLIDER_PICKER_STATE.level = nav.level;
        SLIDER_PICKER_STATE.group = nav.group ?? null;
        SLIDER_PICKER_STATE.category = nav.category ?? null;
        renderLevel();
      };
    });
    const backBtn = document.getElementById('slider-picker-back');
    if (backBtn) {
      backBtn.onclick = () => {
        if (SLIDER_PICKER_STATE.level === 'category') {
          SLIDER_PICKER_STATE.level = 'group';
          SLIDER_PICKER_STATE.category = null;
        } else if (SLIDER_PICKER_STATE.level === 'group') {
          SLIDER_PICKER_STATE.level = 'root';
          SLIDER_PICKER_STATE.group = null;
        }
        renderLevel();
      };
    }
    body.querySelectorAll('.picker-product-check').forEach(cb => {
      cb.onchange = () => {
        const id = cb.dataset.id;
        if (cb.checked) {
          if (SLIDER_PICKER_STATE.selected.length >= SLIDER_PICKER_LIMIT) {
            cb.checked = false;
            showToast(`Maximum ${SLIDER_PICKER_LIMIT} products.`, 'error');
            return;
          }
          if (!SLIDER_PICKER_STATE.selected.includes(id)) SLIDER_PICKER_STATE.selected.push(id);
        } else {
          SLIDER_PICKER_STATE.selected = SLIDER_PICKER_STATE.selected.filter(x => x !== id);
        }
        refresh();
        // Disable unchecked boxes when at cap
        const atCap = SLIDER_PICKER_STATE.selected.length >= SLIDER_PICKER_LIMIT;
        body.querySelectorAll('.picker-product-check').forEach(c => {
          if (!c.checked) c.disabled = atCap;
        });
      };
    });
  }

  refresh();
  await renderLevel();
}

function renderSliderPickerLoading() {
  return '<div style="display:flex;align-items:center;justify-content:center;padding:var(--space-8);color:var(--color-text-tertiary)"><span class="material-symbols-outlined" style="animation:spin 1s linear infinite">progress_activity</span></div>';
}

function renderSliderPickerBreadcrumb() {
  const s = SLIDER_PICKER_STATE;
  const crumbs = [{ label: 'Products', nav: { level: 'root' } }];
  if (s.level !== 'root' && s.group && s.group !== '__uncategorized') {
    crumbs.push({ label: s.group, nav: { level: 'group', group: s.group } });
  }
  if (s.level === 'category' && s.categoryName) {
    crumbs.push({ label: s.categoryName, nav: { level: 'category', group: s.group, category: s.category, categoryName: s.categoryName } });
  }
  const backDisabled = s.level === 'root';
  return `
    <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-4)">
      <button class="admin-btn admin-btn-ghost" id="slider-picker-back" ${backDisabled ? 'disabled' : ''} style="padding:4px 10px"><span class="material-symbols-outlined" style="font-size:18px">arrow_back</span> Back</button>
      <div style="display:flex;align-items:center;gap:var(--space-2);flex:1;flex-wrap:wrap">
        ${crumbs.map((c, i) => `
          <button class="admin-btn admin-btn-ghost" data-picker-nav='${JSON.stringify(c.nav)}' ${i === crumbs.length - 1 ? 'disabled' : ''} style="padding:4px 10px;text-transform:none">${escHtml(c.label)}</button>
          ${i < crumbs.length - 1 ? '<span class="material-symbols-outlined" style="font-size:18px;color:var(--color-text-tertiary)">chevron_right</span>' : ''}
        `).join('')}
      </div>
    </div>`;
}

async function renderSliderPickerFolders() {
  // Build group folders
  const groupsHtml = Object.keys(CATEGORY_GROUPS).map(groupName => `
    <button class="admin-card" data-picker-nav='${JSON.stringify({ level: 'group', group: groupName })}' style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4);cursor:pointer;border:1px solid var(--color-border-light);text-align:left">
      <span class="material-symbols-outlined" style="color:var(--color-accent);font-size:28px">folder</span>
      <div>
        <strong>${escHtml(groupName)}</strong>
        <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">${(CATEGORY_GROUPS[groupName] || []).length} categories</div>
      </div>
    </button>
  `).join('');
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-3)">${groupsHtml}</div>`;
}

async function renderSliderPickerCategories() {
  const group = SLIDER_PICKER_STATE.group;
  let cats = [];
  if (group === '__uncategorized') {
    const { data: allCats } = await supabase.from('categories').select('id, name, slug').order('name');
    const allGroupedSlugs = new Set(Object.values(CATEGORY_GROUPS).flat());
    cats = (allCats || []).filter(c => !allGroupedSlugs.has(c.slug));
  } else {
    const slugs = CATEGORY_GROUPS[group] || [];
    if (slugs.length === 0) return '<div class="empty-state"><span class="material-symbols-outlined">folder_off</span><p>No categories in this group.</p></div>';
    const { data: allCats } = await supabase.from('categories').select('id, name, slug').in('slug', slugs).order('name');
    cats = (allCats || []).filter(c => slugs.includes(c.slug));
  }
  if (cats.length === 0) return '<div class="empty-state"><span class="material-symbols-outlined">folder_off</span><p>No categories in this group.</p></div>';
  return `<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:var(--space-3)">${
    cats.map(c => `
      <button class="admin-card" data-picker-nav='${JSON.stringify({ level: 'category', group: SLIDER_PICKER_STATE.group, category: c.id, categoryName: c.name })}' style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4);cursor:pointer;border:1px solid var(--color-border-light);text-align:left">
        <span class="material-symbols-outlined" style="color:var(--color-accent);font-size:28px">folder</span>
        <div>
          <strong>${escHtml(c.name)}</strong>
          <div style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">category</div>
        </div>
      </button>
    `).join('')
  }</div>`;
}

async function renderSliderPickerProducts() {
  const categoryId = SLIDER_PICKER_STATE.category;
  if (!categoryId) return '<div class="empty-state"><span class="material-symbols-outlined">folder_off</span><p>Pick a category first.</p></div>';

  // Use product_categories junction so products in MULTIPLE categories show up everywhere
  const { data: pcRows } = await supabase.from('product_categories').select('product_id').eq('category_id', categoryId);
  const productIds = (pcRows || []).map(r => r.product_id);
  if (productIds.length === 0) return '<div class="empty-state"><span class="material-symbols-outlined">inventory_2</span><p>No products in this category.</p></div>';

  const CHUNK = 50;
  const chunks = [];
  for (let i = 0; i < productIds.length; i += CHUNK) chunks.push(productIds.slice(i, i + CHUNK));
  const fetched = await Promise.all(
    chunks.map(ids => supabase.from('products').select('id, name, slug, images, price, active').in('id', ids).order('name'))
  );
  const products = (fetched || []).flatMap(f => f.data || []);
  if (products.length === 0) return '<div class="empty-state"><span class="material-symbols-outlined">inventory_2</span><p>No products in this category.</p></div>';

  const atCap = SLIDER_PICKER_STATE.selected.length >= SLIDER_PICKER_LIMIT;
  return `<div style="display:flex;flex-direction:column;gap:var(--space-1)">${
    products.map(p => {
      const isSelected = SLIDER_PICKER_STATE.selected.includes(p.id);
      const img = (p.images && p.images[0]) || '/images/placeholder.jpg';
      const disabled = !isSelected && atCap;
      return `
        <label style="display:flex;align-items:center;gap:var(--space-3);padding:var(--space-2) var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-md);cursor:${disabled ? 'not-allowed' : 'pointer'};${isSelected ? 'background:var(--color-surface-alt);' : ''}${disabled ? 'opacity:0.5;' : ''}">
          <input type="checkbox" class="picker-product-check" data-id="${p.id}" ${isSelected ? 'checked' : ''} ${disabled ? 'disabled' : ''} style="cursor:inherit">
          <img src="${img}" alt="" style="width:42px;height:42px;object-fit:cover;border-radius:4px;flex-shrink:0">
          <div style="flex:1;min-width:0">
            <strong style="display:block;font-size:var(--fs-sm)">${escHtml(p.name)}</strong>
            <span style="font-size:var(--fs-xs);color:var(--color-text-tertiary)">${escHtml(p.slug || '')} · ₹${Number(p.price || 0).toLocaleString()}</span>
          </div>
        </label>`;
    }).join('')
  }</div>`;
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

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
          <input type="file" name="image_file" accept="image/jpeg,image/png,image/webp">
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
  // Close handlers — robust against nested editors
  overlay.addEventListener('mousedown', (e) => {
    if (e.target === overlay) {
      e.preventDefault();
      closeModal();
    }
  });
  overlay.querySelector('.admin-modal').addEventListener('mousedown', (e) => e.stopPropagation());
  overlay.querySelector('.admin-modal-close').addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });
  overlay.querySelector('.modal-cancel')?.addEventListener('mousedown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    closeModal();
  });

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

// ===== FOOTER SECTION =====
async function renderFooterSection(container) {
  const { data: rows } = await supabase.from('site_settings').select('*');
  const get = (key, fallback = '') => rows?.find(r => r.key === key)?.value || fallback;
  const { data: footerRows } = await supabase.from('footer_sections').select('*');
  const footerSections = Object.fromEntries((footerRows || []).map(s => [s.section_key, s]));

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Footer</h1>
        <span class="admin-header-stats">Brand info, contact, social links</span>
      </div>
    </div>

    <div class="admin-card" style="padding:var(--space-6)">
      <form id="footer-form" style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-6)">
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold)">Brand</h2>
          <div class="form-group"><label>Tagline</label><textarea name="tagline" rows="2">${get('footer_tagline') || get('tagline')}</textarea></div>
          <div class="form-group"><label>Copyright Text</label><input name="copyright" value="${get('footer_copyright')}"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold)">Contact</h2>
          <div class="form-group"><label>Address</label><textarea name="address" rows="2">${get('contact_address')}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Phone 1</label><input name="phone" value="${get('contact_phone')}"></div>
            <div class="form-group"><label>Phone 2</label><input name="phone2" value="${get('contact_phone2')}"></div>
          </div>
          <div class="form-group"><label>Email</label><input name="email" value="${get('contact_email')}" type="email"></input></div>
           <div class="form-group"><label>Business Hours</label><input name="hours" value="${get('footer_hours')}"></div>
         </div>
        <div class="form-group">
          <label>About Left Paragraph</label>
          <textarea name="footer_about_left" style="min-height:120px">${footerSections?.about_left?.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Exporter Right Paragraph</label>
          <textarea name="footer_exporter_right" style="min-height:120px">${footerSections?.exporter_right?.content || ''}</textarea>
        </div>
        <div class="form-group">
          <label>Services / Products List</label>
          <textarea name="footer_services_list" style="min-height:120px">${footerSections?.services_list?.content || ''}</textarea>
        </div>
         <div style="display:flex;flex-direction:column;gap:var(--space-4)">
           <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold)">Social Links</h2>
          <div class="form-group"><label>Facebook URL</label><input name="facebook_url" value="${get('facebook_url')}" placeholder="https://facebook.com/..."></div>
          <div class="form-group"><label>Instagram URL</label><input name="instagram_url" value="${get('instagram_url')}" placeholder="https://instagram.com/..."></div>
          <div class="form-group"><label>Twitter/X URL</label><input name="twitter_url" value="${get('twitter_url')}" placeholder="https://twitter.com/..."></div>
          <div class="form-group"><label>YouTube URL</label><input name="youtube_url" value="${get('youtube_url')}" placeholder="https://youtube.com/..."></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold)">Images & Other</h2>
          <div class="form-group"><label>Payment Icons URL</label><input name="payment_icons_url" value="${get('payment_icons_url')}" placeholder="/images/payment-icons-transparent.png"></div>
          <div class="form-group"><label>Map Embed URL</label><input name="map_embed_url" value="${get('map_embed_url')}" placeholder="Google Maps embed URL"></div>
        </div>
        <div style="grid-column:1/-1;display:flex;justify-content:flex-end;padding-top:var(--space-4);border-top:1px solid var(--color-border)">
          <button type="submit" class="admin-btn admin-btn-primary">Save Footer</button>
        </div>
      </form>
    </div>
  `;

  document.getElementById('footer-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const keyMap = {
      tagline: 'footer_tagline',
      copyright: 'footer_copyright',
      address: 'contact_address',
      phone: 'contact_phone',
      phone2: 'contact_phone2',
      email: 'contact_email',
      hours: 'footer_hours',
      facebook_url: 'facebook_url',
      instagram_url: 'instagram_url',
      twitter_url: 'twitter_url',
      youtube_url: 'youtube_url',
      payment_icons_url: 'payment_icons_url',
      map_embed_url: 'map_embed_url'
    };
    for (const [formKey, dbKey] of Object.entries(keyMap)) {
      const existing = rows?.find(r => r.key === dbKey);
      const value = fd.get(formKey) || '';
      if (existing) {
        const { error } = await supabase.from('site_settings').update({ value }).eq('id', existing.id);
        if (error) {
          showToast(`Failed to save ${formKey}: ${error.message}`, 'error');
          return;
        }
      } else {
        const { error } = await supabase.from('site_settings').insert({ key: dbKey, value });
        if (error) {
          showToast(`Failed to save ${formKey}: ${error.message}`, 'error');
          return;
        }
      }
    }
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
    bustContentCache();
    showToast('Footer saved!');
    renderFooterSection(container);
  };
}
