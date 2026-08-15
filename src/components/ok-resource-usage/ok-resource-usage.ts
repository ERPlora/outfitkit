import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { iconAlertCircleOutline } from '../../base/icons.js';
import '../ok-gauge/ok-gauge.js';
import '../ok-chart/ok-chart.js';

// ok-resource-usage — DUMB 0-100% resource panel shared by the Hub (Vue) and the
// Cloud (Django). Everything arrives precomputed by the server; the component never
// computes business thresholds, it only paints:
//   - ok-gauge ring with the current value + ok-chart area (0..100) with the history;
//   - a status band colored by the RECEIVED `status` (the server decides) — colors are
//     never recomputed from `current`; the only use of the received `.thresholds` is
//     the gauge zone gradient;
//   - `known === false` renders a not-measured state (icon + `unreadable-label`),
//     NEVER a zero that would read as healthy green (ADR-0237 doctrine);
//   - the displayed value clamps at 100 while the tooltip keeps the real value;
//   - an optional upgrade CTA (link), rendered only when `upgrade.show` is true.
// Presentational: no events.

/** Health status computed by the server for the metric. */
export type OkResourceStatus = 'ok' | 'warning' | 'critical' | 'unknown';

/** Server-computed metric: current reading + history + status. */
export interface OkResourceMetric {
  /** False when the metric could not be read — renders the unreadable state. */
  known: boolean;
  /** Current reading (0-100 scale; values above 100 clamp visually). */
  current: number | null;
  /** History as [epochSeconds, value] pairs, oldest first. */
  points: Array<[number, number]>;
  /** Status decided by the server; drives every color in the panel. */
  status: OkResourceStatus;
  /** Optional server message shown in the status band / unreadable state. */
  message: string | null;
}

/** Thresholds received from the server; only used for the gauge zone gradient. */
export interface OkResourceThresholds {
  warning: number;
  critical: number;
}

/** Optional upgrade call-to-action. */
export interface OkResourceUpgrade {
  show: boolean;
  message: string;
  url: string;
}

// Status → theme token (--ion-color-*), same palette ok-gauge examples use.
const STATUS_COLOR: Record<OkResourceStatus, string> = {
  ok: 'var(--ion-color-success, #2dd36f)',
  warning: 'var(--ion-color-warning, #ffc409)',
  critical: 'var(--ion-color-danger, #eb445a)',
  unknown: 'var(--ion-color-medium, #92949c)',
};

