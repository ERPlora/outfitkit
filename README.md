# OutfitKit (`@outfitkit/core`)

**OutfitKit** es una librería de **Web Components (Lit)** que envuelve **Ionic** con un set de
componentes `ok-*` consistente y estable. El consumidor usa **solo** componentes `ok-*` y **nunca**
toca `ion-*` directamente: cada `ok-*` esconde el `ion-*` equivalente y expone una API propia,
framework-agnóstica.

- **Wrapper completo sobre Ionic** — shell de dashboard (app-shell, sidebar, topbar, page,
  segment), `ok-data-table`, primitivos de formulario y chrome de landing.
- **Usable igual en cualquier sitio** — plantillas **Django**, apps **Lit/Vue**, o el **Hub** de
  ERPlora. Son custom elements estándar: van donde vaya HTML.
- **Distribución dual** — **npm** (`@outfitkit/core`) con imports individuales por componente, o
  **CDN** (bundle único `outfitkit.js`).
- **CSP-safe** — el output no contiene `eval` / `new Function`; funciona bajo `script-src 'self'`.
- **Tema por tokens `--ok-*`** — espejo de `--ion-*`, claro/oscuro sin esfuerzo.

Showcase en vivo: **https://erplora.github.io/outfitkit/**
Convenciones de desarrollo: [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)

---

## Instalación

```sh
npm i @outfitkit/core
```

OutfitKit declara **peer dependencies de entorno**: el host debe cargar **`@ionic/core`** (los
componentes envuelven `ion-*`, que el host registra una sola vez) y **`lit`** (queda external en los
bundles para compartir una única copia). Instálalas en tu app:

```sh
npm i @ionic/core lit
```

### Import individual (recomendado en apps con bundler)

Cada componente es un entry independiente con *side-effect* de registro (`define('ok-x', …)`):

```js
import '@outfitkit/core/ok-button';
import '@outfitkit/core/ok-data-table';
// ...solo lo que uses → menor peso
```

Las clases y tipos también se re-exportan desde el barrel:

