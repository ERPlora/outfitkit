/* app.js — DOCS-APP (SPA) de OutfitKit.
 *
 * Monta el chrome Ionic (split-pane + menu + header + content), la sidebar con buscador,
 * la topbar (viewport + tema + modo claro/oscuro + GitHub) y un router por hash
 * (#/ = intro, #/c/ok-xxx = ficha de componente con tabs Preview/Código).
 *
 * CSP estricta (script-src 'self'): nada de eval / new Function. El `example` de cada
 * componente es HTML estático que se inyecta con innerHTML (sin <script> ni handlers inline)
 * y luego su `setup(root, ctx)` cablea props/objetos/funciones por JS.
 */

import { html as h } from 'lit';
import { CATEGORIES, COMPONENTS } from './components-data.js';

const GITHUB_URL = 'https://github.com/ERPlora/outfitkit';
const BY_ID = new Map(COMPONENTS.map((c) => [c.id, c]));

// ── Paletas de tema ──────────────────────────────────────────────────────────
// `erplora` = la paleta REAL del sitio ERPlora UX (terracota), con sus colores de
// estado y superficies cálidas claro/oscuro. El resto solo cambian el primario.
const THEMES = {
  erplora: {
    label: 'ERPlora (terracota)', primary: '#E8552A', contrast: '#ffffff',
    shade: '#B83A12', tint: '#FF7A4D',
    success: '#4F9D6E', warning: '#D8A23A', danger: '#D8553F',
    light: { bg: '#FAF8F4', surface: '#ffffff', text: '#1A1612' },
    dark: { bg: '#0B0A09', surface: '#1A1815', text: '#F5F1EA' },
  },
  indigo: { label: 'Índigo', primary: '#5b5bd6' },
  ocean: { label: 'Océano', primary: '#0c8ce9' },
  forest: { label: 'Bosque', primary: '#1f9d55' },
  sunset: { label: 'Atardecer', primary: '#e8590c' },
};
const VIEWPORTS = {
  desktop: { label: 'Desktop', icon: 'desktop-outline', width: '100%' },
  tablet: { label: 'Tablet', icon: 'tablet-portrait-outline', width: '768px' },
  mobile: { label: 'Móvil', icon: 'phone-portrait-outline', width: '375px' },
};

const LS = {
  theme: 'ok-showcase-theme',
  viewport: 'ok-showcase-viewport',
  dark: 'ok-showcase-dark',
};

const state = {
  theme: localStorage.getItem(LS.theme) || 'erplora',
  viewport: localStorage.getItem(LS.viewport) || 'desktop',
  dark: localStorage.getItem(LS.dark) === '1',
  tab: 'preview',
  search: '',
};

