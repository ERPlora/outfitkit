import { LitElement, html, css, nothing } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import '../ok-qr/ok-qr.js';
import { documentLocale, formatMinor } from '../ok-money/ok-money.js';

// ok-receipt — Web Component PRESENTACIONAL y AISLADO del tiquet/recibo de venta (POS).
//
// No habla con ningún backend: recibe un JSON ya resuelto (prop `receipt`) y lo PINTA con
// estética de impresora térmica (80mm). Cualquier botón externo (imprimir, enviar, previsualizar)
// le pasa el objeto; el componente solo lo formatea. Reusa `ok-qr` para el QR (p.ej. VeriFactu).
//
// Uso:
//   const el = document.createElement('ok-receipt');
//   el.receipt = { business: {…}, number: '0001', lines: [...], total: 12.30, qr: '…' };
//   container.appendChild(el);

/** Cabecera del negocio (lo que va arriba del tiquet). */
export interface ReceiptBusiness {
  name: string;
  address?: string;
  /** NIF / CIF. */
  tax_id?: string;
  phone?: string;
  /** URL del logo (opcional; alternativamente usa el slot `logo`). */
  logo_url?: string;
}

/** Una línea de venta. Los importes son ENTEROS en unidad mínima (céntimos: 1650 = 16,50 €,
 *  ADR-0123); la escala la fija `ReceiptData.decimals`. Un float no es dinero y se pinta «—». */
export interface ReceiptLine {
  name: string;
  /** Cantidad (no es dinero: puede llevar decimales). */
  qty: number;
  /** Precio unitario, entero en unidad mínima. */
  unit_price: number;
  /** Importe de la línea, entero en unidad mínima. */
  total: number;
  /** Nota/observación bajo la línea (opcional). NO se pinta cuando la línea trae `components` o
   *  `modifiers`: el módulo que aún duplica ahí el mismo texto no lo enseña dos veces. */
  note?: string;
  /** outfitkit#77 / ADR-0396 — la línea ES un menú: sus componentes, ya compuestos como etiqueta por
   *  el módulo («Solomillo (+3,00)»), se sangran UNO POR LÍNEA bajo el nombre, SIN importe (el precio
   *  es el cerrado de la cabecera). Opcional: una línea normal no lo lleva y se pinta como siempre. */
  components?: string[];
  /** Los suplementos de la línea (ADR-0376), ya compuestos como etiqueta. Se sangran igual que los
   *  componentes, DESPUÉS de ellos. Solo cuentan las cadenas: un objeto no es una etiqueta. */
  modifiers?: string[];
}

/** Desglose de un impuesto (p.ej. IVA 21%). */
export interface ReceiptTax {
  label: string;
  base: number;
  amount: number;
}

/** Datos del cobro. */
export interface ReceiptPayment {
  method: string;
  paid?: number;
  change?: number;
}

// Textos i18n (default inglés). Pásalos desde fuera con `.labels`.
export interface OkReceiptLabels {
  /** Mensaje cuando no hay datos de tiquet. */
  empty: string;
  /** Prefijo del teléfono del negocio (p.ej. 'Tel.'). */
  phone: string;
  /** Etiqueta del nº de tiquet. */
  receipt: string;
  /** Etiqueta de quien atiende (cajero/a). */
  servedBy: string;
  /** Etiqueta del cliente. */
  customer: string;
  /** outfitkit#87 — etiqueta de la MESA (cuenta previa de hostelería). */
  table: string;
  /** Cabecera de columna: concepto/artículo. */
  item: string;
  /** Cabecera de columna: importe. */
  amount: string;
  /** Mensaje cuando no hay líneas. */
  noLines: string;
  /** Etiqueta del subtotal. */
  subtotal: string;
  /** Etiqueta del total. */
  total: string;
  /** Etiqueta del cambio devuelto. */
  change: string;
}

