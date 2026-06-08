import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkNavItem {
  /** Ruta/id que se emite en `ok-nav`. */
  path: string;
  label: string;
  /** Nombre de un ionicon opcional. */
  icon?: string;
}

export interface OkNavSection {
  label: string;
  items: OkNavItem[];
}

export interface OkSidebarUser {
  name: string;
  email?: string | null;
  avatarUrl?: string | null;
}

// ok-sidebar — navegación lateral por DATOS (`sections`) construida con componentes NATIVOS de
// Ionic (ion-list / ion-item / ion-label / ion-icon / ion-list-header). Sin estilos propios: el
// ítem activo (`active-path`) se marca con el color primary nativo de Ionic. Al pulsar emite
// `ok-nav` { path }; el footer de cuenta emite `ok-account`. Va dentro de un ion-content (p. ej.
// <ok-menu><ion-content><ok-sidebar>…). Sin router: el host cablea la navegación con `ok-nav`.
export class OkSidebar extends LitElement {
  // Solo display; el aspecto lo ponen los componentes Ionic.
  static styles = css`
    :host { display: block; }
  `;

  /** Secciones de navegación. */
  @property({ attribute: false }) sections: OkNavSection[] = [];
  /** Ruta activa (resalta el ítem correspondiente). */
  @property({ attribute: 'active-path' }) activePath = '';
  /** Usuario del footer de cuenta (opcional). */
  @property({ attribute: false }) user: OkSidebarUser | null = null;

  private go(path: string): void {
    this.dispatchEvent(
      new CustomEvent('ok-nav', { detail: { path }, bubbles: true, composed: true }),
    );
  }

  private account(): void {
    this.dispatchEvent(new CustomEvent('ok-account', { bubbles: true, composed: true }));
  }

  render(): unknown {
    const u = this.user;
    return html`
      <slot name="brand"></slot>
      <slot name="switcher"></slot>
      ${this.sections.map(
        (section) => html`<ion-list>
          <ion-list-header>${section.label}</ion-list-header>
          ${section.items.map(
            (it) => html`<ion-item
              button
              detail="false"
              .color=${it.path === this.activePath ? 'primary' : undefined}
              @click=${() => this.go(it.path)}
            >
              ${it.icon ? html`<ion-icon slot="start" .name=${it.icon}></ion-icon>` : ''}
              <ion-label>${it.label}</ion-label>
            </ion-item>`,
          )}
        </ion-list>`,
      )}
      ${u
        ? html`<ion-list>
            <ion-item button detail="false" @click=${this.account}>
              <ion-label>
                <h3>${u.name}</h3>
                ${u.email ? html`<p>${u.email}</p>` : ''}
              </ion-label>
            </ion-item>
          </ion-list>`
        : ''}
    `;
  }
}

define('ok-sidebar', OkSidebar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-sidebar': OkSidebar;
  }
}
