import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { iconChevronBackOutline, iconChevronForwardOutline } from '../../base/icons.js';

// Recurso (fila del timeline): un empleado, sala, máquina, etc.
// Lo aporta el consumidor vía la prop `.resources`.
export interface OkSchedulerResource {
  /** Identificador único del recurso (clave para asociar eventos). */
  id: string;
  /** Texto visible del recurso (columna izquierda sticky). */
  label: string;
  /** URL opcional de avatar/imagen mostrada antes del label. */
  avatar?: string;
}

// Evento/turno posicionado sobre la franja horaria de un recurso.
// Lo aporta el consumidor vía la prop `.events`.
export interface OkSchedulerEvent {
  /** Identificador único del evento. */
  id: string;
  /** Id del recurso (fila) al que pertenece el evento. */
  resourceId: string;
  /** Hora de inicio: ISO (`...THH:MM`) o `HH:MM`. Se usa solo la hora local. */
  start: string;
  /** Hora de fin: ISO o `HH:MM`. */
  end: string;
  /** Texto visible dentro del bloque. */
  title: string;
  /** Color del bloque; cadena CSS (hex, var, etc.). Por defecto, el primario. */
  color?: string;
}

// Textos humanos del scheduler (i18n). Default INGLÉS; el consumidor sobreescribe claves
// sueltas vía la prop `labels`.
export interface OkSchedulerLabels {
  /** aria-label del botón "día anterior". */
  prevDay: string;
  /** aria-label del botón "día siguiente". */
  nextDay: string;
  /** Texto cuando no hay recursos que mostrar. */
  empty: string;
}

const DEFAULT_LABELS: OkSchedulerLabels = {
  prevDay: 'Previous day',
  nextDay: 'Next day',
  empty: 'No resources to display.',
};

// Where a block sits right now: its lane and its minutes-from-midnight span.
interface Placement {
  resourceId: string;
  startMin: number;
  endMin: number;
}

// The move the host is being asked to accept (also drives the optimistic paint).
interface PendingMove extends Placement {
  id: string;
}

/** Qué está haciendo el gesto en curso: llevar el bloque a otra hora/recurso, o cambiar su fin. */
type GestureMode = 'move' | 'resize';

// Live gesture. `active` flips only once the pointer travelled past the threshold, so a tap on a
// block still reaches `ok-event-click` (the accessible route the module already wires).
interface PointerDragState {
  mode: GestureMode;
  pointerId: number;
  startX: number;
  startY: number;
  active: boolean;
  /** Touch only: the hold completed, so the block is now armed for dragging. */
  held: boolean;
  holdTimer: ReturnType<typeof setTimeout> | null;
  captureTarget: HTMLElement;
  laneWidth: number;
  id: string;
  from: Placement;
}

/** Detail of `ok-event-move`. `revert()` is how the host says «the server said no». */
export interface OkSchedulerMoveDetail {
  /** Id of the moved event. */
  id: string;
  /** Resource the block was dropped on (may be the same one). */
  resourceId: string;
  /** New start, `HH:MM` local wall clock — same shape as `ok-slot-click`. */
  start: string;
  /** New end, `HH:MM`. The duration is preserved; the grid never resizes an event. */
  end: string;
  /** Where the block came from, so the host can build an undo. */
  from: { resourceId: string; start: string; end: string };
  /** The original event object, untouched. */
  event: OkSchedulerEvent;
  /** Puts the block back where it was. Call it when the command is rejected. */
  revert: () => void;
}

/**
 * Detail de `ok-event-resize`. Hermano de `ok-event-move`, y a PROPÓSITO otro evento: mover cambia
 * la hora y redimensionar cambia la DURACIÓN, que en una agenda suele venir del servicio. El
 * módulo manda un command distinto (su `reschedule` lleva `duration_minutes`, no un `end`) y
 * necesita saber cuál de los dos gestos fue.
 */
export interface OkSchedulerResizeDetail {
  /** Id del evento redimensionado. */
  id: string;
  /** Inicio, `HH:MM`. NO cambia al redimensionar: el asa es la del final. */
  start: string;
  /** Nuevo fin, `HH:MM`. */
  end: string;
  /** De dónde venía, para que el host pueda construir un deshacer. */
  from: { start: string; end: string };
  /** El objeto de evento original, intacto. */
  event: OkSchedulerEvent;
  /** Devuelve el bloque a su duración anterior. Llámalo si el command se rechaza. */
  revert: () => void;
}

// El ratón es preciso: 5 px bastan para separar un click de un arrastre.
const DRAG_THRESHOLD_PX = 5;
// EL DEDO NO. En táctil el arrastre se ARMA manteniendo pulsado, no moviendo: el fallo mejor
// documentado de las agendas del sector es el arrastre accidental en tablet —un scroll o un toque
// mueve la cita de una clienta, nadie se entera y no queda rastro de la hora original—, y los
// productos que se estrellaron con él pusieron delante una pulsación mantenida (Vagaro) o un asa
// dedicada (Mindbody Booker). Ver la tabla de mercado en outfitkit#63.
const TOUCH_HOLD_MS = 400;
// Si el dedo se va antes de completar la pulsación, ese gesto era un scroll: se abandona.
const TOUCH_HOLD_TOLERANCE_PX = 10;

// Aire entre dos bloques apilados: sin él, dos colores contiguos parecen un solo bloque partido.
const STACK_GAP_PX = 2;

/** Sub-carril que ocupa un bloque dentro de su clúster de solapes, y en cuántos se partió. */
interface StackSlot {
  index: number;
  count: number;
}