const DEFAULT_LABELS: OkReceiptLabels = {
  empty: 'No receipt data.',
  phone: 'Tel.',
  receipt: 'Receipt',
  servedBy: 'Served by',
  customer: 'Customer',
  table: 'Table',
  item: 'Item',
  amount: 'Amount',
  noLines: '— No lines —',
  subtotal: 'Subtotal',
  total: 'TOTAL',
  change: 'Change',
};

/** Las etiquetas de una lista de sub-líneas: solo cadenas no vacías. DEFENSIVO a propósito: `sales`
 *  ≤ 2.16.10 ya adjunta `modifiers` como OBJETOS al mismo JSON que entrega a `<ok-receipt>`; el día
 *  que el shell actualice, pintarlos como texto imprimiría «[object Object]» en cada tique. */
function labelsOf(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  return list.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
}

/** JSON completo del tiquet. */
export interface ReceiptData {
  /** Document title, FIRST line of the paper (e.g. «Cuenta» on a pre-bill). Mirrors the ESC/POS
   *  renderer, which titles non-fiscal papers so they cannot pass for a ticket; omit on receipts. */
  title?: string;
  business: ReceiptBusiness;
  /** Receipt number. Absent on non-fiscal papers (pre-bill): the label is then not painted —
   *  calling «Receipt» the one paper whose point is NOT being a receipt would mislabel it. */
  number?: string;
  /** Fecha/hora ya formateada o ISO (se muestra tal cual si es string legible). */
  datetime?: string;
  cashier?: string;
  customer?: string;
  /** outfitkit#87 — the TABLE/check that identifies this paper (restaurant pre-bill). Painted with its
   *  own label, next to `customer`, never instead of it: a table may also have a customer. Square,
   *  Toast and Lightspeed print them as separate fields; the hub's ESC/POS renderer names it too. */
  table?: string;
  lines: ReceiptLine[];
  subtotal?: number;
  taxes?: ReceiptTax[];
  total: number;
  payment?: ReceiptPayment;
  /** Símbolo de moneda (def. '€'). */
  currency?: string;
  /** outfitkit#81 — decimales de la moneda (EUR 2, JPY 0, KWD 3). Def. 2. Todos los importes del
   *  tiquet son enteros en unidad mínima y se cortan por aquí — nunca se dividen. */
  decimals?: number;
  /** Mensaje de pie (gracias / leyenda legal). */
  footer?: string;
  /** Payload del QR (VeriFactu / URL de verificación). Si vacío, no se pinta QR. */
  qr?: string;
  /** Leyenda bajo el QR. */
  qr_note?: string;
  /** QR promocional del negocio (reseñas Google, redes, web). Va SIEMPRE al final,
   *  después del fiscal (que es el legal) y más pequeño. Si vacío, no deja rastro. */
  promo_qr?: string;
  /** Leyenda sobre el QR promocional (p.ej. «Escanea y déjanos una reseña»). */
  promo_note?: string;
}

