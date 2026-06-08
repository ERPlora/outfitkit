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
      const canalChip = (c) => h`<ion-chip style="--background:var(--ion-color-step-100);height:24px;font-size:12px;margin:0">${c}</ion-chip>`;
      const avatar = (r) => h`<span style="display:inline-flex;align-items:center;gap:.55rem;min-width:0">
        <span style="flex:0 0 auto;display:grid;place-items:center;width:34px;height:34px;border-radius:999px;background:var(--ion-color-step-150);font-size:12px;font-weight:700">${r.initials}</span>
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
