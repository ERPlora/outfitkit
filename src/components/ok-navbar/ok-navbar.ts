import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-navbar — barra de navegación web responsive (el hueco que Ionic no cubre: ion-menu es un
// drawer de app que exige ion-app + content-id; esto es una navbar de landing autocontenida).
// En MÓVIL el burger abre un PANEL OFFCANVAS deslizante desde la DERECHA con scrim (estilo
// Bootstrap / ion-menu side="end"), sin header ni footer: solo los enlaces. Cierra al pulsar el
// scrim, un enlace o Esc. Slots:
//   • slot="brand"   → logo / nombre (izquierda, siempre visible)
//   • slot (default) → enlaces de navegación (en línea en desktop; dentro del offcanvas en móvil)
//   • slot="actions" → CTAs (login, "Empezar"); visibles siempre en la barra
// Contenido por slot (light DOM) → SEO crawlable. Atributos: `sticky`, `open`.
export class OkNavbar extends LitElement {
  static styles = css`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex */
      --background: var(--ok-surface, var(--ion-card-background, #ffffff));
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --border-color: var(--ok-border, rgba(var(--ion-text-color-rgb, 24, 24, 27), 0.12));
      --border-color-soft: var(--ok-border-soft, rgba(var(--ion-text-color-rgb, 24, 24, 27), 0.07));
      --primary-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --max-width: var(--ok-container-max, 1140px);
      --padding: var(--ok-spacing, var(--ion-padding, 16px));
      --panel-width: var(--ok-navbar-panel-width, min(320px, 86vw));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      display: block;
      background: var(--background);
      border-bottom: 1px solid var(--border-color);
      color: var(--color);
      font-family: var(--font);
    }
    :host([sticky]) { position: sticky; top: 0; z-index: 50; }
    .bar {
      position: relative;
      max-width: var(--max-width);
      margin-inline: auto;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.6rem var(--padding);
    }
    .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 700; }
    .spacer { flex: 1; }
    .links { display: flex; align-items: center; }
    .links-inner { display: flex; align-items: center; gap: 1.25rem; }
    .actions { display: flex; align-items: center; gap: 0.5rem; }
    ::slotted(a) {
      color: var(--color);
      text-decoration: none;
      font-size: 0.95rem;
      /* Micro-interacción: transición sutil en color al hacer hover. */
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    /* Hover de enlaces solo con ratón (evita estados pegados en táctil). */
    @media (hover: hover) {
      ::slotted(a:hover) { color: var(--primary-color); }
    }

    /* Scrim del offcanvas (solo móvil). */
    .scrim { display: none; }

    .burger {
      display: none;
      background: none;
      border: 0;
      cursor: pointer;
      padding: 0.5rem;
      color: var(--color);
      /* Micro-interacción: feedback sutil al presionar el burger. */
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease), border-color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease), transform 120ms ease;
    }
    @media (hover: hover) {
      .burger:hover { color: var(--primary-color); }
    }
    .burger:active { transform: scale(var(--ok-press-scale, 0.97)); }
    @media (prefers-reduced-motion: reduce) {
      ::slotted(a):active, .burger:hover, .burger:active { transform: none; }
    }
    .burger span { display: block; width: 22px; height: 2px; background: currentColor; border-radius: 2px; position: relative; transition: background 0.2s ease; }
    .burger span::before, .burger span::after { content: ''; position: absolute; left: 0; width: 22px; height: 2px; background: currentColor; border-radius: 2px; transition: transform 0.2s ease, top 0.2s ease; }
    .burger span::before { top: -7px; }
    .burger span::after { top: 7px; }
    /* Burger → X cuando el panel está abierto (estado anunciado por aria-expanded). */
    :host([open]) .burger span { background: transparent; }
    :host([open]) .burger span::before { top: 0; transform: rotate(45deg); }
    :host([open]) .burger span::after { top: 0; transform: rotate(-45deg); }

    /* ── Móvil: el burger abre el panel offcanvas a la derecha ──────────────── */
    @media (max-width: 800px) {
      .burger { display: block; position: relative; z-index: 61; }

      .scrim {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.42);
        z-index: 55;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      :host([open]) .scrim { opacity: 1; pointer-events: auto; }

      .links {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: var(--panel-width);
        background: var(--background);
        border-left: 1px solid var(--border-color);
        box-shadow: -12px 0 40px rgba(0, 0, 0, 0.18);
        transform: translateX(100%);
        transition: transform 0.25s ease;
        z-index: 60;
        padding: 4.25rem var(--padding) var(--padding);
        overflow-y: auto;
      }
      :host([open]) .links { transform: translateX(0); }
      .links-inner { flex-direction: column; align-items: stretch; gap: 0; }
      ::slotted(a) { display: block; padding: 0.85rem 0; border-top: 1px solid var(--border-color-soft); }
      ::slotted(a:first-child) { border-top: 0; }
    }
    @media (prefers-reduced-motion: reduce) {
      .links, .scrim { transition: none; }
    }
  `;

  /** Fija la navbar arriba al hacer scroll. */
  @property({ type: Boolean, reflect: true }) sticky = false;
  /** Estado del panel offcanvas móvil (reflejado para el selector :host([open])). */
  @property({ type: Boolean, reflect: true }) open = false;

  connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('keydown', this.onKeydown);
  }
  disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('keydown', this.onKeydown);
  }

  private toggle(): void {
    this.open = !this.open;
  }
  private close = (): void => {
    this.open = false;
  };
  private onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.open) this.open = false;
  };
  // Cierra el panel al pulsar un enlace (UX offcanvas).
  private onLinkClick = (e: Event): void => {
    if (this.open && (e.target as Element)?.closest('a')) this.open = false;
  };

  render(): unknown {
    return html`
      <nav class="bar">
        <div class="brand"><slot name="brand"></slot></div>
        <div class="spacer"></div>
        <div class="links" id="ok-nav-links">
          <div class="links-inner" @click=${this.onLinkClick}><slot></slot></div>
        </div>
        <div class="actions"><slot name="actions"></slot></div>
        <button
          class="burger"
          aria-label="Menú"
          aria-controls="ok-nav-links"
          aria-expanded=${this.open ? 'true' : 'false'}
          @click=${this.toggle}
        >
          <span></span>
        </button>
      </nav>
      <div class="scrim" @click=${this.close}></div>
    `;
  }
}

define('ok-navbar', OkNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-navbar': OkNavbar;
  }
}
