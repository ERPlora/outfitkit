// @vitest-environment happy-dom

// outfitkit#270 — on a phone the on-screen invoice pushed its amount column out of the sheet: the
// lines table (description, qty, price, disc., tax, amount) needs ~340 px of content and a 375 px
// screen leaves ~300 px for the whole sheet, 14 mm of padding each side included. Measured in
// Chromium on the showcase at 375x667: amount cells 92 px past the sheet's right edge.
//
// The on-screen invoice now adapts to ITS OWN width (container query) the way a mobile receipt
// does (Square, Shopify): each line is description + amount, with «qty × price · disc. · tax» as a
// muted line under the description. Paper is untouched: the compact layout lives under
// `@media screen`, so a printed A4 keeps every column.
//
// happy-dom does no layout, so the contract is fixed on the component's own stylesheet: resolve,
// for a sheet `px` wide and a media type, the value the cascade leaves on an element.
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-invoice.js';
import type { OkInvoice, InvoiceData } from './ok-invoice.js';

type Media = 'screen' | 'print';
type Decl = { value: string; important: boolean; specificity: number; order: number };

// `selector` ends on `target` (pseudo-classes allowed). A one-compound target (`.col-detail`) matches
// the last compound; a descendant one (`.summary table`) the selector's tail. A pseudo-element styles
// something else: it only counts when the target names it (`.desc::after`).
function targets(selector: string, target: string): boolean {
  if (selector.includes('::') !== target.includes('::')) return false;
  const bare = selector.replace(/(?<!:):(?!:|host\b)[\w-]+(\([^)]*\))?/g, '').replace(/\s+/g, ' ').trim();
  if (target.includes(' ')) return bare === target || bare.endsWith(` ${target}`);
  return (bare.split(/\s*[\s>+~]\s*/).pop() ?? '') === target;
}

function specificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const types = (selector.replace(/\([^)]*\)/g, '').match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return ids * 10000 + classes * 100 + types;
}

function containerMatches(condition: string, px: number): boolean {
  const toPx = (n: string, unit: string): number => parseFloat(n) * (unit === 'rem' ? 16 : 1);
  const c = condition.replace(/^[\w-]+\s+/, '').trim().replace(/^\(|\)$/g, '').trim();
  let m = /^(max|min)-width\s*:\s*([\d.]+)(px|rem)$/.exec(c);
  if (m) return m[1] === 'max' ? px <= toPx(m[2], m[3]) : px >= toPx(m[2], m[3]);
  m = /^width\s*(<=|<|>=|>)\s*([\d.]+)(px|rem)$/.exec(c);
  if (m) {
    const limit = toPx(m[2], m[3]);
    return { '<': px < limit, '<=': px <= limit, '>': px > limit, '>=': px >= limit }[m[1]]!;
  }
  throw new Error(`unreadable @container condition: ${condition}`);
}

function mediaMatches(condition: string, media: Media): boolean {
  const c = condition.trim();
  if (c === 'print' || c === 'screen') return c === media;
  throw new Error(`unreadable @media condition: ${condition}`);
}

function stylesheet(): CSSStyleSheet {
  const styles = (customElements.get('ok-invoice') as unknown as { styles: unknown }).styles;
  const list = (Array.isArray(styles) ? styles : [styles]) as Array<{ cssText: string }>;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(list.map((s) => s.cssText).join('\n'));
  return sheet;
}

/** Value the cascade leaves on `selector`/`prop` for a sheet `px` wide on `media` ('' = none). */
function cssAt(selector: string, prop: string, px: number, media: Media): string {
  let won: Decl | null = null;
  let order = 0;
  const beats = (a: Decl, b: Decl): boolean =>
    a.important !== b.important
      ? a.important
      : a.specificity !== b.specificity
        ? a.specificity > b.specificity
        : a.order > b.order;
  const walk = (rules: CSSRuleList): void => {
    for (const rule of Array.from(rules)) {
      if (rule instanceof CSSStyleRule) {
        const value = rule.style.getPropertyValue(prop).trim();
        if (!value) continue;
        const important = rule.style.getPropertyPriority(prop) === 'important';
        for (const sel of rule.selectorText.split(',').map((x) => x.trim())) {
          if (!targets(sel, selector)) continue;
          const decl = { value, important, specificity: specificity(sel), order: order++ };
          if (!won || beats(decl, won)) won = decl;
        }
      } else if (rule.constructor.name === 'CSSContainerRule') {
        const r = rule as CSSRule & { conditionText: string; cssRules: CSSRuleList };
        if (containerMatches(r.conditionText, px)) walk(r.cssRules);
      } else if (rule.constructor.name === 'CSSMediaRule') {
        const r = rule as CSSRule & { conditionText: string; cssRules: CSSRuleList };
        if (mediaMatches(r.conditionText, media)) walk(r.cssRules);
      }
    }
  };
  walk(stylesheet().cssRules);
  return won ? (won as Decl).value : '';
}

