import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-pinpad — teclado numérico (PIN): rejilla 1-9, 0 y borrar. Muestra arriba los dígitos
// introducidos (o • si `masked`). Con `length` fija el tamaño y emite `ok-complete` al alcanzarlo.
// AUTOCONTENIDO: CSS propio en el shadow. Usa `ion-button` por tecla (lo registra el host) e
// `ion-icon` (backspace) para el borrado.
//   • prop `value`   → valor actual (string de dígitos)
//   • prop `length`  → longitud objetivo (opcional); al alcanzarla emite `ok-complete`
//   • prop `masked`  → muestra • en lugar de los dígitos en la pantalla
// Eventos (bubbles + composed):
//   • `ok-input`     detail { value }   — en cada pulsación/borrado
//   • `ok-complete`  detail { value }   — al alcanzar `length` (si está definida)

// Textos traducibles (default inglés). Pásalos desde fuera vía la prop `labels`.
export interface OkPinpadLabels {
  /** aria-label del grupo de teclas. */
  keypad: string;
  /** aria-label de la tecla de borrado. */
  backspace: string;
}

const DEFAULT_LABELS: OkPinpadLabels = {
  keypad: 'Number pad',
  backspace: 'Delete',
};

export class OkPinpad extends LitElement {
  static styles = css`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex */
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --dot-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --display-bg: var(--ok-hover, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.04));
      --border-radius: var(--ok-radius, 8px);
      --gap: var(--ok-pinpad-gap, 0.6rem);
      --key-size: var(--ok-pinpad-key-size, 4rem);
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      display: inline-flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--gap);
      font-family: var(--font);
      color: var(--color);
    }
    /* Pantalla superior con los dígitos o puntos. */
    .display {
      min-height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      padding: 0.4rem 0.6rem;
      background: var(--display-bg);
      border-radius: var(--border-radius);
      font-size: 1.5rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      min-width: calc(var(--key-size) * 3 + var(--gap) * 2);
      box-sizing: border-box;
    }
    .display .dot {
      width: 0.7rem;
      height: 0.7rem;
      border-radius: 50%;
      background: var(--dot-color);
    }
    .display .placeholder {
      opacity: 0.4;
      font-weight: 400;
      font-size: 1rem;
    }
    /* Variante dots: N círculos grandes (estilo PIN clásico), sin barra de fondo. */
    .circles {
      min-height: 2.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--ok-pinpad-circle-gap, 0.9rem);
    }
    .circle {
      width: var(--ok-pinpad-circle-size, 1rem);
      height: var(--ok-pinpad-circle-size, 1rem);
      border-radius: 50%;
      border: 2px solid var(--ok-pinpad-circle-border, var(--ion-color-medium, #92949c));
      background: transparent;
      box-sizing: border-box;
      transition: background 0.15s, border-color 0.15s;
    }
    .circle.filled {
      background: var(--dot-color);
      border-color: var(--dot-color);
    }
    .circles.error .circle {
      border-color: var(--ion-color-danger, #eb445a);
    }
    .circles.error .circle.filled {
      background: var(--ion-color-danger, #eb445a);
    }
    /* Rejilla de teclas 3×4. */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, var(--key-size));
      gap: var(--gap);
    }
    ion-button {
      --border-radius: var(--border-radius);
      width: var(--key-size);
      height: var(--key-size);
      margin: 0;
      font-size: 1.35rem;
      font-weight: 500;
    }
    /* La celda vacía (esquina inferior izquierda) mantiene la rejilla cuadrada. */
    .spacer {
      width: var(--key-size);
      height: var(--key-size);
    }
  `;