export class OkReceipt extends LitElement {
  static styles = css`
    :host {
      /* Ancho de papel térmico estándar (80mm). Overridable vía --receipt-width. */
      --w: var(--receipt-width, 80mm);
      display: block;
      width: 100%;
    }
    .paper {
      box-sizing: border-box;
      width: var(--w);
      max-width: 100%;
      margin: 0 auto;
      padding: 4mm 3mm;
      background: #fff;
      color: #000;
      /* Monospace = look de tiquet; tabular para alinear importes. */
      font-family: 'Roboto Mono', ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace;
      font-size: 11px;
      line-height: 1.45;
      font-variant-numeric: tabular-nums;
    }
    .center { text-align: center; }
    .doc-title { text-align: center; font-size: 15px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; margin-bottom: 1mm; }
    .biz-logo { max-width: 60%; max-height: 22mm; margin: 0 auto 2mm; display: block; }
    .biz-name { font-size: 14px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; }
    .biz-meta { font-size: 10px; }
    .sep { border: none; border-top: 1px dashed #000; margin: 2mm 0; }
    .meta {
      display: flex; justify-content: space-between; gap: .5rem;
      font-size: 10px;
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .3mm 0; vertical-align: top; }
    thead th { font-size: 9px; text-transform: uppercase; text-align: left; border-bottom: 1px solid #000; }
    th.num, td.num { text-align: right; white-space: nowrap; }
    .line-name { word-break: break-word; }
    .line-note { font-size: 9px; padding-left: 2mm; opacity: .8; }
    /* #77 — Sub-líneas del menú (componentes) y de los suplementos: una por línea, 11px y 4mm de
       sangrado, como el papel HTML de sales. La nota (9px, una línea) era ilegible a un metro en
       el modal de la cuenta previa y no tenía jerarquía; LS Central, WooCommerce y Maitre'D listan
       los componentes sangrados bajo la línea del menú, sin importe. */
    .line-sub { font-size: 11px; padding-left: 4mm; word-break: break-word; }
    .line-sub::before { content: '› '; opacity: .6; }
    .qty-price { font-size: 9px; opacity: .85; }
    .totals { width: 100%; }
    .totals td { padding: .2mm 0; }
    .totals td.num { text-align: right; white-space: nowrap; }
    .grand td { font-size: 14px; font-weight: 700; padding-top: 1mm; }
    .pay td { font-size: 10px; }
    .footer { font-size: 10px; white-space: pre-line; }
    .qr-wrap { display: flex; flex-direction: column; align-items: center; gap: 1mm; margin-top: 2mm; }
    .qr-note { font-size: 8px; text-align: center; word-break: break-word; }
    .promo-wrap { display: flex; flex-direction: column; align-items: center; gap: 1mm; margin-top: 2mm; }
    .promo-note { font-size: 9px; text-align: center; word-break: break-word; }
    .empty { padding: 4mm; text-align: center; color: #888; font-style: italic; }
  `;

  /** JSON del tiquet a renderizar. */
  @property({ attribute: false }) receipt?: ReceiptData;

  /** Tamaño del QR en px (lado). */
  @property({ type: Number, attribute: 'qr-size' }) qrSize = 120;

  /** Textos traducibles (merge sobre los defaults en inglés). */
  @property({ attribute: false }) labels: Partial<OkReceiptLabels> = {};

  private get t(): OkReceiptLabels {
    return { ...DEFAULT_LABELS, ...this.labels };
  }

  private cur(): string {
    return this.receipt?.currency ?? '€';
  }

  /** outfitkit#81 — el mismo formateador por cadena que `<ok-money>`: el entero se corta por
   *  `decimals` y se pinta con los separadores del idioma del documento. Sin `/100`, sin `toFixed`. */
  private money(n: number | undefined): string {
    return formatMinor(n, { decimals: this.receipt?.decimals ?? 2, locale: documentLocale(), currency: this.cur() });
  }

  render() {
    const r = this.receipt;
    if (!r) return html`<div class="paper empty">${this.t.empty}</div>`;

    return html`<div class="paper" part="paper">
      ${r.title ? html`<div class="doc-title">${r.title}</div>` : nothing}
      ${this.renderHeader(r)}
      <hr class="sep" />
      ${this.renderMeta(r)}
      <hr class="sep" />
      ${this.renderLines(r)}
      <hr class="sep" />
      ${this.renderTotals(r)}
      ${r.footer ? html`<hr class="sep" /><div class="center footer">${r.footer}</div>` : nothing}
      ${this.renderQr(r)}
      ${this.renderPromo(r)}
    </div>`;
  }

  private renderHeader(r: ReceiptData) {
    const b = r.business ?? { name: '' };
    return html`<div class="center">
      ${b.logo_url
        ? html`<img class="biz-logo" src=${b.logo_url} alt=${b.name || 'logo'} />`
        : html`<slot name="logo"></slot>`}
      <div class="biz-name">${b.name}</div>
      ${b.address ? html`<div class="biz-meta">${b.address}</div>` : nothing}
      ${b.tax_id ? html`<div class="biz-meta">${b.tax_id}</div>` : nothing}
      ${b.phone ? html`<div class="biz-meta">${this.t.phone} ${b.phone}</div>` : nothing}
    </div>`;
  }

