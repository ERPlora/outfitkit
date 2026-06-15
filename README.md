# OutfitKit (`@outfitkit/core`)

**OutfitKit** es una librería de **Web Components (Lit)** que **CONSTRUYE lo que Ionic NO tiene**,
sobre primitivos de Ionic.

> **Ionic es la base.** Para botones, inputs, listas, modales, toolbars, layout/app-shell, tabs,
> etc. usas **Ionic directo** (`ion-*`): OutfitKit **no** los envuelve. OutfitKit solo cubre los
> **huecos** —componentes que Ionic no trae (árbol, tabla rica, calendario, kanban, kpi, charts,
> inputs especializados…)— y el **chrome web/marketing** que Ionic (pensado para apps) no cubre.

Esto **sustituye** el enfoque anterior de "wrapper completo de Ionic" (`ok-button`/`ok-input`/…),
que se retiró por redundante.

- **Construye SOBRE Ionic** — por dentro reusa `ion-*` nativos que registra el host; OutfitKit no
  los importa por componente.
- **Usable en cualquier sitio** — plantillas **Django**, apps **Lit/Vue**, o el **Hub** de ERPlora.
  Son custom elements estándar: van donde vaya HTML.
- **Distribución dual** — **npm** (`@outfitkit/core`) con imports individuales por componente, o
  **CDN** (bundle único `outfitkit.js`).
- **CSP-safe** — el output no contiene `eval` / `new Function`; funciona bajo `script-src 'self'`.
- **Tema por tokens `--ok-*`** (espejo de `--ion-*`), claro/oscuro sin esfuerzo.

Showcase en vivo: **https://erplora.github.io/outfitkit/**
Convenciones de desarrollo: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) ·
Backlog de componentes: [`docs/PLAN-COMPONENTES.md`](docs/PLAN-COMPONENTES.md)

---

## Instalación

```sh
npm i @outfitkit/core
```

OutfitKit declara **peer dependencies de entorno**: el host debe cargar **`@ionic/core`** (los
componentes reusan `ion-*` por dentro, que el host registra una sola vez) y **`lit`** (queda
external en los bundles para compartir una única copia). Instálalas en tu app:

```sh
npm i @ionic/core lit
```

### Import individual (recomendado en apps con bundler)

Cada componente es un entry independiente con *side-effect* de registro (`define('ok-x', …)`):

```js
import '@outfitkit/core/ok-data-table';
import '@outfitkit/core/ok-tree';
// ...solo lo que uses → menor peso
```

Las clases y tipos también se re-exportan desde el barrel:

```js
import { OkDataTable } from '@outfitkit/core';
```

### Bundle (registra todo de golpe)

```js
import '@outfitkit/core/cdn'; // auto-registra todos los ok-*
```

### Uso por CDN

El bundle `outfitkit.js` deja `lit` external, así que necesitas un **import-map** para resolver
`lit` (y cargar Ionic aparte):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@ionic/core/css/ionic.bundle.css" />
<script type="importmap">
  {
    "imports": {
      "lit": "https://cdn.jsdelivr.net/npm/lit@3/index.js",
      "lit/": "https://cdn.jsdelivr.net/npm/lit@3/"
    }
  }
