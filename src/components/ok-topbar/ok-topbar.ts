import { LitElement, html } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkHeaderAction {
  /** Id que se emite en `ok-action`. */
  id: string;
  label: string;
  /** Nombre de un ionicon. */
  icon: string;
}

// ok-topbar — wrapper FINO de ion-header + ion-toolbar. CERO estilos propios: es el toolbar NATIVO
// de Ionic. El `ion-menu-button` abre/cierra el ion-menu (vía ok-menu) de forma nativa; si hay
// `back-href` se usa `ion-back-button`. Las `actions` son ion-button con icon-only que emiten
// `ok-action` { id }. Slots: `title` (zona del título), `start`/`end` (extras en el toolbar).
export class OkTopbar extends LitElement {
  // Sin Shadow DOM: el toolbar es de Ionic y debe vivir en el árbol del documento (los
  // ion-buttons/ion-title usan slots de ion-toolbar, que no atraviesan otro shadow root).
  protected createRenderRoot(): HTMLElement {
    return this;
  }

  @property() heading = '';
  /** Si se da, muestra el botón atrás (ion-back-button) en lugar del de menú. */
  @property({ attribute: 'back-href' }) backHref?: string;
  /** Oculta el ion-menu-button (p. ej. páginas sin menú lateral). */
  @property({ type: Boolean, attribute: 'no-menu-button' }) noMenuButton = false;
  /** Acciones de cabecera (ion-button icon-only en slot end). */
  @property({ attribute: false }) actions: OkHeaderAction[] = [];

  private onAction(id: string): void {
    this.dispatchEvent(
      new CustomEvent('ok-action', { detail: { id }, bubbles: true, composed: true }),
    );
  }

  render(): unknown {
    return html`<ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          ${this.backHref
            ? html`<ion-back-button default-href=${this.backHref}></ion-back-button>`
            : this.noMenuButton
              ? ''
              : html`<ion-menu-button></ion-menu-button>`}
          <slot name="start"></slot>
        </ion-buttons>
        <ion-title>${this.heading}<slot name="title"></slot></ion-title>
        <ion-buttons slot="end">
          <slot name="end"></slot>
          ${this.actions.map(
            (a) => html`<ion-button aria-label=${a.label} @click=${() => this.onAction(a.id)}>
              <ion-icon slot="icon-only" .name=${a.icon}></ion-icon>
            </ion-button>`,
          )}
        </ion-buttons>
      </ion-toolbar>
    </ion-header>`;
  }
}

define('ok-topbar', OkTopbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-topbar': OkTopbar;
  }
}
