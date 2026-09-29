// @vitest-environment happy-dom

// outfitkit#246 (from hub#2387) - "on a tablet the KPI figure breaks in two lines: «18.405,00» / «€»".
//
// Measured in Chromium on the hub home (hub:stable + cash_register, 834x1112): the KPI cell leaves
// the figure 151px and "18.405,00 €" at the fixed 1.75rem (28px, bold) needs ~175px, so the text
// wrapped at any character (Ionic's `overflow-wrap: break-word`, inherited from ion-app). Shopify,
// Square and Stripe keep a KPI figure on ONE line and scale it down to fit its card. So ok-kpi:
//   - never wraps the figure (white-space: nowrap);
//   - shrinks the font just enough to fit its width, down to a legible floor (1rem);
//   - below the floor it cuts with an ellipsis and keeps the full figure as the tooltip;
//   - measures again when the card is resized or the figure changes.
//
// happy-dom has no layout: the figure's widths are modelled like Chromium paints them - its
// natural width scales linearly with its font size, boxes and text have fractional widths, and
// clientWidth/scrollWidth round them to whole pixels - and the ResizeObserver is captured by hand.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconRemove: '<svg></svg>',
  iconTrendingDown: '<svg></svg>',
  iconTrendingUp: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import './ok-kpi.js';
import { OkKpi } from './ok-kpi.js';

const MAX_PX = 28; // 1.75rem at a 16px root
const MIN_PX = 16; // 1rem

let observers: Array<{ cb: ResizeObserverCallback; targets: Element[] }> = [];

class FakeResizeObserver {
  private entry: { cb: ResizeObserverCallback; targets: Element[] };
  constructor(cb: ResizeObserverCallback) {
    this.entry = { cb, targets: [] };
    observers.push(this.entry);
  }
  observe(target: Element): void {
    this.entry.targets.push(target);
  }
  unobserve(): void {}
  disconnect(): void {
    this.entry.targets = [];
  }
}

/** Fire every observer watching `el`, as Chromium does after a layout that changed its size. */
function resize(el: Element): void {
  for (const o of observers) {
    if (o.targets.includes(el)) o.cb([], o as unknown as ResizeObserver);
  }
}

const valueEl = (kpi: OkKpi): HTMLElement => kpi.shadowRoot!.querySelector('.value') as HTMLElement;

/** Painted font size of the figure, in px (inline override or the stylesheet's 1.75rem). */
function fontPx(el: HTMLElement): number {
  const inline = el.style.fontSize;
  return inline ? parseFloat(inline) : MAX_PX;
}

/** Text width (fractional) each laid-out figure needs at 1.75rem, read by the Range stub. */
const naturalAtMaxOf = new Map<Node, number>();

/** Width the figure's text paints at its current font size (fractional, like a Range rect). */
function painted(el: HTMLElement): number {
  return ((naturalAtMaxOf.get(el) ?? 0) * fontPx(el)) / MAX_PX;
}

const rect = (width: number): DOMRect => ({ x: 0, y: 0, top: 0, left: 0, right: width, bottom: 20, width, height: 20, toJSON: () => ({}) }) as DOMRect;

/**
 * Give the figure a box `avail` px wide and a text that needs `naturalAtMax` px at 1.75rem.
 * Both may be fractional: the rects keep the fraction, clientWidth/scrollWidth round it as
 * Chromium does (scrollWidth is never under clientWidth).
 */
function lay(kpi: OkKpi, avail: number, naturalAtMax: number): void {
  const el = valueEl(kpi);
  naturalAtMaxOf.set(el, naturalAtMax);
  el.getBoundingClientRect = () => rect(avail);
  Object.defineProperty(el, 'clientWidth', { configurable: true, get: () => Math.round(avail) });
  Object.defineProperty(el, 'scrollWidth', {
    configurable: true,
    get: () => Math.max(Math.round(avail), Math.round(painted(el))),
  });
}

async function mount(value: string): Promise<OkKpi> {
  const kpi = document.createElement('ok-kpi') as OkKpi;
  kpi.label = 'Caja (sesión actual)';
  kpi.value = value;
  document.body.appendChild(kpi);
  await kpi.updateComplete;
  return kpi;
}

beforeEach(() => {
  observers = [];
  naturalAtMaxOf.clear();
  vi.spyOn(Range.prototype, 'getBoundingClientRect').mockImplementation(function (this: Range) {
    return rect(painted(this.startContainer as HTMLElement));
  });
  vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete (document as { fonts?: unknown }).fonts;
});

