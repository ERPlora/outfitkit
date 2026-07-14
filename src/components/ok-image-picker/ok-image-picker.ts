import { LitElement, html, nothing, type TemplateResult } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { iconCloseOutline } from '../../base/icons.js';
import '../ok-gallery/ok-gallery.js';
import '../ok-dropzone/ok-dropzone.js';

/** Origen de una imagen. Determina quién sirve los bytes y quién puede escribir. */
export type OkPickerOrigin = 'hub' | 'public';

export interface OkPickerImage {
  /** Ref LÓGICA (`media:<origen>/<tipo>/<path>`) — es lo que se guarda en la columna `image`. */
  id: string;
  /** URL servible para pintar la miniatura. Efímera: NUNCA se persiste. */
  src: string;
  alt?: string;
}

/**
 * `ok-image-picker` — modal de selección de imagen con dos orígenes.
 *
 * - **hub**: el bucket/disco del propio cliente. El usuario sube aquí.
 * - **public**: la librería curada de `blueprints`, servida por el proxy del SaaS. **Solo lectura**:
 *   la única vía de entrada es un PR al repo. Es un activo compartido por todos los tenants.
 *
 * El componente es *tonto*: no busca ni sube por su cuenta. Emite `ok-search` / `ok-upload` y el
 * host decide a qué backend habla (el Hub no tiene credenciales de S3 — ADR-0047). Lo que sí hace
 * es **garantizar la regla de escritura**: en `public` no hay subida, ni por botón ni por drop.
 */
export class OkImagePicker extends LitElement {
  @property({ type: Boolean, reflect: true }) open = false;
  @property({ reflect: true }) segment: OkPickerOrigin = 'hub';
  @property({ attribute: false }) hubImages: OkPickerImage[] = [];
  @property({ attribute: false }) publicImages: OkPickerImage[] = [];
  @property({ type: Boolean }) loading = false;
  @property() heading = 'Elegir imagen';

  /** Sin Shadow DOM el `ion-modal` reubica al body y perdemos el contrato de test. */
  private emit<T>(name: string, detail: T): void {
    this.dispatchEvent(new CustomEvent<T>(name, { detail, bubbles: true, composed: true }));
  }

  private get images(): OkPickerImage[] {
    return this.segment === 'hub' ? this.hubImages : this.publicImages;
  }

  /** `public` es de solo lectura por diseño: se rechaza aquí, no en el render. El `ok-dropzone`
   * acepta drag&drop, así que esconder el botón NO es suficiente para impedir una subida. */
  requestUpload(files: File[]): void {
    if (this.segment !== 'hub') return;
    if (!files.length) return;
    this.emit('ok-upload', { files });
  }

  select(ref: string): void {
    this.emit('ok-select', { ref });
  }

  search(query: string): void {
    this.emit('ok-search', { query, origin: this.segment });
  }

  private onSegment(origin: OkPickerOrigin): void {
    this.segment = origin;
    this.emit('ok-segment-change', { origin });
  }

  render(): TemplateResult {
    return html`
      <ion-modal ?is-open=${this.open} @ionModalDidDismiss=${() => this.emit('ok-cancel', {})}>
        <ion-header>
          <ion-toolbar>
            <ion-title>${this.heading}</ion-title>
            <ion-buttons slot="end">
              <ion-button @click=${() => this.emit('ok-cancel', {})}>
                <ion-icon slot="icon-only" .icon=${iconCloseOutline}></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
          <ion-toolbar>
            <ion-segment
              value=${this.segment}
              @ionChange=${(e: CustomEvent) => this.onSegment((e.detail as { value: OkPickerOrigin }).value)}
            >
              <ion-segment-button value="hub"><ion-label>Mis imágenes</ion-label></ion-segment-button>
              <ion-segment-button value="public"><ion-label>Librería</ion-label></ion-segment-button>
            </ion-segment>
          </ion-toolbar>
          <ion-toolbar>
            <ion-searchbar
              debounce="250"
              @ionInput=${(e: CustomEvent) => this.search(((e.target as HTMLInputElement).value ?? '').trim())}
            ></ion-searchbar>
          </ion-toolbar>
        </ion-header>

        <ion-content class="ion-padding">
          ${this.segment === 'hub'
            ? html`<ok-dropzone
                accept="image/*"
                @ok-files=${(e: CustomEvent) => this.requestUpload((e.detail as { files: File[] }).files ?? [])}
              ></ok-dropzone>`
            : nothing}

          <ok-gallery
            selectable
            .images=${this.images}
            @ok-select=${(e: CustomEvent) => this.select((e.detail as { id: string }).id)}
          ></ok-gallery>
        </ion-content>
      </ion-modal>
    `;
  }
}

define('ok-image-picker', OkImagePicker);

declare global {
  interface HTMLElementTagNameMap {
    'ok-image-picker': OkImagePicker;
  }
}
