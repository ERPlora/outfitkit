import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-spinner — wrapper de ion-spinner.
export class OkSpinner extends LitElement {
  static styles = css`:host { display: inline-flex; }`;

  /** 'lines' | 'lines-small' | 'dots' | 'circular' | 'crescent'… */
  @property() name?: string;
  @property() color?: string;

  render(): unknown {
    return html`<ion-spinner .name=${this.name} .color=${this.color}></ion-spinner>`;
  }
}

define('ok-spinner', OkSpinner);

declare global {
  interface HTMLElementTagNameMap {
    'ok-spinner': OkSpinner;
  }
}
