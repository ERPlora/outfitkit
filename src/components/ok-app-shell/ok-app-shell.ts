import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-app-shell — layout de dashboard AUTOCONTENIDO (no usa ion-split-pane/ion-menu, que dependen
// del contexto de app Ionic y del acoplamiento por id en el documento → se rompen entre shadow DOM
// y en templates Django sueltos). Implementa el patrón sidebar+contenido con CSS grid y, en móvil,
// un drawer off-canvas con scrim. Así el MISMO shell sirve idéntico en Django y en el Hub (Lit).
//
// Slots:  slot="sidebar" → el menú lateral (p. ej. <ok-sidebar>);  default → el contenido.
// Estado: atributo `menu-open` (reflejado) abre el drawer en móvil. Escucha el evento
//         `ok-menu-toggle` (lo emite <ok-topbar>) y cierra al pulsar el scrim o navegar (`ok-nav`).
export class OkAppShell extends LitElement {
  static styles = css`
    :host {
      --sidebar-width: var(--ok-sidebar-width, 256px);
      --background: var(--ok-bg, var(--ion-background-color, #f4f4f5));
      --breakpoint: 992px;
      display: block;
      block-size: 100%;
      background: var(--background);
    }
    .grid {
      display: grid;
      grid-template-columns: var(--sidebar-width) 1fr;
      block-size: 100%;
      min-block-size: 100vh;
    }
    .aside {
      grid-column: 1;
      block-size: 100%;
      min-block-size: 0;
      border-inline-end: 1px solid var(--ok-border, rgba(0, 0, 0, 0.08));
      background: var(--ok-surface, var(--ion-item-background, #fff));
      overflow: hidden;
    }
    .main {
      grid-column: 2;
      min-inline-size: 0;
      display: flex;
      flex-direction: column;
    }
    .scrim { display: none; }

    /* ── Móvil: sidebar como drawer off-canvas ───────────────────────────── */
    @media (max-width: 991.98px) {
      .grid { grid-template-columns: 1fr; }
      .aside {
        position: fixed;
        inset-block: 0;
        inset-inline-start: 0;
        inline-size: var(--sidebar-width);
        max-inline-size: 80vw;
        transform: translateX(-100%);
        transition: transform 0.25s ease;
        z-index: 1000;
        box-shadow: 0 0 40px rgba(0, 0, 0, 0.18);
      }
      .main { grid-column: 1; }
      :host([menu-open]) .aside { transform: translateX(0); }
      :host([menu-open]) .scrim {
        display: block;
        position: fixed;
        inset: 0;
        z-index: 999;
        background: rgba(0, 0, 0, 0.4);
      }
    }
  `;

  /** Drawer abierto (solo aplica en el breakpoint móvil). */
  @property({ type: Boolean, reflect: true, attribute: 'menu-open' }) menuOpen = false;

  connectedCallback(): void {
    super.connectedCallback();
    // El topbar emite ok-menu-toggle; navegar (ok-nav) cierra el drawer en móvil.
    this.addEventListener('ok-menu-toggle', this.toggle as EventListener);
    this.addEventListener('ok-nav', this.close as EventListener);
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener('ok-menu-toggle', this.toggle as EventListener);
    this.removeEventListener('ok-nav', this.close as EventListener);
  }

  private toggle = (): void => {
    this.menuOpen = !this.menuOpen;
  };

  private close = (): void => {
    this.menuOpen = false;
  };

  render(): unknown {
    return html`
      <div class="grid">
        <aside class="aside"><slot name="sidebar"></slot></aside>
        <div class="main"><slot></slot></div>
      </div>
      <div class="scrim" @click=${this.close}></div>
    `;
  }
}

define('ok-app-shell', OkAppShell);

declare global {
  interface HTMLElementTagNameMap {
    'ok-app-shell': OkAppShell;
  }
}
