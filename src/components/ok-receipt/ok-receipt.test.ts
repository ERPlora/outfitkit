// @vitest-environment happy-dom
// Contrato del QR PROMOCIONAL del tiquet (reseñas Google, redes, web del negocio).
//
// El tiquet ya pinta el QR FISCAL (VeriFactu) vía `qr`/`qr_note`. El negocio quiere además un QR
// de marketing configurable («Escanea y déjanos una reseña ⭐»). Contrato: `promo_qr`/`promo_note`
// opcionales en ReceiptData; se pinta SIEMPRE al final (después del fiscal, que es el legal), más
// pequeño, y si no viene no deja rastro. Ambos QR conviven en el mismo tiquet.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-receipt.js';
import type { OkReceipt, ReceiptData } from './ok-receipt.js';

const BASE: ReceiptData = {
  business: { name: 'MI NEGOCIO' },
  number: 'T-1',
  lines: [{ name: 'Cafe', qty: 1, unit_price: 1.8, total: 1.8 }],
  total: 1.8,
};

async function montar(receipt: ReceiptData): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

beforeEach(() => { document.body.innerHTML = ''; });

// Contract of the RECEIPT-NUMBER line on papers that have no number.
//
// A pre-bill carries no fiscal number on purpose (the series is consumed when charging), but the
// preview still painted «Receipt:» with nothing after it — labelling as a ticket exactly the
// paper whose whole point is NOT being one. Without a number the label disappears and only the
// datetime remains.
describe('ok-receipt — number line without a number', () => {
  it('with a number the label and the number are painted', async () => {
    const el = await montar({ ...BASE, datetime: '14/08/2026, 09:48' });
    const meta = el.shadowRoot!.querySelector('.meta')!;
    expect(meta.textContent).toContain('Receipt');
    expect(meta.textContent).toContain('T-1');
  });

  it('without a number the label is not painted and the datetime survives', async () => {
    const { number: _omitted, ...bill } = BASE;
    const el = await montar({ ...bill, datetime: '14/08/2026, 09:48' });
    const meta = el.shadowRoot!.querySelector('.meta')!;
    expect(meta.textContent, 'no «Receipt:» label on a paper with no number').not.toContain('Receipt');
    expect(meta.textContent).toContain('14/08/2026, 09:48');
  });
});

// Contract of the document TITLE (screen/paper parity, sales prebill).
//
// The ESC/POS renderer prints the document title as the FIRST line of the paper («CUENTA»,
// `render_prebill` in crates/peripherals) precisely so a bill cannot pass for a fiscal ticket at
// a glance. The on-screen preview must say the same thing: a waiter who checks the preview and a
// customer who reads the paper must not see two different documents.
describe('ok-receipt — document title', () => {
  it('without title nothing extra is painted (fiscal receipts keep their current look)', async () => {
    const el = await montar(BASE);
    expect(el.shadowRoot!.querySelector('.doc-title')).toBeNull();
  });

  it('with title it is the FIRST line of the paper, before the business name', async () => {
    const el = await montar({ ...BASE, title: 'Cuenta' });
    const paper = el.shadowRoot!.querySelector('.paper')!;
    const title = paper.querySelector('.doc-title')!;
    expect(title, 'the title is painted').toBeTruthy();
    expect(title.textContent).toContain('Cuenta');
    const name = paper.querySelector('.biz-name')!;
    expect(
      title.compareDocumentPosition(name) & Node.DOCUMENT_POSITION_FOLLOWING,
      'title comes before the business name, like the printed paper',
    ).toBeTruthy();
  });
});

describe('ok-receipt — QR promocional', () => {
  it('sin promo_qr no se pinta nada promocional', async () => {
    const el = await montar(BASE);
    expect(el.shadowRoot!.querySelector('.promo-wrap')).toBeNull();
  });

  it('con promo_qr pinta el QR + su nota', async () => {
    const el = await montar({
      ...BASE,
      promo_qr: 'https://g.page/r/mi-negocio/review',
      promo_note: 'Escanea y déjanos una reseña',
    });
    const wrap = el.shadowRoot!.querySelector('.promo-wrap')!;
    expect(wrap, 'se pinta el bloque promocional').toBeTruthy();
    const qr = wrap.querySelector('ok-qr') as HTMLElement & { value: string };
    expect(qr?.value).toBe('https://g.page/r/mi-negocio/review');
    expect(wrap.textContent).toContain('Escanea y déjanos una reseña');
  });

  it('convive con el QR fiscal y va DESPUÉS de él (el fiscal es el legal)', async () => {
    const el = await montar({
      ...BASE,
      qr: 'https://aeat/validar',
      qr_note: 'Escanea para validar en la AEAT',
      promo_qr: 'https://g.page/r/mi-negocio/review',
    });
    const qrs = [...el.shadowRoot!.querySelectorAll('ok-qr')] as (HTMLElement & { value: string })[];
    expect(qrs.length, 'dos QR: fiscal + promo').toBe(2);
    expect(qrs[0].value, 'el fiscal primero').toBe('https://aeat/validar');
    expect(qrs[1].value, 'el promocional al final').toBe('https://g.page/r/mi-negocio/review');
  });

  it('el QR promocional es más pequeño que el fiscal', async () => {
    const el = await montar({ ...BASE, qr: 'https://aeat/validar', promo_qr: 'https://g.page/r' });
    const [fiscal, promo] = [...el.shadowRoot!.querySelectorAll('ok-qr')] as (HTMLElement & { size: number })[];
    expect(promo.size).toBeLessThan(fiscal.size);
  });
});
