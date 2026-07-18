/* _hub.js — shell estático compartido para las páginas del Hub en el showcase.
 *
 * Espeja la composición observable de:
 *   hub/apps/web/src/App.vue
 *   hub/apps/web/src/components/AppPage.vue
 *   hub/apps/web/src/components/AppTopbar.vue
 *
 * Ionic aporta todo el chrome. OutfitKit solo entra donde también lo hace el Hub real:
 * ok-app-launcher en la topbar. El cuerpo y el footer pertenecen a cada página.
 */

const NAV = [
  {
    label: 'General',
    items: [
      { path: '/dashboard', label: 'Inicio', icon: 'home-outline' },
      { path: '/employees', label: 'Empleados', icon: 'people-outline' },
      { path: '/files', label: 'Archivos', icon: 'folder-outline' },
    ],
  },
  {
    label: 'Cuenta',
    items: [
      { path: '/billing', label: 'Facturación', icon: 'card-outline' },
      { path: '/apps', label: 'Apps', icon: 'storefront-outline' },
      { path: '/system', label: 'Sistema', icon: 'hardware-chip-outline' },
      { path: '/api-docs', label: 'Documentación de la API', icon: 'code-slash-outline' },
      { path: '/settings', label: 'Ajustes', icon: 'settings-outline' },
    ],
  },
];

const ACTIVE_ALIASES = {
  home: '/dashboard',
  dashboard: '/dashboard',
  employees: '/employees',
  files: '/files',
  billing: '/billing',
  apps: '/apps',
  system: '/system',
  'api-docs': '/api-docs',
  settings: '/settings',
};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function activePath(active) {
  const raw = String(active ?? '').trim();
  if (!raw) return '/dashboard';
  if (raw.startsWith('/')) return raw;
  return ACTIVE_ALIASES[raw] ?? `/${raw}`;
}

function ensureStylesheet(marker, href) {
  if (document.head.querySelector(`link[${marker}]`)) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = href;
  link.setAttribute(marker, '');
  document.head.appendChild(link);
}

function ensureHubStyles() {
  ensureStylesheet(
    'data-outfitkit-erplora-theme',
    new URL('../../dist/erplora.css', import.meta.url).href,
  );
  ensureStylesheet(
    'data-outfitkit-hub-shell',
    new URL('./_hub.css', import.meta.url).href,
  );
}

function sidebarHtml(active) {
  const current = activePath(active);
  const sections = NAV.map((section) => {
    const items = section.items
      // En el Hub real la entrada de API solo existe con el toggle activo. Para que su propia
      // demo sea navegable la mostramos únicamente cuando esa página es la seleccionada.
      .filter((item) => item.path !== '/api-docs' || current === '/api-docs')
      .map((item) => {
        const selected = current === item.path || current.startsWith(`${item.path}/`);
        return `
          <ion-menu-toggle auto-hide="false">
            <ion-item
              button
              detail="false"
              class="nav-item${selected ? ' selected' : ''}"
              data-route="${item.path}"
              ${selected ? 'aria-current="page"' : ''}
            >
              <ion-icon slot="start" class="nav-icon" name="${item.icon}"></ion-icon>
              <ion-label class="nav-label">${item.label}</ion-label>
            </ion-item>
          </ion-menu-toggle>`;
      })
      .join('');
    return `
      <ion-list lines="none" class="nav-list">
        <ion-list-header class="nav-section-label">${section.label}</ion-list-header>
        ${items}
      </ion-list>`;
  }).join('');

  return `
    <ion-menu content-id="main" type="overlay" class="dash-menu">
      <ion-header class="ion-no-border">
        <ion-toolbar class="brand-toolbar">
          <button id="hub-sidebar-user-menu" class="sidebar-user" type="button">
            <span class="sidebar-user-avatar">D</span>
            <span class="sidebar-user-meta nav-label">
              <span class="sidebar-user-name">Demo</span>
              <span class="sidebar-user-email">demo@erplora.com</span>
            </span>
            <ion-icon class="sidebar-user-chevron nav-label" name="chevron-expand-outline"></ion-icon>
          </button>
          <ion-popover
            trigger="hub-sidebar-user-menu"
            trigger-action="click"
            dismiss-on-select="true"
            side="bottom"
            alignment="start"
            class="sidebar-user-popover"
          >
            <ion-content>
              <ion-list lines="none">
                <ion-item button detail="false" data-route="/settings">
                  <ion-icon slot="start" name="person-outline"></ion-icon>
                  <ion-label>Perfil</ion-label>
                </ion-item>
                <ion-item button detail="false">
                  <ion-icon slot="start" name="log-out-outline"></ion-icon>
                  <ion-label>Cerrar sesión</ion-label>
                </ion-item>
              </ion-list>
            </ion-content>
          </ion-popover>
        </ion-toolbar>
      </ion-header>

      <ion-content class="sidebar-content">
        ${sections}
      </ion-content>

      <ion-footer class="ion-no-border sidebar-foot">
        <div class="sidebar-foot-brand">
          <span class="erp-lockup sm brand-link" aria-label="ERPlora">
            <span class="erp-logo sm" aria-hidden="true">
              <i class="erp-nw"></i><i class="erp-n"></i><i class="erp-ne"></i>
              <i class="erp-w"></i><i class="erp-hub"></i><i class="erp-e"></i>
              <i class="erp-sw"></i><i class="erp-s"></i><i class="erp-se"></i>
            </span>
            <span class="erp-wordmark nav-label">erplora</span>
          </span>
          <span class="sidebar-foot-text nav-label">v0.0.0</span>
        </div>
      </ion-footer>
    </ion-menu>`;
}

