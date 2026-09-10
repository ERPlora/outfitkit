<!-- GENERADO por scripts/generate-component-catalog.mjs — NO editar a mano.
     Se regenera con `npm run catalog`; el gate falla si este fichero no coincide. -->

# OutfitKit — qué existe ya (94 componentes)

Índice para decidir **antes** de escribir markup o crear un componente: si algo de aquí sirve,
se reutiliza. Ionic (`ion-*`) es la base — botones, inputs, listas, modales, toolbars, cards,
tabs, selects, popovers y el app-shell se usan **directamente de Ionic**; OutfitKit solo cubre
lo que Ionic no trae.

⚠️ Los datos tipados (arrays, objetos, funciones) se pasan **por propiedad JS**
(`el.columns = [...]`), nunca por atributo HTML.

## Datos (15)

- `ok-avatar` — Avatar de iniciales o imagen (lo que ion-avatar no cubre): tamaños, color derivado por hash, punto de estado y enlace opcional. · props: `name · email`, `src`, `size`, `shape · tone`, `status · href`
- `ok-avatar-group` — Pila de avatares solapados (stack) presentacional: cada avatar muestra imagen o iniciales con tono de color, y colapsa el exceso en un globo "+N". · props: `.avatars`, `max`, `size`, `overlap`, `tone (por item)`
- `ok-data-table` — Tabla rica con toolbar consolidada en una línea: buscador, filtros en línea (select / rango de fechas), tamaño de página, vistas tabla/tarjetas, export/import CSV, menú «⋮» y acción primaria. · props: `.columns`, `.rows`, `.searchKeys`, `.search`, `inlineFilters`, `.menuActions`, `.pageSizes · pageSize`, `.actions`, `.views`, `title · selectable · .rowKey`, `rowClickable`, `addable`, `.primaryAction`, `.cardTitle · .cardIcon · .renderCard`, `pageSize (móvil)`, `serverSide · total · page · sort · sortDir`, `.filterValues` · eventos: `rowAction · menuAction`, `rowClick`, `primaryAction · selectionChange`, `pageChange · sortChange · searchChange · filterChange · viewChange`
- `ok-detail-list` — Lista de detalle (description list, <dl>) para pantallas de ficha: pares etiqueta/valor alineados por baseline con la etiqueta muted. · props: `.items`, `columns`, `dense`, `placeholder`, `item.html`, `item.full`
- `ok-diff` — Visor de diff unificado línea a línea (estilo auditoría/versiones): rejilla monoespaciada con doble numeración old/new, líneas añadidas en verde y eliminadas en rojo, glifos +/− y cabeceras de hunk. · props: `.lines`, `raw`, `OkDiffLine.type`, `OkDiffLine.oldNo · newNo`
- `ok-event-card` — Tarjeta de evento de calendario: bloque de fecha (día grande + mes) + título, hora y lugar con iconos inline, y pila de avatares solapados (+N). · props: `title`, `date · day · month`, `time · location`, `color · size`, `now`, `max-avatars · .attendees`, `locale`
- `ok-file-manager` — Gestor de archivos autocontenido: árbol de carpetas con contadores + medidor de espacio, breadcrumb, toolbar (búsqueda, cuadrícula/lista, subir), y rejilla/lista de ficheros con badge por tipo. · props: `.folders`, `.files`, `.path`, `.quota`, `view · selected` · eventos: `ok-navigate`, `ok-upload`, `ok-download · ok-delete · ok-open`
- `ok-icon-tile` — Pastilla cuadrada coloreada con un icono dentro (leading icon de filas/cards/KPI). · props: `icon`, `color`, `size`, `shape`, `label`
- `ok-json-viewer` — Visor de árbol JSON tipado y colapsable: colorea por tipo (key/string/number/bool/null), filas con chevron que rota y badge "N keys / N items" al colapsar. · props: `.data`, `size`, `expanded-depth` · eventos: `ok-toggle`
- `ok-money` — Importe monetario TAL COMO SE VE, a partir del ENTERO en unidad mínima que guarda el sistema (1650 = 16,50 €; ADR-0123). · props: `value`, `decimals`, `currency`, `locale`
- `ok-org-chart` — Organigrama jerárquico con render SVG vectorial: layout calculado (tidy-tree), conectores que cuadran centro-a-centro y nodos HTML (avatar imagen o iniciales del nombre, hover-lift, stack de avatares +N por tamaño de equipo). · props: `.root`, `maxAvatars`, `height` · eventos: `ok-node-toggle`
- `ok-pagination` — Paginador numerado (sobre ion-button/ion-select) con chevrons prev/next, colapso por elipsis (sibling-count/boundary-count), info "X–Y de Z" y selector de filas. · props: `total · page · page-size`, `variant`, `info`, `.pageSizeOptions`, `sibling-count · boundary-count` · eventos: `ok-page-change`, `ok-page-size-change`
- `ok-sparkline` — Mini-gráfico inline (línea o barras) sin ejes, para tendencias junto a un KPI. · props: `.values`, `type`, `color`, `width · height · filled`
- `ok-status-pill` — Pill de estado con tinte semántico suave (fondo al ~14% + texto en el shade): el hueco entre ion-badge (sólido) e ion-chip (neutro). · props: `tone`, `label · icon · dot`, `size`
- `ok-tree` — Árbol expandible por datos, render recursivo con indentación por nivel. · props: `.nodes`, `selectable`, `active-id` · eventos: `ok-toggle`, `ok-select`

