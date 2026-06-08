import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// Familia ok-card — wrappers de ion-card y sus piezas. Composición por slots:
//   <ok-card>
//     <ok-card-header>
//       <ok-card-subtitle>…</ok-card-subtitle>
//       <ok-card-title>…</ok-card-title>
//     </ok-card-header>
//     <ok-card-content>…</ok-card-content>
//   </ok-card>

export class OkCard extends LitElement {
  static styles = css`
    :host { display: block; }
    ion-card { margin: 0; border-radius: var(--ok-radius, 12px); }
  `;
  /** Aspecto cristal (clase glass del consumidor) opcional. */
  @property({ type: Boolean }) flat = false;
  render(): unknown {
    return html`<ion-card style=${this.flat ? '--box-shadow: none;' : ''}><slot></slot></ion-card>`;
  }
}

export class OkCardHeader extends LitElement {
  static styles = css`:host { display: block; }`;
  render(): unknown {
    return html`<ion-card-header><slot></slot></ion-card-header>`;
  }
}

export class OkCardTitle extends LitElement {
  static styles = css`:host { display: block; }`;
  render(): unknown {
    return html`<ion-card-title><slot></slot></ion-card-title>`;
  }
}

export class OkCardSubtitle extends LitElement {
  static styles = css`:host { display: block; }`;
  render(): unknown {
    return html`<ion-card-subtitle><slot></slot></ion-card-subtitle>`;
  }
}

export class OkCardContent extends LitElement {
  static styles = css`:host { display: block; }`;
  render(): unknown {
    return html`<ion-card-content><slot></slot></ion-card-content>`;
  }
}

define('ok-card', OkCard);
define('ok-card-header', OkCardHeader);
define('ok-card-title', OkCardTitle);
define('ok-card-subtitle', OkCardSubtitle);
define('ok-card-content', OkCardContent);

declare global {
  interface HTMLElementTagNameMap {
    'ok-card': OkCard;
    'ok-card-header': OkCardHeader;
    'ok-card-title': OkCardTitle;
    'ok-card-subtitle': OkCardSubtitle;
    'ok-card-content': OkCardContent;
  }
}
