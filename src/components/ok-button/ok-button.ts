import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-button — wrapper de ion-button. El click nativo burbujea, no se re-emite.
// Slots: default (texto), `start`/`end` (iconos). `full` → ancho completo (expand=block).
export class OkButton extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    :host([full]) { display: block; }
    ion-button { --box-shadow: none; margin: 0; }
  `;

  /** Color Ionic ('primary', 'danger', 'medium'…). */
  @property() color?: string;
  /** Relleno: 'solid' (def) | 'outline' | 'clear'. */
  @property() fill?: 'solid' | 'outline' | 'clear';
  /** Tamaño: 'small' | 'default' | 'large'. */
  @property() size?: 'small' | 'default' | 'large';
  /** Renderiza como enlace si se da href. */
  @property() href?: string;
  /** Deshabilitado. */
  @property({ type: Boolean }) disabled = false;
  /** Ancho completo (ion expand=block). */
  @property({ type: Boolean, reflect: true }) full = false;
  /** Botón redondo (ion shape=round). */
  @property({ type: Boolean }) round = false;
  /** Nombre de un ion-icon → botón de SOLO icono (icon-only). Útil para barras de herramientas. */
  @property() icon?: string;

  render(): unknown {
    return html`<ion-button
      .color=${this.color}
      .fill=${this.fill}
      .size=${this.size}
      .href=${this.href}
      ?disabled=${this.disabled}
      expand=${this.full ? 'block' : ''}
      shape=${this.round ? 'round' : ''}
    >
      ${this.icon
        ? html`<ion-icon name=${this.icon} slot="icon-only"></ion-icon>`
        : html`<slot name="start" slot="start"></slot><slot></slot><slot name="end" slot="end"></slot>`}
    </ion-button>`;
  }
}

define('ok-button', OkButton);

declare global {
  interface HTMLElementTagNameMap {
    'ok-button': OkButton;
  }
}
