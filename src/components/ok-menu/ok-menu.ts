import { define } from '../../base/define.js';

// ok-menu — wrapper FINO de ion-menu (panel lateral / drawer). CERO estilos propios: usa ion-menu
// nativo. Se usa IGUAL que en Ionic, con `content-id` apuntando al id del panel principal:
//   <ok-menu content-id="main"> <ion-content> … </ion-content> </ok-menu>
// El `ion-menu-button` del toolbar lo abre/cierra solo (mecánica nativa de Ionic); en desktop, si
// va dentro de un ok-split-pane, Ionic lo muestra fijo. Light DOM por el mismo motivo que
// ok-split-pane (ion-menu se relaciona por id con su contenido).
const PASS_ATTRS = ['content-id', 'menu-id', 'side', 'type', 'disabled', 'swipe-gesture'];

export class OkMenu extends HTMLElement {
  private inner: HTMLElement | null = null;

  connectedCallback(): void {
    if (this.inner) return;
    const menu = document.createElement('ion-menu');
    for (const a of PASS_ATTRS) {
      const v = this.getAttribute(a);
      if (v !== null) menu.setAttribute(a, v);
    }
    while (this.firstChild) menu.appendChild(this.firstChild);
    this.appendChild(menu);
    this.inner = menu;
  }
}

define('ok-menu', OkMenu);

declare global {
  interface HTMLElementTagNameMap {
    'ok-menu': OkMenu;
  }
}
