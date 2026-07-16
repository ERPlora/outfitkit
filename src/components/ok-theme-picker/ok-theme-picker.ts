import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-theme-picker — selector de tema COMPARTIDO Cloud↔Hub (páginas de settings): la paleta
// (swatches de color) + el modo claro/oscuro/sistema. El hueco que Ionic no cubre: un picker
// de paletas de marca listo para ambos shells.
//
//   <ok-theme-picker palette="ocean" mode="dark"></ok-theme-picker>
//
// El componente NO persiste ni toca el <html>: emite `ok-change` con {palette, mode} y es el
// HOST quien guarda (preferencias/cookie en Cloud; localStorage + hub_settings en Hub) y quien
// aplica el atributo con `applyPalette()` (paleta) y la clase `ion-palette-dark` (modo).
//
// Las paletas por defecto son las de `@erplora/outfitkit/palettes.css` + la marca ERPlora
// ('erplora' = el azul canónico de erplora.css, que se activa QUITANDO el atributo).

export interface OkThemePickerPalette {
  /** Id de la paleta (valor de `data-ok-palette`; 'erplora' = default sin atributo). */
  id: string;
  /** Nombre visible/accesible. */
  label: string;
  /** Color de marca para el swatch. */
  brand: string;
}

/** Paletas canónicas — espejo 1:1 de palettes.css (guard en palettes.test.ts). */
export const DEFAULT_PALETTES: OkThemePickerPalette[] = [
  { id: 'erplora', label: 'ERPlora', brand: '#1496D6' },
  { id: 'terracotta', label: 'Terracotta', brand: '#E8552A' },
  { id: 'corporate', label: 'Corporate', brand: '#0F3F9C' },
  { id: 'minimal', label: 'Minimal', brand: '#111111' },
  { id: 'forest', label: 'Forest', brand: '#1F542A' },
  { id: 'ocean', label: 'Ocean', brand: '#008CBD' },
  { id: 'violet', label: 'Violet', brand: '#742AD9' },
];

/** Único punto que escribe `data-ok-palette`: 'erplora' (o vacío) QUITA el atributo. */
export function applyPalette(root: Element, palette: string): void {
  if (!palette || palette === 'erplora') root.removeAttribute('data-ok-palette');
  else root.setAttribute('data-ok-palette', palette);
}

export type OkThemePickerMode = 'system' | 'light' | 'dark';

// Textos i18n (default inglés — ADR-0055). Pásalos desde fuera con `.labels`.
export interface OkThemePickerLabels {
  /** Encabezado de la sección de paletas. */
  palette: string;
  /** Encabezado de la sección de modo. */
  mode: string;
  system: string;
  light: string;
  dark: string;
}

const DEFAULT_LABELS: OkThemePickerLabels = {
  palette: 'Theme palette',
  mode: 'Appearance',
  system: 'System',
  light: 'Light',
  dark: 'Dark',
};

