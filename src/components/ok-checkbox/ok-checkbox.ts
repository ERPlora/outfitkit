import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

// ok-checkbox — wrapper de ion-checkbox. Evento: ionChange→ok-change (detail `{ checked }`).
// Slot default = etiqueta opcional.
export class OkCheckbox extends LitElement {
  static styles = css`:host { display: inline-flex; align-items: center; }`;

  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) indeterminate = false;
  @property({ type: Boolean }) disabled = false;
  @property() color?: string;

  private onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement & { checked: boolean }).checked;
    relay(this, e, 'ok-change');
  };

  render(): unknown {
    return html`<ion-checkbox
      .checked=${this.checked}
      .indeterminate=${this.indeterminate}
      ?disabled=${this.disabled}
      .color=${this.color}
      @ionChange=${this.onChange}
    ><slot></slot></ion-checkbox>`;
  }
}

define('ok-checkbox', OkCheckbox);

declare global {
  interface HTMLElementTagNameMap {
    'ok-checkbox': OkCheckbox;
  }
}
