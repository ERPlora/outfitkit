// @vitest-environment happy-dom

// outfitkit#253 — the printed invoice paints money with the document's language (outfitkit#81) but
// wrote the quantity, the tax rate and the discount as raw JS numbers: a Spanish A4 read «1.5» and
// «5.2%» right next to «1.234,56 EUR». Quantity and percentages now follow the same language, with
// no padding zeros («1,5», «21 %» in Spanish; «1.5», «21%» in English).
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-invoice.js';
import type { OkInvoice, InvoiceData } from './ok-invoice.js';

const DATA: InvoiceData = {
  issuer: { name: 'ERPlora S.L.', tax_id: 'B-1' },
  customer: { name: 'Cliente' },
  number: 'F-1',
  issue_date: '2026-09-30',
  lines: [
    { description: 'Cable', qty: 1.5, unit_price: 1000, discount_percent: 2.5, tax_rate: 5.2, total: 1463 },
    { description: 'Licencia', qty: 1, unit_price: 4800, tax_rate: 21, total: 4800 },
  ],
  subtotal: 6263,
  taxes: [{ label: 'IVA 21%', rate: 21, base: 4800, amount: 1008 }],
  tax_total: 1008,
  total: 7271,
  currency: 'EUR',
};

async function mount(invoice: InvoiceData): Promise<OkInvoice> {
  const el = document.createElement('ok-invoice') as OkInvoice;
  el.invoice = invoice;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Cells of line `i` of the lines table, whitespace (incl. the NBSP Intl puts before «%») as a plain space. */
const row = (el: OkInvoice, i: number): string[] =>
  [...el.shadowRoot!.querySelectorAll('table.lines tbody tr')[i].querySelectorAll('td')].map((td) =>
    td.textContent!.replace(/\s+/g, ' ').trim(),
  );

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('ok-invoice — quantity and percentages in the document language (#253)', () => {
  it('es: «1,5», «2,5 %» and «5,2 %», never «1.5» / «5.2%»', async () => {
    document.documentElement.lang = 'es';
    const cells = row(await mount(DATA), 0);
    expect(cells).toContain('1,5');
    expect(cells).toContain('2,5 %');
    expect(cells).toContain('5,2 %');
    expect(cells.join('|')).not.toMatch(/\d\.\d/);
  });

  it('es: whole numbers carry no padding zeros («1», «21 %»)', async () => {
    document.documentElement.lang = 'es';
    const cells = row(await mount(DATA), 1);
    expect(cells).toContain('1');
    expect(cells).toContain('21 %');
  });

  it('en: «1.5», «2.5%» and «5.2%»', async () => {
    document.documentElement.lang = 'en';
    const cells = row(await mount(DATA), 0);
    expect(cells).toContain('1.5');
    expect(cells).toContain('2.5%');
    expect(cells).toContain('5.2%');
  });

  it('a logical quantity keeps its decimals (0.125 kg is not rounded to 0.13)', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ ...DATA, lines: [{ ...DATA.lines[0], qty: 0.125 }] });
    expect(row(el, 0)).toContain('0,125');
  });

  it('an unreadable <html lang> (es_ES) still paints the line instead of throwing', async () => {
    document.documentElement.lang = 'es_ES';
    const cells = row(await mount(DATA), 0);
    expect(cells[0]).toBe('Cable');
    expect(cells.some((c) => /^1[.,]5$/.test(c))).toBe(true);
  });
});
