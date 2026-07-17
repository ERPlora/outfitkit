import { LitElement, html, css, nothing } from 'lit';
import { property, query } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { iconSearchOutline, iconCloseOutline, okIcon } from '../../base/icons.js';

// ok-spotlight-search — buscador estilo SPOTLIGHT (macOS): un overlay translúcido flotante
// (arriba-centro, fondo desenfocado) que NO rompe la vista de debajo. Ionic no lo trae. Aporta SOLO
// el CHROME (input hero + ✕ + panel + backdrop + autofoco + Esc); los RESULTADOS los pone y estila
// el CONSUMIDOR vía el slot por defecto (y las acciones vía slot="footer"), así sirve para cualquier
// búsqueda (productos, clientes, …) con datos síncronos o async.
//
// El overlay es un <dialog> NATIVO con showModal(): se pinta en el TOP LAYER del navegador, inmune
// al containing block de cualquier ancestro (un ion-toolbar con transform/contain atrapa a un
// position:fixed → el panel saldría recortado). Y el <dialog> vive en el shadow root, así que
// conserva este CSS y proyecta los slots del consumidor con normalidad.
//
//   • prop `open`         → abierto/cerrado (reflejado a atributo)
//   • prop `placeholder`  → texto guía del input
//   • prop `value`        → texto de búsqueda (bidi: el consumidor puede resetearlo)
//   • prop `trigger-icon` → si se da, pinta su propio botón-icono que abre el overlay; si no, el
//                           consumidor controla `open` (p.ej. desde una lupa externa)
//   • prop `trigger-label`→ nombre accesible del botón-trigger (aria-label)
// Métodos públicos: open() / close() / toggle().
// Eventos (bubbles + composed):
//   • `ok-input` detail { value }  al teclear
//   • `ok-open`  detail { open }   al abrir/cerrar
export class OkSpotlightSearch extends LitElement {
  static styles = css`
    :host {
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --color-muted: var(--ok-text-muted, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.6));
      --panel-bg: var(--ok-surface, var(--ion-background-color, #ffffff));
      --scrim-bg: var(--ok-scrim, rgba(0, 0, 0, 0.28));
      --border-soft: var(--ok-border-soft, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.1));
      --radius: var(--ok-radius, 16px);
      --shadow: var(--ok-shadow, 0 24px 80px rgba(0, 0, 0, 0.35));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);
      display: contents;
    }

    /* Botón-trigger opcional (icon-only). */
    button.trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2.4rem;
      height: 2.4rem;
      padding: 0;
      border: 0;
      border-radius: 10px;
      background: none;
      color: var(--color-muted);
      cursor: pointer;
    }
    button.trigger[data-assigned] { color: var(--ok-primary, var(--ion-color-primary, #3880ff)); }
    button.trigger ion-icon { font-size: 1.35rem; }

    /* El <dialog> flota arriba-centro, translúcido con blur (Spotlight). El top layer lo saca de
       cualquier containing block. */
    dialog {
      margin: 10vh auto auto;
      width: min(92vw, 36rem);
      max-height: 72vh;
      padding: 0;
      border: none;
      border-radius: var(--radius);
      overflow: hidden;
      color: var(--color);
      font-family: var(--font);
      background: color-mix(in srgb, var(--panel-bg) 80%, transparent);
      -webkit-backdrop-filter: blur(22px) saturate(180%);
      backdrop-filter: blur(22px) saturate(180%);
      box-shadow: var(--shadow), 0 0 0 1px rgba(128, 128, 128, 0.18);
    }
    dialog::backdrop {
      background: var(--scrim-bg);
      -webkit-backdrop-filter: blur(3px);
      backdrop-filter: blur(3px);
    }

    /* Fila del input hero + cierre. */
    .top {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.7rem 0.85rem;
      border-bottom: 1px solid var(--border-soft);
    }
    .top .lupa { flex: 0 0 auto; font-size: 1.25rem; color: var(--color-muted); }
    .top input {
      flex: 1 1 auto;
      min-width: 0;
      border: 0;
      outline: none;
      background: none;
      color: inherit;
      font: inherit;
      font-size: 1.05rem;
    }
    .top input::placeholder { color: var(--color-muted); }
    .top .close {
      flex: 0 0 auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 2rem;
      height: 2rem;
      padding: 0;
      border: 0;
      border-radius: 8px;
      background: none;
      color: var(--color-muted);
      cursor: pointer;
    }
    .top .close ion-icon { font-size: 1.2rem; }

    /* Cuerpo scrollable: aquí caen los resultados del consumidor (slot por defecto). */
    .results { max-height: 56vh; overflow-y: auto; padding: 0.35rem; }
    .footer:not(:empty) { border-top: 1px solid var(--border-soft); padding: 0.3rem 0.6rem; }

    @media (max-width: 560px) {
      dialog { margin: 0 auto auto; width: 100vw; max-width: 100vw; max-height: 100vh; height: auto; border-radius: 0; }
    }
  `;

