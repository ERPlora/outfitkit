import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-hero — sección hero de marketing. Slots:
//   • slot="eyebrow"  → categoría / contexto breve
//   • slot="title"    → titular (pon un <h1> dentro → SEO)
//   • slot="subtitle" → subtítulo
//   • slot="actions"  → CTAs
//   • slot (default)  → media / contenido extra
// Contenido por slot (light DOM) → SEO crawlable.
export type OkHeroAlign = 'center' | 'split';
export type OkHeroTone = 'neutral' | 'soft' | 'gradient';

export class OkHero extends LitElement {
  @property({ reflect: true }) align: OkHeroAlign = 'center';
  @property({ reflect: true }) tone: OkHeroTone = 'soft';
  @property({ type: Boolean, reflect: true }) compact = false;

  @state() private hasEyebrow = false;
  @state() private hasActions = false;
  @state() private hasMedia = false;

  static styles = css`
    :host {
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --color-muted: var(--ok-muted, rgba(var(--ion-text-color-rgb, 24, 24, 27), 0.68));
      --surface: var(--ok-surface, var(--ion-background-color, #fff));
      --surface-soft: var(--ok-surface-soft, var(--ion-color-light, #f4f5f8));
      --primary: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --max-width: var(--ok-container-max, 1140px);
      --padding: var(--ok-spacing, var(--ion-padding, 16px));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
      --font-display: var(--ok-font-display, var(--font));

      display: block;
      color: var(--color);
      font-family: var(--font);
      overflow: hidden;
      border-bottom: 1px solid color-mix(in oklab, var(--color) 8%, transparent);
    }
    :host([tone='neutral']) { background: var(--surface); }
    :host([tone='soft']) {
      background: color-mix(in oklab, var(--surface-soft) 54%, var(--surface));
    }
    :host([tone='gradient']) {
      background:
        radial-gradient(circle at 20% 0%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 42%),
        color-mix(in oklab, var(--surface-soft) 42%, var(--surface));
    }

    .layout {
      max-width: var(--max-width);
      margin-inline: auto;
      padding: clamp(3.5rem, 7vw, 6rem) var(--padding);
      display: grid;
      align-items: center;
    }
    :host([compact]) .layout {
      padding-block: clamp(2.5rem, 5vw, 4rem);
    }
    .copy {
      min-width: 0;
      max-width: 52rem;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    :host([align='center']) .copy {
      align-items: center;
      text-align: center;
      margin-inline: auto;
    }
    :host([align='split']) .layout {
      grid-template-columns: minmax(0, 1fr) minmax(18rem, 0.8fr);
      gap: clamp(2rem, 6vw, 5rem);
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      align-self: flex-start;
      margin: 0 0 1.25rem;
      padding: 0.28rem 0.7rem;
      border: 1px solid color-mix(in oklab, var(--primary) 22%, transparent);
      border-radius: 999px;
      color: var(--primary);
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      font-size: var(--ok-type-eyebrow-size, 0.72rem);
      font-weight: var(--ok-type-eyebrow-weight, 600);
      line-height: var(--ok-type-eyebrow-leading, 1.2);
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .eyebrow.empty { display: none; }
    :host([align='center']) .eyebrow {
      align-self: center;
    }
    .eyebrow ::slotted([slot='eyebrow']) {
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      color: inherit !important;
      background: transparent !important;
      font: inherit !important;
      letter-spacing: inherit !important;
      line-height: inherit !important;
      text-transform: inherit !important;
    }
    .title {
      max-width: 52rem;
      margin: 0;
      font-family: var(--font-display);
      font-size: var(--ok-type-page-title-size, clamp(2.35rem, 1.75rem + 2.6vw, 4rem));
      font-weight: var(--ok-type-page-title-weight, 650);
      line-height: var(--ok-type-page-title-leading, 1.04);
      letter-spacing: -0.045em;
      text-wrap: balance;
    }
    :host([compact]) .title {
      font-size: var(--ok-type-page-title-compact-size, clamp(2rem, 1.55rem + 2vw, 3.25rem));
    }
    .title ::slotted([slot='title']) {
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      color: inherit !important;
      background: transparent !important;
      font: inherit !important;
      letter-spacing: inherit !important;
      line-height: inherit !important;
      text-wrap: inherit !important;
    }
    .subtitle {
      max-width: 46rem;
      margin: 1.5rem 0 0;
      color: var(--color-muted);
      font-size: var(--ok-type-intro-size, clamp(1rem, 0.95rem + 0.25vw, 1.125rem));
      line-height: var(--ok-type-intro-leading, 1.6);
      text-wrap: pretty;
    }
    .subtitle ::slotted([slot='subtitle']) {
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      color: inherit !important;
      background: transparent !important;
      font: inherit !important;
      letter-spacing: inherit !important;
      line-height: inherit !important;
      text-wrap: inherit !important;
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 1.5rem;
    }
    :host([align='center']) .actions { justify-content: center; }
    .actions.empty,
    .media.empty { display: none; }
    .media {
      min-width: 0;
      width: 100%;
      margin-top: 2rem;
    }
    :host([align='split']) .media { margin-top: 0; }

    @media (max-width: 767px) {
      .layout { padding-block: 2.75rem 3rem; }
      :host([compact]) .layout { padding-block: 2.25rem 2.5rem; }
      :host([align='split']) .layout {
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      .eyebrow { margin-bottom: 1rem; }
      .subtitle { margin-top: 1.25rem; line-height: 1.5; }
      .actions { width: 100%; }
    }
  `;

  connectedCallback(): void {
    super.connectedCallback();
    this.refreshSlotState();
  }

  private refreshSlotState(): void {
    this.hasEyebrow = this.querySelector('[slot="eyebrow"]') !== null;
    this.hasActions = this.querySelector('[slot="actions"]') !== null;
    this.hasMedia = [...this.childNodes].some((node) => {
      if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').trim().length > 0;
      return node.nodeType === Node.ELEMENT_NODE && !(node as Element).hasAttribute('slot');
    });
  }

  private onSlotChange = (): void => this.refreshSlotState();

  render(): unknown {
    return html`
      <section class="layout">
        <header class="copy">
          <div class=${this.hasEyebrow ? 'eyebrow' : 'eyebrow empty'}>
            <slot name="eyebrow" @slotchange=${this.onSlotChange}></slot>
          </div>
          <div class="title"><slot name="title" @slotchange=${this.onSlotChange}></slot></div>
          <div class="subtitle"><slot name="subtitle" @slotchange=${this.onSlotChange}></slot></div>
          <div class=${this.hasActions ? 'actions' : 'actions empty'}>
            <slot name="actions" @slotchange=${this.onSlotChange}></slot>
          </div>
        </header>
        <div class=${this.hasMedia ? 'media' : 'media empty'}>
          <slot @slotchange=${this.onSlotChange}></slot>
        </div>
      </section>
    `;
  }
}

define('ok-hero', OkHero);

declare global {
  interface HTMLElementTagNameMap {
    'ok-hero': OkHero;
  }
}