// ok-scheduler — agenda de recursos/turnos en TIMELINE, algo que Ionic NO ofrece. Por DATOS
// (`resources` + `events`). AUTOCONTENIDO: CSS propio en el shadow, sin librerías de fechas (solo
// `Date` nativo → CSP-safe). Usa `ion-icon`/`ion-button` internos (los registra el host).
//   • prop `.resources` → Array<OkSchedulerResource> (filas)
//   • prop `.events`    → Array<OkSchedulerEvent> (bloques posicionados por hora)
//   • prop `date`       → día mostrado (`YYYY-MM-DD`)
//   • prop `start-hour` → primera hora visible (def 8)
//   • prop `end-hour`   → última hora visible (def 20)
//   • prop `slot`       → minutos por celda/columna (def 60)
// Layout: cabecera con la franja horaria + navegación de día (‹ fecha ›); una FILA por recurso con
// su label sticky a la izquierda; los eventos se posicionan por hora (left/width). Scroll horizontal
// si la franja es ancha; la columna de recurso queda fija (sticky).
// Eventos (bubbles + composed):
//   • `ok-event-click`  detail { id, event }
//   • `ok-slot-click`   detail { resourceId, time }   (time = `HH:MM`)
//   • `ok-nav`          detail { date }                (`YYYY-MM-DD`, al cambiar de día)
//   • `ok-event-move`   detail OkSchedulerMoveDetail   (solo con `movable`)
//   • `ok-event-resize` detail OkSchedulerResizeDetail (solo con `resizable`)
//
// MOVER UN BLOQUE (`movable`): arrastrarlo por la rejilla es el gesto estándar de las agendas del
// sector. Se implementa con POINTER EVENTS —ratón, lápiz y DEDO con el mismo código—, nunca con la
// API HTML5 de drag & drop, que no emite un solo evento en táctil (la trampa de #55) y dejaría el
// gesto muerto en la tablet, que es el dispositivo de primera clase del TPV.
//
// EL HOST DECIDE. La rejilla no da el movimiento por bueno: pinta el bloque en su destino
// (optimista, para que el gesto no se sienta congelado) y emite `ok-event-move`. El módulo manda su
// command; si el servidor lo rechaza —un solape, un profesional que no presta ese servicio— llama a
// `detail.revert()` y el bloque vuelve a su sitio. Cuando el host refresca `events`, la posición
// optimista se descarta y manda el dato del servidor.
//
// El arrastre es un ATAJO, no la única vía: el bloque es un botón enfocable (Enter/Espacio abre el
// panel del módulo) y las flechas lo mueven en el tiempo (←/→) y de recurso (↑/↓).
//
// REDIMENSIONAR (`resizable`): arrastrar el BORDE DE FIN alarga o acorta la cita. Es lo que hacen
// Fresha, Phorest, Outlook, DaySmart, Google Calendar y Odoo Planning (Mindbody, Square y D365 no
// lo tienen); en sus agendas el día es vertical y ese borde es el inferior — aquí el timeline es
// HORIZONTAL, así que el mismo borde, el del final, es el derecho.
//
// EL ASA GANA SOBRE EL CUERPO. Las dos superficies viven en el mismo bloque y comparten el
// `pointerdown`: sin una precedencia explícita, un gesto se come al otro. Mindbody Booker acabó
// sacando el arrastre del cuerpo del bloque justo por esto. Aquí el asa detiene la propagación de
// su propio `pointerdown`, así que el cuerpo nunca ve el gesto que empieza en ella, y sigue
// moviendo en todo lo demás.
//
// Y en el asa NO hay pulsación mantenida: la barrera táctil del movimiento existe porque el cuerpo
// del bloque es enorme y un scroll lo rozaba sin querer. Un asa de ~1 rem es un objetivo
// DELIBERADO —esa es su razón de ser— y pedir 400 ms encima solo haría el gesto lento. Lo que sí
// se exige es el umbral de 5 px, para que un toque siga siendo un toque.
export class OkScheduler extends LitElement {
  static styles = css`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex */
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --color-muted: var(--ok-text-muted, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.55));
      --background: var(--ok-surface, var(--ion-background-color, #ffffff));
      --primary-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --primary-contrast: var(--ok-primary-contrast, var(--ion-color-primary-contrast, #ffffff));
      --hover-bg: var(--ok-hover, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.06));
      --border-color: var(--ok-border-soft, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.12));
      --border-radius: var(--ok-radius, 8px);
      --resource-width: var(--ok-scheduler-resource-width, 11rem);
      --hour-width: var(--ok-scheduler-hour-width, 6rem);
      --row-height: var(--ok-scheduler-row-height, 3.5rem);
      /* Alto mínimo de un sub-carril de solape. NO hay tope de citas simultáneas: se reparte
         mientras cada bloque quepa en una línea legible y, por debajo de eso, la FILA CRECE. Es el
         minPackSize de Bryntum y el default de Mobiscroll en timeline horizontal — el parámetro
         correcto es el alto, no un número: una cita de 15 min partida en tres es ilegible aunque
         «tres» suene poco. */
      --min-stack-height: var(--ok-scheduler-min-stack-height, 1.6rem);
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      /* Por defecto ocupa el ancho del contenedor y es responsive. */
      display: block;
      width: 100%;
      color: var(--color);
      font-family: var(--font);
      font-size: 0.95rem;
      box-sizing: border-box;
    }
    * {
      box-sizing: border-box;
    }

    /* ── Cabecera de navegación de día ──────────────────────────── */
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      margin-bottom: 0.6rem;
    }
    .toolbar .title {
      min-width: 12rem;
      text-align: center;
      font-weight: 600;
      font-size: 1.05rem;
      text-transform: capitalize;
    }

    /* ── Contenedor con scroll horizontal ───────────────────────── */
    .scroll {
      width: 100%;
      overflow-x: auto;
      overflow-y: hidden;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      -webkit-overflow-scrolling: touch;
    }
    /* El grid interior tiene ancho intrínseco = columna recurso + franja horaria. */
    .grid {
      display: inline-block;
      min-width: 100%;
    }

    /* ── Cabecera horaria ───────────────────────────────────────── */
    .head-row {
      display: flex;
      position: sticky;
      top: 0;
      z-index: 3;
    }
    .corner {
      flex: 0 0 var(--resource-width);
      width: var(--resource-width);
      position: sticky;
      left: 0;
      z-index: 4;
      background: var(--background);
      border-right: 1px solid var(--border-color);
      border-bottom: 1px solid var(--border-color);
    }
    .timeline {
      display: flex;
      flex: 1 1 auto;
    }
    .hour {
      flex: 0 0 var(--hour-width);
      width: var(--hour-width);
      padding: 0.4rem 0.5rem;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--color-muted);
      text-align: left;
      background: var(--background);
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      font-variant-numeric: tabular-nums;
    }
    .hour:last-child {
      border-right: 0;
    }

    /* ── Filas de recurso ───────────────────────────────────────── */
    .row {
      display: flex;
      border-top: 1px solid var(--border-color);
    }
    .row:first-of-type {
      border-top: 0;
    }
    .resource {
      flex: 0 0 var(--resource-width);
      width: var(--resource-width);
      min-height: var(--row-height);
      position: sticky;
      left: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.6rem;
      background: var(--background);
      border-right: 1px solid var(--border-color);
    }
    .avatar {
      flex: 0 0 auto;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      object-fit: cover;
      background: var(--hover-bg);
    }
    .avatar-fallback {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      border-radius: 999px;
      background: var(--hover-bg);
      color: var(--color-muted);
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .resource-label {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    /* ── Pista de eventos (lane) de un recurso ──────────────────── */
    .lane {
      position: relative;
      flex: 1 1 auto;
      /* Con un solo ocupante la fila es la de siempre. En cuanto los sub-carriles no caben con su
         alto mínimo, la fila CRECE en vez de adelgazar los bloques: aquí el timeline es horizontal,
         así que el alto de la fila es un recurso ABIERTO —crecer una fila no le quita nada a las
         demás— al revés que el ancho de columna de una agenda de día vertical. */
      min-height: max(var(--row-height), calc(var(--stacks, 1) * var(--min-stack-height)));
      background: var(--background);
    }
    /* Celdas-slot clicables de fondo (para crear turnos). */
    .slot {
      position: absolute;
      top: 0;
      bottom: 0;
      border-right: 1px solid var(--border-color);
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    @media (hover: hover) {
      .slot:hover {
        background: var(--hover-bg);
      }
    }
    .slot:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .slot:last-child {
      border-right: 0;
    }

    /* ── Bloque de evento ───────────────────────────────────────── */
    .event {
      position: absolute;
      top: 0.25rem;
      bottom: 0.25rem;
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding: 0.2rem 0.45rem;
      border-radius: 6px;
      color: var(--primary-contrast);
      cursor: pointer;
      overflow: hidden;
      z-index: 1;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease, filter 0.12s ease;
    }
    @media (hover: hover) {
      .event:hover {
        filter: brightness(1.05);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.22);
      }
    }
    .event:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    /* Solo cuando el host activa movable: el bloque es una superficie de arrastre.
       NO se pone touch-action:none — el dedo tiene que poder hacer scroll de la rejilla desde
       encima del bloque. El arrastre táctil se arma con la pulsación mantenida y a partir de ahí
       el scroll se corta a mano (preventDefault del touchmove). */
    .event.movable {
      cursor: grab;
    }
    /* Pulsación mantenida completada: el bloque "se levanta" y avisa de que ya está cogido. */
    .event.held {
      transform: scale(1.03);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }
    .event.dragging {
      cursor: grabbing;
      z-index: 5;
      opacity: 0.92;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32);
      /* Deja pasar el hit-test al carril de debajo para saber sobre qué recurso está. */
      pointer-events: none;
      transition: none;
    }
    .event.resizing {
      z-index: 5;
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.32);
      transition: none;
    }
    .event:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }
    /* Asa del borde de FIN. Una franja estrecha con su propio cursor, para que se vea que ahí el
       gesto es otro. En puntero grueso (dedo) se ensancha: 0.85 rem son ~14 px, y un dedo no
       acierta en 14 px. No se llega a 44 px a propósito — el asa se come el bloque entero en una
       cita de 15 min y ya no se podría ni mover ni abrir. */
    .resize-handle {
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      width: var(--resize-handle-width, 0.85rem);
      cursor: col-resize;
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      background: linear-gradient(to right, transparent, rgba(0, 0, 0, 0.22));
      touch-action: none;
    }
    /* La marquita del centro: sin ella el asa es invisible y nadie sabe que se puede arrastrar. */
    .resize-handle::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 0.28rem;
      width: 2px;
      height: 0.9rem;
      transform: translateY(-50%);
      border-radius: 1px;
      background: var(--primary-contrast);
      opacity: 0.75;
    }
    @media (pointer: coarse) {
      .resize-handle {
        width: var(--resize-handle-width, 1.35rem);
      }
    }
    /* Hueco de origen: dice de dónde salió el bloque mientras está en el aire. */
    .ghost {
      position: absolute;
      top: 0.25rem;
      bottom: 0.25rem;
      border-radius: 6px;
      border: 2px dashed var(--border-color);
      background: var(--hover-bg);
      pointer-events: none;
      z-index: 0;
    }
    /* Anuncio para lector de pantalla del movimiento por teclado. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
      border: 0;
    }
    .event-title {
      font-size: 0.78rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .event-time {
      font-size: 0.68rem;
      opacity: 0.9;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    /* ── Estado vacío ───────────────────────────────────────────── */
    .empty {
      padding: 1.5rem;
      text-align: center;
      color: var(--color-muted);
    }

    @media (prefers-reduced-motion: reduce) {
      .slot:active,
      .event:active,
      .event.held {
        transform: none;
      }
    }

    /* ── Responsive (móvil): franja más estrecha, recurso visible ── */
    @media (max-width: 540px) {
      :host {
        --resource-width: 7rem;
        --hour-width: 3.5rem;
      }
      .hour {
        font-size: 0.7rem;
        padding: 0.35rem 0.3rem;
      }
      .avatar,
      .avatar-fallback {
        width: 1.6rem;
        height: 1.6rem;
        font-size: 0.7rem;
      }
      .event-time {
        display: none;
      }
    }
  `;

