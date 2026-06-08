import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

// ok-toggle — wrapper de ion-toggle. Evento: ionChange→ok-change (detail `{ checked }`).
// Slot default = etiqueta opcional.
export class OkToggle extends LitElement {
  static styles = css`:host { display: inline-flex; align-items: center; }`;

  @property({ type: Boolean }) checked = false;
  @property({ type: Boolean }) disabled = false;
  @property() color?: string;

  private onChange = (e: Event): void => {
    this.checked = (e.target as HTMLInputElement & { checked: boolean }).checked;
    relay(this, e, 'ok-change');
  };

  render(): unknown {
    return html`<ion-toggle
      .checked=${this.checked}
      ?disabled=${this.disabled}
      .color=${this.color}
      @ionChange=${this.onChange}
    ><slot></slot></ion-toggle>`;
  }
}

define('ok-toggle', OkToggle);

declare global {
  interface HTMLElementTagNameMap {
    'ok-toggle': OkToggle;
  }
}
