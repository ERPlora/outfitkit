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
];

export { CATEGORIES, COMPONENTS };
