// @vitest-environment happy-dom

// outfitkit#197 — «on a phone, the end of the New/Edit panel of the tables sits under the tab bar
// and its Save button cannot be tapped».
//
// Below 834px the panel is a `position: fixed` sheet. #75 made it START where the closest
// `ion-content` starts (under the app header), but it still ENDED at the bottom edge of the screen.
// The module tab bar is an `ion-footer` of the shell page, OUTSIDE the `ion-content`, so it covered
// the last 66px (ios) / 72px (md) of the sheet: in Inventory → Products the tap on «Save» opened
// the tab underneath (inventory#105, patched locally by inventory#110). The sheet must end where
// the content area ends, for EVERY way of opening the panel — the toolbar «Add», `open('create')`
// called straight by a module, `open('edit')` — and follow the content when it changes size while
// the sheet is open (rotation, a tab bar mounted late).
//
// happy-dom does no layout: rects are stubbed and the contract is the custom property the host
// publishes plus the CSS rule that reads it. The pixels are checked in the real bench.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconCalendarOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconChevronForward: '<svg></svg>',
  iconChevronUpOutline: '<svg></svg>',
  iconClose: '<svg></svg>',
  iconEllipsisVertical: '<svg></svg>',
  iconFileTrayOutline: '<svg></svg>',
  iconSwapVerticalOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  addable: boolean;
  testid: string;
  open: (p?: 'filters' | 'create' | 'edit', opts?: { title?: string }) => void;
  close: () => void;
  updateComplete: Promise<unknown>;
};

/** Every ResizeObserver the component creates, with what it observes, so a test can fire it. */
type FakeObserver = { cb: ResizeObserverCallback; targets: Set<Element>; self: ResizeObserver };
let observers: FakeObserver[] = [];
/** Initial notifications delivered for an `ion-content` so far (capped so a re-observe loop fails instead of hanging). */
let initialNotifications = 0;

class FakeResizeObserver {
  private readonly rec: FakeObserver;
  constructor(cb: ResizeObserverCallback) {
    this.rec = { cb, targets: new Set(), self: this as unknown as ResizeObserver };
    observers.push(this.rec);
  }
  observe(el: Element): void {
    this.rec.targets.add(el);
    // Like the browser: observing an element always delivers one initial notification.
    if (el.tagName !== 'ION-CONTENT') return; // the grid observers are not under test here
    if (initialNotifications >= 50) return;
    initialNotifications++;
    queueMicrotask(() => {
      if (this.rec.targets.has(el)) this.rec.cb([{ target: el } as ResizeObserverEntry], this.rec.self);
    });
  }
  unobserve(el: Element): void { this.rec.targets.delete(el); }
  disconnect(): void { this.rec.targets.clear(); }
}

/** Fires every observer currently watching `el`, as the browser would when it changes size. */
function resized(el: Element): void {
  for (const o of observers) if (o.targets.has(el)) o.cb([{ target: el } as ResizeObserverEntry], o.self);
}

function isObserved(el: Element): boolean {
  return observers.some((o) => o.targets.has(el));
}

function setViewportHeight(h: number): void {
  Object.defineProperty(window, 'innerHeight', { value: h, configurable: true });
}

/** A shell-like page: the table lives inside an `ion-content` whose box is `top`..`bottom`. */
function contentBox(top: number, bottom: number): { content: HTMLElement; setBox: (t: number, b: number) => void } {
  const content = document.createElement('ion-content');
  let box = { top, bottom };
  content.getBoundingClientRect = () =>
    ({ top: box.top, bottom: box.bottom, left: 0, right: 390, width: 390, height: box.bottom - box.top, x: 0, y: box.top, toJSON: () => ({}) }) as DOMRect;
  document.body.appendChild(content);
  return { content, setBox: (t, b) => { box = { top: t, bottom: b }; } };
}

async function mountIn(parent: HTMLElement): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Corte' }];
  table.columns = [{ key: 'name', header: 'Nombre' }];
  table.addable = true;
  table.testid = 'products';
  parent.appendChild(table);
  await table.updateComplete;
  return table;
}

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

function mediaBlock(css: string, cond: RegExp): string {
  const re = new RegExp(`@media[^{]*${cond.source}[^{]*\\{((?:[^{}]*\\{[^}]*\\})*)`);
  return css.match(re)?.[1] ?? '';
}

const bottomVar = (t: Table) => t.style.getPropertyValue('--ok-sheet-bottom');

