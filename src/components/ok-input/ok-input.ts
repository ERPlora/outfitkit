import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

// ok-input — wrapper de ion-input. Eventos normalizados: ionInput→ok-input, ionChange→ok-change
// (detail `{ value }`), ionBlur→ok-blur, ionFocus→ok-focus.
export class OkInput extends LitElement {
  // Sin estilos propios: usa el aspecto nativo de ion-input.
  static styles = css`
    :host { display: block; }
  `;

  @property() value = '';
  @property() placeholder?: string;
  /** text | email | password | number | tel | search | url. */
  @property() type = 'text';
  @property() name?: string;
  @property({ type: Boolean }) disabled = false;
  @property({ type: Boolean }) readonly = false;
  /** Etiqueta flotante opcional (ion label). */
  @property() label?: string;
  /** 'stacked' | 'floating' | 'fixed'. */
  @property({ attribute: 'label-placement' }) labelPlacement?: string;

  render(): unknown {
    return html`<ion-input
      .value=${this.value}
      .type=${this.type}
      .name=${this.name}
      .label=${this.label}
      .labelPlacement=${this.labelPlacement}
      placeholder=${this.placeholder ?? ''}
      ?disabled=${this.disabled}
      ?readonly=${this.readonly}
      @ionInput=${(e: Event) => relay(this, e, 'ok-input')}
      @ionChange=${(e: Event) => relay(this, e, 'ok-change')}
      @ionBlur=${(e: Event) => relay(this, e, 'ok-blur')}
      @ionFocus=${(e: Event) => relay(this, e, 'ok-focus')}
    ></ion-input>`;
  }
}

define('ok-input', OkInput);

declare global {
  interface HTMLElementTagNameMap {
    'ok-input': OkInput;
  }
}