```js
import { OkButton } from '@outfitkit/core';
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

> Nota: un import-map en línea puede chocar con una CSP `script-src 'self'`. En Django sirve el
> import-map desde un fichero estático propio o usa los imports individuales con un bundler.

---

## Inventario de componentes

Cada componente hereda el tema global `--ok-*` (ver [Theming](#theming)) y expone vars por
componente estilo Ionic (`--background`, `--color`, …) para overrides puntuales.

### Shell (dashboard)

| Componente | Props / Attrs | Eventos | Slots |
|---|---|---|---|
| **`ok-app-shell`** | attr `menu-open` | escucha `ok-menu-toggle`, `ok-nav` | `sidebar`, *default* (contenido) |
| **`ok-sidebar`** | `sections=[{label,items:[{path,label,icon?}]}]`, `active-path`, `user={name,email?,avatarUrl?}` | `ok-nav` `{path}`, `ok-account` | `brand`, `switcher` |
| **`ok-topbar`** | `heading`, `back-href`, `actions=[{id,label,icon,pinned?}]` | `ok-menu-toggle`, `ok-back`, `ok-action` `{id}` | `title` |
| **`ok-page`** | attr `flush` | — | `header`, *default* |
| **`ok-segment`** | `items=[{value,label,icon?}]`, `value`, `mode`, `scrollable` | `ok-change` `{value}` | — |

### Compuestos

| Componente | Props | Eventos |
|---|---|---|
| **`ok-data-table`** | `columns`, `rows`, `searchKeys`, `pageSize`, `serverSide`, `actions`, `columnSelector`, `views`, `pageSizes`, `exportable`, `importable` | `rowAction`, `pageChange`, `sortChange`, `searchChange`, `filterChange`, `viewChange`, `columnsChange`, `pageSizeChange`, `export`, `import` |

### Primitivos

| Componente | Props / Attrs | Eventos | Slots |
|---|---|---|---|
| **`ok-button`** | `color`, `fill`, `size`, `href`, `disabled`, `full`, `round` | *(click nativo burbujea)* | `start`, *default*, `end` |
| **`ok-icon`** | `name`, `src`, `color`, `size` | — | — |
| **`ok-input`** | `value`, `placeholder`, `type`, `name`, `disabled`, `readonly`, `label`, `label-placement` | `ok-input`, `ok-change` `{value}`, `ok-blur`, `ok-focus` | — |
| **`ok-select`** | `options=[{value,label}]`, `value`, `placeholder`, `label`, `label-placement`, `disabled`, `interface` | `ok-change` `{value}` | — |
| **`ok-searchbar`** | `value`, `placeholder`, `disabled`, `debounce` | `ok-input`, `ok-change` `{value}` | — |
| **`ok-badge`** | `color` | — | *default* |
| **`ok-card`** | `flat` | — | *default* (familia `ok-card-header` / `ok-card-title` / `ok-card-subtitle` / `ok-card-content`) |
| **`ok-list`** | `lines` | — | *default* (`ok-item`) |
| **`ok-item`** | `button`, `disabled`, `lines`, `detail`, `href` | *(click nativo burbujea)* | `start`, *default*, `end` |
| **`ok-label`** | — | — | *default* |
| **`ok-spinner`** | `name`, `color` | — | — |
| **`ok-toggle`** | `checked`, `disabled`, `color` | `ok-change` `{checked}` | — |
| **`ok-checkbox`** | `checked`, `indeterminate`, `disabled`, `color` | `ok-change` `{checked}` | — |
| **`ok-chip`** | `color`, `outline`, `disabled` | — | `start`, *default*, `end` |

### Landing (chrome público)

Contenido por **slots** (light DOM) → crawlable para SEO; no dependen de `ion-*`.

| Componente | Descripción |
|---|---|
| **`ok-navbar`** | Barra de navegación pública. |
| **`ok-footer`** | Pie de página. |
| **`ok-container`** | Contenedor centrado con `--max-width` (`--ok-container-max`). |
| **`ok-container-full`** | Contenedor a ancho completo. |
| **`ok-hero`** | Sección hero de cabecera. |

---

## Theming

OutfitKit se tematiza en **dos capas**:

1. **Tokens globales `--ok-*`** que pones tú (espejo de `--ion-*`). Son la fuente de verdad.
2. **Vars por componente** estilo Ionic (`--background`, `--color`, …) con default = cadena
   `--ok-* → --ion-* → hex`. El `ion-*` interno hereda `--ion-*` del host, así que claro/oscuro
   funcionan solos.

Tokens disponibles:

| Token | Uso |
|---|---|
| `--ok-primary` | Color de marca / acentos |
| `--ok-bg` | Fondo de página |
| `--ok-surface` | Fondo de superficies (cards, sidebar) |
| `--ok-surface-2` | Superficie secundaria / elevada |
| `--ok-text` | Texto principal |
| `--ok-muted` | Texto secundario / atenuado |
| `--ok-border` | Bordes y separadores |
| `--ok-radius` | Radio de esquinas |
| `--ok-spacing` | Unidad de espaciado base |
| `--ok-container-max` | Ancho máximo de contenedores |
| `--ok-font` | Familia tipográfica |

Parte de [`@outfitkit/core/theme.css`](dist/theme.example.css) y sobrescribe lo que necesites:

```css
/* Tema claro (por defecto) */
:root {
  --ok-primary: #4f46e5;
  --ok-bg: #ffffff;
  --ok-surface: #f8fafc;
  --ok-surface-2: #f1f5f9;
  --ok-text: #0f172a;
  --ok-muted: #64748b;
  --ok-border: #e2e8f0;
  --ok-radius: 12px;
  --ok-spacing: 16px;
  --ok-container-max: 1200px;
  --ok-font: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}

/* Tema oscuro */
@media (prefers-color-scheme: dark) {
  :root {
    --ok-bg: #0b1120;
    --ok-surface: #111827;
    --ok-surface-2: #1f2937;
    --ok-text: #f8fafc;
    --ok-muted: #94a3b8;
    --ok-border: #334155;
  }
}
```

Override por componente puntual (igual que `ion-button { --background: … }`):

```css
ok-button { --background: var(--ok-primary); --border-radius: 999px; }
```

---

## Uso en Django

Sirve el JS desde tus estáticos (`script-src 'self'`) y usa un `nonce` cuando lo necesites:

```html
{% load static %}
<link rel="stylesheet" href="{% static 'css/ionic.bundle.css' %}" />
<link rel="stylesheet" href="{% static 'css/outfitkit-theme.css' %}" />

<script type="module" nonce="{{ request.csp_nonce }}">
  import '{% static "outfitkit/dist/cdn.js" %}'; // o imports individuales
</script>

<ok-app-shell>
  <ok-sidebar slot="sidebar" active-path="{{ request.path }}"></ok-sidebar>
  <ok-page>
    <ok-topbar slot="header" heading="Clientes"></ok-topbar>
    <ok-data-table id="tabla"></ok-data-table>
  </ok-page>
</ok-app-shell>
```

Las props complejas (arrays/objetos como `columns`, `rows`, `sections`) se asignan en JS:

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
```

---

## Enlaces

- **Showcase (GitHub Pages):** https://erplora.github.io/outfitkit/
- **Convenciones de desarrollo:** [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md)
- **Cómo contribuir:** [`CONTRIBUTING.md`](CONTRIBUTING.md)

## Licencia

[MIT](LICENSE) — Copyright (c) 2026 OutfitKit contributors.
