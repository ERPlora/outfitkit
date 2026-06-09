import { LitElement, html, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { computeAnchor } from '../../base/anchor.js';

// App (entrada de la rejilla). La aporta el consumidor vía la prop `.apps`.
export interface OkLauncherApp {
  /** Identificador único de la app (clave de selección). */
  id: string;
  /** Texto visible bajo el icono. */
  label: string;
  /** Nombre de un ionicon opcional, mostrado grande sobre el label. */
  icon?: string;
  /** Si está presente, al hacer click navega a esta URL (en lugar de emitir evento). */
  href?: string;
  /** Color de fondo del cuadro del icono (cualquier valor CSS); default = primary. */
  color?: string;
}

// ok-app-launcher — botón estilo "Google apps": un disparador con icono de rejilla 3×3
// (`apps-outline`) que abre un PANEL/popover propio posicionado bajo el botón, con una REJILLA
// de apps (icono grande + label). AUTOCONTENIDO: CSS propio en el shadow (sin Ionic salvo
// `ion-icon`/`ion-button`, que registra el host). Es INLINE (no ancho completo): ocupa solo lo
// que mide el botón.
//   • prop `.apps` → Array<OkLauncherApp>
// Click en una app: si tiene `href` navega; si no, emite `ok-app-select`. Cierra al click fuera o Esc.
// Eventos (bubbles + composed):
//   • `ok-app-select` detail { id, app }
//   • `ok-open`        detail { open }
export class OkAppLauncher extends LitElement {
  static styles = css`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex */
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --color-muted: var(--ok-text-muted, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.6));
      --primary-color: var(--ok-primary, var(--ion-color-primary, #3880ff));
      --primary-contrast: var(--ok-primary-contrast, var(--ion-color-primary-contrast, #ffffff));
      --hover-bg: var(--ok-hover, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.06));
      --panel-bg: var(--ok-surface, var(--ion-card-background, var(--ion-background-color, #ffffff)));
      --border-color: var(--ok-border, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.12));
      --border-radius: var(--ok-radius, 12px);
      --shadow: var(--ok-shadow, 0 8px 28px rgba(0, 0, 0, 0.18));
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      /* INLINE: solo lo que mide el botón. */
      display: inline-block;
      position: relative;
      color: var(--color);
      font-family: var(--font);
    }
    /* Disparador: botón con icono de rejilla. */
    .trigger {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      padding: 0;
      border: 0;
      background: none;
      color: inherit;
      cursor: pointer;
      border-radius: 50%;
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease),
        border-color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease),
        transform 120ms ease;
    }
    @media (hover: hover) {
      .trigger:hover {
        background: var(--hover-bg);
      }
    }
    .trigger:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    .trigger ion-icon {
      font-size: 1.4rem;
    }
    /* Panel/popover propio. Es position:absolute relativo al host (robusto ante ancestros con
       transform): por defecto se abre debajo y alineado a la IZQUIERDA del botón. computeAnchor()
       decide si voltear a la derecha (.end) o hacia arriba (.above) según el espacio del viewport. */
    .panel {
      position: absolute;
      top: calc(100% + 8px);
      left: 0;
      z-index: 1000;
      min-width: 280px;
      max-width: min(360px, calc(100vw - 16px));
      max-height: calc(100vh - 16px);
      overflow: auto;
      padding: 0.75rem;
      background: var(--panel-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow);
      box-sizing: border-box;
    }
    /* Volteo horizontal: alinear el borde derecho del panel con el del botón. */
    .panel.end {
      left: auto;
      right: 0;
    }
    /* Volteo vertical: abrir hacia arriba del botón. */
    .panel.above {
      top: auto;
      bottom: calc(100% + 8px);
    }
    /* Rejilla de apps: 3 columnas fijas, responsive al ancho del panel. */
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.25rem;
    }
    .app {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      padding: 0.6rem 0.3rem;
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      cursor: pointer;
      border-radius: 10px;
      text-align: center;
      text-decoration: none;
      transition: background-color var(--ok-transition, 150ms ease), color var(--ok-transition, 150ms ease),
        border-color var(--ok-transition, 150ms ease), box-shadow var(--ok-transition, 150ms ease),
        transform 120ms ease;
    }
    @media (hover: hover) {
      .app:hover {
        background: var(--hover-bg);
        transform: translateY(-1px);
      }
    }
    .app:active {
      transform: scale(var(--ok-press-scale, 0.97));
    }
    @media (prefers-reduced-motion: reduce) {
      .trigger:hover,
      .trigger:active,
      .app:hover,
      .app:active {
        transform: none;
      }
    }
    /* Cuadro del icono grande (color de la app o primary por defecto). */
    .app .box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 44px;
      height: 44px;
      border-radius: 12px;
      background: var(--app-color, var(--primary-color));
      color: var(--primary-contrast);
    }
    .app .box ion-icon {
      font-size: 1.5rem;
    }
    .app .label {
      font-size: 0.78rem;
      line-height: 1.2;
      color: var(--color-muted);
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .empty {
      padding: 0.75rem;
      font-size: 0.85rem;
      color: var(--color-muted);
      text-align: center;
    }
  `;

  /** Apps a mostrar en la rejilla. */
  @property({ attribute: false }) apps: OkLauncherApp[] = [];

  // Estado interno: panel abierto/cerrado.
  @state() private open = false;

  // Handler de click fuera (se enlaza/desenlaza según abre/cierra).
  private readonly onDocClick = (e: MouseEvent): void => {
    // Si el click cae fuera del host (composedPath no lo incluye), cierra.
    if (!e.composedPath().includes(this)) this.close();
  };

  // Handler de tecla (Esc cierra).
  private readonly onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') this.close();
  };

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.unbind();
  }

  // Reposiciona el panel mientras está abierto (scroll/resize).
  private readonly reposition = (): void => this.positionPanel();

  private bind(): void {
    document.addEventListener('click', this.onDocClick, true);
    document.addEventListener('keydown', this.onKeydown);
    window.addEventListener('resize', this.reposition);
    window.addEventListener('scroll', this.reposition, true);
  }

  private unbind(): void {
    document.removeEventListener('click', this.onDocClick, true);
    document.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('resize', this.reposition);
    window.removeEventListener('scroll', this.reposition, true);
  }

  // Elige el lado del panel (izq/der, arriba/abajo) según el espacio del viewport y aplica clases.
  private positionPanel(): void {
    const trigger = this.renderRoot.querySelector('.trigger') as HTMLElement | null;
    const panel = this.renderRoot.querySelector('.panel') as HTMLElement | null;
    if (!trigger || !panel) return;
    const { end, above } = computeAnchor(trigger, panel);
    panel.classList.toggle('end', end);
    panel.classList.toggle('above', above);
  }

  protected updated(): void {
    // Tras pintar el panel (cuando open=true), lo posicionamos en el siguiente frame.
    if (this.open) requestAnimationFrame(() => this.positionPanel());
  }

  private toggle(): void {
    this.open ? this.close() : this.openPanel();
  }

  private openPanel(): void {
    if (this.open) return;
    this.open = true;
    this.bind();
    this.dispatchEvent(
      new CustomEvent('ok-open', { detail: { open: true }, bubbles: true, composed: true }),
    );
  }

  private close(): void {
    if (!this.open) return;
    this.open = false;
    this.unbind();
    this.dispatchEvent(
      new CustomEvent('ok-open', { detail: { open: false }, bubbles: true, composed: true }),
    );
  }

  // Selecciona una app: si tiene `href` navega; si no, emite `ok-app-select`. Siempre cierra.
  private selectApp(app: OkLauncherApp): void {
    if (app.href) {
      this.close();
      window.location.href = app.href;
      return;
    }
    this.dispatchEvent(
      new CustomEvent('ok-app-select', {
        detail: { id: app.id, app },
        bubbles: true,
        composed: true,
      }),
    );
    this.close();
  }

  private renderApp(app: OkLauncherApp): unknown {
    const boxStyle = app.color ? `--app-color:${app.color}` : '';
    return html`<button
      type="button"
      class="app"
      style=${boxStyle}
      role="menuitem"
      @click=${() => this.selectApp(app)}
    >
      <span class="box">
        <ion-icon .name=${app.icon ?? 'apps-outline'}></ion-icon>
      </span>
      <span class="label">${app.label}</span>
    </button>`;
  }

  render(): unknown {
    return html`
      <button
        type="button"
        class="trigger"
        aria-haspopup="menu"
        aria-expanded=${this.open ? 'true' : 'false'}
        aria-label="Aplicaciones"
        @click=${() => this.toggle()}
      >
        <ion-icon name="apps-outline"></ion-icon>
      </button>
      ${this.open
        ? html`<div class="panel" role="menu" aria-label="Aplicaciones">
            ${this.apps.length
              ? html`<div class="grid">${this.apps.map((app) => this.renderApp(app))}</div>`
              : html`<div class="empty">Sin aplicaciones</div>`}
          </div>`
        : ''}
    `;
  }
}

define('ok-app-launcher', OkAppLauncher);

declare global {
  interface HTMLElementTagNameMap {
    'ok-app-launcher': OkAppLauncher;
  }
}
