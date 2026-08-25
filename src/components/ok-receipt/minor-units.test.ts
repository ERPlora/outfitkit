// @vitest-environment happy-dom

// outfitkit#81 — the receipt takes money as INTEGERS in minor units (ADR-0123), like everything else
// in ERPlora, and paints them with the separators of the document's language via the same string
// formatter as `<ok-money>`. The old contract (euros as floats + `toFixed(2)`) is gone: a float was a
// sixth layer holding money that the ADR says has five, and `sales` had to divide at the door
// (`toEuros`) while `invoice` did not (invoice#66) — the same component, two units, nothing failing.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-receipt.js';
import type { OkReceipt, ReceiptData } from './ok-receipt.js';

const DATA: ReceiptData = {
  business: { name: 'BAR PEPE' },
  number: 'T-1',
  lines: [{ name: 'Menú', qty: 1, unit_price: 1650, total: 1650 }],
  subtotal: 123456,
  taxes: [{ label: 'IVA 10%', base: 112233, amount: 11223 }],
  total: 123456,
  payment: { method: 'Efectivo', paid: 150000, change: 26544 },
};

async function mount(receipt: ReceiptData): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const nums = (el: OkReceipt): string[] => [...el.shadowRoot!.querySelectorAll('td.num, .qty-price')].map((n) => n.textContent!.trim());

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('ok-receipt — importes en unidad mínima, pintados con el idioma del documento (#81)', () => {
  it('es: «16,50 €», millares agrupados, en línea, totales, pago y cambio', async () => {
    document.documentElement.lang = 'es';
    const el = await mount(DATA);
    expect(nums(el)).toContain('1 × 16,50 €');
    expect(nums(el)).toContain('16,50 €');
    expect(nums(el)).toContain('1.234,56 €');
    expect(nums(el)).toContain('112,23 €');
    expect(nums(el)).toContain('1.500,00 €');
    expect(nums(el)).toContain('265,44 €');
  });

  it('en: «16.50 €» y «1,234.56 €»', async () => {
    document.documentElement.lang = 'en';
    const el = await mount(DATA);
    expect(nums(el)).toContain('16.50 €');
    expect(nums(el)).toContain('1,234.56 €');
  });

  it('`decimals` del documento manda la escala (JPY: 1999 son 1.999 ¥)', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ ...DATA, currency: '¥', decimals: 0, lines: [{ name: 'Ramen', qty: 1, unit_price: 1999, total: 1999 }], subtotal: undefined, taxes: undefined, total: 1999, payment: undefined });
    expect(nums(el)).toContain('1.999 ¥');
  });

  it('un float ya no pasa por dinero: se pinta «—», nunca un importe inventado', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ ...DATA, lines: [{ name: 'Café', qty: 1, unit_price: 1.8, total: 1.8 }], subtotal: undefined, taxes: undefined, total: 1.8, payment: undefined });
    expect(nums(el)).toContain('— €');
    expect(el.shadowRoot!.textContent).not.toContain('1.80');
  });

  it('el objeto entregado no se toca: el dato sigue siendo el entero', async () => {
    document.documentElement.lang = 'es';
    const el = await mount(DATA);
    expect(el.receipt!.lines[0].total).toBe(1650);
    expect(el.receipt!.total).toBe(123456);
  });
});
