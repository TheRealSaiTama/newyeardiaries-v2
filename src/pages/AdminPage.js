import { supabase } from '../lib/supabase.js';
import { navigateTo } from '../router.js';

let currentTab = 'products';
const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASSWORD || 'nyd2026';

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
    .admin-table .col-actions { width: 100px; }
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
    .form-group textarea { resize: vertical; min-height: 80px; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-4); }
    .form-group.checkbox { flex-direction: row; align-items: center; gap: var(--space-3); }
    .form-group.checkbox input { width: 18px; height: 18px; accent-color: var(--color-primary); }
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  document.getElementById('confirm-yes').onclick = () => { closeModal(); onConfirm(); };
}

// ===== PRODUCTS =====
const PRODUCTS_PER_PAGE = 20;

async function renderProducts(container, page = 1, search = '', filterCategory = '', filterActive = '') {
  let query = supabase
    .from('products')
    .select('*, category:categories(name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%,sku.ilike.%${search}%`);
  }
  if (filterCategory) {
    query = query.eq('category_id', filterCategory);
  }
  if (filterActive !== '') {
    query = query.eq('active', filterActive === 'true');
  }

  const from = (page - 1) * PRODUCTS_PER_PAGE;
  const to = from + PRODUCTS_PER_PAGE - 1;
  query = query.range(from, to);

  const { data: products, error, count } = await query;

  const { data: categories } = await supabase.from('categories').select('id, name').order('name');
  const totalPages = Math.ceil((count || 0) / PRODUCTS_PER_PAGE);

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Products</h1>
        <span class="admin-header-stats">${count || 0} items${totalPages > 1 ? ` — Page ${page} of ${totalPages}` : ''}</span>
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:center;flex-wrap:wrap;justify-content:flex-end">
        <div class="admin-search-wrap">
          <span class="material-symbols-outlined">search</span>
          <input type="text" class="admin-search" id="product-search" placeholder="Search by name, slug, SKU..." value="${search}">
        </div>
        <select class="admin-filter-select" id="filter-category" style="min-width:140px">
          <option value="">All Categories</option>
          ${categories.map(c => `<option value="${c.id}" ${filterCategory === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
        <select class="admin-filter-select" id="filter-active">
          <option value="" ${filterActive === '' ? 'selected' : ''}>All Status</option>
          <option value="true" ${filterActive === 'true' ? 'selected' : ''}>Active</option>
          <option value="false" ${filterActive === 'false' ? 'selected' : ''}>Inactive</option>
        </select>
        <button class="admin-btn admin-btn-primary" id="add-product-btn">
          <span class="material-symbols-outlined">add</span> Add Product
        </button>
      </div>
    </div>
    <div class="admin-card">
      ${(products?.length && !error) ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr>
          <th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th style="text-align:right">Actions</th>
        </tr></thead>
        <tbody id="products-tbody">
          ${products.map(p => `
            <tr class="product-row" data-id="${p.id}">
              <td class="col-image">${p.images?.[0] ? `<img src="${p.images[0]}" alt="${p.name}" data-src="${p.images[0]}">` : '<div style="width:64px;height:64px;background:var(--color-surface-alt);border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;border:1px solid var(--color-border-light)"><span class="material-symbols-outlined" style="font-size:24px;color:var(--color-text-tertiary)">image</span></div>'}</td>
              <td class="col-name"><strong>${p.name}</strong><span>${p.slug}</span></td>
              <td>${p.category?.name || '—'}</td>
              <td><strong>₹${Number(p.price).toLocaleString()}</strong>${p.original_price && p.original_price > p.price ? `<br><s style="color:var(--color-text-tertiary);font-size:var(--fs-xs)">₹${Number(p.original_price).toLocaleString()}</s>` : ''}</td>
              <td>${p.in_stock ? `<span style="color:var(--color-success);font-weight:var(--fw-medium)">In Stock</span>` : '<span style="color:var(--color-error)">Out of stock</span>'}</td>
              <td><span class="badge ${p.active ? 'badge-active' : 'badge-inactive'}">${p.active ? 'Active' : 'Inactive'}</span></td>
              <td class="col-actions">
                <button class="edit-btn" title="Edit"><span class="material-symbols-outlined">edit</span></button>
                <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><span class="material-symbols-outlined">inventory_2</span><p>${error ? 'Error loading products' : 'No products found'}</p></div>`}
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

  // Search with debounce — use mutable variable to avoid stale closure
  let searchTimeout;
  let searchTerm = search;
  document.getElementById('product-search')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderProducts(container, 1, searchTerm, document.getElementById('filter-category')?.value || '', document.getElementById('filter-active')?.value || '');
    }, 350);
  });

  document.getElementById('filter-category')?.addEventListener('change', (e) => {
    renderProducts(container, 1, document.getElementById('product-search')?.value || '', e.target.value, document.getElementById('filter-active')?.value || '');
  });

  document.getElementById('filter-active')?.addEventListener('change', (e) => {
    renderProducts(container, 1, document.getElementById('product-search')?.value || '', document.getElementById('filter-category')?.value || '', e.target.value);
  });

  document.getElementById('add-product-btn').onclick = () => openProductModal(container);

  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      const product = products.find(p => p.id === id);
      openProductModal(container, product);
    };
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this product? This action cannot be undone.', async () => {
        await supabase.from('products').delete().eq('id', id);
        showToast('Product deleted!');
        await renderProducts(container);
      });
    };
  });

  // Pagination buttons
  document.getElementById('page-prev')?.addEventListener('click', () => {
    renderProducts(container, page - 1, search, filterCategory, filterActive);
  });
  document.getElementById('page-next')?.addEventListener('click', () => {
    renderProducts(container, page + 1, search, filterCategory, filterActive);
  });
  document.querySelectorAll('.admin-pagination button[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      renderProducts(container, parseInt(btn.dataset.page), search, filterCategory, filterActive);
    });
  });
}

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function openProductModal(container, product = null) {
  const { data: categories } = await supabase.from('categories').select('id, name').order('name');
  const isEdit = !!product;

  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
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
          <div class="form-group"><label>Category</label>
            <select name="category_id">
              <option value="">— None —</option>
              ${categories.map(c => `<option value="${c.id}" ${product?.category_id === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group"><label>Price *</label><input name="price" type="number" step="0.01" value="${product?.price || ''}" required></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Original Price</label><input name="original_price" type="number" step="0.01" value="${product?.original_price || ''}"></div>
          <div class="form-group"><label>SKU</label><input name="sku" value="${product?.sku || ''}"></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label>Badge (e.g. "New", "Bestseller")</label><input name="badge" value="${product?.badge || ''}"></div>
          <div class="form-group"><label>Min Bulk Order</label><input name="min_bulk_order" type="number" value="${product?.min_bulk_order || 1}" min="1"></div>
        </div>
        <div class="form-group"><label>Short Description</label><textarea name="short_description">${product?.short_description || ''}</textarea></div>
        <div class="form-group"><label>Description</label><textarea name="description">${product?.description || ''}</textarea></div>
        <div class="form-group"><label>Images <small style="color:var(--color-text-tertiary)">(comma-separated URLs)</small></label><textarea name="images" placeholder="https://example.com/img1.jpg, https://example.com/img2.jpg" style="min-height:60px">${product?.images?.join(', ') || ''}</textarea></div>
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

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
    const fd = new FormData(e.target);
    let slug = fd.get('slug') || generateSlug(fd.get('name'));
    const payload = {
      name: fd.get('name'),
      slug: slug,
      category_id: fd.get('category_id') || null,
      price: Number(fd.get('price')),
      original_price: fd.get('original_price') ? Number(fd.get('original_price')) : null,
      sku: fd.get('sku') || null,
      badge: fd.get('badge') || null,
      short_description: fd.get('short_description') || null,
      description: fd.get('description') || null,
      images: fd.get('images') ? fd.get('images').split(',').map(s => s.trim()).filter(Boolean) : [],
      min_bulk_order: Number(fd.get('min_bulk_order')) || 1,
      in_stock: fd.get('in_stock') === 'on',
      active: fd.get('active') === 'on',
      sort_order: Number(fd.get('sort_order')) || 0,
    };
    if (isEdit) {
      await supabase.from('products').update(payload).eq('id', product.id);
    } else {
      await supabase.from('products').insert(payload);
    }
    closeModal();
    showToast(isEdit ? 'Product updated!' : 'Product added!');
    await renderProducts(container);
  };
}

// ===== CATEGORIES =====
async function renderCategories(container) {
  const { data: categories } = await supabase.from('categories').select('*').order('sort_order');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Categories</h1>
        <span class="admin-header-stats">${categories?.length || 0} items</span>
      </div>
      <div style="display:flex;gap:var(--space-3);align-items:center;flex:1;justify-content:flex-end">
        <div class="admin-search-wrap">
          <span class="material-symbols-outlined">search</span>
          <input type="text" class="admin-search" id="cat-search" placeholder="Search categories...">
        </div>
        <button class="admin-btn admin-btn-primary" id="add-cat-btn">
          <span class="material-symbols-outlined">add</span> Add Category
        </button>
      </div>
    </div>
    <div class="admin-card">
      ${categories?.length ? `<div class="admin-table-wrap"><table class="admin-table">
        <thead><tr><th>Name</th><th>Slug</th><th>Sort Order</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
        <tbody id="cats-tbody">
          ${categories.map(c => `<tr class="cat-row" data-id="${c.id}">
            <td class="col-name"><strong>${c.name}</strong><span>${c.slug}</span></td>
            <td><span style="color:var(--color-text-tertiary)">${c.slug}</span></td>
            <td>${c.sort_order || 0}</td>
            <td><span class="badge ${c.active ? 'badge-active' : 'badge-inactive'}">${c.active ? 'Active' : 'Inactive'}</span></td>
            <td class="col-actions">
              <button class="edit-btn"><span class="material-symbols-outlined">edit</span></button>
              <button class="delete delete-btn"><span class="material-symbols-outlined">delete</span></button>
            </td>
          </tr>`).join('')}
        </tbody>
      </table></div>` : `<div class="empty-state"><span class="material-symbols-outlined">category</span><p>No categories found</p></div>`}
    </div>
  `;

  document.getElementById('cat-search')?.addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.cat-row').forEach(row => {
      const name = row.querySelector('.col-name strong')?.textContent.toLowerCase() || '';
      row.style.display = name.includes(q) ? '' : 'none';
    });
  });

  document.getElementById('add-cat-btn').onclick = () => openCategoryModal(container);
  document.querySelectorAll('.edit-btn').forEach(btn => {
    btn.onclick = () => { const id = btn.closest('tr').dataset.id; openCategoryModal(container, categories.find(c => c.id === id)); };
  });
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.onclick = () => {
      const id = btn.closest('tr').dataset.id;
      showConfirmDialog('Delete this category?', async () => {
        await supabase.from('categories').delete().eq('id', id);
        showToast('Category deleted!');
        await renderCategories(container);
      });
    };
  });
}

function openCategoryModal(container, category = null) {
  const isEdit = !!category;
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Category</h2><button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button></div>
      <form class="admin-form" id="cat-form">
        <div class="form-row">
          <div class="form-group"><label>Name *</label><input name="name" value="${category?.name || ''}" required></div>
          <div class="form-group"><label>Slug *</label><input name="slug" value="${category?.slug || ''}" required></div>
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  document.getElementById('cat-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { name: fd.get('name'), slug: fd.get('slug'), icon: fd.get('icon') || null, description: fd.get('description') || null, image_url: fd.get('image_url') || null, active: fd.get('active') === 'on', sort_order: Number(fd.get('sort_order')) || 0 };
    if (isEdit) { await supabase.from('categories').update(payload).eq('id', category.id); }
    else { await supabase.from('categories').insert(payload); }
    closeModal();
    showToast(isEdit ? 'Category updated!' : 'Category added!');
    await renderCategories(container);
  };
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
  const overlay = document.createElement('div');
  overlay.className = 'admin-modal-overlay';
  overlay.id = 'modal-overlay';
  overlay.innerHTML = `
    <div class="admin-modal">
      <div class="admin-modal-header"><h2>${isEdit ? 'Edit' : 'Add'} Banner</h2><button class="admin-modal-close"><span class="material-symbols-outlined">close</span></button></div>
      <form class="admin-form" id="banner-form">
        <div class="form-group"><label>Title *</label><input name="title" value="${banner?.title || ''}" required></div>
        <div class="form-group"><label>Subtitle</label><input name="subtitle" value="${banner?.subtitle || ''}"></div>
        <div class="form-row">
          <div class="form-group"><label>CTA Text</label><input name="cta_text" value="${banner?.cta_text || ''}"></div>
          <div class="form-group"><label>CTA Link</label><input name="cta_link" value="${banner?.cta_link || ''}"></div>
        </div>
        <div class="form-group"><label>Image URL *</label><input name="image_url" value="${banner?.image_url || ''}" required placeholder="https://..."></div>
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };

  document.getElementById('banner-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = {
      title: fd.get('title'),
      subtitle: fd.get('subtitle') || null,
      cta_text: fd.get('cta_text') || null,
      cta_link: fd.get('cta_link') || null,
      image_url: fd.get('image_url'),
      active: fd.get('active') === 'on',
      order_index: Number(fd.get('order_index')) || 0,
    };
    if (isEdit) { await supabase.from('banners').update(payload).eq('id', banner.id); }
    else { await supabase.from('banners').insert(payload); }
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
      { key: 'contact_email', value: fd.get('contact_email') },
      { key: 'contact_phone', value: fd.get('contact_phone') },
      { key: 'contact_address', value: fd.get('contact_address') },
    ];
    for (const field of fields) {
      const existing = settings?.find(s => s.key === field.key);
      if (existing) {
        await supabase.from('site_settings').update({ value: field.value }).eq('id', existing.id);
      } else {
        await supabase.from('site_settings').insert({ key: field.key, value: field.value });
      }
    }
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
  const { data: quotes, count: quoteCount } = await supabase
    .from('quote_requests')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false });

  const renderContactTable = () => (contacts?.length ? `
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Message</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${contacts.map(c => `<tr data-id="${c.id}">
          <td>${c.name}</td>
          <td><a href="mailto:${c.email}">${c.email}</a></td>
          <td>${c.phone || '—'}</td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${c.message}">${c.message}</td>
          <td>${new Date(c.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${c.reviewed ? 'badge-reviewed' : 'badge-new'}">${c.reviewed ? 'Reviewed' : 'New'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
            <button class="review-btn" title="${c.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}"><span class="material-symbols-outlined">${c.reviewed ? 'undo' : 'check'}</span></button>
            <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No contact submissions</p></div>');

  const renderEnquiryTable = () => (enquiries?.length ? `
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Products</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${enquiries.map(e => `<tr data-id="${e.id}">
          <td>${e.name}</td>
          <td><a href="mailto:${e.email}">${e.email}</a></td>
          <td>${e.company || '—'}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${e.product_names || e.products || '—'}</td>
          <td>${new Date(e.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${e.reviewed ? 'badge-reviewed' : 'badge-new'}">${e.reviewed ? 'Reviewed' : 'New'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
            <button class="review-btn" title="${e.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}"><span class="material-symbols-outlined">${e.reviewed ? 'undo' : 'check'}</span></button>
            <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No bulk enquiries</p></div>');

  const renderQuoteTable = () => (quotes?.length ? `
    <table class="admin-table">
      <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Product</th><th>Quantity</th><th>Date</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
      <tbody>
        ${quotes.map(q => `<tr data-id="${q.id}">
          <td>${q.name}</td>
          <td><a href="mailto:${q.email}">${q.email}</a></td>
          <td>${q.phone || '—'}</td>
          <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${q.product_name || q.product_id || '—'}</td>
          <td>${q.quantity || '—'}</td>
          <td>${new Date(q.created_at).toLocaleDateString()}</td>
          <td><span class="badge ${q.reviewed ? 'badge-reviewed' : 'badge-new'}">${q.reviewed ? 'Reviewed' : 'New'}</span></td>
          <td class="col-actions">
            <button class="view-btn" title="View"><span class="material-symbols-outlined">visibility</span></button>
            <button class="review-btn" title="${q.reviewed ? 'Mark unreviewed' : 'Mark reviewed'}"><span class="material-symbols-outlined">${q.reviewed ? 'undo' : 'check'}</span></button>
            <button class="delete delete-btn" title="Delete"><span class="material-symbols-outlined">delete</span></button>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>` : '<div class="empty-state"><p>No quote requests</p></div>');

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
      <div class="admin-card" style="padding:var(--space-6);cursor:pointer" id="stat-quotes">
        <div style="font-size:var(--fs-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:var(--ls-wider);margin-bottom:var(--space-2)">Quote Requests</div>
        <div style="font-size:var(--fs-3xl);font-weight:var(--fw-bold)">${quoteCount || quotes?.length || 0}</div>
      </div>
    </div>

    <div class="enquiry-tabs">
      <button class="enquiry-tab ${tab === 'contact' ? 'active' : ''}" data-etab="contact">
        Contact Messages <span class="count-badge">${contactCount || contacts?.length || 0}</span>
      </button>
      <button class="enquiry-tab ${tab === 'enquiry' ? 'active' : ''}" data-etab="enquiry">
        Bulk Enquiries <span class="count-badge">${enquiryCount || enquiries?.length || 0}</span>
      </button>
      <button class="enquiry-tab ${tab === 'quote' ? 'active' : ''}" data-etab="quote">
        Quote Requests <span class="count-badge">${quoteCount || quotes?.length || 0}</span>
      </button>
    </div>

    <div class="admin-card">
      ${tab === 'contact' ? renderContactTable() : tab === 'enquiry' ? renderEnquiryTable() : renderQuoteTable()}
    </div>
  `;

  // Stat card navigation
  document.getElementById('stat-contacts')?.addEventListener('click', () => renderEnquiries(container, 'contact'));
  document.getElementById('stat-enquiries')?.addEventListener('click', () => renderEnquiries(container, 'enquiry'));
  document.getElementById('stat-quotes')?.addEventListener('click', () => renderEnquiries(container, 'quote'));

  // Tab switching
  document.querySelectorAll('.enquiry-tab').forEach(btn => {
    btn.addEventListener('click', () => renderEnquiries(container, btn.dataset.etab));
  });

  // Action handlers
  const currentData = tab === 'contact' ? contacts : tab === 'enquiry' ? enquiries : quotes;
  const tableName = tab === 'contact' ? 'contact_submissions' : tab === 'enquiry' ? 'enquiries' : 'quote_requests';

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
      await supabase.from(tableName).update({ reviewed: !item.reviewed }).eq('id', id);
      showToast(item.reviewed ? 'Marked as new!' : 'Marked as reviewed!');
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
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Phone', value: item.phone || '—' },
        { label: 'Message', value: item.message },
        { label: 'Submitted', value: new Date(item.created_at).toLocaleString() },
      ]
    : type === 'enquiry'
    ? [
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Company', value: item.company || '—' },
        { label: 'Products', value: item.product_names || item.products || '—' },
        { label: 'Message', value: item.message || '—' },
        { label: 'Submitted', value: new Date(item.created_at).toLocaleString() },
      ]
    : [
        { label: 'Name', value: item.name },
        { label: 'Email', value: item.email },
        { label: 'Phone', value: item.phone || '—' },
        { label: 'Product', value: item.product_name || item.product_id || '—' },
        { label: 'Quantity', value: item.quantity || '—' },
        { label: 'Message', value: item.message || '—' },
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
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
      await supabase.from('site_content').upsert(row, { onConflict: 'section,key' });
    }
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
  overlay.querySelector('.admin-modal-close').onclick = closeModal;
  overlay.querySelector('.modal-cancel').onclick = closeModal;
  overlay.onclick = (e) => { if (e.target === overlay) closeModal(); };
  document.getElementById('ann-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { text: fd.get('text'), link: fd.get('link') || null, sort_order: Number(fd.get('sort_order')) || 0, active: fd.get('active') === 'on' };
    if (isEdit) { await supabase.from('announcements').update(payload).eq('id', ann.id); }
    else { await supabase.from('announcements').insert(payload); }
    closeModal();
    showToast(isEdit ? 'Announcement updated!' : 'Announcement added!');
    renderHeaderSection(document.getElementById('admin-content'));
  };
}

// ===== HOMEPAGE SECTION =====
async function renderHomepageSection(container) {
  const { data: hero } = await supabase.from('homepage_sections').select('*').eq('section_key', 'hero').single();
  const { data: cta } = await supabase.from('homepage_sections').select('*').eq('section_key', 'cta').single();
  const { data: shopCats } = await supabase.from('categories').select('*').order('sort_order');

  container.innerHTML = `
    <div class="admin-header">
      <div class="admin-header-left">
        <h1>Homepage</h1>
        <span class="admin-header-stats">Hero, CTA & Shop by Category</span>
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

    <div class="admin-card">
      <div class="admin-modal-header" style="padding:var(--space-4) var(--space-6)">
        <h2 style="font-size:var(--fs-lg)">🗂️ Shop by Category — displayed from Categories tab</h2>
        <p style="font-size:var(--fs-sm);color:var(--color-text-tertiary);margin:0">Manage categories in the Categories tab. Homepage auto-displays all active categories.</p>
      </div>
    </div>
  `;

  document.getElementById('hero-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('homepage_sections').upsert({ section_key: 'hero', title: fd.get('title'), subtitle: fd.get('subtitle'), cta_text: fd.get('cta_text'), cta_link: fd.get('cta_link'), second_cta_text: fd.get('second_cta_text'), second_cta_link: fd.get('second_cta_link') }, { onConflict: 'section_key' });
    showToast('Hero saved!');
  };
  document.getElementById('cta-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await supabase.from('homepage_sections').upsert({ section_key: 'cta', title: fd.get('title'), subtitle: fd.get('subtitle'), cta_text: fd.get('cta_text'), cta_link: fd.get('cta_link') }, { onConflict: 'section_key' });
    showToast('CTA saved!');
  };
}

// ===== FOOTER SECTION =====
async function renderFooterSection(container) {
  const { data: rows } = await supabase.from('site_content').select('*').eq('section', 'footer');
  const get = (key, fallback = '') => rows?.find(r => r.key === key)?.value || fallback;

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
          <div class="form-group"><label>Tagline</label><textarea name="tagline" rows="2">${get('tagline')}</textarea></div>
          <div class="form-group"><label>Copyright Text</label><input name="copyright" value="${get('copyright')}"></div>
        </div>
        <div style="display:flex;flex-direction:column;gap:var(--space-4)">
          <h2 style="font-size:var(--fs-lg);font-weight:var(--fw-bold)">Contact</h2>
          <div class="form-group"><label>Address</label><textarea name="address" rows="2">${get('address')}</textarea></div>
          <div class="form-row">
            <div class="form-group"><label>Phone 1</label><input name="phone" value="${get('phone')}"></div>
            <div class="form-group"><label>Phone 2</label><input name="phone2" value="${get('phone2')}"></div>
          </div>
          <div class="form-group"><label>Email</label><input name="email" value="${get('email')}" type="email"></input></div>
          <div class="form-group"><label>Business Hours</label><input name="hours" value="${get('hours')}"></div>
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
    const fields = ['tagline', 'copyright', 'address', 'phone', 'phone2', 'email', 'hours', 'facebook_url', 'instagram_url', 'twitter_url', 'youtube_url', 'payment_icons_url', 'map_embed_url'];
    for (const key of fields) {
      const existing = rows?.find(r => r.key === key);
      const value = fd.get(key);
      if (existing) {
        await supabase.from('site_content').update({ value }).eq('id', existing.id);
      } else {
        await supabase.from('site_content').insert({ key, value, section: 'footer' });
      }
    }
    showToast('Footer saved!');
    renderFooterSection(container);
  };
}
