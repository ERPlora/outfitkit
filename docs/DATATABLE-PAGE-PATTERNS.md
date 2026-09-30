# Patrones de página basados en `ok-data-table`

Auditoría de las vistas reales de SaaS, Hub y `modules-workspace` para guiar la migración del
showcase. **Fecha de contraste: 2026-07-18**; los recuentos de instancias y las oleadas son de ese
día y no se re-miden aquí.

**Conclusión Lean:** reutilizo un único `ok-data-table` y cinco composiciones de página; no creo
variantes del componente ni cambio su API pública. «Congelada» significa que solo se **añaden**
props opcionales —nada se quita ni se renombra—, no que la API no haya crecido: desde esta
auditoría entraron `filterValues`, la búsqueda controlada, `pinned: 'end'`, la etiqueta de acción
por fila y `testid`, todas aditivas (ver abajo).

## Realidad observada

- **SaaS:** 15 páginas de tabla pasan por el adaptador server-side común de Django. Búsqueda,
  filtros, orden y paginación viven en la URL; el componente solo presenta y emite intención.
- **Hub:** 11 instancias. Predomina el modo cliente con datos ya cargados; `/employees` es la
  referencia visual más completa y `/apps` la referencia de vista tarjetas primero.
- **Módulos:** 54 instancias actuales (sin el módulo archivado `kitchen_orders`). La gran mayoría
  usa `createListController` y `serverSide`; es el patrón normal, no una excepción.

## Los cinco patrones que deben convertirse en recetas

### 1. CRUD server-side con alta rápida

Lista que llena el área disponible, buscador, filtros de columna, orden, paginación, acciones por
fila y formulario Ionic en el slot `create`.

Referencias: `/m/inventory/products`, `/m/customers/customers`, `/m/tickets/tickets`.

Composición: `ion-*` para formulario/modal/confirmación + `ok-data-table` para el listado. No se
crea un componente de página adicional.

### 2. Registro operativo de estados y acciones

Tabla de lectura/operación con estado semántico, fechas, importes, filtros y acciones que dependen
de la fila. Puede llevar KPIs encima, pero mantiene el `datatable` como contenido principal.

Referencias: `/dashboard/billing/invoices/`, `/m/invoice/invoice`, `/m/sales/sales`,
`/m/kitchen/active` y `/m/verifactu/records`.

Composición: celdas `render` con `ok-status-pill` o Ionic y acciones icon-only. En SaaS las acciones
dinámicas se resuelven actualmente como una columna renderizada por el adaptador.

### 3. Gestión con selección y operaciones masivas

Listado server-side seleccionable, con contador de seleccionados y comandos aplicados a las keys.
La selección es de la página visible, pero puede acumularse al navegar porque la tabla persiste.

Referencias: `/dashboard/hubs/active/` y `/dashboard/developer/modules/`.

Composición: `selectable` + `selectionChange`; confirmación y envío pertenecen a la página. Este
patrón debe probar explícitamente selección, cambio de página, limpiar y operación peligrosa.

### 4. Lista + detalle o edición

La tabla abre una ficha, modal o panel y vuelve al listado conservando el contexto. El formulario
completo no debe convertirse en columnas ni trasladarse al core.

Referencias: `/m/customers/customers`, `/m/inventory/products`, `/m/appointments/appointments` y
`/m/payment_gateways/gateways`.

