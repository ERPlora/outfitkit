import { LitElement, html, css, svg, nothing } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-chart — declarative chart in inline SVG (line / area / bar).
// SELF-CONTAINED and CSP-safe: the SVG is drawn by hand, no chart library.
// Ports the look of the old .ux-chart (thin grid, value axis on the left,
// monospace category labels below, area with a .5→0 gradient, dashed projection
// series, rounded rx=2 bars with a "mute" variant).
//
//   • prop type        → 'line' | 'area' | 'bar' (default 'line')
//   • prop .series     → OkChartSeries[]  (each series: {name,color,data,dashed?,mute?})
//   • prop .labels     → string[]  (category labels, below)
//   • prop gridlines   → boolean (horizontal background lines, default true)
//   • prop .axis       → string[] (value-axis labels, top → bottom)
//   • prop height      → height of the chart in px (default 200)
//   • prop endpoint    → boolean (dot + value label at the end of the 1st line)
//   • prop endpointLabel → text of that label (the last value otherwise)
//
// The shapes live in a stretched SVG (preserveAspectRatio="none"); every piece of
// TEXT is HTML laid over it, so it keeps its shape on a narrow card (outfitkit#250).
// In a bar chart each category label is centred under its bar; labels that do not
// fit their slot are skipped evenly, keeping the last one (Recharts «preserveEnd»).
//
// Presentational: emits no events.

/** Minimum gap, in px, between two neighbouring category labels. */
const LABEL_GAP_PX = 8;
/** Gap, in px, between the endpoint dot and its value label. */
const ENDPOINT_GAP_PX = 6;

/**
 * Smallest step (show one label out of `step`) so that the widest label plus a
 * gap fits in the space `step` slots give it. 1 when the layout is unknown.
 */
export function xLabelStep(count: number, slotPx: number, widestPx: number, gapPx: number): number {
  if (count <= 1 || !(slotPx > 0)) return 1;
  const step = Math.ceil((widestPx + gapPx) / slotPx);
  return Math.min(Math.max(step, 1), count);
}

/** Una serie de datos del gráfico. */
export interface OkChartSeries {
  /** Nombre (para la leyenda). */
  name?: string;
  /** Color del trazo/relleno/barra; cae a la cadena de tokens si se omite. */
  color?: string;
  /** Valores numéricos de la serie. */
  data: number[];
  /** En línea/área: dibuja la serie como trazo punteado (proyección). */
  dashed?: boolean;
  /** En barras: pinta esta serie/columna atenuada (variante mute). */
  mute?: boolean;
}

export type OkChartType = 'line' | 'area' | 'bar';