  /** Recursos (filas); el consumidor los pasa por propiedad. */
  @property({ attribute: false }) resources: OkSchedulerResource[] = [];
  /** Eventos/turnos; el consumidor los pasa por propiedad. */
  @property({ attribute: false }) events: OkSchedulerEvent[] = [];
  /** Día mostrado (`YYYY-MM-DD`). Vacío = hoy. */
  @property() date = '';
  /** Primera hora visible de la franja (0–23). */
  @property({ type: Number, attribute: 'start-hour' }) startHour = 8;
  /** Última hora visible de la franja (1–24). */
  @property({ type: Number, attribute: 'end-hour' }) endHour = 20;
  /** Minutos por celda/columna. (attr `slot-minutes`: `slot` colisiona con HTMLElement.slot.) */
  @property({ type: Number, attribute: 'slot-minutes' }) slotMin = 60;
  /** Locale BCP-47 para formatear la fecha del día (Intl). Default 'en-US'. */
  @property() locale = 'en-US';
  /** Textos humanos sobreescribibles (i18n). Default INGLÉS. */
  @property({ attribute: false }) labels: Partial<OkSchedulerLabels> = {};
  /**
   * Permite mover los bloques (arrastre + teclado) emitiendo `ok-event-move`.
   * OPT-IN: sin un host que escuche y persista el movimiento, mover sería mentir.
   */
  @property({ type: Boolean, reflect: true }) movable = false;
  /**
   * Permite alargar/acortar los bloques por su borde de fin (asa + teclado) emitiendo
   * `ok-event-resize`. OPT-IN e INDEPENDIENTE de `movable`: la duración de una cita suele venir
   * del servicio, así que hay agendas donde mover está bien y redimensionar a mano no.
   */
  @property({ type: Boolean, reflect: true }) resizable = false;
  /**
   * Rejilla imantada del movimiento, en minutos. 15 es el intervalo de reserva estándar de una
   * agenda; `slot-minutes` solo dibuja las columnas y suele ser mucho más grueso (una hora).
   */
  @property({ type: Number, attribute: 'snap-minutes' }) snapMin = 15;