// ─────────────────────────────────────────────────────────────────────────────
// Tema / modo
// ─────────────────────────────────────────────────────────────────────────────
// #rrggbb (o #rgb) → "r, g, b" para los tokens --ion-*-rgb de Ionic.
function hexToRgb(hex) {
  const n = hex.replace('#', '');
  const v = n.length === 3 ? n.split('').map((c) => c + c).join('') : n;
  const int = parseInt(v, 16);
  return `${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}`;
}
function setColor(root, name, hex) {
  if (!hex) return;
  root.setProperty(`--ion-color-${name}`, hex);
  root.setProperty(`--ion-color-${name}-rgb`, hexToRgb(hex));
}
const SURFACE_VARS = [
  '--ion-background-color', '--ion-background-color-rgb',
  '--ion-text-color', '--ion-text-color-rgb', '--ion-card-background',
];
function applyTheme() {
  const t = THEMES[state.theme] || THEMES.erplora;
  const root = document.documentElement.style;
  root.setProperty('--ion-color-primary', t.primary);
  root.setProperty('--ion-color-primary-rgb', hexToRgb(t.primary));
  root.setProperty('--ion-color-primary-contrast', t.contrast || '#ffffff');
  root.setProperty('--ion-color-primary-contrast-rgb', '255, 255, 255');
  root.setProperty('--ion-color-primary-shade', t.shade || t.primary);
  root.setProperty('--ion-color-primary-tint', t.tint || t.primary);
  setColor(root, 'success', t.success);
  setColor(root, 'warning', t.warning);
  setColor(root, 'danger', t.danger);
  // Superficies cálidas según modo (si el tema las define); si no, se usa la paleta de Ionic.
  const surf = state.dark ? t.dark : t.light;
  if (surf) {
    root.setProperty('--ion-background-color', surf.bg);
    root.setProperty('--ion-background-color-rgb', hexToRgb(surf.bg));
    root.setProperty('--ion-text-color', surf.text);
    root.setProperty('--ion-text-color-rgb', hexToRgb(surf.text));
    root.setProperty('--ion-card-background', surf.surface);
  } else {
    SURFACE_VARS.forEach((p) => root.removeProperty(p));
  }
  localStorage.setItem(LS.theme, state.theme);
}
function applyDark() {
  document.documentElement.classList.toggle('ion-palette-dark', state.dark);
  localStorage.setItem(LS.dark, state.dark ? '1' : '0');
  // Re-aplica el tema para que las superficies cálidas cambien con el modo.
  applyTheme();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar (lista de componentes agrupada + buscador)
// ─────────────────────────────────────────────────────────────────────────────
function renderSidebarList() {
  const list = document.getElementById('nav-list');
  if (!list) return;
  const q = state.search.trim().toLowerCase();
  const activeId = currentRoute().id;

  // Item "Inicio" siempre arriba.
  let htmlStr = `
    <ion-item button detail="false" data-href="#/" ${!activeId ? 'color="primary"' : ''}>
      <ion-icon slot="start" name="home-outline"></ion-icon>
      <ion-label>Inicio</ion-label>
    </ion-item>`;

  let totalShown = 0;
  for (const cat of CATEGORIES) {
    const items = COMPONENTS.filter(
      (c) => c.category === cat.id && (!q || c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)),
    );
    if (items.length === 0) continue;
    totalShown += items.length;
    htmlStr += `<ion-list-header><ion-label>${cat.label}</ion-label></ion-list-header>`;
    for (const c of items) {
      const active = c.id === activeId;
      htmlStr += `
        <ion-item button detail="false" data-href="#/c/${c.id}" ${active ? 'color="primary"' : ''}>
          <ion-label>
            <span class="nav-name">${c.name}</span>
          </ion-label>
        </ion-item>`;
    }
  }
  if (totalShown === 0) {
    htmlStr += `<div class="nav-empty">Sin resultados para «${escapeHtml(state.search)}»</div>`;
  }
  list.innerHTML = htmlStr;

  // Cablear navegación (CSP-safe: listeners, no handlers inline).
  list.querySelectorAll('[data-href]').forEach((el) => {
    el.addEventListener('click', () => {
      const href = el.getAttribute('data-href');
      if (location.hash !== href) location.hash = href;
      else render(); // mismo hash → fuerza re-render
      closeMenuOnMobile();
    });
  });
}

