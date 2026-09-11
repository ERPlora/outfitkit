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
/**
 * Width of the edge gradient. Mirror of the `--ok-tabbar-fade` default in `tabbar.css`.
 *
 * EXPORTED only so the parity test can compare against this number instead of a copy of it: a
 * value pinned inside the test ties nothing -- moving `FADE_PX` alone would still pass. If one
 * moves without the other, revealing a tab would leave it under the fade again, which is exactly
 * the failure the reveal came to remove.
 */
export const FADE_PX = 36;
/** Cuánto se asoma la barra al dar la pista, y cuánto tarda en volver. */
const HINT_PX = 28;
const HINT_VUELTA_MS = 420;
/** Clase que activa el CSS de `tabbar.css`. La pone `bindTabbar`, no el consumidor. */
const CLASE = 'ok-tabbar';
/** Marca puesta mientras se arrastra, para que el CSS cambie el cursor y corte la selección. */
const DRAGGING_CLASS = 'ok-tabbar-dragging';
/** How far the pointer must travel before it counts as a drag and not as a shaky click. */
const DRAG_THRESHOLD_PX = 4;

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
  const maximo = segment.scrollWidth - segment.clientWidth;
  if (maximo <= 0) return;

  const inicio = activa.offsetLeft;
  const fin = inicio + activa.offsetWidth;
  const visibleInicio = segment.scrollLeft;
  const visibleFin = visibleInicio + segment.clientWidth;

  // Leave one gradient width of margin: a tab FLUSH with the edge sits under the fade and reads as
  // "cut off" -- the exact effect the gradient exists to avoid. Clamped to [0, max], so at the
  // extremes the tab hugs the real edge, where the gradient already switches itself off. Measured
  // on the bench: without the margin the last tab of Settings revealed at 78 with the max at 82,
  // and the resulting `both` covered it again.
  const clamp = (v: number): number => Math.max(0, Math.min(v, maximo));
  if (inicio < visibleInicio) segment.scrollLeft = clamp(inicio - FADE_PX);
  else if (fin > visibleFin) segment.scrollLeft = clamp(fin - segment.clientWidth + FADE_PX);
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
 *   async desde un manifest), caso en el que el ResizeObserver no se entera;
 * - the same observer → WHICH tab is checked changes, the other half: the route sets the active
 *   tab as much as the finger does.
 *
 * And it reveals the active tab -- on mount and whenever it changes. `scrollActiveTabIntoView`
 * existed, documented and tested, but nobody called it: the consumer only calls here, so in
 * practice nobody had it (hub#1734).
 *
 * `hint: false` desactiva la pista de movimiento (el degradado se mantiene).
 */
/**
 * Press-and-drag to scroll the strip, for POINTING DEVICES ONLY.
 *
 * Why it is needed: `overflow-x:auto` gives a finger a native pan (with momentum and rubber-banding),
 * but no browser turns a mouse drag into `scrollLeft` -- that has always been the page's job. On the
 * POS the only hook was the wheel, so on a desktop the category strip looked stuck.
 *
 * Why `touch` is excluded: the finger ALREADY works, and reimplementing native kinetic scrolling in
 * JS comes out worse than what the browser ships. A pen keeps the drag: it has no native pan.
 *
 * The click after a drag is swallowed. Without that, releasing the drag on top of another tab
 * selects it -- and on the hub's bottom tab bar (the other consumer) it would navigate away.
 */
function bindDrag(segment: HTMLElement): () => void {
  let pointerId: number | null = null;
  let startX = 0;
  let startScroll = 0;
  let dragging = false;
  let swallowClick = false;
  let disarm: ReturnType<typeof setTimeout> | null = null;

  const onDown = (e: PointerEvent): void => {
    if (e.pointerType === 'touch') return;
    // Primary button only. The secondary one belongs to the context menu, and dragging the strip
    // out from under an opening menu is nobody's intention.
    if (e.button !== 0) return;
    pointerId = e.pointerId;
    startX = e.clientX;
    startScroll = segment.scrollLeft;
    dragging = false;
    swallowClick = false;
  };

  const onMove = (e: PointerEvent): void => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    // The button is STATE, and it is the only thing that tells the truth: a release outside the
    // window never reaches the page as a pointerup, and without this the strip kept scrolling with
    // the button already up -- stuck in grabbing, dragging on every later move.
    if (e.buttons === 0) {
      endDrag();
      return;
    }
    const delta = e.clientX - startX;
    if (!dragging) {
      if (Math.abs(delta) < DRAG_THRESHOLD_PX) return;
      dragging = true;
      segment.classList.add(DRAGGING_CLASS);
      // Captured only AFTER the threshold: capturing earlier would steal the tab's own hover/active.
      segment.setPointerCapture?.(pointerId);
    }
    segment.scrollLeft = startScroll - delta;
  };

  /** Closes the gesture without arming the click swallow: nothing was released over a tab. */
  const endDrag = (): void => {
    if (dragging) {
      if (pointerId !== null) segment.releasePointerCapture?.(pointerId);
      segment.classList.remove(DRAGGING_CLASS);
    }
    pointerId = null;
    dragging = false;
  };

  const onUp = (e: PointerEvent): void => {
    if (pointerId === null || e.pointerId !== pointerId) return;
    if (dragging) {
      // Armed only for the click this gesture is about to produce. A release OUTSIDE the strip
      // produces no click at all, and a swallow left armed would eat the next legitimate one --
      // a keyboard Enter on a focused tab, which never goes through `pointerdown`. If the click
      // has not arrived by the next task, it is not coming.
      swallowClick = true;
      if (disarm !== null) clearTimeout(disarm);
      disarm = setTimeout(() => {
        swallowClick = false;
        disarm = null;
      }, 0);
      segment.releasePointerCapture?.(pointerId);
      segment.classList.remove(DRAGGING_CLASS);
    }
    pointerId = null;
    dragging = false;
  };

  // Capture phase: the tab is a DESCENDANT, so this runs before its own handler and can stop it.
  const onClick = (e: MouseEvent): void => {
    if (!swallowClick) return;
    swallowClick = false;
    e.stopPropagation();
    e.preventDefault();
  };

  // The press starts on the strip, but the rest of the gesture is watched on `window`, and that is
  // not defensive coding -- it was measured. Between `pointerdown` and the 4px threshold there is no
  // pointer capture yet (capturing that early would rob the tab of its own hover/active and of the
  // click that selects it). A tabbar is ~48px tall, so a quick flick that drifts downwards leaves
  // the element on its FIRST move: the strip stops receiving `pointermove`, the threshold is never
  // crossed, and the drag dies without a trace. In Chrome, with 12 tabs in a 380px strip, that drag
  // did not move a single pixel.
  segment.addEventListener('pointerdown', onDown);
  window.addEventListener('pointermove', onMove);
  window.addEventListener('pointerup', onUp);
  window.addEventListener('pointercancel', onUp);
  segment.addEventListener('click', onClick, true);

  return () => {
    segment.removeEventListener('pointerdown', onDown);
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onUp);
    segment.removeEventListener('click', onClick, true);
    if (disarm !== null) clearTimeout(disarm);
    segment.classList.remove(DRAGGING_CLASS);
  };
}