</script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@outfitkit/core/dist/outfitkit.js"></script>
```

> Nota: un import-map en línea choca con una CSP `script-src 'self'`. Bajo CSP estricta (Cloud/Hub
> de ERPlora) usa **imports individuales con un bundler** que hornee `lit` y los `ok-*` en el dist
> same-origin; el CDN + import-map queda para entornos sin CSP estricta.

---

## Inventario de componentes

~95 componentes rellena-huecos. La **referencia viva de API** (props/eventos/slots por componente)
es el [showcase](https://erplora.github.io/outfitkit/); aquí va el mapa por categoría.

### Datos y tablas
`ok-data-table` (tabla rica: búsqueda, orden, paginación server-side, columnas, vistas, export/import —
componente central, API congelada), `ok-tree`, `ok-detail-list`, `ok-bar-list`, `ok-sparkline`,
`ok-code`, `ok-json-viewer`, `ok-diff`.

### Dashboard y charts
`ok-kpi`, `ok-stat`, `ok-widget-board`, `ok-gauge`, `ok-chart`, `ok-donut`, `ok-heatmap`, `ok-funnel`.

### Feedback y estado de UI
`ok-inline-feedback` (banner/callout), `ok-empty-state`, `ok-error-page`, `ok-status-pill`,
`ok-status-dot`, `ok-skeleton`, `ok-coachmark`, `ok-hover-card`.

### Flujo de tareas
`ok-stepper`, `ok-wizard`, `ok-pagination`, `ok-command-palette`, `ok-qty-stepper`.

### Calendario y planificación
`ok-calendar`, `ok-scheduler`, `ok-kanban`, `ok-timeline`.

### Inputs (los que Ionic no trae)
`ok-combo` (autocomplete), `ok-tag-input`, `ok-rating`, `ok-otp`, `ok-pinpad`, `ok-currency`,
`ok-phone`, `ok-dropzone`, `ok-date-picker`, `ok-time-picker`, `ok-range-dual`, `ok-color-picker`,
`ok-rich-text`, `ok-signature`, `ok-calculator`, `ok-keyboard`, `ok-select-card`.

### Acciones y menús
`ok-app-launcher` (botón "apps" 3×3), `ok-split-button`, `ok-menu`, `ok-menubar`, `ok-drawer`.

### Media y archivos
`ok-image`, `ok-gallery`, `ok-lightbox`, `ok-cropper`, `ok-audio`, `ok-video`, `ok-pdf`, `ok-qr`,
`ok-carousel`, `ok-avatar`, `ok-avatar-group`, `ok-file-item`, `ok-file-manager`, `ok-icon-tile`,
`ok-splitter`.

### Comunicación
`ok-chat`, `ok-mail`, `ok-notification-center`.

### Documentos y tarjetas de negocio
`ok-receipt` (tiquet 80mm), `ok-invoice` (factura A4), `ok-loyalty-card`, `ok-event-card`, `ok-kbd`,
`ok-org-chart`.

### Web / marketing (chrome público)
`ok-navbar`, `ok-footer`, `ok-hero`, `ok-page-header`, `ok-bento` / `ok-bento-item`, `ok-reveal`,
`ok-feature-card`, `ok-pricing-card`, `ok-product-card`, `ok-logo-cloud`, `ok-testimonial`,
`ok-cta-band`, `ok-language-select`. Formulario: `ok-contact-form`.

### Layout (CSS plano, **no** web component)
`@outfitkit/core/layout.css` — `.ok-container` / `.ok-container-fluid`, `.ok-grid` / `.ok-col` /
`.ok-md-*` / `.ok-grid-cards`, `.ok-section` (+ encabezado), `.ok-table-stack` (tabla responsive).
Geometría/tipografía pura → CSS; comportamiento/estado → web component.

### Estado
`store` (reactivo + IndexedDB) + `<ok-store>` + `StoreController` (ver abajo).

> **No** se construye lo que Ionic ya da (botones, inputs, listas, modales, toolbars, tabs, layout
> de app, app-shell). El **shell** del dashboard se compone con `ion-*` directos. Los componentes de
> **dominio** (POS, RRHH, comercio…) viven en sus **módulos** de negocio reusando estos genéricos,
> no en el core.

---

## Estado (store con IndexedDB)

OutfitKit incluye en su CORE un **store de estado reactivo** respaldado por **IndexedDB**,
reutilizable por cualquier componente. CERO dependencias externas y CSP-safe (sin `eval`/`new
Function`). La **fuente de verdad síncrona** es una caché en memoria; IndexedDB solo **persiste** en
segundo plano, así que `get()` es síncrono y `set()` notifica al instante.

API:

| Miembro | Descripción |
|---|---|
| `createStore({ name?, storeName? })` | Crea un store (defaults DB `outfitkit` / store `kv`). |
| `store` | Singleton por defecto, listo para usar. |
| `ready: Promise<void>` | Resuelve cuando la caché se hidrató desde IndexedDB. |
| `get(key)` | Lee de la caché (SÍNCRONO). |
| `set(key, value)` | Escribe, notifica suscriptores y persiste (fire-and-forget). |
| `update(key, fn)` | `fn(prev) => next`. |
| `delete(key)` / `remove(key)` | Borra una clave. |
| `clear()` | Vacía el store. |
| `has(key)` / `keys()` / `entries()` | Introspección. |
| `subscribe(key, cb)` / `subscribe(cb)` | Suscripción a una clave o a todo. `cb(value, key)`. Devuelve `unsubscribe`. |
| `flush(): Promise<void>` | Resuelve cuando se han escrito a IndexedDB las operaciones pendientes. |

### En JS suelto

```js
import { store, createStore } from '@outfitkit/core/store';

await store.ready;                 // hidrata la caché desde IndexedDB
store.set('theme', 'dark');        // notifica + persiste
store.get('theme');                // 'dark' (síncrono)
const off = store.subscribe('theme', (v) => console.log('tema:', v));
await store.flush();               // espera a que se escriba en disco (opcional)
off();                             // desuscribirse

// Store propio (otra DB):
const prefs = createStore({ name: 'mi-app', storeName: 'prefs' });
```

### En Lit (`StoreController`)

`StoreController` implementa el `ReactiveController` de Lit: se suscribe al store y llama a
`requestUpdate()` en cada cambio.

```js
import { LitElement, html } from 'lit';
import { store } from '@outfitkit/core/store';
import { StoreController } from '@outfitkit/core/store-controller';