function backButtonHtml(backHref) {
  if (!backHref) return '';
  return `
    <ion-button
      class="hub-back"
      fill="clear"
      aria-label="Volver"
      data-back-href="${escapeHtml(backHref)}"
    >
      <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon>
    </ion-button>`;
}

function topbarHtml(title, backHref) {
  return `
    <ion-header class="ion-no-border app-topbar">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button aria-label="Menú"></ion-menu-button>
          ${backButtonHtml(backHref)}
          <ion-button class="rail-toggle" fill="clear" aria-label="Contraer menú">
            <ion-icon slot="icon-only" name="reader-outline"></ion-icon>
          </ion-button>
        </ion-buttons>

        <ion-title>${escapeHtml(title)}</ion-title>

        <ion-buttons slot="end">
          <ok-app-launcher id="hub-app-launcher"></ok-app-launcher>

          <ion-button fill="clear" aria-label="Asistente" title="Asistente">
            <ion-icon slot="icon-only" name="sparkles-outline"></ion-icon>
          </ion-button>

          <ion-button
            id="hub-topbar-notifications"
            fill="clear"
            class="topbar-notif"
            aria-label="Notificaciones"
            title="Notificaciones"
          >
            <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
          </ion-button>
          <ion-popover trigger="hub-topbar-notifications" trigger-action="click">
            <ion-content>
              <ion-list lines="full">
                <ion-item lines="none">
                  <ion-label class="ion-text-wrap hub-muted">No hay notificaciones</ion-label>
                </ion-item>
              </ion-list>
            </ion-content>
          </ion-popover>
        </ion-buttons>
      </ion-toolbar>
      <div class="topbar-progress" hidden><div></div></div>
    </ion-header>`;
}

function wireShell(backHref) {
  const splitPane = document.querySelector('ion-split-pane.hub-shell');
  const railToggle = document.querySelector('.rail-toggle');
  railToggle?.addEventListener('click', () => {
    const collapsed = splitPane?.classList.toggle('rail') ?? false;
    railToggle.setAttribute('aria-label', collapsed ? 'Expandir menú' : 'Contraer menú');
  });

  const back = document.querySelector('.hub-back');
  back?.addEventListener('click', () => {
    if (window.history.state?.back) {
      window.history.back();
    } else if (backHref) {
      window.location.assign(backHref);
    }
  });

  const launcher = document.getElementById('hub-app-launcher');
  if (launcher) {
    launcher.apps = [
      {
        id: '/apps',
        label: 'Apps',
        icon: 'storefront-outline',
        color: 'var(--ion-color-primary)',
      },
    ];
    launcher.labels = { apps: 'Apps', empty: 'No hay aplicaciones', close: 'Cerrar' };
  }
}

/**
 * Monta una página estática con el mismo shell que el Hub.
 * `body` y `footer` son HTML de confianza perteneciente al propio showcase.
 */
export function defineHubPage({
  active = 'dashboard',
  title = '',
  backHref = '',
  body = '',
  footer = '',
  setup,
} = {}) {
  ensureHubStyles();

  document.body.innerHTML = `
    <ion-app>
      <ion-split-pane content-id="main" when="lg" class="hub-shell">
        ${sidebarHtml(active)}

        <div class="ion-page split-pane-main" id="main">
          ${topbarHtml(title, backHref)}

          <ion-content class="ion-padding hub-main-content">
            ${body}
          </ion-content>

          ${footer}
        </div>
      </ion-split-pane>
    </ion-app>`;

  wireShell(backHref);

  requestAnimationFrame(() => requestAnimationFrame(() => {
    try {
      if (typeof setup === 'function') setup(document);
    } catch (error) {
      console.error('[Hub page setup]', error);
    }
  }));
}