export class OkResourceUsage extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      box-sizing: border-box;

      --ink: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --ink-muted: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --line: var(--ok-border-color, var(--ion-border-color, #e0e0e0));
      --track: var(--ok-track-color, var(--ion-color-light, #f4f5f8));
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      box-sizing: border-box;
    }

    .head {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .label {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--ink-muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .range {
      font-size: 0.6875rem;
      color: var(--ink-muted);
      font-variant-numeric: tabular-nums;
      border: 1px solid var(--line);
      border-radius: 999px;
      padding: 1px 8px;
    }

    .body {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .dial {
      flex: 0 0 auto;
    }
    .trend {
      flex: 1 1 auto;
      min-width: 0;
    }

    .status {
      font-size: 0.8125rem;
      border-radius: 8px;
      padding: 6px 10px;
      min-height: 1.25rem;
      box-sizing: border-box;
    }

    .unreadable {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 1rem;
      border: 1px dashed var(--line);
      border-radius: 8px;
      color: var(--ink-muted);
      background: var(--track);
    }
    .unreadable ion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }
    .unreadable-text {
      font-weight: 600;
      color: var(--ink);
    }
    .unreadable-message {
      font-size: 0.8125rem;
    }

    a.upgrade {
      align-self: flex-start;
      font-size: 0.8125rem;
      font-weight: 600;
      text-decoration: none;
      color: var(--ok-primary, var(--ion-color-primary, #3880ff));
    }
    a.upgrade:hover {
      text-decoration: underline;
    }
  `;

  /** Server-computed metric (reading + history + status). */
  @property({ attribute: false }) metric: OkResourceMetric = {
    known: false,
    current: null,
    points: [],
    status: 'unknown',
    message: null,
  };

  /** Server thresholds; only feed the gauge zone gradient. */
  @property({ attribute: false }) thresholds: OkResourceThresholds = {
    warning: 70,
    critical: 80,
  };

  /** Optional upgrade CTA; the link renders only when `show` is true. */
  @property({ attribute: false }) upgrade: OkResourceUpgrade | null = null;

  /** Panel heading (e.g. 'RAM'). */
  @property() label = '';

  /** Value suffix (default '%'). */
  @property() unit = '%';

  /** Small chip describing the history range (e.g. '3d'). */
  @property({ attribute: 'range-label' }) rangeLabel = '';

  /** Text of the not-measured state; the consumer passes its translation. */
  @property({ attribute: 'unreadable-label' }) unreadableLabel = 'Could not read it';

  // Every color in the panel derives from the received status (the server decides).
  private get statusColor(): string {
    return STATUS_COLOR[this.metric?.status] ?? STATUS_COLOR.unknown;
  }

  // Gauge zones from the received thresholds (the one place they are used).
  private get gaugeThresholds(): Array<{ to: number; color: string }> {
    const t = this.thresholds ?? { warning: 70, critical: 80 };
    return [
      { to: t.warning, color: STATUS_COLOR.ok },
      { to: t.critical, color: STATUS_COLOR.warning },
      { to: 100, color: STATUS_COLOR.critical },
    ];
  }

  private renderHead(): unknown {
    if (!this.label && !this.rangeLabel) return nothing;
    return html`<div class="head">
      ${this.label ? html`<span class="label">${this.label}</span>` : nothing}
      ${this.rangeLabel ? html`<span class="range">${this.rangeLabel}</span>` : nothing}
    </div>`;
  }

  // Not-measured state: icon + label, NEVER a gauge or a chart at zero.
  private renderUnreadable(): unknown {
    return html`<div class="unreadable" role="status">
      <ion-icon .icon=${iconAlertCircleOutline} aria-hidden="true"></ion-icon>
      <span class="unreadable-text">${this.unreadableLabel}</span>
      ${this.metric?.message
        ? html`<span class="unreadable-message">${this.metric.message}</span>`
        : nothing}
    </div>`;
  }

  private renderBody(): unknown {
    const m = this.metric;
    const real = m.current;
    const shown = real == null ? null : Math.min(real, 100); // visual clamp
    const points = m.points ?? [];
    return html`<div class="body">
        ${shown != null
          ? html`<div class="dial" title=${`${real}${this.unit}`}>
              <ok-gauge
                type="ring"
                size="110"
                unit=${this.unit}
                .value=${shown}
                .thresholds=${this.gaugeThresholds}
                .color=${this.statusColor}
              ></ok-gauge>
            </div>`
          : nothing}
        ${points.length
          ? html`<div class="trend">
              <ok-chart
                type="area"
                height="96"
                min="0"
                max="100"
                .series=${[{ color: this.statusColor, data: points.map(([, v]) => v) }]}
              ></ok-chart>
            </div>`
          : nothing}
      </div>
      <div
        class=${`status status--${m.status}`}
        style=${`background:color-mix(in srgb, ${this.statusColor} 15%, transparent);color:${this.statusColor};`}
      >
        ${m.message ?? nothing}
      </div>`;
  }

  private renderUpgrade(): unknown {
    if (!this.upgrade?.show) return nothing;
    return html`<a class="upgrade" href=${this.upgrade.url}>${this.upgrade.message}</a>`;
  }

  render(): unknown {
    return html`<div class="panel">
      ${this.renderHead()}
      ${this.metric?.known ? this.renderBody() : this.renderUnreadable()}
      ${this.renderUpgrade()}
    </div>`;
  }
}

define('ok-resource-usage', OkResourceUsage);

declare global {
  interface HTMLElementTagNameMap {
    'ok-resource-usage': OkResourceUsage;
  }
}
