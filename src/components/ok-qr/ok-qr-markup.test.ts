// @vitest-environment happy-dom
// Contract of `qrSvgMarkup` (sales#340): the SAME QR `<ok-qr>` paints, as a static SVG string.
//
// Why a string: the ticket printed by the browser is a standalone HTML document written into an
// isolated iframe (sales `receipt-html.ts`). No custom element is defined in there and no script
// runs, so the fiscal QR has to travel as plain markup. The encoder is the one `<ok-qr>` uses —
// one implementation, so the paper and the screen can never disagree on the code.
import { describe, expect, it } from 'vitest';
import { OkQr, qrSvgMarkup } from './ok-qr.js';

const QR = 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=T-1&fecha=23-09-2026&importe=1.80';

async function renderedPath(value: string): Promise<string | null> {
  const el = document.createElement('ok-qr') as OkQr;
  el.value = value;
  document.body.appendChild(el);
  await el.updateComplete;
  const d = el.shadowRoot?.querySelector('path.qr-fg')?.getAttribute('d') ?? null;
  el.remove();
  return d;
}

function markupPath(markup: string): string | null {
  return new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('path')?.getAttribute('d') ?? null;
}

describe('qrSvgMarkup', () => {
  it('draws exactly the modules <ok-qr> draws for the same value', async () => {
    const d = markupPath(qrSvgMarkup(QR));
    expect(d).toBeTruthy();
    expect(d).toBe(await renderedPath(QR));
  });

  it('is a standalone SVG sized in px, black on white, with the quiet zone in the viewBox', () => {
    const svg = new DOMParser().parseFromString(qrSvgMarkup(QR, { size: 120 }), 'image/svg+xml').querySelector('svg');
    expect(svg?.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    expect(svg?.getAttribute('width')).toBe('120');
    expect(svg?.getAttribute('height')).toBe('120');
    const [, , w, h] = (svg?.getAttribute('viewBox') ?? '').split(' ').map(Number);
    // Version 4 at level M for this URL is 33 modules + 4 of quiet zone on each side.
    expect(w).toBe(h);
    expect(w).toBeGreaterThanOrEqual(21 + 8);
    expect(svg?.querySelector('rect')?.getAttribute('fill')).toBe('#fff');
    expect(svg?.querySelector('path')?.getAttribute('fill')).toBe('#000');
  });

  it('escapes the value in its accessible label: the data is typed by users', () => {
    const markup = qrSvgMarkup('a"><script>x</script>');
    expect(markup).not.toContain('<script>');
    const svg = new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('svg');
    expect(svg?.querySelector('script')).toBeNull();
  });

  it('returns an empty string when there is nothing to encode or it does not fit', () => {
    expect(qrSvgMarkup('')).toBe('');
    expect(qrSvgMarkup('x'.repeat(5000))).toBe('');
  });
});