## Feedback (4)

- `ok-empty-state` — Estado centrado para «sin datos / sin resultados», con icono, título, mensaje y acción. · props: `icon · heading · message`
- `ok-error-page` — Plantilla full-screen para errores HTTP (403/404/500) o pantalla de arranque (bootstrap): código + título + mensaje, ilustración por variant (info/warn/danger), tiles de atajo (.shortcuts), checklist de salud (.checks en mode=bootstrap), traza colapsable (trace), chip de reintento con cuenta atrás (retry-seconds) y slots actions/search. · props: `code · title · message`, `variant · mode`, `.shortcuts`, `.checks`, `trace · meta`, `retry-seconds · retry-label` · eventos: `ok-retry · ok-shortcut`
- `ok-inline-feedback` — Banner/callout persistente en el flujo del contenido (Ionic solo trae toast/alert efímeros). · props: `tone`, `heading · icon · dismissible` · eventos: `ok-dismiss`
- `ok-status-dot` — Punto de presencia/estado coloreado y compacto (forma reducida de ok-status-pill): solo el dot con tono semántico, tamaño, label opcional (inline o sr-only) y pulso "en vivo". · props: `tone`, `size`, `pulse`, `label`, `show-label`

## Dashboard (4)

- `ok-kpi` — Tarjeta de métrica para dashboards: label, valor grande y delta con flecha y color según tendencia. · props: `label · value · delta`, `trend`, `icon`
- `ok-page-header` — Cabecera de página IN-CONTENT típica de un ERP: título + descripción + acciones a la derecha + hueco para ion-breadcrumbs y línea de metadatos. · props: `heading · level`, `description`, `compact`
- `ok-stat` — Métrica inline compacta (más ligera que ok-kpi): label, valor y hint. · props: `label · value · hint`
- `ok-widget-board` — Panel configurable para dashboards: activa, oculta y reordena widgets Ionic/OutfitKit sin apropiarse de sus datos. · props: `.widgets`, `.value`, `.presets`, `editable · storage-key` · eventos: `ok-change`

## Gráficos (7)

- `ok-bar-list` — Lista ranking de barras horizontales (top-N): cada fila = etiqueta + track con relleno proporcional al valor frente a `max` (auto-calculado) + valor en negrita. · props: `.items`, `max`, `value-format`, `locale · currency`, `item.color`
- `ok-chart` — Gráfico declarativo en SVG inline (línea, área o barras) autocontenido y CSP-safe: rejilla, eje de valor, etiquetas X, leyenda, series con color/punteado/atenuado y punto final con etiqueta. · props: `type`, `.series`, `.labels`, `.axis`, `gridlines`, `height`, `endpoint · endpointLabel`, `min · max`
- `ok-donut` — Gráfico donut/pie dibujado en SVG (lo que Ionic no trae): segmentos proporcionales con leyenda y porcentajes calculados, más valor/label central. · props: `.slices`, `size`, `thickness`, `center-value`, `center-label`, `legend`, `legend-side`
- `ok-funnel` — Embudo de conversión: filas apiladas con barra de ancho % decreciente (gradiente brand) más meta con conteo absoluto y % de conversión por paso (auto, respecto al anterior). · props: `.steps`, `color (por paso)`, `min-width`, `locale`
- `ok-gauge` — Medidor en SVG a mano (CSP-safe) con tres tipos: 'arc' (semicírculo), 'ring' (anillo) y 'bullet' (barra Tufte con zonas + objetivo). · props: `type`, `value`, `min · max`, `.thresholds`, `target`, `label · sublabel`, `color · size · unit`
- `ok-heatmap` — Heatmap de calendario/contribución (estilo GitHub) en CSS puro: celdas coloreadas por intensidad (cuantiles sobre value, o level explícito). · props: `.data`, `layout`, `levels`, `scale`, `cell-size`, `legend`
- `ok-resource-usage` — Panel de recurso 0-100 % (RAM/CPU/disco) compartido Hub↔Cloud. · props: `.metric`, `.thresholds`, `.upgrade`, `label · range-label`, `unit`, `unreadable-label`

