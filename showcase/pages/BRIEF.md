# Brief — Páginas de ejemplo «ERPlora Cloud» en el showcase de OutfitKit

Recreamos, en el showcase de OutfitKit, las vistas de gestión de hubs del prototipo
`erplora.github.io/ux`. **Replicamos la ESTRUCTURA/layout, NO los colores** (los colores
salen del tema Ionic). **Todo con componentes Ionic (`ion-*`) y OutfitKit (`ok-*`)** —
nada de CSS de marca a mano, nada de las clases `ux-*` de la referencia.

## Tu entregable
Un único fichero: `showcase/pages/<id>.html`. **No edites ningún fichero compartido**
(`_page.js`, `_shell.css`, `pages-data.js`, `app.js`). Copia la estructura de
`_template.html` y rellena `definePage({...})`.

## Fuentes para tu vista
- HTML de referencia (estructura exacta, fuente de verdad): `/tmp/ux-ref/previews/<ruta>.html`
- Screenshot de referencia: `/Users/ioan.beilic/workspace/code/ERPlora/ux-<nombre>.png`
- Lee AMBOS antes de construir.

## El shell ya está hecho — tú solo construyes el `body`
`definePage({ active, search, body, setup })` monta el app-shell Ionic (sidebar Cloud +
topbar + tab-bar móvil). Tú pasas:
- `active`: id de nav activo (`'hubs'` para casi todas; `'users'` para users/invite).
- `search`: placeholder del buscador de la topbar.
- `body`: **string HTML** del contenido (empieza por la cabecera de página y sigue con las secciones).
- `setup(doc)`: wiring JS tras montar — asigna props de objeto/array a los `ok-*`
  (`.values`, `.steps`, `.columns`, `.rows`, `.suggestions`…) y listeners de
  `ion-segment`/`ion-toggle`. **CSP estricta: cero handlers inline (`onclick=`),
  cero `eval`/`new Function`.** Usa `doc.querySelector(...).addEventListener(...)`.

## Helpers de layout disponibles (en `_shell.css`, úsalos en el body)
`.page-wrap` ya envuelve el body. Rejillas: `.pg-grid` + `.pg-grid-2|3|4`; dos columnas
`.pg-cols` (2fr/1fr, colapsa en móvil); barra de filtros `.pg-toolbar` (+`.pg-spacer`);
`.pg-stack` (columna con gap); `.pg-row`; utilidades `.pg-muted`, `.pg-mb-4`, `.pg-mt-2`.
Son responsive. Para geometría puntual puedes usar `style="..."` (sin handlers).

## Mapeo de componentes (REUTILIZAR antes de crear — no inventes nuevos)
| En la referencia | Usa |
|---|---|
| Cabecera de página (título + sub + acciones) | `<ok-page-header heading="…" description="…">` + botones en `slot="actions"` |
| Tarjetas KPI (label/valor/delta) | `<ok-kpi label="…" value="…" delta="…" trend="up\|down\|flat" icon="…">` |
| Tabs (Activos/Pendientes…) | `<ion-segment>` + `<ion-segment-button>` |
| Chips de filtro (Todos 7, Producción 5…) | `<ion-chip>` (con `<ion-badge>` para el contador) |
| Tabla rica (usuarios) | `<ok-data-table>` con `.columns`/`.rows` por JS en `setup` (ver API abajo) |
| Mini-gráfico de líneas | `<ok-sparkline>` con `.values=[…]` por JS |
| Badge de estado (Running, Inactivo…) | `<ion-badge color="success\|warning\|danger\|medium">` o `<ok-status-pill tone dot label>` |
| Banner / callout (política, info) | `<ok-inline-feedback tone="warning\|info" heading="…">texto</ok-inline-feedback>` |
| Stepper del wizard (Crear hub) | `<ok-stepper>` con `.steps=[…]` y `current=N` por JS |
| Entrada de emails (invitar) | `<ok-tag-input>` con `.value=[…]`/`.suggestions=[…]` por JS |
| Código QR | `<ok-qr value="https://…" size="200">` |
| Avatar (iniciales) | `<ok-avatar name="…" size="sm">` |
| Estado vacío | `<ok-empty-state icon heading message>` |
| Tarjeta genérica/sección | `<ion-card>` + `<ion-card-header>`/`<ion-card-content>` |
| Botones | `<ion-button>` (`fill="outline\|clear"`, `size="small"`, `color="danger"`) |
| Inputs/selects/textarea | `<ion-input>`, `<ion-select>`+`<ion-select-option>`, `<ion-textarea>` (con `label`/`label-placement="stacked"`) |
| Toggles | `<ion-toggle>` |
| Radios (tipo de hub, rol) | `<ion-radio-group>` + `<ion-radio>` (envuélvelos en `<ion-card>` para el look "radio card") |
| Toggle vista grid/lista | `<ion-segment>` con dos `ion-segment-button` de icono |

## APIs concretas de los ok-* que más se usan
- **ok-data-table**: `el.columns = [{ key, label, sortable?, render?(row, {h}) }]`; `el.rows = [...]`;
  atributos útiles: `fill`, `search-placeholder`. Para celdas ricas usa `render: (r, {h}) => h\`...\``
  (h = lit html, disponible si importas, pero más simple: usa `render` devolviendo un nodo o string).
  Mira el ejemplo real en `showcase/components-data.js` (busca `id: 'ok-data-table'`).
- **ok-kpi**: atributos `label`, `value`, `delta`, `trend` (`up`/`down`/`flat`), `icon`.
- **ok-page-header**: `heading`, `description`, `level` (1/2), `compact`; acciones en `slot="actions"`.
- **ok-stepper**: `.steps = [{ label, description? }]`, `current` (0-based).
- **ok-tag-input**: `.value = ['a@b.com']`, `.suggestions = [...]`, `placeholder`.
- **ok-sparkline**: `.values = [..]`, `type` (`line`/`bar`), `filled`, `width`, `height`, `color`.
- **ok-status-pill**: `tone` (success/warning/danger/info/neutral), `dot`, `label`, `icon`, `size`.
- **ok-inline-feedback**: `tone`, `heading`, `icon`, `dismissible`; texto por slot; acciones en `slot="actions"`.
- **ok-qr**: `value`, `size`, `ec`.
- **ok-avatar**: `name`, `email`, `size` (sm/md/lg), `tone` (primary/auto), `status`.

## Calidad
- Fidelidad de **estructura**: mismas secciones, mismo orden, mismas columnas/tarjetas que el screenshot.
- Datos: copia los textos/valores de la referencia (nombres de hubs, métricas, etc.).
- Responsive: usa los helpers `.pg-*`; el resultado debe verse bien en desktop y móvil.
- Idioma: español.
- No toques colores (sin `--ion-color-*` a mano, sin hex de marca). Estructura y tipografía vía Ionic/ok-*.

Cuando termines, devuelve: ruta del fichero creado + resumen de qué secciones montaste y con qué componentes.
