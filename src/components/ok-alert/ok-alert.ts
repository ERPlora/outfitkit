import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkAlertButton {
  text: string;
  role?: string;
}

// ok-alert — wrapper de ion-alert. CSP-safe: NO usa alertController (no importamos @ionic/core);
// crea un <ion-alert> imperativo, lo añade a document.body, lo presenta con su método nativo
// `present()` y lo retira en ionDidDismiss. ion-alert ya sale CENTRADO y acotado en Ionic
// (no full-width) → no añadimos tamaño propio.
//
// API (props):
//   • header / sub-header / message — textos.
//   • buttons — Array<string | { text, role }>. Por defecto un botón "Aceptar".
// Método imperativo: present().
// Evento: ok-dismiss con detail { role, data } (lo que devuelve ionDidDismiss).
//
// El componente en sí NO renderiza nada en su shadow (display:none): es un disparador imperativo.
export class OkAlert extends LitElement {
  /** Título del alert. */
  @property() header?: string;
  /** Subtítulo. */
  @property({ attribute: 'sub-header' }) subHeader?: string;
  /** Mensaje. */
  @property() message?: string;
  /** Botones: strings o { text, role }. */
  @property({ attribute: false }) buttons: Array<string | OkAlertButton> = ['Aceptar'];

  createRenderRoot(): this {
    // Sin shadow DOM ni render: es un trigger imperativo. Lo ocultamos en el flujo.
    this.style.display = 'none';
    return this;
  }

  /** Presenta el alert. Devuelve una promesa que resuelve al cerrarse. */
  async present(): Promise<void> {
    const el = document.createElement('ion-alert') as HTMLElement & {
      header?: string;
      subHeader?: string;
      message?: string;
      buttons: Array<string | OkAlertButton>;
      present: () => Promise<void>;
      onDidDismiss: () => Promise<{ role?: string; data?: unknown }>;
    };
    if (this.header) el.header = this.header;
    if (this.subHeader) el.subHeader = this.subHeader;
    if (this.message) el.message = this.message;
    el.buttons = this.buttons;
    document.body.appendChild(el);
    await el.present();
    const detail = await el.onDidDismiss();
    this.dispatchEvent(
      new CustomEvent('ok-dismiss', { detail, bubbles: true, composed: true }),
    );
    el.remove();
  }
}

define('ok-alert', OkAlert);

declare global {
  interface HTMLElementTagNameMap {
    'ok-alert': OkAlert;
  }
}