describe('ok-data-table: on a phone the sheet ends ABOVE the tab bar (outfitkit#197)', () => {
  let realRO: typeof ResizeObserver | undefined;
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
    observers = [];
    initialNotifications = 0;
    realRO = globalThis.ResizeObserver;
    globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
    setViewportHeight(844);
  });
  afterEach(() => {
    if (realRO) globalThis.ResizeObserver = realRO;
    else delete (globalThis as { ResizeObserver?: unknown }).ResizeObserver;
  });

  it('the mobile sheet rule reads the measured bottom offset instead of sticking to the screen edge', () => {
    const block = mediaBlock(styles(), /max-width: 833(?:\.98)?px/);
    expect(block, 'no mobile rule for the panel').not.toBe('');
    expect(block, 'the sheet does not use the measured bottom').toMatch(/\.drawer[^{]*\{[^}]*bottom: var\(--ok-sheet-bottom, 0px\);/);
  });

  it('open(\'create\') called straight by a module: the sheet ends where the ion-content ends (ios tab bar, 66px)', async () => {
    const { content } = contentBox(56, 778);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    expect(bottomVar(table), 'the sheet still runs under the tab bar').toBe('66px');

    table.close();
    await table.updateComplete;
    expect(bottomVar(table), 'closed and the offset is still set').toBe('');
  });

  it('the toolbar «Add» button opens the sheet with the same bottom offset', async () => {
    const { content } = contentBox(56, 778);
    const table = await mountIn(content);
    const add = table.shadowRoot?.querySelector('[data-testid="products-add"]') as HTMLElement | null;
    expect(add, 'no «Add» button').toBeTruthy();
    add?.click();
    await table.updateComplete;
    expect(bottomVar(table)).toBe('66px');
  });

  it('open(\'edit\') measures too (md tab bar, 72px)', async () => {
    const { content } = contentBox(56, 772);
    const table = await mountIn(content);
    table.open('edit', { title: 'Editar Corte' });
    await table.updateComplete;
    expect(bottomVar(table)).toBe('72px');
  });

  it('rotating the phone while the sheet is open re-measures (window resize)', async () => {
    const { content, setBox } = contentBox(56, 778);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    setViewportHeight(390);
    setBox(56, 318);
    window.dispatchEvent(new Event('resize'));
    await table.updateComplete;
    expect(bottomVar(table), 'the offset froze at the portrait value').toBe('72px');
  });

  it('a tab bar that mounts AFTER the sheet opened shrinks the ion-content and the sheet follows it', async () => {
    // open('create') on arrival (deep link / module that opens the form on load): at that moment the
    // shell's tab bar may not be there yet, so the content still reaches the screen edge.
    const { content, setBox } = contentBox(56, 844);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    expect(bottomVar(table)).toBe('0px');
    expect(isObserved(content), 'nobody watches the content while the sheet is open').toBe(true);

    setBox(56, 778);
    resized(content);
    await table.updateComplete;
    expect(bottomVar(table), 'the late tab bar covers the end of the sheet').toBe('66px');
    expect(table.style.getPropertyValue('--ok-sheet-top'), 'the top must follow too').toBe('56px');

    table.close();
    await table.updateComplete;
    expect(isObserved(content), 'the content is still watched after closing').toBe(false);
  });

  it('watching the content does not re-measure in a loop (observe() always notifies once)', async () => {
    const { content } = contentBox(56, 778);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    for (let i = 0; i < 10; i++) await Promise.resolve();
    expect(initialNotifications, 'every notification re-observes the content and notifies again').toBeLessThanOrEqual(1);
    expect(bottomVar(table)).toBe('66px');
  });

  it('closing and opening again keeps following the content (late tab bar on the second opening)', async () => {
    const { content, setBox } = contentBox(56, 844);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    table.close();
    await table.updateComplete;
    table.open('create');
    await table.updateComplete;
    expect(isObserved(content), 'the second opening no longer watches the content').toBe(true);
    setBox(56, 778);
    resized(content);
    await table.updateComplete;
    expect(bottomVar(table)).toBe('66px');
  });

  it('a content taller than the screen (scrolled page, soft keyboard) never pushes the sheet below the edge', async () => {
    const { content } = contentBox(56, 900);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    expect(bottomVar(table)).toBe('0px');
  });

  it('a resize after the sheet closed does not bring the offset back', async () => {
    const { content } = contentBox(56, 778);
    const table = await mountIn(content);
    table.open('create');
    await table.updateComplete;
    table.close();
    await table.updateComplete;
    window.dispatchEvent(new Event('resize'));
    await table.updateComplete;
    expect(bottomVar(table)).toBe('');
  });

  it('without an ion-content around (plain page) the sheet keeps the screen edge', async () => {
    const table = await mountIn(document.body);
    table.open('create');
    await table.updateComplete;
    expect(bottomVar(table)).toBe('0px');
  });
});