/** Every length of a shorthand (`16px 14px`, `4mm`) in px. */
function lengthsPx(value: string): number[] {
  const unit: Record<string, number> = { px: 1, rem: 16, mm: 96 / 25.4 };
  return value.split(/\s+/).map((v) => {
    const m = /^([\d.]+)(px|rem|mm)?$/.exec(v);
    if (!m) throw new Error(`unreadable length: ${value}`);
    return parseFloat(m[1]) * (m[2] ? unit[m[2]] : 1);
  });
}

// A 375 px phone leaves the sheet ~300-375 px; a 320 px one, less. The A4 on a tablet or desktop
// (sheet 746 / 794 px wide on the showcase at 820 and 1440) keeps its columns.
const PHONE = [300, 343, 375];
const WIDE = [640, 746, 794];

const DATA: InvoiceData = {
  issuer: { name: 'ERPlora S.L.', tax_id: 'B-1' },
  customer: { name: 'Cliente' },
  number: 'F-1',
  issue_date: '2026-09-30',
  lines: [
    { description: 'Soporte prioritario (horas)', qty: 2.5, unit_price: 6000, discount_percent: 10, tax_rate: 21, total: 13500 },
    { description: 'Aceite de oliva 5 l', qty: 1, unit_price: 315, total: 315 },
    { description: 'Curso exento', qty: 1, unit_price: 1000, tax_rate: 0, total: 1000 },
  ],
  subtotal: 13815,
  taxes: [{ label: 'IVA 21%', rate: 21, base: 13500, amount: 2835 }],
  tax_total: 2835,
  total: 16650,
  currency: 'EUR',
};

