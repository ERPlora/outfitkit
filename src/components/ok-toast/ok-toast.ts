import { LitElement } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-toast — wrapper de ion-toast. CSP-safe: NO usa toastController; crea un <ion-toast>
// imperativo, lo añade a document.body, lo presenta con `present()` y lo retira al cerrarse.
// El toast ya es un banner pequeño en Ionic → no tocamos su ancho.
//
// API (props): message · duration (def 2000) · color · position ('top'|'middle'|'bottom').
// Método imperativo: present().
// Evento: ok-dismiss con el detail nativo.
export class OkToast extends LitElement {
  /** Texto del toast. */
  @property() message = '';
  /** Duración en ms (0 = no auto-cierra). */
  @property({ type: Number }) duration = 2000;
  /** Color Ionic ('success', 'danger'…). */
  @property() color?: string;
  /** Posición. */
  @property() position: 'top' | 'middle' | 'bottom' = 'bottom';

  createRenderRoot(): this {
    this.style.display = 'none';
    return this;
  }

  /** Presenta el toast. Resuelve al cerrarse. */
  async present(): Promise<void> {
    const el = document.createElement('ion-toast') as HTMLElement & {
      message: string;
      duration: number;
      color?: string;
      position: 'top' | 'middle' | 'bottom';
      present: () => Promise<void>;
      onDidDismiss: () => Promise<{ role?: string; data?: unknown }>;
    };
    el.message = this.message;
    el.duration = this.duration;
    if (this.color) el.color = this.color;
    el.position = this.position;
    document.body.appendChild(el);
    await el.present();
    const detail = await el.onDidDismiss();
    this.dispatchEvent(
      new CustomEvent('ok-dismiss', { detail, bubbles: true, composed: true }),
    );
    el.remove();
  }
}

define('ok-toast', OkToast);

declare global {
  interface HTMLElementTagNameMap {
    'ok-toast': OkToast;
  }
}