  /** Textos efectivos: defaults INGLÉS mezclados con los del consumidor. */
  private get t(): OkSchedulerLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  // Cursor de día (estado interno de navegación). Se siembra desde `date` una sola vez.
  @state() private cursor = new Date();
  private seeded = false;

  // Gesto en curso: pinta el bloque bajo el dedo antes de soltar.
  @state() private drag: (PendingMove & { from: Placement }) | null = null;
  // Movimiento ya soltado y todavía sin confirmar por el host (pintado optimista).
  @state() private pending: PendingMove | null = null;
  // Texto para el lector de pantalla tras un movimiento por teclado.
  @state() private announcement = '';
  // Bloque con la pulsación mantenida ya completada (táctil), para pintarlo levantado.
  @state() private heldId: string | null = null;
  // Candidato de Pointer Events; `active` solo se enciende al pasar el umbral (o al armarse).
  private pointerDrag: PointerDragState | null = null;
  // El navegador emite un click después de pointerup: no debe abrir el bloque recién movido.
  private suppressClick = false;
  private suppressClickTimer: ReturnType<typeof setTimeout> | null = null;

  // El refresco del host manda: descarta la posición optimista en cuanto llegan eventos nuevos.
  protected willUpdate(changed: Map<string, unknown>): void {
    if (changed.has('events')) this.pending = null;
  }

  // ── Helpers de fecha ──────────────────────────────────────────

  // Convierte una `Date` a clave local `YYYY-MM-DD`.
  private dayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Parsea `YYYY-MM-DD` (parte de fecha) a `Date` local; fallback defensivo a hoy.
  private parseDay(s: string): Date {
    const [y, m, d] = s.slice(0, 10).split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    return new Date();
  }

  // Extrae los minutos desde medianoche de una hora `HH:MM` o ISO (`...THH:MM`).
  private minutesOf(time: string): number {
    // Si es ISO con 'T', tomamos la parte de hora; si es `HH:MM`, la usamos tal cual.
    const t = time.includes('T') ? time.split('T')[1] : time;
    const [h, m] = (t || '').split(':').map(Number);
    if (Number.isFinite(h)) return h * 60 + (Number.isFinite(m) ? m : 0);
    return 0;
  }

