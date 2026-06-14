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
  { id: 'graficos', label: 'Gráficos', icon: 'bar-chart-outline' },
  { id: 'flujo', label: 'Flujo', icon: 'git-branch-outline' },
  { id: 'inputs', label: 'Inputs', icon: 'create-outline' },
  { id: 'acciones', label: 'Acciones', icon: 'flash-outline' },
  { id: 'overlays', label: 'Overlays', icon: 'layers-outline' },
  { id: 'formularios', label: 'Formularios', icon: 'document-text-outline' },
  { id: 'web', label: 'Web', icon: 'globe-outline' },
  { id: 'marketing', label: 'Marketing', icon: 'megaphone-outline' },
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
      dt.columnSelector = true; // multi-select en la toolbar para elegir columnas visibles
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
    id: 'ok-mail',
    name: 'ok-mail',
    category: 'flujo',
    desc: 'Cliente de correo estilo Outlook pero SOLO email: 3 paneles (carpetas · lista · lectura), buscador, no leídos, estrella, adjuntos y acciones (responder/reenviar/archivar/eliminar). Responsive: un panel a la vez en móvil. Reutiliza ion-* y ok-empty-state.',
    importPath: "@outfitkit/core/ok-mail",
    example: '<div style="height:520px;width:100%"><ok-mail id="mailx"></ok-mail></div>',
    setup: (root) => {
      const mail = root.querySelector('#mailx');
      mail.folders = [
        { id: 'inbox', label: 'Bandeja', icon: 'mail-outline', count: 2 },
        { id: 'spam', label: 'Spam', icon: 'warning-outline', count: 1 },
        { id: 'sent', label: 'Enviados', icon: 'send-outline' },
        { id: 'drafts', label: 'Borradores', icon: 'document-outline', count: 1 },
        { id: 'trash', label: 'Papelera', icon: 'trash-outline' },
      ];
      mail.messages = [
        { id: 'm1', folderId: 'inbox', from: { name: 'Ana Pérez', email: 'ana@acme.com' }, to: ['yo@erplora.com'], subject: 'Pedido #1042 confirmado', preview: 'Confirmamos la entrega para mañana por la mañana…', body: 'Hola,\n\nConfirmamos la entrega del pedido #1042 para mañana por la mañana.\n\nUn saludo,\nAna', date: '2026-06-09T08:30:00Z', read: false, starred: true, attachments: [{ name: 'albaran-1042.pdf', size: 84210 }] },
        { id: 'm2', folderId: 'inbox', from: { name: 'Soporte ERPlora', email: 'support@erplora.com' }, subject: 'Tu factura de junio', preview: 'Adjuntamos la factura del periodo…', body: 'Adjuntamos la factura del periodo de junio.', date: '2026-06-08T17:05:00Z', read: false },
        { id: 'm3', folderId: 'inbox', from: { name: 'Luis Gómez', email: 'luis@proveedor.es' }, subject: 'Reposición de stock', preview: 'El lunes llega el nuevo lote…', body: 'El lunes llega el nuevo lote de producto.', date: '2026-06-07T11:20:00Z', read: true },
        { id: 's1', folderId: 'spam', from: { name: 'Promo Mega', email: 'no-reply@mega-promo.biz' }, subject: '¡¡Has GANADO un premio!!', preview: 'Haz clic aquí para reclamar tu premio…', body: 'Reclama tu premio ahora.', date: '2026-06-09T03:12:00Z', read: false },
      ];
      mail.activeFolder = 'inbox';
      mail.activeMessage = 'm1';
    },
    code: `mail.folders = [
  { id: 'inbox', label: 'Bandeja', icon: 'mail-outline', count: 2 },
  { id: 'sent', label: 'Enviados', icon: 'send-outline' },
];
mail.messages = [
  { id: 'm1', folderId: 'inbox', from: { name: 'Ana', email: 'ana@acme.com' },
    subject: 'Pedido #1042', preview: 'Confirmamos…', date: '2026-06-09T08:30:00Z',
    read: false, starred: true, attachments: [{ name: 'albaran.pdf', size: 84210 }] },
];
mail.activeFolder = 'inbox';
mail.addEventListener('ok-message-select', (e) => openMessage(e.detail.message));
mail.addEventListener('ok-compose', () => openComposer());`,
    api: [
      { kind: 'prop', name: '.folders', type: 'OkMailFolder[]', detail: '{id, label, icon?, count?}' },
      { kind: 'prop', name: '.messages', type: 'OkMailMessage[]', detail: '{id, folderId, from{name,email}, subject, preview?, body?, date, read?, starred?, attachments?}' },
      { kind: 'prop', name: 'active-folder · active-message', type: 'string', detail: 'Carpeta / mensaje activos' },
      { kind: 'event', name: 'ok-message-select · ok-folder-select', type: '{id, message} · {id}', detail: 'Selección' },
      { kind: 'event', name: 'ok-compose · ok-reply · ok-forward · ok-archive · ok-delete · ok-star', type: 'varios', detail: 'Acciones de correo' },
      { kind: 'event', name: 'ok-search', type: '{query}', detail: 'Búsqueda' },
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
  {
    id: 'ok-avatar',
    name: 'ok-avatar',
    category: 'datos',
    desc: 'Avatar de iniciales o imagen (lo que ion-avatar no cubre): tamaños, color derivado por hash, punto de estado y enlace opcional.',
    importPath: "@outfitkit/core/ok-avatar",
    example: `<div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap">
  <ok-avatar name="Demo Admin" size="lg" status="online"></ok-avatar>
  <ok-avatar name="María López" tone="auto"></ok-avatar>
  <ok-avatar name="Juan Pérez" tone="auto" shape="rounded"></ok-avatar>
  <ok-avatar name="Ana Ruiz" tone="auto" size="sm" status="busy"></ok-avatar>
  <ok-avatar email="luis@erplora.com" size="xs"></ok-avatar>
  <ok-avatar name="Sara Díaz" src="https://i.pravatar.cc/96?img=5" size="lg" status="online"></ok-avatar>
</div>`,
    code: `<ok-avatar name="María López" size="md" tone="auto" status="online"></ok-avatar>
<ok-avatar name="Sara Díaz" src="/media/sara.webp" href="/profile/"></ok-avatar>`,
    api: [
      { kind: 'prop', name: 'name · email', type: 'string', detail: 'Deriva las iniciales (email = fallback y title)' },
      { kind: 'prop', name: 'src', type: 'string', detail: 'Imagen; vuelve a iniciales si falla' },
      { kind: 'prop', name: 'size', type: 'xs|sm|md|lg', detail: 'Tamaño (~32px md) — o --ok-avatar-size libre' },
      { kind: 'prop', name: 'shape · tone', type: 'circle|rounded · primary|auto', detail: 'Forma · color (auto = hash estable del nombre)' },
      { kind: 'prop', name: 'status · href', type: 'online|offline|busy · string', detail: 'Punto de estado · envolver en <a>' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Override del contenido (p.ej. un icono)' },
    ],
  },
  {
    id: 'ok-status-pill',
    name: 'ok-status-pill',
    category: 'datos',
    desc: 'Pill de estado con tinte semántico suave (fondo al ~14% + texto en el shade): el hueco entre ion-badge (sólido) e ion-chip (neutro). Celda de estado típica de ok-data-table.',
    importPath: "@outfitkit/core/ok-status-pill",
    example: `<div style="display:flex;gap:.6rem;align-items:center;flex-wrap:wrap">
  <ok-status-pill tone="success" dot>Activo</ok-status-pill>
  <ok-status-pill tone="warning" icon="time-outline">Pendiente</ok-status-pill>
  <ok-status-pill tone="danger" dot>Bloqueado</ok-status-pill>
  <ok-status-pill tone="info">En revisión</ok-status-pill>
  <ok-status-pill tone="primary" size="sm">Nuevo</ok-status-pill>
  <ok-status-pill tone="neutral" size="sm" label="Borrador"></ok-status-pill>
</div>`,
    code: `<ok-status-pill tone="success" dot>Activo</ok-status-pill>
// en renders de celda (JS):
const pill = document.createElement('ok-status-pill');
pill.tone = 'danger'; pill.label = 'Bloqueado';`,
    api: [
      { kind: 'prop', name: 'tone', type: 'success|warning|danger|info|primary|neutral', detail: 'Tinte semántico' },
      { kind: 'prop', name: 'label · icon · dot', type: 'string · string · bool', detail: 'Texto por prop · icono izq. · punto de color' },
      { kind: 'prop', name: 'size', type: 'sm|md', detail: 'Tamaño' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido del pill' },
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
  {
    id: 'ok-page-header',
    name: 'ok-page-header',
    category: 'dashboard',
    desc: 'Cabecera de página IN-CONTENT típica de un ERP: título + descripción + acciones a la derecha + hueco para ion-breadcrumbs y línea de metadatos. Ionic resuelve la topbar pero no esta cabecera dentro del contenido. Layout puro (sin eventos), responsive (stack < 640px).',
    importPath: "@outfitkit/core/ok-page-header",
    example: `<div style="width:100%">
  <ok-page-header heading="Empleados" description="Gestiona el personal de tu negocio y sus roles de acceso.">
    <ion-breadcrumbs slot="breadcrumbs">
      <ion-breadcrumb>Inicio</ion-breadcrumb>
      <ion-breadcrumb>RRHH</ion-breadcrumb>
      <ion-breadcrumb>Empleados</ion-breadcrumb>
    </ion-breadcrumbs>
    <span slot="meta">6 activos · 2 inactivos</span>
    <span slot="meta">Actualizado hoy</span>
    <ion-button slot="actions" size="small" fill="outline">Exportar</ion-button>
    <ion-button slot="actions" size="small">Nuevo empleado</ion-button>
    <div style="display:flex;gap:.5rem;flex-wrap:wrap">
      <ok-status-pill tone="success" dot>Plantilla completa</ok-status-pill>
      <ok-status-pill tone="info">3 módulos activos</ok-status-pill>
    </div>
  </ok-page-header>
  <ok-page-header heading="Detalle de empleado" level="2" compact description="Variante compacta para sub-páginas.">
    <ion-button slot="actions" size="small" fill="clear">Editar</ion-button>
  </ok-page-header>
</div>`,
    code: `<ok-page-header heading="Empleados" description="Gestiona el personal y sus roles.">
  <ion-breadcrumbs slot="breadcrumbs">…</ion-breadcrumbs>
  <span slot="meta">6 activos · 2 inactivos</span>
  <ion-button slot="actions">Nuevo empleado</ion-button>
  <!-- default: chips de filtros, pills… -->
</ok-page-header>`,
    api: [
      { kind: 'prop', name: 'heading · level', type: 'string · 1|2', detail: 'Título y su nivel semántico (h1/h2)' },
      { kind: 'prop', name: 'description', type: 'string', detail: 'Subtítulo atenuado' },
      { kind: 'prop', name: 'compact', type: 'bool', detail: 'Variante densa para sub-páginas' },
      { kind: 'slot', name: 'breadcrumbs', type: '—', detail: 'Hueco para <ion-breadcrumbs>' },
      { kind: 'slot', name: 'meta', type: '—', detail: 'Línea de metadatos (fechas, ids) bajo el título' },
      { kind: 'slot', name: 'actions', type: '—', detail: 'Botones a la derecha; en móvil bajan debajo' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido extra bajo la descripción (chips, pills…)' },
    ],
  },
  {
    id: 'ok-drawer',
    name: 'ok-drawer',
    category: 'dashboard',
    desc: 'Panel lateral deslizante (slide-over) contextual: asistente, detalle de registro, filtros. Ionic no lo trae (ion-menu es navegación de app; ion-modal sheet es bottom-sheet). Scrim clicable, focus-trap, ESC, slots de cabecera/pie. Modo controlado: los gestos emiten ok-close cancelable. (Overlay display:contents: ábrelo con el botón.)',
    importPath: "@outfitkit/core/ok-drawer",
    example: `<div style="display:flex;flex-direction:column;gap:.75rem;align-items:flex-start">
  <ion-button id="drw-open" size="small">Abrir drawer</ion-button>
  <small style="color:var(--ion-color-medium)">Cierra con ESC, click fuera o el botón X.</small>
  <ok-drawer id="drw" heading="Asistente" icon="sparkles-outline" width="380px">
    <ion-button slot="header-actions" size="small" fill="clear">
      <ion-icon slot="icon-only" name="expand-outline"></ion-icon>
    </ion-button>
    <p style="margin:0 0 .75rem">Hola 👋 Soy el asistente. Este es el cuerpo del drawer, con scroll interno.</p>
    <ok-inline-feedback tone="info" heading="Contextual">Úsame para detalle de registro o filtros.</ok-inline-feedback>
    <div slot="footer" style="display:flex;gap:.5rem">
      <ion-button size="small" expand="block" style="flex:1">Acción principal</ion-button>
    </div>
  </ok-drawer>
</div>`,
    setup: (root) => {
      const drawer = root.querySelector('#drw');
      root.querySelector('#drw-open').addEventListener('click', () => { drawer.open = true; });
    },
    code: `<ok-drawer heading="Asistente" icon="sparkles-outline" side="end" width="420px">
  <ion-button slot="header-actions" size="small" fill="clear">…</ion-button>
  … cuerpo con scroll interno …
  <div slot="footer">…</div>
</ok-drawer>
drawer.open = true;                       // controlado por el padre (señal/ref)
drawer.addEventListener('ok-close', (e) => {
  // e.detail.reason: 'scrim' | 'esc' | 'button'
  // e.preventDefault() para vetar el cierre (modo controlado);
  // si nadie lo veta, el drawer se cierra solo.
});`,
    api: [
      { kind: 'prop', name: 'open', type: 'bool (reflejado)', detail: 'Abierto/cerrado; el padre puede controlarlo' },
      { kind: 'prop', name: 'side · width', type: 'end|start · string', detail: 'Lado (def end) · ancho (def 420px; móvil 100%)' },
      { kind: 'prop', name: 'heading · icon', type: 'string', detail: 'Título e icono de la cabecera' },
      { kind: 'prop', name: 'scrim · dismissible', type: 'bool · bool', detail: 'Fondo clicable (def true) · ESC/scrim/X cierran (def true)' },
      { kind: 'prop', name: '.labels', type: '{close}', detail: 'Textos traducibles (default inglés)' },
      { kind: 'slot', name: '(default) · header-actions · footer', type: '—', detail: 'Cuerpo (scroll) · botones extra cabecera · pie fijo' },
      { kind: 'event', name: 'ok-open', type: '{open:true}', detail: 'Al abrirse' },
      { kind: 'event', name: 'ok-close', type: '{reason} cancelable', detail: 'Gesto de cierre; preventDefault() lo veta' },
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
    id: 'ok-language-select',
    name: 'ok-language-select',
    category: 'web',
    desc: 'Selector de idioma para la web pública: los idiomas se pasan como enlaces (<a data-lang href>) en light DOM → SEO-crawlable, funciona sin JS y CSP-safe (navega por href). Autoselecciona el idioma del navegador si no se fija value.',
    importPath: "@outfitkit/core/ok-language-select",
    example: `<ok-language-select value="es">
  <a data-lang="en" href="#/c/ok-language-select">English</a>
  <a data-lang="es" href="#/c/ok-language-select">Español</a>
  <a data-lang="fr" href="#/c/ok-language-select">Français</a>
  <a data-lang="de" href="#/c/ok-language-select">Deutsch</a>
</ok-language-select>`,
    code: `<ok-language-select value="es">
  <a data-lang="en" href="/i18n/setlang/?language=en&next=/">English</a>
  <a data-lang="es" href="/i18n/setlang/?language=es&next=/">Español</a>
</ok-language-select>`,
    api: [
      { kind: 'prop', name: 'value · open', type: 'string · bool', detail: 'Idioma activo (autodetecta navigator.language si vacío) · estado del dropdown' },
      { kind: 'slot', name: '(default)', type: '<a data-lang href>', detail: 'Un enlace por idioma (light DOM; navega por href, sin evento)' },
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
    id: 'ok-layout',
    name: 'layout.css (container · grid)',
    category: 'web',
    desc: 'Primitivos de layout como CSS PLANO (sin web component, sin FOUC): .ok-container (ancho máximo centrado), .ok-container-fluid, y rejilla de 12 columnas .ok-grid/.ok-col con spans responsive (.ok-md-* / .ok-lg-* / .ok-xl-*, breakpoints de Ionic) + .ok-grid-cards (auto-fill, sin breakpoints). Sustituye a los antiguos <ok-container>/<ok-container-full>.',
    importPath: "@outfitkit/core/layout.css",
    example: `<div class="ok-container">
  <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px;text-align:center;margin-bottom:1rem">
    .ok-container — centrado con ancho máximo (--ok-container-max).
  </div>
  <div class="ok-grid">
    <div class="ok-col ok-md-6 ok-xl-3" style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Ventas</div>
    <div class="ok-col ok-md-6 ok-xl-3" style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Pedidos</div>
    <div class="ok-col ok-md-6 ok-xl-3" style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Stock</div>
    <div class="ok-col ok-md-6 ok-xl-3" style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Caja</div>
  </div>
</div>`,
    code: `<link rel="stylesheet" href=".../layout.css">

<!-- Web pública: ancho máximo centrado -->
<div class="ok-container">…</div>

<!-- Dashboard (ion-split-pane): SIN max-width; padding = .ion-padding -->
<ion-content>
  <main class="ion-padding">
    <div class="ok-grid">
      <section class="ok-col ok-md-6 ok-xl-3"><ion-card>Ventas</ion-card></section>
      …
    </div>
    <!-- o sin breakpoints: -->
    <div class="ok-grid-cards">…cards…</div>
  </main>
</ion-content>`,
    api: [
      { kind: 'prop', name: '.ok-container · .ok-container-fluid', type: 'class', detail: 'Ancho máximo centrado (--ok-container-max) · fluido a ancho completo' },
      { kind: 'prop', name: '.ok-grid · .ok-col', type: 'class', detail: 'Rejilla de 12 col (gap --ok-grid-gap) · celda (span 12 por defecto, min-width:0)' },
      { kind: 'prop', name: '.ok-md-N · .ok-lg-N · .ok-xl-N', type: 'class', detail: 'Span responsive (N = 3·4·6·8·9·12; breakpoints 768/992/1200)' },
      { kind: 'prop', name: '.ok-grid-cards', type: 'class', detail: 'Grid auto-fill minmax(--ok-card-min, 1fr) — sin clases de breakpoint' },
    ],
  },
  {
    id: 'ok-grid-recipes',
    name: 'Grid — casos de uso',
    category: 'web',
    desc: 'Recetas reales con la rejilla de layout.css: KPIs de dashboard, master-detail, grid de cards sin breakpoints y container de web pública. La regla: en dashboard (ion-split-pane) NUNCA .ok-container — el ancho lo da el panel; en web pública sí. Las clases .ok-md/lg/xl-* responden al ancho de VENTANA (media queries): en esta preview redimensiona la ventana del navegador, no el selector de viewport.',
    importPath: "@outfitkit/core/layout.css",
    example: `<div style="display:flex;flex-direction:column;gap:2rem;width:100%">

  <div>
    <p style="margin:0 0 .5rem;font-weight:600">1 · KPIs de dashboard — 4/2/1 columnas según ancho</p>
    <div class="ok-grid">
      <div class="ok-col ok-md-6 ok-xl-3"><ok-kpi label="Ventas hoy" value="€2.480" delta="+12%" trend="up" icon="cash-outline"></ok-kpi></div>
      <div class="ok-col ok-md-6 ok-xl-3"><ok-kpi label="Tickets" value="142" delta="+8%" trend="up" icon="receipt-outline"></ok-kpi></div>
      <div class="ok-col ok-md-6 ok-xl-3"><ok-kpi label="Ticket medio" value="€18,10" delta="estable" trend="flat"></ok-kpi></div>
      <div class="ok-col ok-md-6 ok-xl-3"><ok-kpi label="Devoluciones" value="4" delta="-2" trend="down" icon="return-down-back-outline"></ok-kpi></div>
    </div>
  </div>

  <div>
    <p style="margin:0 0 .5rem;font-weight:600">2 · Master-detail — contenido 8 + lateral 4</p>
    <div class="ok-grid">
      <div class="ok-col ok-md-8">
        <ion-card style="margin:0;height:100%"><ion-card-header><ion-card-title>Pedido #1042</ion-card-title></ion-card-header>
        <ion-card-content>Contenido principal (líneas del pedido, tabla, formulario…). Ocupa 8/12 desde 768px; a ancho móvil cae a una columna.</ion-card-content></ion-card>
      </div>
      <div class="ok-col ok-md-4">
        <ion-card style="margin:0;height:100%"><ion-card-header><ion-card-title>Resumen</ion-card-title></ion-card-header>
        <ion-card-content>Lateral (cliente, totales, acciones). 4/12.</ion-card-content></ion-card>
      </div>
    </div>
  </div>

  <div>
    <p style="margin:0 0 .5rem;font-weight:600">3 · .ok-grid-cards — auto-fill, sin clases de breakpoint</p>
    <div class="ok-grid-cards" style="--ok-card-min:180px">
      <ion-card style="margin:0"><ion-card-content>Café solo<br><strong>€1,40</strong></ion-card-content></ion-card>
      <ion-card style="margin:0"><ion-card-content>Cortado<br><strong>€1,50</strong></ion-card-content></ion-card>
      <ion-card style="margin:0"><ion-card-content>Tostada<br><strong>€2,20</strong></ion-card-content></ion-card>
      <ion-card style="margin:0"><ion-card-content>Zumo<br><strong>€2,80</strong></ion-card-content></ion-card>
      <ion-card style="margin:0"><ion-card-content>Croissant<br><strong>€1,90</strong></ion-card-content></ion-card>
    </div>
  </div>

  <div>
    <p style="margin:0 0 .5rem;font-weight:600">4 · .ok-container — solo web pública (centrado con max-width)</p>
    <div class="ok-container" style="background:var(--ok-surface-2);border-radius:8px;padding-block:1rem;text-align:center">
      Centrado a --ok-container-max. En dashboard NO: ahí el ancho útil lo da ion-split-pane.
    </div>
  </div>
</div>`,
    code: `<!-- 1 · Dashboard: KPIs 4/2/1 — dentro de ion-content, SIN .ok-container -->
<ion-content>
  <main class="ion-padding">
    <div class="ok-grid">
      <div class="ok-col ok-md-6 ok-xl-3"><ok-kpi label="Ventas hoy" value="€2.480"></ok-kpi></div>
      <div class="ok-col ok-md-6 ok-xl-3">…</div>
      <div class="ok-col ok-md-6 ok-xl-3">…</div>
      <div class="ok-col ok-md-6 ok-xl-3">…</div>
    </div>
  </main>
</ion-content>

<!-- 2 · Master-detail: contenido + lateral -->
<div class="ok-grid">
  <div class="ok-col ok-md-8"><ion-card>…contenido…</ion-card></div>
  <div class="ok-col ok-md-4"><ion-card>…resumen…</ion-card></div>
</div>

<!-- 3 · Grid de cards sin breakpoints (auto-fill; ajusta el mínimo con --ok-card-min) -->
<div class="ok-grid-cards" style="--ok-card-min:220px">
  <ion-card>…</ion-card>
  <ion-card>…</ion-card>
</div>

<!-- 4 · Web pública: container centrado (en dashboard NO se usa) -->
<div class="ok-container">…sección de landing…</div>`,
    api: [
      { kind: 'prop', name: 'Dashboard', type: 'receta', detail: 'ion-content + .ion-padding + .ok-grid — sin .ok-container (el ancho lo da el split-pane); min-width:0 de .ok-col evita desbordes' },
      { kind: 'prop', name: 'Spans', type: 'receta', detail: 'Móvil siempre 12 (apilado); .ok-md-N desde 768, .ok-lg-N desde 992, .ok-xl-N desde 1200 — combinables (ok-md-6 ok-xl-3 = 2 col tablet, 4 col desktop)' },
      { kind: 'prop', name: 'Cards/KPIs', type: 'receta', detail: '.ok-grid-cards cuando todas las celdas son iguales: cero clases de breakpoint, el nº de columnas sale solo de --ok-card-min' },
      { kind: 'prop', name: 'Web pública', type: 'receta', detail: '.ok-container para centrar secciones a --ok-container-max; .ok-section ya trae su propio centrado (no anidar ambos)' },
      { kind: 'prop', name: '--ok-grid-gap · --ok-card-min', type: 'CSS var', detail: 'Gap del grid (clamp fluido por defecto) · ancho mínimo de celda en .ok-grid-cards (260px por defecto)' },
    ],
  },
  {
    id: 'ok-table-stack',
    name: '.ok-table-stack (layout.css)',
    category: 'datos',
    desc: 'Tabla responsive «no more tables» como CSS PLANO (sin web component; para CRUDs ricos usa <ok-data-table>): en escritorio se ve como tabla y bajo 768px cada fila se convierte en una card apilada con la etiqueta de columna delante de cada celda (content: attr(data-title)). Funciona con <table> nativa, con divs (.ok-thead/.ok-trow/.ok-tcell) y con ion-grid/ion-row/ion-col.',
    importPath: "@outfitkit/core/layout.css",
    example: `<table class="ok-table-stack">
  <thead>
    <tr><th>Producto</th><th>SKU</th><th>Precio</th><th>Stock</th></tr>
  </thead>
  <tbody>
    <tr>
      <td data-title="Producto">Camiseta básica</td>
      <td data-title="SKU">TSH-001</td>
      <td data-title="Precio">9,90 €</td>
      <td data-title="Stock">142</td>
    </tr>
    <tr>
      <td data-title="Producto">Sudadera capucha</td>
      <td data-title="SKU">HOD-014</td>
      <td data-title="Precio">29,90 €</td>
      <td data-title="Stock">38</td>
    </tr>
  </tbody>
</table>`,
    code: `<link rel="stylesheet" href=".../layout.css">

<!-- 1 · Tabla nativa -->
<table class="ok-table-stack">
  <thead><tr><th>Producto</th><th>Precio</th><th></th></tr></thead>
  <tbody>
    <tr>
      <td data-title="Producto">Camiseta</td>
      <td data-title="Precio">9,90 €</td>
      <td><ion-button size="small">Editar</ion-button></td> <!-- sin data-title: ancho completo en móvil -->
    </tr>
  </tbody>
</table>

<!-- 2 · Divs (o cualquier elemento) -->
<div class="ok-table-stack">
  <div class="ok-thead"><div class="ok-tcell">Producto</div><div class="ok-tcell">Precio</div></div>
  <div class="ok-trow"><div class="ok-tcell" data-title="Producto">Camiseta</div><div class="ok-tcell" data-title="Precio">9,90 €</div></div>
</div>

<!-- 3 · Ionic -->
<ion-grid class="ok-table-stack">
  <ion-row class="ok-thead"><ion-col class="ok-tcell">Producto</ion-col><ion-col class="ok-tcell">Precio</ion-col></ion-row>
  <ion-row class="ok-trow"><ion-col class="ok-tcell" data-title="Producto">Camiseta</ion-col><ion-col class="ok-tcell" data-title="Precio">9,90 €</ion-col></ion-row>
</ion-grid>

<!-- Tokens: --ok-table-cols (columnas del markup no-<table>; p.ej. 2fr 1fr auto),
     --ok-table-label-w (ancho de la etiqueta en móvil, 45%) -->`,
    api: [
      { kind: 'prop', name: '.ok-table-stack', type: 'class', detail: 'Contenedor (en <table>, en un div o en ion-grid). Bajo 768px (md de Ionic) las filas se apilan como cards' },
      { kind: 'prop', name: '.ok-thead · .ok-trow · .ok-tcell', type: 'class', detail: 'Cabecera/fila/celda para markup no-<table> (divs o ion-row/ion-col); en <table> nativa no hacen falta' },
      { kind: 'prop', name: '[data-title]', type: 'attr', detail: 'Etiqueta de columna que la celda pinta delante en móvil (::before); sin él la celda ocupa el ancho completo (acciones)' },
      { kind: 'prop', name: '--ok-table-cols · --ok-table-label-w', type: 'CSS var', detail: 'Columnas del grid no-<table> (por defecto partes iguales) · ancho de etiqueta en móvil (45%)' },
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

  // ═══════════════════════════════ MARKETING ══════════════════════════════
  {
    id: 'ok-section',
    name: '.ok-section (layout.css)',
    category: 'marketing',
    desc: 'Sección de marketing como CSS PLANO sobre <section> nativo (sin web component, sin FOUC; antes era <ok-section>): eyebrow (píldora), título display, subtítulo y cuerpo. Modificadores --center (encabezado centrado) y --divider (separador superior). El centrado horizontal va en el propio elemento (padding-inline calculado), así el divisor cruza todo el ancho.',
    importPath: "@outfitkit/core/layout.css",
    example: `<section class="ok-section ok-section--center ok-section--divider" style="padding-block:2rem">
  <header class="ok-section-head">
    <span class="ok-eyebrow">Plataforma</span>
    <h2 class="ok-section-title">Todo en uno</h2>
    <p class="ok-section-sub">Cubre los huecos que Ionic no trae con un set ok-* tematizado.</p>
  </header>
  <div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(180px,1fr))">
    <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Bloque A</div>
    <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Bloque B</div>
    <div style="background:var(--ok-surface-2);padding:1rem;border-radius:8px">Bloque C</div>
  </div>
</section>`,
    code: `<section class="ok-section ok-section--center ok-section--divider">
  <header class="ok-section-head">
    <span class="ok-eyebrow">Marketplace</span>
    <h2 class="ok-section-title">Un ecosistema. <span style="color:var(--ion-color-primary)">Dos modos.</span></h2>
    <p class="ok-section-sub">…</p>
  </header>
  …contenido…
</section>`,
    api: [
      { kind: 'prop', name: '.ok-section', type: 'class', detail: 'Sección con ritmo vertical (--ok-section-pad-y) y ancho máximo (--ok-container-max)' },
      { kind: 'prop', name: '.ok-section--center · .ok-section--divider', type: 'class', detail: 'Encabezado centrado · separador superior de 1px' },
      { kind: 'prop', name: '.ok-section-head · .ok-eyebrow · .ok-section-title · .ok-section-sub', type: 'class', detail: 'Encabezado · píldora · título display · subtítulo' },
    ],
  },
  {
    id: 'ok-bento',
    name: 'ok-bento',
    category: 'marketing',
    desc: 'Rejilla «bento» modular (tendencia 2026): contenedor de celdas de tamaños variados. Las celdas son ok-bento-item (cada una ocupa cols×rows de la rejilla). En móvil colapsa a 1 columna automáticamente.',
    importPath: "@outfitkit/core/ok-bento",
    example: `<ok-bento cols="6" gap="1rem" style="width:100%">
  <ok-bento-item cols="4" rows="2" tone="primary" icon="lucide:zap" heading="Tiempo real">
    <p>Cada acción se refleja al instante en todos los dispositivos.</p>
  </ok-bento-item>
  <ok-bento-item cols="2" interactive icon="lucide:boxes" heading="Inventario">
    <p>Stock por almacén y lote.</p>
  </ok-bento-item>
  <ok-bento-item cols="2" glass icon="lucide:credit-card" heading="Cobros">
    <p>TPV, factura y caja.</p>
  </ok-bento-item>
  <ok-bento-item cols="4" tone="success" icon="lucide:chart-line" heading="Informes">
    <p>KPIs y tendencias en cada panel.</p>
  </ok-bento-item>
</ok-bento>`,
    code: `<ok-bento cols="6" gap="1rem">
  <ok-bento-item cols="4" rows="2" glass icon="lucide:zap" heading="Bridge">…</ok-bento-item>
  <ok-bento-item cols="2">…</ok-bento-item>
</ok-bento>`,
    api: [
      { kind: 'prop', name: 'cols · cols-md', type: 'number', detail: 'Columnas en escritorio (def 6) · en tablet ≤900px (def 4)' },
      { kind: 'prop', name: 'gap', type: 'CSS length', detail: 'Separación entre celdas (def 1rem)' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Celdas (ok-bento-item o cualquier elemento con grid-column/row)' },
    ],
  },
  {
    id: 'ok-bento-item',
    name: 'ok-bento-item',
    category: 'marketing',
    desc: 'Celda de una ok-bento. Ocupa cols×rows de la rejilla. Panel con superficie, borde y radio; opcionalmente glass (cristal esmerilado), tinte de color (tone), elevación al hover (interactive) y enlace (href). Encabezado opcional (eyebrow/heading/icon) + slot default. En móvil ocupa el ancho total.',
    importPath: "@outfitkit/core/ok-bento-item",
    example: `<ok-bento cols="4" gap="1rem" style="width:100%">
  <ok-bento-item cols="2" rows="1" icon="lucide:box" eyebrow="Catálogo" heading="Productos">
    <p>Define artículos, variantes y precios.</p>
  </ok-bento-item>
  <ok-bento-item cols="2" tone="warning" glass icon="lucide:bell" heading="Avisos">
    <p>Stock bajo y caducidades.</p>
  </ok-bento-item>
  <ok-bento-item cols="4" tone="primary" interactive href="#" icon="lucide:rocket" heading="Empieza ya">
    <p>Toda la celda es un enlace que se eleva al hover.</p>
  </ok-bento-item>
</ok-bento>`,
    code: `<ok-bento-item cols="4" rows="2" glass tone="primary"
  icon="lucide:zap" eyebrow="Nuevo" heading="Bridge" interactive href="/bridge">
  <p>Descripción de la celda…</p>
</ok-bento-item>`,
    api: [
      { kind: 'prop', name: 'cols · rows', type: 'number', detail: 'Columnas (def 2) · filas (def 1) que ocupa' },
      { kind: 'prop', name: 'tone', type: 'default|primary|success|warning|danger', detail: 'Tinte de acento' },
      { kind: 'prop', name: 'glass · interactive', type: 'bool', detail: 'Cristal esmerilado · eleva al hover (cursor/enlace)' },
      { kind: 'prop', name: 'href', type: 'string', detail: 'Si se pasa, toda la celda es un enlace' },
      { kind: 'prop', name: 'icon · eyebrow · heading', type: 'string', detail: 'Icono iconify (p.ej. lucide:zap) · eyebrow · título' },
      { kind: 'slot', name: 'icon · (default)', type: '—', detail: 'Icono alternativo · contenido de la celda' },
    ],
  },
  {
    id: 'ok-reveal',
    name: 'ok-reveal',
    category: 'marketing',
    desc: 'Anima su contenido al entrar en el viewport (scroll reveal, tendencia 2026). Usa IntersectionObserver (CSP-safe, sin eval) y respeta prefers-reduced-motion. delay para escalonar varios reveal seguidos.',
    importPath: "@outfitkit/core/ok-reveal",
    example: `<div style="display:flex;flex-direction:column;gap:1rem;width:100%">
  <ok-reveal variant="up">
    <div style="background:var(--ok-surface-2);padding:1.25rem;border-radius:12px">Aparece desde abajo (up).</div>
  </ok-reveal>
  <ok-reveal variant="left" delay="80">
    <div style="background:var(--ok-surface-2);padding:1.25rem;border-radius:12px">Entra desde la izquierda, con retardo.</div>
  </ok-reveal>
  <ok-reveal variant="scale" delay="160">
    <div style="background:var(--ok-surface-2);padding:1.25rem;border-radius:12px">Escala al revelarse.</div>
  </ok-reveal>
</div>`,
    code: `<ok-reveal variant="up" delay="80"> …bloque… </ok-reveal>
<!-- variant: up (def) | fade | scale | left | right -->
<!-- once (def true): revela una vez y deja de observar -->`,
    api: [
      { kind: 'prop', name: 'variant', type: 'up|fade|scale|left|right', detail: 'Variante de entrada (def up)' },
      { kind: 'prop', name: 'delay', type: 'number', detail: 'Retardo en ms (para escalonar)' },
      { kind: 'prop', name: 'once', type: 'bool', detail: 'Revela solo una vez (def true)' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Contenido a animar' },
    ],
  },
  {
    id: 'ok-feature-card',
    name: 'ok-feature-card',
    category: 'marketing',
    desc: 'Tarjeta de característica para marketing: icono + (eyebrow) + título + descripción (slot default). Eleva al hover con línea de acento superior. Si se pasa href, toda la tarjeta es enlace. Reemplaza el patrón ion-card manual de la landing.',
    importPath: "@outfitkit/core/ok-feature-card",
    example: `<div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));width:100%">
  <ok-feature-card icon="lucide:credit-card" eyebrow="01 · POS" heading="Punto de venta">
    Cobra, factura y controla caja desde cualquier dispositivo.
  </ok-feature-card>
  <ok-feature-card icon="lucide:boxes" eyebrow="02 · Stock" heading="Inventario">
    Ubicaciones, lotes y picking en varios almacenes.
  </ok-feature-card>
  <ok-feature-card icon="lucide:users" eyebrow="03 · CRM" heading="Clientes" href="#">
    Fichas, grupos y notas; toda la tarjeta es un enlace.
  </ok-feature-card>
</div>`,
    code: `<ok-feature-card icon="lucide:box" eyebrow="01 · POS" heading="Punto de venta">
  Cobra, factura y controla caja desde cualquier dispositivo.
</ok-feature-card>
<!-- href → tarjeta-enlace · glass → cristal esmerilado · slot="icon" para una <img> -->`,
    api: [
      { kind: 'prop', name: 'icon', type: 'string', detail: 'Icono iconify (p.ej. lucide:box); para img usa slot="icon"' },
      { kind: 'prop', name: 'eyebrow · heading', type: 'string', detail: 'Eyebrow (numeración/categoría) · título' },
      { kind: 'prop', name: 'href', type: 'string', detail: 'Si se pasa, la tarjeta entera es un enlace' },
      { kind: 'prop', name: 'glass', type: 'bool', detail: 'Cristal esmerilado' },
      { kind: 'slot', name: 'icon · (default)', type: '—', detail: 'Icono alternativo · descripción' },
    ],
  },
  {
    id: 'ok-pricing-card',
    name: 'ok-pricing-card',
    category: 'marketing',
    desc: 'Tarjeta de plan/precio: nombre, precio + periodo, descripción, lista de features (prop .features o slot con <ul>) y CTA (slot="cta"). featured la destaca con borde de marca y badge flotante. Pensada para una rejilla de planes.',
    importPath: "@outfitkit/core/ok-pricing-card",
    example: `<div style="display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));width:100%;padding-top:1rem">
  <ok-pricing-card id="pc-basic" name="Básico" price="€0" period="/ mes" description="Para empezar."></ok-pricing-card>
  <ok-pricing-card id="pc-pro" name="Pro" price="€49" period="/ mes" description="Para equipos en crecimiento." featured badge="Popular"></ok-pricing-card>
  <ok-pricing-card id="pc-ent" name="Empresa" price="A medida" description="Volumen y soporte dedicado."></ok-pricing-card>
</div>`,
    setup: (root) => {
      root.querySelector('#pc-basic').features = ['1 hub', '3 módulos', 'Soporte por email'];
      const pro = root.querySelector('#pc-pro');
      pro.features = ['Hubs ilimitados', 'Todos los módulos', 'Soporte prioritario', 'Asistente AI'];
      const cta = document.createElement('ion-button');
      cta.setAttribute('slot', 'cta');
      cta.setAttribute('expand', 'block');
      cta.textContent = 'Empezar';
      pro.appendChild(cta);
      root.querySelector('#pc-ent').features = ['SLA dedicado', 'Onboarding', 'Facturación anual'];
    },
    code: `<ok-pricing-card name="Pro" price="€49" period="/ mes"
  .features=\${['Hubs ilimitados', 'Todos los módulos']} featured badge="Popular">
  <ion-button slot="cta" expand="block" href="/signup">Empezar</ion-button>
</ok-pricing-card>`,
    api: [
      { kind: 'prop', name: 'name · price · period', type: 'string', detail: 'Nombre · precio formateado · periodo (p.ej. "/ mes")' },
      { kind: 'prop', name: 'description', type: 'string', detail: 'Descripción corta' },
      { kind: 'prop', name: '.features', type: 'string[]', detail: 'Lista de características (alternativa: slot default con un <ul>)' },
      { kind: 'prop', name: 'featured · badge', type: 'bool · string', detail: 'Plan destacado · texto del badge (def "Popular" si featured)' },
      { kind: 'slot', name: 'cta · (default)', type: '—', detail: 'Botón de acción · lista de features alternativa' },
    ],
  },
  {
    id: 'ok-product-card',
    name: 'ok-product-card',
    category: 'marketing',
    desc: 'Tarjeta de producto/módulo del catálogo (marketplace): icono + categoría + nombre + descripción (slot) + badge opcional + precio. Si hay href, toda la tarjeta es enlace y muestra una flecha «ir» al hover.',
    importPath: "@outfitkit/core/ok-product-card",
    example: `<div style="display:grid;gap:1rem;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));width:100%">
  <ok-product-card icon="lucide:boxes" category="Inventario" name="WMS multi-almacén" badge="Premium" price="€12/mes" href="#">
    Gestiona ubicaciones, lotes y picking en varios almacenes.
  </ok-product-card>
  <ok-product-card icon="lucide:credit-card" category="Ventas" name="TPV avanzado" badge="Incluido" price="Gratis">
    Cobro rápido, devoluciones y arqueo de caja.
  </ok-product-card>
</div>`,
    code: `<ok-product-card icon="lucide:boxes" category="Inventario" name="WMS multi-almacén"
  badge="Premium" price="€12/mes" href="/modules/wms">
  Gestiona ubicaciones, lotes y picking en varios almacenes.
</ok-product-card>`,
    api: [
      { kind: 'prop', name: 'icon · category · name', type: 'string', detail: 'Icono iconify (o slot="icon") · categoría · nombre' },
      { kind: 'prop', name: 'badge · price', type: 'string', detail: 'Badge (precio/estado) · precio del pie' },
      { kind: 'prop', name: 'href', type: 'string', detail: 'Si se pasa, la tarjeta es enlace (flecha «ir» al hover)' },
      { kind: 'slot', name: 'icon · (default)', type: '—', detail: 'Icono alternativo · descripción' },
    ],
  },
  {
    id: 'ok-logo-cloud',
    name: 'ok-logo-cloud',
    category: 'marketing',
    desc: 'Banda de logos de clientes / «trusted by» (prueba social). Acepta los logos como slot (imgs o texto) y los muestra en rejilla atenuada (grayscale → color al hover). Con marquee desplaza la fila en bucle (CSS, sin JS). label opcional encima.',
    importPath: "@outfitkit/core/ok-logo-cloud",
    example: `<ok-logo-cloud label="Usado por equipos de" style="width:100%">
  <span>Café Central</span>
  <span>Moda Norte</span>
  <span>Bici&Co</span>
  <span>Pan del Día</span>
  <span>Veterinaria Sur</span>
</ok-logo-cloud>`,
    code: `<ok-logo-cloud label="Usado por equipos de">
  <img src="/a.svg" alt="A"><img src="/b.svg" alt="B"> …
</ok-logo-cloud>
<!-- marquee: desplaza en bucle (duplica los logos para continuidad) -->`,
    api: [
      { kind: 'prop', name: 'label', type: 'string', detail: 'Etiqueta opcional encima de los logos' },
      { kind: 'prop', name: 'marquee', type: 'bool', detail: 'Desplaza la fila en bucle (duplica los logos en el HTML)' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Logos (imgs o texto)' },
    ],
  },
  {
    id: 'ok-testimonial',
    name: 'ok-testimonial',
    category: 'marketing',
    desc: 'Cita de cliente (prueba social): rating opcional en estrellas, cita (slot default), avatar (o iniciales) + autor + rol. glass para cristal esmerilado. Pensada para una rejilla de testimonios.',
    importPath: "@outfitkit/core/ok-testimonial",
    example: `<div style="display:grid;gap:1.25rem;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));width:100%">
  <ok-testimonial rating="5" author="Marina Ribó" author-role="Gerente · Café Central">
    Cambiamos 7 herramientas por ERPlora y cerramos caja en la mitad de tiempo.
  </ok-testimonial>
  <ok-testimonial rating="4" author="Joaquín Gómez" author-role="Dueño · Bici&Co" glass>
    El inventario por almacén nos quitó un dolor de cabeza diario.
  </ok-testimonial>
</div>`,
    code: `<ok-testimonial rating="5" author="Marina Ribó"
  author-role="Gerente · Café Central" avatar="/m.jpg">
  Cambiamos 7 herramientas por ERPlora y cerramos caja en la mitad de tiempo.
</ok-testimonial>`,
    api: [
      { kind: 'prop', name: 'rating', type: 'number', detail: 'Estrellas 0–5 (0/undefined no se muestran)' },
      { kind: 'prop', name: 'author · author-role', type: 'string', detail: 'Nombre · rol/empresa (atributo author-role; role está reservado por ARIA)' },
      { kind: 'prop', name: 'avatar', type: 'string', detail: 'URL del avatar (si no hay, muestra iniciales)' },
      { kind: 'prop', name: 'glass', type: 'bool', detail: 'Cristal esmerilado' },
      { kind: 'slot', name: '(default)', type: '—', detail: 'Texto de la cita' },
    ],
  },
  {
    id: 'ok-cta-band',
    name: 'ok-cta-band',
    category: 'marketing',
    desc: 'Banda de llamada a la acción (final de página/sección). Fondo con degradado de marca (variant solid, def) o soft/glass, título grande, subtítulo y CTAs (slot="actions", normalmente ion-button). Centrada por defecto.',
    importPath: "@outfitkit/core/ok-cta-band",
    example: `<ok-cta-band eyebrow="Empieza hoy" heading="Tu ERP, listo en 5 minutos" subheading="Sin tarjeta. Sin instalación." style="width:100%">
  <ion-button slot="actions" href="#">Crear mi hub</ion-button>
  <ion-button slot="actions" fill="outline" href="#">Ver demo</ion-button>
</ok-cta-band>`,
    code: `<ok-cta-band eyebrow="Empieza hoy" heading="Tu ERP, listo en 5 minutos"
  subheading="Sin tarjeta. Sin instalación." variant="solid">
  <ion-button slot="actions" href="/signup">Crear mi hub</ion-button>
  <ion-button slot="actions" fill="outline" href="/demo">Ver demo</ion-button>
</ok-cta-band>
<!-- Título rico: <h2 slot="heading">…</h2> -->`,
    api: [
      { kind: 'prop', name: 'eyebrow · heading · subheading', type: 'string', detail: 'Eyebrow · título (slot="heading" para markup rico) · subtítulo' },
      { kind: 'prop', name: 'variant', type: 'solid|soft|glass', detail: 'Estilo de fondo (def solid, degradado de marca)' },
      { kind: 'slot', name: 'heading · actions', type: '—', detail: 'Título rico · CTAs (ion-button)' },
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
  {
    id: 'ok-receipt',
    name: 'ok-receipt',
    category: 'multimedia',
    desc: 'Tiquet/recibo de venta (POS) presentacional: recibe un JSON (prop .receipt) y lo pinta con estética de impresora térmica (80mm). Cabecera de negocio (+logo), líneas, subtotal/impuestos/total, pago+cambio, pie y QR (reusa ok-qr, p.ej. VeriFactu). No habla con ningún backend; cualquier botón externo le pasa el JSON.',
    importPath: "@outfitkit/core/ok-receipt",
    example: '<ok-receipt id="rcpt" style="display:block;box-shadow:0 6px 24px rgba(0,0,0,.18);background:#fff"></ok-receipt>',
    setup: (root) => {
      const el = root.querySelector('#rcpt');
      if (el) el.receipt = {
        business: { name: 'Bar Pepe', address: 'C/ Mayor 1, 28013 Madrid', tax_id: 'NIF B12345678', phone: '600 123 123' },
        number: 'A-000142', datetime: '09/06/2026 14:32', cashier: 'Ana', customer: 'Juan García',
        lines: [
          { name: 'Café con leche', qty: 2, unit_price: 1.5, total: 3.0 },
          { name: 'Tostada con tomate', qty: 1, unit_price: 2.2, total: 2.2, note: 'sin sal' },
          { name: 'Zumo de naranja natural', qty: 1, unit_price: 2.8, total: 2.8 },
        ],
        subtotal: 8.0,
        taxes: [{ label: 'IVA 10%', base: 8.0, amount: 0.8 }],
        total: 8.8,
        payment: { method: 'Efectivo', paid: 10.0, change: 1.2 },
        currency: '€',
        footer: '¡Gracias por su visita!\nwww.barpepe.example',
        qr: 'https://prevalidacion.aeat.es/tikR/SmartRetail?nif=B12345678&num=A-000142&total=8.80',
        qr_note: 'Factura verificable en la sede electrónica de la AEAT (VeriFactu)',
      };
    },
    code: `const el = document.createElement('ok-receipt');
el.receipt = {
  business: { name: 'Bar Pepe', tax_id: 'NIF B12345678', logo_url: '/logo.png' },
  number: 'A-000142', datetime: '09/06/2026 14:32',
  lines: [{ name: 'Café', qty: 2, unit_price: 1.5, total: 3.0 }],
  subtotal: 3.0, taxes: [{ label: 'IVA 10%', base: 3.0, amount: 0.3 }], total: 3.3,
  payment: { method: 'Efectivo', paid: 5, change: 1.7 },
  qr: 'https://…', qr_note: 'VeriFactu',
};
container.appendChild(el);
// Imprimir desde el contenedor padre: window.print() + @media print`,
    api: [
      { kind: 'prop', name: 'receipt', type: 'ReceiptData', detail: 'JSON del tiquet (business · lines · totales · payment · qr…)' },
      { kind: 'prop', name: 'qr-size', type: 'number', detail: 'Lado del QR en px (def 120)' },
      { kind: 'slot', name: 'logo', type: '—', detail: 'Logo alternativo si no hay business.logo_url' },
    ],
  },
  {
    id: 'ok-invoice',
    name: 'ok-invoice',
    category: 'multimedia',
    desc: 'Factura A4 (documento fiscal completo) presentacional: recibe un JSON (prop .invoice) y lo pinta como factura profesional — emisor+receptor con datos fiscales, líneas con descuento/impuesto, resumen de impuestos por tipo, totales, condiciones de pago, pie legal y QR opcional (reusa ok-qr). Hermano A4 de ok-receipt (tiquet 80mm). No habla con backend.',
    importPath: "@outfitkit/core/ok-invoice",
    example: '<ok-invoice id="inv" style="display:block;box-shadow:0 6px 24px rgba(0,0,0,.18)"></ok-invoice>',
    setup: (root) => {
      const el = root.querySelector('#inv');
      if (el) el.invoice = {
        issuer: { name: 'ERPlora S.L.', tax_id: 'B-12345678', address: 'C/ Mayor 1', postal_code: '28013', city: 'Madrid', country: 'España', email: 'hola@erplora.com' },
        customer: { name: 'Cliente Ejemplo S.A.', tax_id: 'A-87654321', address: 'Av. Diagonal 100', postal_code: '08019', city: 'Barcelona', country: 'España' },
        type: 'F1 · Factura completa', number: 'F2026/0042', issue_date: '09/06/2026', due_date: '09/07/2026',
        lines: [
          { description: 'Licencia ERPlora — plan Pro (anual)', qty: 1, unit_price: 480.0, tax_rate: 21, total: 480.0 },
          { description: 'Módulo VeriFactu', qty: 1, unit_price: 120.0, discount_percent: 10, tax_rate: 21, total: 108.0 },
          { description: 'Soporte prioritario (horas)', qty: 5, unit_price: 60.0, tax_rate: 21, total: 300.0 },
        ],
        subtotal: 888.0,
        discount_total: 12.0,
        taxes: [{ label: 'IVA 21%', rate: 21, base: 888.0, amount: 186.48 }],
        tax_total: 186.48,
        total: 1074.48,
        currency: '€',
        payment_method: 'Transferencia bancaria',
        payment_terms: 'IBAN ES12 3456 7890 1234 5678 9012 · Vencimiento a 30 días',
        notes: 'Gracias por confiar en ERPlora.',
        footer: 'ERPlora S.L. · Inscrita en el Registro Mercantil de Madrid, Tomo 0000, Folio 00, Hoja M-000000 · NIF B-12345678',
        qr: 'https://prevalidacion.aeat.es/tikR/SmartRetail?nif=B12345678&num=F2026/0042&total=1074.48',
        qr_note: 'Factura verificable en la AEAT (VeriFactu)',
      };
    },
    code: `const el = document.createElement('ok-invoice');
el.invoice = {
  issuer:   { name: 'ERPlora S.L.', tax_id: 'B-12345678', address: 'C/ Mayor 1', city: 'Madrid' },
  customer: { name: 'Cliente S.A.', tax_id: 'A-87654321', city: 'Barcelona' },
  type: 'F1', number: 'F2026/0042', issue_date: '09/06/2026', due_date: '09/07/2026',
  lines: [{ description: 'Licencia Pro', qty: 1, unit_price: 480, tax_rate: 21, total: 480 }],
  subtotal: 480, taxes: [{ label: 'IVA 21%', base: 480, amount: 100.8 }], tax_total: 100.8, total: 580.8,
  payment_method: 'Transferencia', payment_terms: 'IBAN ES… · 30 días',
  qr: 'https://…', qr_note: 'VeriFactu',
};
container.appendChild(el);`,
    api: [
      { kind: 'prop', name: 'invoice', type: 'InvoiceData', detail: 'JSON de la factura (issuer · customer · lines · taxes · totales · pago · qr…)' },
      { kind: 'prop', name: 'qr-size', type: 'number', detail: 'Lado del QR en px (def 96)' },
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

  // ════════════ ux-legacy port (Tier 1+2) ════════════
  {
    id: "ok-pagination",
    name: "ok-pagination",
    category: "datos",
    desc: "Paginador numerado (sobre ion-button/ion-select) con chevrons prev/next, colapso por elipsis (sibling-count/boundary-count), info \"X–Y de Z\" y selector de filas. Presentacional: emite ok-page-change y ok-page-size-change.",
    importPath: "@outfitkit/core/ok-pagination",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.75rem;padding:.5rem 0\">\n  <div>\n    <div style=\"font-size:.75rem;color:var(--ion-color-medium);margin-bottom:.5rem\">Completo · con info y selector de filas</div>\n    <ok-pagination id=\"pg-full\" total=\"487\" page=\"4\" page-size=\"20\" info></ok-pagination>\n  </div>\n  <div>\n    <div style=\"font-size:.75rem;color:var(--ion-color-medium);margin-bottom:.5rem\">Numerado · elipsis</div>\n    <ok-pagination total=\"1240\" page=\"9\" page-size=\"25\"></ok-pagination>\n  </div>\n  <div>\n    <div style=\"font-size:.75rem;color:var(--ion-color-medium);margin-bottom:.5rem\">Compacto</div>\n    <ok-pagination total=\"96\" page=\"2\" page-size=\"20\" variant=\"compact\"></ok-pagination>\n  </div>\n</div>",
    setup: (root, ctx) => {
const full = root.querySelector('#pg-full');
if (full) {
  full.pageSizeOptions = [10, 20, 50, 100];
  full.addEventListener('ok-page-change', (e) => { full.page = e.detail.page; });
  full.addEventListener('ok-page-size-change', (e) => { full.pageSize = e.detail.size; full.page = 1; });
}
    },
    code: "<ok-pagination total=\"487\" page=\"4\" page-size=\"20\" info></ok-pagination>\nconst pg = document.querySelector('ok-pagination');\npg.pageSizeOptions = [10, 20, 50, 100];\npg.addEventListener('ok-page-change', (e) => { pg.page = e.detail.page; load(pg.page); });\npg.addEventListener('ok-page-size-change', (e) => { pg.pageSize = e.detail.size; pg.page = 1; });",
    api: [{"kind": "prop", "name": "total · page · page-size", "type": "number · number · number", "detail": "Total de elementos, página actual (base 1) y tamaño de página"}, {"kind": "prop", "name": "variant", "type": "'default'|'compact'", "detail": "Numerado completo o compacto (prev/valor/next)"}, {"kind": "prop", "name": "info", "type": "boolean", "detail": "Muestra el texto \"X–Y de Z\""}, {"kind": "prop", "name": ".pageSizeOptions", "type": "number[]", "detail": "Si se pasan, muestra un ion-select de filas por página"}, {"kind": "prop", "name": "sibling-count · boundary-count", "type": "number · number", "detail": "Páginas vecinas a cada lado de la activa y fijas en cada extremo"}, {"kind": "event", "name": "ok-page-change", "type": "CustomEvent<{page:number}>", "detail": "Emitido al pulsar una página o chevron"}, {"kind": "event", "name": "ok-page-size-change", "type": "CustomEvent<{size:number}>", "detail": "Emitido al cambiar filas por página en el selector"}],
  },
  {
    id: "ok-skeleton",
    name: "ok-skeleton",
    category: "feedback",
    desc: "Placeholder de carga (shimmer) con variantes de forma (text/title/circle/avatar/button/chip/card/row), stack de líneas de anchos decrecientes (lines) y presets compuestos (preset=\"card\"/\"table\"/\"chart\"). Respeta prefers-reduced-motion. Sin eventos.",
    importPath: "@outfitkit/core/ok-skeleton",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem\">\n  <ok-skeleton variant=\"title\" width=\"40%\"></ok-skeleton>\n  <ok-skeleton variant=\"text\" lines=\"3\"></ok-skeleton>\n  <div style=\"display:flex;gap:1rem;align-items:center;flex-wrap:wrap\">\n    <ok-skeleton variant=\"avatar\" width=\"48px\" height=\"48px\" style=\"width:auto\"></ok-skeleton>\n    <ok-skeleton variant=\"chip\" style=\"width:auto\"></ok-skeleton>\n    <ok-skeleton variant=\"button\" style=\"width:auto\"></ok-skeleton>\n    <ok-skeleton variant=\"circle\" width=\"56px\" height=\"56px\" style=\"width:auto\"></ok-skeleton>\n  </div>\n  <ok-skeleton preset=\"card\"></ok-skeleton>\n  <ok-skeleton preset=\"table\" rows=\"4\" cols=\"4\"></ok-skeleton>\n  <ok-skeleton preset=\"chart\" cols=\"9\"></ok-skeleton>\n</div>",
    code: "// Variante simple\n<ok-skeleton variant=\"title\" width=\"40%\"></ok-skeleton>\n<ok-skeleton variant=\"text\" lines=\"3\"></ok-skeleton>\n\n// Presets compuestos\n<ok-skeleton preset=\"card\"></ok-skeleton>\n<ok-skeleton preset=\"table\" rows=\"5\" cols=\"4\"></ok-skeleton>\n<ok-skeleton preset=\"chart\" cols=\"9\"></ok-skeleton>",
    api: [{"kind": "prop", "name": "variant", "type": "text|title|circle|avatar|button|chip|card|row", "detail": "Forma del bloque individual"}, {"kind": "prop", "name": "lines", "type": "number", "detail": "Nº de líneas apiladas (text/title; >1 activa el stack 92/78/60%)"}, {"kind": "prop", "name": "preset", "type": "none|card|table|chart", "detail": "Scaffold de placeholder compuesto"}, {"kind": "prop", "name": "rows", "type": "number", "detail": "Filas del preset table (incluye cabecera)"}, {"kind": "prop", "name": "cols", "type": "number", "detail": "Columnas del preset table / nº de barras del preset chart"}, {"kind": "prop", "name": "width · height · radius", "type": "string", "detail": "Overrides CSS explícitos de la variante (p.ej. \"120px\", \"40%\")"}],
  },
  {
    id: "ok-gauge",
    name: "ok-gauge",
    category: "graficos",
    desc: "Medidor en SVG a mano (CSP-safe) con tres tipos: 'arc' (semicírculo), 'ring' (anillo) y 'bullet' (barra Tufte con zonas + objetivo). Props: type, value, min/max, .thresholds (zonas que tiñen el relleno), target, label/sublabel, color, size, unit. Sin eventos.",
    importPath: "@outfitkit/core/ok-gauge",
    example: "<div style=\"display:flex;gap:1.75rem;align-items:flex-end;flex-wrap:wrap\">\n  <ok-gauge id=\"g-arc\" type=\"arc\" value=\"82\" size=\"150\" label=\"Ocupación mesas\" sublabel=\"Servicio noche\"></ok-gauge>\n  <ok-gauge id=\"g-ring\" type=\"ring\" value=\"63\" size=\"140\" label=\"OEE línea 2\"></ok-gauge>\n  <div style=\"flex:1 1 260px;min-width:240px;display:flex;flex-direction:column;gap:1.25rem\">\n    <ok-gauge id=\"g-b1\" type=\"bullet\" value=\"14820\" min=\"0\" max=\"20000\" target=\"16000\" unit=\" €\" label=\"Ventas hoy\" sublabel=\"objetivo 16.000\"></ok-gauge>\n    <ok-gauge id=\"g-b2\" type=\"bullet\" value=\"47\" min=\"0\" max=\"100\" target=\"80\" label=\"Margen medio\"></ok-gauge>\n  </div>\n</div>",
    setup: (root, ctx) => {
const warmZones = [
  { to: 50, color: '#eb445a' },
  { to: 75, color: '#ffc409' },
  { to: 100, color: '#2dd36f' },
];
root.querySelector('#g-arc').thresholds = warmZones;
root.querySelector('#g-ring').thresholds = warmZones;
root.querySelector('#g-b1').thresholds = [
  { to: 8000, color: '#eb445a' },
  { to: 14000, color: '#ffc409' },
  { to: 20000, color: '#2dd36f' },
];
root.querySelector('#g-b2').thresholds = [
  { to: 30, color: '#eb445a' },
  { to: 60, color: '#ffc409' },
  { to: 100, color: '#2dd36f' },
];
    },
    code: "// Anillo con zonas cualitativas\nconst g = document.querySelector('ok-gauge');\ng.thresholds = [\n  { to: 50, color: '#eb445a' },\n  { to: 75, color: '#ffc409' },\n  { to: 100, color: '#2dd36f' },\n];\n// &lt;ok-gauge type=\"arc\" value=\"82\" label=\"Ocupación\"&gt;&lt;/ok-gauge&gt;\n// &lt;ok-gauge type=\"ring\" value=\"63\" size=\"140\"&gt;&lt;/ok-gauge&gt;\n// &lt;ok-gauge type=\"bullet\" value=\"14820\" max=\"20000\" target=\"16000\" unit=\" €\"&gt;&lt;/ok-gauge&gt;",
    api: [{"kind": "prop", "name": "type", "type": "'arc'|'ring'|'bullet'", "detail": "Semicírculo · anillo · barra bullet"}, {"kind": "prop", "name": "value", "type": "number", "detail": "Valor actual a representar"}, {"kind": "prop", "name": "min · max", "type": "number", "detail": "Escala (por defecto 0..100)"}, {"kind": "prop", "name": ".thresholds", "type": "{to,color}[]", "detail": "Zonas cualitativas; fijan el color del relleno"}, {"kind": "prop", "name": "target", "type": "number", "detail": "Marcador de objetivo (solo bullet)"}, {"kind": "prop", "name": "label · sublabel", "type": "string", "detail": "Etiqueta principal · texto secundario"}, {"kind": "prop", "name": "color · size · unit", "type": "string · number · string", "detail": "Color explícito · diámetro px (arc/ring) · sufijo del valor (def '%')"}],
  },
  {
    id: "ok-chart",
    name: "ok-chart",
    category: "graficos",
    desc: "Gráfico declarativo en SVG inline (línea, área o barras) autocontenido y CSP-safe: rejilla, eje de valor, etiquetas X, leyenda, series con color/punteado/atenuado y punto final con etiqueta. Props: type, .series, .labels, .axis, gridlines, height, endpoint, endpointLabel. Presentacional, sin eventos.",
    importPath: "@outfitkit/core/ok-chart",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.5rem;max-width:560px\">\n  <ok-chart id=\"c-area\" type=\"area\" height=\"180\" endpoint gridlines></ok-chart>\n  <ok-chart id=\"c-bar\" type=\"bar\" height=\"160\" gridlines></ok-chart>\n</div>",
    setup: (root, ctx) => {
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];

const area = root.querySelector('#c-area');
area.labels = meses;
area.axis = ['18 k', '12 k', '6 k', '0'];
area.endpointLabel = '17,4 k €';
area.series = [
  { name: 'Ventas 2026', color: '#3880ff', data: [9200, 10800, 9600, 13200, 12500, 17400] },
  { name: 'Previsión', color: '#3880ff', dashed: true, data: [17400, 18600] },
];

const bar = root.querySelector('#c-bar');
bar.labels = meses;
bar.axis = ['600', '400', '200', '0'];
bar.series = [
  { name: 'Este año', color: '#2dd36f', data: [320, 410, 380, 520, 470, 580] },
  { name: 'Año anterior', mute: true, data: [280, 300, 340, 360, 390, 420] },
];
    },
    code: "const chart = document.querySelector('ok-chart');\nchart.labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];\nchart.axis = ['18 k', '12 k', '6 k', '0'];\nchart.series = [\n  { name: 'Ventas 2026', color: '#3880ff', data: [9200, 10800, 9600, 13200, 12500, 17400] },\n];\n// <ok-chart type=\"area\" height=\"180\" endpoint gridlines></ok-chart>",
    api: [{"kind": "prop", "name": "type", "type": "'line'|'area'|'bar'", "detail": "Tipo de gráfico (def 'line')"}, {"kind": "prop", "name": ".series", "type": "OkChartSeries[]", "detail": "Series {name,color,data,dashed?,mute?}"}, {"kind": "prop", "name": ".labels", "type": "string[]", "detail": "Etiquetas del eje X (abajo)"}, {"kind": "prop", "name": ".axis", "type": "string[]", "detail": "Etiquetas del eje de valor (izquierda, arriba→abajo)"}, {"kind": "prop", "name": "gridlines", "type": "boolean", "detail": "Líneas de rejilla horizontales (def true)"}, {"kind": "prop", "name": "height", "type": "number", "detail": "Alto del SVG en px (def 200)"}, {"kind": "prop", "name": "endpoint · endpointLabel", "type": "boolean · string", "detail": "Punto + etiqueta de valor al final de la 1ª serie"}],
  },
  {
    id: "ok-donut",
    name: "ok-donut",
    category: "graficos",
    desc: "Gráfico donut/pie dibujado en SVG (lo que Ionic no trae): segmentos proporcionales con leyenda y porcentajes calculados, más valor/label central. Props: .slices, size, thickness (0 ⇒ pie), center-value, center-label, legend, legend-side. Presentacional, sin eventos.",
    importPath: "@outfitkit/core/ok-donut",
    example: "<div style=\"display:flex;gap:2.5rem;align-items:center;flex-wrap:wrap;padding:.5rem\">\n  <ok-donut id=\"d-ventas\" size=\"160\" thickness=\"20\" center-value=\"8.420€\" center-label=\"Ventas mes\"></ok-donut>\n  <ok-donut id=\"d-pago\" size=\"150\" thickness=\"0\" legend-side=\"bottom\"></ok-donut>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#d-ventas').slices = [
  { label: 'Comidas', value: 4200 },
  { label: 'Bebidas', value: 2100 },
  { label: 'Postres', value: 1320 },
  { label: 'Otros', value: 800 },
];
root.querySelector('#d-pago').slices = [
  { label: 'Tarjeta', value: 62, color: '#3880ff' },
  { label: 'Efectivo', value: 28, color: '#2dd36f' },
  { label: 'Bizum', value: 10, color: '#ffc409' },
];
    },
    code: "const d = document.querySelector('ok-donut');\nd.slices = [\n  { label: 'Comidas', value: 4200 },\n  { label: 'Bebidas', value: 2100 },\n  { label: 'Postres', value: 1320 },\n];\n// &lt;ok-donut size=\"160\" thickness=\"20\" center-value=\"8.420€\" center-label=\"Ventas mes\"&gt;&lt;/ok-donut&gt;",
    api: [{"kind": "prop", "name": ".slices", "type": "OkDonutSlice[]", "detail": "Segmentos {label, value, color?}; el % se calcula sobre el total"}, {"kind": "prop", "name": "size", "type": "number", "detail": "Diámetro del SVG en px (def 140)"}, {"kind": "prop", "name": "thickness", "type": "number", "detail": "Grosor del anillo en px (def 16); 0 ⇒ pie macizo"}, {"kind": "prop", "name": "center-value", "type": "string", "detail": "Valor grande central; vacío ⇒ sin texto central"}, {"kind": "prop", "name": "center-label", "type": "string", "detail": "Texto en mayúsculas bajo el valor central"}, {"kind": "prop", "name": "legend", "type": "boolean", "detail": "Muestra la leyenda (def true)"}, {"kind": "prop", "name": "legend-side", "type": "'side'|'bottom'", "detail": "Posición de la leyenda (def 'side')"}],
  },
  {
    id: "ok-heatmap",
    name: "ok-heatmap",
    category: "graficos",
    desc: "Heatmap de calendario/contribución (estilo GitHub) en CSS puro: celdas coloreadas por intensidad (cuantiles sobre value, o level explícito). Props .data, layout (weeks|year), levels, scale, cell-size, legend. Sin eventos.",
    importPath: "@outfitkit/core/ok-heatmap",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.5rem;max-width:560px\">\n  <div>\n    <div style=\"font-size:13px;color:var(--ion-color-medium);margin-bottom:8px\">Actividad de ventas · últimas semanas</div>\n    <ok-heatmap id=\"hm-weeks\" layout=\"weeks\" cell-size=\"13\" legend></ok-heatmap>\n  </div>\n  <div>\n    <div style=\"font-size:13px;color:var(--ion-color-medium);margin-bottom:8px\">Pedidos por día · año (escala verde)</div>\n    <ok-heatmap id=\"hm-year\" layout=\"year\" scale=\"#2dd36f\"></ok-heatmap>\n  </div>\n</div>",
    setup: (root, ctx) => {
// Genera datos {date, value} para ~17 semanas (layout weeks)
const weeks = [];
const start = new Date('2026-02-09');
for (let i = 0; i < 17 * 7; i++) {
  const d = new Date(start);
  d.setDate(start.getDate() + i);
  const dow = d.getDay();
  // Fines de semana más flojos, picos a media semana
  const base = dow === 0 || dow === 6 ? 2 : 8;
  const value = Math.max(0, Math.round(base + Math.sin(i / 4) * 6 + (i % 5) * 2 - 3));
  weeks.push({ date: d.toISOString().slice(0, 10), value, label: `${d.toISOString().slice(0, 10)} · ${value} ventas` });
}
root.querySelector('#hm-weeks').data = weeks;

// Genera datos para el año completo (layout year)
const year = [];
const yStart = new Date('2026-01-01');
for (let i = 0; i < 365; i++) {
  const d = new Date(yStart);
  d.setDate(yStart.getDate() + i);
  const value = Math.max(0, Math.round(5 + Math.cos(i / 30) * 5 + (i % 7) * 1.5 - 2));
  year.push({ date: d.toISOString().slice(0, 10), value });
}
root.querySelector('#hm-year').data = year;
    },
    code: "// {date, value} → el nivel se deriva por cuantiles; o {key, level} explícito\nconst hm = document.querySelector('ok-heatmap');\nhm.data = [\n  { date: '2026-06-01', value: 12, label: '1 jun · 12 ventas' },\n  { date: '2026-06-02', value: 3 },\n  { date: '2026-06-03', value: 27 },\n];\n// <ok-heatmap layout=\"weeks\" cell-size=\"13\" legend></ok-heatmap>\n// <ok-heatmap layout=\"year\" scale=\"#2dd36f\"></ok-heatmap>",
    api: [{"kind": "prop", "name": ".data", "type": "OkHeatmapCell[]", "detail": "Celdas {date,value} (nivel por cuantiles) o {key,level} explícito"}, {"kind": "prop", "name": "layout", "type": "'weeks'|'year'", "detail": "weeks = flujo por columnas (def); year = 12 meses"}, {"kind": "prop", "name": "levels", "type": "number", "detail": "Niveles de intensidad incl. el 0=vacío (def 5)"}, {"kind": "prop", "name": "scale", "type": "string", "detail": "Color base de la escala (sobrescribe el token --brand)"}, {"kind": "prop", "name": "cell-size", "type": "number", "detail": "Tamaño de celda en px (solo layout weeks; def 12)"}, {"kind": "prop", "name": "legend", "type": "boolean", "detail": "Muestra la leyenda Menos → Más"}],
  },
  {
    id: "ok-funnel",
    name: "ok-funnel",
    category: "graficos",
    desc: "Embudo de conversión: filas apiladas con barra de ancho % decreciente (gradiente brand) más meta con conteo absoluto y % de conversión por paso (auto, respecto al anterior). Prop `.steps` (label/value/color), `min-width` y `locale`. Sin eventos.",
    importPath: "@outfitkit/core/ok-funnel",
    example: "<div style=\"max-width:520px\">\n  <ok-funnel id=\"fn\" locale=\"es-ES\"></ok-funnel>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#fn').steps = [
  { label: 'Visitas a la tienda', value: 12480 },
  { label: 'Añadido al carrito', value: 4310, color: 'brand' },
  { label: 'Checkout iniciado', value: 1890, color: 'warn' },
  { label: 'Compra completada', value: 1140, color: 'leaf' },
];
    },
    code: "const funnel = document.createElement('ok-funnel');\nfunnel.locale = 'es-ES';\nfunnel.steps = [\n  { label: 'Visitas', value: 12480 },\n  { label: 'Carrito', value: 4310 },\n  { label: 'Checkout', value: 1890, color: 'warn' },\n  { label: 'Compra', value: 1140, color: 'leaf' },\n];\n// <ok-funnel .steps=${steps} locale=\"es-ES\"></ok-funnel>",
    api: [{"kind": "prop", "name": ".steps", "type": "OkFunnelStep[]", "detail": "Pasos { label, value, color? } de mayor a menor; el primero define el 100% de ancho"}, {"kind": "prop", "name": "color (por paso)", "type": "brand|leaf|warn|mute", "detail": "Variante de color de la barra (en cada step); brand por defecto"}, {"kind": "prop", "name": "min-width", "type": "number", "detail": "Ancho mínimo de barra en % para que la etiqueta siga legible (def. 12)"}, {"kind": "prop", "name": "locale", "type": "string", "detail": "Locale para formatear conteos y % (def. del navegador)"}],
  },
  {
    id: "ok-bar-list",
    name: "ok-bar-list",
    category: "graficos",
    desc: "Lista ranking de barras horizontales (top-N): cada fila = etiqueta + track con relleno proporcional al valor frente a `max` (auto-calculado) + valor en negrita. Props: `.items`, `max`, `value-format` (number/compact/currency/percent), `locale`, `currency`. Presentacional, sin eventos.",
    importPath: "@outfitkit/core/ok-bar-list",
    example: "<div style=\"max-width:380px\">\n  <ok-bar-list id=\"bl\" value-format=\"currency\" currency=\"EUR\"></ok-bar-list>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#bl').items = [
  { label: 'Madrid Centro', value: 18420, color: 'brand' },
  { label: 'Barcelona Diagonal', value: 15230, color: 'leaf' },
  { label: 'Valencia Colón', value: 9870, color: 'info' },
  { label: 'Sevilla Nervión', value: 6540, color: 'warn' },
  { label: 'Bilbao Gran Vía', value: 3120, color: 'danger' },
];
    },
    code: "bars.items = [\n  { label: 'Madrid Centro', value: 18420, color: 'brand' },\n  { label: 'Barcelona Diagonal', value: 15230, color: 'leaf' },\n  { label: 'Valencia Colón', value: 9870 },\n];\n<ok-bar-list value-format=\"currency\" currency=\"EUR\"></ok-bar-list>",
    api: [{"kind": "prop", "name": ".items", "type": "BarListItem[]", "detail": "Filas { label, value, color? } a representar"}, {"kind": "prop", "name": "max", "type": "number", "detail": "Tope de la escala (def: máximo del dataset)"}, {"kind": "prop", "name": "value-format", "type": "number|compact|currency|percent", "detail": "Formato del valor vía Intl (def 'number')"}, {"kind": "prop", "name": "locale · currency", "type": "string · string", "detail": "Locale Intl · divisa ISO si value-format='currency' (def 'EUR')"}, {"kind": "prop", "name": "item.color", "type": "brand|leaf|warn|info|danger | string", "detail": "Variante semántica o color CSS literal del relleno (def 'brand')"}],
  },
  {
    id: "ok-detail-list",
    name: "ok-detail-list",
    category: "datos",
    desc: "Lista de detalle (description list, <dl>) para pantallas de ficha: pares etiqueta/valor alineados por baseline con la etiqueta muted. Props .items (label/value/html/full), columns (1|2), dense y placeholder. Sin eventos.",
    importPath: "@outfitkit/core/ok-detail-list",
    example: "<div style=\"max-width:560px;display:flex;flex-direction:column;gap:1.5rem;width:100%\">\n  <div>\n    <p style=\"margin:0 0 .5rem;font-size:.75rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ion-color-medium,#92949c)\">Datos del cliente</p>\n    <ok-detail-list id=\"dl1\" columns=\"2\"></ok-detail-list>\n  </div>\n  <div>\n    <p style=\"margin:0 0 .5rem;font-size:.75rem;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--ion-color-medium,#92949c)\">Resumen del pedido (denso)</p>\n    <ok-detail-list id=\"dl2\" dense></ok-detail-list>\n  </div>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#dl1').items = [
  { label: 'Razón social', value: 'Pastelería La Espiga S.L.' },
  { label: 'NIF', value: 'B-12345678' },
  { label: 'Email', value: '<a href="mailto:hola@laespiga.es">hola@laespiga.es</a>', html: true },
  { label: 'Teléfono', value: '+34 912 345 678' },
  { label: 'Estado', value: '<ok-status-pill tone="success" dot>Activo</ok-status-pill>', html: true },
  { label: 'Forma de pago', value: 'Domiciliación SEPA' },
  { label: 'Dirección', value: 'C/ Mayor 24, 3ºB · 28013 Madrid', full: true },
  { label: 'Notas', full: true },
];
root.querySelector('#dl2').items = [
  { label: 'Nº pedido', value: 'PED-2026-0481' },
  { label: 'Fecha', value: '14 jun 2026' },
  { label: 'Artículos', value: '7 líneas' },
  { label: 'Base imponible', value: '€124,30' },
  { label: 'IVA (21%)', value: '€26,10' },
  { label: 'Total', value: '<strong>€150,40</strong>', html: true },
];
    },
    code: "const dl = document.querySelector('ok-detail-list');\ndl.columns = 2;\ndl.items = [\n  { label: 'Razón social', value: 'Pastelería La Espiga S.L.' },\n  { label: 'NIF', value: 'B-12345678' },\n  { label: 'Estado', value: '<ok-status-pill tone=\"success\" dot>Activo</ok-status-pill>', html: true },\n  { label: 'Dirección', value: 'C/ Mayor 24 · 28013 Madrid', full: true },\n  { label: 'Notas' }, // vacío → muestra placeholder\n];\n\n<ok-detail-list columns=\"2\" placeholder=\"—\"></ok-detail-list>",
    api: [{"kind": "prop", "name": ".items", "type": "OkDetailItem[]", "detail": "Pares { label, value?, html?, full? } a renderizar"}, {"kind": "prop", "name": "columns", "type": "1|2", "detail": "Columnas en desktop (reflejado a atributo; se apila a 1 bajo 600px)"}, {"kind": "prop", "name": "dense", "type": "boolean", "detail": "Modo compacto: menos separación vertical y fuente menor"}, {"kind": "prop", "name": "placeholder", "type": "string", "detail": "Texto para valores vacíos (por defecto «—»)"}, {"kind": "prop", "name": "item.html", "type": "boolean", "detail": "Interpreta value como HTML enriquecido (sanitiza tú la fuente)"}, {"kind": "prop", "name": "item.full", "type": "boolean", "detail": "El par ocupa el ancho completo aunque haya 2 columnas"}],
  },
  {
    id: "ok-icon-tile",
    name: "ok-icon-tile",
    category: "datos",
    desc: "Pastilla cuadrada coloreada con un icono dentro (leading icon de filas/cards/KPI). Puramente presentacional: props icon (Iconify/Ionicons), color (brand|leaf|warn|danger|info|neutral), size (md|lg), shape (rounded|circle) y label accesible. Sin eventos.",
    importPath: "@outfitkit/core/ok-icon-tile",
    example: "<div style=\"display:flex;gap:1rem;align-items:center;flex-wrap:wrap\">\n  <ok-icon-tile color=\"brand\" size=\"lg\" icon=\"cube-outline\" label=\"Inventario\"></ok-icon-tile>\n  <ok-icon-tile color=\"leaf\" size=\"lg\" icon=\"trending-up-outline\" label=\"Ingresos\"></ok-icon-tile>\n  <ok-icon-tile color=\"warn\" size=\"lg\" icon=\"alert-outline\" label=\"Avisos\"></ok-icon-tile>\n  <ok-icon-tile color=\"danger\" size=\"lg\" icon=\"trash-outline\" label=\"Eliminar\"></ok-icon-tile>\n  <ok-icon-tile color=\"info\" shape=\"circle\" size=\"lg\" icon=\"information-circle-outline\" label=\"Info\"></ok-icon-tile>\n  <ok-icon-tile color=\"neutral\" icon=\"ellipsis-horizontal\" label=\"Más\"></ok-icon-tile>\n</div>",
    code: "<ok-icon-tile color=\"leaf\" size=\"lg\" icon=\"trending-up-outline\" label=\"Ingresos\"></ok-icon-tile>\n<!-- Iconify con prefijo de set: usa iconify-icon en vez de ion-icon -->\n<ok-icon-tile color=\"brand\" shape=\"circle\" icon=\"mdi:home-outline\"></ok-icon-tile>",
    api: [{"kind": "prop", "name": "icon", "type": "string", "detail": "Nombre del icono; con prefijo de set (\"mdi:home\") usa iconify-icon, si no ion-icon"}, {"kind": "prop", "name": "color", "type": "brand|leaf|warn|danger|info|neutral", "detail": "Par de color: fondo soft + color del icono (reflect)"}, {"kind": "prop", "name": "size", "type": "md|lg", "detail": "Tamaño del tile: 32px (md) o 40px (lg) (reflect)"}, {"kind": "prop", "name": "shape", "type": "rounded|circle", "detail": "Forma del recorte: radio 8px o circular (reflect)"}, {"kind": "prop", "name": "label", "type": "string", "detail": "Etiqueta accesible; si falta, el tile es decorativo (aria-hidden)"}, {"kind": "slot", "name": "(default)", "type": "—", "detail": "Sin icon: compón un SVG/imagen propio dentro de la pastilla"}],
  },
  {
    id: "ok-status-dot",
    name: "ok-status-dot",
    category: "feedback",
    desc: "Punto de presencia/estado coloreado y compacto (forma reducida de ok-status-pill): solo el dot con tono semántico, tamaño, label opcional (inline o sr-only) y pulso \"en vivo\". Sin eventos.",
    importPath: "@outfitkit/core/ok-status-dot",
    example: "<div style=\"display:flex;flex-direction:column;gap:1rem;font-family:system-ui\">\n  <div style=\"display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap\">\n    <ok-status-dot tone=\"ok\" pulse label=\"En línea\" show-label></ok-status-dot>\n    <ok-status-dot tone=\"warn\" label=\"Inactivo\" show-label></ok-status-dot>\n    <ok-status-dot tone=\"danger\" pulse label=\"Sin conexión\" show-label></ok-status-dot>\n    <ok-status-dot tone=\"off\" label=\"Apagado\" show-label></ok-status-dot>\n  </div>\n  <div style=\"display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap\">\n    <span style=\"display:inline-flex;gap:.4rem;align-items:center;font-size:.875rem\"><ok-status-dot tone=\"brand\" size=\"lg\" pulse label=\"TPV abierto\"></ok-status-dot>TPV Caja 1 abierto</span>\n    <span style=\"display:inline-flex;gap:.4rem;align-items:center;font-size:.875rem\"><ok-status-dot tone=\"info\" size=\"sm\" label=\"Sincronizando\"></ok-status-dot>Sincronizando</span>\n  </div>\n</div>",
    code: "<ok-status-dot tone=\"ok\" pulse label=\"En línea\" show-label></ok-status-dot>\n<!-- solo dot + label accesible (sr-only) en una celda: -->\n<ok-status-dot tone=\"danger\" label=\"Sin conexión\"></ok-status-dot>",
    api: [{"kind": "prop", "name": "tone", "type": "ok|warn|danger|info|off|brand", "detail": "Tono semántico → --ion-color-* (por defecto off)"}, {"kind": "prop", "name": "size", "type": "sm|md|lg", "detail": "Tamaño del dot (por defecto md)"}, {"kind": "prop", "name": "pulse", "type": "boolean", "detail": "Aro de pulso animado \"en vivo\" (respeta prefers-reduced-motion)"}, {"kind": "prop", "name": "label", "type": "string", "detail": "Texto del estado (accesible vía aria-label)"}, {"kind": "prop", "name": "show-label", "type": "boolean", "detail": "Muestra el label inline junto al dot; si no, queda solo sr-only"}],
  },
  {
    id: "ok-kbd",
    name: "ok-kbd",
    category: "inputs",
    desc: "Chips de keycap (teclas de teclado) presentacionales: keys=\"cmd k\" renderiza ⌘ + K con relieve 3D, modificadores en negrita/mayúsculas y glifos bonitos. Props: keys, size (sm|md), combo. Sin eventos.",
    importPath: "@outfitkit/core/ok-kbd",
    example: "<div style=\"display:flex;flex-direction:column;gap:1rem;font-family:system-ui\">\n  <div style=\"display:flex;align-items:center;gap:.6rem;flex-wrap:wrap\">\n    <span style=\"color:#808289;font-size:13px\">Buscar</span>\n    <ok-kbd keys=\"cmd k\"></ok-kbd>\n  </div>\n  <div style=\"display:flex;align-items:center;gap:.6rem;flex-wrap:wrap\">\n    <span style=\"color:#808289;font-size:13px\">Nueva venta</span>\n    <ok-kbd keys=\"ctrl shift n\"></ok-kbd>\n  </div>\n  <div style=\"display:flex;align-items:center;gap:.6rem;flex-wrap:wrap\">\n    <span style=\"color:#808289;font-size:13px\">Guardar</span>\n    <ok-kbd keys=\"cmd s\" size=\"sm\"></ok-kbd>\n  </div>\n  <div style=\"display:flex;align-items:center;gap:.6rem;flex-wrap:wrap\">\n    <span style=\"color:#808289;font-size:13px\">Navegar</span>\n    <ok-kbd keys=\"up\"></ok-kbd>\n    <ok-kbd keys=\"down\"></ok-kbd>\n    <ok-kbd keys=\"enter\"></ok-kbd>\n    <ok-kbd keys=\"esc\"></ok-kbd>\n  </div>\n</div>",
    code: "<ok-kbd keys=\"cmd k\"></ok-kbd>\n<ok-kbd keys=\"ctrl shift n\"></ok-kbd>\n<ok-kbd keys=\"cmd s\" size=\"sm\"></ok-kbd>",
    api: [{"kind": "prop", "name": "keys", "type": "string", "detail": "Teclas separadas por espacio (p.ej. \"cmd k\" o \"ctrl shift n\")"}, {"kind": "prop", "name": "size", "type": "sm|md", "detail": "Tamaño del keycap (reflejado como atributo). Por defecto md"}, {"kind": "prop", "name": "combo", "type": "boolean", "detail": "Inserta separadores \"+\" entre teclas. Por defecto true"}],
  },
  {
    id: "ok-menu",
    name: "ok-menu",
    category: "overlays",
    desc: "Menú desplegable / contextual sobre primitivos propios: items declarativos (.items) con icono, atajo, divisor, sección, checkbox/radio y submenús en cascada; modo click o contextual (clic derecho), anclaje volteable y slot header. Emite ok-select {id} y ok-open {open}.",
    importPath: "@outfitkit/core/ok-menu",
    example: "<div style=\"display:flex;justify-content:center;padding:1rem 1rem 9rem\">\n  <ok-menu id=\"m\" anchor=\"bl\" width=\"md\" open>\n    <ion-button id=\"trg\" fill=\"outline\">\n      <ion-icon slot=\"start\" name=\"ellipsis-horizontal\"></ion-icon>\n      Acciones\n    </ion-button>\n    <div slot=\"header\">\n      <strong>María López</strong><br>\n      <span style=\"color:var(--ion-color-medium)\">maria@erplora.com</span>\n    </div>\n  </ok-menu>\n</div>",
    setup: (root, ctx) => {
const m = root.querySelector('#m');
m.items = [
  { section: 'Documento' },
  { id: 'edit', label: 'Editar', icon: 'create-outline', shortcut: '⌘E' },
  { id: 'dup', label: 'Duplicar', icon: 'copy-outline', shortcut: '⌘D' },
  {
    label: 'Exportar', icon: 'download-outline', children: [
      { id: 'pdf', label: 'PDF', icon: 'document-text-outline' },
      { id: 'csv', label: 'CSV', icon: 'grid-outline' },
      { id: 'xlsx', label: 'Excel', icon: 'grid-outline', disabled: true },
    ],
  },
  { divider: true },
  { id: 'fav', label: 'Marcar como favorito', role: 'checkbox', checked: true },
  { id: 'archive', label: 'Archivar', icon: 'archive-outline' },
  { divider: true },
  { id: 'delete', label: 'Eliminar', icon: 'trash-outline', shortcut: '⌫', danger: true },
];
// Re-abrir si el usuario lo cierra, para que el demo siga visible
m.addEventListener('ok-open', (e) => {
  if (!e.detail.open) setTimeout(() => { m.open = true; }, 150);
});
    },
    code: "const menu = document.querySelector('ok-menu');\nmenu.items = [\n  { id: 'edit', label: 'Editar', icon: 'create-outline', shortcut: '⌘E' },\n  { label: 'Exportar', children: [{ id: 'pdf', label: 'PDF' }] },\n  { divider: true },\n  { id: 'delete', label: 'Eliminar', icon: 'trash-outline', danger: true },\n];\nmenu.addEventListener('ok-select', (e) => console.log(e.detail.id));\n// <ok-menu anchor=\"bl\" width=\"md\"><ion-button>Acciones</ion-button></ok-menu>",
    api: [{"kind": "prop", "name": ".items", "type": "OkMenuEntry[]", "detail": "Entradas: {id,label,icon,shortcut,danger,disabled,checked,role,divider,section,children}"}, {"kind": "prop", "name": "trigger", "type": "click|context", "detail": "Apertura por clic en el slot o por clic derecho (menú contextual en el cursor)"}, {"kind": "prop", "name": "anchor", "type": "br|bl|tr|tl", "detail": "Lado de anclaje del panel (se voltea solo si no cabe en el viewport)"}, {"kind": "prop", "name": "width", "type": "sm|md|lg", "detail": "Ancho mínimo del panel (160/200/240px)"}, {"kind": "prop", "name": "open", "type": "boolean", "detail": "Estado abierto/cerrado (reflejado al atributo)"}, {"kind": "event", "name": "ok-select", "type": "{id}", "detail": "Se activa una entrada hoja (no divisor/sección/submenú)"}, {"kind": "event", "name": "ok-open", "type": "{open}", "detail": "Al abrir o cerrar el panel"}, {"kind": "slot", "name": "header", "type": "—", "detail": "Cabecera opcional del panel (p.ej. ficha de usuario)"}],
  },
  {
    id: "ok-hover-card",
    name: "ok-hover-card",
    category: "overlays",
    desc: "Popover rica de previsualización anclada al hover/focus de un disparador inline (@menciones / referencias cruzadas): avatar + título con badge, @handle, cuerpo, fila de 3 cifras tabulares y pie de hasta 2 botones. Props name/badge/handle/avatar(-src)/body/.stats/.actions/placement/open-delay/close-delay; emite ok-action y ok-open.",
    importPath: "@outfitkit/core/ok-hover-card",
    example: "<div style=\"font:0.95rem system-ui,sans-serif;color:#3a3a42;max-width:480px;line-height:1.7\">\n  <p style=\"margin:0 0 .5rem\">Asignado a\n    <ok-hover-card id=\"hc\" name=\"María López\" badge=\"Encargada\" handle=\"@maria.lopez\" avatar=\"ML\" body=\"Encargada de turno en la tienda Centro. Gestiona caja, devoluciones y el cuadre diario.\" open-delay=\"0\" placement=\"bottom\" style=\"font-weight:600;color:var(--ion-color-primary,#3880ff);border-bottom:1px dashed currentColor;cursor:default\">\n      <span>@maria.lopez</span>\n    </ok-hover-card>\n    para la apertura de hoy.</p>\n  <p style=\"margin:1.6rem 0 0;color:#8a8a93;font-size:.8rem\">Pasa el ratón sobre la mención para ver la tarjeta.</p>\n</div>",
    setup: (root, ctx) => {
const hc = root.querySelector('#hc');
hc.stats = [
  { value: '128', label: 'Ventas' },
  { value: '4.9', label: 'Valoración' },
  { value: '2 a', label: 'Antigüedad' },
];
hc.actions = [
  { id: 'msg', label: 'Mensaje' },
  { id: 'profile', label: 'Ver perfil', brand: true },
];
    },
    code: "<ok-hover-card name=\"María López\" badge=\"Encargada\"\n  handle=\"@maria.lopez\" avatar=\"ML\"\n  body=\"Encargada de turno en la tienda Centro.\"\n  placement=\"bottom\">\n  <a href=\"/u/maria\">@maria.lopez</a>\n</ok-hover-card>\nconst card = document.querySelector('ok-hover-card');\ncard.stats = [{ value: '128', label: 'Ventas' }, { value: '4.9', label: 'Valoración' }];\ncard.actions = [{ id: 'profile', label: 'Ver perfil', brand: true }];\ncard.addEventListener('ok-action', (e) => console.log(e.detail.id));",
    api: [{"kind": "slot", "name": "(default)", "type": "—", "detail": "El disparador inline (texto-ancla) que revela la tarjeta al hover/focus"}, {"kind": "prop", "name": "name · badge · handle", "type": "string", "detail": "Título · badge junto al título · @handle mono muted"}, {"kind": "prop", "name": "avatar · avatar-src", "type": "string", "detail": "Iniciales del avatar · URL de imagen (sobrescribe avatar)"}, {"kind": "prop", "name": "body", "type": "string", "detail": "Texto del cuerpo (o usa slot=\"content\" para override)"}, {"kind": "prop", "name": ".stats", "type": "OkHoverCardStat[]", "detail": "Fila de hasta 3 cifras tabulares { value, label }"}, {"kind": "prop", "name": ".actions", "type": "OkHoverCardAction[]", "detail": "Hasta 2 botones del pie { id, label, href?, brand? }"}, {"kind": "prop", "name": "placement · open-delay · close-delay", "type": "bottom|top · number · number", "detail": "Colocación (se voltea si no cabe) · retardos ms de apertura/cierre"}, {"kind": "event", "name": "ok-action", "type": "{ id, action }", "detail": "Click en un botón del pie sin href"}, {"kind": "event", "name": "ok-open", "type": "{ open }", "detail": "La tarjeta se mostró u ocultó"}],
  },
  {
    id: "ok-notification-center",
    name: "ok-notification-center",
    category: "overlays",
    desc: "Bandeja de notificaciones tipo drawer lateral derecho (inbox de ERP): lista de avisos status-tintados, chips de filtro, contador de no-leídas y pie \"marcar todas leídas\". Props .items/.filters/active/open/title/.labels; eventos ok-read, ok-read-all, ok-filter, ok-close, ok-open.",
    importPath: "@outfitkit/core/ok-notification-center",
    example: "<div style=\"position:relative;height:480px;overflow:hidden;border-radius:12px;background:repeating-linear-gradient(45deg,rgba(0,0,0,.02),rgba(0,0,0,.02) 12px,transparent 12px,transparent 24px)\">\n  <ok-notification-center id=\"nc\" open title=\"Notificaciones\" active=\"all\" style=\"--ok-notif-width:340px\"></ok-notification-center>\n</div>",
    setup: (root, ctx) => {
const nc = root.querySelector('#nc');
nc.filters = [
  { id: 'all', label: 'Todas' },
  { id: 'sales', label: 'Ventas' },
  { id: 'stock', label: 'Stock' },
  { id: 'system', label: 'Sistema' },
];
nc.items = [
  { id: 'n1', icon: 'cart-outline', variant: 'leaf', text: 'Nueva venta <b>#1042</b> cobrada en caja 1', meta: '142,50 € · TPV Principal', time: '12:42', unread: true },
  { id: 'n2', icon: 'alert-circle-outline', variant: 'warn', text: 'Stock bajo: <b>Café molido 1kg</b> (3 uds.)', meta: 'Almacén Central', time: '11:58', unread: true },
  { id: 'n3', icon: 'cube-outline', variant: 'info', text: 'Pedido a proveedor <b>PV-0087</b> recibido', meta: 'Distribuciones López', time: '10:15', unread: true },
  { id: 'n4', icon: 'person-add-outline', variant: 'brand', text: 'Nuevo empleado dado de alta: <b>María López</b>', meta: 'Recursos Humanos', time: 'ayer', unread: false },
  { id: 'n5', icon: 'cloud-done-outline', text: 'Copia de seguridad completada', meta: 'backup-2026-06-14.enc', time: 'ayer', unread: false },
];
nc.labels = {
  markAllRead: 'Marcar todas como leídas',
  close: 'Cerrar',
  emptyTitle: 'Todo al día',
  emptyText: 'No hay notificaciones que mostrar.',
};
nc.addEventListener('ok-read', (e) => {
  nc.items = nc.items.map((it) => it.id === e.detail.id ? { ...it, unread: false } : it);
});
nc.addEventListener('ok-read-all', () => {
  nc.items = nc.items.map((it) => ({ ...it, unread: false }));
});
nc.addEventListener('ok-filter', (e) => { nc.active = e.detail.id; });
// Modo demo: no permitir que se cierre dentro del preview.
nc.addEventListener('ok-close', (e) => { e.preventDefault(); });
    },
    code: "const nc = document.querySelector('ok-notification-center');\nnc.filters = [{ id: 'all', label: 'Todas' }, { id: 'sales', label: 'Ventas' }];\nnc.items = [\n  { id: 'n1', icon: 'cart-outline', variant: 'leaf', text: 'Venta <b>#1042</b> cobrada', meta: 'TPV Principal', time: '12:42', unread: true },\n];\nnc.title = 'Notificaciones';\nnc.open = true;\nnc.addEventListener('ok-read', (e) => markRead(e.detail.id));\nnc.addEventListener('ok-read-all', () => markAllRead());\nnc.addEventListener('ok-filter', (e) => reloadFiltered(e.detail.id));",
    api: [{"kind": "prop", "name": ".items", "type": "OkNotification[]", "detail": "Avisos (id, text con <b>, meta, time, icon, variant, unread)"}, {"kind": "prop", "name": ".filters", "type": "OkNotifFilter[]", "detail": "Chips de cabecera {id, label}; el filtrado lo aplica el consumidor"}, {"kind": "prop", "name": "active · open · title", "type": "string · bool · string", "detail": "Id del chip activo · abierto/cerrado (reflejado) · título"}, {"kind": "prop", "name": ".labels", "type": "Partial<OkNotifLabels>", "detail": "Textos i18n (markAllRead, close, emptyTitle, emptyText)"}, {"kind": "event", "name": "ok-read · ok-read-all", "type": "{id} · {}", "detail": "Click en aviso no leído · pie marcar todas"}, {"kind": "event", "name": "ok-filter · ok-open", "type": "{id} · {open}", "detail": "Cambio de chip · panel abierto"}, {"kind": "event", "name": "ok-close", "type": "{reason}", "detail": "Gesto de cierre (scrim/esc/button); cancelable"}],
  },
  {
    id: "ok-coachmark",
    name: "ok-coachmark",
    category: "overlays",
    desc: "Tour guiado (onboarding) con spotlight: recorta el scrim alrededor de un target, ancla un bubble edge-aware (top/bottom/left/right con volteo) y navega por pasos. Props .steps, current, open, labels; emite ok-step/ok-next/ok-prev/ok-finish/ok-skip.",
    importPath: "@outfitkit/core/ok-coachmark",
    example: "<div style=\"position:relative;padding:1rem;min-height:240px\">\n  <div style=\"display:flex;gap:.6rem;align-items:center;margin-bottom:1rem\">\n    <button id=\"cm-new\" style=\"background:var(--ion-color-primary,#3880ff);color:#fff;border:0;border-radius:8px;padding:.55rem .9rem;font:600 13px system-ui;cursor:pointer\">+ Nueva venta</button>\n    <button id=\"cm-search\" style=\"background:#eef1f6;border:0;border-radius:8px;padding:.55rem .9rem;font:600 13px system-ui;cursor:pointer\">Buscar producto</button>\n    <div style=\"margin-left:auto;display:flex;gap:.4rem\">\n      <button id=\"cm-cart\" style=\"background:#eef1f6;border:0;border-radius:8px;padding:.55rem .9rem;font:600 13px system-ui;cursor:pointer\">Carrito · 3</button>\n    </div>\n  </div>\n  <div style=\"display:grid;grid-template-columns:repeat(3,1fr);gap:.6rem\">\n    <div id=\"cm-prod\" style=\"border:1px solid #e3e6ee;border-radius:10px;padding:.8rem;font:13px system-ui\">Café con leche<br><b>1,40 €</b></div>\n    <div style=\"border:1px solid #e3e6ee;border-radius:10px;padding:.8rem;font:13px system-ui\">Croissant<br><b>1,80 €</b></div>\n    <div style=\"border:1px solid #e3e6ee;border-radius:10px;padding:.8rem;font:13px system-ui\">Zumo natural<br><b>2,50 €</b></div>\n  </div>\n  <div style=\"margin-top:1rem\"><button id=\"cm-start\" style=\"background:#fff;border:1px solid var(--ion-color-primary,#3880ff);color:var(--ion-color-primary,#3880ff);border-radius:8px;padding:.5rem .9rem;font:600 13px system-ui;cursor:pointer\">▶ Reiniciar tour</button></div>\n  <ok-coachmark id=\"cm\"></ok-coachmark>\n</div>",
    setup: (root, ctx) => {
const cm = root.querySelector('#cm');
cm.steps = [
  { target: '#cm-new', title: 'Abre una venta', text: 'Pulsa aquí para empezar un ticket nuevo en el TPV.', placement: 'bottom' },
  { target: '#cm-prod', title: 'Añade productos', text: 'Toca una tarjeta para sumar el artículo al carrito.', placement: 'bottom' },
  { target: '#cm-cart', title: 'Revisa el carrito', text: 'Aquí ves el total y pasas al cobro.', placement: 'bottom' },
];
cm.labels = { prev: 'Atrás', next: 'Siguiente', finish: 'Hecho', skip: 'Saltar', step: 'Paso {n} de {total}' };
cm.open = true;
const restart = root.querySelector('#cm-start');
if (restart) restart.addEventListener('click', () => { cm.current = 0; cm.open = true; });
    },
    code: "const tour = document.querySelector('ok-coachmark');\ntour.steps = [\n  { target: '#btn-nueva-venta', title: 'Abre una venta', text: 'Empieza un ticket.', placement: 'bottom' },\n  { target: '#carrito', title: 'Revisa el carrito', text: 'Total y cobro.', placement: 'left' },\n];\ntour.labels = { prev: 'Atrás', next: 'Siguiente', finish: 'Hecho', skip: 'Saltar', step: 'Paso {n} de {total}' };\ntour.open = true;\ntour.addEventListener('ok-finish', () => localStorage.setItem('onboarded', '1'));\n\n<ok-coachmark></ok-coachmark>",
    api: [{"kind": "prop", "name": ".steps", "type": "OkCoachStep[]", "detail": "Pasos { target (selector CSS), title?, text?, placement? }"}, {"kind": "prop", "name": "current", "type": "number", "detail": "Índice del paso activo (0-based), reflejado"}, {"kind": "prop", "name": "open", "type": "boolean", "detail": "Abre/cierra el tour (overlay portado a document.body)"}, {"kind": "prop", "name": ".labels", "type": "Partial<OkCoachmarkLabels>", "detail": "Textos: prev/next/finish/skip/step (merge sobre defaults EN); step admite {n}/{total}"}, {"kind": "event", "name": "ok-step", "type": "CustomEvent<{index}>", "detail": "Cambio de paso (next/prev/dot)"}, {"kind": "event", "name": "ok-finish", "type": "CustomEvent", "detail": "Último paso completado (cierra el tour)"}, {"kind": "event", "name": "ok-skip", "type": "CustomEvent", "detail": "Saltado/cerrado (Esc, click scrim o botón saltar)"}],
  },
  {
    id: "ok-select-card",
    name: "ok-select-card",
    category: "inputs",
    desc: "Fila/tarjeta seleccionable: toda la fila es zona de click y envuelve un ion-checkbox/ion-radio nativo; al marcar pinta borde y fondo de marca. Props: mode (checkbox|radio), name (grupo radio), value, checked, label, description, icon, disabled. Evento: ok-change { checked, value }.",
    importPath: "@outfitkit/core/ok-select-card",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem;width:100%\">\n  <div style=\"display:flex;flex-direction:column;gap:.6rem\">\n    <p style=\"margin:0 0 .15rem;font-size:.8125rem;font-weight:600;color:var(--ion-color-medium)\">Plan (radio)</p>\n    <ok-select-card id=\"p1\" mode=\"radio\" name=\"plan\" value=\"local\" checked icon=\"hardware-chip-outline\" label=\"Local\" description=\"Gratis · 1 dispositivo · backup en S3\"></ok-select-card>\n    <ok-select-card id=\"p2\" mode=\"radio\" name=\"plan\" value=\"cloud\" icon=\"cloud-outline\" label=\"Cloud\" description=\"Online · multi-dispositivo · sin sincronización\"></ok-select-card>\n  </div>\n  <div style=\"display:flex;flex-direction:column;gap:.6rem\">\n    <p style=\"margin:0 0 .15rem;font-size:.8125rem;font-weight:600;color:var(--ion-color-medium)\">Módulos (checkbox)</p>\n    <ok-select-card mode=\"checkbox\" value=\"inventory\" checked icon=\"cube-outline\" label=\"Inventario\" description=\"Productos y existencias\"></ok-select-card>\n    <ok-select-card mode=\"checkbox\" value=\"pos\" icon=\"card-outline\" label=\"TPV\" description=\"Punto de venta y tickets\"></ok-select-card>\n    <ok-select-card mode=\"checkbox\" value=\"whatsapp\" disabled icon=\"logo-whatsapp\" label=\"WhatsApp\" description=\"Premium · requiere suscripción\"></ok-select-card>\n  </div>\n</div>",
    code: "<ok-select-card mode=\"radio\" name=\"plan\" value=\"cloud\"\n  icon=\"cloud-outline\" label=\"Cloud\"\n  description=\"Online · multi-dispositivo\">\n</ok-select-card>\n\n// JS:\ncard.addEventListener('ok-change', (e) => {\n  console.log(e.detail.checked, e.detail.value);\n});",
    api: [{"kind": "prop", "name": "mode", "type": "'checkbox' | 'radio'", "detail": "Independiente o exclusivo por grupo (default checkbox)"}, {"kind": "prop", "name": "name", "type": "string", "detail": "Grupo de radios para la exclusión mutua (modo radio)"}, {"kind": "prop", "name": "value · checked", "type": "string · boolean", "detail": "Valor emitido · si está marcada (refleja)"}, {"kind": "prop", "name": "label · description · icon", "type": "string", "detail": "Título · texto muted · icono Iconify a la izquierda"}, {"kind": "prop", "name": "disabled", "type": "boolean", "detail": "Deshabilita la interacción (refleja)"}, {"kind": "event", "name": "ok-change", "type": "{ checked: boolean, value: string }", "detail": "Al cambiar la selección (bubbles + composed)"}, {"kind": "slot", "name": "(default)", "type": "—", "detail": "Contenido extra bajo el label"}],
  },
  {
    id: "ok-error-page",
    name: "ok-error-page",
    category: "feedback",
    desc: "Plantilla full-screen para errores HTTP (403/404/500) o pantalla de arranque (bootstrap): código + título + mensaje, ilustración por variant (info/warn/danger), tiles de atajo (.shortcuts), checklist de salud (.checks en mode=bootstrap), traza colapsable (trace), chip de reintento con cuenta atrás (retry-seconds) y slots actions/search. Emite ok-shortcut y ok-retry.",
    importPath: "@outfitkit/core/ok-error-page",
    example: "<div style=\"height:540px;overflow:auto;border:1px solid var(--ion-border-color,#e3e5e8);border-radius:12px\">\n  <ok-error-page\n    id=\"errp\"\n    code=\"404\"\n    title=\"Página no encontrada\"\n    message=\"No encontramos lo que buscabas. Puede que el enlace esté roto o que el módulo se haya desinstalado.\"\n    variant=\"info\"\n    meta=\"trace-id: 8f2a1c · 2026-06-14 10:42\"\n    style=\"--ok-error-min-height:auto\">\n    <ion-button slot=\"actions\" fill=\"solid\">Volver al inicio</ion-button>\n    <ion-button slot=\"actions\" fill=\"outline\">Contactar soporte</ion-button>\n  </ok-error-page>\n</div>",
    setup: (root, ctx) => {
const el = root.querySelector('#errp');
el.shortcuts = [
  { title: 'Panel principal', desc: 'Volver al dashboard', icon: 'home-outline', href: '#' },
  { title: 'Marketplace', desc: 'Explorar módulos', icon: 'cube-outline', href: '#' },
  { title: 'Estado del sistema', desc: 'Ver incidencias', icon: 'pulse-outline', href: '#' },
  { title: 'Soporte', desc: 'Abrir un ticket', icon: 'help-buoy-outline', href: '#' },
];
// La página por defecto ocupa 100vh; la acotamos para el preview.
el.style.setProperty('--ok-error-min-height', 'auto');
el.shadowRoot && el.updateComplete && el.updateComplete.then(() => {
  const page = el.shadowRoot.querySelector('.page');
  if (page) { page.style.minHeight = '0'; page.style.padding = '2rem 1.25rem'; }
});
el.addEventListener('ok-shortcut', (e) => console.log('shortcut', e.detail.shortcut.title));
    },
    code: "// Error HTTP con atajos y acciones\nconst p = document.querySelector('ok-error-page');\np.code = '500';\np.title = 'Algo salió mal';\np.message = 'Estamos trabajando para solucionarlo.';\np.variant = 'danger';\np.trace = 'Traceback (most recent call last)\\n  File \"runtime.rs\", line 142...';\np.shortcuts = [{ title: 'Inicio', icon: 'home-outline', href: '/' }];\np.addEventListener('ok-shortcut', e => navigate(e.detail.shortcut.href));\n\n// Pantalla de arranque (bootstrap) con health-check + reintento\n// <ok-error-page mode=\"bootstrap\" retry-seconds=\"10\" .checks=${checks}>",
    api: [{"kind": "prop", "name": "code · title · message", "type": "string", "detail": "Código HTTP, título destacado y mensaje explicativo"}, {"kind": "prop", "name": "variant · mode", "type": "info|warn|danger · http|bootstrap", "detail": "Acento/ilustración · error HTTP o pantalla de arranque"}, {"kind": "prop", "name": ".shortcuts", "type": "OkErrorShortcut[]", "detail": "Tiles de atajo {title, desc?, href?, icon?}"}, {"kind": "prop", "name": ".checks", "type": "OkErrorCheck[]", "detail": "Checklist de salud (solo mode=bootstrap): {name, message?, status?, time?}"}, {"kind": "prop", "name": "trace · meta", "type": "string", "detail": "Traza en <details> colapsable · línea de meta (trace id·timestamp)"}, {"kind": "prop", "name": "retry-seconds · retry-label", "type": "number · string", "detail": "Cuenta atrás de reintento (chip+barra) y su etiqueta"}, {"kind": "event", "name": "ok-retry · ok-shortcut", "type": "CustomEvent", "detail": "Al acabar la cuenta atrás · al pulsar un atajo (detail.shortcut)"}],
  },
  {
    id: "ok-date-picker",
    name: "ok-date-picker",
    category: "inputs",
    desc: "Campo de fecha con popover de calendario propio (lo que Ionic no trae cómodo): selección single o range con chips de preset (Hoy/7d/Esta semana/Mes/Trimestre/YTD), navegación de mes, min/max y 1-2 paneles. Props .value, mode, min/max, .presets, months; evento ok-change.",
    importPath: "@outfitkit/core/ok-date-picker",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem;max-width:340px\">\n  <label style=\"display:flex;flex-direction:column;gap:.4rem;font:600 .75rem system-ui;color:var(--ion-color-medium)\">FECHA DE FACTURA\n    <ok-date-picker id=\"dpSingle\" mode=\"single\" placeholder=\"Seleccionar fecha\"></ok-date-picker>\n  </label>\n  <label style=\"display:flex;flex-direction:column;gap:.4rem;font:600 .75rem system-ui;color:var(--ion-color-medium)\">PERIODO DEL INFORME\n    <ok-date-picker id=\"dpRange\" mode=\"range\" months=\"1\"></ok-date-picker>\n  </label>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#dpSingle').value = '2026-06-09';
const range = root.querySelector('#dpRange');
range.value = { start: '2026-06-01', end: '2026-06-14' };
range.presets = [
  { id: '7d', label: '7d' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Mes' },
  { id: 'quarter', label: 'Trimestre' },
  { id: 'ytd', label: 'YTD' },
];
    },
    code: "const dp = document.querySelector('ok-date-picker');\ndp.mode = 'range';\ndp.value = { start: '2026-06-01', end: '2026-06-14' };\ndp.addEventListener('ok-change', (e) => console.log(e.detail.value));\n// <ok-date-picker mode=\"range\" min=\"2026-01-01\" max=\"2026-12-31\"></ok-date-picker>",
    api: [{"kind": "prop", "name": "mode", "type": "'single'|'range'", "detail": "Una fecha o un rango {start,end}"}, {"kind": "prop", "name": ".value", "type": "string | {start,end} | null", "detail": "ISO YYYY-MM-DD (single) o rango (range)"}, {"kind": "prop", "name": "min · max", "type": "string", "detail": "Límites ISO; los días fuera quedan deshabilitados"}, {"kind": "prop", "name": ".presets", "type": "OkDatePreset[]", "detail": "Chips de atajo; [] oculta la fila"}, {"kind": "prop", "name": "months", "type": "1|2", "detail": "Paneles de mes lado a lado en pantalla ancha"}, {"kind": "prop", "name": "locale · placeholder", "type": "string", "detail": "Locale del mes (es-ES) · texto sin valor"}, {"kind": "event", "name": "ok-change", "type": "CustomEvent<{value}>", "detail": "Emite ISO (single) o {start,end} (range) al elegir"}],
  },
  {
    id: "ok-time-picker",
    name: "ok-time-picker",
    category: "inputs",
    desc: "Selector compacto de hora del día (pastilla HH:MM mono + popover con listas de horas/minutos): más ligero que ion-datetime. Props value \"HH:MM\" (24h), step, use-ampm, min/max, disabled; emite ok-change { value }.",
    importPath: "@outfitkit/core/ok-time-picker",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem;padding:.5rem 0\">\n  <div style=\"display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap\">\n    <label style=\"display:flex;flex-direction:column;gap:.35rem;font:600 .75rem system-ui;color:#6b7280\">\n      APERTURA\n      <ok-time-picker value=\"09:30\" step=\"15\"></ok-time-picker>\n    </label>\n    <label style=\"display:flex;flex-direction:column;gap:.35rem;font:600 .75rem system-ui;color:#6b7280\">\n      CIERRE (12h)\n      <ok-time-picker value=\"21:00\" step=\"30\" use-ampm></ok-time-picker>\n    </label>\n    <label style=\"display:flex;flex-direction:column;gap:.35rem;font:600 .75rem system-ui;color:#6b7280\">\n      RESERVA\n      <ok-time-picker id=\"tp-resa\" value=\"13:45\" step=\"5\" min=\"12:00\" max=\"16:30\"></ok-time-picker>\n    </label>\n    <label style=\"display:flex;flex-direction:column;gap:.35rem;font:600 .75rem system-ui;color:#6b7280\">\n      BLOQUEADO\n      <ok-time-picker value=\"08:00\" disabled></ok-time-picker>\n    </label>\n  </div>\n  <p style=\"margin:0;font:.85rem system-ui;color:#374151\">\n    Reserva seleccionada: <strong id=\"tp-out\" style=\"font-variant-numeric:tabular-nums\">13:45</strong>\n  </p>\n</div>",
    setup: (root, ctx) => {
const resa = root.querySelector('#tp-resa');
const out = root.querySelector('#tp-out');
resa.addEventListener('ok-change', (e) => { out.textContent = e.detail.value; });
    },
    code: "<ok-time-picker value=\"13:45\" step=\"15\" min=\"12:00\" max=\"16:30\"></ok-time-picker>\n<ok-time-picker value=\"21:00\" use-ampm></ok-time-picker>\n\npicker.addEventListener('ok-change', (e) => console.log(e.detail.value)); // \"HH:MM\" 24h",
    api: [{"kind": "prop", "name": "value", "type": "string", "detail": "Hora canónica \"HH:MM\" en 24h (valor que entra y sale)"}, {"kind": "prop", "name": "step", "type": "number", "detail": "Paso de minutos de la lista (default 5, 1-30)"}, {"kind": "prop", "name": "use-ampm", "type": "boolean", "detail": "Presentación 12h con columna AM/PM (el valor sigue en 24h)"}, {"kind": "prop", "name": "min · max", "type": "string · string", "detail": "\"HH:MM\" que acotan las horas/minutos seleccionables (inclusive)"}, {"kind": "prop", "name": "disabled", "type": "boolean", "detail": "Desactiva la interacción (refleja a atributo)"}, {"kind": "event", "name": "ok-change", "type": "CustomEvent<{ value: string }>", "detail": "Al elegir hora; value canónico \"HH:MM\" 24h (bubbles + composed)"}],
  },
  {
    id: "ok-range-dual",
    name: "ok-range-dual",
    category: "inputs",
    desc: "Slider de rango min–max con doble thumb (el hueco que ion-range no cubre): pista con relleno coloreado entre los dos thumbs y readout «low – high». Props low/high/min/max/step + prefix/suffix; emite ok-change con {low, high}.",
    importPath: "@outfitkit/core/ok-range-dual",
    example: "<div style=\"display:grid;gap:2rem;max-width:420px;padding:0.5rem\">\n  <ok-range-dual id=\"precio\" label=\"Precio\" min=\"0\" max=\"500\" step=\"5\" low=\"60\" high=\"320\" prefix=\"€\"></ok-range-dual>\n  <ok-range-dual id=\"desc\" label=\"Descuento\" min=\"0\" max=\"100\" step=\"5\" low=\"10\" high=\"40\" suffix=\"%\"></ok-range-dual>\n  <ok-range-dual id=\"peso\" label=\"Peso (kg)\" min=\"0\" max=\"50\" step=\"0.5\" low=\"5\" high=\"22.5\" suffix=\" kg\"></ok-range-dual>\n  <ok-range-dual id=\"off\" label=\"Deshabilitado\" min=\"0\" max=\"100\" low=\"20\" high=\"80\" suffix=\"%\" disabled></ok-range-dual>\n</div>",
    code: "&lt;ok-range-dual label=\"Precio\" min=\"0\" max=\"500\" step=\"5\" low=\"60\" high=\"320\" prefix=\"€\"&gt;&lt;/ok-range-dual&gt;\n\nrange.addEventListener('ok-change', (e) =&gt; {\n  console.log(e.detail.low, e.detail.high); // { low, high }\n});",
    api: [{"kind": "prop", "name": "low", "type": "number", "detail": "Valor inferior actual del rango"}, {"kind": "prop", "name": "high", "type": "number", "detail": "Valor superior actual del rango"}, {"kind": "prop", "name": "min · max · step", "type": "number", "detail": "Límites del rango y paso de incremento"}, {"kind": "prop", "name": "label", "type": "string", "detail": "Etiqueta opcional a la izquierda del readout"}, {"kind": "prop", "name": "prefix · suffix", "type": "string", "detail": "Prefijo/sufijo en el readout (ej. '€', '%', ' kg')"}, {"kind": "prop", "name": "disabled", "type": "boolean", "detail": "Deshabilita la interacción (atenúa el control)"}, {"kind": "event", "name": "ok-change", "type": "CustomEvent<{low,high}>", "detail": "Emitido al mover cualquiera de los dos thumbs"}],
  },
  {
    id: "ok-file-item",
    name: "ok-file-item",
    category: "inputs",
    desc: "Fila de archivo adjunto/subida (compañero de ok-dropzone): badge cuadrado tintado por extensión, nombre elipsado, meta de tamaño, barra de progreso al subir y estado error. Botón de quitar/cancelar opcional que emite ok-remove.",
    importPath: "@outfitkit/core/ok-file-item",
    example: "<div style=\"display:flex;flex-direction:column;gap:10px;max-width:420px\">\n  <ok-file-item name=\"Factura-2026-0148.pdf\" ext=\"pdf\" size=\"2,4 MB · 14 jun 2026\" state=\"done\" removable></ok-file-item>\n  <ok-file-item name=\"Inventario-almacen-central.xlsx\" ext=\"xlsx\" size=\"845 KB\" state=\"done\" removable></ok-file-item>\n  <ok-file-item name=\"logo-tienda-cabecera.png\" ext=\"png\" size=\"1,2 MB · subiendo… 64%\" state=\"uploading\" progress=\"64\" removable></ok-file-item>\n  <ok-file-item name=\"catalogo-temporada.zip\" ext=\"zip\" size=\"18,9 MB\" error=\"Supera el límite de 10 MB\" state=\"error\" removable></ok-file-item>\n</div>",
    code: "<ok-file-item\n  name=\"Factura-2026-0148.pdf\"\n  ext=\"pdf\"\n  size=\"2,4 MB\"\n  state=\"done\"\n  removable></ok-file-item>\n\n<!-- subiendo -->\n<ok-file-item name=\"logo.png\" ext=\"png\" state=\"uploading\" progress=\"64\" removable></ok-file-item>\n<!-- error -->\n<ok-file-item name=\"big.zip\" ext=\"zip\" state=\"error\" error=\"Supera el límite\" removable></ok-file-item>\n\n// item.addEventListener('ok-remove', e => console.log(e.detail.name));",
    api: [{"kind": "prop", "name": "name", "type": "string", "detail": "Nombre del archivo (se elipsa si no cabe)"}, {"kind": "prop", "name": "ext", "type": "string", "detail": "Extensión/tipo (pdf, xlsx, png, zip…) → badge tintado"}, {"kind": "prop", "name": "size", "type": "string", "detail": "Tamaño/meta ya formateado (p.ej. \"2,4 MB\")"}, {"kind": "prop", "name": "state", "type": "'done'|'uploading'|'error'", "detail": "Estado: muestra progreso al subir, borde rojo en error"}, {"kind": "prop", "name": "progress", "type": "number", "detail": "Progreso 0–100, visible mientras state=\"uploading\""}, {"kind": "prop", "name": "error · removable", "type": "string · boolean", "detail": "Mensaje de error (sustituye a meta) · muestra botón quitar/cancelar"}, {"kind": "event", "name": "ok-remove", "type": "CustomEvent<{name,ext,state}>", "detail": "Al pulsar quitar/cancelar"}],
  },
  {
    id: "ok-rich-text",
    name: "ok-rich-text",
    category: "inputs",
    desc: "Editor WYSIWYG (rich text) que Ionic no trae: área contenteditable con prosa completa (títulos, listas, enlaces, código, cita), toolbar de formato y footer con contador de palabras. Props: value (HTML), placeholder, size (sm·md·lg·minimal), toolbar, footer. Emite ok-input {html} en cada cambio.",
    importPath: "@outfitkit/core/ok-rich-text",
    example: "<div style=\"max-width:560px\">\n  <ok-rich-text id=\"rt\" placeholder=\"Escribe la descripción del producto…\"></ok-rich-text>\n</div>",
    setup: (root, ctx) => {
const el = root.querySelector('#rt');
el.value = [
  '<h2>Ficha del producto</h2>',
  '<p>El <strong>Aceite de Oliva Virgen Extra</strong> de nuestra cooperativa se elabora con aceitunas <em>picual</em> recogidas en su punto óptimo de maduración.</p>',
  '<ul><li>Acidez &lt; 0,3º</li><li>Cosecha temprana</li><li>Botella de 500&nbsp;ml</li></ul>',
  '<blockquote>Mejor con tostadas, ensaladas y pescados a la plancha.</blockquote>',
  '<p>Más info en <a href="https://erplora.com">erplora.com</a>.</p>'
].join('');
    },
    code: "const ed = document.querySelector('ok-rich-text');\ned.value = '<h2>Notas</h2><p>Texto con <strong>formato</strong>…</p>';\ned.addEventListener('ok-input', (e) => {\n  console.log('HTML:', e.detail.html);\n});\n// <ok-rich-text placeholder=\"Escribe aquí…\" size=\"md\"></ok-rich-text>",
    api: [{"kind": "prop", "name": "value", "type": "string", "detail": "Contenido HTML del editor (lectura/escritura)"}, {"kind": "prop", "name": "placeholder", "type": "string", "detail": "Texto cuando el área está vacía"}, {"kind": "prop", "name": "size", "type": "'sm'|'md'|'lg'|'minimal'", "detail": "Tamaño; minimal oculta toolbar y footer (edición inline)"}, {"kind": "prop", "name": "toolbar", "type": "boolean", "detail": "Muestra la barra de formato (ignorado en minimal)"}, {"kind": "prop", "name": "footer", "type": "boolean", "detail": "Muestra el footer con contador de palabras"}, {"kind": "event", "name": "ok-input", "type": "CustomEvent<{ html: string }>", "detail": "Se emite en cada cambio del contenido"}],
  },
  {
    id: "ok-code",
    name: "ok-code",
    category: "inputs",
    desc: "Visor de código sin resaltado: bloque monospace bordeado con scroll horizontal, etiqueta de lenguaje opcional y botón de copiar (emite ok-copy); variante inline (pill) para `code` dentro de texto. Props: code, language, inline, copy.",
    importPath: "@outfitkit/core/ok-code",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem\">\n  <ok-code id=\"c-block\" language=\"bash\" copy code=\"# Instalar un módulo en el Hub\nhub module install inventory --version 1.4.0\nhub module activate inventory\"></ok-code>\n  <ok-code id=\"c-json\" language=\"json\" code='{\n  \"command\": \"pos.sale.create\",\n  \"lines\": [\n    { \"sku\": \"CAFE-001\", \"qty\": 2, \"price\": 1.30 }\n  ],\n  \"total\": 2.60\n}'></ok-code>\n  <p style=\"margin:0;font-size:14px;line-height:1.6;color:var(--ion-text-color,#1f2933)\">\n    Ejecuta el comando <ok-code inline code=\"pos.sale.create\"></ok-code> pasando el\n    <ok-code inline code=\"hub_id\"></ok-code> que inyecta el despliegue.\n  </p>\n</div>",
    code: "<ok-code language=\"bash\" copy code=\"hub module install inventory\"></ok-code>\n<!-- inline dentro de texto -->\nEjecuta <ok-code inline code=\"pos.sale.create\"></ok-code>.\n\n// feedback de copia\nel.addEventListener('ok-copy', (e) => console.log(e.detail.ok, e.detail.code));",
    api: [{"kind": "prop", "name": "code", "type": "string", "detail": "Texto de código a mostrar (whitespace preservado)"}, {"kind": "prop", "name": "language", "type": "string", "detail": "Etiqueta de lenguaje informativa (sin resaltado real)"}, {"kind": "prop", "name": "inline", "type": "boolean", "detail": "Variante pill inline en vez de bloque (refleja a atributo)"}, {"kind": "prop", "name": "copy", "type": "boolean", "detail": "Muestra el botón de copiar (solo en bloque)"}, {"kind": "event", "name": "ok-copy", "type": "CustomEvent<{code:string; ok:boolean}>", "detail": "Emitido al pulsar copiar; ok indica si la Clipboard API tuvo éxito"}],
  },
  {
    id: "ok-json-viewer",
    name: "ok-json-viewer",
    category: "datos",
    desc: "Visor de árbol JSON tipado y colapsable: colorea por tipo (key/string/number/bool/null), filas con chevron que rota y badge \"N keys / N items\" al colapsar. Props .data (objeto/array o string JSON), size (compact|default|lg) y expanded-depth; emite ok-toggle {path, expanded}.",
    importPath: "@outfitkit/core/ok-json-viewer",
    example: "<div style=\"max-width:520px\">\n  <ok-json-viewer id=\"okjv\" expanded-depth=\"2\"></ok-json-viewer>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#okjv').data = {
  pedido: "PED-2026-0481",
  cliente: { nombre: "María López", nif: "12345678Z", vip: true },
  lineas: [
    { sku: "CAFE-250", concepto: "Café molido 250g", cantidad: 2, precio: 4.95 },
    { sku: "LECHE-1L", concepto: "Leche entera 1L", cantidad: 6, precio: 1.15 }
  ],
  total: 16.8,
  pagado: true,
  notas: null
};
    },
    code: "const v = document.querySelector('ok-json-viewer');\nv.data = { pedido: 'PED-2026-0481', total: 16.8, pagado: true };\n// o un string JSON: v.data = '{\"ok\":true}';\nv.addEventListener('ok-toggle', e => console.log(e.detail.path, e.detail.expanded));\n&lt;ok-json-viewer size=\"default\" expanded-depth=\"2\"&gt;&lt;/ok-json-viewer&gt;",
    api: [{"kind": "prop", "name": ".data", "type": "OkJsonValue | string", "detail": "Objeto/array/valor JSON, o un string JSON que se parsea (si falla, lo muestra crudo)"}, {"kind": "prop", "name": "size", "type": "compact | default | lg", "detail": "Tamaño visual (fuente, padding e indentación)"}, {"kind": "prop", "name": "expanded-depth", "type": "number", "detail": "Profundidad inicial expandida (default 1; -1 = expandir todo)"}, {"kind": "event", "name": "ok-toggle", "type": "CustomEvent<{path,expanded}>", "detail": "Al expandir/colapsar un contenedor (bubbles + composed)"}],
  },
  {
    id: "ok-diff",
    name: "ok-diff",
    category: "datos",
    desc: "Visor de diff unificado línea a línea (estilo auditoría/versiones): rejilla monoespaciada con doble numeración old/new, líneas añadidas en verde y eliminadas en rojo, glifos +/− y cabeceras de hunk. Datos vía prop `.lines` (OkDiffLine[]) o `raw` (diff unificado en texto que se parsea). Puramente presentacional, sin eventos.",
    importPath: "@outfitkit/core/ok-diff",
    example: "<div style=\"max-width:560px\">\n  <ok-diff id=\"d\" raw=\"@@ -1,6 +1,7 @@\n def calcular_total(lineas):\n     total = 0\n-    iva = 0.10\n+    iva = 0.21\n     for l in lineas:\n-        total += l.precio\n+        total += l.precio * l.cantidad\n+        total += total * iva\n     return total\"></ok-diff>\n</div>",
    setup: (root, ctx) => {
// Ejemplo declarativo con .lines (precio_pvp en un producto de catálogo):
const el = root.querySelector('#d');
el.lines = [
  { type: 'hunk', content: '@@ catalogo/producto.json @@' },
  { type: 'ctx', content: '  "sku": "CAFE-250",', oldNo: 11, newNo: 11 },
  { type: 'del', content: '  "nombre": "Cafe molido",', oldNo: 12 },
  { type: 'add', content: '  "nombre": "Cafe molido natural 250g",', newNo: 12 },
  { type: 'ctx', content: '  "categoria": "Bebidas",', oldNo: 13, newNo: 13 },
  { type: 'del', content: '  "precio_pvp": 3.50,', oldNo: 14 },
  { type: 'add', content: '  "precio_pvp": 3.95,', newNo: 14 },
  { type: 'add', content: '  "iva": 10,', newNo: 15 },
  { type: 'ctx', content: '  "activo": true', oldNo: 15, newNo: 16 },
];
    },
    code: "// A partir de un diff unificado en texto:\n<ok-diff raw=\"@@ -1,3 +1,3 @@\\n-iva = 0.10\\n+iva = 0.21\"></ok-diff>\n\n// O con líneas declarativas:\ndiff.lines = [\n  { type: 'hunk', content: '@@ producto.json @@' },\n  { type: 'del', content: '\"precio_pvp\": 3.50,', oldNo: 14 },\n  { type: 'add', content: '\"precio_pvp\": 3.95,', newNo: 14 },\n];",
    api: [{"kind": "prop", "name": ".lines", "type": "OkDiffLine[]", "detail": "Lineas declarativas (tiene prioridad sobre raw); cada una {type,content,oldNo?,newNo?}"}, {"kind": "prop", "name": "raw", "type": "string", "detail": "Diff unificado en texto; se parsea a lineas si no hay .lines (CSP-safe, sin eval)"}, {"kind": "prop", "name": "OkDiffLine.type", "type": "'add'|'del'|'ctx'|'hunk'", "detail": "Tipo de linea: anadida, eliminada, contexto o cabecera de hunk"}, {"kind": "prop", "name": "OkDiffLine.oldNo · newNo", "type": "number?", "detail": "Numero de linea en el fichero original / nuevo (columnas de numeracion)"}],
  },
  {
    id: "ok-keyboard",
    name: "ok-keyboard",
    category: "inputs",
    desc: "Teclado virtual en pantalla para kiosko/POS y táctiles: layouts qwerty/numeric/symbol, densidad touch/compact, shift de mayúsculas y tira de display opcional. Emite ok-input, ok-key y ok-enter.",
    importPath: "@outfitkit/core/ok-keyboard",
    example: "<div style=\"display:flex;gap:1.5rem;flex-wrap:wrap;align-items:flex-start\">\n  <div style=\"flex:1 1 320px;min-width:300px\">\n    <div style=\"font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-medium);margin-bottom:.4rem\">QWERTY · touch</div>\n    <ok-keyboard layout=\"qwerty\" density=\"touch\" show-display display-label=\"Nombre\" value=\"María\"></ok-keyboard>\n  </div>\n  <div style=\"flex:0 0 auto\">\n    <div style=\"font-size:.7rem;text-transform:uppercase;letter-spacing:.06em;color:var(--ion-color-medium);margin-bottom:.4rem\">Numérico · PIN</div>\n    <ok-keyboard layout=\"numeric\" density=\"touch\" show-display display-label=\"PIN\" value=\"••••\"></ok-keyboard>\n  </div>\n</div>",
    code: "<ok-keyboard layout=\"qwerty\" density=\"touch\" show-display display-label=\"Nombre\"></ok-keyboard>\n\nconst kb = document.querySelector('ok-keyboard');\nkb.addEventListener('ok-input', (e) => { input.value = e.detail.value; });\nkb.addEventListener('ok-enter', (e) => submit(e.detail.value));",
    api: [{"kind": "prop", "name": "layout", "type": "qwerty|numeric|symbol", "detail": "Distribución del teclado (numeric = rejilla 3 columnas)"}, {"kind": "prop", "name": "density", "type": "touch|compact", "detail": "Tamaño de las teclas: kiosko (grandes) o denso/mobile"}, {"kind": "prop", "name": "value", "type": "string", "detail": "Valor actual del campo (controlado o no)"}, {"kind": "prop", "name": "show-display · display-label", "type": "bool · string", "detail": "Muestra la tira display con etiqueta y caret parpadeante"}, {"kind": "prop", "name": "is-shift", "type": "bool", "detail": "Estado de shift/mayúsculas (reflejado para CSS)"}, {"kind": "event", "name": "ok-input", "type": "{ value }", "detail": "Valor completo tras cada pulsación o borrado"}, {"kind": "event", "name": "ok-key · ok-enter", "type": "{ key } · { value }", "detail": "Tecla individual pulsada · intro confirmado"}],
  },
  {
    id: "ok-calculator",
    name: "ok-calculator",
    category: "inputs",
    desc: "Calculadora genérica con display de dos líneas (operación previa + valor) y teclado de 4 columnas; máquina de estados completa (+ − × ÷, AC, ⌫, decimal). Gestiona su propio estado o se controla vía `value`. Emite `ok-input` (cada tecla) y `ok-change` (cambia el display).",
    importPath: "@outfitkit/core/ok-calculator",
    example: "<div style=\"display:flex;justify-content:center;padding:.5rem\">\n  <ok-calculator></ok-calculator>\n</div>",
    code: "// Autónoma: gestiona su propio estado\n<ok-calculator></ok-calculator>\n\n// Escuchar el resultado mostrado\ncalc.addEventListener('ok-change', (e) => {\n  console.log('valor:', e.detail.value);\n});\n\n// Modo controlado opcional\n<ok-calculator value=\"42.50\"></ok-calculator>",
    api: [{"kind": "prop", "name": "value", "type": "string", "detail": "Display controlado opcional; si se omite, el componente gestiona su estado interno"}, {"kind": "event", "name": "ok-input", "type": "CustomEvent<{key:string}>", "detail": "Tecla pulsada tal cual (dígito, operador, '=', 'AC', '⌫', '.')"}, {"kind": "event", "name": "ok-change", "type": "CustomEvent<{value:string}>", "detail": "Valor actual del display tras la pulsación"}],
  },
  {
    id: "ok-image",
    name: "ok-image",
    category: "multimedia",
    desc: "Imagen lazy que Ionic no trae: marco con ratio fijo, placeholder con shimmer mientras carga, fade-in al cargar, caption con degradado, y zoom opcional (lens=lupa que sigue el puntero · lightbox=overlay a pantalla completa). Props: src, alt, ratio, caption, radius, zoom, placeholder-text. Emite ok-open al abrir el lightbox.",
    importPath: "@outfitkit/core/ok-image",
    example: "<div style=\"display:grid;grid-template-columns:repeat(2,1fr);gap:1rem;max-width:560px\">\n  <ok-image src=\"https://picsum.photos/id/292/640/360\" alt=\"Salón del restaurante\" ratio=\"16:9\" caption=\"Mesa 12 · Terraza\" zoom=\"lightbox\"></ok-image>\n  <ok-image src=\"https://picsum.photos/id/1080/480/640\" alt=\"Plato del día\" ratio=\"portrait\" caption=\"Solomillo al Pedro Ximénez\"></ok-image>\n  <ok-image src=\"https://picsum.photos/id/431/400/400\" alt=\"Café de especialidad\" ratio=\"square\" zoom=\"lens\" radius=\"lg\"></ok-image>\n  <ok-image src=\"https://no-existe.erplora.com/roto.jpg\" alt=\"Imagen rota\" ratio=\"square\" placeholder-text=\"cargando foto…\"></ok-image>\n</div>",
    code: "<ok-image\n  src=\"/media/plato.webp\"\n  alt=\"Solomillo al PX\"\n  ratio=\"16:9\"\n  caption=\"Mesa 12 · Terraza\"\n  zoom=\"lightbox\"\n></ok-image>\n\nimg.addEventListener('ok-open', (e) => {\n  // e.detail = { src, alt } — abre tu propio visor si lo prefieres\n});",
    api: [{"kind": "prop", "name": "src", "type": "string", "detail": "URL de la imagen (loading=lazy)"}, {"kind": "prop", "name": "alt", "type": "string", "detail": "Texto alternativo (accesibilidad)"}, {"kind": "prop", "name": "ratio", "type": "'16:9'|'square'|'portrait'|'free'", "detail": "Relacion de aspecto del marco"}, {"kind": "prop", "name": "caption", "type": "string", "detail": "Pie opcional pinned abajo con degradado"}, {"kind": "prop", "name": "zoom", "type": "'none'|'lens'|'lightbox'", "detail": "Lupa que sigue el puntero o overlay a pantalla completa"}, {"kind": "prop", "name": "radius · placeholder-text", "type": "'sm'|'md'|'lg' · string", "detail": "Radio de esquinas · texto del placeholder mientras carga"}, {"kind": "event", "name": "ok-open", "type": "CustomEvent<{src,alt}>", "detail": "Al abrir el lightbox (permite usar tu propio visor)"}],
  },
  {
    id: "ok-gallery",
    name: "ok-gallery",
    category: "multimedia",
    desc: "Grid de imágenes cuadradas (auto-fill) seleccionable que Ionic no trae: hover con escala + caption con gradiente, badge circular de selección y placeholder de rayas para imágenes sin src. Props .images, selectable, .selected, min-size, columns; eventos ok-select y ok-open (para emparejar con ok-lightbox).",
    importPath: "@outfitkit/core/ok-gallery",
    example: "<div style=\"max-width:560px\"><ok-gallery id=\"g\" selectable min-size=\"120\"></ok-gallery></div>",
    setup: (root, ctx) => {
const g = root.querySelector("#g");
g.images = [
  { id: "p1", src: "https://picsum.photos/id/292/300/300", label: "Café con leche", alt: "Café con leche" },
  { id: "p2", src: "https://picsum.photos/id/1080/300/300", label: "Tarta de fresa", alt: "Tarta de fresa" },
  { id: "p3", src: "https://picsum.photos/id/431/300/300", label: "Croissant artesano", alt: "Croissant" },
  { id: "p4", label: "SIN FOTO" },
  { id: "p5", src: "https://picsum.photos/id/225/300/300", label: "Tabla de quesos", alt: "Tabla de quesos" },
  { id: "p6", src: "https://picsum.photos/id/312/300/300", label: "Zumo natural", alt: "Zumo natural" },
];
g.selected = ["p2", "p5"];
g.addEventListener("ok-select", (e) => console.log("ok-select", e.detail.selected));
g.addEventListener("ok-open", (e) => console.log("ok-open", e.detail.index));
    },
    code: "const g = document.querySelector('ok-gallery');\ng.images = [\n  { id: 'p1', src: '/media/cafe.webp', label: 'Café con leche' },\n  { id: 'p2', src: '/media/tarta.webp', label: 'Tarta de fresa' },\n  { id: 'p3', label: 'Sin foto' }, // placeholder de rayas\n];\ng.selectable = true;\ng.selected = ['p1'];\ng.addEventListener('ok-select', e => console.log(e.detail.selected));\ng.addEventListener('ok-open', e => openLightbox(e.detail.index));\n// <ok-gallery selectable min-size=\"160\"></ok-gallery>",
    api: [{"kind": "prop", "name": ".images", "type": "OkGalleryImage[]", "detail": "Items del grid: { src?, alt?, label?, id? }. Sin src pinta el placeholder de rayas"}, {"kind": "prop", "name": "selectable", "type": "boolean", "detail": "Activa el badge de selección y el toggle por click (reflejado)"}, {"kind": "prop", "name": ".selected", "type": "(string|number)[]", "detail": "Ids (o índices si falta id) seleccionados"}, {"kind": "prop", "name": "min-size", "type": "number", "detail": "Ancho mínimo del item para el auto-fill, px (default 160)"}, {"kind": "prop", "name": "columns", "type": "number", "detail": "Fuerza un número fijo de columnas (0 = auto-fill por min-size)"}, {"kind": "event", "name": "ok-select", "type": "{ id, index, selected }", "detail": "Al alternar selección; selected = nueva lista de ids"}, {"kind": "event", "name": "ok-open", "type": "{ id, index, image }", "detail": "Al hacer click en una imagen (emparejar con ok-lightbox)"}],
  },
  {
    id: "ok-lightbox",
    name: "ok-lightbox",
    category: "multimedia",
    desc: "Visor de medios a pantalla completa (galería): overlay oscuro con cabecera \"N / M · fichero\" + descargar/fullscreen/cerrar, medio centrado, navegación prev/next y filmstrip de miniaturas. Teclado: flechas navegan, Esc cierra. Props .items, index, open; eventos ok-index y ok-close.",
    importPath: "@outfitkit/core/ok-lightbox",
    example: "<div style=\"display:flex;flex-direction:column;gap:1rem;align-items:flex-start\">\n  <p style=\"margin:0;color:var(--ion-color-medium);font-size:.9rem\">Galería del producto. Pulsa una miniatura para abrir el visor a pantalla completa.</p>\n  <div id=\"lb-grid\" style=\"display:flex;gap:.6rem;flex-wrap:wrap\">\n    <img class=\"lb-th\" data-i=\"0\" src=\"https://picsum.photos/id/1080/200/140\" alt=\"Fresas frescas\" style=\"width:120px;height:84px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--ion-color-step-150,#e0e0e0)\">\n    <img class=\"lb-th\" data-i=\"1\" src=\"https://picsum.photos/id/292/200/140\" alt=\"Plato de tapas\" style=\"width:120px;height:84px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--ion-color-step-150,#e0e0e0)\">\n    <img class=\"lb-th\" data-i=\"2\" src=\"https://picsum.photos/id/431/200/140\" alt=\"Café de especialidad\" style=\"width:120px;height:84px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--ion-color-step-150,#e0e0e0)\">\n    <img class=\"lb-th\" data-i=\"3\" src=\"https://picsum.photos/id/225/200/140\" alt=\"Pan artesano\" style=\"width:120px;height:84px;object-fit:cover;border-radius:8px;cursor:pointer;border:1px solid var(--ion-color-step-150,#e0e0e0)\">\n  </div>\n  <ion-button id=\"lb-open\" size=\"small\" fill=\"solid\">\n    <ion-icon name=\"images-outline\" slot=\"start\"></ion-icon>\n    Abrir galería\n  </ion-button>\n  <ok-lightbox id=\"lb\"></ok-lightbox>\n</div>",
    setup: (root, ctx) => {
const lb = root.querySelector('#lb');
lb.items = [
  { src: 'https://picsum.photos/id/1080/1200/750', alt: 'fresas-frescas.webp' },
  { src: 'https://picsum.photos/id/292/1200/750', alt: 'plato-tapas.webp' },
  { src: 'https://picsum.photos/id/431/1200/750', alt: 'cafe-especialidad.webp' },
  { src: 'https://picsum.photos/id/225/1200/750', alt: 'pan-artesano.webp' },
];
lb.labels = { prev: 'Anterior', next: 'Siguiente', close: 'Cerrar', download: 'Descargar', fullscreen: 'Pantalla completa' };
lb.index = 0;
lb.open = true;

root.querySelectorAll('.lb-th').forEach((th) => {
  th.addEventListener('click', () => {
    lb.index = Number(th.getAttribute('data-i'));
    lb.open = true;
  });
});
root.querySelector('#lb-open').addEventListener('click', () => {
  lb.index = 0;
  lb.open = true;
});
lb.addEventListener('ok-close', () => { lb.open = false; });
lb.addEventListener('ok-index', (e) => { lb.index = e.detail.index; });
    },
    code: "const lb = document.querySelector('ok-lightbox');\nlb.items = [\n  { src: '/media/fresas.webp', alt: 'Fresas frescas' },\n  { src: '/media/clip.mp4', type: 'video', thumb: '/media/clip-thumb.webp' },\n];\nlb.labels = { prev: 'Anterior', next: 'Siguiente', close: 'Cerrar', download: 'Descargar', fullscreen: 'Pantalla completa' };\nlb.addEventListener('ok-close', () => { lb.open = false; });\nlb.addEventListener('ok-index', (e) => { lb.index = e.detail.index; });\n// abrir desde una miniatura:\nlb.index = 0; lb.open = true;",
    api: [{"kind": "prop", "name": ".items", "type": "OkLightboxItem[]", "detail": "Medios a mostrar: { src, alt?, type?: 'img'|'video', thumb? }"}, {"kind": "prop", "name": "index", "type": "number", "detail": "Indice activo (0-based); se clampa a los limites"}, {"kind": "prop", "name": "open", "type": "boolean", "detail": "Muestra/oculta el visor (overlay portado a document.body)"}, {"kind": "prop", "name": ".labels", "type": "Partial<OkLightboxLabels>", "detail": "Textos aria traducibles (prev/next/close/download/fullscreen); merge sobre defaults en ingles"}, {"kind": "event", "name": "ok-index", "type": "CustomEvent<{ index:number }>", "detail": "Emitido al cambiar de medio (flecha, miniatura o teclado)"}, {"kind": "event", "name": "ok-close", "type": "CustomEvent", "detail": "Emitido al cerrar (Esc, boton cerrar); el consumidor pone open=false"}],
  },
  {
    id: "ok-cropper",
    name: "ok-cropper",
    category: "multimedia",
    desc: "UI de recorte de imagen que Ionic no trae: viewport con checkerboard y overlay oscuro, rectángulo de recorte arrastrable y redimensionable por las 4 esquinas, guías rule-of-thirds y toolbar con presets de aspecto (Libre/1:1/4:3/16:9). Props: src, aspect, .value (rect en %), crop-label/cancel-label. Eventos: ok-crop (con {rect}) y ok-cancel.",
    importPath: "@outfitkit/core/ok-cropper",
    example: "<div style=\"max-width:520px;margin:0 auto\">\n  <ok-cropper\n    id=\"cr\"\n    src=\"https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80\"\n    aspect=\"4:3\"\n    crop-label=\"Recortar foto\"\n    cancel-label=\"Cancelar\"\n  ></ok-cropper>\n  <p style=\"margin:.75rem 0 0;font-size:.8rem;color:var(--ion-color-medium,#6b7280)\">\n    Arrastra el recuadro o sus esquinas. Cambia la proporción con la barra de abajo.\n  </p>\n</div>",
    setup: (root, ctx) => {
const cr = root.querySelector('#cr');
// Rect de recorte inicial (en % del viewport): centrado y ligeramente apaisado.
cr.value = { x: 12, y: 16, width: 70, height: 60 };
cr.addEventListener('ok-crop', (e) => {
  const r = e.detail.rect;
  console.log('recortar', `x:${r.x.toFixed(0)}% y:${r.y.toFixed(0)}% w:${r.width.toFixed(0)}% h:${r.height.toFixed(0)}%`);
});
cr.addEventListener('ok-cancel', () => console.log('recorte cancelado'));
    },
    code: "const cr = document.querySelector('ok-cropper');\ncr.src = '/uploads/plato.jpg';\ncr.aspect = '1:1';                       // 'free' | '1:1' | '4:3' | '16:9'\ncr.value = { x: 10, y: 10, width: 80, height: 80 }; // rect en % del viewport\ncr.addEventListener('ok-crop', (e) => {\n  const { x, y, width, height } = e.detail.rect; // todo en %\n  applyCrop(x, y, width, height);\n});\ncr.addEventListener('ok-cancel', () => closeEditor());\n\n// <ok-cropper src=\"/uploads/plato.jpg\" aspect=\"1:1\" crop-label=\"Recortar\"></ok-cropper>",
    api: [{"kind": "prop", "name": "src", "type": "string", "detail": "URL de la imagen a recortar"}, {"kind": "prop", "name": "aspect", "type": "'free'|'1:1'|'4:3'|'16:9'", "detail": "Relación de aspecto forzada del recorte"}, {"kind": "prop", "name": ".value", "type": "OkCropRect", "detail": "Rect inicial { x, y, width, height } en % del viewport (0..100)"}, {"kind": "prop", "name": "crop-label · cancel-label", "type": "string · string", "detail": "Textos de los botones Recortar / Cancelar"}, {"kind": "event", "name": "ok-crop", "type": "CustomEvent<{ rect: OkCropRect }>", "detail": "Al pulsar Recortar; detail.rect lleva el recorte en %"}, {"kind": "event", "name": "ok-cancel", "type": "CustomEvent", "detail": "Al pulsar Cancelar"}],
  },
  {
    id: "ok-splitter",
    name: "ok-splitter",
    category: "web",
    desc: "Split-pane redimensionable estilo IDE: dos paneles (slots start/end) con un divisor arrastrable; props orientation, size (% del primer panel), min/max y collapsed; emite ok-resize al redimensionar.",
    importPath: "@outfitkit/core/ok-splitter",
    example: "<ok-splitter id=\"sp\" orientation=\"horizontal\" size=\"38\" min=\"20\" max=\"70\" style=\"--min-height:260px\">\n  <div slot=\"start\" style=\"padding:14px;font:14px/1.5 system-ui\">\n    <div style=\"font-weight:600;margin-bottom:10px\">Categorías</div>\n    <div style=\"padding:8px 10px;border-radius:8px;background:var(--ion-color-primary,#3880ff);color:#fff;margin-bottom:4px\">Bebidas</div>\n    <div style=\"padding:8px 10px;border-radius:8px;margin-bottom:4px\">Entrantes</div>\n    <div style=\"padding:8px 10px;border-radius:8px;margin-bottom:4px\">Platos principales</div>\n    <div style=\"padding:8px 10px;border-radius:8px;margin-bottom:4px\">Postres</div>\n    <div style=\"padding:8px 10px;border-radius:8px\">Cafés</div>\n  </div>\n  <div slot=\"end\" style=\"padding:14px;font:14px/1.5 system-ui\">\n    <div style=\"font-weight:600;margin-bottom:10px\">Bebidas — 6 productos</div>\n    <div style=\"display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ion-border-color,#e0e0e0)\"><span>Agua mineral 50cl</span><strong>1,20 €</strong></div>\n    <div style=\"display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ion-border-color,#e0e0e0)\"><span>Refresco cola</span><strong>2,10 €</strong></div>\n    <div style=\"display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ion-border-color,#e0e0e0)\"><span>Cerveza tercio</span><strong>2,50 €</strong></div>\n    <div style=\"display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--ion-border-color,#e0e0e0)\"><span>Zumo natural</span><strong>3,00 €</strong></div>\n    <div style=\"display:flex;justify-content:space-between;padding:8px 0\"><span>Vino copa</span><strong>3,50 €</strong></div>\n    <div style=\"margin-top:14px;font-size:12px;color:var(--ion-color-medium,#92949c)\">Arrastra el divisor para redimensionar</div>\n  </div>\n</ok-splitter>",
    code: "<ok-splitter orientation=\"horizontal\" size=\"38\" min=\"20\" max=\"70\">\n  <div slot=\"start\">Maestro</div>\n  <div slot=\"end\">Detalle</div>\n</ok-splitter>\nsplitter.addEventListener('ok-resize', e => console.log(e.detail.size)); // % del 1.er panel",
    api: [{"kind": "prop", "name": "orientation", "type": "'horizontal'|'vertical'", "detail": "Paneles lado a lado o apilados"}, {"kind": "prop", "name": "size", "type": "number", "detail": "Tamaño del primer panel en % (0-100)"}, {"kind": "prop", "name": "min", "type": "number", "detail": "Mínimo % del primer panel"}, {"kind": "prop", "name": "max", "type": "number", "detail": "Máximo % del primer panel"}, {"kind": "prop", "name": "collapsed", "type": "'none'|'start'|'end'", "detail": "Colapsa (oculta) un panel"}, {"kind": "event", "name": "ok-resize", "type": "CustomEvent<{size:number}>", "detail": "Emitido al redimensionar; detail.size = % del primer panel"}, {"kind": "slot", "name": "start · end", "type": "slot", "detail": "Contenido del primer y segundo panel"}],
  },
  {
    id: "ok-loyalty-card",
    name: "ok-loyalty-card",
    category: "marketing",
    desc: "Tarjeta de socio/fidelización presentacional (formato apaisado, gradiente de marca, chip EMV en CSS): titular, número mono, puntos y badge de tier. Props: holder, number, points, points-label, brand, tier (silver|gold|platinum|brand), meta-label, meta-value, size. Sin eventos ni slots.",
    importPath: "@outfitkit/core/ok-loyalty-card",
    example: "<div style=\"display:flex;gap:1.25rem;flex-wrap:wrap;align-items:flex-start\">\n  <ok-loyalty-card\n    brand=\"ERPlora Club\"\n    holder=\"María López\"\n    number=\"6011 2354 8890 1247\"\n    points=\"12.480\"\n    points-label=\"Puntos acumulados\"\n    tier=\"gold\"\n    tier-label=\"Oro\"\n    meta-label=\"Socio desde\"\n    meta-value=\"03 / 22\"\n    size=\"md\"></ok-loyalty-card>\n  <ok-loyalty-card\n    brand=\"ERPlora Club\"\n    holder=\"Juan Pérez\"\n    number=\"6011 7781 0042 9930\"\n    points=\"48.910\"\n    points-label=\"Puntos acumulados\"\n    tier=\"platinum\"\n    tier-label=\"Platino\"\n    meta-label=\"Caduca\"\n    meta-value=\"12 / 26\"\n    size=\"md\"></ok-loyalty-card>\n</div>",
    code: "<ok-loyalty-card\n  brand=\"ERPlora Club\"\n  holder=\"María López\"\n  number=\"6011 2354 8890 1247\"\n  points=\"12.480\"\n  points-label=\"Puntos acumulados\"\n  tier=\"gold\"\n  tier-label=\"Oro\"\n  meta-label=\"Socio desde\"\n  meta-value=\"03 / 22\"\n  size=\"md\"></ok-loyalty-card>",
    api: [{"kind": "prop", "name": "brand · holder", "type": "string", "detail": "Marca/programa en la cabecera · nombre del titular"}, {"kind": "prop", "name": "number", "type": "string", "detail": "Número de socio/tarjeta (se renderiza en mono)"}, {"kind": "prop", "name": "points · points-label", "type": "string", "detail": "Valor de puntos (tal cual) · etiqueta bajo el valor (def. 'Reward points')"}, {"kind": "prop", "name": "tier · tier-label", "type": "silver|gold|platinum|brand · string", "detail": "Nivel visual (platinum anima un sheen) · texto del badge (def. tier capitalizado)"}, {"kind": "prop", "name": "meta-label · meta-value", "type": "string", "detail": "Etiqueta (def. 'Member since') · valor (alta/caducidad, ej. '03 / 24')"}, {"kind": "prop", "name": "size", "type": "sm|md|lg", "detail": "Tamaño de la tarjeta (md = 340x210)"}],
  },
  {
    id: "ok-event-card",
    name: "ok-event-card",
    category: "datos",
    desc: "Tarjeta de evento de calendario: bloque de fecha (día grande + mes) + título, hora y lugar con iconos inline, y pila de avatares solapados (+N). Props: title, date (ISO) o day/month, time, location, color, size, now (pulso \"en curso\"), max-avatars y .attendees. Sin eventos propios.",
    importPath: "@outfitkit/core/ok-event-card",
    example: "<div style=\"display:flex;flex-direction:column;gap:.75rem;max-width:520px\">\n  <ok-event-card id=\"ev1\" now color=\"brand\" title=\"Reunión de equipo comercial\" date=\"2026-06-14\" time=\"09:30 – 10:15\" location=\"Sala Atlántico\"></ok-event-card>\n  <ok-event-card id=\"ev2\" color=\"leaf\" title=\"Inventario trimestral de almacén\" date=\"2026-06-18\" time=\"16:00\" location=\"Almacén central\" max-avatars=\"3\"></ok-event-card>\n  <ok-event-card id=\"ev3\" size=\"sm\" color=\"warn\" title=\"Cierre de caja\" date=\"2026-06-14\" time=\"22:00\"></ok-event-card>\n</div>",
    setup: (root, ctx) => {
root.querySelector('#ev1').attendees = [
  { name: 'María López' },
  { name: 'Juan Pérez' },
  { name: 'Ana Ruiz' },
  { name: 'Sara Díaz' },
  { name: 'Luis Gómez' },
];
root.querySelector('#ev2').attendees = [
  { name: 'Carlos Ruiz' },
  { name: 'Elena Vidal' },
  { name: 'Pedro Sanz' },
  { name: 'Marta Gil' },
];
    },
    code: "const ev = document.querySelector('ok-event-card');\nev.attendees = [\n  { name: 'María López' },\n  { name: 'Juan Pérez', avatar: '/media/juan.webp' },\n];\n&lt;ok-event-card\n  title=\"Reunión de equipo\"\n  date=\"2026-06-14\"\n  time=\"09:30 – 10:15\"\n  location=\"Sala Atlántico\"\n  color=\"brand\" now max-avatars=\"4\"&gt;&lt;/ok-event-card&gt;",
    api: [{"kind": "prop", "name": "title", "type": "string", "detail": "Título del evento"}, {"kind": "prop", "name": "date · day · month", "type": "string", "detail": "Fecha ISO (deriva día/mes) o día/mes explícitos"}, {"kind": "prop", "name": "time · location", "type": "string", "detail": "Hora/rango y ubicación (con iconos inline)"}, {"kind": "prop", "name": "color · size", "type": "brand|leaf|warn|danger|info · sm|md|lg", "detail": "Acento y tamaño de la tarjeta"}, {"kind": "prop", "name": "now", "type": "boolean", "detail": "Marca \"en curso\": pulso animado en el borde"}, {"kind": "prop", "name": "max-avatars · .attendees", "type": "number · OkEventAttendee[]", "detail": "Tope visible antes de +N · asistentes {name, avatar?, initials?}"}, {"kind": "prop", "name": "locale", "type": "string", "detail": "Locale para formatear el mes derivado de date"}],
  },
  {
    id: "ok-avatar-group",
    name: "ok-avatar-group",
    category: "datos",
    desc: "Pila de avatares solapados (stack) presentacional: cada avatar muestra imagen o iniciales con tono de color, y colapsa el exceso en un globo \"+N\". Props: .avatars, max, size (xs/sm/md/lg), overlap. Sin eventos.",
    importPath: "@outfitkit/core/ok-avatar-group",
    example: "<div style=\"display:flex;flex-direction:column;gap:1.25rem;align-items:flex-start\">\n  <ok-avatar-group id=\"ag-lg\" size=\"lg\"></ok-avatar-group>\n  <ok-avatar-group id=\"ag-md\" size=\"md\" max=\"4\"></ok-avatar-group>\n  <ok-avatar-group id=\"ag-sm\" size=\"sm\" max=\"3\" overlap=\"12\"></ok-avatar-group>\n</div>",
    setup: (root, ctx) => {
const equipo = [
  { src: 'https://i.pravatar.cc/96?img=12', label: 'Sara Díaz' },
  { initials: 'ML', tone: 'brand', label: 'María López' },
  { initials: 'JP', tone: 'success', label: 'Juan Pérez' },
  { src: 'https://i.pravatar.cc/96?img=32', label: 'Ana Ruiz' },
  { initials: 'LG', tone: 'warning', label: 'Luis Gómez' },
  { initials: 'CR', tone: 'info', label: 'Carlos Ramos' },
  { src: 'https://i.pravatar.cc/96?img=5', label: 'Elena Vidal' },
];
root.querySelector('#ag-lg').avatars = equipo;
root.querySelector('#ag-md').avatars = equipo;
root.querySelector('#ag-sm').avatars = equipo.slice(0, 5);
    },
    code: "const grupo = document.querySelector('ok-avatar-group');\ngrupo.avatars = [\n  { src: '/media/sara.webp', label: 'Sara Díaz' },\n  { initials: 'ML', tone: 'brand', label: 'María López' },\n  { initials: 'JP', tone: 'success', label: 'Juan Pérez' },\n];\ngrupo.max = 4;\n// <ok-avatar-group size=\"md\" max=\"4\"></ok-avatar-group>",
    api: [{"kind": "prop", "name": ".avatars", "type": "OkAvatarItem[]", "detail": "Lista declarativa: {src?, initials?, tone?, label?}"}, {"kind": "prop", "name": "max", "type": "number", "detail": "Máximo visible antes de colapsar en \"+N\" (0 = sin límite)"}, {"kind": "prop", "name": "size", "type": "xs|sm|md|lg", "detail": "Tamaño del stack (reflejado como atributo)"}, {"kind": "prop", "name": "overlap", "type": "number", "detail": "Solape en px entre avatares; por defecto según el tamaño"}, {"kind": "prop", "name": "tone (por item)", "type": "neutral|brand|success|warning|danger|info", "detail": "Color de fondo cuando se pintan iniciales"}],
  },
  {
    id: "ok-org-chart",
    name: "ok-org-chart",
    category: "datos",
    desc: "Organigrama jerárquico con render SVG vectorial: layout calculado (tidy-tree), conectores que cuadran centro-a-centro y nodos HTML (avatar imagen o iniciales del nombre, hover-lift, stack de avatares +N por tamaño de equipo). Como un organigrama no cabe a lo ancho, se navega con pan (arrastrar) + zoom (rueda/pinch + botones), centrar y «ajustar a pantalla»; cada rama se puede recoger/expandir. Recibe el árbol por la prop `.root`. Emite `ok-node-toggle`.",
    importPath: "@outfitkit/core/ok-org-chart",
    example: "<ok-org-chart id=\"org\" max-avatars=\"3\" height=\"460\"></ok-org-chart>",
    setup: (root, ctx) => {
root.querySelector('#org').root = {
  name: 'Lucía Fernández',
  role: 'Directora General',
  team: 24,
  avatar: 'https://i.pravatar.cc/80?img=47',
  children: [
    {
      name: 'Carlos Méndez',
      role: 'Jefe de Ventas',
      team: 8,
      avatar: 'https://i.pravatar.cc/80?img=12',
      children: [
        { name: 'Marta Gil', role: 'Comercial', team: 3 },
        { name: 'Diego Soto', role: 'Comercial' },
      ],
    },
    {
      name: 'Ana Belmonte',
      role: 'Jefa de Operaciones',
      team: 11,
      children: [
        { name: 'Pablo Ruiz', role: 'Almacén' },
        { name: 'Nuria Vega', role: 'Logística', team: 4 },
      ],
    },
    {
      name: 'Javier Ortega',
      role: 'Finanzas',
      team: 2,
    },
  ],
};
    },
    code: "const org = document.querySelector('ok-org-chart');\norg.maxAvatars = 3;\norg.root = {\n  name: 'Lucía Fernández', role: 'Directora General', team: 24,\n  avatar: 'https://…/lucia.jpg',           // imagen, o iniciales si falta\n  children: [\n    { name: 'Carlos Méndez', role: 'Jefe de Ventas', team: 8,\n      children: [{ name: 'Marta Gil', role: 'Comercial' }] },\n    { name: 'Ana Belmonte', role: 'Jefa de Operaciones', team: 11 },\n  ],\n};\norg.addEventListener('ok-node-toggle', e => console.log(e.detail));\n// <ok-org-chart max-avatars=\"3\" height=\"460\"></ok-org-chart>",
    api: [{"kind": "prop", "name": ".root", "type": "OrgNode | null", "detail": "Nodo raíz del organigrama (children recursivos: name, role?, avatar?, team?)"}, {"kind": "prop", "name": "maxAvatars", "type": "number", "detail": "Máximo de avatares en el stack antes del «+N» (por defecto 3)"}, {"kind": "prop", "name": "height", "type": "number", "detail": "Alto del viewport en px (se navega con pan/zoom; por defecto 460)"}, {"kind": "event", "name": "ok-node-toggle", "type": "{ node, collapsed }", "detail": "Al recoger/expandir una rama"}],
  },

  {
    id: "ok-file-manager",
    name: "ok-file-manager",
    category: "datos",
    desc: "Gestor de archivos autocontenido: árbol de carpetas con contadores + medidor de espacio, breadcrumb, toolbar (búsqueda, cuadrícula/lista, subir), y rejilla/lista de ficheros con badge por tipo. Zona drag-and-drop de subida. Agnóstico al backend: solo renderiza y emite eventos (el Hub conecta disco local / S3 vía Cloud). Ej.: facturas recibidas y emitidas; los módulos definen su carpeta vía module.json.",
    importPath: "@outfitkit/core/ok-file-manager",
    example: "<ok-file-manager id=\"fm\" title=\"Archivos del Hub\" view=\"grid\" style=\"--ok-fm-height:520px\"></ok-file-manager>",
    setup: (root, ctx) => {
const fm = root.querySelector('#fm');
const FOLDERS = [{
  id: 'tenant', label: 'Cafetería La Rambla', icon: 'business-outline', children: [
    { id: 'fac-recibidas', label: 'Facturas recibidas', count: 142 },
    { id: 'fac-emitidas', label: 'Facturas emitidas', count: 98 },
    { id: 'tickets', label: 'Tickets', count: 3412 },
    { id: 'exports', label: 'Exports', count: 28 },
    { id: 'multimedia', label: 'Multimedia', count: 86 },
    { id: 'backups', label: 'Backups', count: 14 },
  ],
}];
const FILES = {
  'fac-recibidas': [
    { id: 'f1', name: 'factura-2026-0412.pdf', ext: 'pdf', sizeLabel: '245 KB', modified: '12/06/2026' },
    { id: 'f2', name: 'factura-2026-0411.pdf', ext: 'pdf', sizeLabel: '198 KB', modified: '11/06/2026' },
    { id: 'f3', name: 'albaran-7782.pdf', ext: 'pdf', sizeLabel: '88 KB', modified: '10/06/2026' },
    { id: 'f4', name: 'distribuciones-lopez.xlsx', ext: 'xlsx', sizeLabel: '54 KB', modified: '09/06/2026' },
    { id: 'f5', name: 'sello-proveedor.png', ext: 'png', sizeLabel: '1,2 MB', modified: '08/06/2026' },
    { id: 'f6', name: 'lote-junio.zip', ext: 'zip', sizeLabel: '4,7 MB', modified: '07/06/2026' },
  ],
  'fac-emitidas': [
    { id: 'e1', name: 'F2026-0098.pdf', ext: 'pdf', sizeLabel: '132 KB', modified: '13/06/2026' },
    { id: 'e2', name: 'F2026-0097.pdf', ext: 'pdf', sizeLabel: '129 KB', modified: '12/06/2026' },
    { id: 'e3', name: 'export-emitidas-q2.csv', ext: 'csv', sizeLabel: '22 KB', modified: '01/06/2026' },
  ],
};
const LABELS = { 'tenant': 'tenant-rambla', 'fac-recibidas': 'Facturas recibidas', 'fac-emitidas': 'Facturas emitidas', 'tickets': 'Tickets', 'exports': 'Exports', 'multimedia': 'Multimedia', 'backups': 'Backups' };
function show(id) {
  fm.selected = id;
  fm.files = FILES[id] || [];
  fm.path = [{ id: 'tenant', label: 'tenant-rambla' }, { id, label: LABELS[id] || id }];
}
fm.folders = FOLDERS;
fm.quota = { usedLabel: '1,8 GB', totalLabel: '5 GB', fraction: 0.36 };
show('fac-recibidas');
fm.addEventListener('ok-navigate', (e) => show(e.detail.id));
fm.addEventListener('ok-view-change', (e) => { fm.view = e.detail.view; });
fm.addEventListener('ok-upload', (e) => {
  const extra = Array.from(e.detail.files).map((f, i) => ({ id: 'up' + i + Date.now(), name: f.name, ext: (f.name.split('.').pop() || '').toLowerCase(), sizeLabel: Math.max(1, Math.round(f.size / 1024)) + ' KB', modified: 'ahora' }));
  fm.files = [...extra, ...fm.files];
});
    },
    code: "<ok-file-manager id=\"fm\" title=\"Archivos del Hub\" view=\"grid\"></ok-file-manager>\nconst fm = document.querySelector('#fm');\nfm.folders = [{ id: 'tenant', label: 'Mi Hub', children: [{ id: 'fac', label: 'Facturas', count: 142 }] }];\nfm.files = [{ id: 'f1', name: 'factura-0412.pdf', ext: 'pdf', sizeLabel: '245 KB', modified: '12/06/2026' }];\nfm.quota = { usedLabel: '1,8 GB', totalLabel: '5 GB', fraction: 0.36 };\nfm.addEventListener('ok-navigate', (e) => loadFolder(e.detail.id));\nfm.addEventListener('ok-upload', (e) => uploadToHub(e.detail.files));   // Local: disco · Cloud: S3 vía Cloud\nfm.addEventListener('ok-download', (e) => download(e.detail.id, e.detail.url));",
    api: [{"kind": "prop", "name": ".folders", "type": "OkFmFolder[]", "detail": "Árbol de carpetas {id,label,icon?,count?,children?}; carpeta activa resaltada"}, {"kind": "prop", "name": ".files", "type": "OkFmFile[]", "detail": "Contenido de la carpeta {id,name,ext?,sizeLabel?,modified?,url?,thumb?}; ext da el color del badge"}, {"kind": "prop", "name": ".path", "type": "OkFmCrumb[]", "detail": "Migas de pan clicables hasta la carpeta actual"}, {"kind": "prop", "name": ".quota", "type": "{usedLabel,totalLabel,fraction}", "detail": "Medidor de almacenamiento bajo el árbol"}, {"kind": "prop", "name": "view · selected", "type": "'grid'|'list' · string", "detail": "Vista cuadrícula/lista · id de carpeta activa"}, {"kind": "event", "name": "ok-navigate", "type": "{id}", "detail": "Click en carpeta del árbol o miga"}, {"kind": "event", "name": "ok-upload", "type": "{files: File[]}", "detail": "Drag-drop o selector; el host los sube (disco local / S3 vía Cloud)"}, {"kind": "event", "name": "ok-download · ok-delete · ok-open", "type": "{id, url?}", "detail": "Acciones por fichero"}],
  },
];

export { CATEGORIES, COMPONENTS };
