import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

// ok-searchbar — wrapper de ion-searchbar. Eventos: ionInput→ok-input, ionChange→ok-change
// (detail `{ value }`).
export class OkSearchbar extends LitElement {
  static styles = css`
    :host {
      --background: var(--ok-surface-2, var(--ion-color-step-50, #f4f4f5));
      --border-radius: var(--ok-radius, 10px);
      display: block;
    }
    ion-searchbar {
      --background: var(--background);
      --border-radius: var(--border-radius);
      --box-shadow: none;
      padding: 0;
    }
  `;

  @property() value = '';
  @property() placeholder = 'Buscar';
  @property({ type: Boolean }) disabled = false;
  /** ms de debounce del ionInput. */
  @property({ type: Number }) debounce = 200;

  render(): unknown {
    return html`<ion-searchbar
      .value=${this.value}
      .debounce=${this.debounce}
      placeholder=${this.placeholder}
      ?disabled=${this.disabled}
      @ionInput=${(e: Event) => relay(this, e, 'ok-input')}
      @ionChange=${(e: Event) => relay(this, e, 'ok-change')}
    ></ion-searchbar>`;
  }
}

define('ok-searchbar', OkSearchbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-searchbar': OkSearchbar;
  }
}
