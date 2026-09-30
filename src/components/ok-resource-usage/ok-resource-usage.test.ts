// @vitest-environment happy-dom
//
// Contract of ok-resource-usage — a DUMB 0-100% resource panel shared by the Hub
// (Vue) and the Cloud (Django): everything arrives precomputed by the server and
// the component only paints. The hard rules fixed here:
//   - colors ALWAYS derive from the received `status`, never recomputed from `current`;
//   - `known === false` renders an unreadable state — NEVER a green zero (ADR-0237);
//   - the displayed value clamps at 100 while the tooltip keeps the real value;
//   - the upgrade CTA renders only when `upgrade.show` is true.
import { afterEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it
// (the baked icons are irrelevant for the behavioural contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconAlertCircleOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import './ok-resource-usage.js';
import type { OkResourceMetric, OkResourceUsage } from './ok-resource-usage.js';
import type { OkChart } from '../ok-chart/ok-chart.js';
import type { OkGauge } from '../ok-gauge/ok-gauge.js';

function baseMetric(over: Partial<OkResourceMetric> = {}): OkResourceMetric {
  return {
    known: true,
    current: 42,
    points: [
      [1755200000, 40],
      [1755203600, 42],
    ],
    status: 'ok',
    message: null,
    ...over,
  };
}

async function usage(props: Partial<OkResourceUsage> = {}): Promise<OkResourceUsage> {
  const el = document.createElement('ok-resource-usage') as OkResourceUsage;
  el.metric = baseMetric();
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function gauge(el: OkResourceUsage): OkGauge | null {
  return el.shadowRoot!.querySelector('ok-gauge');
}
function chart(el: OkResourceUsage): OkChart | null {
  return el.shadowRoot!.querySelector('ok-chart');
}

afterEach(() => {
  document.body.innerHTML = '';
});

// ── Layout guard (outfitkit#263) ────────────────────────────────────────────────
// happy-dom does no layout, so the narrow-column contract is fixed on the component's
// own stylesheet: parse it and resolve, for a panel `px` wide, the value the cascade
// leaves on an element — every rule whose selector ends on it counts (`.panel .range`,
// `.range:first-child`; a pseudo-ELEMENT like `.range::after` styles something else),
// `!important` first, then the higher specificity, then the later rule; `@container`
// blocks only count when their condition holds at that width. A condition this resolver
// cannot read fails the test instead of being silently skipped.
type Decl = { value: string; important: boolean; specificity: number; order: number };

// The last compound of `selector` targets `target` (pseudo-classes allowed, no pseudo-element).
function targets(selector: string, target: string): boolean {
  if (selector.includes('::')) return false;
  const last = selector.split(/\s*[\s>+~]\s*/).pop() ?? '';
  const bare = last.replace(/:(?!host\b)[\w-]+(\([^)]*\))?/g, '');
  return bare === target;
}

// ids · classes/attributes/pseudo-classes · types, packed in one comparable number.
function specificity(selector: string): number {
  const ids = (selector.match(/#[\w-]+/g) ?? []).length;
  const classes = (selector.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const types = (selector.replace(/\([^)]*\)/g, '').match(/(^|[\s>+~])[a-z][\w-]*/gi) ?? [])
    .length;
  return ids * 10000 + classes * 100 + types;
}

function containerMatches(condition: string, px: number): boolean {
  const toPx = (n: string, unit: string): number => parseFloat(n) * (unit === 'rem' ? 16 : 1);
  const clauses = condition.split(/\s+and\s+/);
  return clauses.every((raw) => {
    const c = raw.trim().replace(/^\(|\)$/g, '').trim();
    let m = /^(max|min)-width\s*:\s*([\d.]+)(px|rem)$/.exec(c);
    if (m) return m[1] === 'max' ? px <= toPx(m[2], m[3]) : px >= toPx(m[2], m[3]);
    m = /^width\s*(<=|<|>=|>)\s*([\d.]+)(px|rem)$/.exec(c);
    if (m) {
      const limit = toPx(m[2], m[3]);
      return { '<': px < limit, '<=': px <= limit, '>': px > limit, '>=': px >= limit }[m[1]]!;
    }
    throw new Error(`unreadable @container condition: ${condition}`);
  });
}

function stylesheet(): CSSStyleSheet {
  const styles = (customElements.get('ok-resource-usage') as unknown as { styles: unknown })
    .styles;
  const list = (Array.isArray(styles) ? styles : [styles]) as Array<{ cssText: string }>;
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(list.map((s) => s.cssText).join('\n'));
  return sheet;
}

/** Value the cascade leaves on `selector`/`prop` for a panel `px` wide ('' = none). */
function cssAt(selector: string, prop: string, px: number): string {
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
        // The panel adapts to ITS width, not the viewport's: a @media rule that moved
        // the layout would lie in a narrow column of a wide screen.
        const r = rule as CSSRule & { cssRules: CSSRuleList };
        for (const inner of Array.from(r.cssRules)) {
          if (inner instanceof CSSStyleRule && /\.(head|body|dial|trend|label|range|unreadable)\b/.test(inner.selectorText)) {
            throw new Error(`panel layout must not depend on the viewport: ${inner.cssText}`);
          }
        }
      }
    }
  };
  walk(stylesheet().cssRules);
  return won ? (won as Decl).value : '';
}

