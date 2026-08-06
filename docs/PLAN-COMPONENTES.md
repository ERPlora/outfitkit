# OutfitKit — Lista de construcción (giro 2026-06)

## Enfoque (decidido)

OutfitKit = **librería de Web Components que Ionic NO tiene**, construidos *con* primitivos de Ionic
+ estilos, **responsive**. NO wrappers de lo que Ionic ya da (botones, layout, app-shell, inputs…).

Fuente de inspiración: catálogo **`ERPlora/ux`** (https://erplora.github.io/ux/), 90 componentes.

### Estado (act. 2026-08-06) — BACKLOG COMPLETO; el recuento vivo está en el README

Este doc no lleva la cifra de componentes (caduca): la fuente es el
[inventario del README](../README.md) y `ls src/components/` (a fecha de esta actualización, 92).

**Construidos** (Tier 0–3): navbar (offcanvas móvil), footer, hero, container(-full), contact-form ·
data-table, tree, sparkline, inline-feedback, empty-state, kpi, stat, stepper, wizard, calendar,
kanban, scheduler, chat, timeline · combo, tag-input, rating, otp, pinpad, currency, phone,
dropzone, qty-stepper, color-picker · app-launcher, split-button, menubar, command-palette ·
qr, carousel, signature, audio, video, pdf · store.
Showcase (`showcase/`) estilo `ux` (sidebar+búsqueda, viewport, temas — ERPlora terracota por defecto, claro/oscuro).

**Descartados (decisión)**: `radio-card` (no necesario), `tooltip` (usar `ion-popover`).
Los charts se descartaron inicialmente (chart/donut/gauge → librería externa:
Chart.js/ApexCharts/uPlot), pero la decisión se **REVIRTIÓ**: `ok-chart`/`ok-donut`/`ok-gauge`
existen, en SVG inline y sin librerías externas (ver README). No quedan pendientes en el backlog.

### Oleada marketing 2026 (2026-06-09) — bento · scroll-reveal · glass

Para rediseñar la **web pública del SaaS** (tendencias 2026: bento grids, animaciones al
scroll, glass/“liquid glass” como acento, tipografía display) se añadieron 11 tags:

- [x] `.ok-section` (layout.css) — sección de marketing como CSS plano sobre `<section>` (antes WC `ok-section`, eliminado): eyebrow + título display + subtítulo; modificadores `--center`/`--divider`.
- [x] `ok-bento` + `ok-bento-item` — rejilla bento modular (cols/rows variables, `glass`, `tone`, `interactive`).
- [x] `ok-feature-card` — tarjeta de característica (icono + título + desc, hover lift, `glass`).
- [x] `ok-pricing-card` — tarjeta de plan (precio/periodo/features/`featured`/badge, slot `cta`).
- [x] `ok-product-card` — tarjeta de producto/módulo (icono + categoría + badge + precio + flecha hover).
- [x] `ok-reveal` — anima el contenido al entrar en viewport (IntersectionObserver, CSP-safe, respeta `prefers-reduced-motion`).
- [x] `ok-logo-cloud` — banda de logos / prueba social (grid o `marquee`).
- [x] `ok-testimonial` — cita de cliente (rating + autor + `author-role` + avatar).
- [x] `ok-cta-band` — banda CTA full-width (variantes solid/soft/glass).
- [x] `ok-language-select` — selector de idioma (dropdown; enlaces en light DOM → SEO; default = idioma del navegador). `ok-navbar` ganó atributo `glass`.

**GOTCHA**: `<iconify-icon>` NO renderiza dentro de Shadow DOM (light DOM sí). Los componentes con
icono lo pintan como **máscara CSS sobre la SVG del API de Iconify** (`background:currentColor` +
`mask:url(.../prefix/name.svg)`), tematizable y CSP-safe.

**Efectos/animaciones en el propio showcase (`showcase/`):**
- [x] Página de cada componente: los tags nuevos están en `showcase/components-data.js`
  (ejemplo + API + código) — hecho; hoy cubre los 133 tags `ok-*`.
- Pendiente (genuinamente sin hacer): envolver las secciones del showcase en `ok-reveal`, hero con
  `.ok-section` + rejilla de categorías como `ok-bento`, demo de `ok-language-select`/`ok-navbar glass`,
  repaso de `prefers-reduced-motion`. **Si se quiere hacer, abrir Issue en el
  [board](https://github.com/orgs/ERPlora/projects/3) — los `.md` no rastrean trabajo.**

### Decisiones
- **Wrappers redundantes RETIRADOS** (hecho, 2026-06 — lista histórica en §Limpieza). Se usa Ionic
  directo para todo lo que Ionic ya da.
- **Dominio (POS/industria/RRHH/comercio) → vive en los MÓDULOS** de negocio, reusando los
  genéricos. El core de OutfitKit = solo genéricos + web/marketing.
- **`ok-utilities.css` → DESCARTADO** (Ionic ya expone sus utilidades). Borrar CSS + generador + doc.
- **Estilos / Tailwind**: se puede **autorar** con Tailwind si hace falta para que quede bien, PERO
  al compilar cada componente debe ser **AUTOCONTENIDO** (CSS inlined en su shadow DOM). El
  consumidor **no** importa Tailwind para usar el componente.
- **Convención responsive**: por defecto cada componente ocupa el **ancho máximo de su contenedor**
  (block, width 100%) y es responsive (desktop + móvil).
- Mantener: **`ok-data-table`** (API congelada), el **store** (`@erplora/outfitkit/store`), y el
  **chrome web/marketing** (navbar, footer, hero, container, contact-form).

---

## Backlog de construcción

Todo lo que listaba este backlog (Tier 0–3: web/marketing, genéricos núcleo, inputs, multimedia)
**ya está construido**. Este documento no rastrea componente a componente qué falta — eso caduca en
cuanto se construye algo y nadie vuelve a marcar la casilla. La fuente de verdad es el código y el
inventario del README:

- Inventario con qué-hace + eventos: [`README.md` § Inventario de componentes](../README.md).
- Lista viva de carpetas: `ls src/components/`.
- Si falta un `ok-*` que de verdad no existe, se abre una Issue (trabajo abierto vive en el
  [board](https://github.com/orgs/ERPlora/projects/3), no en checkboxes de este `.md`).

### Descartes (decisión, no pendientes)
`radio-card`, `tooltip` (usar `ion-popover` con `trigger-action="hover"`) — no se construyen.
`ok-chart`/`ok-donut`/`ok-gauge` **sí se acabaron construyendo** (SVG a mano, sin librería externa;
ver README) — se revirtió la decisión inicial de esta sección de usar Chart.js/ApexCharts/uPlot.

### Tier 4 — DOMINIO → en los MÓDULOS (no en el core)
POS (canvas, numpad, payment, receipt, KDS) · Manufactura (machine, prodline, QC, batch, OEE,
work-order) · RRHH (time-clock, attendance, perf, shift-cal, payslip) · Comercio (loyalty, ticket,
event-card, product-card). Se construyen en sus módulos reusando los genéricos de arriba.

---

## Limpieza (HECHO, 2026-06 — histórico)

Todo lo listado abajo se retiró: **ninguno de los 24 wrappers existe ya** en `src/components/`.
Se conserva como registro de qué se quitó y por qué (usar Ionic directo).

`ok-button`, `ok-icon`, `ok-input`, `ok-select`, `ok-searchbar`, `ok-badge`, `ok-card`(+familia),
`ok-item`/`ok-list`/`ok-label`, `ok-spinner`, `ok-toggle`, `ok-checkbox`, `ok-chip`, `ok-segment`,
`ok-app-shell`, `ok-sidebar`, `ok-topbar`, `ok-page`, `ok-content`, `ok-split-pane`,
`ok-tabbar`, `ok-modal`, `ok-alert`, `ok-toast`, `ok-action-sheet`.
+ Borrar `ok-utilities.css`, `scripts/gen-utilities.mjs`, `src/theme/UTILITIES.md`.
→ Quitar de `vite.config.ts` (entries), `package.json` (exports), `src/index.ts`, `src/cdn.ts`.
→ Reorientar el showcase: **chrome con Ionic DIRECTO** (`ion-split-pane` + `ion-header`/`ion-toolbar`
  + `ion-menu` + `ion-content` + `ion-list`), y dentro mostrar **nuestros componentes nuevos**
  (`ok-tree`, `ok-inline-feedback`, …) + cómo usarlos sobre Ionic. **Ionic es la base principal**;
  nada de los wrappers retirados.

**Se conserva**: `ok-data-table`, `src/store/*` (+ `ok-store`), `ok-navbar`/`ok-footer`/`ok-hero`.
(Los contenedores pasaron a CSS plano en `layout.css`; los WC `ok-container`/`ok-container-full`
se eliminaron.)

---

## Plan de ejecución (CERRADO — histórico)

Todos los pasos se ejecutaron; se conserva como registro del orden que se siguió.

1. **(Hecho)** Esta lista, en el repo.
2. **(Hecho)** `ok-data-table` + **limpieza** (retirar wrappers + utilities) + reorientar showcase.
3. **(Hecho)** Patrón base de componente (estructura, theming por tokens `--ok-*`) con `ok-tree`
   como piloto.
4. **(Hecho)** Tier 0 + Tier 1 (`tree`, `inline-feedback`, `calendar`, `kanban`, `stepper/wizard`,
   `kpi`/`stat`/`empty-state`…).
5. **(Hecho)** Tier 2 y 3. Dominio (Tier 4) → en sus módulos, como se decidió.
