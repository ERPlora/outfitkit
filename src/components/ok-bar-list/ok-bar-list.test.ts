// @vitest-environment happy-dom
//
// outfitkit#243 (from ERPlora/cash_register#119) — the hub's home page showed the «Recent cash
// discrepancies» bar list rounded to whole euros: a till 40 cents short read «−0 €» and one 5.50 €
// short read «−6 €». For a panel whose only purpose is to say how much each till was off, that is
// a figure that is not the one on the count.
//
// Cause: the `currency` case forced `maximumFractionDigits: 0`. Money is painted with the minor
// unit of ITS currency (EUR 2, JPY 0, KWD 3), like the KPI tiles of the same page and the till
// screen. The bars that are not money (number, percent, compact) keep their format.
//
// Expected strings are literals, never recomputed with the same Intl call under test.
import { afterEach, describe, expect, it } from 'vitest';

// Side-effect import: the named one below is types-only and would be elided (tag never defined).
import './ok-bar-list.js';
import type { BarListItem, OkBarList } from './ok-bar-list.js';

const mounted: OkBarList[] = [];

afterEach(() => {
  for (const el of mounted.splice(0)) el.remove();
  document.documentElement.lang = '';
});

async function mount(props: Partial<OkBarList>, items: BarListItem[]): Promise<OkBarList> {
  const el = document.createElement('ok-bar-list') as OkBarList;
  Object.assign(el, props);
  el.items = items;
  document.body.appendChild(el);
  mounted.push(el);
  await el.updateComplete;
  return el;
}

// Intl separates the amount from the symbol with a no-break space; normalise it for the literals.
function values(el: OkBarList): string[] {
  return [...el.shadowRoot!.querySelectorAll('.value')].map((n) =>
    (n.textContent ?? '').replace(/[  ]/g, ' ').trim(),
  );
}

function valueTexts(el: OkBarList): string[] {
  return [...el.shadowRoot!.querySelectorAll('[role="progressbar"]')].map((n) =>
    (n.getAttribute('aria-valuetext') ?? '').replace(/[  ]/g, ' '),
  );
}

describe('ok-bar-list — money keeps the decimals of its currency (outfitkit#243)', () => {
  it('paints a 40-cent and a 5.50 € discrepancy with their cents, not rounded to whole euros', async () => {
    const el = await mount({ valueFormat: 'currency', currency: 'EUR', locale: 'es-ES' }, [
      { label: 'S-0007', value: -0.4 },
      { label: 'S-0006', value: -5.5 },
      { label: 'S-0005', value: 12.35 },
    ]);
    expect(values(el)).toEqual(['-0,40 €', '-5,50 €', '12,35 €']);
    // Screen readers hear the same figure the eye reads.
    expect(valueTexts(el)).toEqual(['-0,40 €', '-5,50 €', '12,35 €']);
  });

  it('uses the minor unit of the currency: none for JPY, three for KWD', async () => {
    const yen = await mount({ valueFormat: 'currency', currency: 'JPY', locale: 'es-ES' }, [
      { label: 'A', value: 1234.5 },
    ]);
    expect(values(yen)).toEqual(['1235 JPY']);

    const dinar = await mount({ valueFormat: 'currency', currency: 'KWD', locale: 'es-ES' }, [
      { label: 'A', value: 1.2345 },
    ]);
    expect(values(dinar)).toEqual(['1,235 KWD']);
  });

  it('without a `locale`, follows the language of the page (the hub UI), not the browser', async () => {
    // The hub sets <html lang> to the language the user chose. Two languages, so that whatever the
    // default locale of the machine running the test is, a component ignoring <html lang> fails one.
    document.documentElement.lang = 'es';
    const es = await mount({ valueFormat: 'currency', currency: 'EUR' }, [{ label: 'S-1', value: -0.4 }]);
    expect(values(es)).toEqual(['-0,40 €']);

    document.documentElement.lang = 'en';
    const en = await mount({ valueFormat: 'currency', currency: 'EUR' }, [{ label: 'S-1', value: -0.4 }]);
    expect(values(en)).toEqual(['-€0.40']);
  });

  it('a page language Intl cannot read (`es_ES`) falls back to the browser instead of breaking the list', async () => {
    // OutfitKit also runs on pages it does not control: `Intl` throws a RangeError on `es_ES`, and
    // a throw while rendering leaves the list without a single figure.
    document.documentElement.lang = 'es_ES';
    const el = await mount({ valueFormat: 'currency', currency: 'EUR' }, [{ label: 'S-1', value: -0.4 }]);
    expect(values(el)).toHaveLength(1);
    expect(values(el)[0]).toMatch(/^-(0[.,]40 €|€0\.40)$/);
  });

  it('an explicit `locale` wins over the language of the page', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({ valueFormat: 'currency', currency: 'EUR', locale: 'en-US' }, [
      { label: 'S-1', value: -0.4 },
    ]);
    expect(values(el)).toEqual(['-€0.40']);
  });

  // With cents a figure is wider («18.420,50 €» is 76 px at 390 px; the value column was a fixed
  // 52–60 px), so it spilled over the end of the bar. The value column now fits the widest figure,
  // and every row shares the SAME columns (subgrid) so the bars stay comparable between rows.
  it('sizes the value column to the widest figure, shared by every row', async () => {
    const el = await mount({ valueFormat: 'currency', currency: 'EUR', locale: 'es-ES' }, [
      { label: 'Madrid Centro', value: 18420.5 },
      { label: 'Valencia', value: 9.99 },
    ]);
    const bars = el.shadowRoot!.querySelector('.bars')!;
    const valueColumn = getComputedStyle(bars).gridTemplateColumns.trim().split(/\s+(?![^(]*\))/).pop();
    expect(getComputedStyle(bars).display).toBe('grid');
    expect(valueColumn).toMatch(/^minmax\(.+,\s*max-content\)$/);
    for (const row of el.shadowRoot!.querySelectorAll('.row')) {
      expect(getComputedStyle(row).gridTemplateColumns).toBe('subgrid');
      expect(getComputedStyle(row).gridColumn.replace(/\s/g, '')).toBe('1/-1');
    }
  });

  it('on a narrow phone the list (where the columns live) still gets the compact widths', async () => {
    const happyDOM = (window as unknown as { happyDOM: { setViewport(v: { width: number }): void } }).happyDOM;
    happyDOM.setViewport({ width: 390 });
    try {
      const el = await mount({ valueFormat: 'currency', currency: 'EUR', locale: 'es-ES' }, [
        { label: 'S-1', value: 1 },
      ]);
      const bars = getComputedStyle(el.shadowRoot!.querySelector('.bars')!);
      expect(bars.getPropertyValue('--label-width').trim()).toBe('80px');
      expect(bars.getPropertyValue('--value-width').trim()).toBe('52px');
    } finally {
      happyDOM.setViewport({ width: 1024 });
    }
  });

  it('keeps the bars that are not money as they were', async () => {
    const num = await mount({ valueFormat: 'number', locale: 'es-ES' }, [{ label: 'A', value: 1234.5 }]);
    expect(values(num)).toEqual(['1234,5']);

    const pct = await mount({ valueFormat: 'percent', locale: 'es-ES' }, [{ label: 'A', value: 0.1234 }]);
    expect(values(pct)).toEqual(['12,3 %']);

    const compact = await mount({ valueFormat: 'compact', locale: 'es-ES' }, [{ label: 'A', value: 12345 }]);
    expect(values(compact)).toEqual(['12,3 mil']);
  });
});