class ThemeToggle extends LitElement {
  #theme = new StoreController(this, store, 'theme');
  render() {
    return html`<ion-toggle
      .checked=${this.#theme.value === 'dark'}
      @ionChange=${(e) => this.#theme.set(e.detail.checked ? 'dark' : 'light')}
    >Modo oscuro</ion-toggle>`;
  }
}
```

### En Django (elemento `<ok-store>`, sin escribir JS de wiring)

`<ok-store>` posee un store (atributo `name` = DB), no renderiza UI (pasa su contenido por slot) y
emite `ok-store-change` `{ key, value }` en cada cambio y `ok-store-ready` cuando hidrata. Expone
`.store` y los proxies `get/set/updateValue/delete` (es `updateValue` porque `update` lo reserva
LitElement).

```html
<ok-store name="prefs" id="prefs"></ok-store>
<output id="count">0</output>
<ion-button id="inc">+1</ion-button>

<script type="module" nonce="{{ request.csp_nonce }}">
  const prefs = document.getElementById('prefs');
  const out = document.getElementById('count');
  prefs.addEventListener('ok-store-ready', () => { out.textContent = prefs.get('count') ?? 0; });
  prefs.addEventListener('ok-store-change', (e) => { if (e.detail.key === 'count') out.textContent = e.detail.value; });
  document.getElementById('inc').addEventListener('click', () => prefs.updateValue('count', (n = 0) => n + 1));
</script>
```

> Si el entorno no soporta IndexedDB (SSR, tests), la persistencia se desactiva en silencio y el
> store funciona solo en memoria; nunca lanza al consumidor.

---

## Theming

OutfitKit se tematiza en **dos capas**:

1. **Tokens globales `--ok-*`** (espejo de `--ion-*`). Son la fuente de verdad.
2. **Vars por componente** estilo Ionic con default = cadena `--ok-* → --ion-* → hex`. El `ion-*`
   interno hereda `--ion-*` del host, así que claro/oscuro funcionan solos.

`@outfitkit/core/theme.css` ([`dist/theme.example.css`](dist/theme.example.css)) es una **plantilla**
de tokens; cópiala y pon tus valores de marca:

```css
:root {
  --ok-primary: var(--ion-color-primary);
  --ok-surface: var(--ion-card-background);
  --ok-radius: 14px;
  --ok-shadow-sm: 0 1px 3px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.04);
  --ok-shadow-md: 0 6px 20px rgba(17, 24, 39, 0.08), 0 2px 6px rgba(17, 24, 39, 0.04);
  /* … */
}
```

El dark lo gobierna `.ion-palette-dark` de Ionic (los `ok-*` heredan `--ion-*`); define ahí los
overrides de marca que necesites.

Override puntual por componente (igual que `ion-button { --background: … }`):

```css
ok-kpi { --ok-radius: 999px; }
```

---

## Uso en Django

Sirve el JS desde tus estáticos (`script-src 'self'`) y usa un `nonce` cuando lo necesites. El
**shell** se arma con `ion-*` directos; OutfitKit aporta los huecos (aquí `ok-data-table`):

```html
{% load static %}
<link rel="stylesheet" href="{% static 'css/ionic.bundle.css' %}" />
<link rel="stylesheet" href="{% static 'css/outfitkit-theme.css' %}" />

<script type="module" nonce="{{ request.csp_nonce }}">
  import '{% static "outfitkit/dist/cdn.js" %}'; // o imports individuales
</script>

<ion-split-pane content-id="main">
  <ion-menu content-id="main"><!-- ion-list de navegación --></ion-menu>
  <ion-content id="main">
    <ion-header><ion-toolbar><ion-title>Clientes</ion-title></ion-toolbar></ion-header>
    <ok-data-table id="tabla"></ok-data-table>
  </ion-content>
</ion-split-pane>
```

Las props complejas (arrays/objetos como `columns`, `rows`) se asignan en JS:

```html
<script type="module" nonce="{{ request.csp_nonce }}">
  document.getElementById('tabla').columns = [/* ... */];
  document.getElementById('tabla').rows = [/* ... */];
</script>
```

## Uso en Lit / Hub

Importa los componentes (side-effect de registro) y úsalos en tus templates Lit:

```js
import { html } from 'lit';
import '@outfitkit/core/ok-data-table';

export const view = (cols, rows) => html`
  <ok-data-table
    .columns=${cols}
    .rows=${rows}
    @rowAction=${(e) => handle(e.detail)}
  ></ok-data-table>
`;
```

> En el Hub, `lit` y `@ionic/core` ya los carga el host; OutfitKit los reutiliza (no duplica copias).

---

## Comandos de desarrollo

```sh
npm run build        # vite (dist/*.js, outfitkit.js, theme.example.css) + tsc (dist/*.d.ts)
npm run typecheck    # comprobación de tipos sin emitir
npm run verify:csp   # rechaza eval / new Function en dist (CSP estricta)
npm run dev          # vite build --watch (showcase en local)
npm run release      # release-it: corta una versión (ver docs/RELEASING.md)
```

Publicación a npm: [`docs/RELEASING.md`](docs/RELEASING.md) (Trusted Publishing / OIDC).

---

## Enlaces

- **Showcase (GitHub Pages):** https://erplora.github.io/outfitkit/
- **Convenciones de desarrollo:** [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- **Backlog de componentes:** [`docs/PLAN-COMPONENTES.md`](docs/PLAN-COMPONENTES.md)
- **Cómo contribuir:** [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 OutfitKit contributors.