  private renderMeta(r: ReceiptData) {
    return html`<div class="meta">
        ${r.number ? html`<span>${this.t.receipt}: <strong>${r.number}</strong></span>` : html`<span></span>`}
        ${r.datetime ? html`<span>${r.datetime}</span>` : nothing}
      </div>
      ${r.cashier || r.customer || r.table
        ? html`<div class="meta">
            ${r.cashier ? html`<span>${this.t.servedBy}: ${r.cashier}</span>` : html`<span></span>`}
            ${r.table ? html`<span>${this.t.table}: ${r.table}</span>` : nothing}
            ${r.customer ? html`<span>${this.t.customer}: ${r.customer}</span>` : nothing}
          </div>`
        : nothing}`;
  }

  private renderLines(r: ReceiptData) {
    const lines = r.lines ?? [];
    if (!lines.length) return html`<div class="center biz-meta">${this.t.noLines}</div>`;
    return html`<table>
      <thead>
        <tr><th>${this.t.item}</th><th class="num">${this.t.amount}</th></tr>
      </thead>
      <tbody>
        ${lines.map((l) => {
          const comps = labelsOf(l.components);
          const mods = labelsOf(l.modifiers);
          const hasSub = comps.length > 0 || mods.length > 0;
          return html`<tr>
              <td class="line-name">
                <div>${l.name}</div>
                <div class="qty-price">${l.qty} × ${this.money(l.unit_price)}</div>
                ${comps.map((c) => html`<div class="line-sub comp">${c}</div>`)}
                ${mods.map((m) => html`<div class="line-sub mod">${m}</div>`)}
                ${!hasSub && l.note ? html`<div class="line-note">${l.note}</div>` : nothing}
              </td>
              <td class="num">${this.money(l.total)}</td>
            </tr>`;
        })}
      </tbody>
    </table>`;
  }

  private renderTotals(r: ReceiptData) {
    const taxes = r.taxes ?? [];
    return html`<table class="totals">
      ${r.subtotal != null
        ? html`<tr><td>${this.t.subtotal}</td><td class="num">${this.money(r.subtotal)}</td></tr>`
        : nothing}
      ${taxes.map(
        (t) => html`<tr><td>${t.label}</td><td class="num">${this.money(t.amount)}</td></tr>`,
      )}
      <tr class="grand"><td>${this.t.total}</td><td class="num">${this.money(r.total)}</td></tr>
      ${r.payment
        ? html`<tr class="pay"><td>${r.payment.method}</td><td class="num">${this.money(
              r.payment.paid ?? r.total,
            )}</td></tr>
            ${r.payment.change != null
              ? html`<tr class="pay"><td>${this.t.change}</td><td class="num">${this.money(
                  r.payment.change,
                )}</td></tr>`
              : nothing}`
        : nothing}
    </table>`;
  }

  private renderQr(r: ReceiptData) {
    if (!r.qr) return nothing;
    return html`<div class="qr-wrap">
      <ok-qr .value=${r.qr} .size=${this.qrSize} ec="M" color="#000" background="#fff"></ok-qr>
      ${r.qr_note ? html`<div class="qr-note">${r.qr_note}</div>` : nothing}
    </div>`;
  }

  /** QR promocional (reseñas/redes): al final del papel y más pequeño que el fiscal. */
  private renderPromo(r: ReceiptData) {
    if (!r.promo_qr) return nothing;
    return html`<div class="promo-wrap">
      ${r.promo_note ? html`<div class="promo-note">${r.promo_note}</div>` : nothing}
      <ok-qr .value=${r.promo_qr} .size=${Math.round(this.qrSize * 0.7)} ec="M" color="#000" background="#fff"></ok-qr>
    </div>`;
  }
}

define('ok-receipt', OkReceipt);

declare global {
  interface HTMLElementTagNameMap {
    'ok-receipt': OkReceipt;
  }
}
