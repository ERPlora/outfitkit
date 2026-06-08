import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkActionSheetButton {
  text: string;
  role?: string;
  icon?: string;
}

// ok-action-sheet — wrapper de ion-action-sheet. CSP-safe: NO usa actionSheetController; crea un
// <ion-action-sheet> imperativo, lo añade a document.body y lo presenta con `present()`. Es una
// hoja inferior en móvil; en desktop Ionic ya la centra → no tocamos tamaño.
//
// API (props): header · buttons (Array<{ text, role?, icon? }>).
// Método imperativo: present().
// Evento: ok-dismiss con detail { role, data } (incluye el botón pulsado).
export class OkActionSheet extends LitElement {
  /** Título de la hoja. */
  @property() header?: string;
  /** Botones de acción. */
  @property({ attribute: false }) buttons: OkActionSheetButton[] = [];

  createRenderRoot(): this {
    this.style.display = 'none';
    return this;
  }

  /** Presenta la action sheet. Resuelve al cerrarse. */
  async present(): Promise<void> {
    const el = document.createElement('ion-action-sheet') as HTMLElement & {
      header?: string;
      buttons: OkActionSheetButton[];
      present: () => Promise<void>;
      onDidDismiss: () => Promise<{ role?: string; data?: unknown }>;
    };
    if (this.header) el.header = this.header;
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

define('ok-action-sheet', OkActionSheet);

declare global {
  interface HTMLElementTagNameMap {
    'ok-action-sheet': OkActionSheet;
  }
}
