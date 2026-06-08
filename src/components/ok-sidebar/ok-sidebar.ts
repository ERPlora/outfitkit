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

// ok-sidebar — menú lateral del dashboard (port de SideMenu.tsx + dashboard-shell.css). Sin
// router: navegación por DATOS (`sections`) + estado activo por `active-path`; al pulsar un ítem
// emite `ok-nav` { path }. Footer de cuenta con avatar → emite `ok-account`. La marca entra por
// los slots `brand` (logo) y `switcher` (p. ej. un <ok-segment> Hub/Cloud).
export class OkSidebar extends LitElement {
  static styles = css`
    :host {
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --muted: var(--ok-muted, var(--ion-color-medium, #92949c));
      --primary: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --primary-rgb: var(--ion-color-primary-rgb, 56, 128, 255);
      --hover: var(--ok-surface-2, var(--ion-color-step-100, #f1f1f4));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
      display: flex;
      flex-direction: column;
      block-size: 100%;
      color: var(--color);
      font-family: var(--font);
    }
    .brand { padding: 14px 16px 6px; }
    .switcher { padding: 0 12px 6px; }
    nav { flex: 1; overflow-y: auto; padding: 8px 12px 16px; }
    .section-label {
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 18px 8px 6px;
    }
    .item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      inline-size: 100%;
      box-sizing: border-box;
      min-block-size: 42px;
      margin: 2px 0;
      padding: 0 12px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--muted);
      font: inherit;
      font-size: 14.5px;
      font-weight: 500;
      text-align: start;
      text-decoration: none;
      cursor: pointer;
    }
    .item:hover { background: var(--hover); }
    .item ion-icon { font-size: 20px; }
    .item.active {
      background: rgba(var(--primary-rgb), 0.12);
      color: var(--primary);
      font-weight: 600;
    }
    .item.active::before {
      content: '';
      position: absolute;
      inset-inline-start: -12px;
      inset-block-start: 50%;
      transform: translateY(-50%);
      inline-size: 3px;
      block-size: 18px;
      border-radius: 0 3px 3px 0;
      background: var(--primary);
    }
    footer { border-block-start: 1px solid var(--ok-border, rgba(0, 0, 0, 0.08)); padding: 8px; }
    .account {
      display: flex;
      align-items: center;
      gap: 12px;
      inline-size: 100%;
      box-sizing: border-box;
      padding: 8px 10px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      cursor: pointer;
      text-align: start;
      color: var(--color);
      font: inherit;
    }
    .account:hover { background: var(--hover); }
    .avatar {
      display: grid;
      place-items: center;
      inline-size: 40px;
      block-size: 40px;
      flex: 0 0 40px;
      border-radius: 999px;
      background: #d9ccff;
      color: #7058bf;
      font-size: 14px;
      font-weight: 800;
      overflow: hidden;
    }
    .avatar img { inline-size: 100%; block-size: 100%; border-radius: inherit; object-fit: cover; }
    .who { min-inline-size: 0; }
    .who .name { font-weight: 700; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .who .email { font-size: 12px; opacity: 0.6; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  `;

  /** Secciones de navegación. */
  @property({ attribute: false }) sections: OkNavSection[] = [];
  /** Ruta activa (resalta el ítem correspondiente). */
  @property({ attribute: 'active-path' }) activePath = '';
  /** Usuario del footer de cuenta. */
  @property({ attribute: false }) user: OkSidebarUser | null = null;

  private initials(name: string): string {
    return (
      name
        .trim()
        .split(/\s+/)
        .map((s) => s[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || '?'
    );
  }

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
      <div class="brand"><slot name="brand"></slot></div>
      <div class="switcher"><slot name="switcher"></slot></div>
      <nav>
        ${this.sections.map(
          (section) => html`
            <div class="section-label">${section.label}</div>
            ${section.items.map(
              (it) => html`<button
                class="item ${it.path === this.activePath ? 'active' : ''}"
                @click=${() => this.go(it.path)}
              >
                ${it.icon ? html`<ion-icon .name=${it.icon}></ion-icon>` : ''}
                <span>${it.label}</span>
              </button>`,
            )}
          `,
        )}
      </nav>
      ${u
        ? html`<footer>
            <button class="account" @click=${this.account} aria-label="Cuenta">
              <span class="avatar">
                ${u.avatarUrl
                  ? html`<img src=${u.avatarUrl} alt="" />`
                  : this.initials(u.name)}
              </span>
              <span class="who">
                <div class="name">${u.name}</div>
                ${u.email ? html`<div class="email">${u.email}</div>` : ''}
              </span>
            </button>
          </footer>`
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