export class OkChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      /* Tokens propios estilo Ionic (overridables): --ok-* → --ion-* → hex. */
      --primary: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --grid: var(--ok-border-color, var(--ion-border-color, #e0e0e0));
      --axis-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --value-color: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --mute: var(--ok-color-step-200, var(--ion-color-step-200, #cccccc));
      --surface: var(--ok-surface, var(--ion-background-color, #ffffff));
      --legend-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
    }

    .chart {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      box-sizing: border-box;
    }

    .frame {
      display: flex;
      width: 100%;
      font-family: ui-monospace, 'SF Mono', 'Roboto Mono', Menlo, Consolas, monospace;
    }

    .canvas {
      position: relative;
      flex: 1 1 auto;
      min-width: 0;
    }

    svg {
      display: block;
      width: 100%;
      overflow: visible;
    }

    /* Value axis: its width follows the longest label; every label is stacked in
       the same grid cell and moved onto its gridline (--y, px from the top). */
    .y-axis {
      display: grid;
      flex: 0 0 auto;
      align-items: start;
      padding-right: 8px;
    }
    .y-label {
      grid-area: 1 / 1;
      justify-self: end;
      transform: translateY(calc(var(--y, 0px) - 50%));
    }

    /* Category labels: a row as wide as the svg, each label at its x (%). */
    .x-axis {
      position: absolute;
      left: 0;
      right: 0;
      height: 0;
    }
    .x-label {
      position: absolute;
      top: 0;
      transform: translateX(-50%);
    }
    .x-label[data-anchor='start'] {
      transform: none;
    }
    .x-label[data-anchor='end'] {
      transform: translateX(-100%);
    }
    .x-label.skipped {
      visibility: hidden;
    }

    .y-label,
    .x-label {
      white-space: nowrap;
      line-height: 1;
    }

    .grid line {
      stroke: var(--grid);
      stroke-width: 1;
      shape-rendering: crispEdges;
    }

    .y-label,
    .x-label {
      color: var(--axis-color);
      font-size: 10px;
      font-variant-numeric: tabular-nums;
    }

    .value-label {
      position: absolute;
      margin-left: 6px; /* ENDPOINT_GAP_PX */
      transform: translateY(-50%);
      white-space: nowrap;
      line-height: 1;
      color: var(--value-color);
      font-weight: 600;
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }

    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      font-size: 0.72rem;
      color: var(--legend-color);
    }
    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
    }
    .legend-dot {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    .legend-dot.dashed {
      height: 2px;
      border-radius: 1px;
    }
  `;

  /** Tipo de gráfico. */
  @property() type: OkChartType = 'line';

  /** Series de datos. */
  @property({ attribute: false }) series: OkChartSeries[] = [];

  /** Etiquetas del eje X (debajo). */
  @property({ attribute: false }) labels: string[] = [];

  /** Etiquetas del eje de valor (izquierda), de arriba a abajo. */
  @property({ attribute: false }) axis: string[] = [];

  /** Pinta las líneas de rejilla horizontales. */
  @property({ type: Boolean }) gridlines = true;

  /** Alto del SVG en px. */
  @property({ type: Number }) height = 200;

  /** Punto + etiqueta de valor al final de la primera serie (líneas). */
  @property({ type: Boolean }) endpoint = false;

  /** Mínimo explícito del eje de valor; si se omite, autoescala al mínimo de los datos. */
  @property({ type: Number }) min?: number;

  /** Máximo explícito del eje de valor; si se omite, autoescala al máximo de los datos. */
  @property({ type: Number }) max?: number;

  /** Texto de la etiqueta del endpoint; si se omite usa el último dato. */
  @property() endpointLabel = '';

  /** Show one category label out of `labelStep` (the rest do not fit). */
  @state() private labelStep = 1;

  /** Px reserved right of the plot for the endpoint label (measured, not stretched). */
  @state() private endpointRoom = 0;

  private resizeObserver?: ResizeObserver;

  connectedCallback(): void {
    super.connectedCallback();
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver ??= new ResizeObserver(() => this.fitLabels());
      this.resizeObserver.observe(this);
    }
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    super.disconnectedCallback();
  }

  protected updated(): void {
    this.fitLabels();
  }

  // Measures the label row and the widest label and skips labels that would
  // overlap. Hidden labels keep their box (visibility), so the measure is stable.
  private fitLabels(): void {
    const row = this.renderRoot.querySelector<HTMLElement>('.x-axis');
    const labels = row ? [...row.querySelectorAll<HTMLElement>('.x-label')] : [];
    const rowPx = row?.getBoundingClientRect().width ?? 0;
    const widest = Math.max(0, ...labels.map((l) => l.getBoundingClientRect().width));
    const slotPx = (rowPx * this.xSlot(labels.length)) / this.vbWidth;
    // A line aligns its first and last labels inwards, so each edge pair needs
    // one and a half labels of room (two when there are only two labels).
    const edge = this.type === 'bar' ? 1 : labels.length === 2 ? 2 : 1.5;
    const step = xLabelStep(labels.length, slotPx, widest * edge, LABEL_GAP_PX);
    if (step !== this.labelStep) this.labelStep = step;

    const endpoint = this.renderRoot.querySelector<HTMLElement>('.value-label');
    const room = endpoint ? Math.ceil(endpoint.getBoundingClientRect().width) + ENDPOINT_GAP_PX : 0;
    if (room !== this.endpointRoom) this.endpointRoom = room;
  }

  // ---- Canvas geometry (viewBox 600 x height, preserveAspectRatio none) ----
  private readonly vbWidth = 600;
  private get vbHeight(): number {
    return this.height;
  }
  // Room for the category labels (below). The value axis is an HTML column
  // outside the svg, so the plot starts right after it.
  private get pad() {
    return {
      left: this.axis.length ? 0 : 12,
      right: 12,
      top: 12,
      bottom: this.labels.length ? 22 : 12,
    };
  }
  private get plotW(): number {
    const p = this.pad;
    return this.vbWidth - p.left - p.right;
  }
  private get plotH(): number {
    const p = this.pad;
    return this.vbHeight - p.top - p.bottom;
  }

  // Mínimo/máximo del eje: los props explícitos `min`/`max` mandan; sin ellos,
  // autoescala al mínimo/máximo global de las series (las barras crecen desde 0).
  private get bounds(): { min: number; max: number } {
    const all: number[] = [];
    for (const s of this.series ?? []) for (const v of s.data ?? []) all.push(v);
    let min: number;
    let max: number;
    if (!all.length) {
      min = 0;
      max = 1;
    } else {
      min = Math.min(...all);
      max = Math.max(...all);
      if (this.type !== 'line') min = Math.min(min, 0); // área/barras incluyen la base 0
      if (min === max) max = min + 1; // serie plana
    }
    if (this.min != null && Number.isFinite(this.min)) min = this.min;
    if (this.max != null && Number.isFinite(this.max)) max = this.max;
    if (min === max) max = min + 1; // eje explícito degenerado
    return { min, max };
  }

  // Color efectivo de una serie (prop o el token primario del componente).
  private seriesColor(s: OkChartSeries, muted = false): string {
    if (s.mute || muted) return s.color ?? 'var(--mute)';
    return s.color || 'var(--primary)';
  }

  // Maps (index, value) → {x, y} coordinates of the plot area.
  private xAt(i: number, n: number): number {
    const p = this.pad;
    if (n <= 1) return p.left + this.plotW / 2;
    return p.left + (i / (n - 1)) * this.plotW;
  }

  // Number of bar groups: the longest series, or the labels if there are more.
  private get barGroups(): number {
    const series = this.series ?? [];
    return Math.max(...series.map((s) => s.data?.length ?? 0), this.labels.length, 0);
  }
  private get groupW(): number {
    return this.plotW / Math.max(this.barGroups, 1);
  }
  // Centre of bar group `g` — where its bars AND its label go.
  private barCentre(g: number): number {
    return this.pad.left + (g + 0.5) * this.groupW;
  }
  // Horizontal space (viewBox units) each of `n` category labels owns.
  private xSlot(n: number): number {
    if (this.type === 'bar') return this.groupW;
    return n > 1 ? this.plotW / (n - 1) : this.plotW;
  }
  private yAt(value: number): number {
    const { min, max } = this.bounds;
    const p = this.pad;
    return p.top + (1 - (value - min) / (max - min)) * this.plotH;
  }

  // ---- Rejilla horizontal ----
  private renderGrid(): unknown {
    if (!this.gridlines) return svg``;
    const p = this.pad;
    const rows = Math.max(this.axis.length || 4, 2);
    const lines = [];
    for (let i = 0; i < rows; i++) {
      const y = p.top + (i / (rows - 1)) * this.plotH;
      lines.push(svg`<line x1=${p.left} x2=${this.vbWidth - p.right} y1=${y} y2=${y} />`);
    }
    return svg`<g class="grid">${lines}</g>`;
  }

  // ---- Value axis (left, HTML column as wide as its longest label) ----
  private renderValueAxis(): unknown {
    if (!this.axis.length) return nothing;
    const p = this.pad;
    const n = this.axis.length;
    const ticks = this.axis.map((t, i) => {
      const y = n > 1 ? p.top + (i / (n - 1)) * this.plotH : p.top + this.plotH / 2;
      return html`<span class="y-label" style=${`--y:${y}px`}>${t}</span>`;
    });
    return html`<div class="y-axis" aria-hidden="true" style=${`height:${this.vbHeight}px`}>
      ${ticks}
    </div>`;
  }

  // ---- Category labels (below, HTML over the svg) ----
  // Bars: centred under their group. Lines: on their point, the first and the last
  // aligned inwards so they stay inside the plot. Skipped labels keep the last one.
  private renderXLabels(): unknown {
    if (!this.labels.length) return nothing;
    const n = this.labels.length;
    const bar = this.type === 'bar';
    const step = this.labelStep;
    const ticks = this.labels.map((t, i) => {
      const x = bar ? this.barCentre(i) : this.xAt(i, n);
      const anchor = bar || n === 1 ? 'middle' : i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle';
      const skipped = (n - 1 - i) % step !== 0;
      return html`<span
        class=${skipped ? 'x-label skipped' : 'x-label'}
        data-anchor=${anchor}
        style=${`left:${(x / this.vbWidth) * 100}%`}
        >${t}</span
      >`;
    });
    const top = this.vbHeight - this.pad.bottom + 6;
    return html`<div class="x-axis" aria-hidden="true" style=${`top:${top}px`}>${ticks}</div>`;
  }

  // ---- Endpoint value label (HTML, next to the last point of the 1st line) ----
  private renderEndpointLabel(): unknown {
    if (!this.endpoint || this.type === 'bar') return nothing;
    const data = this.series?.[0]?.data ?? [];
    const n = data.length;
    if (!n) return nothing;
    const x = this.xAt(n - 1, n);
    const y = this.yAt(data[n - 1]);
    const label = this.endpointLabel || String(data[n - 1]);
    return html`<span
      class="value-label"
      aria-hidden="true"
      style=${`left:${(x / this.vbWidth) * 100}%;top:${y}px`}
      >${label}</span
    >`;
  }

  // ---- Líneas / áreas ----
  private renderLines(): unknown {
    const fillArea = this.type === 'area';
    const parts: unknown[] = [];
    (this.series ?? []).forEach((s, si) => {
      const data = s.data ?? [];
      const n = data.length;
      if (!n) return;
      const color = this.seriesColor(s);
      const pts = data.map((v, i) => `${this.xAt(i, n)},${this.yAt(v)}`);
      const linePath = `M${pts.join(' L')}`;

      // Área con degradado (solo en type=area y series no punteadas).
      if (fillArea && !s.dashed) {
        const baseY = this.pad.top + this.plotH;
        const x0 = this.xAt(0, n);
        const xEnd = this.xAt(n - 1, n);
        const areaPath = `${linePath} L${xEnd},${baseY} L${x0},${baseY} Z`;
        const gid = `ok-chart-grad-${si}`;
        parts.push(svg`
          <defs>
            <linearGradient id=${gid} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stop-color=${color} stop-opacity="0.5" />
              <stop offset="100%" stop-color=${color} stop-opacity="0" />
            </linearGradient>
          </defs>
          <path d=${areaPath} fill=${`url(#${gid})`} stroke="none" />
        `);
      }

      parts.push(svg`<path
        d=${linePath}
        fill="none"
        stroke=${color}
        stroke-width=${s.dashed ? 1.5 : 2}
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-dasharray=${s.dashed ? '4 4' : ''}
      />`);

      // Endpoint dot (first series only); its value label is HTML (renderEndpointLabel).
      if (this.endpoint && si === 0 && n) {
        const lastX = this.xAt(n - 1, n);
        const lastY = this.yAt(data[n - 1]);
        parts.push(svg`
          <circle cx=${lastX} cy=${lastY} r="4" fill=${color}
            stroke="var(--surface)" stroke-width="2" />
        `);
      }
    });
    return svg`${parts}`;
  }

  // ---- Barras agrupadas (rounded rx=2, soporte mute por serie) ----
  private renderBars(): unknown {
    const series = this.series ?? [];
    const groups = this.barGroups;
    if (!groups) return svg``;
    const baseY = this.yAt(this.bounds.min < 0 ? 0 : this.bounds.min);
    const innerGap = 0.28; // gap between groups
    const usable = this.groupW * (1 - innerGap);
    const nSeries = series.length || 1;
    const barW = Math.max(usable / nSeries, 1);

    const rects: unknown[] = [];
    for (let g = 0; g < groups; g++) {
      series.forEach((s, si) => {
        const v = s.data?.[g];
        if (v == null) return;
        // The group's bars are laid side by side around its centre.
        const x = this.barCentre(g) - usable / 2 + si * barW;
        const y = this.yAt(v);
        const top = Math.min(y, baseY);
        const h = Math.max(Math.abs(baseY - y), 0.5);
        const color = this.seriesColor(s);
        rects.push(svg`<rect
          x=${x + 0.5}
          y=${top}
          width=${Math.max(barW - 1, 1)}
          height=${h}
          rx="2"
          fill=${color}
        />`);
      });
    }
    return svg`<g>${rects}</g>`;
  }

  // ---- Leyenda (si alguna serie tiene nombre) ----
  private renderLegend(): unknown {
    const items = (this.series ?? []).filter((s) => s.name);
    if (!items.length) return null;
    return html`<div class="legend">
      ${items.map(
        (s) => html`<span class="legend-item">
          <span
            class=${s.dashed ? 'legend-dot dashed' : 'legend-dot'}
            style=${`background:${this.seriesColor(s)}`}
          ></span>
          ${s.name}
        </span>`,
      )}
    </div>`;
  }

  render(): unknown {
    const body =
      this.type === 'bar' ? this.renderBars() : this.renderLines();
    return html`
      <div class="chart">
        <div class="frame">
          ${this.renderValueAxis()}
          <div class="canvas" style=${this.endpointRoom ? `margin-right:${this.endpointRoom}px` : ''}>
            <svg
              viewBox=${`0 0 ${this.vbWidth} ${this.vbHeight}`}
              style=${`height:${this.height}px`}
              preserveAspectRatio="none"
              role="img"
              aria-label=${(this.series ?? []).map((s) => s.name).filter(Boolean).join(', ') ||
              'chart'}
            >
              ${this.renderGrid()} ${body}
            </svg>
            ${this.renderXLabels()} ${this.renderEndpointLabel()}
          </div>
        </div>
        ${this.renderLegend()}
      </div>
    `;
  }
}

define('ok-chart', OkChart);

declare global {
  interface HTMLElementTagNameMap {
    'ok-chart': OkChart;
  }
}
