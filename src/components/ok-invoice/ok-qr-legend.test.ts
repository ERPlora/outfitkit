// @vitest-environment happy-dom
// Contract of the LEGAL LEGEND beside the fiscal QR (sales#327).
//
// RD 1619/2012 art. 6.5.b (and 7.5 for simplified invoices) requires every invoice issued by a
// system that remits all its records to the AEAT to carry «VERI*FACTU» (or «Factura verificable en
// la sede electrónica de la AEAT") next to the QR, and Orden HAC/1177/2024 art. 20.1.b wants it in
// a type size "similar to the rest of the invoice data". `qr_note` cannot carry it: it is an 8px
// caption and it changes when the AEAT answers with a CSV. So the legend is its own field,
// `qr_legend`, painted right under the QR at body size, and absent → no trace.
import { beforeEach, describe, expect, it } from 'vitest';
import '../ok-receipt/ok-receipt.js';
import './ok-invoice.js';
import { OkReceipt, type ReceiptData } from '../ok-receipt/ok-receipt.js';
import { OkInvoice, type InvoiceData } from './ok-invoice.js';

const RECEIPT: ReceiptData = {
  business: { name: 'MI NEGOCIO' },
  number: 'T-1',
  lines: [{ name: 'Cafe', qty: 1, unit_price: 180, total: 180 }],
  total: 180,
  qr: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B1',
  qr_note: 'CSV: ABC123',
};

const INVOICE: InvoiceData = {
  issuer: { name: 'MI NEGOCIO', tax_id: 'B12345678' },
  customer: { name: 'Cliente' },
  number: 'F-1',
  issue_date: '23/09/2026',
  lines: [{ description: 'Cafe', qty: 1, unit_price: 180, total: 180 }],
  subtotal: 180,
  taxes: [],
  tax_total: 0,
  total: 180,
  qr: 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B1',
  qr_note: 'CSV: ABC123',
};

async function mountReceipt(receipt: ReceiptData): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

async function mountInvoice(invoice: InvoiceData): Promise<OkInvoice> {
  const el = document.createElement('ok-invoice') as OkInvoice;
  el.invoice = invoice;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function cssOf(styles: unknown): string {
  return (Array.isArray(styles) ? styles : [styles]).map((s) => String(s)).join('\n');
}

/** Font size in px of `selector` in the component CSS (first declaration found). */
function fontSize(styles: unknown, selector: string): number {
  const esc = selector.replace('.', '\\.');
  const m = cssOf(styles).match(new RegExp(`${esc}\\s*\\{[^}]*font-size:\\s*(\\d+(?:\\.\\d+)?)px`));
  return m ? Number(m[1]) : NaN;
}

beforeEach(() => { document.body.innerHTML = ''; });

describe.each([
  ['ok-receipt', () => mountReceipt({ ...RECEIPT, qr_legend: 'VERI*FACTU' }), () => mountReceipt(RECEIPT)],
  ['ok-invoice', () => mountInvoice({ ...INVOICE, qr_legend: 'VERI*FACTU' }), () => mountInvoice(INVOICE)],
] as const)('%s — qr_legend', (_tag, withLegend, withoutLegend) => {
  it('paints the legend right under the fiscal QR, before the note', async () => {
    const el = await withLegend();
    const wrap = el.shadowRoot!.querySelector('.qr-wrap')!;
    const children = [...wrap.children].map((c) => c.tagName.toLowerCase() === 'ok-qr' ? 'qr' : c.className);
    expect(children).toEqual(['qr', 'qr-legend', 'qr-note']);
    expect(wrap.querySelector('.qr-legend')!.textContent).toBe('VERI*FACTU');
    // The note keeps its own content: the legend is in addition to it, not instead of it.
    expect(wrap.querySelector('.qr-note')!.textContent).toBe('CSV: ABC123');
  });

  it('without qr_legend leaves no trace', async () => {
    const el = await withoutLegend();
    expect(el.shadowRoot!.querySelector('.qr-legend')).toBeNull();
  });
});

describe('qr_legend — visible type size (Orden HAC/1177/2024 art. 20.1.b)', () => {
  it('ok-receipt paints it at least as large as the ticket body text (11px)', () => {
    expect(fontSize(OkReceipt.styles, '.qr-legend')).toBeGreaterThanOrEqual(11);
  });

  it('ok-invoice paints it larger than the 8px QR caption', () => {
    expect(fontSize(OkInvoice.styles, '.qr-legend')).toBeGreaterThan(fontSize(OkInvoice.styles, '.qr-note'));
    expect(fontSize(OkInvoice.styles, '.qr-legend')).toBeGreaterThanOrEqual(10);
  });
});