export function bindTabbar(segment: HTMLElement | null, opts: { hint?: boolean } = {}): () => void {
  if (!segment) return () => {};

  segment.classList.add(CLASE);
  const sync = (): void => syncTabbarOverflow(segment);

  /**
   * Reveal, then publish, in that order: the gradient describes WHERE the bar is, so computing it
   * before moving would leave it marking the wrong edge -- the fade would land right on the tab
   * that was just revealed, which is the "broken" look it exists to avoid.
   *
   * And reveal ONLY when WHICH tab is checked changes. The observer below fires on any class of
   * the subtree, and Ionic marks every press with one (`ion-activated`, instant on
   * `ion-segment-button`) and the strip's own drag adds another (`ok-tabbar-dragging`): revealing
   * there yanks the bar back to the checked tab right after the person panned it away, before the
   * tap even lands -- measured on the bench, `mousedown` on «General» with «Datos y copias»
   * checked moved the bar from 0 to 82 before `mouseup`. So the last revealed tab is remembered
   * and the reveal runs again only for a different one (or on mount, or when the tabs load later).
   */
  let revealed: Element | null = null;
  const revealActive = (): void => {
    const active = segment.querySelector('.segment-button-checked');
    if (active !== revealed) {
      revealed = active;
      scrollActiveTabIntoView(segment);
    }
    sync();
  };

  revealActive();

  segment.addEventListener('scroll', sync, { passive: true });

  const desatarArrastre = bindDrag(segment);

  const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(sync) : null;
  ro?.observe(segment);
  // `attributeFilter: ['class']` is not cosmetic: without the filter, the `data-overflow` that
  // `sync` writes would fire this observer on itself. With it only classes get in, which is where
  // Ionic moves `segment-button-checked`; the other classes Ionic toggles (`ion-activated`...) do
  // reach the callback, and `revealActive` is what keeps them from moving the bar.
  const mo = typeof MutationObserver !== 'undefined' ? new MutationObserver(revealActive) : null;
  mo?.observe(segment, { childList: true, subtree: true, attributeFilter: ['class'] });

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
    desatarArrastre();
    ro?.disconnect();
    mo?.disconnect();
    if (pista) clearTimeout(pista);
  };
}
