// @vitest-environment happy-dom

// outfitkit#81 — same contract as ok-receipt: integers in minor units + `decimals`, painted with the
// separators of the document's language. `invoice` already hands cents to this element (invoice#66),
// which under the old float contract printed «4800.00 EUR» for a 48,00 € invoice.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-invoice.js';
import type { OkInvoice, InvoiceData } from './ok-invoice.js';

const DATA: InvoiceData = {
  issuer: { name: 'ERPlora S.L.', tax_id: 'B-1' },
  customer: { name: 'Cliente' },
  number: 'F-1',
  issue_date: '2026-08-25',
  lines: [{ description: 'Licencia', qty: 1, unit_price: 4800, tax_rate: 21, total: 4800 }],
  subtotal: 4800,
  discount_total: 100,
  taxes: [{ label: 'IVA 21%', base: 4800, amount: 1008 }],
  tax_total: 1008,
  total: 5808,
  currency: 'EUR',
};

async function mount(invoice: InvoiceData): Promise<OkInvoice> {
  const el = document.createElement('ok-invoice') as OkInvoice;
  el.invoice = invoice;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const nums = (el: OkInvoice): string[] => [...el.shadowRoot!.querySelectorAll('td.num')].map((n) => n.textContent!.trim());

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('ok-invoice — importes en unidad mínima, pintados con el idioma del documento (#81)', () => {
  it('es: una factura de 48,00 € dice «48,00 EUR», no «4800.00 EUR»', async () => {
    document.documentElement.lang = 'es';
    const el = await mount(DATA);
    expect(nums(el)).toContain('48,00 EUR');
    expect(nums(el)).toContain('58,08 EUR');
    expect(nums(el)).toContain('−1,00 EUR');
    expect(el.shadowRoot!.textContent).not.toContain('4800.00');
  });

  it('en: «48.00 EUR»', async () => {
    document.documentElement.lang = 'en';
    const el = await mount(DATA);
    expect(nums(el)).toContain('48.00 EUR');
  });

  it('`decimals` manda la escala', async () => {
    document.documentElement.lang = 'en';
    const el = await mount({ ...DATA, currency: 'KWD', decimals: 3 });
    expect(nums(el)).toContain('4.800 KWD');
  });

  it('un float ya no pasa por dinero: «—»', async () => {
    const el = await mount({ ...DATA, total: 58.08 });
    expect(nums(el)).toContain('— EUR');
  });
});