async function mount(invoice: InvoiceData): Promise<OkInvoice> {
  const el = document.createElement('ok-invoice') as OkInvoice;
  el.invoice = invoice;
  el.labels = { discount: 'Dto.', tax: 'IVA' };
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const text = (n: Element | null | undefined): string => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();

beforeEach(() => {
  document.body.innerHTML = '';
  document.documentElement.lang = 'es';
});

describe('ok-invoice — on a phone the lines fit the sheet (#270)', () => {
  it('the host is a named inline-size container on screen', () => {
    expect(cssAt(':host', 'container-type', 375, 'screen')).toBe('inline-size');
    expect(cssAt(':host', 'container-name', 375, 'screen')).toBe('ok-invoice');
  });

  it('every @container rule queries the host by that name (an unnamed or renamed one never folds)', () => {
    const names: string[] = [];
    const walk = (rules: CSSRuleList): void => {
      for (const rule of Array.from(rules)) {
        const r = rule as CSSRule & { conditionText?: string; cssRules?: CSSRuleList };
        if (rule.constructor.name === 'CSSContainerRule') {
          names.push(/^([\w-]+)\s*\(/.exec(r.conditionText ?? '')?.[1] ?? '');
        } else if (r.cssRules) walk(r.cssRules);
      }
    };
    walk(stylesheet().cssRules);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((n) => n === cssAt(':host', 'container-name', 375, 'screen'))).toBe(true);
  });

  it.each(PHONE)('at %i px on screen, qty/price/disc./tax columns fold away', (px) => {
    expect(cssAt('.col-detail', 'display', px, 'screen')).toBe('none');
  });

  it.each(PHONE)('at %i px on screen, the «qty × price» line under the description shows', (px) => {
    const display = cssAt('.desc::after', 'display', px, 'screen');
    expect(display).not.toBe('');
    expect(display).not.toBe('none');
  });

  it.each(PHONE)('at %i px on screen, the sheet padding leaves room for the lines (≤ 16 px)', (px) => {
    const pad = lengthsPx(cssAt('.sheet', 'padding', px, 'screen'));
    expect(Math.max(...pad)).toBeLessThanOrEqual(16);
  });

  it.each(PHONE)('at %i px on screen, the totals table does not demand 70 mm', (px) => {
    expect(cssAt('.summary table', 'min-width', px, 'screen')).toBe('0');
  });

  it.each(PHONE)('at %i px on screen, the issuer and the «INVOICE» block wrap instead of pushing out', (px) => {
    // Measured in Chromium without these two: the doc block stuck out 21 px at 375 and 76 px at 320.
    expect(cssAt('.top', 'flex-wrap', px, 'screen')).toBe('wrap');
    expect(cssAt('.doc', 'min-width', px, 'screen')).toBe('0');
  });

  it.each(PHONE)('at %i px on screen, the stacked «INVOICE» block reads from the left like the issuer', (px) => {
    expect(cssAt('.doc', 'text-align', px, 'screen')).toBe('left');
    expect(cssAt('.doc-grid', 'justify-content', px, 'screen')).toBe('start');
    expect(cssAt('.doc-grid .k', 'text-align', px, 'screen')).toBe('left');
    expect(cssAt('.doc-grid .v', 'text-align', px, 'screen')).toBe('left');
  });

  it.each(WIDE)('at %i px on screen, the «INVOICE» block stays on the right of the A4', (px) => {
    expect(cssAt('.doc', 'text-align', px, 'screen')).toBe('right');
    expect(cssAt('.doc-grid', 'justify-content', px, 'screen')).toBe('end');
  });

  it.each(PHONE)('at %i px on screen, the description takes the room the folded columns left', (px) => {
    expect(cssAt('.desc', 'width', px, 'screen')).toBe('auto');
  });

  it.each(WIDE)('at %i px on screen, the A4 keeps every column and no extra line', (px) => {
    expect(cssAt('.col-detail', 'display', px, 'screen')).not.toBe('none');
    expect(cssAt('.desc::after', 'display', px, 'screen')).toBe('none');
  });

  it.each([...PHONE, ...WIDE])('on paper (%i px), every column prints and the extra line never does', (px) => {
    expect(cssAt('.col-detail', 'display', px, 'print')).not.toBe('none');
    expect(cssAt('.desc::after', 'display', px, 'print')).toBe('none');
  });

  it('every qty/price/disc./tax cell and header is a .col-detail; description and amount are not', async () => {
    const el = await mount(DATA);
    const head = [...el.shadowRoot!.querySelectorAll('table.lines thead th')];
    const cells = [...el.shadowRoot!.querySelectorAll('table.lines tbody tr')[0].querySelectorAll('td')];
    for (const row of [head, cells]) {
      expect(row).toHaveLength(6);
      expect(row.map((c) => c.classList.contains('col-detail'))).toEqual([false, true, true, true, true, false]);
    }
  });

  it('the phone line paints the folded columns from the description cell', () => {
    expect(cssAt('.desc::after', 'content', 375, 'screen')).toBe('attr(data-meta)');
  });

  it('the line under the description carries qty × price, discount and tax in the document language', async () => {
    const el = await mount(DATA);
    const desc = [...el.shadowRoot!.querySelectorAll('table.lines tbody td.desc')];
    const meta = desc.map((td) => (td.getAttribute('data-meta') ?? '').replace(/\s+/g, ' '));
    expect(meta[0]).toBe('2,5 × 60,00 EUR · Dto. 10 % · IVA 21 %');
    // A line without discount or tax says only what it has.
    expect(meta[1]).toBe('1 × 3,15 EUR');
    // An exempt line says so, as its tax column does («0 %», not «—»).
    expect(meta[2]).toBe('1 × 10,00 EUR · IVA 0 %');
    // The cell's own text is still the description alone (what a reader, a copy or a test reads).
    expect(text(desc[0])).toBe('Soporte prioritario (horas)');
  });
});
