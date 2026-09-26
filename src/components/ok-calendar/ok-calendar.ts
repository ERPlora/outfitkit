import { LitElement, html, css, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { define } from '../../base/define.js';
import { iconChevronBackOutline, iconChevronForwardOutline } from '../../base/icons.js';

// Evento de calendario. Lo aporta el consumidor vía la prop `.events`.
export interface OkCalendarEvent {
  /** Identificador único del evento. */
  id: string;
  /** Fecha del evento en `YYYY-MM-DD` o ISO (se normaliza al día local). */
  date: string;
  /** Texto visible del evento (chip / fila de agenda). */
  title: string;
  /** Color del chip; cadena CSS (hex, var, etc.). Por defecto, el primario. */
  color?: string;
}

// Vista del calendario.
export type OkCalendarView = 'month' | 'agenda';

// Textos humanos del calendario (i18n). Default INGLÉS; el consumidor puede sobreescribir
// claves sueltas vía la prop `labels`. Variables con token `{n}` (p.ej. `more`).
export interface OkCalendarLabels {
  /** Etiqueta del botón de vista Mes. */
  month: string;
  /** Etiqueta del botón de vista Agenda. */
  agenda: string;
  /** Indicador de eventos extra por día; `{n}` = cantidad. */
  more: string;
  /** Texto cuando la agenda no tiene próximos eventos. */
  agendaEmpty: string;
  /** aria-label del botón "mes anterior". */
  prevMonth: string;
  /** aria-label del botón "mes siguiente". */
  nextMonth: string;
}

const DEFAULT_LABELS: OkCalendarLabels = {
  month: 'Month',
  agenda: 'Agenda',
  more: '+{n} more',
  agendaEmpty: 'No upcoming events.',
  prevMonth: 'Previous month',
  nextMonth: 'Next month',
};

// A known Sunday: weekday names are formatted from it (`getDay()` 0 = Sunday … 6 = Saturday).
const SUNDAY_REF = new Date(2021, 0, 31);

// CLDR `firstDay` by region, for engines without `Intl.Locale#getWeekInfo` (older Firefox/Safari).
// Every region not listed starts the week on Monday.
const SUNDAY_REGIONS = new Set(
  'AG AS BD BR BS BT BW BZ CA CN CO DM DO ET GT GU HK HN ID IL IN JM JP KE KH KR LA MH MM MO MT MX MZ NI NP PA PE PH PK PR PT PY SA SG SV TH TT TW UM US VE VI WS YE ZA ZW'.split(' '),
);
const SATURDAY_REGIONS = new Set('AE AF BH DJ DZ EG IQ IR JO KW LY OM QA SD SY'.split(' '));
const FRIDAY_REGIONS = new Set(['MV']);

type WeekInfo = { firstDay: number };
type LocaleWithWeekInfo = Intl.Locale & { getWeekInfo?: () => WeekInfo | undefined; weekInfo?: WeekInfo };

/** First day of the week of a BCP-47 locale: 0 = Sunday … 6 = Saturday (Monday if unknown). */
export function localeFirstDayOfWeek(locale: string): number {
  try {
    const loc = new Intl.Locale(locale) as LocaleWithWeekInfo;
    const info = loc.getWeekInfo?.() ?? loc.weekInfo;
    // Intl counts 1 = Monday … 7 = Sunday.
    if (info && info.firstDay >= 1 && info.firstDay <= 7) return info.firstDay % 7;
    const region = loc.maximize().region ?? '';
    if (SUNDAY_REGIONS.has(region)) return 0;
    if (SATURDAY_REGIONS.has(region)) return 6;
    if (FRIDAY_REGIONS.has(region)) return 5;
  } catch {
    // Invalid locale tag: fall through to the ISO week.
  }
  return 1;
}

// ok-calendar — calendario por DATOS (`events`), algo que Ionic NO ofrece: `ion-datetime` es solo
// un picker de fechas, no una rejilla con eventos. AUTOCONTENIDO: CSS propio en el shadow, sin
// librerías de fechas (solo `Date` nativo → CSP-safe). Usa `ion-icon`/`ion-button` internos (los
// registra el host).
//   • prop `.events` → Array<OkCalendarEvent>
//   • prop `value`   → día seleccionado (`YYYY-MM-DD`)
//   • prop `view`    → 'month' | 'agenda' (def 'month')
//   • prop `picker`  → DATE PICKER mode (outfitkit#198): compact (max 20rem, 44 px days), no
//     Month/Agenda toggle and no event chips; days are `<button aria-pressed>` with a single tab
//     stop and APG date-grid keys (arrows, Home/End = week of the locale, PageUp/PageDown = month).
//   • prop `first-day-of-week` → 0 = Sunday … 6 = Saturday; by default, the week of `locale`.
// Vista MES: cabecera ‹ mes/año › + toggle Mes/Agenda; rejilla 7 columnas (semana del locale); hoy resaltado;
//   cada día muestra hasta N eventos como chips y "+X más".
// Vista AGENDA: próximos eventos agrupados por día (útil en móvil).
// Eventos (bubbles + composed):
//   • `ok-date-select`  detail { date }
//   • `ok-event-click`  detail { id, event }
//   • `ok-view-change`  detail { view }
//   • `ok-nav`          detail { year, month }   (month: 1–12, al cambiar de mes)
export class OkCalendar extends LitElement {
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
      --today-bg: var(--ok-today-bg, rgba(var(--ion-color-primary-rgb, 56, 128, 255), 0.1));
      --border-radius: var(--ok-radius, 8px);
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

    /* ── Cabecera ───────────────────────────────────────────────── */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      flex-wrap: wrap;
    }
    .nav {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }
    .title {
      min-width: 9rem;
      text-align: center;
      font-weight: 600;
      font-size: 1.05rem;
    }
    .toggle {
      display: inline-flex;
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      overflow: hidden;
    }
    .toggle button {
      border: 0;
      background: none;
      color: var(--color-muted);
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.75rem;
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    @media (hover: hover) {
      .toggle button:not(.active):hover {
        background: var(--hover-bg);
        color: var(--color);
      }
    }
    .toggle button:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .toggle button.active {
      background: var(--primary-color);
      color: var(--primary-contrast);
    }

    /* ── Vista MES ──────────────────────────────────────────────── */
    .grid {
      display: grid;
      grid-template-columns: repeat(7, minmax(0, 1fr));
      gap: 1px;
      background: var(--border-color);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      overflow: hidden;
    }
    .weekday {
      background: var(--background);
      padding: 0.4rem 0.25rem;
      text-align: center;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-muted);
      text-transform: uppercase;
    }
    .day {
      background: var(--background);
      min-height: 5.5rem;
      padding: 0.3rem;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
      overflow: hidden;
    }
    @media (hover: hover) {
      .day:hover {
        background: var(--hover-bg);
      }
    }
    .day:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .day.other-month {
      opacity: 0.4;
    }
    .day.today .daynum {
      background: var(--primary-color);
      color: var(--primary-contrast);
    }
    .day.selected {
      box-shadow: inset 0 0 0 2px var(--primary-color);
    }
    .daynum {
      align-self: flex-end;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 1.5rem;
      height: 1.5rem;
      padding: 0 0.35rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-variant-numeric: tabular-nums;
    }
    .chips {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      min-width: 0;
    }
    .chip {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.1rem 0.3rem;
      border-radius: 4px;
      font-size: 0.72rem;
      line-height: 1.3;
      color: var(--primary-contrast);
      cursor: pointer;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    @media (hover: hover) {
      .chip:hover {
        filter: brightness(1.05);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.18);
      }
    }
    .chip:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .chip .chip-title {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .more {
      font-size: 0.7rem;
      color: var(--color-muted);
      padding: 0 0.3rem;
      cursor: pointer;
    }

    /* ── Vista AGENDA ───────────────────────────────────────────── */
    .agenda {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .agenda-empty {
      color: var(--color-muted);
      padding: 1rem;
      text-align: center;
    }
    .agenda-group {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
    }
    .agenda-date {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--color-muted);
      border-bottom: 1px solid var(--border-color);
      padding-bottom: 0.25rem;
    }
    .agenda-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.3rem;
      border-radius: var(--border-radius);
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease),
        box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    @media (hover: hover) {
      .agenda-item:hover {
        background: var(--hover-bg);
      }
    }
    .agenda-item:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .dot {
      flex: 0 0 auto;
      width: 0.6rem;
      height: 0.6rem;
      border-radius: 999px;
    }
    .agenda-title {
      flex: 1 1 auto;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @media (prefers-reduced-motion: reduce) {
      .toggle button:active,
      .day:active,
      .chip:active,
      .agenda-item:active {
        transform: none;
      }
    }

    /* ── Picker mode (outfitkit#198) ─────────────────────────────── */
    :host([picker]) {
      max-width: 20rem;
    }
    :host([picker]) .header {
      flex-wrap: nowrap;
      margin-bottom: 0.25rem;
    }
    :host([picker]) .nav {
      width: 100%;
      justify-content: space-between;
    }
    :host([picker]) .title {
      min-width: 0;
      font-size: 1rem;
    }
    :host([picker]) .grid {
      gap: 0;
      background: none;
      border: 0;
      border-radius: 0;
      /* The focus outline is drawn outside the day: do not clip it on the edge columns. */
      overflow: visible;
    }
    :host([picker]) .weekday {
      background: none;
      padding: 0.25rem 0;
    }
    .pday {
      appearance: none;
      border: 0;
      margin: 0 auto;
      padding: 0;
      width: 100%;
      max-width: 2.75rem;
      height: 2.75rem;
      border-radius: 999px;
      background: none;
      color: inherit;
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease),
        color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease);
    }
    @media (hover: hover) {
      .pday:hover {
        background: var(--hover-bg);
      }
    }
    .pday.other-month {
      opacity: 0.4;
    }
    .pday.today {
      box-shadow: inset 0 0 0 1px var(--primary-color);
      color: var(--primary-color);
      font-weight: 600;
    }
    .pday[aria-pressed='true'] {
      background: var(--primary-color);
      color: var(--primary-contrast);
      font-weight: 600;
    }
    .pday:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 1px;
    }

    /* ── Responsive (móvil) ─────────────────────────────────────── */
    @media (max-width: 540px) {
      .day {
        min-height: 3.5rem;
        padding: 0.2rem;
      }
      .weekday {
        font-size: 0.65rem;
        padding: 0.3rem 0.1rem;
      }
      .chip-title {
        display: none;
      }
      .chip {
        height: 0.5rem;
        padding: 0;
      }
    }
  `;

  /** Eventos a mostrar; el consumidor los pasa por propiedad. */
  @property({ attribute: false }) events: OkCalendarEvent[] = [];
  /** Día seleccionado (`YYYY-MM-DD`). */
  @property() value = '';
  /** Vista actual: 'month' | 'agenda'. */
  @property() view: OkCalendarView = 'month';
  /** Máximo de chips de evento por celda antes de mostrar "+X más". */
  @property({ type: Number, attribute: 'max-per-day' }) maxPerDay = 3;
  /** Locale BCP-47 para formatear meses/días/fechas (Intl). Default 'en-US'. */
  @property() locale = 'en-US';
  /** Textos humanos sobreescribibles (i18n). Default INGLÉS. */
  @property({ attribute: false }) labels: Partial<OkCalendarLabels> = {};
  /** Date picker mode: compact, no Month/Agenda toggle, no chips, keyboard-navigable days. */
  @property({ type: Boolean, reflect: true }) picker = false;
  /** First day of the week, 0 = Sunday … 6 = Saturday. Unset / out of range → the locale's. */
  @property({ type: Number, attribute: 'first-day-of-week' }) firstDayOfWeek?: number;

  /** Textos efectivos: defaults INGLÉS mezclados con los del consumidor. */
  private get t(): OkCalendarLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  // Mes/año visibles en la vista de mes (estado interno de navegación).
  @state() private cursor = new Date();
  // Marca para sembrar el cursor desde `value` una sola vez.
  private seeded = false;
  // Picker: day holding the single tab stop after keyboard moves (roving tabindex).
  @state() private focusKey = '';

  // Effective first day of the week (0 = Sunday … 6 = Saturday).
  private firstDay(): number {
    const f = this.firstDayOfWeek;
    return typeof f === 'number' && Number.isInteger(f) && f >= 0 && f <= 6 ? f : localeFirstDayOfWeek(this.locale);
  }

  // Short weekday names, starting on the first day of the week.
  private weekdays(): string[] {
    const fmt = new Intl.DateTimeFormat(this.locale, { weekday: 'short' });
    const first = this.firstDay();
    return Array.from({ length: 7 }, (_, i) =>
      fmt.format(new Date(SUNDAY_REF.getFullYear(), SUNDAY_REF.getMonth(), SUNDAY_REF.getDate() + ((first + i) % 7))),
    );
  }

  // Sentence case: only the first letter up («Octubre de 2026», never «Octubre De 2026»).
  private sentenceCase(s: string): string {
    return s.charAt(0).toLocaleUpperCase(this.locale) + s.slice(1);
  }

  // Normaliza una fecha (`YYYY-MM-DD` o ISO) a clave local `YYYY-MM-DD`.
  private dayKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // Parsea una cadena de fecha del consumidor a `Date` local (ignora la hora si es ISO).
  private parseDate(s: string): Date {
    // Tomamos solo la parte de fecha para evitar saltos de día por zona horaria.
    const datePart = s.slice(0, 10);
    const [y, m, d] = datePart.split('-').map(Number);
    if (y && m && d) return new Date(y, m - 1, d);
    // Fallback defensivo: deja que Date intente parsear el ISO completo.
    const parsed = new Date(s);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }

  // Índice eventos por día (`YYYY-MM-DD` → eventos), ordenados por título para estabilidad.
  private indexEvents(): Map<string, OkCalendarEvent[]> {
    const map = new Map<string, OkCalendarEvent[]>();
    for (const ev of this.events) {
      const key = this.dayKey(this.parseDate(ev.date));
      const arr = map.get(key);
      if (arr) arr.push(ev);
      else map.set(key, [ev]);
    }
    return map;
  }

  // Cambia el mes visible (delta en meses) y emite `ok-nav`.
  private navMonth(delta: number): void {
    this.showMonth(new Date(this.cursor.getFullYear(), this.cursor.getMonth() + delta, 1));
  }

  // Shows the month of `next` and emits `ok-nav`.
  private showMonth(next: Date): void {
    this.cursor = next;
    this.dispatchEvent(
      new CustomEvent('ok-nav', {
        detail: { year: next.getFullYear(), month: next.getMonth() + 1 },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Cambia de vista y emite `ok-view-change`.
  private setView(view: OkCalendarView): void {
    if (view === this.view) return;
    this.view = view;
    this.dispatchEvent(
      new CustomEvent('ok-view-change', {
        detail: { view },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Selecciona un día y emite `ok-date-select`.
  private selectDay(key: string): void {
    this.value = key;
    this.focusKey = key;
    this.dispatchEvent(
      new CustomEvent('ok-date-select', {
        detail: { date: key },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Emite el click sobre un evento (sin propagar al día contenedor).
  private clickEvent(ev: OkCalendarEvent, e: Event): void {
    e.stopPropagation();
    this.dispatchEvent(
      new CustomEvent('ok-event-click', {
        detail: { id: ev.id, event: ev },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Etiqueta de mes/año del cursor, en sentence case.
  private monthLabel(): string {
    return this.sentenceCase(this.cursor.toLocaleDateString(this.locale, { month: 'long', year: 'numeric' }));
  }

  // Construye la matriz de días visibles (semanas que empiezan en el primer día del locale).
  private buildDays(): Date[] {
    const year = this.cursor.getFullYear();
    const month = this.cursor.getMonth();
    const first = new Date(year, month, 1);
    // getDay(): 0=Dom..6=Sáb → desplazamos para que la semana empiece en `firstDay()`.
    const offset = (first.getDay() - this.firstDay() + 7) % 7;
    const start = new Date(year, month, 1 - offset);
    const days: Date[] = [];
    // 6 semanas × 7 días = rejilla estable de 42 celdas.
    for (let i = 0; i < 42; i++) {
      days.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
    }
    return days;
  }

  // Render de la vista MES.
  private renderMonth(byDay: Map<string, OkCalendarEvent[]>): unknown {
    const todayKey = this.dayKey(new Date());
    const month = this.cursor.getMonth();
    const days = this.buildDays();

    return html`<div class="grid">
      ${this.weekdays().map((w) => html`<div class="weekday">${w}</div>`)}
      ${days.map((d) => {
        const key = this.dayKey(d);
        const dayEvents = byDay.get(key) ?? [];
        const visible = dayEvents.slice(0, this.maxPerDay);
        const extra = dayEvents.length - visible.length;
        const classes = [
          'day',
          d.getMonth() !== month ? 'other-month' : '',
          key === todayKey ? 'today' : '',
          key === this.value ? 'selected' : '',
        ]
          .filter(Boolean)
          .join(' ');

        return html`<div class=${classes} @click=${() => this.selectDay(key)}>
          <span class="daynum">${d.getDate()}</span>
          <div class="chips">
            ${visible.map(
              (ev) => html`<span
                class="chip"
                style=${`background:${ev.color || 'var(--primary-color)'}`}
                title=${ev.title}
                @click=${(e: Event) => this.clickEvent(ev, e)}
              >
                <span class="chip-title">${ev.title}</span>
              </span>`,
            )}
            ${extra > 0
              ? html`<span class="more">${this.t.more.replace('{n}', String(extra))}</span>`
              : ''}
          </div>
        </div>`;
      })}
    </div>`;
  }

  // Picker: the day holding the single tab stop — the keyboard-focused day, else the selected
  // day, else today, else the 1st; only while it belongs to the visible month.
  private tabStopKey(): string {
    const inMonth = (key: string): boolean => {
      if (!key) return false;
      const d = this.parseDate(key);
      return d.getFullYear() === this.cursor.getFullYear() && d.getMonth() === this.cursor.getMonth();
    };
    for (const key of [this.focusKey, this.value, this.dayKey(new Date())]) if (inMonth(key)) return key;
    return this.dayKey(new Date(this.cursor.getFullYear(), this.cursor.getMonth(), 1));
  }

  // Picker keyboard (WAI-ARIA APG date picker grid). Moves the focus; picking stays on
  // Enter / Space / click, which the native <button> already turns into a click.
  private onDayKey(e: KeyboardEvent, key: string): void {
    const d = this.parseDate(key);
    const y = d.getFullYear();
    const m = d.getMonth();
    const day = d.getDate();
    const back = (d.getDay() - this.firstDay() + 7) % 7;
    const inMonth = (delta: number): Date => {
      const last = new Date(y, m + delta + 1, 0).getDate();
      return new Date(y, m + delta, Math.min(day, last));
    };
    const moves: Record<string, () => Date> = {
      ArrowLeft: () => new Date(y, m, day - 1),
      ArrowRight: () => new Date(y, m, day + 1),
      ArrowUp: () => new Date(y, m, day - 7),
      ArrowDown: () => new Date(y, m, day + 7),
      Home: () => new Date(y, m, day - back),
      End: () => new Date(y, m, day + 6 - back),
      PageUp: () => inMonth(-1),
      PageDown: () => inMonth(1),
    };
    const move = moves[e.key];
    if (!move) return;
    e.preventDefault();
    void this.focusDay(move());
  }

  private async focusDay(d: Date): Promise<void> {
    const key = this.dayKey(d);
    this.focusKey = key;
    if (d.getFullYear() !== this.cursor.getFullYear() || d.getMonth() !== this.cursor.getMonth()) {
      this.showMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
    await this.updateComplete;
    this.renderRoot.querySelector<HTMLButtonElement>(`button[data-date="${key}"]`)?.focus();
  }

  // Render of the PICKER grid: compact buttons, no chips.
  private renderPicker(): unknown {
    const todayKey = this.dayKey(new Date());
    const month = this.cursor.getMonth();
    const tabStop = this.tabStopKey();
    const dayLabel = new Intl.DateTimeFormat(this.locale, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return html`<div class="grid" role="group" aria-label=${this.monthLabel()}>
      ${this.weekdays().map((w) => html`<div class="weekday" aria-hidden="true">${w}</div>`)}
      ${repeat(
        this.buildDays(),
        // Keyed by date: a recycled button would fade its old picked/today state onto another day.
        (d) => this.dayKey(d),
        (d) => {
          const key = this.dayKey(d);
          const classes = ['pday', d.getMonth() !== month ? 'other-month' : '', key === todayKey ? 'today' : '']
            .filter(Boolean)
            .join(' ');
          return html`<button
            type="button"
            class=${classes}
            data-date=${key}
            tabindex=${key === tabStop ? 0 : -1}
            aria-pressed=${key === this.value ? 'true' : 'false'}
            aria-current=${key === todayKey ? 'date' : nothing}
            aria-label=${dayLabel.format(d)}
            @click=${() => this.selectDay(key)}
            @keydown=${(e: KeyboardEvent) => this.onDayKey(e, key)}
          >
            ${d.getDate()}
          </button>`;
        },
      )}
    </div>`;
  }

  // Render de la vista AGENDA: próximos eventos (hoy en adelante) agrupados por día.
  private renderAgenda(byDay: Map<string, OkCalendarEvent[]>): unknown {
    const todayKey = this.dayKey(new Date());
    // Solo días con eventos, de hoy en adelante, ordenados ascendentemente.
    const keys = [...byDay.keys()].filter((k) => k >= todayKey).sort();

    if (keys.length === 0) {
      return html`<div class="agenda-empty">${this.t.agendaEmpty}</div>`;
    }

    return html`<div class="agenda">
      ${keys.map((key) => {
        const d = this.parseDate(key);
        const label = this.sentenceCase(
          d.toLocaleDateString(this.locale, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
          }),
        );
        return html`<div class="agenda-group">
          <div class="agenda-date">${label}</div>
          ${byDay.get(key)!.map(
            (ev) => html`<div class="agenda-item" @click=${(e: Event) => this.clickEvent(ev, e)}>
              <span class="dot" style=${`background:${ev.color || 'var(--primary-color)'}`}></span>
              <span class="agenda-title">${ev.title}</span>
              <ion-icon .icon=${iconChevronForwardOutline}></ion-icon>
            </div>`,
          )}
        </div>`;
      })}
    </div>`;
  }

  render(): unknown {
    // Siembra perezosa del cursor a partir de `value` (una sola vez).
    if (!this.seeded) {
      if (this.value) this.cursor = this.parseDate(this.value);
      this.seeded = true;
    }

    const byDay = this.indexEvents();

    return html`<div class="header">
        <div class="nav">
          <ion-button
            fill="clear"
            size="small"
            aria-label=${this.t.prevMonth}
            @click=${() => this.navMonth(-1)}
          >
            <ion-icon slot="icon-only" .icon=${iconChevronBackOutline}></ion-icon>
          </ion-button>
          <span class="title">${this.monthLabel()}</span>
          <ion-button
            fill="clear"
            size="small"
            aria-label=${this.t.nextMonth}
            @click=${() => this.navMonth(1)}
          >
            <ion-icon slot="icon-only" .icon=${iconChevronForwardOutline}></ion-icon>
          </ion-button>
        </div>
        ${this.picker
          ? nothing
          : html`<div class="toggle" role="tablist">
          <button
            type="button"
            class=${this.view === 'month' ? 'active' : ''}
            @click=${() => this.setView('month')}
          >
            ${this.t.month}
          </button>
          <button
            type="button"
            class=${this.view === 'agenda' ? 'active' : ''}
            @click=${() => this.setView('agenda')}
          >
            ${this.t.agenda}
          </button>
        </div>`}
      </div>
      ${this.picker
        ? this.renderPicker()
        : this.view === 'agenda'
          ? this.renderAgenda(byDay)
          : this.renderMonth(byDay)}`;
  }
}

define('ok-calendar', OkCalendar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-calendar': OkCalendar;
  }
}
