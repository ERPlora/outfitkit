// @vitest-environment happy-dom

// outfitkit#87 — the pre-bill of a restaurant identifies the paper by its TABLE, and a table may
// also have a customer. `ReceiptData` had one labelled meta slot (`customer`), so `sales` had to
// relabel it from outside («Mesa: S1») and could never show both. Square, Toast and Lightspeed print
// table and customer as separate fields; the hub's ESC/POS renderer already names it (`Mesa/Cliente`).
// Contract: optional `table`, its own label, painted next to `customer`, never instead of it. A paper
// without it is byte-identical.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-receipt.js';
import type { OkReceipt, ReceiptData } from './ok-receipt.js';

const BASE: ReceiptData = {
  business: { name: 'BAR PEPE' },
  title: 'Bill',
  lines: [{ name: 'Cafe', qty: 1, unit_price: 180, total: 180 }],
  total: 180,
};

async function mount(receipt: ReceiptData, labels?: Record<string, string>): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  if (labels) el.labels = labels;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const metaText = (el: OkReceipt): string => [...el.shadowRoot!.querySelectorAll('.meta')].map((m) => m.textContent!.replace(/\s+/g, ' ').trim()).join(' | ');

beforeEach(() => { document.body.innerHTML = ''; });

describe('ok-receipt — the table is its own field (#87)', () => {
  it('paints «Table: S1» with its own label', async () => {
    const el = await mount({ ...BASE, table: 'S1' });
    expect(metaText(el)).toContain('Table: S1');
  });

  it('table AND customer show at the same time, table first', async () => {
    const el = await mount({ ...BASE, table: 'S1', customer: 'Ana Pérez' });
    const text = metaText(el);
    expect(text).toContain('Table: S1');
    expect(text).toContain('Customer: Ana Pérez');
    expect(text.indexOf('Table: S1')).toBeLessThan(text.indexOf('Customer: Ana Pérez'));
  });

  it('the label is translatable like the others', async () => {
    const el = await mount({ ...BASE, table: 'S1' }, { table: 'Mesa' });
    expect(metaText(el)).toContain('Mesa: S1');
  });

  it('without `table` the paper is exactly as before (no empty label, no extra row)', async () => {
    const withCustomer = await mount({ ...BASE, customer: 'Ana' });
    expect(metaText(withCustomer)).not.toContain('Table');
    const plain = await mount(BASE);
    expect(plain.shadowRoot!.querySelectorAll('.meta')).toHaveLength(1); // only the number/date row
  });
});
