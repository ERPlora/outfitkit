# Roadmap / Backlog — OutfitKit + sistema de módulos ERPlora

> 🔴 **ARCHIVADO / HISTÓRICO — premisa revertida.** Este documento describe una estrategia de
> **wrappers `ok-*` 1:1 sobre Ionic** (`ok-button`, `ok-icon`, `ok-input`, `ok-select`,
> `ok-searchbar`, `ok-modal`, `ok-alert`, `ok-list`/`ok-item`, `ok-tabbar`, `ok-app-shell`…) que se
> **decidió retirar** (ver [`CLAUDE.md`](CLAUDE.md) y [`docs/PLAN-COMPONENTES.md`](docs/PLAN-COMPONENTES.md)
> §"Limpieza — retirar YA"): OutfitKit **NO** envuelve los primitivos de Ionic — se usa `ion-*`
> directo para botón/icono/input/select/searchbar/modal/list/tabs/layout — y ya está ejecutado
> (ninguno de esos `ok-*` existe en `src/components/`; `ok-data-table` usa `ion-button`/`ion-icon`
> nativos por dentro). El roadmap **vivo** es [`docs/PLAN-COMPONENTES.md`](docs/PLAN-COMPONENTES.md).
> Se conserva este fichero solo como referencia histórica de lo ya hecho (sección "Hecho" al final);
> no lo uses para priorizar trabajo nuevo.
>
> Última actualización: 2026-06-08 (sin tocar desde entonces — de ahí la deriva).

## Estado actual (de dónde partimos)

- **OutfitKit canónico = `ERPlora/outfitkit/`** (`@erplora/outfitkit`): set `ok-*` que envuelve Ionic.
  Es la **fuente de verdad**; se re-vendoriza a `hub/packages/outfitkit` (mirror, `@erplora/outfitkit`)
  y a `saas/.../vendor/outfitkit` (`vendor-frontend.sh`).
- **`ok-data-table` consolidado en el canónico** usando **`ok-button`** (no `ion-button`). Tiene:
  drawer lateral de filtros+alta/edición, modo `fill` (scroll interno + thead sticky + pager fijo),
  `render` de celda, `columnPicker`, CSV import/export, page-size, vista lista/tarjetas.
- **`module-toolkit`** (CLI estilo Ionic): `startproject` · `g module/view/command/query` · `dev`
  (preview con mock + CSP) · `build` · `validate` · `pack`/`sign` · `publish` (guía).
- **`modules-workspace`**: N módulos POS (ver `ls modules-workspace/modules`); **inventory = módulo
  de referencia** (Dashboard · Products · Categories · Settings).
- `pnpm -F @erplora/web verify` (Hub) en VERDE.

---

## ⭐ PRIORIDAD 1 — Acabar OutfitKit (`@erplora/outfitkit`)

Objetivo: cobertura **completa `ok-*`** y que el data-table no use `ion-*` por dentro.

### 1.1 Migrar los `ion-*` internos del `ok-data-table` → `ok-*`
- [x] `ion-button` → **`ok-button`** (hecho).
- [ ] `ion-searchbar` → `ok-searchbar` (ya existe).
- [ ] `ion-icon` → `ok-icon` (carets de orden, etc.) (ya existe).
- [ ] `ion-input` → `ok-input` (controles de filtro del drawer) (ya existe).
- [ ] `ion-select` → `ok-select` (filtro `select` + multiselect "Columnas") (ya existe).
- [ ] Verificar que tras migrar siguen funcionando filtros / orden / búsqueda / page-size
      (eventos normalizados `ok-*` vía `base/relay.ts`).

### 1.2 Wrappers `ok-*` que faltan (los necesita el data-table / el módulo de referencia)
- [ ] **`ok-modal`** (lo usa el detalle de producto + futuros formularios overlay).
- [ ] **`ok-alert` / `ok-dialog`** de confirmación (Settings usa hoy un diálogo inline; sustituir).
- [ ] **`ok-list` / `ok-item` / `ok-label`** (settings, inspector, listas).
- [ ] **`ok-content` / `ok-header` / `ok-toolbar`** (o ampliar `ok-page`) para el chrome de vista.
- [ ] **`ok-tabbar`** (sub-nav inferior de módulo: iconos + label, métrica IonTabs — hoy `ion-segment`+CSS).
- [ ] Revisar el resto de `ion-*` que aparezcan en uso real y crear su `ok-*` (regla incremental).

