import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

// ok-modal — wrapper de ion-modal. CSP-safe: NO usa modalController (no importamos @ionic/core);
// renderiza un <ion-modal> en el shadow DOM y lo abre/cierra con su prop nativa `is-open`
// (declarativa, sin eval). El contenido va en el slot default y se proyecta dentro del ion-modal.
//
// API:
//   • prop reflejada `open` (Boolean) — fuente de verdad del estado.
//   • métodos imperativos `open()` / `close()`  (sí, `open` es a la vez prop y método: el método
//     gana por ser una función en el prototipo; para LEER el estado usa la prop reflejada como
//     atributo `[open]` o el método `isOpen()`).
//   • slot (default) = contenido del diálogo.
//   • evento `ok-dismiss` (re-emite ionDidDismiss) con su `detail` nativo.
//
// TAMAÑO DESKTOP: por defecto ion-modal ocupa toda la pantalla. Aquí lo acotamos a un diálogo
// CENTRADO usando SOLO las CSS vars NATIVAS de ion-modal (no estilos inventados): --width,
// --max-width, --height, --border-radius. En móvil, si pasas `sheet` o quitas el max-width vía
// token, recupera el tamaño natural de Ionic.
export class OkModal extends LitElement {
  static styles = css`
    :host { display: contents; }
  `;

  /** Estado abierto/cerrado (reflejado como atributo). */
  @property({ type: Boolean, reflect: true }) open = false;
  /** Permite cerrar tocando el backdrop (def. true). */
  @property({ type: Boolean, attribute: 'backdrop-dismiss' }) backdropDismiss = true;

  /** Abre el modal de forma imperativa. (No se llama `open()` porque `open` es la prop reflejada.) */
  show(): void {
    this.open = true;
  }
  /** Cierra el modal de forma imperativa. */
  close(): void {
    this.open = false;
  }
  /** Devuelve si está abierto. */
  isOpen(): boolean {
    return this.open;
  }

  private onDismiss = (e: Event): void => {
    this.open = false;
    relay(this, e, 'ok-dismiss');
  };

  render(): unknown {
    return html`<ion-modal
      ?is-open=${this.open}
      ?backdrop-dismiss=${this.backdropDismiss}
      @ionDidDismiss=${this.onDismiss}
      style="
        --width: var(--ok-modal-width, min(560px, 92vw));
        --max-width: var(--ok-modal-max-width, 560px);
        --height: var(--ok-modal-height, auto);
        --border-radius: var(--ok-modal-radius, 12px);
      "
    >
      <slot></slot>
    </ion-modal>`;
  }
}

define('ok-modal', OkModal);

declare global {
  interface HTMLElementTagNameMap {
    'ok-modal': OkModal;
  }
}
