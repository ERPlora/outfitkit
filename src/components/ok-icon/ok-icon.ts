import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-icon — wrapper de ion-icon. `name` (ionicon) o `src` (URL svg). `size` 'small'|'large' o
// un valor CSS libre vía la var --ok-icon-size / atributo `font-size`.
export class OkIcon extends LitElement {
  static styles = css`
    :host { display: inline-flex; line-height: 0; }
    ion-icon { font-size: var(--ok-icon-size, inherit); color: inherit; }
  `;

  /** Nombre de un ionicon (p. ej. 'settings-outline'). */
  @property() name?: string;
  /** URL de un SVG (alternativa a name). */
  @property() src?: string;
  /** Color Ionic opcional. */
  @property() color?: string;
  /** Tamaño semántico Ionic: 'small' | 'large'. */
  @property() size?: 'small' | 'large';

  render(): unknown {
    return html`<ion-icon
      .name=${this.name}
      .src=${this.src}
      .color=${this.color}
      .size=${this.size}
      aria-hidden="true"
    ></ion-icon>`;
  }
}

define('ok-icon', OkIcon);

declare global {
  interface HTMLElementTagNameMap {
    'ok-icon': OkIcon;
  }
}