## Flujo (8)

- `ok-calendar` — Calendario mensual / agenda con eventos por día, navegación de mes y selección de fecha. · props: `.events`, `value`, `view`, `max-per-day` · eventos: `ok-date-select`, `ok-event-click`, `ok-view-change · ok-nav`
- `ok-chat` — Hilo de mensajes (chat): burbujas self/ajeno, avatar, hora y compositor con enviar. · props: `.messages`, `title · placeholder · readonly` · eventos: `ok-send`
- `ok-kanban` — Tablero de columnas con tarjetas arrastrables entre columnas (drag & drop). · props: `.columns` · eventos: `ok-card-move`, `ok-card-click`
- `ok-mail` — Cliente de correo estilo Outlook pero SOLO email: 3 paneles (carpetas · lista · lectura), buscador, no leídos, estrella, adjuntos y acciones (responder/reenviar/archivar/eliminar). · props: `.folders`, `.messages`, `active-folder · active-message` · eventos: `ok-message-select · ok-folder-select`, `ok-compose · ok-reply · ok-forward · ok-archive · ok-delete · ok-star`, `ok-search`
- `ok-scheduler` — Agenda de recursos/turnos en timeline horario: una fila por recurso (empleado, sala, máquina) con sus bloques posicionados por hora. · props: `.resources`, `.events`, `date`, `start-hour · end-hour · slot-minutes`, `movable`, `snap-minutes` · eventos: `ok-event-click`, `ok-slot-click`, `ok-nav`, `ok-event-move`
- `ok-stepper` — Indicador de pasos: círculos numerados conectados; completado / activo / pendiente. · props: `.steps`, `current` · eventos: `ok-step-select`
- `ok-timeline` — Línea de tiempo vertical por datos: una fila por hito con punto de color/icono, título, descripción y hora. · props: `.items`, `align` · eventos: `ok-item-click`
- `ok-wizard` — Asistente multi-paso: stepper + contenido por slots step-0, step-1… + navegación Atrás/Siguiente/Finalizar. · props: `.steps · current`, `backLabel · nextLabel · finishLabel` · eventos: `ok-step-change · ok-finish`

## Inputs (18)

