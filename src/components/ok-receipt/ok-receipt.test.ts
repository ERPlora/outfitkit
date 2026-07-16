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
