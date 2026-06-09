# OutfitKit — Lista de construcción (giro 2026-06)

## Enfoque (decidido)

OutfitKit = **librería de Web Components que Ionic NO tiene**, construidos *con* primitivos de Ionic
+ estilos, **responsive**. NO wrappers de lo que Ionic ya da (botones, layout, app-shell, inputs…).

Fuente de inspiración: catálogo **`ERPlora/ux`** (https://erplora.github.io/ux/), 90 componentes.

### Estado (2026-06-09) — BACKLOG COMPLETO, 41 componentes en el docs-app

**Construidos** (Tier 0–3): navbar (offcanvas móvil), footer, hero, container(-full), contact-form ·
data-table, tree, sparkline, inline-feedback, empty-state, kpi, stat, stepper, wizard, calendar,
kanban, scheduler, chat, timeline · combo, tag-input, rating, otp, pinpad, currency, phone,
dropzone, qty-stepper, color-picker · app-launcher, split-button, menubar, command-palette ·
qr, carousel, signature, audio, video, pdf · store.
Docs-app estilo `ux` (sidebar+búsqueda, viewport, temas — ERPlora terracota por defecto, claro/oscuro).

**Descartados (decisión)**: charts (chart/donut/gauge → librería externa: Chart.js/ApexCharts/uPlot),
`radio-card` (no necesario), `tooltip` (usar `ion-popover`). No quedan pendientes en el backlog.

### Decisiones
- **Retirar YA** los wrappers redundantes (lista en §Limpieza). Se usa Ionic directo para todo lo que
  Ionic ya da.
- **Dominio (POS/industria/RRHH/comercio) → vive en los MÓDULOS** de negocio, reusando los
  genéricos. El core de OutfitKit = solo genéricos + web/marketing.
- **`ok-utilities.css` → DESCARTADO** (Ionic ya expone sus utilidades). Borrar CSS + generador + doc.
- **Estilos / Tailwind**: se puede **autorar** con Tailwind si hace falta para que quede bien, PERO
  al compilar cada componente debe ser **AUTOCONTENIDO** (CSS inlined en su shadow DOM). El
  consumidor **no** importa Tailwind para usar el componente.
- **Convención responsive**: por defecto cada componente ocupa el **ancho máximo de su contenedor**
  (block, width 100%) y es responsive (desktop + móvil).
- Mantener: **`ok-data-table`** (en curso), el **store** (`@outfitkit/core/store`), y el **chrome
  web/marketing** (navbar, footer, hero, container, contact-form).

---

## Backlog de construcción (lo que hay que crear)

> Marca `[x]` al completar. Prefijo `ok-`. Todos: responsive, ancho máx. del contenedor, autocontenido.

### Tier 0 — Web / marketing (Ionic no cubre la web pública)
- [ ] `ok-navbar` — navbar responsive con burger (existe; revisar/pulir)
- [ ] `ok-footer` — pie de página (existe; revisar/pulir)
- [ ] `ok-hero` — hero de cabecera (existe; revisar)
- [ ] `ok-container` / `ok-container-full` — contenedores (existen; revisar)
- [ ] `ok-contact-form` — formulario de contacto responsive (NUEVO)

### Tier 1 — genéricos núcleo
- [ ] `ok-tree` — árbol expandible ⭐
- [ ] `ok-inline-feedback` — banners / callouts (info/warn/danger/ok) ⭐
- [ ] `ok-calendar` — calendario mes/semana/agenda ⭐
- [ ] `ok-kanban` — tablero de tareas (columnas + tarjetas, drag) ⭐
- [ ] `ok-timeline` — línea de tiempo
- [ ] `ok-tooltip` — tooltip (Ionic NO lo tiene)
- [ ] `ok-command-palette` — Cmd+K / paleta de comandos
- [ ] `ok-stepper` / `ok-wizard` — asistente multi-paso
- [ ] `ok-kpi` — tarjeta KPI
- [ ] `ok-stat` — estadística / métrica
- [ ] `ok-empty-state` — estado vacío
- [ ] `ok-app-launcher` — botón estilo "Google apps" (icono cuadrícula 3×3) que abre una rejilla de accesos/apps en un popover
- [x] `ok-data-table` — tabla rica (look `/employees`) — **EN CURSO**

### Tier 2 — inputs que faltan
- [ ] `ok-combo` / `ok-autocomplete` — combobox con búsqueda
- [ ] `ok-tag-input` — entrada de chips/tags
- [ ] `ok-rating` — estrellas
- [ ] `ok-otp` — código de un solo uso
- [ ] `ok-pinpad` — teclado PIN
- [ ] `ok-color-picker` — selector de color
- [ ] `ok-currency` — input monetario con máscara
- [ ] `ok-phone` — input de teléfono con prefijo país
- [ ] `ok-dropzone` — subida drag & drop
- [ ] `ok-qty-stepper` — +/− cantidad
- [ ] `ok-split-button` — botón con acción + menú
- [ ] `ok-sparkline` — mini-gráfico en línea

### Tier 3 — visualización / multimedia
- ~~`ok-chart` / `ok-donut` / `ok-gauge`~~ — **DESCARTADO**: para gráficos se usa una librería
  externa (Chart.js / ApexCharts / uPlot…); no se reinventan como WC. (`ok-sparkline`, ya hecho,
  cubre el mini-gráfico ligero en SVG.)
- [ ] `ok-chat` — hilo de mensajes ⭐ (importante)
- [ ] `ok-qr` — generador de QR
- [ ] `ok-carousel` — carrusel (Ionic recomienda Swiper aparte)
- [ ] `ok-signature` — firma en canvas
- [ ] `ok-audio` / `ok-video` / `ok-pdf` — visores multimedia
- [ ] `ok-scheduler` — agenda de turnos/recursos
- [ ] `ok-chat` — hilo de mensajes
- [ ] `ok-menubar` — barra de menú desktop

### Tier 4 — DOMINIO → en los MÓDULOS (no en el core)
POS (canvas, numpad, payment, receipt, KDS) · Manufactura (machine, prodline, QC, batch, OEE,
work-order) · RRHH (time-clock, attendance, perf, shift-cal, payslip) · Comercio (loyalty, ticket,
event-card, product-card). Se construyen en sus módulos reusando los genéricos de arriba.

---

## Limpieza (retirar YA — usar Ionic directo)
`ok-button`, `ok-icon`, `ok-input`, `ok-select`, `ok-searchbar`, `ok-badge`, `ok-card`(+familia),
`ok-item`/`ok-list`/`ok-label`, `ok-spinner`, `ok-toggle`, `ok-checkbox`, `ok-chip`, `ok-segment`,
`ok-app-shell`, `ok-sidebar`, `ok-topbar`, `ok-page`, `ok-content`, `ok-split-pane`, `ok-menu`,
`ok-tabbar`, `ok-modal`, `ok-alert`, `ok-toast`, `ok-action-sheet`.
+ Borrar `ok-utilities.css`, `scripts/gen-utilities.mjs`, `src/theme/UTILITIES.md`.
→ Quitar de `vite.config.ts` (entries), `package.json` (exports), `src/index.ts`, `src/cdn.ts`.
→ Reorientar el showcase: **chrome con Ionic DIRECTO** (`ion-split-pane` + `ion-header`/`ion-toolbar`
  + `ion-menu` + `ion-content` + `ion-list`), y dentro mostrar **nuestros componentes nuevos**
  (`ok-tree`, `ok-inline-feedback`, …) + cómo usarlos sobre Ionic. **Ionic es la base principal**;
  nada de los wrappers retirados.

**Se conserva**: `ok-data-table`, `src/store/*` (+ `ok-store`), `ok-navbar`/`ok-footer`/`ok-hero`/
`ok-container`/`ok-container-full`.

---

## Plan de ejecución
1. **(Hecho)** Esta lista, en el repo.
2. Esperar al worker de `ok-data-table`; luego **limpieza** (retirar wrappers + utilities) +
   reorientar showcase + build limpio + commit/push.
3. Definir el **patrón base** de un componente nuevo (estructura, theming por tokens `--ok-*`,
   pipeline Tailwind→CSS autocontenido si se adopta) con `ok-tree` como piloto.
4. Construir Tier 0 + Tier 1 (empezando por `tree`, `inline-feedback`, `calendar`, `kanban`,
   `tooltip`, `stepper/wizard`, `kpi`/`stat`/`empty-state`).
5. Tier 2 y 3. Dominio (Tier 4) en sus módulos.
