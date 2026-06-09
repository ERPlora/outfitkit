/* components-data.js — Registro de componentes del DOCS-APP de OutfitKit.
 *
 * Cada entrada describe UN componente ok-* (o la API store):
 *   { id, name, category, desc, importPath,
 *     example  : string HTML estático que se inyecta en el marco de preview,
 *     setup?   : (rootEl, ctx) => void  — cablea props array/objeto/función por JS
 *                tras insertar `example` (lo que NO se puede expresar en HTML),
 *     code     : string snippet de uso a mostrar en la pestaña «Código»,
 *     api?     : [{ kind:'prop'|'event'|'slot', name, type, detail }] }
 *
 * IMPORTANTE (CSP estricta, script-src 'self'): `example` es HTML ESTÁTICO que se
 * inserta con innerHTML (sin <script>, sin handlers inline) y luego `setup` cablea por
 * JS. NUNCA eval / new Function. Los ejemplos están minados del showcase clásico
 * (components.html / index.html) para no reinventarlos.
 *
 * `ctx.h` es el `html` tagged-template de Lit (para renders de celda/tarjeta).
 */

const CATEGORIES = [
  { id: 'datos', label: 'Datos', icon: 'analytics-outline' },
  { id: 'feedback', label: 'Feedback', icon: 'alert-circle-outline' },
  { id: 'dashboard', label: 'Dashboard', icon: 'speedometer-outline' },
  { id: 'flujo', label: 'Flujo', icon: 'git-branch-outline' },
  { id: 'inputs', label: 'Inputs', icon: 'create-outline' },
  { id: 'acciones', label: 'Acciones', icon: 'flash-outline' },
  { id: 'formularios', label: 'Formularios', icon: 'document-text-outline' },
  { id: 'web', label: 'Web', icon: 'globe-outline' },
  { id: 'multimedia', label: 'Multimedia', icon: 'film-outline' },
  { id: 'estado', label: 'Estado', icon: 'cube-outline' },
];

// ── Datos compartidos por las demos ─────────────────────────────────────────
const STAFF_ROWS = [
  { id: '1', name: 'Demo Admin', email: 'demo@erplora.com', role: 'Administrador', status: 'Activo', createdAt: '2025-01-12' },
  { id: '2', name: 'María López', email: 'maria@erplora.com', role: 'Encargado', status: 'Activo', createdAt: '2025-02-03' },
  { id: '3', name: 'Juan Pérez', email: 'juan@erplora.com', role: 'Cajero', status: 'Activo', createdAt: '2025-02-20' },
  { id: '4', name: 'Ana Ruiz', email: 'ana@erplora.com', role: 'Almacén', status: 'Inactivo', createdAt: '2025-03-15' },
  { id: '5', name: 'Luis Gómez', email: 'luis@erplora.com', role: 'Camarero', status: 'Activo', createdAt: '2025-04-09' },
  { id: '6', name: 'Sara Díaz', email: 'sara@erplora.com', role: 'Cocina', status: 'Activo', createdAt: '2025-05-01' },
];

const WIZARD_STEPS = [
  { label: 'Negocio', description: 'Datos básicos' },
  { label: 'Módulos', description: 'Elige tu set' },
  { label: 'Listo', description: 'Confirmar' },
];