### 1.3 `ok-button`
- [x] prop `icon` → botón icon-only.
- [ ] (opcional) propagar `aria-label`/`title` al `ion-button` interno (a11y).

### 1.4 API del `ok-data-table` — reconciliar nombres (decisión del humano)
- [ ] Al consolidar se **descartó** la versión paralela del canónico que usaba
      `column-selector` / `views: DataTableView[]` / `exportable`+`importable` / `pageSizes`.
      La versión actual usa `columnPicker` / `views` (boolean) / `csv`+`csvName` / `pageSizeOptions`.
      **Decidir los nombres definitivos** de la API pública (es columna del humano) y unificar.
- [ ] `DataTableView` quedó como `'table' | 'cards'`.

### 1.5 Showcase / docs / publicación
- [ ] Añadir `ok-data-table` (con props nuevas: `fill`, `addable`, `views`, `columnPicker`, `csv`,
      `pageSizeOptions`, `render` de celda, drawer) al **showcase** (`showcase/components.html`).
- [ ] Documentar API de `ok-data-table` y `ok-button` en README + `docs/CONVENTIONS.md`.
- [ ] CI: `typecheck` + `verify:csp` + `build`.
- [ ] Publicar **npm `@erplora/outfitkit`** + **GitHub Pages** (showcase).

---

## PRIORIDAD 2 — Que los consumidores usen SOLO `ok-*`

### 2.1 Módulo de referencia `inventory` → solo `ok-*`
- [ ] `erp-inventory-*`: `ion-input` / `ion-button` / `ion-toggle` / `ion-modal` / `ion-list` /
      `ion-item` / `ion-icon` / `ion-content` / `ion-header` / `ion-toolbar` → equivalentes `ok-*`.
- [ ] Settings: usar `ok-alert`/`ok-modal` cuando existan (hoy diálogo inline).

### 2.2 `dev` preview (`module-toolkit`) → shell con `ok-*`
- [ ] Reemplazar el shell (CSS flex + `ion-*`) del harness por **`ok-app-shell` + `ok-sidebar` +
      `ok-topbar` + `ok-segment`** (ya existen en el canónico).
- [ ] Sincronizar la pestaña activa del `ion-segment`/`ok-tabbar` al cambiar de vista por código
      (el clic real ya funciona).

---

## PRIORIDAD 3 — `module-toolkit` / módulos

- [ ] Propagar el patrón **Dashboard + tablas + Settings** al scaffold `g module` y a los otros 24 módulos.
- [ ] `pack`: **firma criptográfica real** (hoy solo SHA256). `publish` **automatizado**
      (auth + subida S3 inmutable + registro Cloud `repos/import`).
- [ ] **Distribución a devs externos** del marketplace (publicar toolkit + outfitkit + module-sdk).
- [ ] **Imprimir código de barras** → integración con el **Bridge** (etiquetadora) en el Hub real
      (hoy `window.open` + `print` en el preview).

---

## Pendiente / housekeeping

- [ ] **Verificar Cloud** tras el re-vendor del OutfitKit (carga `vendor/outfitkit/outfitkit.js` nuevo).
- [ ] **Commits**: nada commiteado todavía — `ERPlora/outfitkit`, los repos de módulo (ver `ls
      modules-workspace/modules`; con `dist` rebuildeado), el mirror `hub/packages/outfitkit`, el
      vendor de Cloud, `module-toolkit`, `modules-workspace`.
- [ ] Borrar/archivar `hub/packages/module-cli` (deprecado → ver su `DEPRECATED.md`).
- [x] `module-sdk`: `ListController.setPageSize()` añadido.

---

## Hecho (referencia rápida de lo logrado en esta tanda)

- Toolkit standalone (build/dev/scaffold/pack) + workspace con los 25 módulos movidos.
- `ok-data-table`: drawer filtros+alta/edición, fill (scroll interno + footer fijo), render de
  celda (ion-toggle verde), columnPicker (multiselect), CSV import/export, page-size, lista/tarjetas.
- inventory: Dashboard (informe) + Products + Categories + Settings (confirmación al cambiar) +
  detalle con **código de barras Code128** imprimible.
- Tabs inferiores estilo IonTabs del Hub (icono + label).
- **Consolidación OutfitKit**: data-table → canónico + `ok-button`; re-apuntado toolkit/módulos a
  `file:../outfitkit`; re-vendorizado a hub + cloud; `verify` VERDE.