  // Formatea minutos-desde-medianoche a `HH:MM`.
  private fmtTime(mins: number): string {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  // ── Geometría de la franja ────────────────────────────────────

  // Rango total de la franja en minutos (defensivo: end > start).
  private get rangeMinutes(): number {
    const span = (this.endHour - this.startHour) * 60;
    return span > 0 ? span : 60;
  }

  // Número de celdas-slot de fondo según `slot`.
  private get slotCount(): number {
    const step = this.slotMin > 0 ? this.slotMin : 60;
    return Math.max(1, Math.ceil(this.rangeMinutes / step));
  }

  // ── Navegación / eventos ──────────────────────────────────────

  // Cambia el día visible (delta en días) y emite `ok-nav`.
  private navDay(delta: number): void {
    const next = new Date(
      this.cursor.getFullYear(),
      this.cursor.getMonth(),
      this.cursor.getDate() + delta,
    );
    this.cursor = next;
    this.dispatchEvent(
      new CustomEvent('ok-nav', {
        detail: { date: this.dayKey(next) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Emite el click sobre un evento (sin propagar al slot de fondo).
  private clickEvent(ev: OkSchedulerEvent, e: Event): void {
    e.stopPropagation();
    // Tras arrastrar, el navegador dispara un click: abriría el panel de la cita recién movida.
    if (this.suppressClick) return;
    this.dispatchEvent(
      new CustomEvent('ok-event-click', {
        detail: { id: ev.id, event: ev },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Emite el click sobre una celda-slot vacía de un recurso.
  private clickSlot(resourceId: string, mins: number): void {
    this.dispatchEvent(
      new CustomEvent('ok-slot-click', {
        detail: { resourceId, time: this.fmtTime(mins) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // ── Mover un bloque ───────────────────────────────────────────

  // Primer y último minuto pintables de la franja.
  private get dayStartMin(): number {
    return this.startHour * 60;
  }

  // Dónde está un bloque AHORA: el gesto en curso y el movimiento sin confirmar mandan sobre la
  // prop, para que el bloque no vuelva a saltar a su sitio viejo entre el drop y el refresco.
  private placement(ev: OkSchedulerEvent): Placement {
    if (this.drag?.id === ev.id) return this.drag;
    if (this.pending?.id === ev.id) return this.pending;
    return {
      resourceId: ev.resourceId,
      startMin: this.minutesOf(ev.start),
      endMin: this.minutesOf(ev.end),
    };
  }

  // ── Reparto de los solapes (side-by-side por clúster) ─────────
  //
  // Dos citas a la misma hora en el mismo carril NO pueden pintarse una encima de otra: en pantalla
  // solo existiría la de arriba, justo cuando hay que ver que hay dos personas citadas
  // (outfitkit#71). El reparto es el algoritmo clásico de las agendas —el de Google Calendar,
  // Outlook, Fresha, Vagaro, Square—: se agrupan las citas por solape TRANSITIVO (un clúster) y el
  // clúster se parte en tantos sub-carriles como haga falta.
  //
  // El detalle que hace que la agenda no se adelgace entera: cada bloque cae en el PRIMER sub-carril
  // ya libre, así que dos citas que no se pisan entre sí lo reutilizan. Una cadena A→B→C donde A y C
  // no se tocan ocupa DOS sub-carriles, no tres. Y un clúster no afecta a otro: la mañana llena no
  // parte la tarde vacía.
  //
  // Aquí el timeline es HORIZONTAL (el eje X es el tiempo), así que lo que se reparte es el ALTO de
  // la fila, no el ancho como en las agendas de día vertical.
  private packLane(items: Array<{ id: string; at: Placement }>): Map<string, StackSlot> {
    const slots = new Map<string, StackSlot>();
    // Inicio ascendente; a igualdad, el fin MÁS TEMPRANO primero; y el id decide el último
    // desempate para que el reparto sea ESTABLE (si no, dos citas idénticas bailarían de sub-carril
    // en cada render). Es el orden en el que coinciden Bryntum, Google Calendar y Mobiscroll, y el
    // que el reparto greedy necesita para ser correcto.
    const sorted = [...items].sort(
      (a, b) =>
        a.at.startMin - b.at.startMin ||
        a.at.endMin - b.at.endMin ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
    );

    let cluster: string[] = [];
    // Último minuto ya pintado en cada sub-carril.
    let laneEnds: number[] = [];
    let clusterEnd = -Infinity;

    // Un clúster se cierra cuando aparece un hueco: solo entonces se sabe en cuántos se partió, y
    // cada uno de sus bloques comparte ese reparto (si no, dos citas del mismo solape tendrían
    // altos distintos y no cuadrarían).
    const closeCluster = (): void => {
      const count = Math.max(1, laneEnds.length);
      for (const id of cluster) slots.get(id)!.count = count;
      cluster = [];
      laneEnds = [];
      clusterEnd = -Infinity;
    };

    for (const item of sorted) {
      // Empieza cuando lo anterior ya terminó: hueco → el clúster de antes se cierra.
      if (item.at.startMin >= clusterEnd) closeCluster();
      // El primer sub-carril cuyo último bloque ya acabó; si están ocupados los que hay, se abre otro.
      let index = laneEnds.findIndex((end) => end <= item.at.startMin);
      if (index === -1) {
        index = laneEnds.length;
        laneEnds.push(item.at.endMin);
      } else {
        laneEnds[index] = item.at.endMin;
      }
      slots.set(item.id, { index, count: 1 });
      cluster.push(item.id);
      clusterEnd = Math.max(clusterEnd, item.at.endMin);
    }
    closeCluster();
    return slots;
  }

  // Geometría vertical de un bloque según su sub-carril. Con un solo ocupante no se toca nada: el
  // bloque sigue ocupando el alto entero del carril, exactamente como antes.
  private stackStyle(slot: StackSlot): string {
    if (slot.count <= 1) return '';
    return (
      `top:calc(0.25rem + (100% - 0.5rem) * ${slot.index} / ${slot.count});` +
      `height:calc((100% - 0.5rem) / ${slot.count} - ${STACK_GAP_PX}px);bottom:auto;`
    );
  }

  // Imanta el inicio a la rejilla y garantiza que el bloque entero cabe en la franja visible.
  private snapStart(startMin: number, durationMin: number): number {
    const step = this.snapMin > 0 ? this.snapMin : 1;
    const snapped = Math.round(startMin / step) * step;
    const last = this.dayStartMin + this.rangeMinutes - durationMin;
    return Math.min(Math.max(snapped, this.dayStartMin), Math.max(this.dayStartMin, last));
  }

  // Imanta el FIN a la rejilla: nunca por debajo de un `snap` de duración ni más allá de la franja.
  private snapEnd(endMin: number, startMin: number): number {
    const step = this.snapMin > 0 ? this.snapMin : 1;
    const snapped = Math.round(endMin / step) * step;
    const last = this.dayStartMin + this.rangeMinutes;
    return Math.min(Math.max(snapped, startMin + step), last);
  }

  // Único sitio donde nace un redimensionado (asa y teclado). Mismo contrato que el movimiento:
  // se pinta optimista y MANDA EL HOST; si el servidor lo rechaza, `revert()`.
  private requestResize(ev: OkSchedulerEvent, from: Placement, endMin: number): void {
    if (endMin === from.endMin) return;
    const resized: PendingMove = { id: ev.id, ...from, endMin };
    this.pending = resized;
    const detail: OkSchedulerResizeDetail = {
      id: ev.id,
      start: this.fmtTime(from.startMin),
      end: this.fmtTime(endMin),
      from: { start: this.fmtTime(from.startMin), end: this.fmtTime(from.endMin) },
      event: ev,
      // Se comprueba la identidad para no deshacer el cambio SIGUIENTE si el revert llega tarde.
      revert: () => {
        if (this.pending === resized) this.pending = null;
      },
    };
    this.dispatchEvent(
      new CustomEvent<OkSchedulerResizeDetail>('ok-event-resize', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Único sitio donde nace un movimiento (arrastre y teclado). Pinta optimista y pregunta al host.
  private requestMove(ev: OkSchedulerEvent, from: Placement, to: Placement): void {
    if (to.resourceId === from.resourceId && to.startMin === from.startMin) return;
    const move: PendingMove = { id: ev.id, ...to };
    this.pending = move;
    const detail: OkSchedulerMoveDetail = {
      id: ev.id,
      resourceId: to.resourceId,
      start: this.fmtTime(to.startMin),
      end: this.fmtTime(to.endMin),
      from: {
        resourceId: from.resourceId,
        start: this.fmtTime(from.startMin),
        end: this.fmtTime(from.endMin),
      },
      event: ev,
      // Rechazo del host: el bloque vuelve. Se comprueba la identidad para no deshacer el
      // movimiento SIGUIENTE si el revert llega tarde.
      revert: () => {
        if (this.pending === move) this.pending = null;
      },
    };
    this.dispatchEvent(
      new CustomEvent<OkSchedulerMoveDetail>('ok-event-move', {
        detail,
        bubbles: true,
        composed: true,
      }),
    );
  }

  private capturePointer(target: HTMLElement, pointerId: number): void {
    try {
      target.setPointerCapture?.(pointerId);
    } catch {
      // Algunos DOM de test y WebViews antiguas exponen la API pero rechazan la captura.
    }
  }

  private releasePointer(state: PointerDragState): void {
    try {
      if (state.captureTarget.hasPointerCapture?.(state.pointerId)) {
        state.captureTarget.releasePointerCapture?.(state.pointerId);
      }
    } catch {
      // La captura se pierde sola al cancelar el gesto o desmontar el componente.
    }
  }

  private startGesture(e: PointerEvent, ev: OkSchedulerEvent, mode: GestureMode): void {
    if (this.pointerDrag || e.button !== 0) return;
    if (mode === 'move' ? !this.movable : !this.resizable) return;
    const captureTarget = e.currentTarget as HTMLElement;
    const lane = captureTarget.closest<HTMLElement>('.lane');
    const laneWidth = lane?.getBoundingClientRect().width ?? 0;
    if (laneWidth <= 0) return; // sin layout no hay aritmética posible
    const state: PointerDragState = {
      mode,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      // Con ratón o lápiz el gesto ya está armado: el umbral en píxeles basta. En el ASA tampoco
      // hay pulsación mantenida ni con el dedo — el asa YA es el objetivo deliberado.
      held: mode === 'resize' || e.pointerType !== 'touch',
      holdTimer: null,
      captureTarget,
      laneWidth,
      id: ev.id,
      from: this.placement(ev),
    };
    if (!state.held) {
      state.holdTimer = setTimeout(() => {
        state.held = true;
        state.holdTimer = null;
        this.heldId = state.id;
      }, TOUCH_HOLD_MS);
    }
    this.pointerDrag = state;
    this.capturePointer(captureTarget, e.pointerId);
  }

  private onEventPointerDown(e: PointerEvent, ev: OkSchedulerEvent): void {
    this.startGesture(e, ev, 'move');
  }

  // El asa gana sobre el cuerpo: se para la propagación para que el `pointerdown` del bloque no
  // llegue a ver este gesto. Sin esto los dos arrancarían con el mismo evento.
  private onHandlePointerDown(e: PointerEvent, ev: OkSchedulerEvent): void {
    e.stopPropagation();
    this.startGesture(e, ev, 'resize');
  }

  // Suelta el candidato y apaga su temporizador (una sola puerta de salida del gesto).
  private endGesture(state: PointerDragState): void {
    if (state.holdTimer) clearTimeout(state.holdTimer);
    this.releasePointer(state);
    this.pointerDrag = null;
    this.heldId = null;
  }

  /** Elemento real bajo el puntero capturado, dentro del shadow root. */
  private elementFromPoint(x: number, y: number): Element | null {
    const root = this.renderRoot as ShadowRoot & {
      elementFromPoint?: (clientX: number, clientY: number) => Element | null;
    };
    return root.elementFromPoint?.(x, y) ?? null;
  }

  // Cuántos minutos ha recorrido el puntero desde que empezó el gesto.
  private travelledMinutes(e: PointerEvent, state: PointerDragState): number {
    return ((e.clientX - state.startX) / state.laneWidth) * this.rangeMinutes;
  }

  // Traduce las coordenadas del puntero a «qué carril y qué hora», imantado a la rejilla.
  private dropTarget(e: PointerEvent, state: PointerDragState): Placement {
    const duration = state.from.endMin - state.from.startMin;
    const startMin = this.snapStart(state.from.startMin + this.travelledMinutes(e, state), duration);
    const hit = this.elementFromPoint(e.clientX, e.clientY);
    const lane = hit?.closest<HTMLElement>('.lane[data-resource-id]') ?? null;
    const resourceId = lane?.dataset.resourceId ?? state.from.resourceId;
    return { resourceId, startMin, endMin: startMin + duration };
  }

  // Redimensionar solo mueve el FIN: ni la hora de inicio ni el recurso cambian.
  private resizeTarget(e: PointerEvent, state: PointerDragState): Placement {
    const endMin = this.snapEnd(state.from.endMin + this.travelledMinutes(e, state), state.from.startMin);
    return { ...state.from, endMin };
  }

  // Dónde quedaría el bloque si se soltara aquí, según el gesto en curso.
  private gestureTarget(e: PointerEvent, state: PointerDragState): Placement {
    return state.mode === 'resize' ? this.resizeTarget(e, state) : this.dropTarget(e, state);
  }

  private onPointerMove(e: PointerEvent): void {
    const state = this.pointerDrag;
    if (!state || state.pointerId !== e.pointerId) return;
    const travelled = Math.hypot(e.clientX - state.startX, e.clientY - state.startY);

    if (!state.held) {
      // El dedo se movió antes de completar la pulsación: era un scroll, no un arrastre.
      if (travelled >= TOUCH_HOLD_TOLERANCE_PX) this.endGesture(state);
      return;
    }
    // Ya armado: con ratón hace falta el umbral; con el dedo, la pulsación YA fue la intención.
    // En el asa el umbral se exige SIEMPRE (también con el dedo): sin él, un toque en el asa
    // redimensionaría, y un toque tiene que seguir siendo un toque.
    if (!state.active) {
      const needsThreshold = state.mode === 'resize' || e.pointerType !== 'touch';
      if (needsThreshold && travelled < DRAG_THRESHOLD_PX) return;
      state.active = true;
    }

    e.preventDefault();
    this.drag = { id: state.id, from: state.from, ...this.gestureTarget(e, state) };
  }

  // El scroll del navegador se corta A MANO en cuanto el gesto está armado: el bloque NO lleva
  // `touch-action:none`, para que un dedo que solo quiere desplazar la rejilla pueda hacerlo
  // aunque empiece encima de una cita. Listener no pasivo (si no, preventDefault se ignora).
  private readonly blockScrollWhileDragging = (e: TouchEvent): void => {
    if (this.pointerDrag?.held) e.preventDefault();
  };

  connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener('touchmove', this.blockScrollWhileDragging, { passive: false });
  }

  private suppressNextEventClick(): void {
    this.suppressClick = true;
    if (this.suppressClickTimer) clearTimeout(this.suppressClickTimer);
    this.suppressClickTimer = setTimeout(() => {
      this.suppressClick = false;
      this.suppressClickTimer = null;
    }, 0);
  }

  private onPointerUp(e: PointerEvent): void {
    const state = this.pointerDrag;
    if (!state || state.pointerId !== e.pointerId) return;
    this.endGesture(state);
    if (!state.active) return;

    e.preventDefault();
    const to = this.gestureTarget(e, state);
    this.drag = null;
    this.suppressNextEventClick();
    const ev = this.events.find((candidate) => candidate.id === state.id);
    if (!ev) return;
    if (state.mode === 'resize') this.requestResize(ev, state.from, to.endMin);
    else this.requestMove(ev, state.from, to);
  }

  private onPointerCancel(e: PointerEvent): void {
    const state = this.pointerDrag;
    if (!state || state.pointerId !== e.pointerId) return;
    this.endGesture(state);
    this.drag = null;
  }

  // Teclado: el arrastre es un atajo, no la única vía (tables#16 hace esto mismo en el plano de
  // sala). Enter/Espacio abre el panel del módulo; las flechas mueven.
  private onEventKeyDown(e: KeyboardEvent, ev: OkSchedulerEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.clickEvent(ev, e);
      return;
    }
    const horizontal = e.key === 'ArrowRight' || e.key === 'ArrowLeft';
    const snap = this.snapMin > 0 ? this.snapMin : 1;

    // Shift+←/→ cambia la DURACIÓN. Con `resizable` apagado Shift conserva su significado de
    // antes —un paso de movimiento más grueso—, así que a un host que no pidió redimensionar no
    // le cambia nada (outfitkit#64 → #65).
    if (this.resizable && horizontal && e.shiftKey) {
      const from = this.placement(ev);
      const endMin = this.snapEnd(from.endMin + (e.key === 'ArrowRight' ? snap : -snap), from.startMin);
      if (endMin === from.endMin) return;
      e.preventDefault();
      e.stopPropagation();
      this.requestResize(ev, from, endMin);
      this.announcement = `${ev.title} — ${this.fmtTime(from.startMin)} · ${this.fmtTime(endMin)}`;
      return;
    }

    if (!this.movable) return;

    const from = this.placement(ev);
    const duration = from.endMin - from.startMin;
    const step = snap * (e.shiftKey ? 4 : 1);
    let to: Placement | null = null;

    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const delta = e.key === 'ArrowRight' ? step : -step;
      to = { ...from, startMin: this.snapStart(from.startMin + delta, duration) };
      to.endMin = to.startMin + duration;
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const index = this.resources.findIndex((r) => r.id === from.resourceId);
      const next = index + (e.key === 'ArrowDown' ? 1 : -1);
      if (index === -1 || next < 0 || next >= this.resources.length) return;
      to = { ...from, resourceId: this.resources[next].id };
    }
    if (!to) return;

    e.preventDefault();
    e.stopPropagation();
    this.requestMove(ev, from, to);
    const resource = this.resources.find((r) => r.id === to.resourceId);
    this.announcement = `${ev.title} — ${this.fmtTime(to.startMin)} · ${resource?.label ?? ''}`;
  }

  // ── Etiquetas ─────────────────────────────────────────────────

  // Etiqueta del día del cursor (capitalizada vía CSS).
  private dayLabel(): string {
    return this.cursor.toLocaleDateString(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Iniciales para el avatar de respaldo (sin imagen).
  private initials(label: string): string {
    const parts = label.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2);
    return parts[0][0] + parts[parts.length - 1][0];
  }

  // ── Render parcial ────────────────────────────────────────────

  // Cabecera horaria: una columna por hora del rango.
  private renderTimelineHead(): unknown {
    const hours: number[] = [];
    for (let h = this.startHour; h < this.endHour; h++) hours.push(h);
    return html`<div class="timeline">
      ${hours.map(
        (h) => html`<div class="hour">${String(h).padStart(2, '0')}:00</div>`,
      )}
    </div>`;
  }

  // Lane (pista) de un recurso: celdas-slot de fondo + bloques de evento posicionados.
  private renderLane(resource: OkSchedulerResource): unknown {
    const total = this.rangeMinutes;
    const startMin = this.startHour * 60;
    const step = this.slotMin > 0 ? this.slotMin : 60;
    const count = this.slotCount;

    // Celdas-slot de fondo (clicables para crear turnos).
    const cells = [];
    for (let i = 0; i < count; i++) {
      const slotStart = startMin + i * step;
      const left = ((slotStart - startMin) / total) * 100;
      const width = (step / total) * 100;
      cells.push(
        html`<div
          class="slot"
          style=${`left:${left}%;width:${width}%`}
          @click=${() => this.clickSlot(resource.id, slotStart)}
        ></div>`,
      );
    }

    // Hueco de origen: mientras un bloque de ESTE carril está en el aire, se ve de dónde salió.
    const ghost =
      this.drag && this.drag.from.resourceId === resource.id
        ? (() => {
            const s = Math.max(this.drag!.from.startMin, startMin);
            const e = Math.min(this.drag!.from.endMin, startMin + total);
            if (e <= s) return '';
            return html`<div
              class="ghost"
              style=${`left:${((s - startMin) / total) * 100}%;width:${((e - s) / total) * 100}%`}
            ></div>`;
          })()
        : '';

    // Bloques de evento del recurso, recortados al rango visible. El carril de un bloque es el de
    // su posición ACTUAL (la del gesto o la del movimiento sin confirmar), no el de la prop.
    const mine = this.events.filter((ev) => this.placement(ev).resourceId === resource.id);
    // El reparto se calcula sobre la posición ACTUAL, así que al arrastrar una cita encima de otra
    // el carril se vuelve a partir en vivo, y al soltarla fuera vuelve a juntarse.
    const slots = this.packLane(mine.map((ev) => ({ id: ev.id, at: this.placement(ev) })));
    // Cuántos sub-carriles llega a tener este recurso en su peor momento del día: es lo que decide
    // cuánto CRECE la fila (ver `--min-stack-height`).
    const stacks = Math.max(1, ...[...slots.values()].map((s) => s.count));

    const blocks = mine
      .map((ev) => {
        const at = this.placement(ev);
        const slot = slots.get(ev.id) ?? { index: 0, count: 1 };
        const s = Math.max(at.startMin, startMin);
        const e = Math.min(at.endMin, startMin + total);
        if (e <= s) return ''; // fuera de rango o duración nula
        const left = ((s - startMin) / total) * 100;
        const width = ((e - s) / total) * 100;
        const gesturing = this.drag?.id === ev.id;
        const resizing = gesturing && this.pointerDrag?.mode === 'resize';
        // Mientras se REDIMENSIONA el bloque no se aparta del hit-test: no hay carril que buscar
        // debajo, y quitarle los eventos soltaría la captura del puntero a media franja.
        const dragging = gesturing && !resizing;
        const held = this.heldId === ev.id;
        const time = `${this.fmtTime(at.startMin)} – ${this.fmtTime(at.endMin)}`;
        return html`<div
          class=${`event${this.movable ? ' movable' : ''}${held ? ' held' : ''}${
            dragging ? ' dragging' : ''
          }${resizing ? ' resizing' : ''}`}
          data-event-id=${ev.id}
          data-lane-index=${slot.index}
          data-lane-count=${slot.count}
          style=${`left:${left}%;width:${width}%;background:${
            ev.color || 'var(--primary-color)'
          };${this.stackStyle(slot)}`}
          title=${ev.title}
          role="button"
          tabindex="0"
          aria-label=${`${ev.title}, ${time}, ${resource.label}`}
          @click=${(domEv: Event) => this.clickEvent(ev, domEv)}
          @keydown=${(domEv: KeyboardEvent) => this.onEventKeyDown(domEv, ev)}
          @pointerdown=${(domEv: PointerEvent) => this.onEventPointerDown(domEv, ev)}
        >
          <span class="event-title">${ev.title}</span>
          <span class="event-time">${time}</span>
          ${this.resizable
            ? html`<span
                class="resize-handle"
                data-resize-handle
                aria-hidden="true"
                @click=${(domEv: Event) => domEv.stopPropagation()}
                @pointerdown=${(domEv: PointerEvent) => this.onHandlePointerDown(domEv, ev)}
              ></span>`
            : ''}
        </div>`;
      });

    return html`<div
      class="lane"
      data-resource-id=${resource.id}
      data-stacks=${stacks}
      style=${`--stacks:${stacks}`}
    >
      ${cells}${ghost}${blocks}
    </div>`;
  }

  // Fila completa de un recurso: label sticky + lane.
  private renderRow(resource: OkSchedulerResource): unknown {
    return html`<div class="row">
      <div class="resource">
        ${resource.avatar
          ? html`<img class="avatar" src=${resource.avatar} alt="" loading="lazy" />`
          : html`<span class="avatar-fallback">${this.initials(resource.label)}</span>`}
        <span class="resource-label">${resource.label}</span>
      </div>
      ${this.renderLane(resource)}
    </div>`;
  }

  render(): unknown {
    // Siembra perezosa del cursor a partir de `date` (una sola vez).
    if (!this.seeded) {
      if (this.date) this.cursor = this.parseDay(this.date);
      this.seeded = true;
    }

    // Ancho intrínseco de la franja = nº de horas × ancho de hora (para el scroll horizontal).
    const hourCount = Math.max(1, this.endHour - this.startHour);
    const timelineWidth = `calc(${hourCount} * var(--hour-width))`;
    const gridStyle = `width:calc(var(--resource-width) + ${timelineWidth})`;

    return html`<div class="toolbar">
        <ion-button
          fill="clear"
          size="small"
          aria-label=${this.t.prevDay}
          @click=${() => this.navDay(-1)}
        >
          <ion-icon slot="icon-only" .icon=${iconChevronBackOutline}></ion-icon>
        </ion-button>
        <span class="title">${this.dayLabel()}</span>
        <ion-button
          fill="clear"
          size="small"
          aria-label=${this.t.nextDay}
          @click=${() => this.navDay(1)}
        >
          <ion-icon slot="icon-only" .icon=${iconChevronForwardOutline}></ion-icon>
        </ion-button>
      </div>
      <div class="scroll">
        <div
          class="grid"
          style=${gridStyle}
          @pointermove=${this.onPointerMove}
          @pointerup=${this.onPointerUp}
          @pointercancel=${this.onPointerCancel}
        >
          <div class="head-row">
            <div class="corner"></div>
            ${this.renderTimelineHead()}
          </div>
          ${this.resources.length
            ? this.resources.map((r) => this.renderRow(r))
            : html`<div class="empty">${this.t.empty}</div>`}
        </div>
      </div>
      <div class="sr-only" role="status" aria-live="polite">${this.announcement}</div>`;
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('touchmove', this.blockScrollWhileDragging);
    if (this.pointerDrag) this.endGesture(this.pointerDrag);
    if (this.suppressClickTimer) clearTimeout(this.suppressClickTimer);
    this.suppressClickTimer = null;
  }
}

define('ok-scheduler', OkScheduler);

declare global {
  interface HTMLElementTagNameMap {
    'ok-scheduler': OkScheduler;
  }
}
