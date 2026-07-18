# Patrones de página basados en `ok-data-table`

Auditoría de las vistas reales de SaaS, Hub y `modules-workspace` para guiar la migración del
showcase. Fecha de contraste: 2026-07-18.

**Conclusión Lean:** reutilizo un único `ok-data-table` y cinco composiciones de página; no creo
variantes del componente ni cambio su API pública congelada.

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

Composición: `rowAction` abre Ionic o cambia el estado de la mini-app; `open('create')` se reserva al
panel estrecho de alta/edición rápida.

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
- acciones por fila con estado disabled/loading;
- vista tabla/tarjetas y contenido de tarjeta personalizado;
- selección, importación/exportación CSV, acción primaria y menú overflow;
- panel `create`, `fill`, etiquetas i18n y key estable de fila.

No hace falta otro componente de tabla ni una variante por producto.

## Huecos reales detectados (sin cambiar el API en esta migración)

1. **Estado controlado de búsqueda y filtros server-side.** SaaS restaura el buscador entrando al
   Shadow DOM y pinta filtros en el slot `toolbar` para conservar la URL. Es un workaround válido,
   pero revela que faltan valores controlados opcionales si se quiere integrar sin acceso interno.
2. **Acciones visibles por fila y submenús.** SaaS necesita visibilidad, URL, POST, confirmación y
   acciones hijas por registro; hoy renderiza una columna de acciones propia. El core solo permite
   `disabled`/`loading` por fila.
3. **Acciones masivas dentro de la barra de selección.** La barra nativa muestra contador y limpiar;
   SaaS coloca las operaciones en el menú `⋮`. La funcionalidad existe, pero la paridad visual con
   la antigua barra contextual no es completa.
4. **Loading explícito.** Hub pone spinners fuera y los módulos cambian temporalmente
   `emptyMessage` a «Cargando…». Un estado opcional futuro evitaría mostrar un vacío durante carga.

Estos huecos requieren una decisión humana de API aditiva. No bloquean las primeras recetas porque
los productos ya tienen adaptadores funcionales.

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
4. SaaS `/dashboard/organizations/`, `/dashboard/users/` y `/dashboard/marketplace/`.

Cada página nueva del showcase debe indicar su fuente real, cubrir desktop y móvil, y reutilizar una
de estas cinco recetas. Si no encaja, primero se demuestra el hueco con una página existente antes
de añadir otro patrón o capacidad.