export class OkThemePicker extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      --text: var(--ok-text, var(--ion-text-color, #1a1c20));
      --muted: var(--ok-muted, rgba(var(--ion-text-color-rgb, 26, 28, 32), 0.6));
      --surface: var(--ok-surface, var(--ion-card-background, #fff));
      --border: var(--ok-border, var(--ion-border-color, rgba(26, 28, 32, 0.14)));
      --primary: var(--ok-primary, var(--ion-color-primary, #1496d6));
      --radius: var(--ok-radius, 14px);
      font-family: var(--ok-font, var(--ion-font-family, system-ui, sans-serif));
      color: var(--text);
    }
    .head {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin: 0 0 0.6rem;
    }
    .section + .section { margin-top: 1.1rem; }

    .palettes {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
    }
    .swatch {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
      padding: 0.5rem 0.4rem 0.4rem;
      min-width: 4.2rem;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius);
      color: var(--muted);
      font: inherit;
      font-size: 0.75rem;
      cursor: pointer;
      transition: border-color var(--ok-transition, 150ms ease), background-color var(--ok-transition, 150ms ease);
    }
    @media (hover: hover) {
      .swatch:hover { background: color-mix(in oklab, var(--text) 5%, transparent); }
    }
    .swatch[aria-pressed='true'] {
      border-color: var(--primary);
      color: var(--text);
      font-weight: 600;
    }
    .dot {
      width: 1.9rem;
      height: 1.9rem;
      border-radius: 50%;
      border: 1px solid var(--border);
      box-shadow: inset 0 0 0 2px var(--surface);
    }
    .swatch[aria-pressed='true'] .dot {
      outline: 2px solid var(--primary);
      outline-offset: 2px;
    }

    .modes {
      display: inline-flex;
      gap: 0;
      border: 1px solid var(--border);
      border-radius: var(--ok-radius-pill, 999px);
      padding: 0.2rem;
      background: color-mix(in oklab, var(--text) 4%, transparent);
    }
    .mode {
      border: 0;
      background: transparent;
      color: var(--muted);
      font: inherit;
      font-size: 0.85rem;
      padding: 0.35rem 0.9rem;
      border-radius: var(--ok-radius-pill, 999px);
      cursor: pointer;
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease);
    }
    .mode[aria-pressed='true'] {
      background: var(--surface);
      color: var(--text);
      font-weight: 600;
      box-shadow: var(--ok-shadow-xs, 0 1px 2px rgba(0, 0, 0, 0.08));
    }
  `;

  /** Paleta activa ('erplora' = marca por defecto). */
  @property() palette = 'erplora';
  /** Modo de color activo. */
  @property() mode: OkThemePickerMode = 'system';
  /** Oculta el segmento de modo (para hosts con su propio toggle claro/oscuro). */
  @property({ type: Boolean, attribute: 'hide-mode' }) hideMode = false;
  /** Paletas a mostrar (default: las canónicas de palettes.css). */
  @property({ attribute: false }) palettes: OkThemePickerPalette[] = DEFAULT_PALETTES;
  /** Textos i18n (parcial; se mezclan sobre los defaults en inglés). */
  @property({ attribute: false }) labels: Partial<OkThemePickerLabels> = {};

  private get t(): OkThemePickerLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  private emitChange(): void {
    this.dispatchEvent(
      new CustomEvent('ok-change', {
        detail: { palette: this.palette, mode: this.mode },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private pickPalette(id: string): void {
    if (id === this.palette) return;
    this.palette = id;
    this.emitChange();
  }

  private pickMode(mode: OkThemePickerMode): void {
    if (mode === this.mode) return;
    this.mode = mode;
    this.emitChange();
  }

  render(): unknown {
    const modes: OkThemePickerMode[] = ['system', 'light', 'dark'];
    return html`
      <div class="section">
        <p class="head">${this.t.palette}</p>
        <div class="palettes" role="group" aria-label=${this.t.palette}>
          ${this.palettes.map(
            (p) => html`
              <button
                class="swatch"
                type="button"
                aria-label=${p.label}
                aria-pressed=${this.palette === p.id ? 'true' : 'false'}
                @click=${() => this.pickPalette(p.id)}
              >
                <span class="dot" style="background:${p.brand}"></span>
                <span>${p.label}</span>
              </button>
            `,
          )}
        </div>
      </div>
      ${this.hideMode
        ? nothing
        : html`
            <div class="section">
              <p class="head">${this.t.mode}</p>
              <div class="modes" role="group" aria-label=${this.t.mode}>
                ${modes.map(
                  (m) => html`
                    <button
                      class="mode"
                      type="button"
                      data-mode=${m}
                      aria-pressed=${this.mode === m ? 'true' : 'false'}
                      @click=${() => this.pickMode(m)}
                    >
                      ${this.t[m]}
                    </button>
                  `,
                )}
              </div>
            </div>
          `}
    `;
  }
}

define('ok-theme-picker', OkThemePicker);

declare global {
  interface HTMLElementTagNameMap {
    'ok-theme-picker': OkThemePicker;
  }
}
