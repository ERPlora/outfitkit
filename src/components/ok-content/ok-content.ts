import { define } from '../../base/define.js';

// ok-content — wrapper FINO de ion-content (zona de scroll). CERO estilos propios. Light DOM con
// display:contents: reubica sus hijos dentro de un ion-content interno y "desaparece" de la caja,
// así el ion-content participa nativamente en el layout de su contenedor (ion-page / flex / ion-menu)
// igual que en Ionic. `padding` → añade la clase nativa ion-padding.
const PASS_ATTRS = ['fullscreen', 'scroll-x', 'scroll-y', 'color'];

export class OkContent extends HTMLElement {
  private inner: HTMLElement | null = null;

  connectedCallback(): void {
    this.style.display = 'contents';
    if (this.inner) return;
    const c = document.createElement('ion-content');
    for (const a of PASS_ATTRS) {
      const v = this.getAttribute(a);
      if (v !== null) c.setAttribute(a, v);
    }
    if (this.hasAttribute('padding')) c.classList.add('ion-padding');
    // El ion-content rellena su hueco flex (no es estilo cosmético, es plumbing de layout).
    c.style.flex = '1 1 auto';
    c.style.minHeight = '0';
    while (this.firstChild) c.appendChild(this.firstChild);
    this.appendChild(c);
    this.inner = c;
  }
}

define('ok-content', OkContent);

declare global {
  interface HTMLElementTagNameMap {
    'ok-content': OkContent;
  }
}
