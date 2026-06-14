/* _page.js — Shell Ionic compartido para las PÁGINAS DE EJEMPLO del showcase.
 *
 * Reproduce el app-shell del mock «ERPlora Cloud» de erplora.github.io/ux con
 * componentes Ionic NATIVOS (ion-split-pane + ion-menu de sidebar + ion-toolbar
 * de topbar + ion-content + ion-tab-bar móvil). Cada página standalone
 * (showcase/pages/<id>.html) llama a `definePage({...})` con el `body` de su vista
 * construido con ion-* + ok-*; este helper monta el chrome común alrededor.
 *
 * Reutilizar antes de crear: el chrome lo da Ionic; aquí solo lo componemos.
 * CSP-safe: cero handlers inline; el wiring va en el callback `setup(document)`.
 */

// ── i18n del ok-data-table (default del componente = inglés; el showcase es español) ──
// `.labels` es additivo: solo se pasan los textos visibles; el resto cae a su default.
const ES_DT_LABELS = {
  search: 'Buscar…', empty: 'Sin resultados', filters: 'Filtros', clear: 'Limpiar', apply: 'Aplicar',
  selected: '{n} seleccionados', importCsv: 'Importar CSV', exportCsv: 'Exportar CSV', add: 'Añadir',
  moreActions: 'Más acciones', rowsPerPage: 'Filas por página', perPageShort: '{n} / pág.',
  viewList: 'Ver como lista', viewCards: 'Ver como tarjetas', columnsVisible: 'Columnas visibles',
  columns: 'Columnas', actions: 'Acciones', close: 'Cerrar', newRecord: 'Nuevo', form: 'Formulario',
  filterPlaceholder: 'Filtrar…', from: 'Desde', to: 'Hasta', fromOf: '{label} desde', toOf: '{label} hasta',
  noValues: 'Sin valores', selectAll: 'Seleccionar todo', selectRow: 'Seleccionar fila', select: 'Seleccionar',
  showing: 'Mostrando {from}–{to} de', recordSingular: 'registro', recordPlural: 'registros',
};

/** Aplica los labels ES a todo ok-data-table de `root` que no traiga ya `.labels` propios. */
function localizeDataTables(root) {
  root.querySelectorAll('ok-data-table').forEach((dt) => {
    dt.labels = { ...ES_DT_LABELS, ...(dt.labels || {}) };
  });
}

// ── Navegación de la sidebar (mock ERPlora Cloud) ────────────────────────────
const NAV = [
  { group: 'Principal', items: [
    { id: 'overview', label: 'Vista general', icon: 'grid-outline' },
    { id: 'hubs',      label: 'Hubs',          icon: 'cube-outline', badge: '7' },
    { id: 'orgs',      label: 'Organizaciones', icon: 'business-outline' },
    { id: 'users',     label: 'Usuarios',      icon: 'people-outline' },
  ] },
  { group: 'Facturación', items: [
    { id: 'invoices', label: 'Facturas',      icon: 'card-outline', badge: '3', badgeColor: 'primary' },
    { id: 'plans',    label: 'Planes',        icon: 'pricetags-outline' },
    { id: 'usage',    label: 'Uso y consumo', icon: 'time-outline' },
  ] },
  { group: 'Desarrollador', items: [
    { id: 'tokens',   label: 'API Tokens', icon: 'code-slash-outline' },
    { id: 'logs',     label: 'Logs',       icon: 'document-text-outline' },
    { id: 'webhooks', label: 'Webhooks',   icon: 'git-network-outline' },
  ] },
];

// ── Tab-bar inferior (solo móvil) ────────────────────────────────────────────
const TABS = [
  { id: 'overview', label: 'Inicio',   icon: 'home-outline' },
  { id: 'hubs',     label: 'Hubs',     icon: 'cube-outline', badge: '7' },
  { id: 'users',    label: 'Usuarios', icon: 'people-outline' },
  { id: 'team',     label: 'Equipo',   icon: 'briefcase-outline' },
  { id: 'profile',  label: 'Perfil',   icon: 'person-circle-outline' },
];

function sidebarHtml(active) {
  return NAV.map((g) => {
    const items = g.items.map((it) => `
      <ion-item button detail="false" lines="none"${it.id === active ? ' color="primary"' : ''}>
        <ion-icon slot="start" name="${it.icon}"></ion-icon>
        <ion-label>${it.label}</ion-label>
        ${it.badge ? `<ion-badge slot="end"${it.badgeColor ? ` color="${it.badgeColor}"` : ''}>${it.badge}</ion-badge>` : ''}
      </ion-item>`).join('');
    return `<ion-list-header><ion-label>${g.group}</ion-label></ion-list-header>${items}`;
  }).join('');
}

