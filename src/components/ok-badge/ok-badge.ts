import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-badge — wrapper de ion-badge. Slot default = texto.
export class OkBadge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    ion-badge { font-weight: 600; }
  `;

  /** Color Ionic ('primary', 'success', 'danger', 'medium'…). */
  @property() color?: string;

  render(): unknown {
    return html`<ion-badge .color=${this.color}><slot></slot></ion-badge>`;
  }
}

define('ok-badge', OkBadge);

declare global {
  interface HTMLElementTagNameMap {
    'ok-badge': OkBadge;
  }
}