- `ok-calculator` — Calculadora genérica con display de dos líneas (operación previa + valor) y teclado de 4 columnas; máquina de estados completa (+ − × ÷, AC, ⌫, decimal). · props: `value` · eventos: `ok-input`, `ok-change`
- `ok-code` — Visor de código sin resaltado: bloque monospace bordeado con scroll horizontal, etiqueta de lenguaje opcional y botón de copiar (emite ok-copy); variante inline (pill) para `code` dentro de texto. · props: `code`, `language`, `inline`, `copy` · eventos: `ok-copy`
- `ok-color-picker` — Selector de color: un botón-muestra (swatch) abre un panel con área HSV, hex y una rejilla de presets. · props: `value`, `.presets` · eventos: `ok-change`, `ok-open`
- `ok-combo` — Selector con búsqueda (autocomplete): escribe para filtrar opciones y elige una. · props: `.options`, `value · placeholder · label` · eventos: `ok-input`, `ok-change`
- `ok-currency` — Campo de importe con formato de moneda según locale (separadores, símbolo) y valor numérico limpio. · props: `value`, `currency · locale`, `placeholder · label` · eventos: `ok-change`
- `ok-dropzone` — Zona de subida de archivos por arrastrar-y-soltar o click, con filtro de tipo y tamaño máximo. · props: `accept`, `multiple`, `max-size`, `hint` · eventos: `ok-change`, `ok-error`
- `ok-file-item` — Fila de archivo adjunto/subida (compañero de ok-dropzone): badge cuadrado tintado por extensión, nombre elipsado, meta de tamaño, barra de progreso al subir y estado error. · props: `name`, `ext`, `size`, `state`, `progress`, `error · removable` · eventos: `ok-remove`
- `ok-kbd` — Chips de keycap (teclas de teclado) presentacionales: keys="cmd k" renderiza ⌘ + K con relieve 3D, modificadores en negrita/mayúsculas y glifos bonitos. · props: `keys`, `size`, `combo`
- `ok-keyboard` — Teclado virtual en pantalla para kiosko/POS y táctiles: layouts qwerty/numeric/symbol, densidad touch/compact, shift de mayúsculas y tira de display opcional. · props: `layout`, `density`, `value`, `show-display · display-label`, `is-shift` · eventos: `ok-input`, `ok-key · ok-enter`
- `ok-otp` — Entrada de código de un solo uso: una casilla por dígito, auto-avance y pegado. · props: `length`, `value` · eventos: `ok-change`, `ok-complete`
- `ok-phone` — Campo de teléfono con selector de país (prefijo) y salida E.164 normalizada. · props: `value`, `country`, `.countries`, `placeholder · label` · eventos: `ok-change`
- `ok-pinpad` — Teclado numérico (TPV / login por PIN) con dígitos ocultables. · props: `value · length`, `masked` · eventos: `ok-input`, `ok-complete`
- `ok-qty-stepper` — Selector de cantidad (−/+ con campo central editable) que hace clamp a min/max según step. · props: `value · min · max`, `step · disabled` · eventos: `ok-change`
- `ok-rating` — Valoración por estrellas, con soporte de medias estrellas y modo solo-lectura. · props: `value · max`, `readonly · allow-half` · eventos: `ok-change`
- `ok-rich-text` — Editor WYSIWYG (rich text) que Ionic no trae: área contenteditable con prosa completa (títulos, listas, enlaces, código, cita), toolbar de formato y footer con contador de palabras. · props: `value`, `placeholder`, `size`, `toolbar`, `footer` · eventos: `ok-input`
- `ok-select-card` — Fila/tarjeta seleccionable: toda la fila es zona de click y envuelve un ion-checkbox/ion-radio nativo; al marcar pinta borde y fondo de marca. · props: `mode`, `name`, `value · checked`, `label · description · icon`, `disabled` · eventos: `ok-change`
- `ok-tag-input` — Entrada de múltiples etiquetas (chips), con autocompletado opcional por sugerencias. · props: `.value`, `placeholder`, `.suggestions` · eventos: `ok-change`
- `ok-theme-picker` — Selector de tema compartido Cloud↔Hub (settings): paleta de marca (swatches — ERPlora + terracotta/corporate/minimal/forest/ocean/violet de palettes.css) + modo claro/oscuro/sistema. · props: `palette`, `mode`, `hide-mode`, `.palettes`, `.labels`, `applyPalette(root, id)` · eventos: `ok-change`

## Acciones (4)

- `ok-app-launcher` — Botón de icono (rejilla 3×3) que despliega una cuadrícula de apps/atajos, estilo lanzador. · props: `.apps` · eventos: `ok-app-select`
- `ok-command-palette` — Paleta de comandos estilo ⌘K (overlay propio): input de búsqueda con fuzzy-match sobre etiqueta/keywords, comandos agrupados con icono y atajo, navegación con teclado. · props: `.commands`, `open · placeholder · hotkey` · eventos: `openPalette() · close() · toggle()`, `ok-select`, `ok-open`
- `ok-split-button` — Botón con acción principal + menú desplegable de acciones secundarias. · props: `label · color · fill`, `.items` · eventos: `ok-main`, `ok-select`
- `ok-spotlight-search` — Buscador estilo Spotlight (macOS): overlay translúcido flotante que no rompe la vista de debajo. · props: `open · placeholder · value`, `trigger-icon · trigger-label` · eventos: `openSearch() · close() · toggle()`, `ok-input · ok-open`

## Overlays (4)