Composición: `rowAction` abre Ionic o cambia el estado de la mini-app; el panel estrecho de alta/edición
rápida se abre con `open('create')` (cabecera «Nuevo») o `open('edit')` (cabecera «Editar»); al editar,
pasa el registro como cabecera: `open('edit', { title: 'Editando servicio — Brushing' })` (outfitkit#150).

### 5. Catálogo o lectura client-side con tarjetas

Conjunto ya cargado en memoria, búsqueda local y conmutador tabla/tarjetas. En catálogo la vista
inicial puede ser tarjetas; en actividad o facturación empieza como tabla.

Referencias: Hub `/apps`, `/` pestaña Actividad, `/billing` y `/employees`.

Composición: `rows` + `searchKeys` + `views`; `cardTitle`, `cardIcon` y `renderCard` son funciones.

## Cobertura del API congelado

El API actual ya cubre lo usado de forma repetida:

- modo cliente y server-side;
- búsqueda, filtros de texto/select/multiselect/número/fecha/rangos, orden y paginación;
- columnas renderizadas, ocultables y con ancho;
- acciones por fila con estado disabled/loading y ocultables por fila (`hidden`);
- vista tabla/tarjetas y contenido de tarjeta personalizado;
- selección, importación/exportación CSV, acción primaria y menú overflow;
- panel `create`, `fill`, etiquetas i18n y key estable de fila.

Añadido **después** de esta auditoría, siempre como prop opcional:

- **`filterValues`** — en modo servidor, el consumidor declara el estado de filtro VISIBLE y la
  tabla lo pinta (antes el filtro aplicado no se veía al volver desde la URL).
- **`search` controlada** — asignar `search` es el consumidor declarando el texto del buscador, con
  el mismo contrato que `filterValues`.
- **`pinned: 'end'` por columna** — fija cualquier columna al borde derecho igual que la de
  acciones (sticky, fondo opaco, sombra al desbordar), para los hosts que pintan sus acciones en
  columna propia.
- **Etiqueta de acción de fila por fila** — `DataTableActionLabel = string | ((row) => string)`, y
  se resuelve TAMBIÉN como nombre accesible (`aria-label`/`title`), que en una acción icon-only es
  lo único que la nombra.
- **`testid`** — el host declara el prefijo (`testid="products-table"`) y la tabla deriva de él los
  `data-testid` de todo su cromo: alta, buscador, import/export CSV, filas, acciones de fila y
  paginador. Sin prefijo no pinta ninguno. Un control reutilizable no puede llevar nombre fijo: dos
  tablas en la misma pantalla darían el mismo gancho y `getByTestId` elegiría una al azar.
- **Nombre del botón de alta** (outfitkit#216) — no es una prop nueva: `.labels` es **por tabla**
  y se funde sobre los textos del idioma, así que `.labels=${{ add: t('ui.addSlot') }}` cambia solo
  el botón de alta (texto y nombre accesible) y deja el resto del cromo como estaba. Sin él dice
  «Añadir»/«Add»; con dos tablas en la misma pantalla (Reservas › Disponibilidad) hay que nombrar
  las dos, o un lector de pantalla oye dos «Añadir» iguales. Lo ancla
  `src/components/ok-data-table/add-button-label.test.ts`.
- **Texto completo de una celda recortada** (outfitkit#217) — no es una prop: la celda de texto de
  la vista lista (sin `render` propio) sigue recortándose a una línea con «…», y lleva su texto
  completo —el mismo que pinta, ya pasado por `format`— como `title` nativo, como MUI DataGrid o
  `ellipsis.showTitle` de Ant Design; la cabecera de columna, también. En táctil no hay `title`: si
  la fila abre un registro (`row-clickable`), el primer toque lo abre como siempre, recortada o no
  (la ficha enseña el texto entero; es lo que hacen Square, Shopify u Odoo); si la fila no abre
  nada, un toque sobre una celda recortada la despliega en su sitio (solo esa celda). Una asignación
  nueva de `rows` vuelve a plegarlas. Una columna con
  `render` propio decide ella. Lo ancla `src/components/ok-data-table/truncated-cell-full-text.test.ts`.
- **`fill` en el móvil** (outfitkit#218) — no es una prop nueva: por debajo de 640 px (donde la
  tabla ya pasa a tarjetas y «Cargar más») `fill` deja de encajonar las filas entre la barra y el
  pie. Las tarjetas miden lo que su contenido y la lista baja con el scroll de la página, como en
  Shopify, Square u Odoo; en escritorio `fill` sigue igual (barra y pie fijos, scroll solo en las
  filas). Si la tabla es lo último de la página, su caja no cambia y las tarjetas siguen por debajo
  (así los bloques de ENCIMA —un `ion-segment`, una `ion-card`— no se aplastan); si detrás viene
  algo en flujo (un título y otra tabla, un aviso), la tabla crece y lo empuja. La tabla lo detecta
  sola y lo refleja en el atributo `content-after` (de solo lectura; no lo pongas a mano); un
  `ion-modal` inline o un bloque oculto no cuentan. Lo que no cubre: un bloque que se deje encoger
  (con `overflow` distinto de `visible`) encima de una tabla que además tenga contenido detrás;
  ningún módulo lo hace hoy y, si alguno lo hiciera, ese bloque lleva `flex-shrink: 0`. Lo ancla
  `src/components/ok-data-table/fill-mobile-grows.test.ts`.
- **Orden por el valor, no por el texto** (outfitkit#256) — en modo cliente, ordenar una columna y
  su filtro de rango de fechas comparan el **valor** de la fila (`row[key]`), no el texto que pinta
  `format`: una fecha «dd/mm/aaaa» ordena por la fecha, un importe «9,50 €» por el número, y una
  fila con el campo a `null` («Sin fin») queda al final en los dos sentidos, como AG Grid, MUI
  DataGrid o TanStack Table. Si la `key` es un id lógico que no está en la fila, o el orden es otro
  (un estado por rango), la columna declara `sortValue: (row) => …`. Solo cuando no hay campo (o es
  un objeto del que `format` saca el texto) se sigue ordenando por el texto. Los chips del filtro
  multi-select siguen ofreciendo el texto pintado. En modo servidor no cambia nada: ordena el
  servidor. Lo ancla `src/components/ok-data-table/sort-by-value.test.ts`.

No hace falta otro componente de tabla ni una variante por producto.

## Huecos reales detectados (estado al 2026-09-16)

1. ✅ **Estado controlado de búsqueda y filtros server-side — CERRADO.** SaaS restauraba el buscador
   entrando al Shadow DOM y pintaba los filtros en el slot `toolbar` para conservar la URL. Ya no
   hace falta acceso interno: `filterValues` y `search` son props controladas
   (`server-filter-values.test.ts`, `controlled-search.test.ts`).
2. 🟡 **Acciones por fila — a medias.** Una acción ya puede llevar **etiqueta calculada con la
   fila**, `disabled`/`loading` por fila y **visibilidad por fila** (`hidden(row)`, hub#2014: la
   acción que no aplica a esa fila no se pinta, ni en lista, ni en tarjeta, ni en el «⋮»; en la lista
   deja un hueco invisible de su mismo ancho, para que cada acción caiga en la misma columna en todas
   las filas, outfitkit#240; si ninguna fila la muestra, no deja hueco), y cuando
   no caben se **pliegan** solas en el menú «⋮» (decidido MIDIENDO el hueco, no por un breakpoint
   fijo). Solo se pliegan si la fila tiene **más de una**: una acción sola **con icono** se queda con su
   botón, porque el «⋮» ocuparía lo mismo y costaría un toque más (#213, como Polaris y MUI DataGrid);
   una sola acción **solo de texto** sí se pliega, porque su botón no cabe en la pista y taparía los datos. Sigue sin cubrirse lo que SaaS resuelve con su columna propia: URL/POST, confirmación y
   acciones hijas.
   Regla: `hidden` para lo que **no aplica** a la fila («Actualizar» sin versión nueva);
   `disabled` para lo que aplica pero ahora no se puede. Un botón gris se lee como «algo está
   bloqueado».
3. 🔴 **Acciones masivas dentro de la barra de selección.** La barra nativa muestra contador y
   limpiar; SaaS coloca las operaciones en el menú `⋮`. La funcionalidad existe, pero la paridad
   visual con la antigua barra contextual no es completa.
4. 🔴 **Loading explícito de la tabla.** `loading` existe **por acción de fila** (spinner en el
   botón), no para la tabla entera: el Hub sigue poniendo spinners fuera y los módulos cambiando
   `emptyMessage` a «Cargando…». Un estado opcional evitaría mostrar un vacío durante la carga.
5. ✅ **Error de carga ≠ lista vacía — CERRADO (pm#530).** Con el hub caído, la tabla decía
   «Sin clientes.» y «0 registros» debajo del aviso del módulo. Ahora `error` (el motivo, p. ej.
   `ListController.error`) pinta «No se han podido cargar los datos», el motivo y «Reintentar»
   (evento `retry` → `ctrl.load()`), sin filas, sin «Sin …» y sin contador. Lo ancla
   `src/components/ok-data-table/load-error.test.ts`.

Lo que queda abierto (el 2 a medias, el 3 y el 4 enteros) es API **aditiva**, y quien lo escriba
decide y lo documenta — la fórmula «requiere una decisión humana» que llevaba aquí quedó derogada
con la división de labor humano/IA (ADR-0163, `ERPlora/pm#43`). Como todo trabajo abierto, va al
[board](https://github.com/orgs/ERPlora/projects/3), no a este `.md`. No bloquea las recetas: los
productos ya tienen adaptadores funcionales.

## Incidencias de consumidores encontradas

- Cuatro vistas de `customers` pasaban strings en `cardTitle`/`cardIcon`; al abrir tarjetas el
  componente intentaba invocarlos como funciones. Se corrigieron y se añadió un guard cross-módulo.
- Hay tablas server-side que muestran selector de tamaño pero no escuchan `pageSizeChange`. En esas
  páginas el selector no cambia la consulta. La migración debe ocultarlo con `pageSizeOptions=[]` o
  cablearlo al controlador; no se soluciona modificando OutfitKit.
- Los módulos `appointments`, `services` y varias vistas de `verifactu` estaban incumpliendo al
  auditar la convención móvil (`views`/`cardTitle`); no deben usarse como referencia hasta quedar
  verdes en `guards/data-table-conventions.test.ts`.
- En SaaS, las series de consumo de Hubs pueden degradar a «—» tras buscar, filtrar o paginar porque
  se adjuntan a las instancias iniciales. El showcase no debe inventar valores para ocultarlo.

## Oleadas priorizadas del showcase

### Oleada 1 — referencias completas de las tres superficies

1. Hub `/employees`: patrón cliente completo y referencia visual del componente.
2. SaaS `/dashboard/hubs/active/`: server-side, estados, filtros, acciones dinámicas y bulk.
3. Módulo `/m/inventory/products`: CRUD server-side, celdas interactivas, CSV, panel y tarjetas.

### Oleada 2 — variaciones de alto uso

1. SaaS `/dashboard/billing/invoices/`: filtros en línea, rango de fecha, export y acción de fila.
2. Módulo `/m/customers/customers`: KPIs, CRUD, ficha y CSV.
3. Hub `/apps`: catálogo card-first e instalados.
4. Hub `/billing`: dos tablas de lectura y acciones de factura.

### Oleada 3 — reutilización masiva del patrón

1. Módulos `/m/invoice/invoice`, `/m/sales/sales`, `/m/payments/list`.
2. Módulos `/m/tasks/all`, `/m/tickets/list`, `/m/reservations/list`.
3. SaaS `/dashboard/developer/modules/`, `/dashboard/developer/earnings/` y
   `/dashboard/developer/payouts/`.
4. SaaS `/dashboard/users/` y `/dashboard/marketplace/`. (Aquí figuraba
   `/dashboard/organizations/`: 🪦 **esa pantalla no existe** — la organización murió con ADR-0201 y
   su espejo en el JWT con ADR-0277. De `apps/dashboard/organizations/` solo sobrevive la tabla
   `Role` del RBAC, sin rutas.)

Cada página nueva del showcase debe indicar su fuente real, cubrir desktop y móvil, y reutilizar una
de estas cinco recetas. Si no encaja, primero se demuestra el hueco con una página existente antes
de añadir otro patrón o capacidad.