describe('ok-resource-usage', () => {
  it('renders gauge and chart from metric prop', async () => {
    const el = await usage();

    const g = gauge(el);
    expect(g, 'renders an ok-gauge for the current value').not.toBeNull();
    expect(g!.type).toBe('ring');
    expect(g!.value).toBe(42);

    const c = chart(el);
    expect(c, 'renders an ok-chart with the history').not.toBeNull();
    expect(c!.type).toBe('area');
    expect(c!.min).toBe(0);
    expect(c!.max).toBe(100);
    expect(c!.series[0].data).toEqual([40, 42]);
  });

  it('applies warning color at 70 and critical above 80 via provided status', async () => {
    // The band only exists when the server says something (outfitkit#262), so each
    // status carries its message here.
    const warn = await usage({
      metric: baseMetric({ current: 70, status: 'warning', message: 'At 70% of your plan' }),
    });
    expect(gauge(warn)!.color).toContain('--ion-color-warning');
    expect(warn.shadowRoot!.querySelector('.status--warning')).not.toBeNull();

    const crit = await usage({
      metric: baseMetric({ current: 85, status: 'critical', message: 'Over 80% for 2 h' }),
    });
    expect(gauge(crit)!.color).toContain('--ion-color-danger');
    expect(crit.shadowRoot!.querySelector('.status--critical')).not.toBeNull();
  });

  it('renders unreadable state when known is false (never zero-green)', async () => {
    const el = await usage({
      metric: baseMetric({ known: false, current: null, points: [], status: 'unknown' }),
    });

    expect(gauge(el), 'no gauge: a zero would read as healthy').toBeNull();
    expect(chart(el), 'no chart flat at zero').toBeNull();

    const box = el.shadowRoot!.querySelector('.unreadable');
    expect(box, 'renders the not-measured state').not.toBeNull();
    expect(box!.textContent).toContain('Could not read it'); // English default

    el.unreadableLabel = 'No se ha podido leer';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.unreadable')!.textContent).toContain(
      'No se ha podido leer',
    );
  });

  it('shows CTA only when upgrade.show', async () => {
    const without = await usage();
    expect(without.shadowRoot!.querySelector('a.upgrade')).toBeNull();

    const hidden = await usage({ upgrade: { show: false, message: 'Upgrade', url: '/plans' } });
    expect(hidden.shadowRoot!.querySelector('a.upgrade')).toBeNull();

    const shown = await usage({
      upgrade: { show: true, message: 'Upgrade your plan', url: 'https://erplora.com/plans' },
    });
    const cta = shown.shadowRoot!.querySelector('a.upgrade');
    expect(cta).not.toBeNull();
    expect(cta!.getAttribute('href')).toBe('https://erplora.com/plans');
    expect(cta!.textContent).toContain('Upgrade your plan');
  });

  it('clamps displayed percentage at 100 keeping real value in tooltip', async () => {
    const el = await usage({ metric: baseMetric({ current: 137, status: 'critical' }) });

    expect(gauge(el)!.value).toBe(100); // visual clamp

    const tooltip = el.shadowRoot!.querySelector('[title]');
    expect(tooltip, 'the real value survives in the tooltip').not.toBeNull();
    expect(tooltip!.getAttribute('title')).toContain('137');
  });

  it('draws no status band when the server has nothing to say (outfitkit#262)', async () => {
    for (const message of [null, '', '   ']) {
      const el = await usage({ metric: baseMetric({ status: 'ok', message }) });
      expect(
        el.shadowRoot!.querySelector('.status'),
        `no empty colored band for message ${JSON.stringify(message)}`,
      ).toBeNull();
      el.remove();
    }
  });

  it('draws the band with the message, colored by the received status', async () => {
    const el = await usage({
      metric: baseMetric({ current: 77, status: 'warning', message: 'At 77% of your plan limit' }),
    });
    const band = el.shadowRoot!.querySelector<HTMLElement>('.status');
    expect(band, 'a message gets its band').not.toBeNull();
    expect(band!.classList.contains('status--warning')).toBe(true);
    expect(band!.textContent!.trim()).toBe('At 77% of your plan limit');
    expect(band!.getAttribute('style')).toContain('--ion-color-warning');

    // The band follows the metric: once the server stops sending a message it goes away.
    el.metric = baseMetric({ current: 12, status: 'ok', message: null });
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.status')).toBeNull();
  });

  describe('fits a narrow column (outfitkit#263)', () => {
    it('adapts to its own width: the host is an inline-size container', () => {
      expect(cssAt(':host', 'container-type', 160)).toBe('inline-size');
    });

    it('drops the range chip below the name, whole, instead of squeezing both on one line', () => {
      for (const px of [160, 520]) {
        expect(cssAt('.head', 'flex-wrap', px), `head wraps at ${px}px`).toBe('wrap');
        expect(cssAt('.range', 'white-space', px), `range never splits at ${px}px`).toBe('nowrap');
      }
      // A name longer than the column breaks inside the panel instead of pushing it out.
      expect(cssAt('.label', 'min-width', 160)).toBe('0');
      expect(cssAt('.label', 'overflow-wrap', 160)).toBe('anywhere');
    });

    it('puts the trend under the dial when both do not fit side by side', () => {
      // 240px = 110px dial + 1rem gap + a trend at least as wide as the dial.
      for (const px of [160, 228, 239]) {
        expect(cssAt('.body', 'flex-direction', px), `stacked at ${px}px`).toBe('column');
        expect(cssAt('.body', 'align-items', px), `trend spans the panel at ${px}px`).toBe(
          'stretch',
        );
        expect(cssAt('.dial', 'align-self', px), `dial centered at ${px}px`).toBe('center');
      }
      for (const px of [240, 320, 520]) {
        expect(cssAt('.body', 'flex-direction', px), `side by side at ${px}px`).not.toBe(
          'column',
        );
      }
    });

    it('stacks the not-measured notice so its text is not split word by word', () => {
      for (const px of [160, 239]) {
        expect(cssAt('.unreadable', 'flex-direction', px), `stacked at ${px}px`).toBe('column');
        // Stacked, the icon and the text start on the left like the rest of the panel
        // instead of inheriting the row's centering.
        expect(cssAt('.unreadable', 'align-items', px), `left-aligned at ${px}px`).toBe(
          'flex-start',
        );
      }
      expect(cssAt('.unreadable', 'flex-direction', 240)).not.toBe('column');
    });
  });
});
