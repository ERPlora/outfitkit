import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-chip — wrapper de ion-chip. Slots `start`/`end` (iconos) + default (texto). El click
// nativo burbujea.
export class OkChip extends LitElement {
  static styles = css`:host { display: inline-flex; }`;

  @property() color?: string;
  /** Aspecto: outline. */
  @property({ type: Boolean }) outline = false;
  @property({ type: Boolean }) disabled = false;

  render(): unknown {
    return html`<ion-chip .color=${this.color} .outline=${this.outline} ?disabled=${this.disabled}>
      <slot name="start"></slot>
      <slot></slot>
      <slot name="end"></slot>
    </ion-chip>`;
  }
}

define('ok-chip', OkChip);

declare global {
  interface HTMLElementTagNameMap {
    'ok-chip': OkChip;
  }
}
