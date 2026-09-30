// @vitest-environment happy-dom

// outfitkit#81 — `<ok-money>`: money is an INTEGER in minor units (ADR-0123) and the screen shows it
// with the separators of the document's language. This element is the ONE place OutfitKit turns that
// integer into text, and it does it BY STRING — cut the digits at `decimals`, group the rest by three —
// never through a float: no `/100`, no `toFixed`, nothing that could alter the value. The attribute
// keeps the integer untouched; only the shadow text is formatted.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-money.js';
import { formatMinor, formatPercent, formatQuantity } from './ok-money.js';
import type { OkMoney } from './ok-money.js';

async function mount(attrs: Record<string, string>): Promise<OkMoney> {
  const el = document.createElement('ok-money') as OkMoney;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const text = (el: OkMoney): string => el.shadowRoot!.textContent!.trim();

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.removeAttribute('lang');
});

describe('formatMinor — el entero se corta, no se divide', () => {
  it('es: coma decimal, punto de millares, símbolo detrás', () => {
    expect(formatMinor(1650, { decimals: 2, locale: 'es', currency: '€' })).toBe('16,50 €');
    expect(formatMinor('123456', { decimals: 2, locale: 'es', currency: '€' })).toBe('1.234,56 €');
  });

  it('en: punto decimal, coma de millares', () => {
    expect(formatMinor(123456, { decimals: 2, locale: 'en', currency: '€' })).toBe('1,234.56 €');
  });

  it('agrupa SIEMPRE desde cuatro dígitos (hub#1090: CLDR es dejaría «1234,56»)', () => {
    expect(formatMinor(123456, { decimals: 2, locale: 'es' })).toBe('1.234,56');
    expect(formatMinor(123456789, { decimals: 2, locale: 'es' })).toBe('1.234.567,89');
  });

  it('rellena a la izquierda: 5 céntimos son «0,05», 0 es «0,00»', () => {
    expect(formatMinor(5, { decimals: 2, locale: 'es' })).toBe('0,05');
    expect(formatMinor(0, { decimals: 2, locale: 'es' })).toBe('0,00');
    expect(formatMinor(50, { decimals: 2, locale: 'es' })).toBe('0,50');
  });

  it('negativos llevan el signo delante', () => {
    expect(formatMinor(-1650, { decimals: 2, locale: 'es', currency: '€' })).toBe('-16,50 €');
    expect(formatMinor(-5, { decimals: 2, locale: 'es' })).toBe('-0,05');
  });

  it('la escala la manda `decimals`: JPY 0, KWD 3', () => {
    expect(formatMinor(1999, { decimals: 0, locale: 'ja', currency: '¥' })).toBe('1,999 ¥');
    expect(formatMinor(1234567, { decimals: 3, locale: 'en', currency: 'KWD' })).toBe('1,234.567 KWD');
  });

  it('no altera nada que un float alteraría: 7 × 0,05 son 35 céntimos y se pintan «0,35»', () => {
    expect(formatMinor(35, { decimals: 2, locale: 'es' })).toBe('0,35');
    // A big integer stays exact — a float would already have lost digits here.
    expect(formatMinor('900719925474099', { decimals: 2, locale: 'en' })).toBe('9,007,199,254,740.99');
  });

  it('un valor que no es entero no se inventa: pinta «—»', () => {
    expect(formatMinor(16.5, { decimals: 2, locale: 'es' })).toBe('—');
    expect(formatMinor('abc', { decimals: 2, locale: 'es' })).toBe('—');
    expect(formatMinor(undefined, { decimals: 2, locale: 'es' })).toBe('—');
  });
});

describe('<ok-money> — el atributo guarda el entero; el texto es solo pintado', () => {
  it('pinta el valor con el idioma del documento', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ value: '1650', currency: '€' });
    expect(text(el)).toBe('16,50 €');
    expect(el.getAttribute('value'), 'el atributo ha cambiado: el dato se ha alterado').toBe('1650');
  });

  it('`locale` explícito manda sobre el idioma del documento', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ value: '1650', locale: 'en', currency: '€' });
    expect(text(el)).toBe('16.50 €');
  });

  it('`decimals` por defecto 2; sin idioma en el documento, separadores ingleses', async () => {
    const el = await mount({ value: '123456' });
    expect(text(el)).toBe('1,234.56');
  });

  it('acepta el valor como propiedad numérica (lo que devuelve el runtime)', async () => {
    document.documentElement.lang = 'es';
    const el = document.createElement('ok-money') as OkMoney;
    el.value = 1650;
    el.decimals = 2;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(text(el)).toBe('16,50');
  });

  it('se alinea como número: cifras tabulares', async () => {
    await mount({ value: '1' });
    const ctor = customElements.get('ok-money') as unknown as { styles: { cssText: string } };
    expect(String(ctor.styles.cssText)).toMatch(/font-variant-numeric:\s*tabular-nums/);
  });
});

// outfitkit#253 — quantities and percentages are NOT money (they may carry decimals and arrive as
// numbers), but a printed paper has to write them with the same separators as the money beside them.
describe('formatQuantity / formatPercent — non-money numbers in the document language (#253)', () => {
  const plain = (s: string) => s.replace(/\s/g, ' ');

  it('quantity: «1,5» in es, «1.5» in en, whole numbers without padding zeros', () => {
    expect(formatQuantity(1.5, 'es')).toBe('1,5');
    expect(formatQuantity(1.5, 'en')).toBe('1.5');
    expect(formatQuantity(2, 'es')).toBe('2');
    expect(formatQuantity(0.125, 'es')).toBe('0,125');
    // The row keeps quantities in 10⁶ fixed point (ADR-0147): all six decimals reach the paper.
    expect(formatQuantity(1.234567, 'es')).toBe('1,234567');
  });

  it('percent: «5,2 %» / «21 %» in es, «5.2%» / «21%» in en', () => {
    expect(plain(formatPercent(5.2, 'es'))).toBe('5,2 %');
    expect(plain(formatPercent(21, 'es'))).toBe('21 %');
    expect(formatPercent(5.2, 'en')).toBe('5.2%');
    expect(formatPercent(21, 'en')).toBe('21%');
  });

  it('percent keeps the two decimals a tax rate can carry and no float noise (0.1 + 0.2)', () => {
    expect(formatPercent(1.75, 'en')).toBe('1.75%');
    expect(formatPercent(0.1 + 0.2, 'en')).toBe('0.3%');
  });

  it('an unreadable locale (es_ES) does not throw', () => {
    expect(() => formatQuantity(1.5, 'es_ES')).not.toThrow();
    // «es_ES» is retried as «es-ES»: the paper keeps the Spanish separators, not the browser's.
    expect(formatQuantity(1.5, 'es_ES')).toBe('1,5');
    expect(plain(formatPercent(21, 'es_ES'))).toBe('21 %');
  });

  it('what is not a finite number is painted «—», never «NaN» or «undefined»', () => {
    expect(formatQuantity(Number.NaN, 'es')).toBe('—');
    expect(formatQuantity(undefined as unknown as number, 'es')).toBe('—');
    expect(formatPercent(Number.POSITIVE_INFINITY, 'es')).toBe('—');
  });
});
