// ===== History API Router — Clean URL SPA =====
const routes = [];
let currentCleanup = null;

export function addRoute(path, handler) {
  // Convert path params like :slug to regex groups
  const paramNames = [];
  const regexStr = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({
    path,
    regex: new RegExp(`^${regexStr}$`),
    paramNames,
    handler,
  });
}

export function navigateTo(path) {
  const url = new URL(path, window.location.origin);
  const fullPath = url.pathname + url.search;
  if (window.location.pathname + window.location.search === fullPath) return;
  window.history.pushState({}, '', fullPath);
  resolveRoute();
}

export function resolveRoute() {
  const path = window.location.pathname;
  
  // Cleanup previous page if needed
  if (currentCleanup && typeof currentCleanup === 'function') {
    currentCleanup();
    currentCleanup = null;
  }

  for (const route of routes) {
    const match = path.match(route.regex);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = match[i + 1];
      });
      const app = document.getElementById('app');
      if (app) {
        // Scroll to top on navigation
        window.scrollTo(0, 0);
        const result = route.handler(params);
        if (typeof result === 'function') {
          currentCleanup = result;
        }
      }
      return;
    }
  }

  // 404 fallback — show homepage
  const fallback = routes.find(r => r.path === '/');
  if (fallback) {
    fallback.handler({});
  }
}

export function initRouter() {
  // Handle browser back/forward
  window.addEventListener('popstate', resolveRoute);

  // Intercept all link clicks for SPA navigation
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    
    const href = link.getAttribute('href');
    
    // Skip external links, hash links, and special protocols
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || 
        href.startsWith('tel:') || href.startsWith('#') || link.target === '_blank') {
      return;
    }

    e.preventDefault();
    navigateTo(href);
  });

  // Resolve initial route
  resolveRoute();
}
