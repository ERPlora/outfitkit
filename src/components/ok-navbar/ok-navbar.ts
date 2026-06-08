import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-navbar — barra de navegación web responsive con BURGER en móvil (el hueco que Ionic
// no cubre: ion-menu es un drawer de app, no una navbar de landing). Slots:
//   • slot="brand"   → logo / nombre (izquierda)
//   • slot (default) → enlaces de navegación (centro/derecha; se colapsan en móvil)
//   • slot="actions" → CTAs (login, "Empezar"); visibles siempre
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
    ::slotted(a) { color: var(--color); text-decoration: none; font-size: 0.95rem; }
    ::slotted(a:hover) { color: var(--primary-color); }
    .burger {
      display: none;
      background: none;
      border: 0;
      cursor: pointer;
      padding: 0.5rem;
      color: var(--color);
    }
    .burger span { display: block; width: 22px; height: 2px; background: currentColor; border-radius: 2px; position: relative; transition: background 0.2s ease; }
    .burger span::before, .burger span::after { content: ''; position: absolute; left: 0; width: 22px; height: 2px; background: currentColor; border-radius: 2px; transition: transform 0.2s ease, top 0.2s ease; }
    .burger span::before { top: -7px; }
    .burger span::after { top: 7px; }
    /* Burger → X cuando el panel está abierto (accesible: el estado se anuncia por aria-expanded). */
    :host([open]) .burger span { background: transparent; }
    :host([open]) .burger span::before { top: 0; transform: rotate(45deg); }
    :host([open]) .burger span::after { top: 0; transform: rotate(-45deg); }
    @media (max-width: 800px) {
      .burger { display: block; }
      .links {
        position: absolute;
        left: 0;
        right: 0;
        top: 100%;
        background: var(--background);
        border-bottom: 1px solid var(--border-color);
        padding: 0 var(--padding);
        /* Desplegable animado (Bootstrap/Tailwind-like) vía grid-rows 0fr→1fr, sin medir alturas. */
        display: grid;
        grid-template-rows: 0fr;
        transition: grid-template-rows 0.22s ease;
      }
      .links-inner {
        flex-direction: column;
        align-items: stretch;
        gap: 0;
        overflow: hidden;
        min-height: 0;
      }
      :host([open]) .links { grid-template-rows: 1fr; }
      ::slotted(a) { display: block; padding: 0.7rem 0; border-top: 1px solid var(--border-color-soft); }
      ::slotted(a:first-child) { border-top: 0; }
    }
  `;

  /** Fija la navbar arriba al hacer scroll. */
  @property({ type: Boolean, reflect: true }) sticky = false;
  /** Estado del panel móvil (reflejado para el selector :host([open])). */
  @property({ type: Boolean, reflect: true }) open = false;

  private toggle(): void {
    this.open = !this.open;
  }

  // Cierra el panel móvil al pulsar un enlace de navegación (UX Bootstrap/Tailwind).
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
    `;
  }
}

define('ok-navbar', OkNavbar);

declare global {
  interface HTMLElementTagNameMap {
    'ok-navbar': OkNavbar;
  }
}
