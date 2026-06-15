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

95 web components rellena-huecos (todos registran su tag `ok-*` vía `define()`). Abajo el qué-hace y
los **eventos `ok-*`** que emite cada uno (`—` = presentacional, sin eventos). La **referencia viva
de props/slots** es el [showcase](https://erplora.github.io/outfitkit/).

### Datos y tablas

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-data-table` | Tabla rica: lista/tarjetas, búsqueda, filtros, orden, paginación (server-side), selección, columnas, vistas, CSV import/export. Componente central, API congelada. | `pageChange`, `sortChange`, `searchChange`, `filterChange`, `selectionChange`, `rowAction`, `primaryAction`, `menuAction`, `columnsChange`, `csvImport`, `csvExport` |
| `ok-tree` | Árbol expandible recursivo por datos, con líneas guía y selección. | `ok-toggle`, `ok-select` |
| `ok-detail-list` | Description list (`dl`) para fichas: pares label/value alineados, 1–2 columnas. | — |
| `ok-bar-list` | Ranking de barras horizontales animadas con formateo de valores. | — |
| `ok-sparkline` | Mini-gráfico inline (línea/barras) en SVG, sin ejes, autoescalado. | — |
| `ok-code` | Visor de código monospace con etiqueta de lenguaje y botón copiar. | `ok-copy` |
| `ok-json-viewer` | Árbol JSON tipado colapsable, coloreado por tipo, con guías de indentación. | `ok-toggle` |
| `ok-diff` | Visor de diff unificado línea a línea con numeración dual y glifos +/−. | — |

### Dashboard y charts

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-kpi` | Tarjeta KPI: label, valor grande, delta coloreado y flecha de tendencia. | — |
| `ok-stat` | Métrica inline compacta (label + value + hint) para filas de stats. | — |
| `ok-widget-board` | Panel de widgets configurable (activar/desactivar/reordenar), presets, persistencia `localStorage`. | `ok-change` |
| `ok-gauge` | Medidor arc / ring / bullet animado con thresholds coloreados. | — |
| `ok-chart` | Gráfico SVG inline (línea/área/barras) sin librerías externas. | — |
| `ok-donut` | Donut/pie proporcional con leyenda opcional. | — |
| `ok-heatmap` | Heatmap de calendario (estilo GitHub) o anual, con cuantiles e intensidad. | — |
| `ok-funnel` | Embudo de conversión apilado con % y conteo por paso. | — |

### Feedback y estado de UI

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-inline-feedback` | Banner/callout persistente en flujo (no efímero), tonal, con acciones y cierre. | `ok-dismiss` |
| `ok-empty-state` | Estado vacío centrado: icono + título + mensaje + acción. | — |
| `ok-error-page` | Plantilla full-screen para errores HTTP (403/404/500), retry con cuenta atrás, modo bootstrap con checklist. | `ok-retry`, `ok-shortcut` |
| `ok-status-pill` | Pill de estado con fondo tonal suave + icono/punto (celdas de tabla). | — |
| `ok-status-dot` | Punto de presencia coloreado con pulso opcional. | — |
| `ok-skeleton` | Placeholders de carga (shimmer) con variantes y presets (card/table/chart). | — |
| `ok-coachmark` | Tour guiado con spotlight, bubble anclado y navegación por teclado. | `ok-step`, `ok-next`, `ok-prev`, `ok-finish`, `ok-skip` |
| `ok-hover-card` | Popover de previsualización (avatar/título/stats/acciones) anclada a hover/focus. | `ok-action`, `ok-open` |

### Flujo de tareas

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-stepper` | Indicador de pasos (círculos numerados conectados), horizontal/compacto. | `ok-step-select` |
| `ok-wizard` | Asistente multi-paso: compone `ok-stepper` + slots + barra Atrás/Siguiente/Finalizar. | `ok-step-change`, `ok-finish` |
| `ok-pagination` | Paginador numerado con prev/next, elipsis y selector de filas por página. | `ok-page-change`, `ok-page-size-change` |
| `ok-command-palette` | Paleta de comandos Cmd+K con búsqueda y agrupación. | `ok-select`, `ok-open` |
| `ok-qty-stepper` | Selector de cantidad −/+ con campo numérico y clamp. | `ok-change` |

### Calendario y planificación

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-calendar` | Calendario mes/agenda con eventos como chips y presets. | `ok-date-select`, `ok-event-click`, `ok-view-change`, `ok-nav` |
| `ok-scheduler` | Timeline de recursos/turnos (filas × franjas horarias) con eventos posicionados. | `ok-event-click`, `ok-slot-click`, `ok-nav` |
| `ok-kanban` | Tablero Kanban con HTML5 drag&drop (sin libs), columnas y tarjetas reordenables. | `ok-card-move`, `ok-card-click` |
| `ok-timeline` | Línea de tiempo vertical con estados (done/current/pending), modo alternado. | `ok-item-click` |

### Inputs (los que Ionic no trae)

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-combo` | Combobox con búsqueda filtrada y navegación por teclado. | `ok-input`, `ok-change` |
| `ok-tag-input` | Entrada de tags (chips) con Enter/coma, Backspace y sugerencias. | `ok-change` |
| `ok-rating` | Estrellas con hover-preview, medias estrellas y readonly. | `ok-change` |
| `ok-otp` | Código OTP/2FA con N casillas, auto-avance y pegado. | `ok-change`, `ok-complete` |
| `ok-pinpad` | Teclado numérico PIN con display enmascarable. | `ok-input`, `ok-complete` |
| `ok-currency` | Input monetario con máscara (miles/decimales/símbolo `Intl`). | `ok-change` |
| `ok-phone` | Teléfono con prefijo de país (bandera + dial) y número (E.164). | `ok-change` |
| `ok-dropzone` | Subida drag&drop + click con validación de tipo/tamaño. | `ok-change`, `ok-error` |
| `ok-date-picker` | Campo fecha + popover calendario, single/range, chips de preset. | `ok-change` |
| `ok-time-picker` | Pastilla HH:MM + popover de listas (horas/minutos/AM-PM), canónico 24h. | `ok-change` |
| `ok-range-dual` | Slider min-max de doble thumb con readout. | `ok-change` |
| `ok-color-picker` | Selector de color (SV + hue + hex + presets). | `ok-change`, `ok-open` |
| `ok-rich-text` | Editor WYSIWYG con toolbar y contador de palabras. | `ok-input` |
| `ok-signature` | Pad de firma sobre canvas con limpiar/exportar. | `ok-change`, `ok-clear` |
| `ok-calculator` | Calculadora con teclado 4×4 y máquina de estados. | `ok-input`, `ok-change` |
| `ok-keyboard` | Teclado virtual QWERTY/numérico para kiosco/táctil. | `ok-input`, `ok-key`, `ok-enter` |
| `ok-select-card` | Tarjeta seleccionable (checkbox/radio) con borde de marca al marcar. | `ok-change` |

### Acciones y menús

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-app-launcher` | Botón "apps" estilo Google (rejilla 3×3 en hoja de acción). | `ok-app-select`, `ok-open` |
| `ok-split-button` | Botón principal pegado a un caret que abre menú. | `ok-main`, `ok-select`, `ok-open` |
| `ok-menu` | Menú desplegable/contextual con submenús, checkbox/radio, divisores. | `ok-select`, `ok-open` |
| `ok-menubar` | Barra de menús de app (Archivo/Editar/Ver) con dropdowns. | `ok-select`, `ok-open` |
| `ok-drawer` | Panel lateral deslizante (slide-over) modal con focus-trap y cierre por ESC/scrim. | `ok-open`, `ok-close` |

### Media y archivos

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-image` | Imagen lazy con skeleton, fade-in, caption y zoom (lupa/lightbox). | `ok-open` |
| `ok-gallery` | Grid de imágenes seleccionables con caption hover y lightbox opcional. | `ok-select`, `ok-open` |
| `ok-lightbox` | Visor de medios full-screen con filmstrip, zoom y teclado. | `ok-close`, `ok-index` |
| `ok-cropper` | Recortador de imagen con rect arrastrable/redimensionable y rule-of-thirds. | `ok-crop`, `ok-cancel` |
| `ok-audio` | Reproductor de audio con controles propios. | `ok-play`, `ok-pause`, `ok-ended` |
| `ok-video` | Reproductor de vídeo con controles propios, 16:9 responsive. | `ok-play`, `ok-pause`, `ok-ended` |
| `ok-pdf` | Visor de PDF nativo del navegador con fallback de descarga. | — |
| `ok-qr` | Generador de QR en JS puro (Reed-Solomon, v1–40, 4 niveles EC). | — |
| `ok-carousel` | Carrusel con swipe, flechas, puntos y autoplay. | `ok-change` |
| `ok-avatar` | Avatar de iniciales/imagen con tamaños, formas y tono por hash. | — |
| `ok-avatar-group` | Pila de avatares solapados con overflow "+N". | — |
| `ok-file-item` | Fila de archivo/adjunto con badge, meta, barra de progreso y quitar. | `ok-remove` |
| `ok-file-manager` | Gestor de archivos backend-agnóstico (árbol + toolbar + grid/lista + cuota). | `ok-navigate`, `ok-open`, `ok-download`, `ok-delete`, `ok-create-folder`, `ok-search`, `ok-upload`, `ok-view-change` |
| `ok-icon-tile` | Pastilla cuadrada coloreada con icono (leading icon para cabeceras). | — |
| `ok-splitter` | Split-pane redimensionable (h/v) con divisor arrastrable. | `ok-resize` |

### Comunicación

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-chat` | Hilo de mensajes con compositor opcional (Enter envía). | `ok-send` |
| `ok-mail` | Cliente de correo (carpetas + lista filtrada + panel de lectura). | `ok-folder-select`, `ok-message-select`, `ok-reply`, `ok-archive`, `ok-delete`, `ok-compose`, … |
| `ok-notification-center` | Bandeja de notificaciones (drawer) con filtros y "marcar todas leídas". | `ok-read`, `ok-read-all`, `ok-filter`, `ok-close`, `ok-open` |

### Documentos y tarjetas de negocio

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-receipt` | Tiquet de venta formato impresora térmica 80mm (líneas, totales, impuestos, QR). | — |
| `ok-invoice` | Factura fiscal A4 (emisor/receptor/líneas/totales/pago/QR VeriFactu), JSON-in. | — |
| `ok-loyalty-card` | Tarjeta de fidelización estilo tarjeta de crédito con chip EMV y tier. | — |
| `ok-event-card` | Tarjeta de evento (bloque fecha + hora/lugar + avatares), pulso en "now". | — |
| `ok-kbd` | Chips keycap con glifos (⌘/↵/⌫) y combos `+`. | — |
| `ok-org-chart` | Organigrama jerárquico (tidy-tree) con pan/zoom y colapso. | `ok-node-toggle` |

### Web / marketing (chrome público)

| Componente | Qué hace | Eventos clave |
|---|---|---|
| `ok-navbar` | Barra de navegación responsive de landing (logo, enlaces, CTAs, drawer móvil). | navegación por `href` |
| `ok-footer` | Footer multi-columna responsive (slots `default` + `bottom`). | — |
| `ok-hero` | Sección hero de marketing con slots `title`/`subtitle`/`actions` (SEO). | — |
| `ok-page-header` | Cabecera de página in-content (título + descripción + metadatos + acciones). | — |
| `ok-bento` / `ok-bento-item` | Rejilla bento modular y sus celdas (icono/eyebrow/título, glass, hover). | — |
| `ok-reveal` | Anima contenido al entrar en viewport (`IntersectionObserver`). | — |
| `ok-feature-card` | Tarjeta de característica (icono + eyebrow + título + descripción). | — |
| `ok-pricing-card` | Tarjeta de plan/precio con features checklist y CTA. | — |
| `ok-product-card` | Tarjeta de módulo/producto (icono Iconify, categoría, badge, precio). | navegación por `href` |
| `ok-logo-cloud` | Banda de logos "Trusted by" con marquee opcional. | — |
| `ok-testimonial` | Cita de cliente con rating, avatar, autor/rol y glass. | — |
| `ok-cta-band` | Banda de llamada a la acción (degradado/glass, título, subtítulo, botones). | — |
| `ok-language-select` | Selector de idioma para landing (banderas emoji). | navegación por `href` |
| `ok-contact-form` | Formulario web (nombre/email/asunto/mensaje) con validación inline y POST. | `ok-submit` |

### Layout (CSS plano, **no** web component)

`@outfitkit/core/layout.css` — `.ok-container` / `.ok-container-fluid`, `.ok-grid` / `.ok-col` /
`.ok-md-*` / `.ok-grid-cards`, `.ok-section` (+ encabezado), `.ok-table-stack` (tabla responsive).
Geometría/tipografía pura → CSS; comportamiento/estado → web component.

### Estado

`store` (reactivo + IndexedDB) + `<ok-store>` (emite `ok-store-change` / `ok-store-ready`) +
`StoreController` (Lit) — ver [sección Estado](#estado-store-con-indexeddb).

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