describe('ok-kpi: the figure is read on one line and fits its card (#246)', () => {
  it('never wraps the figure, whatever the page inherits', async () => {
    const kpi = await mount('18.405,00 €');
    const style = getComputedStyle(valueEl(kpi));
    expect(style.whiteSpace).toBe('nowrap');
  });

  it('keeps the full size when the figure fits', async () => {
    const kpi = await mount('1.840,50 €');
    lay(kpi, 151, 149);
    resize(kpi);
    expect(valueEl(kpi).style.fontSize).toBe('');
    expect(valueEl(kpi).title).toBe('');
  });

  it('shrinks «18.405,00 €» just enough to fit the 151px of a tablet card', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 151, 175);
    resize(kpi);
    const el = valueEl(kpi);
    const px = fontPx(el);
    expect(px).toBeLessThan(MAX_PX);
    // Fits, and is not smaller than it needs to be (at most 1px under the exact fit).
    expect(el.scrollWidth).toBeLessThanOrEqual(151);
    expect(px).toBeGreaterThan((MAX_PX * 151) / 175 - 1);
    expect(el.title).toBe('');
  });

  // Found in review at 1114px (desktop): the card gives the figure 158.5px, clientWidth reports
  // 159, and the size fitted to 159 painted 158.75px - the ellipsis ate the «€» with no tooltip.
  it('fits a card that is a fraction of a pixel narrower than it reports (1114px desktop)', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 158.5, 162.83);
    resize(kpi);
    const el = valueEl(kpi);
    expect(fontPx(el)).toBeLessThan(MAX_PX);
    expect(painted(el)).toBeLessThanOrEqual(158.5);
    expect(el.title).toBe('');
  });

  it('leaves half a pixel spare when it scales (glyph widths are not exactly linear on every engine)', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 158.5, 162.83);
    resize(kpi);
    expect(painted(valueEl(kpi))).toBeLessThanOrEqual(158.5 - 0.5);
  });

  it('shrinks a figure that overflows its card by less than a pixel', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 158.5, 158.75); // clientWidth and scrollWidth both say 159: "fits"
    resize(kpi);
    const el = valueEl(kpi);
    expect(fontPx(el)).toBeLessThan(MAX_PX);
    expect(painted(el)).toBeLessThanOrEqual(158.5);
  });

  it('fits by the text\'s own width, not the whole pixels scrollWidth rounds it down to', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 151, 175.45); // scrollWidth says 175
    resize(kpi);
    expect(painted(valueEl(kpi))).toBeLessThanOrEqual(151);
  });

  it('shrinks a figure a hair wider than its card even when both round to the same whole pixel', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 158.4, 158.45); // clientWidth and scrollWidth both say 158
    resize(kpi);
    const el = valueEl(kpi);
    expect(fontPx(el)).toBeLessThan(MAX_PX);
    expect(painted(el)).toBeLessThanOrEqual(158.4);
  });

  it('does not go under 1rem: below the floor it cuts with an ellipsis and keeps the figure as tooltip', async () => {
    const kpi = await mount('1.234.567.890,12 US$');
    lay(kpi, 151, 330);
    resize(kpi);
    const el = valueEl(kpi);
    expect(fontPx(el)).toBe(MIN_PX);
    expect(el.title).toBe('1.234.567.890,12 US$');
    const style = getComputedStyle(el);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
  });

  it('measures again when the card is resized (wider card: back to full size)', async () => {
    const kpi = await mount('18.405,00 €');
    lay(kpi, 151, 175);
    resize(kpi);
    expect(fontPx(valueEl(kpi))).toBeLessThan(MAX_PX);

    lay(kpi, 260, 175);
    resize(kpi);
    expect(valueEl(kpi).style.fontSize).toBe('');
  });

  it('measures again when the figure changes', async () => {
    const kpi = await mount('1.840,50 €');
    lay(kpi, 151, 149);
    resize(kpi);
    expect(valueEl(kpi).style.fontSize).toBe('');

    lay(kpi, 151, 175);
    kpi.value = '18.405,00 €';
    await kpi.updateComplete;
    expect(fontPx(valueEl(kpi))).toBeLessThan(MAX_PX);
    expect(valueEl(kpi).scrollWidth).toBeLessThanOrEqual(151);

    lay(kpi, 151, 330);
    kpi.value = '1.234.567.890,12 US$';
    await kpi.updateComplete;
    expect(valueEl(kpi).title).toBe('1.234.567.890,12 US$');

    lay(kpi, 151, 60);
    kpi.value = '12 €';
    await kpi.updateComplete;
    expect(valueEl(kpi).style.fontSize).toBe('');
    expect(valueEl(kpi).title).toBe('');
  });

  it('measures again once the page fonts have loaded (a web font changes the width, not the box)', async () => {
    let fontsLoaded!: () => void;
    const ready = new Promise<void>((resolve) => (fontsLoaded = resolve));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });

    const kpi = await mount('18.405,00 €');
    lay(kpi, 151, 149); // fallback font: fits
    resize(kpi);
    expect(valueEl(kpi).style.fontSize).toBe('');

    lay(kpi, 151, 175); // the web font is wider; the card keeps its size, so no resize fires
    fontsLoaded();
    await ready;
    await Promise.resolve();
    expect(fontPx(valueEl(kpi))).toBeLessThan(MAX_PX);
    expect(valueEl(kpi).scrollWidth).toBeLessThanOrEqual(151);
  });

  it('stops observing when it leaves the page', async () => {
    const kpi = await mount('18.405,00 €');
    expect(observers.some((o) => o.targets.includes(kpi))).toBe(true);
    kpi.remove();
    expect(observers.some((o) => o.targets.includes(kpi))).toBe(false);
  });
});
