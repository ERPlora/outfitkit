import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkTabbarItem {
  value: string;
  label: string;
  /** Nombre de un ionicon opcional. */
  icon?: string;
}

// ok-tabbar — wrapper FINO de ion-tab-bar / ion-tab-button (barra de pestañas inferior). Sin
// estilos propios: usa el aspecto nativo de Ionic. Los botones llegan por la prop de datos `items`
// (hijos tipados → prop, ver docs/CONVENTIONS.md). Evento `ok-change` { value } al pulsar.
export class OkTabbar extends LitElement {
  // Item flex de altura fija cuando va al fondo de un panel; sin estilos cosméticos.
  static styles = css`
    :host { display: block; flex: 0 0 auto; }
  `;

  /** Botones de la barra. */
  @property({ attribute: false }) items: OkTabbarItem[] = [];
  /** Valor seleccionado. */
  @property() value = '';

  private select(value: string): void {
    this.value = value;
    this.dispatchEvent(
      new CustomEvent('ok-change', { detail: { value }, bubbles: true, composed: true }),
    );
  }

  render(): unknown {
    return html`<ion-tab-bar .selectedTab=${this.value}>
      ${this.items.map(
        (it) => html`<ion-tab-button tab=${it.value} @click=${() => this.select(it.value)}>
          ${it.icon ? html`<ion-icon .name=${it.icon}></ion-icon>` : ''}
          <ion-label>${it.label}</ion-label>
        </ion-tab-button>`,
      )}
    </ion-tab-bar>`;
  }
}

define('ok-tabbar', OkTabbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-tabbar': OkTabbar;
  }
}
