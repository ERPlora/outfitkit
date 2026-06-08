import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-pdf — visor de PDF usando el visor NATIVO del navegador (sin pdf.js ni libs externas).
// AUTOCONTENIDO: CSS propio en el shadow; sólo usa `ion-button`/`ion-icon` (los registra el host).
// RESPONSIVE: ocupa el ancho del contenedor; alto configurable.
//   • prop `src`     → URL del PDF
//   • prop `title`   → título opcional en la barra superior
//   • prop `height`  → alto del visor (def "480px"; admite cualquier unidad CSS)
// Render: `<object type="application/pdf">` con fallback a enlace de descarga si el navegador
// no incrusta PDFs. Barra mínima con título + botón "Abrir / Descargar".
// Eventos: ninguno propio (es un visor estático); la descarga abre en pestaña nueva.
export class OkPdf extends LitElement {
  static styles = css`
    :host {
      /* Vars overridable (estilo Ionic), default = cadena --ok-* → --ion-* → hex */
      --color: var(--ok-text, var(--ion-text-color, #1c1b17));
      --color-muted: var(--ok-text-muted, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.55));
      --surface-bg: var(--ok-surface, var(--ion-card-background, #ffffff));
      --viewer-bg: var(--ok-pdf-bg, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.04));
      --border-color: var(--ok-border, rgba(var(--ion-text-color-rgb, 28, 27, 23), 0.1));
      --border-radius: var(--ok-radius, 10px);
      --font: var(--ok-font, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif);

      /* Responsive: bloque al ancho del contenedor. */
      display: block;
      width: 100%;
      color: var(--color);
      font-family: var(--font);
    }
    .frame {
      box-sizing: border-box;
      width: 100%;
      display: flex;
      flex-direction: column;
      background: var(--surface-bg);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius);
      overflow: hidden;
    }
    /* Barra superior mínima: título a la izquierda, acción a la derecha. */
    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 0.4rem 0.4rem 0.75rem;
      border-bottom: 1px solid var(--border-color);
    }
    .toolbar .title {
      flex: 1 1 auto;
      min-width: 0;
      font-size: 0.88rem;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    ion-button {
      margin: 0;
      flex: 0 0 auto;
    }
    /* Zona del visor: el <object> ocupa todo el alto indicado. */
    .viewer {
      position: relative;
      width: 100%;
      background: var(--viewer-bg);
    }
    object {
      display: block;
      width: 100%;
      height: 100%;
      border: 0;
    }
    /* Fallback visible si el navegador no incrusta el PDF. */
    .fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.6rem;
      height: 100%;
      padding: 1.5rem;
      text-align: center;
      color: var(--color-muted);
    }
    .fallback ion-icon {
      font-size: 2.2rem;
    }
  `;

  /** URL del PDF a mostrar. */
  @property() src = '';
  /** Título opcional en la barra superior. */
  @property() title = '';
  /** Alto del visor (cualquier unidad CSS válida). */
  @property() height = '480px';

  // Abre el PDF en una pestaña nueva (descarga / vista a pantalla completa del navegador).
  private open(): void {
    if (this.src) window.open(this.src, '_blank', 'noopener');
  }

  render(): unknown {
    return html`
      <div class="frame">
        <div class="toolbar">
          <span class="title">${this.title || 'Documento PDF'}</span>
          <ion-button
            fill="clear"
            size="small"
            aria-label="Abrir o descargar PDF"
            @click=${this.open}
          >
            <ion-icon slot="start" name="open-outline"></ion-icon>
            Abrir
          </ion-button>
        </div>
        <div class="viewer" style=${`height:${this.height}`}>
          <object data=${this.src} type="application/pdf">
            <!-- Fallback: el navegador no pudo incrustar el PDF → enlace de descarga. -->
            <div class="fallback">
              <ion-icon name="document-text-outline"></ion-icon>
              <span>No se pudo mostrar el PDF aquí.</span>
              <ion-button fill="solid" size="small" @click=${this.open}>
                <ion-icon slot="start" name="download-outline"></ion-icon>
                Descargar
              </ion-button>
            </div>
          </object>
        </div>
      </div>
    `;
  }
}

define('ok-pdf', OkPdf);

declare global {
  interface HTMLElementTagNameMap {
    'ok-pdf': OkPdf;
  }
}