  /** Valor actual (string de dígitos). */
  @property({ type: String }) value = '';
  /** Longitud objetivo opcional; al alcanzarla emite `ok-complete`. */
  @property({ type: Number }) length?: number;
  /** Enmascara la pantalla con •. */
  @property({ type: Boolean }) masked = false;
  /**
   * Pantalla como N círculos grandes (estilo PIN clásico) en vez de la barra con
   * puntitos. Requiere `length` (cuántos círculos). Implica enmascarado.
   */
  @property({ type: Boolean }) dots = false;
  /** Tiñe la pantalla de error (rojo). Útil para «PIN incorrecto». */
  @property({ type: Boolean }) error = false;
  /**
   * Tecla de acción secundaria opcional (esquina inferior IZQUIERDA, junto al 0).
   * Si se define, ocupa el hueco de la izquierda con el icono indicado (p.ej.
   * `arrow-back-outline` para «cambiar usuario») y el borrado se queda en su sitio
   * de siempre (derecha). Al pulsarla emite `ok-secondary`. Si NO se define, el
   * layout es el de siempre: `[hueco] [0] [borrar]` (compatible hacia atrás).
   */
  @property({ type: String, attribute: 'secondary-icon' }) secondaryIcon?: string;
  /** aria-label de la tecla de acción secundaria. */
  @property({ type: String, attribute: 'secondary-label' }) secondaryLabel?: string;
  /** Textos traducibles (merge sobre los defaults en inglés). */
  @property({ attribute: false }) labels: Partial<OkPinpadLabels> = {};

  // Textos efectivos: defaults en inglés + overrides del consumidor.
  private get t(): OkPinpadLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  // Añade un dígito (respetando `length`) y emite eventos.
  private press(digit: string): void {
    if (this.length != null && this.value.length >= this.length) return;
    this.value = this.value + digit;
    this.emitInput();
    if (this.length != null && this.value.length === this.length) {
      this.dispatchEvent(
        new CustomEvent('ok-complete', {
          detail: { value: this.value },
          bubbles: true,
          composed: true,
        }),
      );
    }
  }

  // Borra el último dígito y emite `ok-input`.
  private backspace(): void {
    if (!this.value) return;
    this.value = this.value.slice(0, -1);
    this.emitInput();
  }

  private emitInput(): void {
    this.dispatchEvent(
      new CustomEvent('ok-input', {
        detail: { value: this.value },
        bubbles: true,
        composed: true,
      }),
    );
  }

  // Emite `ok-secondary` (pulsación de la tecla de acción secundaria).
  private secondary(): void {
    this.dispatchEvent(
      new CustomEvent('ok-secondary', { bubbles: true, composed: true }),
    );
  }

  // Botón de borrado (reutilizado en ambos layouts).
  private renderBackspace(): unknown {
    return html`<ion-button fill="clear" aria-label=${this.t.backspace} @click=${() => this.backspace()}>
      <ion-icon slot="icon-only" name="backspace-outline"></ion-icon>
    </ion-button>`;
  }

  // Pinta la pantalla: dots si `masked`, dígitos si no, placeholder si vacío.
  private renderDisplay(): unknown {
    if (!this.value) {
      return html`<span class="placeholder">&mdash;</span>`;
    }
    if (this.masked) {
      return Array.from(this.value, () => html`<span class="dot"></span>`);
    }
    return html`<span>${this.value}</span>`;
  }

  // Variante `dots`: N círculos grandes (estilo PIN clásico). Requiere `length`.
  private renderCircles(): unknown {
    const n = this.length ?? 0;
    return html`<div
      class="circles ${this.error ? 'error' : ''}"
      role="status"
      aria-live="polite"
    >
      ${Array.from({ length: n }, (_, i) =>
        html`<span class="circle ${i < this.value.length ? 'filled' : ''}"></span>`,
      )}
    </div>`;
  }

  render(): unknown {
    const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return html`
      ${this.dots && this.length != null
        ? this.renderCircles()
        : html`<div class="display" role="status" aria-live="polite">${this.renderDisplay()}</div>`}
      <div class="grid" role="group" aria-label=${this.t.keypad}>
        ${digits.map(
          (d) => html`<ion-button
            fill="outline"
            aria-label=${d}
            @click=${() => this.press(d)}
          >${d}</ion-button>`,
        )}
        ${this.secondaryIcon
          ? html`<ion-button
              fill="clear"
              aria-label=${this.secondaryLabel ?? this.secondaryIcon}
              @click=${() => this.secondary()}
            ><ion-icon slot="icon-only" name=${this.secondaryIcon}></ion-icon></ion-button>`
          : html`<span class="spacer" aria-hidden="true"></span>`}
        <ion-button fill="outline" aria-label="0" @click=${() => this.press('0')}>0</ion-button>
        ${this.renderBackspace()}
      </div>
    `;
  }
}

define('ok-pinpad', OkPinpad);

declare global {
  interface HTMLElementTagNameMap {
    'ok-pinpad': OkPinpad;
  }
}
