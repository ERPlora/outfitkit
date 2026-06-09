import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-section — envoltorio de sección de marketing: eyebrow (píldora), título display,
// subtítulo y contenido (slot default). Quita el markup repetido de cada sección de la
// landing (encabezado centrado/alineado + separador superior opcional).
//
//   <ok-section eyebrow="Plataforma" heading="Todo en uno" subheading="…" align="center" divider>
//     …contenido…
//   </ok-section>
//
// Para títulos ricos (con <br> o <span> de color) usa los slots en vez de los atributos:
//   <ok-section align="center">
//     <span slot="eyebrow">Marketplace</span>
//     <h2 slot="heading">Un ecosistema. <span style="color:var(--ion-color-primary)">Dos modos.</span></h2>
//     <p slot="subheading">…</p>
//     …contenido…
//   </ok-section>
export class OkSection extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      --color: var(--ok-text, var(--ion-text-color, #18181b));
      --muted: var(--ok-muted, rgba(var(--ion-text-color-rgb, 24, 24, 27), 0.62));
      --primary: var(--ok-primary, var(--ion-color-primary, #1496d6));
      --max-width: var(--ok-container-max, 1140px);
      --pad-y: clamp(3rem, 7vw, 5.5rem);
      color: var(--color);
      font-family: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
    }
    :host([divider]) {
      border-top: 1px solid color-mix(in oklab, var(--color) 8%, transparent);
    }
    .wrap {
      max-width: var(--max-width);
      margin-inline: auto;
      padding: var(--pad-y) var(--ok-spacing, 1.25rem);
    }
    .head {
      display: flex;
      flex-direction: column;
      gap: 0.9rem;
      margin-bottom: clamp(2rem, 4vw, 3rem);
      max-width: 56ch;
    }
    :host([align='center']) .head {
      align-items: center;
      text-align: center;
      margin-inline: auto;
    }
    .eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      align-self: flex-start;
      padding: 0.28rem 0.7rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--primary);
      background: color-mix(in oklab, var(--primary) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary) 22%, transparent);
    }
    :host([align='center']) .eyebrow { align-self: center; }
    ::slotted([slot='eyebrow']) {
      color: var(--primary);
      font-weight: 600;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .title {
      margin: 0;
      font-size: clamp(1.75rem, 1.1rem + 2.6vw, 2.85rem);
      line-height: 1.06;
      letter-spacing: -0.025em;
      font-weight: 650;
    }
    ::slotted([slot='heading']) {
      margin: 0;
      font-size: clamp(1.75rem, 1.1rem + 2.6vw, 2.85rem);
      line-height: 1.06;
      letter-spacing: -0.025em;
      font-weight: 650;
    }
    .sub {
      margin: 0;
      font-size: clamp(1rem, 0.95rem + 0.3vw, 1.15rem);
      line-height: 1.55;
      color: var(--muted);
    }
    ::slotted([slot='subheading']) {
      margin: 0;
      font-size: clamp(1rem, 0.95rem + 0.3vw, 1.15rem);
      line-height: 1.55;
      color: var(--muted);
    }
  `;

  /** Texto de la píldora superior (eyebrow). Para markup rico usa slot="eyebrow". */
  @property() eyebrow?: string;
  /** Título de la sección. Para markup rico (br/span) usa slot="heading". */
  @property() heading?: string;
  /** Subtítulo. Para markup rico usa slot="subheading". */
  @property() subheading?: string;
  /** Alineación del encabezado: 'left' (def) | 'center'. */
  @property({ reflect: true }) align: 'left' | 'center' = 'left';
  /** Dibuja un separador superior (1px) — reflejado como atributo. */
  @property({ type: Boolean, reflect: true }) divider = false;

  render(): unknown {
    return html`
      <div class="wrap">
        <header class="head">
          ${this.eyebrow
            ? html`<span class="eyebrow">${this.eyebrow}</span>`
            : html`<slot name="eyebrow"></slot>`}
          ${this.heading
            ? html`<h2 class="title">${this.heading}</h2>`
            : html`<slot name="heading"></slot>`}
          ${this.subheading
            ? html`<p class="sub">${this.subheading}</p>`
            : html`<slot name="subheading"></slot>`}
        </header>
        <div class="body"><slot></slot></div>
      </div>
    `;
  }
}

define('ok-section', OkSection);

declare global {
  interface HTMLElementTagNameMap {
    'ok-section': OkSection;
  }
}