async function closeMenuOnMobile() {
  const menu = document.querySelector('ion-menu');
  if (menu && typeof menu.isActive === 'function') {
    try {
      if (await menu.isActive()) await menu.close();
    } catch (_) {
      /* noop */
    }
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ─────────────────────────────────────────────────────────────────────────────
// Router
// ─────────────────────────────────────────────────────────────────────────────
function currentRoute() {
  const m = (location.hash || '').match(/^#\/c\/([\w-]+)/);
  return { id: m ? m[1] : null };
}

function render() {
  const { id } = currentRoute();
  const titleEl = document.getElementById('topbar-title');
  const content = document.getElementById('view');
  if (!content) return;

  if (id && BY_ID.has(id)) {
    const comp = BY_ID.get(id);
    titleEl.textContent = comp.name;
    renderComponentView(content, comp);
  } else {
    titleEl.textContent = 'Inicio';
    renderHome(content);
  }
  renderSidebarList();
  document.getElementById('view').scrollTop = 0;
}

// ── Vista de inicio ──────────────────────────────────────────────────────────
function renderHome(content) {
  const cats = CATEGORIES.map((cat) => {
    const items = COMPONENTS.filter((c) => c.category === cat.id);
    if (!items.length) return '';
    const chips = items
      .map((c) => `<button class="home-chip" data-href="#/c/${c.id}">${c.name}</button>`)
      .join('');
    return `
      <div class="home-cat">
        <h3><ion-icon name="${cat.icon}"></ion-icon> ${cat.label}</h3>
        <div class="home-chips">${chips}</div>
      </div>`;
  }).join('');

  content.innerHTML = `
    <div class="doc">
      <h1>¿Qué es OutfitKit?</h1>
      <p class="lead">
        <strong>OutfitKit</strong> es una librería de <strong>Web Components (Lit)</strong> que
        <strong>construye lo que Ionic NO tiene</strong> —tabla de datos rica, árbol, KPIs y
        métricas, stepper/wizard, feedback inline, estados vacíos, calendario, kanban, inputs
        especializados y chrome web (navbar/footer/hero)— <strong>sobre Ionic</strong>. Ionic es la
        base: para botones, inputs, listas y layout usas Ionic directo (como este propio panel).
        OutfitKit cubre los huecos con un set <code>ok-*</code> tematizado por tokens
        <code>--ok-*</code> que heredan de <code>--ion-*</code>.
      </p>
      <p class="lead">
        Usa el <strong>buscador</strong> de la izquierda para filtrar, elige un componente para ver
        su <strong>Preview en vivo</strong> y su <strong>Código</strong>, prueba los
        <strong>viewports</strong> (Desktop / Tablet / Móvil) y cambia la <strong>paleta</strong> o
        el <strong>modo oscuro</strong> desde la barra superior.
      </p>
      <div class="home-cats">${cats}</div>
    </div>`;

  content.querySelectorAll('[data-href]').forEach((el) =>
    el.addEventListener('click', () => {
      location.hash = el.getAttribute('data-href');
    }),
  );
}

// ── Vista de componente (cabecera + tabs Preview/Código + API) ──────────────
function renderComponentView(content, comp) {
  const vp = VIEWPORTS[state.viewport] || VIEWPORTS.desktop;
  const apiRows = (comp.api || [])
    .map(
      (a) => `
      <tr>
        <td><span class="kind ${a.kind}">${a.kind}</span> <code>${escapeHtml(a.name)}</code></td>
        <td>${escapeHtml(a.type)}</td>
        <td>${escapeHtml(a.detail)}</td>
      </tr>`,
    )
    .join('');

  content.innerHTML = `
    <div class="doc comp-view">
      <header class="comp-head">
        <div class="tags"><span class="tag">&lt;${comp.name.split(' ')[0]}&gt;</span></div>
        <h1>${comp.name}</h1>
        <p class="desc">${escapeHtml(comp.desc)}</p>
        <pre class="import-line">import '${comp.importPath}';</pre>
      </header>

      <ion-segment value="${state.tab}" id="tab-seg">
        <ion-segment-button value="preview"><ion-label>Preview</ion-label></ion-segment-button>
        <ion-segment-button value="code"><ion-label>Código</ion-label></ion-segment-button>
      </ion-segment>

      <section class="tab-panel" data-tab="preview" ${state.tab !== 'preview' ? 'hidden' : ''}>
        <div class="viewport-stage" data-viewport="${state.viewport}">
          <div class="viewport-frame" id="preview-frame" style="width:100%;max-width:${vp.width};margin-inline:auto"></div>
        </div>
      </section>

      <section class="tab-panel" data-tab="code" ${state.tab !== 'code' ? 'hidden' : ''}>
        <div class="code-wrap">
          <button class="copy-btn" id="copy-btn"><ion-icon name="copy-outline"></ion-icon> Copiar</button>
          <pre class="code" id="code-block"></pre>
        </div>
      </section>

      ${apiRows
        ? `<h2 class="api-title">API</h2>
           <table class="api"><thead><tr><th>Nombre</th><th>Tipo</th><th>Detalle</th></tr></thead>
           <tbody>${apiRows}</tbody></table>`
        : ''}
    </div>`;

  // Tabs.
  const seg = content.querySelector('#tab-seg');
  seg.addEventListener('ionChange', (e) => {
    state.tab = e.detail.value;
    content.querySelectorAll('.tab-panel').forEach((p) => {
      p.hidden = p.getAttribute('data-tab') !== state.tab;
    });
  });

  // Código (textContent → seguro, sin interpretar HTML).
  content.querySelector('#code-block').textContent = comp.code || '';
  const copyBtn = content.querySelector('#copy-btn');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(comp.code || '');
      copyBtn.innerHTML = '<ion-icon name="checkmark-outline"></ion-icon> Copiado';
      setTimeout(() => {
        copyBtn.innerHTML = '<ion-icon name="copy-outline"></ion-icon> Copiar';
      }, 1400);
    } catch (_) {
      /* clipboard no disponible */
    }
  });

  // Preview: inyecta el example (HTML estático) y cablea setup por JS.
  const frame = content.querySelector('#preview-frame');
  frame.innerHTML = comp.example || '';
  if (typeof comp.setup === 'function') {
    try {
      comp.setup(frame, { h });
    } catch (err) {
      console.error('[showcase] setup falló para', comp.id, err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Topbar: viewport + tema + modo + github
// ─────────────────────────────────────────────────────────────────────────────
function setViewport(v) {
  state.viewport = v;
  localStorage.setItem(LS.viewport, v);
  // Actualiza el segment de la topbar y el marco si hay preview montado.
  const seg = document.getElementById('viewport-seg');
  if (seg) seg.value = v;
  const frame = document.getElementById('preview-frame');
  const stage = document.querySelector('.viewport-stage');
  if (frame) {
    // width:100% + max-width → el marco encoge para CABER siempre; nunca desborda el contenido.
    frame.style.width = '100%';
    frame.style.maxWidth = (VIEWPORTS[v] || VIEWPORTS.desktop).width;
    frame.style.marginInline = 'auto';
  }
  if (stage) stage.setAttribute('data-viewport', v);
}

function wireTopbar() {
  document.getElementById('btn-github').addEventListener('click', () => {
    window.open(GITHUB_URL, '_blank', 'noopener');
  });

  const btnDark = document.getElementById('btn-dark');
  btnDark.addEventListener('click', () => {
    state.dark = !state.dark;
    applyDark();
  });

  const vpSeg = document.getElementById('viewport-seg');
  vpSeg.value = state.viewport;
  vpSeg.addEventListener('ionChange', (e) => setViewport(e.detail.value));

  const themeSel = document.getElementById('theme-select');
  themeSel.value = state.theme;
  themeSel.addEventListener('ionChange', (e) => {
    state.theme = e.detail.value;
    applyTheme();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Búsqueda (searchbar de la sidebar)
// ─────────────────────────────────────────────────────────────────────────────
function wireSearch() {
  const sb = document.getElementById('nav-search');
  sb.addEventListener('ionInput', (e) => {
    state.search = e.detail.value || '';
    renderSidebarList();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Arranque
// ─────────────────────────────────────────────────────────────────────────────
function buildChrome() {
  const themeOpts = Object.entries(THEMES)
    .map(([id, t]) => `<ion-select-option value="${id}">${t.label}</ion-select-option>`)
    .join('');
  const vpButtons = Object.entries(VIEWPORTS)
    .map(
      ([id, v]) =>
        `<ion-segment-button value="${id}" title="${v.label}"><ion-icon name="${v.icon}"></ion-icon></ion-segment-button>`,
    )
    .join('');

  document.getElementById('app-root').innerHTML = `
    <ion-app>
      <ion-split-pane content-id="main" when="lg">
        <ion-menu content-id="main">
          <ion-header>
            <ion-toolbar>
              <ion-title class="brand-title"><img src="logo.png" height="20" alt="" /> OutfitKit</ion-title>
            </ion-toolbar>
            <ion-toolbar>
              <ion-searchbar id="nav-search" placeholder="Buscar componente…" debounce="80" class="nav-search"></ion-searchbar>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list id="nav-list" lines="none"></ion-list>
          </ion-content>
        </ion-menu>

        <div class="ion-page" id="main">
          <ion-header>
            <ion-toolbar>
              <ion-buttons slot="start"><ion-menu-button></ion-menu-button></ion-buttons>
              <ion-title id="topbar-title">Inicio</ion-title>
              <ion-buttons slot="end" class="topbar-end">
                <ion-segment id="viewport-seg" class="viewport-seg" value="${state.viewport}">
                  ${vpButtons}
                </ion-segment>
                <ion-select id="theme-select" class="theme-select" interface="popover" value="${state.theme}"
                  aria-label="Tema" toggle-icon="color-palette-outline">
                  ${themeOpts}
                </ion-select>
                <ion-button id="btn-dark" aria-label="Modo claro/oscuro" fill="clear">
                  <ion-icon slot="icon-only" name="contrast-outline"></ion-icon>
                </ion-button>
                <ion-button id="btn-github" aria-label="GitHub" fill="clear">
                  <ion-icon slot="icon-only" name="logo-github"></ion-icon>
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding" id="view"></ion-content>
        </div>
      </ion-split-pane>
    </ion-app>`;
}

function boot() {
  buildChrome();
  applyTheme();
  applyDark();
  wireTopbar();
  wireSearch();
  window.addEventListener('hashchange', () => {
    state.tab = 'preview';
    render();
  });
  render();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
