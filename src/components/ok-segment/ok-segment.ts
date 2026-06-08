import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

export interface OkSegmentItem {
  value: string;
  label: string;
  /** Nombre de un ionicon opcional, a la izquierda del label. */
  icon?: string;
}

// ok-segment — wrapper de ion-segment (tabs/segmented). Los botones llegan por la prop `items`
// (NO por hijos ion-segment-button: ver docs/CONVENTIONS.md §5). Evento: ionChange→ok-change
// `{ value }`. Reproduce el aspecto del segment Hub/Cloud del shell (dashboard-shell.css).
export class OkSegment extends LitElement {
  static styles = css`
    :host { display: block; }
    ion-segment {
      background: var(--ok-surface-2, var(--ion-color-step-100, #f1f1f4));
      border-radius: var(--ok-radius, 10px);
      padding: 3px;
    }
    ion-segment-button {
      --border-radius: 8px;
      --indicator-color: var(--ok-surface, var(--ion-background-color, #fff));
      --color: var(--ok-muted, var(--ion-color-medium, #92949c));
      --color-checked: var(--ok-text, var(--ion-text-color, #1c1b17));
      min-height: 32px;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }
    ion-segment-button ion-icon { margin-inline-end: 6px; font-size: 16px; }
  `;

  /** Botones del segmento. */
  @property({ attribute: false }) items: OkSegmentItem[] = [];
  /** Valor seleccionado. */
  @property() value?: string;
  /** 'md' | 'ios'. */
  @property() mode?: 'md' | 'ios';
  /** Permite scroll horizontal cuando hay muchos. */
  @property({ type: Boolean }) scrollable = false;

  render(): unknown {
    return html`<ion-segment
      .value=${this.value}
      .mode=${this.mode}
      ?scrollable=${this.scrollable}
      @ionChange=${(e: Event) => relay(this, e, 'ok-change')}
    >
      ${this.items.map(
        (it) => html`<ion-segment-button .value=${it.value} layout="icon-start">
          ${it.icon ? html`<ion-icon .name=${it.icon}></ion-icon>` : ''}
          <ion-label>${it.label}</ion-label>
        </ion-segment-button>`,
      )}
    </ion-segment>`;
  }
}

define('ok-segment', OkSegment);

declare global {
  interface HTMLElementTagNameMap {
    'ok-segment': OkSegment;
  }
}