- `ok-coachmark` — Tour guiado (onboarding) con spotlight: recorta el scrim alrededor de un target, ancla un bubble edge-aware (top/bottom/left/right con volteo) y navega por pasos. · props: `.steps`, `current`, `open`, `.labels` · eventos: `ok-step`, `ok-finish`, `ok-skip`
- `ok-hover-card` — Popover rica de previsualización anclada al hover/focus de un disparador inline (@menciones / referencias cruzadas): avatar + título con badge, @handle, cuerpo, fila de 3 cifras tabulares y pie de hasta 2 botones. · props: `name · badge · handle`, `avatar · avatar-src`, `body`, `.stats`, `.actions`, `placement · open-delay · close-delay` · eventos: `ok-action`, `ok-open`
- `ok-menu` — Menú desplegable / contextual sobre primitivos propios: items declarativos (.items) con icono, atajo, divisor, sección, checkbox/radio y submenús en cascada; modo click o contextual (clic derecho), anclaje volteable y slot header. · props: `.items`, `trigger`, `anchor`, `width`, `open` · eventos: `ok-select`, `ok-open`
- `ok-notification-center` — Bandeja de notificaciones tipo drawer lateral derecho (inbox de ERP): lista de avisos status-tintados, chips de filtro, contador de no-leídas y pie "marcar todas leídas". · props: `.items`, `.filters`, `active · open · title`, `.labels` · eventos: `ok-read · ok-read-all`, `ok-filter · ok-open`, `ok-close`

## Formularios (1)

- `ok-contact-form` — Formulario de contacto web responsive con validación básica. · props: `heading · submit-label`, `action · success-message` · eventos: `ok-submit`

## Web (6)

- `ok-footer` — Footer web multi-columna responsive con barra inferior (slot bottom).
- `ok-hero` — Sección hero de marketing con título, subtítulo y CTAs (slots).
- `ok-language-select` — Selector de idioma para la web pública: los idiomas se pasan como enlaces (<a data-lang href>) en light DOM → SEO-crawlable, funciona sin JS y CSP-safe (navega por href). · props: `value · open`
- `ok-menubar` — Barra de menús de escritorio (estilo app: Archivo / Editar / Ver…): dropdowns con iconos, atajos, separadores y submenús. · props: `.menus` · eventos: `ok-select`, `ok-open`
- `ok-navbar` — Barra de navegación de landing responsive con burger en móvil (ion-menu es un drawer de app, no una navbar). · props: `sticky · open`
- `ok-splitter` — Split-pane redimensionable estilo IDE: dos paneles (slots start/end) con un divisor arrastrable; props orientation, size (% del primer panel), min/max y collapsed; emite ok-resize al redimensionar. · props: `orientation`, `size`, `min`, `max`, `collapsed` · eventos: `ok-resize`

## Marketing (10)

- `ok-bento` — Rejilla «bento» modular (tendencia 2026): contenedor de celdas de tamaños variados. · props: `cols · cols-md`, `gap`
- `ok-bento-item` — Celda de una ok-bento. Ocupa cols×rows de la rejilla. Panel con superficie, borde y radio; opcionalmente glass (cristal esmerilado), tinte de color (tone), elevación al hover (interactive) y enlace (href). · props: `cols · rows`, `tone`, `glass · interactive`, `href`, `icon · eyebrow · heading`
- `ok-cta-band` — Banda de llamada a la acción (final de página/sección). Fondo con degradado de marca (variant solid, def) o soft/glass, título grande, subtítulo y CTAs (slot="actions", normalmente ion-button). · props: `eyebrow · heading · subheading`, `variant`, `--ok-cta-action-outline-*`
- `ok-feature-card` — Tarjeta de característica para marketing: icono + (eyebrow) + título + descripción (slot default). · props: `icon`, `eyebrow · heading`, `href`, `glass`
- `ok-logo-cloud` — Banda de logos de clientes / «trusted by» (prueba social). Acepta los logos como slot (imgs o texto) y los muestra en rejilla atenuada (grayscale → color al hover). · props: `label`, `marquee`
- `ok-loyalty-card` — Tarjeta de socio/fidelización presentacional (formato apaisado, gradiente de marca, chip EMV en CSS): titular, número mono, puntos y badge de tier. · props: `brand · holder`, `number`, `points · points-label`, `tier · tier-label`, `meta-label · meta-value`, `size`
- `ok-pricing-card` — Tarjeta de plan/precio: nombre, precio + periodo, descripción, lista de features (prop .features o slot con <ul>) y CTA (slot="cta"). featured la destaca con borde de marca y badge flotante. · props: `name · price · period`, `description`, `.features`, `featured · badge`
- `ok-product-card` — Tarjeta de producto/módulo del catálogo (marketplace): icono + categoría + nombre + descripción (slot) + badge opcional + precio. · props: `icon · category · name`, `badge · price`, `href`
- `ok-reveal` — Anima su contenido al entrar en el viewport (scroll reveal, tendencia 2026). · props: `variant`, `delay`, `once`
- `ok-testimonial` — Cita de cliente (prueba social): rating opcional en estrellas, cita (slot default), avatar (o iniciales) + autor + rol. glass para cristal esmerilado. · props: `rating`, `author · author-role`, `avatar`, `glass`

