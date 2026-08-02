import { renderBreadcrumbs } from '../components/Breadcrumbs.js';

export function renderNotFoundPage(params, appContent) {
  document.getElementById('app').innerHTML = `
    <div class="page-content"><div class="container section" style="text-align:center;padding-top:var(--space-12);padding-bottom:var(--space-12);">${renderBreadcrumbs([{ label: 'Home', path: '/' }, { label: 'Page Not Found' }])}
        <h1 class="heading-1" style="font-size:clamp(4rem,12vw,8rem);margin:var(--space-6) 0;line-height:1;color:var(--color-primary);">404</h1><h2 class="heading-2" style="margin-bottom:var(--space-4);">This page wandered off</h2><p class="text-body" style="max-width:520px;margin:0 auto var(--space-8);color:var(--color-text-secondary);">The page you're looking for has been moved, deleted, or never existed.
          Try one of the links below to get back on track.
        </p><div style="display:flex;gap:var(--space-3);justify-content:center;flex-wrap:wrap;margin-bottom:var(--space-8);"><a href="/" class="btn btn--primary btn--lg">Go Home</a><a href="/shop" class="btn btn--secondary btn--lg">Browse Diaries</a><a href="/contact" class="btn btn--ghost btn--lg">Contact Us</a></div><p class="text-sm" style="color:var(--color-text-tertiary);">Looking for something specific? <a href="/bulk-quote" style="color:var(--color-primary);text-decoration:underline;">Request a custom order</a>.
        </p></div></div>`;
  // Set noindex meta so search engines don't index 404 pages.
  setMetaRobots('noindex, nofollow');
}

function setMetaRobots(value) {
  let el = document.querySelector('meta[name="robots"]');
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', 'robots');
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}
