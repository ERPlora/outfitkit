import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-page — andamiaje de página (port de PageScaffold.tsx, sin ion-page). Compone una cabecera
// (slot `header`, normalmente <ok-topbar>) + una zona de contenido con scroll y padding. Va dentro
// del slot de contenido de <ok-app-shell>.
//   <ok-page>
//     <ok-topbar slot="header" heading="Empleados"></ok-topbar>
//     …contenido…
//   </ok-page>
export class OkPage extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      block-size: 100%;
      min-block-size: 0;
    }
    .content {
      flex: 1;
      min-block-size: 0;
      overflow-y: auto;
      padding: var(--ok-page-padding, 20px);
    }
    :host([flush]) .content { padding: 0; }
  `;

  /** Sin padding en el contenido. */
  @property({ type: Boolean, reflect: true }) flush = false;

  render(): unknown {
    return html`
      <slot name="header"></slot>
      <div class="content"><slot></slot></div>
    `;
  }
}

define('ok-page', OkPage);

declare global {
  interface HTMLElementTagNameMap {
    'ok-page': OkPage;
  }
}
