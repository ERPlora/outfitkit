import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export interface OkHeaderAction {
  /** Id que se emite en `ok-action`. */
  id: string;
  label: string;
  /** Nombre de un ionicon. */
  icon: string;
  /** Si es true, siempre visible (no colapsa en el overflow móvil). */
  pinned?: boolean;
}

// ok-topbar — cabecera de página (port de PageHeader.tsx). Botón de menú (hamburguesa) que emite
// `ok-menu-toggle` (lo recoge <ok-app-shell> en móvil); botón atrás opcional (emite `ok-back`);
// título; y acciones (`actions`) que emiten `ok-action` { id }. Las no-`pinned` colapsan en un
// overflow en móvil. Slot `title` para personalizar la zona del título.
export class OkTopbar extends LitElement {
  static styles = css`
    :host {
      --background: var(--ok-surface, var(--ion-toolbar-background, #fff));
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --muted: var(--ok-muted, var(--ion-color-medium, #92949c));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
      display: block;
      position: sticky;
      inset-block-start: 0;
      z-index: 10;
      background: var(--background);
      color: var(--color);
      border-block-end: 1px solid var(--ok-border, rgba(0, 0, 0, 0.08));
      font-family: var(--font);
    }
    .bar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; min-block-size: 56px; }
    .title { flex: 1; min-inline-size: 0; font-size: 18px; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .actions { display: flex; align-items: center; gap: 2px; position: relative; }
    button.icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      inline-size: 40px;
      block-size: 40px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--color);
      cursor: pointer;
    }
    button.icon:hover { background: var(--ok-surface-2, var(--ion-color-step-100, #f1f1f4)); }
    button.icon ion-icon { font-size: 22px; }
    .menu-btn { display: none; }
    .collapsible { display: inline-flex; }
    .more { display: none; }
    .overflow {
      position: absolute;
      inset-block-start: 46px;
      inset-inline-end: 0;
      min-inline-size: 200px;
      background: var(--background);
      border: 1px solid var(--ok-border, rgba(0, 0, 0, 0.12));
      border-radius: 10px;
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
      padding: 6px;
      z-index: 20;
    }
    .overflow button {
      display: flex;
      align-items: center;
      gap: 10px;
      inline-size: 100%;
      box-sizing: border-box;
      padding: 10px 12px;
      border: 0;
      border-radius: 8px;
      background: transparent;
      color: var(--color);
      font: inherit;
      font-size: 14px;
      cursor: pointer;
      text-align: start;
    }
    .overflow button:hover { background: var(--ok-surface-2, var(--ion-color-step-100, #f1f1f4)); }

    @media (max-width: 991.98px) { .menu-btn { display: inline-flex; } }
    @media (max-width: 639.98px) {
      .collapsible { display: none; }
      .more { display: inline-flex; }
    }
  `;

  @property() heading = '';
  /** Si se da, muestra el botón atrás (emite `ok-back`) en lugar del de menú. */
  @property({ attribute: 'back-href' }) backHref?: string;
  /** Acciones de cabecera. */
  @property({ attribute: false }) actions: OkHeaderAction[] = [];

  @state() private overflowOpen = false;

  private emit(type: string, detail?: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }

  private onAction(id: string): void {
    this.overflowOpen = false;
    this.emit('ok-action', { id });
  }

  render(): unknown {
    const pinned = this.actions.filter((a) => a.pinned);
    const collapsible = this.actions.filter((a) => !a.pinned);

    return html`
      <div class="bar">
        ${this.backHref
          ? html`<button class="icon" aria-label="Atrás" @click=${() => this.emit('ok-back')}>
              <ion-icon name="arrow-back-outline"></ion-icon>
            </button>`
          : html`<button
              class="icon menu-btn"
              aria-label="Menú"
              @click=${() => this.emit('ok-menu-toggle')}
            >
              <ion-icon name="menu-outline"></ion-icon>
            </button>`}

        <div class="title"><slot name="title">${this.heading}</slot></div>

        <div class="actions">
          ${pinned.map(
            (a) => html`<button class="icon" aria-label=${a.label} @click=${() => this.onAction(a.id)}>
              <ion-icon .name=${a.icon}></ion-icon>
            </button>`,
          )}
          ${collapsible.map(
            (a) => html`<button
              class="icon collapsible"
              aria-label=${a.label}
              @click=${() => this.onAction(a.id)}
            >
              <ion-icon .name=${a.icon}></ion-icon>
            </button>`,
          )}
          ${collapsible.length
            ? html`<button
                class="icon more"
                aria-label="Más opciones"
                @click=${() => (this.overflowOpen = !this.overflowOpen)}
              >
                <ion-icon name="ellipsis-vertical-outline"></ion-icon>
              </button>`
            : ''}
          ${this.overflowOpen
            ? html`<div class="overflow">
                ${collapsible.map(
                  (a) => html`<button @click=${() => this.onAction(a.id)}>
                    <ion-icon .name=${a.icon}></ion-icon><span>${a.label}</span>
                  </button>`,
                )}
              </div>`
            : ''}
        </div>
      </div>
    `;
  }
}

define('ok-topbar', OkTopbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-topbar': OkTopbar;
  }
}
