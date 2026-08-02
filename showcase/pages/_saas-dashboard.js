/* _saas-dashboard.js — shell compartido para las páginas SaaS del showcase.
 *
 * Fuentes de verdad del producto actual:
 *   saas/templates/app_base.html
 *   saas/templates/page_base.html
 *   saas/apps/dashboard/core/templates/dashboard/partials/sidebar.html
 *   saas/static/css/dashboard-shell.css
 *
 * El chrome se compone con Ionic directo. El contenido de cada página decide si necesita
 * algún componente OutfitKit; los listados ricos usan ok-data-table.
 */

const NAV = [
  {
    label: 'Operaciones',
    items: [
      { path: '/dashboard/', label: 'Dashboard', icon: 'lucide:layout-dashboard', exact: true },
      { path: '/dashboard/billing/', label: 'Facturación', icon: 'lucide:file-text' },
      { path: '/dashboard/marketplace/', label: 'Marketplace', icon: 'lucide:store' },
      { path: '/dashboard/assistant/', label: 'Asistente', icon: 'lucide:sparkles' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { path: '/dashboard/organizations/', label: 'Organizaciones', icon: 'lucide:building-2' },
      { path: '/dashboard/users/', label: 'Usuarios', icon: 'lucide:users' },
      { path: '/dashboard/settings/', label: 'Ajustes', icon: 'lucide:settings' },
      { path: '/dashboard/help/', label: 'Ayuda y soporte', icon: 'lucide:life-buoy' },
    ],
  },
  {
    label: 'Cloud Hubs',
    items: [
      { path: '/dashboard/hubs/', label: 'Hubs', icon: 'lucide:server' },
    ],
  },
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalisePath(path) {
  const value = String(path || '/dashboard/');
  return value.endsWith('/') ? value : `${value}/`;
}

function ensureStylesheet(marker, href) {
  if (document.head.querySelector(`link[${marker}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute(marker, '');
  document.head.appendChild(link);
}

function ensureDashboardStyles() {
  ensureStylesheet(
    'data-outfitkit-erplora-theme',
    new URL('../../dist/erplora.css', import.meta.url).href,
  );
  ensureStylesheet(
    'data-outfitkit-saas-dashboard-shell',
    new URL('./_saas-dashboard.css', import.meta.url).href,
  );
}

function brandHtml() {
  return `
    <span class="erp-lockup sm brand-link" aria-label="ERPlora">
      <span class="erp-logo sm" aria-hidden="true">
        <i class="erp-nw"></i><i class="erp-n"></i><i class="erp-ne"></i>
        <i class="erp-w"></i><i class="erp-hub"></i><i class="erp-e"></i>
        <i class="erp-sw"></i><i class="erp-s"></i><i class="erp-se"></i>
      </span>
      <span class="erp-wordmark nav-label">ERPlora</span>
    </span>`;
}

function sidebarHtml(active) {
  const current = normalisePath(active);
  const sections = NAV.map((section) => {
    const items = section.items.map((item) => {
      const selected = item.exact ? current === item.path : current.startsWith(item.path);
      return `
        <ion-menu-toggle auto-hide="false">
          <ion-item button detail="false" class="nav-item"
                    data-route="${item.path}" ${selected ? 'aria-current="page"' : ''}>
            <iconify-icon slot="start" class="nav-icon" icon="${item.icon}"
                          width="20" height="20"></iconify-icon>
            <ion-label class="nav-label">${item.label}</ion-label>
          </ion-item>
        </ion-menu-toggle>`;
    }).join('');

    return `
      <ion-list-header class="nav-section-label">${section.label}</ion-list-header>
      ${items}`;
  }).join('');

  return `
    <ion-menu content-id="main" type="overlay" menu-id="main-menu" class="dash-menu">
      <ion-header class="ion-no-border">
        <ion-toolbar class="brand-toolbar">
          ${brandHtml()}
        </ion-toolbar>
      </ion-header>

      <ion-content class="sidebar-content">
        <ion-list lines="none" class="nav-list">${sections}</ion-list>
      </ion-content>

      <ion-footer class="ion-no-border sidebar-foot">
        <div class="sidebar-user">
          <ion-avatar class="sidebar-user-avatar" aria-hidden="true"><span>DP</span></ion-avatar>
          <div class="sidebar-user-meta nav-label">
            <div class="sidebar-user-name">Demo Partner</div>
            <div class="sidebar-user-email">demo@erplora.com</div>
          </div>
          <ion-button fill="clear" size="small" aria-label="Perfil">
            <iconify-icon slot="icon-only" icon="lucide:user" width="14" height="14"></iconify-icon>
          </ion-button>
        </div>
        <div class="sidebar-foot-actions nav-label">
          <ion-button fill="clear" size="small" aria-label="Cerrar sesión">
            <iconify-icon slot="icon-only" icon="lucide:log-out" width="14" height="14"></iconify-icon>
          </ion-button>
          <span class="sidebar-version">v3.4</span>
        </div>
      </ion-footer>
    </ion-menu>`;
}

function topbarHtml(title) {
  return `
    <ion-header class="dash-header ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button menu="main-menu" aria-label="Abrir navegación"></ion-menu-button>
          <ion-button class="rail-toggle" fill="clear" aria-label="Contraer menú">
            <iconify-icon slot="icon-only" icon="lucide:panel-left" width="18" height="18"></iconify-icon>
          </ion-button>
        </ion-buttons>

        <ion-title id="page-title">${escapeHtml(title)}</ion-title>

        <ion-buttons slot="end">
          <ion-button fill="clear" aria-label="Abrir asistente" title="Asistente">
            <iconify-icon slot="icon-only" icon="lucide:sparkles" width="18" height="18"></iconify-icon>
          </ion-button>
          <ion-button fill="clear" aria-label="Notificaciones" title="Notificaciones">
            <iconify-icon slot="icon-only" icon="lucide:bell" width="18" height="18"></iconify-icon>
          </ion-button>
          <ion-button id="saas-theme-toggle" fill="clear" aria-label="Cambiar tema" title="Cambiar tema">
            <iconify-icon slot="icon-only" icon="lucide:sun-moon" width="18" height="18"></iconify-icon>
          </ion-button>
          <ion-avatar class="topbar-avatar" aria-label="Perfil"><span>DP</span></ion-avatar>
        </ion-buttons>
      </ion-toolbar>
      <div class="dash-progress" hidden><div></div></div>
    </ion-header>`;
}

function wireShell() {
  const splitPane = document.querySelector('ion-split-pane.saas-dashboard-shell');
  const railToggle = document.querySelector('.rail-toggle');
  railToggle?.addEventListener('click', () => {
    const collapsed = splitPane?.classList.toggle('rail') ?? false;
    railToggle.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
  });

  document.querySelectorAll('[data-route]').forEach((item) => {
    item.addEventListener('click', () => {
      const route = item.getAttribute('data-route');
      if (route) window.location.hash = `#/p/${route}`;
    });
  });

  document.getElementById('saas-theme-toggle')?.addEventListener('click', () => {
    document.documentElement.classList.toggle('ion-palette-dark');
  });
}

/**
 * Monta una página estática con el shell persistente del dashboard SaaS.
 * `body` y `footer` son HTML de confianza perteneciente al propio showcase.
 */
export function defineSaasDashboardPage({
  active = '/dashboard/',
  title = '',
  body = '',
  footer = '',
  setup,
} = {}) {
  ensureDashboardStyles();

  document.body.innerHTML = `
    <ion-app>
      <ion-split-pane content-id="main" when="lg" class="saas-dashboard-shell">
        ${sidebarHtml(active)}

        <div id="main" class="dash-main">
          ${topbarHtml(title)}

          <ion-content class="dash-content">
            <div id="dashboard-page-content" class="dash-page">${body}</div>
          </ion-content>

          <ion-footer class="dash-tabbar ion-no-border" id="section-tabbar-host">
            ${footer}
          </ion-footer>
        </div>
      </ion-split-pane>
    </ion-app>`;

  wireShell();

  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      if (typeof setup === 'function') setup(document);
    } catch (error) {
      console.error('[SaaS dashboard page setup]', error);
    }
  }));
}