// Helpers de fecha relativos al mes actual (para ok-calendar).
const _now = new Date();
const _ymd = (n) => {
  const d = new Date(_now.getFullYear(), _now.getMonth(), n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const COMPONENTS = [
  // ════════════════════════════════ DATOS ════════════════════════════════
  {
    id: 'ok-data-table',
    name: 'ok-data-table',
    category: 'datos',
    desc: 'Tabla rica con toolbar consolidada en una línea: buscador, filtros en línea (select / rango de fechas), tamaño de página, vistas tabla/tarjetas, export/import CSV, menú «⋮» y acción primaria. Celdas a medida (avatar, badges, sparkline, total con color), orden, selección y paginación numerada. Port 1:1 del antiguo <data-table>.',
    importPath: "@outfitkit/core/ok-data-table",
    example: '<ok-data-table id="dt" style="display:block" fill></ok-data-table>',
    setup: (root, { h }) => {
      const eur = (n) => (n < 0 ? '−' : '') + '€' + Math.abs(n).toLocaleString('es-ES', { minimumFractionDigits: 2 });
      const ESTADO = { 'Pagado': 'success', 'Procesando': 'warning', 'Reembolso': 'danger', 'Pendiente envío': 'medium' };
      // OJO: `color="success"` NO funciona dentro del Shadow DOM del data-table (las clases globales
      // .ion-color-* no penetran). Se colorea con CSS vars inline (sí heredan): tinte suave + texto.
      const estadoBadge = (s) => {
        const c = ESTADO[s] ?? 'medium';
        return h`<ion-badge style="--background:color-mix(in srgb, var(--ion-color-${c}) 15%, transparent);--color:var(--ion-color-${c});--padding-top:5px;--padding-bottom:5px">${s}</ion-badge>`;
      };
      // Superficies derivadas con color-mix sobre el texto del tema (adapta a claro/oscuro); NO usar
      // --ion-color-step-* directo: puede no estar definido en algunos temas y romper el dark.
      const canalChip = (c) => h`<ion-chip style="--background:color-mix(in srgb, var(--ion-text-color) 8%, transparent);height:24px;font-size:12px;margin:0">${c}</ion-chip>`;
      const avatar = (r) => h`<span style="display:inline-flex;align-items:center;gap:.55rem;min-width:0">
        <span style="flex:0 0 auto;display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:color-mix(in srgb, var(--ion-text-color) 14%, transparent);font-size:12px;font-weight:700">${r.initials}</span>
        <span style="min-width:0"><span style="display:block;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.customer}</span>
        <span style="display:block;font-size:12px;color:var(--ion-color-medium)">${r.sub}</span></span></span>`;
      const trend = (r) => h`<ok-sparkline .values=${r.trend} filled width="92" height="28" color=${r.trend.at(-1) < r.trend[0] ? 'var(--ion-color-danger)' : 'var(--ion-color-success)'}></ok-sparkline>`;
      const total = (r) => h`<span style="font-weight:700;color:${r.total < 0 ? 'var(--ion-color-danger)' : 'inherit'}">${eur(r.total)}</span>`;
      const ORDERS = [
        { id: 'PED-2041', customer: 'Marina Ribó', initials: 'MR', sub: 'Habitual · 24 pedidos', canal: 'POS · Local', estado: 'Pagado', total: 324.5, fecha: '2025-10-18', trend: [3, 5, 4, 6, 7, 6, 9] },
        { id: 'PED-2040', customer: 'Joaquín Gómez', initials: 'JG', sub: 'Nuevo', canal: 'Web', estado: 'Procesando', total: 186.0, fecha: '2025-10-18', trend: [2, 3, 5, 4, 6, 8, 7] },
        { id: 'PED-2039', customer: 'Eva Linares', initials: 'EL', sub: 'VIP · 5 años', canal: 'App', estado: 'Reembolso', total: -42.0, fecha: '2025-10-17', trend: [8, 7, 6, 5, 4, 3, 2] },
        { id: 'PED-2038', customer: 'Roberto Pinto', initials: 'RP', sub: 'Habitual', canal: 'Web', estado: 'Pagado', total: 312.8, fecha: '2025-10-17', trend: [4, 4, 5, 5, 6, 6, 7] },
        { id: 'PED-2037', customer: 'Sara Caamaño', initials: 'SC', sub: 'Nuevo', canal: 'POS · Local', estado: 'Pendiente envío', total: 68.0, fecha: '2025-10-16', trend: [5, 5, 4, 6, 5, 6, 6] },
        { id: 'PED-2036', customer: 'Pablo Núñez', initials: 'PN', sub: 'Habitual', canal: 'App', estado: 'Pagado', total: 152.4, fecha: '2025-10-16', trend: [3, 4, 4, 5, 6, 6, 7] },
        { id: 'PED-2035', customer: 'Lucía Vega', initials: 'LV', sub: 'Nuevo', canal: 'Web', estado: 'Procesando', total: 99.9, fecha: '2025-10-15', trend: [2, 2, 3, 4, 4, 5, 6] },
        { id: 'PED-2034', customer: 'Diego Mora', initials: 'DM', sub: 'VIP · 3 años', canal: 'POS · Local', estado: 'Pagado', total: 540.0, fecha: '2025-10-15', trend: [6, 7, 7, 8, 8, 9, 10] },
        { id: 'PED-2033', customer: 'Inés Castro', initials: 'IC', sub: 'Habitual', canal: 'App', estado: 'Reembolso', total: -18.5, fecha: '2025-10-14', trend: [7, 6, 6, 5, 4, 4, 3] },
      ];
      const dt = root.querySelector('#dt');
      dt.title = 'Pedidos';
      dt.rowKey = (r) => r.id;
      dt.selectable = true;
      dt.inlineFilters = true;
      dt.columns = [
        { key: 'id', header: 'Pedido', width: '8rem', render: (r) => h`<span style="font-weight:600">#${r.id}</span>` },
        { key: 'customer', header: 'Cliente', width: 'minmax(13rem,1.4fr)', render: avatar },
        { key: 'canal', header: 'Canal', width: '9rem', filterable: true, filterType: 'select',
          options: ['POS · Local', 'Web', 'App'].map((v) => ({ value: v, label: v })), render: (r) => canalChip(r.canal) },
        { key: 'estado', header: 'Estado', width: '10rem', filterable: true, filterType: 'select',
          options: Object.keys(ESTADO).map((v) => ({ value: v, label: v })), render: (r) => estadoBadge(r.estado) },
        { key: 'trend', header: 'Tendencia 7D', width: '8rem', sortable: false, render: trend },
        { key: 'total', header: 'Total', width: '8rem', align: 'right', render: total },
        { key: 'fecha', header: 'Fecha', width: '9rem', filterable: true, filterType: 'daterange' },
      ];
      dt.rows = ORDERS;
      dt.searchKeys = ['id', 'customer', 'sub'];
      dt.pageSize = 5;
      dt.pageSizes = [5, 10, 25, 50];
      dt.views = ['table', 'cards'];
      dt.primaryAction = { label: 'Nuevo', icon: 'add' };
      dt.actions = [
        { id: 'view', label: 'Ver', icon: 'eye-outline' },
        { id: 'edit', label: 'Editar', icon: 'create-outline' },
        { id: 'delete', label: 'Borrar', icon: 'trash-outline', color: 'danger' },
      ];
      dt.menuActions = [
        { id: 'export', label: 'Exportar CSV', icon: 'download-outline' },
        { id: 'import', label: 'Importar CSV', icon: 'cloud-upload-outline' },
        { id: 'print', label: 'Imprimir', icon: 'print-outline' },
      ];
      dt.cardIcon = () => 'receipt-outline';
      dt.cardTitle = (r) => h`#${r.id} · ${r.customer}`;
      dt.renderCard = (r) => h`<div class="rrow"><span class="rk">Total</span><span class="rv">${total(r)}</span></div>
        <div class="rrow"><span class="rk">Canal</span><span class="rv">${r.canal}</span></div>
        <div class="rrow"><span class="rk">Estado</span><span class="rv">${estadoBadge(r.estado)}</span></div>
        <div class="rrow"><span class="rk">Fecha</span><span class="rv">${r.fecha}</span></div>`;
    },
    code: `dt.columns = [{ key: 'estado', header: 'Estado', filterable: true, filterType: 'select', options: […], render: estadoBadge }, …];
dt.rows = […];
dt.inlineFilters = true;          // filtros (select / daterange) en la toolbar
dt.selectable = true;
dt.views = ['table', 'cards'];
dt.pageSizes = [5, 10, 25, 50];   // selector de filas/pág. en la toolbar
dt.primaryAction = { label: 'Nuevo', icon: 'add' };
dt.actions = [{ id: 'edit', label: 'Editar', icon: 'create-outline' }];
dt.menuActions = [{ id: 'export', label: 'Exportar CSV', icon: 'download-outline' }];
dt.addEventListener('rowAction', (e) => …);   // { actionId, row }
dt.addEventListener('menuAction', (e) => …);  // { actionId }`,
    api: [
      { kind: 'prop', name: '.columns', type: 'DataTableColumn[]', detail: '{key, header, format?, align?, sortable?, filterable?, filterType?, options?, render?, hidden?, width?}' },
      { kind: 'prop', name: '.rows', type: 'object[]', detail: 'Filas a mostrar' },
      { kind: 'prop', name: '.searchKeys', type: 'string[]', detail: 'Campos sobre los que busca el searchbar' },
      { kind: 'prop', name: 'inlineFilters', type: 'bool', detail: 'Filtros (select / daterange) en la toolbar en vez del drawer' },
      { kind: 'prop', name: '.menuActions', type: 'DataTableAction[]', detail: 'Menú overflow «⋮» → emite menuAction' },
      { kind: 'prop', name: '.pageSizes · pageSize', type: 'number[] · number', detail: 'Selector de filas/pág. en la toolbar · filas por página' },
      { kind: 'prop', name: '.actions', type: 'DataTableAction[]', detail: '{id, label, icon?, color?} por fila' },
      { kind: 'prop', name: '.views', type: 'string[]', detail: "['table','cards']" },
      { kind: 'prop', name: 'title · selectable · .rowKey', type: 'string · bool · fn|string', detail: 'Título, selección, clave estable' },
      { kind: 'prop', name: '.primaryAction', type: '{label, icon?}', detail: 'Botón destacado de la topbar' },
      { kind: 'prop', name: '.cardTitle · .cardIcon · .renderCard', type: 'fn', detail: 'Render de la vista «cards»' },
      { kind: 'event', name: 'rowAction · menuAction', type: '{actionId, row?}', detail: 'Acción de fila · ítem del menú «⋮»' },
      { kind: 'event', name: 'primaryAction · selectionChange', type: '· {keys}', detail: 'Acción primaria · cambio de selección' },
      { kind: 'event', name: 'pageChange · sortChange · searchChange · filterChange · viewChange', type: 'varios', detail: 'Eventos de interacción' },
      { kind: 'slot', name: 'toolbar', type: '—', detail: 'Controles extra en la topbar' },
    ],
  },
  {
    id: 'ok-tree',
    name: 'ok-tree',
    category: 'datos',
    desc: 'Árbol expandible por datos, render recursivo con indentación por nivel. Ionic no trae un tree.',
    importPath: "@outfitkit/core/ok-tree",
    example: '<ok-tree id="tree" selectable active-id="b"></ok-tree>',
    setup: (root) => {
      const tree = root.querySelector('#tree');
      tree.nodes = [
        { id: 'a', label: 'Catálogo', icon: 'cube-outline', expanded: true, children: [
          { id: 'b', label: 'Productos', icon: 'pricetag-outline' },
          { id: 'c', label: 'Categorías', icon: 'folder-outline' },
        ]},
        { id: 'd', label: 'Ventas', icon: 'cart-outline' },
        { id: 'e', label: 'Empleados', icon: 'people-outline' },
      ];
      tree.addEventListener('ok-select', (e) => { tree.activeId = e.detail.id; });
    },
    code: `tree.nodes = [{ id, label, icon?, children?, expanded? }];
tree.selectable = true;
tree.activeId = 'b';
tree.addEventListener('ok-select', (e) => …); // { id, node }`,
    api: [
      { kind: 'prop', name: '.nodes', type: 'OkTreeNode[]', detail: '{id, label, icon?, children?, expanded?, disabled?}' },
      { kind: 'prop', name: 'selectable', type: 'bool', detail: 'Filas clicables / resaltado' },
      { kind: 'prop', name: 'active-id', type: 'string', detail: 'Nodo resaltado' },
      { kind: 'event', name: 'ok-toggle', type: '{id, expanded}', detail: 'Expandir/colapsar' },
      { kind: 'event', name: 'ok-select', type: '{id, node}', detail: 'Selección de nodo' },
    ],
  },
  {
    id: 'ok-sparkline',
    name: 'ok-sparkline',
    category: 'datos',
    desc: 'Mini-gráfico inline (línea o barras) sin ejes, para tendencias junto a un KPI. Sin eventos.',
    importPath: "@outfitkit/core/ok-sparkline",
    example: `<div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
  <ok-sparkline id="sl" type="line" color="primary" width="120" height="36" filled></ok-sparkline>
  <ok-sparkline id="sb" type="bar" color="success" width="120" height="36"></ok-sparkline>
</div>`,
    setup: (root) => {
      root.querySelector('#sl').values = [3, 5, 4, 8, 6, 9, 7, 11, 9];
      root.querySelector('#sb').values = [4, 8, 6, 9, 5, 11, 7, 10];
    },
    code: `spark.values = [3, 5, 4, 8, 6, 9, 7];
spark.type = 'line'; // 'line' | 'bar'
<ok-sparkline type="line" color="primary" width="120" height="36" filled></ok-sparkline>`,
    api: [
      { kind: 'prop', name: '.values', type: 'number[]', detail: 'Serie de datos' },
      { kind: 'prop', name: 'type', type: 'line|bar', detail: 'Forma del gráfico' },
      { kind: 'prop', name: 'color', type: 'string', detail: 'Color (token Ionic o CSS)' },
      { kind: 'prop', name: 'width · height · filled', type: 'number · number · bool', detail: 'Tamaño · relleno bajo la línea' },
    ],
  },

  // ═══════════════════════════════ FEEDBACK ═══════════════════════════════
  {
    id: 'ok-inline-feedback',
    name: 'ok-inline-feedback',
    category: 'feedback',
    desc: 'Banner/callout persistente en el flujo del contenido (Ionic solo trae toast/alert efímeros).',
    importPath: "@outfitkit/core/ok-inline-feedback",
    example: `<div style="display:flex;flex-direction:column;gap:.75rem">
  <ok-inline-feedback tone="info" heading="Información">Tu plan incluye 3 módulos activos.</ok-inline-feedback>
  <ok-inline-feedback tone="success" heading="Guardado">Los cambios se guardaron correctamente.</ok-inline-feedback>
  <ok-inline-feedback tone="warning" heading="Atención" dismissible>Stock bajo en 3 artículos.
    <ion-button slot="actions" size="small" fill="outline">Ver</ion-button>
  </ok-inline-feedback>
  <ok-inline-feedback tone="danger" heading="Error">No se pudo conectar con el Hub.</ok-inline-feedback>
</div>`,
    code: `<ok-inline-feedback tone="warning" heading="Atención" dismissible>
  Stock bajo en 3 artículos.
  <ion-button slot="actions" size="small" fill="outline">Ver</ion-button>
</ok-inline-feedback>`,
    api: [
      { kind: 'prop', name: 'tone', type: 'info|success|warning|danger|neutral', detail: 'Color e icono por defecto' },
      { kind: 'prop', name: 'heading · icon · dismissible', type: 'string · string · bool', detail: 'Título, icono override, botón cerrar' },
      { kind: 'slot', name: '(default) · actions', type: '—', detail: 'Mensaje · botones de acción' },
      { kind: 'event', name: 'ok-dismiss', type: '—', detail: 'Al cerrar' },
    ],
  },
  {
    id: 'ok-empty-state',
    name: 'ok-empty-state',
    category: 'feedback',
    desc: 'Estado centrado para «sin datos / sin resultados», con icono, título, mensaje y acción.',
    importPath: "@outfitkit/core/ok-empty-state",
    example: `<ok-empty-state icon="cart-outline" heading="Sin pedidos" message="Cuando llegue tu primer pedido aparecerá aquí.">
  <ion-button slot="action" size="small">Crear pedido</ion-button>
</ok-empty-state>`,
    code: `<ok-empty-state icon="cart-outline" heading="Sin pedidos"
  message="Cuando llegue tu primer pedido aparecerá aquí.">
  <ion-button slot="action" size="small">Crear pedido</ion-button>
</ok-empty-state>`,
    api: [
      { kind: 'prop', name: 'icon · heading · message', type: 'string', detail: 'Icono, título, mensaje muted' },
      { kind: 'slot', name: '(default) · action', type: '—', detail: 'Contenido extra · acción' },
    ],
  },

  // ═══════════════════════════════ DASHBOARD ══════════════════════════════
  {
    id: 'ok-kpi',
    name: 'ok-kpi',
    category: 'dashboard',
    desc: 'Tarjeta de métrica para dashboards: label, valor grande y delta con flecha y color según tendencia.',
    importPath: "@outfitkit/core/ok-kpi",
    example: `<div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));width:100%">
  <ok-kpi label="Ventas hoy" value="€2.480" delta="+12%" trend="up" icon="cash-outline"></ok-kpi>
  <ok-kpi label="Devoluciones" value="4" delta="-2" trend="down" icon="return-down-back-outline"></ok-kpi>
  <ok-kpi label="Ticket medio" value="€18,10" delta="estable" trend="flat"></ok-kpi>
</div>`,
    code: `<ok-kpi label="Ventas hoy" value="€2.480" delta="+12%" trend="up" icon="cash-outline"></ok-kpi>`,
    api: [
      { kind: 'prop', name: 'label · value · delta', type: 'string', detail: 'Etiqueta, valor, variación' },
      { kind: 'prop', name: 'trend', type: 'up|down|flat', detail: 'Color y flecha del delta' },
      { kind: 'prop', name: 'icon', type: 'string', detail: 'ion-icon junto al label' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido extra (p.ej. sparkline)' },
    ],
  },
  {
    id: 'ok-stat',
    name: 'ok-stat',
    category: 'dashboard',
    desc: 'Métrica inline compacta (más ligera que ok-kpi): label, valor y hint.',
    importPath: "@outfitkit/core/ok-stat",
    example: `<div style="display:flex;gap:2rem;flex-wrap:wrap">
  <ok-stat label="Empleados" value="6" hint="2 inactivos"></ok-stat>
  <ok-stat label="Módulos" value="3" hint="de 5 disponibles"></ok-stat>
  <ok-stat label="Almacenes" value="1"></ok-stat>
</div>`,
    code: `<ok-stat label="Empleados" value="6" hint="2 inactivos"></ok-stat>`,
    api: [
      { kind: 'prop', name: 'label · value · hint', type: 'string', detail: 'Etiqueta, valor, texto secundario' },
    ],
  },

  // ════════════════════════════════ FLUJO ═════════════════════════════════
  {
    id: 'ok-stepper',
    name: 'ok-stepper',
    category: 'flujo',
    desc: 'Indicador de pasos: círculos numerados conectados; completado / activo / pendiente. Compacto en móvil.',
    importPath: "@outfitkit/core/ok-stepper",
    example: '<ok-stepper id="st" current="1" style="display:block;width:100%"></ok-stepper>',
    setup: (root) => { root.querySelector('#st').steps = WIZARD_STEPS; },
    code: `stepper.steps = [{ label, description? }, …];
stepper.current = 1;
stepper.addEventListener('ok-step-select', (e) => …); // { index }`,
    api: [
      { kind: 'prop', name: '.steps', type: 'OkStep[]', detail: '{label, description?}' },
      { kind: 'prop', name: 'current', type: 'number', detail: 'Índice (0-based) activo' },
      { kind: 'event', name: 'ok-step-select', type: '{index}', detail: 'Al pulsar un paso' },
    ],
  },
  {
    id: 'ok-wizard',
    name: 'ok-wizard',
    category: 'flujo',
    desc: 'Asistente multi-paso: stepper + contenido por slots step-0, step-1… + navegación Atrás/Siguiente/Finalizar.',
    importPath: "@outfitkit/core/ok-wizard",
    example: `<ok-wizard id="wz" style="display:block;width:100%">
  <div slot="step-0"><p>Paso 1 — datos del negocio.</p></div>
  <div slot="step-1"><p>Paso 2 — elige módulos.</p></div>
  <div slot="step-2"><p>Paso 3 — confirma y termina.</p></div>
</ok-wizard>`,
    setup: (root) => { root.querySelector('#wz').steps = WIZARD_STEPS; },
    code: `wizard.steps = [{ label: 'Negocio' }, { label: 'Módulos' }, { label: 'Listo' }];
<ok-wizard>
  <div slot="step-0">…</div>
  <div slot="step-1">…</div>
</ok-wizard>
wizard.addEventListener('ok-finish', () => …);`,
    api: [
      { kind: 'prop', name: '.steps · current', type: 'OkStep[] · number', detail: 'Pasos y paso activo' },
      { kind: 'prop', name: 'backLabel · nextLabel · finishLabel', type: 'string', detail: 'Textos de los botones' },
      { kind: 'slot', name: 'step-0, step-1, …', type: '—', detail: 'Contenido de cada paso' },
      { kind: 'event', name: 'ok-step-change · ok-finish', type: '{index} · —', detail: 'Cambio de paso · finalizar' },
    ],
  },
  {
    id: 'ok-calendar',
    name: 'ok-calendar',
    category: 'flujo',
    desc: 'Calendario mensual / agenda con eventos por día, navegación de mes y selección de fecha. Ionic no trae calendario.',
    importPath: "@outfitkit/core/ok-calendar",
    example: '<ok-calendar id="cal" view="month" max-per-day="3" style="display:block;width:100%"></ok-calendar>',
    setup: (root) => {
      const cal = root.querySelector('#cal');
      cal.events = [
        { id: 'e1', date: _ymd(4), title: 'Inventario', color: 'primary' },
        { id: 'e2', date: _ymd(12), title: 'Cierre caja', color: 'success' },
        { id: 'e3', date: _ymd(12), title: 'Reunión equipo', color: 'warning' },
        { id: 'e4', date: _ymd(20), title: 'Pedido proveedor', color: 'tertiary' },
      ];
      cal.value = _ymd(12);
    },
    code: `cal.events = [{ id, date: '2026-06-12', title: 'Inventario', color: 'success' }];
cal.value = '2026-06-12';
cal.view = 'month'; // 'month' | 'agenda'
cal.maxPerDay = 3;
cal.addEventListener('ok-date-select', (e) => …); // { date }
cal.addEventListener('ok-event-click', (e) => …); // { id, event }`,
    api: [
      { kind: 'prop', name: '.events', type: 'OkCalendarEvent[]', detail: "{id, date:'YYYY-MM-DD', title, color?}" },
      { kind: 'prop', name: 'value', type: 'string', detail: 'Fecha seleccionada (YYYY-MM-DD)' },
      { kind: 'prop', name: 'view', type: 'month|agenda', detail: 'Modo de vista' },
      { kind: 'prop', name: 'max-per-day', type: 'number', detail: 'Máx. eventos visibles por celda' },
      { kind: 'event', name: 'ok-date-select', type: '{date}', detail: 'Selección de día' },
      { kind: 'event', name: 'ok-event-click', type: '{id, event}', detail: 'Click en un evento' },
      { kind: 'event', name: 'ok-view-change · ok-nav', type: '{view} · {year, month}', detail: 'Cambio de vista · navegación de mes' },
    ],
  },
  {
    id: 'ok-kanban',
    name: 'ok-kanban',
    category: 'flujo',
    desc: 'Tablero de columnas con tarjetas arrastrables entre columnas (drag & drop). Útil para pipelines y estados.',
    importPath: "@outfitkit/core/ok-kanban",
    example: '<ok-kanban id="kb" style="display:block;height:420px;width:100%"></ok-kanban>',
    setup: (root) => {
      root.querySelector('#kb').columns = [
        { id: 'todo', title: 'Por hacer', color: 'medium', cards: [
          { id: 'c1', title: 'Pedir stock', subtitle: 'Almacén', tags: ['urgente'] },
          { id: 'c2', title: 'Actualizar precios', subtitle: 'Catálogo' },
        ]},
        { id: 'doing', title: 'En curso', color: 'primary', cards: [
          { id: 'c3', title: 'Inventario mensual', subtitle: 'Tienda', tags: ['mes'] },
        ]},
        { id: 'done', title: 'Hecho', color: 'success', cards: [
          { id: 'c4', title: 'Cierre de caja', subtitle: 'Lunes' },
        ]},
      ];
    },
    code: `kanban.columns = [
  { id: 'todo', title: 'Por hacer', color: 'medium', cards: [
    { id: '1', title: 'Pedir stock', subtitle: 'Almacén', tags: ['urgente'] },
  ]},
  { id: 'doing', title: 'En curso', cards: [] },
];
kanban.addEventListener('ok-card-move', (e) => …); // { cardId, fromColumn, toColumn, toIndex }
kanban.addEventListener('ok-card-click', (e) => …); // { id, card }`,
    api: [
      { kind: 'prop', name: '.columns', type: 'OkKanbanColumn[]', detail: '{id, title, color?, cards:[{id, title, subtitle?, tags?}]}' },
      { kind: 'event', name: 'ok-card-move', type: '{cardId, fromColumn, toColumn, toIndex}', detail: 'Tarjeta movida' },
      { kind: 'event', name: 'ok-card-click', type: '{id, card}', detail: 'Click en tarjeta' },
    ],
  },
  {
    id: 'ok-chat',
    name: 'ok-chat',
    category: 'flujo',
    desc: 'Hilo de mensajes (chat): burbujas self/ajeno, avatar, hora y compositor con enviar. Para soporte/mensajería.',
    importPath: "@outfitkit/core/ok-chat",
    example: '<ok-chat id="chat" title="Soporte" style="display:block;height:420px;max-width:480px;width:100%"></ok-chat>',
    setup: (root) => {
      const chat = root.querySelector('#chat');
      chat.messages = [
        { id: '1', text: '¡Hola! ¿En qué puedo ayudarte?', author: 'Ana', time: '14:30', avatar: 'AN' },
        { id: '2', text: 'Quería consultar mi pedido #1042.', time: '14:31', self: true },
        { id: '3', text: 'Claro, lo reviso ahora mismo.', author: 'Ana', time: '14:31', avatar: 'AN' },
      ];
      chat.addEventListener('ok-send', (e) => {
        chat.messages = [...chat.messages, {
          id: String(Date.now()), text: e.detail.text, self: true,
          time: new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
        }];
      });
    },
    code: `chat.messages = [
  { id: '1', text: '¡Hola!', author: 'Ana', time: '14:30', avatar: 'AN' },
  { id: '2', text: 'Quería consultar mi pedido.', self: true, time: '14:31' },
];
chat.addEventListener('ok-send', (e) => {
  chat.messages = [...chat.messages,
    { id: crypto.randomUUID(), text: e.detail.text, self: true }];
});`,
    api: [
      { kind: 'prop', name: '.messages', type: 'OkChatMessage[]', detail: '{id, text, author?, time?, self?, avatar?}' },
      { kind: 'prop', name: 'title · placeholder · readonly', type: '', detail: 'cabecera · placeholder · sin compositor' },
      { kind: 'event', name: 'ok-send', type: '{text}', detail: 'Texto enviado (Enter); el consumidor añade el mensaje' },
    ],
  },
  {
    id: 'ok-scheduler',
    name: 'ok-scheduler',
    category: 'flujo',
    desc: 'Agenda de recursos/turnos en timeline horario: una fila por recurso (empleado, sala, máquina) con sus bloques posicionados por hora. Navegación de día y celdas-slot clicables. Ionic no trae scheduler.',
    importPath: "@outfitkit/core/ok-scheduler",
    example: '<ok-scheduler id="sch" start-hour="8" end-hour="20" slot-minutes="60" style="display:block;height:360px;width:100%"></ok-scheduler>',
    setup: (root) => {
      const sch = root.querySelector('#sch');
      const today = new Date();
      sch.date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      sch.resources = [
        { id: 'r1', label: 'María López' },
        { id: 'r2', label: 'Juan Pérez' },
        { id: 'r3', label: 'Ana Ruiz' },
      ];
      sch.events = [
        { id: 'e1', resourceId: 'r1', start: '09:00', end: '11:00', title: 'Apertura tienda' },
        { id: 'e2', resourceId: 'r1', start: '13:00', end: '15:00', title: 'Caja', color: 'var(--ion-color-success)' },
        { id: 'e3', resourceId: 'r2', start: '10:30', end: '14:00', title: 'Almacén', color: 'var(--ion-color-warning)' },
        { id: 'e4', resourceId: 'r3', start: '15:00', end: '19:00', title: 'Atención cliente', color: 'var(--ion-color-tertiary)' },
      ];
    },
    code: `sch.resources = [{ id: 'r1', label: 'María López', avatar? }];
sch.events = [{ id: 'e1', resourceId: 'r1', start: '09:00', end: '11:00', title: 'Apertura', color? }];
sch.date = '2026-06-09';   // attrs: start-hour, end-hour, slot-minutes
sch.addEventListener('ok-event-click', (e) => …); // { id, event }
sch.addEventListener('ok-slot-click', (e) => …);  // { resourceId, time }
sch.addEventListener('ok-nav', (e) => …);          // { date }`,
    api: [
      { kind: 'prop', name: '.resources', type: 'OkSchedulerResource[]', detail: '{id, label, avatar?}' },
      { kind: 'prop', name: '.events', type: 'OkSchedulerEvent[]', detail: "{id, resourceId, start:'HH:MM'|ISO, end, title, color?}" },
      { kind: 'prop', name: 'date', type: 'string', detail: 'Día mostrado (YYYY-MM-DD)' },
      { kind: 'prop', name: 'start-hour · end-hour · slot-minutes', type: 'number', detail: 'Primera hora (8) · última hora (20) · minutos por celda (60)' },
      { kind: 'event', name: 'ok-event-click', type: '{id, event}', detail: 'Click en un bloque' },
      { kind: 'event', name: 'ok-slot-click', type: '{resourceId, time}', detail: 'Click en celda vacía (time = HH:MM)' },
      { kind: 'event', name: 'ok-nav', type: '{date}', detail: 'Cambio de día (YYYY-MM-DD)' },
    ],
  },
  {
    id: 'ok-timeline',
    name: 'ok-timeline',
    category: 'flujo',
    desc: 'Línea de tiempo vertical por datos: una fila por hito con punto de color/icono, título, descripción y hora. Estado done / current / pending y modo alternado (zig-zag) en pantallas anchas. Ionic no la trae.',
    importPath: "@outfitkit/core/ok-timeline",
    example: '<ok-timeline id="tl" align="left" style="display:block;width:100%"></ok-timeline>',
    setup: (root) => {
      root.querySelector('#tl').items = [
        { id: 't1', title: 'Pedido recibido', description: 'Pedido #2041 confirmado por el cliente.', time: '09:12', icon: 'cart-outline', status: 'done' },
        { id: 't2', title: 'Pago verificado', description: 'Cobro de €324,50 aprobado.', time: '09:14', icon: 'card-outline', status: 'done' },
        { id: 't3', title: 'Preparando envío', description: 'Almacén empaquetando los artículos.', time: '10:30', icon: 'cube-outline', status: 'current' },
        { id: 't4', title: 'Entregado', description: 'Pendiente de salida del repartidor.', time: '—', icon: 'checkmark-done-outline', status: 'pending' },
      ];
    },
    code: `timeline.items = [
  { id: 't1', title: 'Pedido recibido', description: '…', time: '09:12', icon: 'cart-outline', status: 'done' },
  { id: 't3', title: 'Preparando envío', time: '10:30', status: 'current' },
  { id: 't4', title: 'Entregado', status: 'pending' },
];
timeline.align = 'alternate'; // 'left' | 'alternate'
timeline.addEventListener('ok-item-click', (e) => …); // { id, item }`,
    api: [
      { kind: 'prop', name: '.items', type: 'OkTimelineItem[]', detail: "{id, title, description?, time?, icon?, color?, status?:'done'|'current'|'pending'}" },
      { kind: 'prop', name: 'align', type: 'left|alternate', detail: 'Columna izquierda · zig-zag en pantallas anchas' },
      { kind: 'event', name: 'ok-item-click', type: '{id, item}', detail: 'Click en un hito' },
    ],
  },

  // ════════════════════════════════ INPUTS ════════════════════════════════
  {
    id: 'ok-combo',
    name: 'ok-combo',
    category: 'inputs',
    desc: 'Selector con búsqueda (autocomplete): escribe para filtrar opciones y elige una.',
    importPath: "@outfitkit/core/ok-combo",
    example: '<ok-combo id="cb" label="País" placeholder="Escribe para buscar…" style="display:block;max-width:320px"></ok-combo>',
    setup: (root) => {
      root.querySelector('#cb').options = [
        { value: 'es', label: 'España' },
        { value: 'fr', label: 'Francia' },
        { value: 'pt', label: 'Portugal' },
        { value: 'it', label: 'Italia' },
        { value: 'de', label: 'Alemania' },
      ];
    },
    code: `combo.options = [{ value: 'es', label: 'España' }, { value: 'fr', label: 'Francia' }];
combo.value = 'es';
combo.addEventListener('ok-input', (e) => …);   // { query }
combo.addEventListener('ok-change', (e) => …);  // { value, label }`,
    api: [
      { kind: 'prop', name: '.options', type: '{value, label}[]', detail: 'Opciones disponibles' },
      { kind: 'prop', name: 'value · placeholder · label', type: 'string', detail: 'Valor, placeholder, etiqueta' },
      { kind: 'event', name: 'ok-input', type: '{query}', detail: 'Texto del filtro' },
      { kind: 'event', name: 'ok-change', type: '{value, label}', detail: 'Opción elegida' },
    ],
  },
  {
    id: 'ok-tag-input',
    name: 'ok-tag-input',
    category: 'inputs',
    desc: 'Entrada de múltiples etiquetas (chips), con autocompletado opcional por sugerencias.',
    importPath: "@outfitkit/core/ok-tag-input",
    example: '<ok-tag-input id="ti" placeholder="Añade etiquetas…" style="display:block;max-width:420px"></ok-tag-input>',
    setup: (root) => {
      const ti = root.querySelector('#ti');
      ti.value = ['urgente', 'cocina'];
      ti.suggestions = ['urgente', 'cocina', 'sala', 'caja', 'almacén', 'delivery'];
    },
    code: `tags.value = ['urgente', 'cocina'];
tags.suggestions = ['urgente', 'cocina', 'sala', 'caja'];
tags.addEventListener('ok-change', (e) => …); // { tags }`,
    api: [
      { kind: 'prop', name: '.value', type: 'string[]', detail: 'Etiquetas actuales' },
      { kind: 'prop', name: 'placeholder', type: 'string', detail: 'Placeholder del campo' },
      { kind: 'prop', name: '.suggestions', type: 'string[]', detail: 'Sugerencias de autocompletado' },
      { kind: 'event', name: 'ok-change', type: '{tags}', detail: 'Cambio de etiquetas' },
    ],
  },
  {
    id: 'ok-rating',
    name: 'ok-rating',
    category: 'inputs',
    desc: 'Valoración por estrellas, con soporte de medias estrellas y modo solo-lectura.',
    importPath: "@outfitkit/core/ok-rating",
    example: `<div style="display:flex;flex-direction:column;gap:.75rem;align-items:flex-start">
  <ok-rating value="3" max="5" allow-half></ok-rating>
  <ok-rating value="4.5" max="5" allow-half readonly></ok-rating>
</div>`,
    code: `<ok-rating value="3" max="5" allow-half></ok-rating>
rating.addEventListener('ok-change', (e) => …); // { value }`,
    api: [
      { kind: 'prop', name: 'value · max', type: 'number', detail: 'Valor y número de estrellas' },
      { kind: 'prop', name: 'readonly · allow-half', type: 'bool', detail: 'Solo lectura · medias estrellas' },
      { kind: 'event', name: 'ok-change', type: '{value}', detail: 'Nueva valoración' },
    ],
  },
  {
    id: 'ok-otp',
    name: 'ok-otp',
    category: 'inputs',
    desc: 'Entrada de código de un solo uso: una casilla por dígito, auto-avance y pegado.',
    importPath: "@outfitkit/core/ok-otp",
    example: '<ok-otp length="6"></ok-otp>',
    code: `<ok-otp length="6"></ok-otp>
otp.addEventListener('ok-change', (e) => …);   // { value }
otp.addEventListener('ok-complete', (e) => …); // { value } al completar`,
    api: [
      { kind: 'prop', name: 'length', type: 'number', detail: 'Número de dígitos' },
      { kind: 'prop', name: 'value', type: 'string', detail: 'Valor actual' },
      { kind: 'event', name: 'ok-change', type: '{value}', detail: 'Cada cambio' },
      { kind: 'event', name: 'ok-complete', type: '{value}', detail: 'Todos los dígitos rellenos' },
    ],
  },
  {
    id: 'ok-pinpad',
    name: 'ok-pinpad',
    category: 'inputs',
    desc: 'Teclado numérico (TPV / login por PIN) con dígitos ocultables.',
    importPath: "@outfitkit/core/ok-pinpad",
    example: '<ok-pinpad length="4" masked></ok-pinpad>',
    code: `<ok-pinpad length="4" masked></ok-pinpad>
pinpad.addEventListener('ok-input', (e) => …);    // { value }
pinpad.addEventListener('ok-complete', (e) => …); // { value }`,
    api: [
      { kind: 'prop', name: 'value · length', type: 'string · number', detail: 'Valor actual · dígitos esperados' },
      { kind: 'prop', name: 'masked', type: 'bool', detail: 'Oculta los dígitos' },
      { kind: 'event', name: 'ok-input', type: '{value}', detail: 'Cada pulsación' },
      { kind: 'event', name: 'ok-complete', type: '{value}', detail: 'Al alcanzar la longitud' },
    ],
  },
  {
    id: 'ok-currency',
    name: 'ok-currency',
    category: 'inputs',
    desc: 'Campo de importe con formato de moneda según locale (separadores, símbolo) y valor numérico limpio.',
    importPath: "@outfitkit/core/ok-currency",
    example: '<ok-currency id="cu" label="Precio" currency="EUR" locale="es-ES" placeholder="0,00" style="display:block;max-width:320px"></ok-currency>',
    setup: (root) => { root.querySelector('#cu').value = 1234.5; },
    code: `cur.value = 1234.5;
cur.currency = 'EUR';
cur.locale = 'es-ES';
cur.addEventListener('ok-change', (e) => …); // { value }`,
    api: [
      { kind: 'prop', name: 'value', type: 'number', detail: 'Importe numérico' },
      { kind: 'prop', name: 'currency · locale', type: 'string', detail: 'ISO 4217 · BCP-47' },
      { kind: 'prop', name: 'placeholder · label', type: 'string', detail: 'Placeholder y etiqueta' },
      { kind: 'event', name: 'ok-change', type: '{value}', detail: 'Nuevo importe' },
    ],
  },
  {
    id: 'ok-phone',
    name: 'ok-phone',
    category: 'inputs',
    desc: 'Campo de teléfono con selector de país (prefijo) y salida E.164 normalizada.',
    importPath: "@outfitkit/core/ok-phone",
    example: '<ok-phone id="ph" label="Teléfono" country="ES" placeholder="600 000 000" style="display:block;max-width:360px"></ok-phone>',
    code: `phone.country = 'ES';
phone.value = '600000000';
phone.addEventListener('ok-change', (e) => …); // { value, country, dial, e164 }`,
    api: [
      { kind: 'prop', name: 'value', type: 'string', detail: 'Número nacional' },
      { kind: 'prop', name: 'country', type: 'string (ISO2)', detail: 'País seleccionado' },
      { kind: 'prop', name: '.countries', type: 'string[]', detail: 'Países disponibles (opcional)' },
      { kind: 'prop', name: 'placeholder · label', type: 'string', detail: 'Placeholder y etiqueta' },
      { kind: 'event', name: 'ok-change', type: '{value, country, dial, e164}', detail: 'Cambio normalizado' },
    ],
  },
  {
    id: 'ok-dropzone',
    name: 'ok-dropzone',
    category: 'inputs',
    desc: 'Zona de subida de archivos por arrastrar-y-soltar o click, con filtro de tipo y tamaño máximo.',
    importPath: "@outfitkit/core/ok-dropzone",
    example: '<ok-dropzone accept="image/*" multiple max-size="5242880" hint="PNG/JPG hasta 5 MB" style="display:block;width:100%"></ok-dropzone>',
    code: `<ok-dropzone accept="image/*" multiple max-size="5242880" hint="PNG/JPG hasta 5 MB"></ok-dropzone>
dz.addEventListener('ok-change', (e) => …); // { files }
dz.addEventListener('ok-error', (e) => …);  // { message }`,
    api: [
      { kind: 'prop', name: 'accept', type: 'string', detail: 'Filtro MIME (como input file)' },
      { kind: 'prop', name: 'multiple', type: 'bool', detail: 'Permite varios archivos' },
      { kind: 'prop', name: 'max-size', type: 'number', detail: 'Tamaño máximo en bytes' },
      { kind: 'prop', name: 'hint', type: 'string', detail: 'Texto de ayuda' },
      { kind: 'event', name: 'ok-change', type: '{files}', detail: 'Archivos aceptados' },
      { kind: 'event', name: 'ok-error', type: '{message}', detail: 'Tipo o tamaño no válido' },
    ],
  },
  {
    id: 'ok-qty-stepper',
    name: 'ok-qty-stepper',
    category: 'inputs',
    desc: 'Selector de cantidad (−/+ con campo central editable) que hace clamp a min/max según step. Útil en TPV/carritos. Ionic no trae un stepper numérico con tope.',
    importPath: "@outfitkit/core/ok-qty-stepper",
    example: '<ok-qty-stepper value="1" min="0" max="10"></ok-qty-stepper>',
    code: `<ok-qty-stepper value="1" min="0" max="10" step="1"></ok-qty-stepper>
stepper.addEventListener('ok-change', (e) => …); // { value }`,
    api: [
      { kind: 'prop', name: 'value · min · max', type: 'number', detail: 'Valor actual · mínimo · máximo (sin tope si se omite)' },
      { kind: 'prop', name: 'step · disabled', type: 'number · bool', detail: 'Incremento · deshabilitado' },
      { kind: 'event', name: 'ok-change', type: '{value}', detail: 'Nuevo valor (tras clamp)' },
    ],
  },
  {
    id: 'ok-color-picker',
    name: 'ok-color-picker',
    category: 'inputs',
    desc: 'Selector de color: un botón-muestra (swatch) abre un panel con área HSV, hex y una rejilla de presets. Salida en hex + RGB. Ionic no trae color picker.',
    importPath: "@outfitkit/core/ok-color-picker",
    example: '<ok-color-picker id="cp" value="#2dd36f"></ok-color-picker>',
    setup: (root) => {
      root.querySelector('#cp').presets = ['#3880ff', '#2dd36f', '#ffc409', '#eb445a', '#6030ff', '#1c1b17', '#92949c', '#ffffff'];
    },
    code: `<ok-color-picker value="#2dd36f"></ok-color-picker>
picker.presets = ['#3880ff', '#2dd36f', '#ffc409', '#eb445a'];
picker.addEventListener('ok-change', (e) => …); // { value, rgb: { r, g, b } }`,
    api: [
      { kind: 'prop', name: 'value', type: 'string (hex)', detail: "Color actual (p.ej. '#2dd36f')" },
      { kind: 'prop', name: '.presets', type: 'string[]', detail: 'Hex de la rejilla de presets' },
      { kind: 'event', name: 'ok-change', type: '{value, rgb}', detail: 'hex + {r, g, b}' },
      { kind: 'event', name: 'ok-open', type: '{open}', detail: 'Apertura/cierre del panel' },
    ],
  },

  // ═══════════════════════════════ ACCIONES ═══════════════════════════════
  {
    id: 'ok-app-launcher',
    name: 'ok-app-launcher',
    category: 'acciones',
    desc: 'Botón de icono (rejilla 3×3) que despliega una cuadrícula de apps/atajos, estilo lanzador.',
    importPath: "@outfitkit/core/ok-app-launcher",
    example: '<ok-app-launcher id="al"></ok-app-launcher>',
    setup: (root) => {
      root.querySelector('#al').apps = [
        { id: 'pos', label: 'TPV', icon: 'cart-outline', color: 'primary' },
        { id: 'stock', label: 'Almacén', icon: 'cube-outline' },
        { id: 'customers', label: 'Clientes', icon: 'people-outline' },
        { id: 'reports', label: 'Informes', icon: 'bar-chart-outline' },
        { id: 'settings', label: 'Ajustes', icon: 'settings-outline' },
        { id: 'staff', label: 'Empleados', icon: 'person-outline' },
      ];
    },
    code: `launcher.apps = [
  { id: 'pos', label: 'TPV', icon: 'cart-outline', color: 'primary' },
  { id: 'stock', label: 'Almacén', icon: 'cube-outline', href: '/stock' },
];
launcher.addEventListener('ok-app-select', (e) => …); // { id, app }`,
    api: [
      { kind: 'prop', name: '.apps', type: 'OkApp[]', detail: '{id, label, icon?, href?, color?}' },
      { kind: 'event', name: 'ok-app-select', type: '{id, app}', detail: 'App pulsada' },
    ],
  },
  {
    id: 'ok-split-button',
    name: 'ok-split-button',
    category: 'acciones',
    desc: 'Botón con acción principal + menú desplegable de acciones secundarias.',
    importPath: "@outfitkit/core/ok-split-button",
    example: '<ok-split-button id="sb2" label="Guardar" color="primary"></ok-split-button>',
    setup: (root) => {
      root.querySelector('#sb2').items = [
        { id: 'draft', label: 'Guardar borrador', icon: 'document-outline' },
        { id: 'copy', label: 'Guardar y duplicar', icon: 'copy-outline' },
        { id: 'close', label: 'Guardar y cerrar', icon: 'checkmark-done-outline' },
      ];
    },
    code: `split.label = 'Guardar';
split.items = [
  { id: 'draft', label: 'Guardar borrador', icon: 'document-outline' },
  { id: 'copy', label: 'Guardar y copiar', icon: 'copy-outline' },
];
split.addEventListener('ok-main', () => …);      // acción principal
split.addEventListener('ok-select', (e) => …);   // { id, item }`,
    api: [
      { kind: 'prop', name: 'label · color · fill', type: 'string', detail: 'Texto, color e estilo del botón' },
      { kind: 'prop', name: '.items', type: 'OkSplitItem[]', detail: '{id, label, icon?}' },
      { kind: 'event', name: 'ok-main', type: '—', detail: 'Acción principal pulsada' },
      { kind: 'event', name: 'ok-select', type: '{id, item}', detail: 'Acción secundaria pulsada' },
    ],
  },
  {
    id: 'ok-command-palette',
    name: 'ok-command-palette',
    category: 'acciones',
    desc: 'Paleta de comandos estilo ⌘K (overlay propio): input de búsqueda con fuzzy-match sobre etiqueta/keywords, comandos agrupados con icono y atajo, navegación con teclado. Se abre con Cmd/Ctrl+K o por método. (Es un overlay display:contents: en este preview ábrela con el botón o ⌘K.)',
    importPath: "@outfitkit/core/ok-command-palette",
    example: `<div style="display:flex;flex-direction:column;gap:.75rem;align-items:flex-start">
  <ion-button id="cmdk-open" size="small">Abrir paleta (⌘K)</ion-button>
  <small style="color:var(--ion-color-medium)">También se abre con Cmd/Ctrl + K.</small>
  <ok-command-palette id="cmdk" placeholder="Buscar comando…"></ok-command-palette>
</div>`,
    setup: (root) => {
      const palette = root.querySelector('#cmdk');
      palette.commands = [
        { id: 'new-sale', label: 'Nueva venta', hint: 'Abrir el TPV', icon: 'cart-outline', group: 'POS', shortcut: '⌘N', keywords: ['venta', 'ticket', 'tpv'] },
        { id: 'open-drawer', label: 'Abrir cajón', icon: 'cash-outline', group: 'POS', keywords: ['caja', 'efectivo'] },
        { id: 'close-register', label: 'Cierre de caja', icon: 'lock-closed-outline', group: 'POS' },
        { id: 'add-product', label: 'Añadir producto', icon: 'add-circle-outline', group: 'Gestión', shortcut: '⌘P', keywords: ['catálogo', 'artículo'] },
        { id: 'customers', label: 'Ver clientes', icon: 'people-outline', group: 'Gestión' },
        { id: 'settings', label: 'Ajustes', icon: 'settings-outline', group: 'Gestión', shortcut: '⌘,' },
      ];
      root.querySelector('#cmdk-open').addEventListener('click', () => palette.openPalette());
    },
    code: `palette.commands = [
  { id: 'new-sale', label: 'Nueva venta', icon: 'cart-outline', group: 'POS', shortcut: '⌘N', keywords: ['ticket'] },
  { id: 'settings', label: 'Ajustes', icon: 'settings-outline', group: 'Gestión' },
];
// Se abre con Cmd/Ctrl+K (hotkey por defecto) o por método:
palette.openPalette();  // close() / toggle()
palette.addEventListener('ok-select', (e) => …); // { id, command }
palette.addEventListener('ok-open', (e) => …);   // { open }`,
    api: [
      { kind: 'prop', name: '.commands', type: 'OkCommand[]', detail: '{id, label, hint?, icon?, group?, shortcut?, keywords?}' },
      { kind: 'prop', name: 'open · placeholder · hotkey', type: 'bool · string · bool', detail: 'Abierta · placeholder · ⌘K global (def true)' },
      { kind: 'event', name: 'openPalette() · close() · toggle()', type: 'método', detail: 'Abrir · cerrar · alternar' },
      { kind: 'event', name: 'ok-select', type: '{id, command}', detail: 'Comando ejecutado' },
      { kind: 'event', name: 'ok-open', type: '{open}', detail: 'Apertura/cierre de la paleta' },
    ],
  },

  // ═════════════════════════════ FORMULARIOS ══════════════════════════════
  {
    id: 'ok-contact-form',
    name: 'ok-contact-form',
    category: 'formularios',
    desc: 'Formulario de contacto web responsive con validación básica. Usa ion-input/ion-textarea por dentro.',
    importPath: "@outfitkit/core/ok-contact-form",
    example: '<ok-contact-form id="cf" heading="Escríbenos" submit-label="Enviar" style="display:block;width:100%"></ok-contact-form>',
    setup: (root) => {
      root.querySelector('#cf').addEventListener('ok-submit', (e) => console.info('contacto', e.detail));
    },
    code: `<ok-contact-form heading="Escríbenos" submit-label="Enviar" action="/contacto"></ok-contact-form>
form.addEventListener('ok-submit', (e) => …); // { name, email, subject, message }`,
    api: [
      { kind: 'prop', name: 'heading · submit-label', type: 'string', detail: 'Título y texto del botón' },
      { kind: 'prop', name: 'action · success-message', type: 'string', detail: 'URL de POST opcional · mensaje de éxito' },
      { kind: 'event', name: 'ok-submit', type: '{name, email, subject, message}', detail: 'Envío válido' },
    ],
  },

  // ═══════════════════════════════════ WEB ════════════════════════════════
  {
    id: 'ok-navbar',
    name: 'ok-navbar',
    category: 'web',
    desc: 'Barra de navegación de landing responsive con burger en móvil (ion-menu es un drawer de app, no una navbar).',
    importPath: "@outfitkit/core/ok-navbar",
    example: `<div style="width:100%;overflow:hidden;border-radius:8px">
  <ok-navbar>
    <strong slot="brand">OutfitKit</strong>
    <a href="#">Producto</a>
    <a href="#">Precios</a>
    <a href="#">Docs</a>
    <ion-button slot="actions" size="small">Empezar</ion-button>
  </ok-navbar>
</div>`,
    code: `<ok-navbar sticky>
  <strong slot="brand">OutfitKit</strong>
  <a href="/precios">Precios</a>
  <ion-button slot="actions" size="small">Empezar</ion-button>
</ok-navbar>`,
    api: [
      { kind: 'prop', name: 'sticky · open', type: 'bool', detail: 'Fija arriba · estado del panel móvil' },
      { kind: 'slot', name: 'brand · (default) · actions', type: '—', detail: 'Logo · enlaces · CTAs' },
    ],
  },
  {
    id: 'ok-footer',
    name: 'ok-footer',
    category: 'web',
    desc: 'Footer web multi-columna responsive con barra inferior (slot bottom).',
    importPath: "@outfitkit/core/ok-footer",
    example: `<div style="width:100%;overflow:hidden;border-radius:8px">
  <ok-footer>
    <div><strong>Producto</strong><br><a href="#">Características</a><br><a href="#">Precios</a></div>
    <div><strong>Recursos</strong><br><a href="#">Docs</a><br><a href="#">GitHub</a></div>
    <div><strong>Empresa</strong><br><a href="#">Contacto</a></div>
    <span slot="bottom">© 2026 OutfitKit · MIT</span>
  </ok-footer>
</div>`,
    code: `<ok-footer>
  <div><strong>Producto</strong>…</div>
  <span slot="bottom">© 2026 OutfitKit</span>
</ok-footer>`,
    api: [
      { kind: 'slot', name: '(default) · bottom', type: '—', detail: 'Columnas (auto-fit) · barra inferior' },
    ],
  },
  {
    id: 'ok-hero',
    name: 'ok-hero',
    category: 'web',
    desc: 'Sección hero de marketing con título, subtítulo y CTAs (slots).',
    importPath: "@outfitkit/core/ok-hero",
    example: `<div style="width:100%;overflow:hidden;border-radius:8px">
  <ok-hero>
    <h1 slot="title">Construye sobre Ionic</h1>
    <p slot="subtitle">OutfitKit cubre los huecos que Ionic no trae, con un set ok-* tematizado.</p>
    <ion-button slot="actions">Empezar</ion-button>
    <ion-button slot="actions" fill="outline">Ver docs</ion-button>
  </ok-hero>
</div>`,
    code: `<ok-hero>
  <h1 slot="title">Construye sobre Ionic</h1>
  <p slot="subtitle">…</p>
  <ion-button slot="actions">Empezar</ion-button>
</ok-hero>`,
    api: [
      { kind: 'slot', name: 'title · subtitle · actions · (default)', type: '—', detail: 'Titular · subtítulo · CTAs · media' },
    ],
  },
  {
    id: 'ok-container',
    name: 'ok-container',
    category: 'web',
    desc: 'Ancho máximo centrado (estilo .container). Hay también ok-container-full a ancho completo.',
    importPath: "@outfitkit/core/ok-container",
    example: `<ok-container style="display:block;width:100%">
  <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px;text-align:center">
    Contenido centrado con ancho máximo (--ok-container-max).
  </div>
</ok-container>`,
    code: `<ok-container>…contenido centrado…</ok-container>`,
    api: [
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido (light DOM → SEO)' },
      { kind: 'prop', name: '--max-width · --padding', type: 'CSS', detail: 'Ancho máximo · padding lateral' },
    ],
  },
  {
    id: 'ok-container-full',
    name: 'ok-container-full',
    category: 'web',
    desc: 'Contenedor de ancho completo (full-bleed). Pareja de ok-container para bandas a sangre.',
    importPath: "@outfitkit/core/ok-container-full",
    example: `<ok-container-full style="display:block;width:100%">
  <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px;text-align:center">
    Banda a ancho completo (full-bleed).
  </div>
</ok-container-full>`,
    code: `<ok-container-full>…banda full-bleed…</ok-container-full>`,
    api: [
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido a ancho completo' },
    ],
  },
  {
    id: 'ok-menubar',
    name: 'ok-menubar',
    category: 'web',
    desc: 'Barra de menús de escritorio (estilo app: Archivo / Editar / Ver…): dropdowns con iconos, atajos, separadores y submenús. En móvil colapsa a hamburguesa con acordeón. Navegación con teclado.',
    importPath: "@outfitkit/core/ok-menubar",
    example: '<ok-menubar id="mb" style="display:block;width:100%"></ok-menubar>',
    setup: (root) => {
      root.querySelector('#mb').menus = [
        { id: 'file', label: 'Archivo', items: [
          { id: 'new', label: 'Nuevo', icon: 'document-outline', shortcut: '⌘N' },
          { id: 'open', label: 'Abrir…', icon: 'folder-open-outline', shortcut: '⌘O' },
          { id: 'recent', label: 'Abrir reciente', icon: 'time-outline', children: [
            { id: 'r1', label: 'pedidos.csv' },
            { id: 'r2', label: 'clientes.csv' },
          ]},
          { id: 'sep1', separator: true },
          { id: 'save', label: 'Guardar', icon: 'save-outline', shortcut: '⌘S' },
          { id: 'export', label: 'Exportar', icon: 'download-outline', disabled: true },
        ]},
        { id: 'edit', label: 'Editar', items: [
          { id: 'undo', label: 'Deshacer', shortcut: '⌘Z' },
          { id: 'redo', label: 'Rehacer', shortcut: '⇧⌘Z' },
          { id: 'sep2', separator: true },
          { id: 'cut', label: 'Cortar', shortcut: '⌘X' },
          { id: 'copy', label: 'Copiar', shortcut: '⌘C' },
          { id: 'paste', label: 'Pegar', shortcut: '⌘V' },
        ]},
        { id: 'view', label: 'Ver', items: [
          { id: 'zoom-in', label: 'Acercar', icon: 'add-outline' },
          { id: 'zoom-out', label: 'Alejar', icon: 'remove-outline' },
          { id: 'fullscreen', label: 'Pantalla completa', icon: 'expand-outline', shortcut: 'F11' },
        ]},
      ];
    },
    code: `menubar.menus = [
  { id: 'file', label: 'Archivo', items: [
    { id: 'new', label: 'Nuevo', icon: 'document-outline', shortcut: '⌘N' },
    { id: 'sep1', separator: true },
    { id: 'recent', label: 'Reciente', children: [{ id: 'r1', label: 'pedidos.csv' }] },
  ]},
];
menubar.addEventListener('ok-select', (e) => …); // { id, item }
menubar.addEventListener('ok-open', (e) => …);   // { open }`,
    api: [
      { kind: 'prop', name: '.menus', type: 'OkMenu[]', detail: '{id, label, items:[{id, label, icon?, shortcut?, disabled?, separator?, children?}]}' },
      { kind: 'event', name: 'ok-select', type: '{id, item}', detail: 'Click en un item hoja' },
      { kind: 'event', name: 'ok-open', type: '{open}', detail: 'Apertura/cierre de un menú' },
    ],
  },

  // ═════════════════════════════ MULTIMEDIA ═══════════════════════════════
  {
    id: 'ok-carousel',
    name: 'ok-carousel',
    category: 'multimedia',
    desc: 'Carrusel de slides con transición por transform: flechas prev/next, puntos indicadores y swipe táctil. Slides por slot (cada hijo directo) o por prop .slides (array de strings/HTML). Autoplay y loop opcionales.',
    importPath: "@outfitkit/core/ok-carousel",
    example: `<ok-carousel loop autoplay="4000" style="display:block;width:100%">
  <div style="display:grid;place-items:center;height:100%;background:var(--ion-color-primary);color:#fff;font-size:1.5rem;font-weight:700">Slide 1</div>
  <div style="display:grid;place-items:center;height:100%;background:var(--ion-color-success);color:#fff;font-size:1.5rem;font-weight:700">Slide 2</div>
  <div style="display:grid;place-items:center;height:100%;background:var(--ion-color-tertiary);color:#fff;font-size:1.5rem;font-weight:700">Slide 3</div>
</ok-carousel>`,
    code: `<ok-carousel loop autoplay="4000" index="0">
  <div>Slide 1</div>
  <div>Slide 2</div>
</ok-carousel>
// o por datos:
carousel.slides = ['<h2>Uno</h2>', '<h2>Dos</h2>'];
carousel.addEventListener('ok-change', (e) => …); // { index }`,
    api: [
      { kind: 'prop', name: '.slides', type: 'string[]', detail: 'Slides por datos (alternativa al slot)' },
      { kind: 'prop', name: 'index', type: 'number', detail: 'Slide activo (0-based)' },
      { kind: 'prop', name: 'autoplay · loop', type: 'number · bool', detail: 'ms entre slides (0 = off) · vuelve al inicio/fin' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Cada hijo directo es un slide' },
      { kind: 'event', name: 'ok-change', type: '{index}', detail: 'Cambio de slide' },
    ],
  },
  {
    id: 'ok-signature',
    name: 'ok-signature',
    category: 'multimedia',
    desc: 'Pad de firma sobre canvas con trazo suavizado y soporte HiDPI (devicePixelRatio). Métodos clear() / toDataURL() / isEmpty(). Ionic no trae captura de firma.',
    importPath: "@outfitkit/core/ok-signature",
    example: '<ok-signature pen-color="#1c1b17" line-width="2.5" height="200" show-export style="display:block;width:100%"></ok-signature>',
    code: `<ok-signature pen-color="#1c1b17" line-width="2.5" height="200" show-export></ok-signature>
sig.clear();
const png = sig.toDataURL('image/png');
sig.isEmpty(); // true si no se ha dibujado
sig.addEventListener('ok-change', (e) => …); // { empty }
sig.addEventListener('ok-clear', () => …);`,
    api: [
      { kind: 'prop', name: 'pen-color · line-width', type: 'string · number', detail: 'Color y grosor del trazo' },
      { kind: 'prop', name: 'background · height', type: 'string · number', detail: 'Fondo del lienzo · altura en px' },
      { kind: 'prop', name: 'show-export', type: 'bool', detail: 'Muestra el botón de exportar' },
      { kind: 'event', name: 'clear() · toDataURL() · isEmpty()', type: 'método', detail: 'Limpiar · data URL (def image/png) · ¿vacío?' },
      { kind: 'event', name: 'ok-change · ok-clear', type: '{empty} · —', detail: 'Fin de trazo · al limpiar' },
    ],
  },
  {
    id: 'ok-qr',
    name: 'ok-qr',
    category: 'multimedia',
    desc: 'Generador de código QR autocontenido (SVG, sin dependencias). Nivel de corrección de errores, tamaño, colores y margen configurables.',
    importPath: "@outfitkit/core/ok-qr",
    example: '<ok-qr value="https://erplora.com" size="160"></ok-qr>',
    code: `<ok-qr value="https://erplora.com" ec="M" size="160"></ok-qr>
qr.value = 'https://erplora.com';
qr.ec = 'H'; // L | M | Q | H`,
    api: [
      { kind: 'prop', name: 'value', type: 'string', detail: 'Texto/URL a codificar' },
      { kind: 'prop', name: 'ec', type: 'L|M|Q|H', detail: 'Nivel de corrección de errores (def M)' },
      { kind: 'prop', name: 'size · margin', type: 'number', detail: 'Lado en px (def 160) · margen quiet-zone (def 4)' },
      { kind: 'prop', name: 'color · background', type: 'string', detail: 'Color de los módulos · fondo' },
    ],
  },
  {
    id: 'ok-audio',
    name: 'ok-audio',
    category: 'multimedia',
    desc: 'Reproductor de audio con controles propios (play/pausa, barra de progreso, tiempo). Construido sobre <audio> nativo.',
    importPath: "@outfitkit/core/ok-audio",
    // NOTA: usa un src de ejemplo público (SoundHelix); sustituir por tu propio audio en producción.
    example: '<ok-audio src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" title="Pista de ejemplo" style="display:block;width:100%"></ok-audio>',
    code: `<ok-audio src="/media/jingle.mp3" title="Jingle"></ok-audio>
audio.addEventListener('ok-play', () => …);
audio.addEventListener('ok-pause', () => …);
audio.addEventListener('ok-ended', () => …);`,
    api: [
      { kind: 'prop', name: 'src · title', type: 'string', detail: 'URL del audio · título mostrado' },
      { kind: 'event', name: 'ok-play · ok-pause · ok-ended', type: '—', detail: 'Reproducir · pausar · fin de pista' },
    ],
  },
  {
    id: 'ok-video',
    name: 'ok-video',
    category: 'multimedia',
    desc: 'Reproductor de vídeo responsive (aspect-ratio 16/9) con controles propios y póster. Construido sobre <video> nativo.',
    importPath: "@outfitkit/core/ok-video",
    // NOTA: usa un src de ejemplo público (Google sample); sustituir por tu propio vídeo en producción.
    example: '<ok-video src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" poster="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/images/BigBuckBunny.jpg" style="display:block;width:100%"></ok-video>',
    code: `<ok-video src="/media/intro.mp4" poster="/media/intro.jpg"></ok-video>
video.addEventListener('ok-play', () => …);
video.addEventListener('ok-pause', () => …);
video.addEventListener('ok-ended', () => …);`,
    api: [
      { kind: 'prop', name: 'src · poster', type: 'string', detail: 'URL del vídeo · imagen de portada' },
      { kind: 'event', name: 'ok-play · ok-pause · ok-ended', type: '—', detail: 'Reproducir · pausar · fin' },
    ],
  },
  {
    id: 'ok-pdf',
    name: 'ok-pdf',
    category: 'multimedia',
    desc: 'Visor de PDF embebido (vía <iframe>/<embed>) con cabecera de título y altura configurable.',
    importPath: "@outfitkit/core/ok-pdf",
    // NOTA: usa un src de ejemplo público (pdf.js tracemonkey sample); sustituir por tu propio PDF en producción.
    example: '<ok-pdf src="https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf" title="Documento de ejemplo" height="480px" style="display:block;width:100%"></ok-pdf>',
    code: `<ok-pdf src="/docs/factura.pdf" title="Factura" height="480px"></ok-pdf>`,
    api: [
      { kind: 'prop', name: 'src · title', type: 'string', detail: 'URL del PDF · título de la cabecera' },
      { kind: 'prop', name: 'height', type: 'string', detail: 'Altura del visor (def 480px)' },
    ],
  },

  // ════════════════════════════════ ESTADO ════════════════════════════════
  {
    id: 'ok-store',
    name: 'ok-store / store API',
    category: 'estado',
    desc: 'Store reactivo persistente (IndexedDB, con fallback en memoria). Como elemento <ok-store> o como API createStore()/store importable.',
    importPath: "@outfitkit/core/ok-store",
    example: `<ok-store id="store" name="demo">
  <div style="display:flex;flex-direction:column;gap:.75rem;align-items:flex-start">
    <ion-button id="store-inc" size="small">Incrementar contador</ion-button>
    <code id="store-out" style="font-size:.95rem">contador = (cargando…)</code>
  </div>
</ok-store>`,
    setup: (root) => {
      const el = root.querySelector('#store');
      const out = root.querySelector('#store-out');
      const render = () => { out.textContent = 'contador = ' + (el.get('contador') ?? 0); };
      el.addEventListener('ok-store-ready', render);
      el.addEventListener('ok-store-change', render);
      root.querySelector('#store-inc').addEventListener('click', () => {
        el.set('contador', (el.get('contador') ?? 0) + 1);
      });
      // por si el store ya estaba listo antes de adjuntar el listener
      queueMicrotask(render);
    },
    code: `// Como elemento declarativo
<ok-store name="demo">…</ok-store>
storeEl.set('contador', 1);
storeEl.get('contador');           // 1 (síncrono)
storeEl.addEventListener('ok-store-change', (e) => …); // { key, value }

// Como API importable
import { createStore, store } from '@outfitkit/core/ok-store';
const s = createStore({ name: 'demo' });
await s.ready;
s.set('k', v); s.get('k'); s.update('k', (v) => v + 1);
const off = s.subscribe('k', (value) => …);`,
    api: [
      { kind: 'prop', name: 'name', type: 'string', detail: 'Nombre de la base IndexedDB (namespace)' },
      { kind: 'event', name: 'ok-store-ready', type: '—', detail: 'Store cargado desde IndexedDB' },
      { kind: 'event', name: 'ok-store-change', type: '{key, value}', detail: 'Cualquier escritura' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido (el elemento es display:contents)' },
    ],
  },
];

export { CATEGORIES, COMPONENTS };
