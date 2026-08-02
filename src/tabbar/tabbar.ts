/**
 * Tabbar de footer — comportamiento compartido Cloud↔Hub para un `ion-segment` usado como barra de
 * NAVEGACIÓN (no como el pill de filtro de iOS).
 *
 * Por qué está aquí y no en cada producto: el Hub y el SaaS habían resuelto POR SEPARADO el mismo
 * problema, con reglas que ya divergían. Y es un hueco real de Ionic, no un wrapper: `ion-segment`
 * no trae `scrollIntoView` a la pestaña activa, y su prop `scrollable` sólo cambia layout y gestos.
 * Si desborda y por dónde va el scroll es justo lo que CSS no puede saber solo, así que se publica
 * en `data-overflow` y el degradado lo pinta `tabbar.css`.
 *
 * Uso: una sola llamada, y guardar el cleanup.
 *
 *   const cleanup = bindTabbar(document.querySelector('ion-footer ion-segment'));
 *   // al desmontar la vista → cleanup();
 */

/** Qué bordes del tabbar esconden pestañas. `none` = caben todas. */
export type TabbarOverflow = 'none' | 'start' | 'end' | 'both';

/** Margen de subpíxel: `scrollLeft` es fraccionario y nunca iguala exactamente al tope. */
const EPSILON = 1;
/** Cuánto se asoma la barra al dar la pista, y cuánto tarda en volver. */
const HINT_PX = 28;
const HINT_VUELTA_MS = 420;
/** Clase que activa el CSS de `tabbar.css`. La pone `bindTabbar`, no el consumidor. */
const CLASE = 'ok-tabbar';

/**
 * Calcula qué bordes esconden pestañas, para pintar el degradado SOLO donde hay más.
 *
 * Un degradado fijo a la derecha seguiría oscureciendo la última pestaña cuando ya has llegado al
 * final: se lee como un fallo de pintado, no como "hay más". Por eso son cuatro estados.
 */
export function tabbarOverflow(segment: HTMLElement | null): TabbarOverflow {
  if (!segment) return 'none';

  const maximo = segment.scrollWidth - segment.clientWidth;
  if (maximo <= EPSILON) return 'none';

  const hayAntes = segment.scrollLeft > EPSILON;
  const hayDespues = segment.scrollLeft < maximo - EPSILON;

  if (hayAntes && hayDespues) return 'both';
  if (hayAntes) return 'start';
  return 'end';
}

/** Publica el estado en `data-overflow` para que el degradado lo pinte desde CSS. */
export function syncTabbarOverflow(segment: HTMLElement | null): void {
  if (!segment) return;
  segment.dataset.overflow = tabbarOverflow(segment);
}

/**
 * Trae a la vista la pestaña activa.
 *
 * Hace falta cuando la pestaña activa la fija la RUTA y no un toque (deep-link, back/forward): al
 * montar, la barra arranca en `scrollLeft: 0` y la activa puede quedar fuera de pantalla, así que el
 * usuario no ve en cuál está. Se mueve `scrollLeft` y no `scrollIntoView` para no arrastrar a los
 * ancestros scrolleables ni pelearse con el scroll de la página.
 */
export function scrollActiveTabIntoView(segment: HTMLElement | null): void {
  if (!segment) return;

  const activa = segment.querySelector<HTMLElement>('.segment-button-checked');
  if (!activa) return;
  if (segment.scrollWidth <= segment.clientWidth) return;

  const inicio = activa.offsetLeft;
  const fin = inicio + activa.offsetWidth;
  const visibleInicio = segment.scrollLeft;
  const visibleFin = visibleInicio + segment.clientWidth;

  if (inicio < visibleInicio) segment.scrollLeft = inicio;
  else if (fin > visibleFin) segment.scrollLeft = fin - segment.clientWidth;
}

/**
 * ¿Merece la pena la pista de scroll al entrar?
 *
 * El degradado dice que hay más; el movimiento enseña el GESTO. Pero es movimiento que el usuario
 * no ha pedido, así que sólo se da cuando aporta: si caben todas no hay nada que descubrir; si ya
 * estás al final a la derecha no queda nada; con `prefers-reduced-motion` no se anima; y si la barra
 * ya se movió sola para revelar la activa, repetirlo sería un tirón raro.
 */
export function shouldHintScroll(opts: {
  overflow: TabbarOverflow;
  reducedMotion: boolean;
  yaScrolleado: boolean;
}): boolean {
  if (opts.reducedMotion) return false;
  if (opts.yaScrolleado) return false;
  return opts.overflow === 'end' || opts.overflow === 'both';
}

/**
 * Asoma la barra unos píxeles y la devuelve: enseña que se puede deslizar.
 *
 * Mueve el scroll REAL (no un `transform`) para que el degradado se recalcule solo con el evento
 * `scroll` — al asomarse aparece el degradado izquierdo, lo que refuerza la pista.
 */
export function hintScroll(segment: HTMLElement | null): void {
  if (!segment) return;
  segment.scrollTo({ left: HINT_PX, behavior: 'smooth' });
  setTimeout(() => segment.scrollTo({ left: 0, behavior: 'smooth' }), HINT_VUELTA_MS);
}

/**
 * Cablea un tabbar y devuelve su cleanup. Es la única llamada que necesita el consumidor.
 *
 * Observa tres cosas distintas porque son tres causas distintas de cambio:
 * - `scroll` → el usuario desliza;
 * - `ResizeObserver` → cambia el ancho disponible (rotar el móvil, plegar el menú);
 * - `MutationObserver` → cambia el NÚMERO de pestañas sin cambiar el ancho (un shell que las carga
 *   async desde un manifest), caso en el que el ResizeObserver no se entera.
 *
 * `hint: false` desactiva la pista de movimiento (el degradado se mantiene).
 */
export function bindTabbar(segment: HTMLElement | null, opts: { hint?: boolean } = {}): () => void {
  if (!segment) return () => {};

  segment.classList.add(CLASE);
  const sync = (): void => syncTabbarOverflow(segment);
  sync();

  segment.addEventListener('scroll', sync, { passive: true });

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
  ro?.observe(segment);
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(sync) : null;
  mo?.observe(segment, { childList: true });

  let pista: ReturnType<typeof setTimeout> | null = null;
  if (opts.hint !== false) {
    pista = setTimeout(() => {
      pista = null;
      const reducedMotion =
        typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (shouldHintScroll({ overflow: tabbarOverflow(segment), reducedMotion, yaScrolleado: segment.scrollLeft > 1 })) {
        hintScroll(segment);
      }
    }, 450);
  }

  return () => {
    segment.removeEventListener('scroll', sync);
    ro?.disconnect();
    mo?.disconnect();
    if (pista) clearTimeout(pista);
  };
}
