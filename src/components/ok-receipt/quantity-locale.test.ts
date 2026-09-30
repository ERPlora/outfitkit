// @vitest-environment happy-dom

// outfitkit#253 — the receipt's «qty × price» line painted the quantity as a raw JS number: a Spanish
// ticket read «1.5 × 16,50 EUR». The quantity now follows the document's language like the money.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-receipt.js';
import type { OkReceipt, ReceiptData } from './ok-receipt.js';

const DATA: ReceiptData = {
  business: { name: 'BAR PEPE' },
  number: 'T-1',
  lines: [{ name: 'Jamón', qty: 1.5, unit_price: 1650, total: 2475 }],
  subtotal: 2475,
  taxes: [{ label: 'IVA 10%', base: 2250, amount: 225 }],
  total: 2475,
  currency: 'EUR',
};

async function mount(receipt: ReceiptData): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const qtyPrice = (el: OkReceipt): string => el.shadowRoot!.querySelector('.qty-price')!.textContent!.replace(/\s+/g, ' ').trim();

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('ok-receipt — quantity in the document language (#253)', () => {
  it('es: «1,5 × 16,50 EUR», not «1.5 × …»', async () => {
    document.documentElement.lang = 'es';
    expect(qtyPrice(await mount(DATA))).toBe('1,5 × 16,50 EUR');
  });

  it('en: «1.5 × 16.50 EUR»', async () => {
    document.documentElement.lang = 'en';
    expect(qtyPrice(await mount(DATA))).toBe('1.5 × 16.50 EUR');
  });

  it('a whole quantity has no padding zeros («2 × …»)', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ ...DATA, lines: [{ ...DATA.lines[0], qty: 2, total: 3300 }] });
    expect(qtyPrice(el)).toBe('2 × 16,50 EUR');
  });
});