## Multimedia (12)

- `ok-audio` — Reproductor de audio con controles propios (play/pausa, barra de progreso, tiempo). · props: `src · title` · eventos: `ok-play · ok-pause · ok-ended`
- `ok-carousel` — Carrusel de slides con transición por transform: flechas prev/next, puntos indicadores y swipe táctil. · props: `.slides`, `index`, `autoplay · loop` · eventos: `ok-change`
- `ok-cropper` — UI de recorte de imagen que Ionic no trae: viewport con checkerboard y overlay oscuro, rectángulo de recorte arrastrable y redimensionable por las 4 esquinas, guías rule-of-thirds y toolbar con presets de aspecto (Libre/1:1/4:3/16:9). · props: `src`, `aspect`, `.value`, `crop-label · cancel-label` · eventos: `ok-crop`, `ok-cancel`
- `ok-gallery` — Grid de imágenes cuadradas (auto-fill) seleccionable que Ionic no trae: hover con escala + caption con gradiente, badge circular de selección y placeholder de rayas para imágenes sin src. · props: `.images`, `selectable`, `.selected`, `min-size`, `columns` · eventos: `ok-select`, `ok-open`
- `ok-image` — Imagen lazy que Ionic no trae: marco con ratio fijo, placeholder con shimmer mientras carga, fade-in al cargar, caption con degradado, y zoom opcional (lens=lupa que sigue el puntero · lightbox=overlay a pantalla completa). · props: `src`, `alt`, `ratio`, `caption`, `zoom`, `radius · placeholder-text` · eventos: `ok-open`
- `ok-invoice` — Factura A4 (documento fiscal completo) presentacional: recibe un JSON (prop .invoice) y lo pinta como factura profesional — emisor+receptor con datos fiscales, líneas con descuento/impuesto, resumen de impuestos por tipo, totales, condiciones de pago, pie legal y QR opcional (reusa ok-qr). · props: `invoice`, `qr-size`
- `ok-lightbox` — Visor de medios a pantalla completa (galería): overlay oscuro con cabecera "N / M · fichero" + descargar/fullscreen/cerrar, medio centrado, navegación prev/next y filmstrip de miniaturas. · props: `.items`, `index`, `open`, `.labels` · eventos: `ok-index`, `ok-close`
- `ok-pdf` — Visor de PDF embebido (vía <iframe>/<embed>) con cabecera de título y altura configurable. · props: `src · title`, `height`
- `ok-qr` — Generador de código QR autocontenido (SVG, sin dependencias). · props: `value`, `ec`, `size · margin`, `color · background`
- `ok-receipt` — Tiquet/recibo de venta (POS) presentacional: recibe un JSON (prop .receipt) y lo pinta con estética de impresora térmica (80mm). · props: `receipt`, `receipt.table`, `receipt.decimals`, `lines[].components · lines[].modifiers`, `qr-size`
- `ok-signature` — Pad de firma sobre canvas con trazo suavizado y soporte HiDPI (devicePixelRatio). · props: `pen-color · line-width`, `background · height`, `show-export` · eventos: `clear() · toDataURL() · isEmpty()`, `ok-change · ok-clear`
- `ok-video` — Reproductor de vídeo responsive (aspect-ratio 16/9) con controles propios y póster. · props: `src · poster`, `labels` · eventos: `ok-play · ok-pause · ok-ended`

## Estado (1)

- `ok-store` — Store reactivo persistente (IndexedDB, con fallback en memoria). · props: `name` · eventos: `ok-store-ready`, `ok-store-change`

---

Además, `@erplora/outfitkit/layout.css` aporta **recetas CSS** (no son componentes):
`.ok-container`, `.ok-grid`/`.ok-col`, `.ok-section`, `.ok-grid-cards`, `.ok-masonry`,
`.ok-form-actions` y `.ok-table-stack` (la tabla que colapsa a tarjetas bajo 768 px).
Regla: geometría y tipografía puras → clase CSS; comportamiento o estado → componente.

Ejemplos vivos de cada uno (Preview + Código + API): `erplora.github.io/outfitkit`.
