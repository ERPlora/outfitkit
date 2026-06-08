import { define } from '../../base/define.js';

// ok-app-shell — shell de dashboard. Emite en LIGHT DOM la estructura NATIVA y CANÓNICA de Ionic,
// con CERO estilos propios: Ionic la posiciona entera (cabecera fija + contenido con scroll + menú
// lateral/drawer responsive). La clave es que el ion-header y el ion-content son hijos DIRECTOS de
// `.ion-page` (requisito de la CSS de Ionic), por eso el shell los crea él mismo en vez de envolver.
//
//   <ok-app-shell heading="Panel" when="md">
//     <ok-sidebar slot="sidebar">…navegación…</ok-sidebar>   <!-- va al ion-content del ion-menu -->
//     <ok-button slot="actions" icon="…"></ok-button>          <!-- va al final del toolbar -->
//     …contenido de la página…                                  <!-- va al ion-content principal -->
//   </ok-app-shell>
//
// El ion-menu-button del toolbar abre/cierra el menú en móvil (nativo). Navegación: el host
// escucha `ok-nav`/`ok-action` (este último lo emiten tus ok-button de acciones, no el shell).
let counter = 0;

export class OkAppShell extends HTMLElement {
  private built = false;

  connectedCallback(): void {
    if (this.built) return;
    this.built = true;

    const id = `ok-main-${++counter}`;
    const sidebar = this.querySelector(':scope > [slot="sidebar"]');
    const actions = Array.from(this.querySelectorAll(':scope > [slot="actions"]'));
    const body = Array.from(this.children).filter(
      (el) => el !== sidebar && !actions.includes(el),
    );

    const app = document.createElement('ion-app');
    const split = document.createElement('ion-split-pane');
    split.setAttribute('content-id', id);
    split.setAttribute('when', this.getAttribute('when') ?? 'lg');

    // Panel lateral: ion-menu (hijo directo del split) con su ion-content.
    const menu = document.createElement('ion-menu');
    menu.setAttribute('content-id', id);
    const menuContent = document.createElement('ion-content');
    if (sidebar) {
      sidebar.removeAttribute('slot');
      menuContent.appendChild(sidebar);
    }
    menu.appendChild(menuContent);

    // Panel principal: .ion-page con ion-header + ion-content como hijos DIRECTOS (layout Ionic).
    const page = document.createElement('div');
    page.className = 'ion-page';
    page.id = id;

    const header = document.createElement('ion-header');
    const toolbar = document.createElement('ion-toolbar');
    const startBtns = document.createElement('ion-buttons');
    startBtns.setAttribute('slot', 'start');
    startBtns.appendChild(document.createElement('ion-menu-button'));
    toolbar.appendChild(startBtns);
    const title = document.createElement('ion-title');
    title.textContent = this.getAttribute('heading') ?? '';
    toolbar.appendChild(title);
    if (actions.length) {
      const endBtns = document.createElement('ion-buttons');
      endBtns.setAttribute('slot', 'end');
      actions.forEach((el) => {
        el.removeAttribute('slot');
        endBtns.appendChild(el);
      });
      toolbar.appendChild(endBtns);
    }
    header.appendChild(toolbar);

    const content = document.createElement('ion-content');
    content.classList.add('ion-padding');
    body.forEach((el) => content.appendChild(el));

    page.append(header, content);
    split.append(menu, page);
    app.appendChild(split);
    this.appendChild(app);
  }
}

define('ok-app-shell', OkAppShell);

declare global {
  interface HTMLElementTagNameMap {
    'ok-app-shell': OkAppShell;
  }
}
