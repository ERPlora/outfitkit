import { define } from '../../base/define.js';

// ok-split-pane — wrapper FINO de ion-split-pane. CERO estilos propios: usa el layout responsive
// nativo de Ionic. Se usa IGUAL que en Ionic, con `content-id` y un id por panel (el panel
// principal lleva ese id; los demás son laterales):
//   <ok-split-pane content-id="main">
//     <ok-menu content-id="main"> … </ok-menu>   <!-- panel lateral -->
//     <div id="main"> … </div>                     <!-- panel principal -->
//   </ok-split-pane>
//
// Renderiza en LIGHT DOM (reubica sus hijos dentro de un ion-split-pane interno una sola vez):
// ion-split-pane clasifica sus hijos por id, y eso NO funciona a través de <slot>/shadow DOM
// (verificado: con slot, ion-split-pane solo ve el <slot> y no asigna split-pane-main).
const PASS_ATTRS = ['content-id', 'when', 'disabled'];

export class OkSplitPane extends HTMLElement {
  private inner: HTMLElement | null = null;

  connectedCallback(): void {
    if (this.inner) return;
    const sp = document.createElement('ion-split-pane');
    for (const a of PASS_ATTRS) {
      const v = this.getAttribute(a);
      if (v !== null) sp.setAttribute(a, v);
    }
    while (this.firstChild) sp.appendChild(this.firstChild);
    this.appendChild(sp);
    this.inner = sp;
  }
}

define('ok-split-pane', OkSplitPane);

declare global {
  interface HTMLElementTagNameMap {
    'ok-split-pane': OkSplitPane;
  }
}
