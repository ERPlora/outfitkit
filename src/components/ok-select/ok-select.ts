import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

export interface OkSelectOption {
  value: string;
  label: string;
}

// ok-select — wrapper de ion-select. Las opciones llegan por la prop `options` (NO por hijos
// tipados ion-select-option: ver docs/CONVENTIONS.md §5). Evento: ionChange→ok-change `{ value }`.
export class OkSelect extends LitElement {
  static styles = css`
    :host {
      --background: var(--ok-surface-2, var(--ion-color-step-50, #f4f4f5));
      --border-radius: var(--ok-radius, 10px);
      display: block;
    }
    ion-select {
      --background: var(--background);
      border-radius: var(--border-radius);
      --padding-start: 12px;
      --padding-end: 12px;
      min-height: 44px;
    }
  `;

  /** Opciones { value, label }. */
  @property({ attribute: false }) options: OkSelectOption[] = [];
  @property() value?: string;
  @property() placeholder?: string;
  @property() label?: string;
  @property({ attribute: 'label-placement' }) labelPlacement?: string;
  @property({ type: Boolean }) disabled = false;
  /** 'alert' | 'popover' | 'action-sheet'. */
  @property() interface?: string;

  render(): unknown {
    return html`<ion-select
      .value=${this.value}
      .label=${this.label}
      .labelPlacement=${this.labelPlacement}
      .interface=${this.interface ?? 'popover'}
      placeholder=${this.placeholder ?? ''}
      ?disabled=${this.disabled}
      @ionChange=${(e: Event) => relay(this, e, 'ok-change')}
    >
      ${this.options.map(
        (o) => html`<ion-select-option .value=${o.value}>${o.label}</ion-select-option>`,
      )}
    </ion-select>`;
  }
}

define('ok-select', OkSelect);

declare global {
  interface HTMLElementTagNameMap {
    'ok-select': OkSelect;
  }
}