  /** Abierto/cerrado (reflejado para CSS externo). */
  @property({ type: Boolean, reflect: true }) open = false;
  /** Texto guía del input de búsqueda. */
  @property() placeholder = '';
  /** Texto de búsqueda actual (el consumidor puede resetearlo). */
  @property() value = '';
  /** Icono (Iconify/ionicon) del botón-trigger propio; si vacío, no se pinta trigger. */
  @property({ attribute: 'trigger-icon' }) triggerIcon = '';
  /** Nombre accesible del botón-trigger (aria-label). */
  @property({ attribute: 'trigger-label' }) triggerLabel = '';

  @query('.top input') private input?: HTMLInputElement;

  // ── API pública ──────────────────────────────────────────────────────────
  openSearch(): void {
    if (this.open) return;
    this.open = true;
    this.emitOpen(true);
  }

  close(): void {
    if (!this.open) return;
    this.open = false;
    this.emitOpen(false);
  }

  toggle(): void {
    this.open ? this.close() : this.openSearch();
  }

  private emitOpen(open: boolean): void {
    this.dispatchEvent(new CustomEvent('ok-open', { detail: { open }, bubbles: true, composed: true }));
  }

  private onInput(e: Event): void {
    this.value = (e.target as HTMLInputElement).value;
    this.dispatchEvent(new CustomEvent('ok-input', { detail: { value: this.value }, bubbles: true, composed: true }));
  }

  // Sincroniza `open` ↔ el <dialog> nativo (top layer). try/catch porque happy-dom (tests) no
  // implementa showModal/close; ahí `open` sigue siendo la verdad.
  protected updated(): void {
    const d = this.renderRoot.querySelector('dialog') as HTMLDialogElement | null;
    if (!d) return;
    try {
      if (this.open && !d.open) {
        d.showModal();
        this.input?.focus();
      } else if (!this.open && d.open) {
        d.close();
      }
    } catch {
      /* entorno sin <dialog> modal */
    }
  }

  render(): unknown {
    return html`
      ${this.triggerIcon
        ? html`<button class="trigger" ?data-assigned=${this.open} aria-label=${this.triggerLabel || this.placeholder}
            title=${this.triggerLabel || this.placeholder} @click=${() => this.openSearch()}>
            <ion-icon .icon=${okIcon(this.triggerIcon)}></ion-icon>
          </button>`
        : nothing}

      <dialog aria-label=${this.triggerLabel || this.placeholder}
        @close=${() => { if (this.open) { this.open = false; this.emitOpen(false); } }}
        @click=${(e: Event) => { if (e.target === e.currentTarget) this.close(); }}>
        <div class="top">
          <ion-icon class="lupa" .icon=${iconSearchOutline}></ion-icon>
          <input type="text" .value=${this.value} placeholder=${this.placeholder}
            aria-label=${this.placeholder} autocomplete="off" spellcheck="false"
            @input=${(e: Event) => this.onInput(e)} />
          <button class="close" aria-label="Cerrar" @click=${() => this.close()}>
            <ion-icon .icon=${iconCloseOutline}></ion-icon>
          </button>
        </div>
        <div class="results"><slot></slot></div>
        <div class="footer"><slot name="footer"></slot></div>
      </dialog>
    `;
  }
}

define('ok-spotlight-search', OkSpotlightSearch);

declare global {
  interface HTMLElementTagNameMap {
    'ok-spotlight-search': OkSpotlightSearch;
  }
}