function tabbarHtml(active) {
  const sel = TABS.some((t) => t.id === active) ? active : 'hubs';
  const btns = TABS.map((t) => `
    <ion-tab-button tab="${t.id}"${t.id === sel ? ' selected' : ''}>
      <ion-icon name="${t.icon}"></ion-icon>
      <ion-label>${t.label}</ion-label>
      ${t.badge ? `<ion-badge>${t.badge}</ion-badge>` : ''}
    </ion-tab-button>`).join('');
  return `<ion-tab-bar class="mobile-tabbar" slot="bottom" selected-tab="${sel}">${btns}</ion-tab-bar>`;
}

/**
 * Monta el shell y el body de una página de ejemplo.
 * @param {object} cfg
 * @param {string} [cfg.active]   id del item de sidebar/tab activo (def 'hubs').
 * @param {string} [cfg.search]   placeholder del buscador de la topbar.
 * @param {string} [cfg.body]     HTML del contenido (page-header + secciones).
 * @param {(doc: Document) => void} [cfg.setup]  wiring JS tras montar (CSP-safe).
 */
export function definePage({ active = 'hubs', search = 'Buscar…', body = '', setup, bare = false } = {}) {
  // Modo «bare»: solo el contenido (sin sidebar Cloud, sin topbar, sin tab-bar). Es como se
  // renderiza embebido dentro del dashboard real (que ya aporta su propio chrome).
  if (bare) {
    document.body.innerHTML = `
      <ion-app>
        <ion-content class="ion-padding">
          <div class="page-wrap">${body}</div>
        </ion-content>
      </ion-app>`;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      try { if (typeof setup === 'function') setup(document); } catch (err) { console.error('[page setup]', err); }
      localizeDataTables(document);
    }));
    return;
  }

  document.body.innerHTML = `
  <ion-app>
    <ion-split-pane content-id="main" when="lg">

      <ion-menu content-id="main" type="overlay">
        <ion-header>
          <ion-toolbar>
            <ion-title>
              <span class="cloud-brand">
                <span class="cloud-brand__logo">EC</span>
                <span class="cloud-brand__txt"><b>ERPlora Cloud</b><small>acme · ES</small></span>
              </span>
            </ion-title>
          </ion-toolbar>
        </ion-header>
        <ion-content>
          <ion-list lines="none">${sidebarHtml(active)}</ion-list>
        </ion-content>
        <ion-footer>
          <ion-toolbar>
            <ion-item lines="none" class="cloud-user">
              <ok-avatar slot="start" name="Ioan Beilic" size="sm"></ok-avatar>
              <ion-label><b>Ioan Beilic</b><br /><small>ioan@acme.com</small></ion-label>
            </ion-item>
          </ion-toolbar>
        </ion-footer>
      </ion-menu>

      <div class="ion-page" id="main">
        <ion-header>
          <ion-toolbar>
            <ion-buttons slot="start">
              <ion-menu-button></ion-menu-button>
              <ion-button fill="clear" class="topbar-back" aria-label="Volver">
                <ion-icon slot="icon-only" name="arrow-back-outline"></ion-icon>
              </ion-button>
            </ion-buttons>
            <ion-searchbar class="topbar-search" placeholder="${search}" search-icon="search-outline"></ion-searchbar>
            <ion-buttons slot="end">
              <ion-button fill="clear" aria-label="Notificaciones">
                <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
              </ion-button>
              <ok-avatar name="Ioan Beilic" size="sm"></ok-avatar>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          <div class="page-wrap">${body}</div>
        </ion-content>

        ${tabbarHtml(active)}
      </div>

    </ion-split-pane>
  </ion-app>`;

  // El back de la topbar usa el historial (mock); sin router.
  const back = document.querySelector('.topbar-back');
  if (back) back.addEventListener('click', () => { if (history.length > 1) history.back(); });

  // `setup` corre tras dos frames para que Ionic haya hidratado los ion-* / ok-*.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    try { if (typeof setup === 'function') setup(document); } catch (err) { console.error('[page setup]', err); }
    localizeDataTables(document);
  }));
}
