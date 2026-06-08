import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// Familia ok-list / ok-item / ok-label — wrappers de ion-list/ion-item/ion-label.
// ok-item: slots `start`/`end` para iconos/controles + default para el contenido.
// El click nativo burbujea (no se re-emite); usa `button` para el estilo táctil de Ionic.

export class OkList extends LitElement {
  static styles = css`
    :host { display: block; }
    ion-list { background: transparent; }
  `;
  /** 'full' | 'inset' | 'none'. */
  @property() lines?: string;
  render(): unknown {
    return html`<ion-list .lines=${this.lines ?? 'none'}><slot></slot></ion-list>`;
  }
}

export class OkItem extends LitElement {
  static styles = css`:host { display: block; }`;
  /** Item interactivo (efecto ripple/hover de Ionic). */
  @property({ type: Boolean }) button = false;
  @property({ type: Boolean }) disabled = false;
  /** 'full' | 'inset' | 'none'. */
  @property() lines = 'none';
  /** Muestra el chevron de detalle. */
  @property({ type: Boolean }) detail = false;
  /** Navega como enlace si se da. */
  @property() href?: string;

  render(): unknown {
    return html`<ion-item
      ?button=${this.button}
      ?disabled=${this.disabled}
      .detail=${this.detail}
      .href=${this.href}
      .lines=${this.lines}
    >
      <slot name="start" slot="start"></slot>
      <slot></slot>
      <slot name="end" slot="end"></slot>
    </ion-item>`;
  }
}

export class OkLabel extends LitElement {
  static styles = css`:host { display: block; }`;
  render(): unknown {
    return html`<ion-label><slot></slot></ion-label>`;
  }
}

define('ok-list', OkList);
define('ok-item', OkItem);
define('ok-label', OkLabel);

declare global {
  interface HTMLElementTagNameMap {
    'ok-list': OkList;
    'ok-item': OkItem;
    'ok-label': OkLabel;
  }
}
