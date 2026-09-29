import { LitElement, html, css } from 'lit';
import type { PropertyValues } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { iconRemove, iconTrendingDown, iconTrendingUp, okIcon } from '../../base/icons.js';

// ok-kpi — dashboard KPI card: label (muted) + value (large) + delta with colour and arrow.
// Optional default slot (e.g. a sparkline) under the value.
type OkKpiTrend = 'up' | 'down' | 'flat';

/** Smallest size the figure shrinks to before it is cut with an ellipsis (outfitkit#246). */
const MIN_VALUE_REM = 1;

/** Root font size in px: what 1rem is on this page. */
function rootPx(): number {
  const n = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(n) && n > 0 ? n : 16;
}

export class OkKpi extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      /* Own Ionic-style tokens (overridable): --ok-* → --ion-* → hex. */
      --background: var(--ok-card-background, var(--ion-card-background, var(--ion-background-color, #ffffff)));
      --color: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --label-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --border-color: var(--ok-border-color, var(--ion-border-color, rgba(0, 0, 0, 0.08)));
      --border-radius: var(--ok-radius, 12px);
      --box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
      --padding: 1rem 1.125rem;
      /* Trend colours. */
      --trend-up-color: var(--ok-color-success, var(--ion-color-success, #2dd36f));
      --trend-down-color: var(--ok-color-danger, var(--ion-color-danger, #eb445a));
      --trend-flat-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
    }

    .card {
      box-sizing: border-box;
      width: 100%;
      background: var(--background);
      color: var(--color);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--box-shadow);
      padding: var(--padding);
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
    }

    /* Top row: label + optional icon. */
    .top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .label {
      margin: 0;
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--label-color);
    }

    .label-icon {
      font-size: 1.25rem;
      color: var(--label-color);
      flex: 0 0 auto;
    }

    /* The figure is read on ONE line (outfitkit#246): it never wraps (Ionic's inherited
       overflow-wrap would split «18.405,00 €» at any character); fit() shrinks it to its width,
       and only below MIN_VALUE_REM is it cut with an ellipsis (full figure in the tooltip). */
    .value {
      margin: 0;
      font-size: 1.75rem;
      font-weight: 700;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Delta: arrow + text, coloured by trend. */
    .delta {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8125rem;
      font-weight: 600;
    }
    .delta ion-icon {
      font-size: 1rem;
    }
    .delta.up {
      color: var(--trend-up-color);
    }
    .delta.down {
      color: var(--trend-down-color);
    }
    .delta.flat {
      color: var(--trend-flat-color);
    }

    ::slotted(*) {
      margin-top: 0.25rem;
    }
  `;

  /** Label (muted, uppercase). */
  @property() label?: string;

  /** Main value (large, bold), always on one line: it shrinks to fit its card. */
  @property() value?: string;

  /** Change, e.g. '+12%'. */
  @property() delta?: string;

  /** Trend: 'up' | 'down' | 'flat'. Sets the colour and arrow of the delta. */
  @property() trend: OkKpiTrend = 'flat';

  /** Optional ion-icon name shown next to the label. */
  @property() icon?: string;

  private resizeObserver?: ResizeObserver;

  connectedCallback(): void {
    super.connectedCallback();
    this.resizeObserver = new ResizeObserver(() => this.fit());
    this.resizeObserver.observe(this);
    // A web font that arrives after the first measure changes the text width, not the box.
    document.fonts?.ready.then(() => this.fit());
  }

  disconnectedCallback(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    super.disconnectedCallback();
  }

  protected updated(changed: PropertyValues<this>): void {
    if (changed.has('value')) this.fit();
  }

  /**
   * Scale the figure down to its box: measured once at full size, the text width is linear in
   * the font size, so the size that fits is full * available / natural. Never below the floor.
   */
  private fit(): void {
    const el = this.renderRoot.querySelector<HTMLElement>('.value');
    if (!el) return;
    el.style.removeProperty('font-size');
    el.removeAttribute('title');
    const available = el.clientWidth;
    const natural = el.scrollWidth;
    if (available <= 0 || natural <= available) return;
    const fullPx = parseFloat(getComputedStyle(el).fontSize);
    if (!Number.isFinite(fullPx) || fullPx <= 0) return;
    const minPx = MIN_VALUE_REM * rootPx();
    const fitPx = Math.floor(((fullPx * available) / natural) * 10) / 10;
    el.style.fontSize = `${Math.max(minPx, fitPx)}px`;
    if (fitPx < minPx) el.title = this.value ?? '';
  }

  /** Arrow icon for the trend (baked SVG, see base/icons.ts). */
  private trendIcon(): string {
    if (this.trend === 'up') return iconTrendingUp;
    if (this.trend === 'down') return iconTrendingDown;
    return iconRemove;
  }

  render(): unknown {
    return html`
      <div class="card">
        <div class="top">
          ${this.label ? html`<p class="label">${this.label}</p>` : null}
          ${this.icon ? html`<ion-icon class="label-icon" .icon=${okIcon(this.icon)} aria-hidden="true"></ion-icon>` : null}
        </div>
        ${this.value ? html`<p class="value">${this.value}</p>` : null}
        ${this.delta
          ? html`<span class="delta ${this.trend}">
              <ion-icon .icon=${this.trendIcon()} aria-hidden="true"></ion-icon>${this.delta}
            </span>`
          : null}
        <slot></slot>
      </div>
    `;
  }
}

define('ok-kpi', OkKpi);

declare global {
  interface HTMLElementTagNameMap {
    'ok-kpi': OkKpi;
  }
}
