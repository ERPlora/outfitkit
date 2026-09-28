// @vitest-environment happy-dom

// outfitkit#218 — «on a phone the cards of a list sit boxed in between the toolbar and the
// footer, which cover rows». `fill` pins the toolbar at the top and the «N records» footer at the
// bottom and scrolls ONLY the rows. That is right on a desk, where the table owns the screen. On a
// phone the module paints other blocks above the table (Kitchen › Stations: the routing form;
// Tables › Sessions: the Open/Closed segment) and the rows get whatever height is left — measured
// in a real browser at 375 px: a 315 px card inside a 32-155 px window, so NO station could ever be
// seen whole, and the lone closed session had its last line («Status») under the footer.
//
// What the market does: Shopify, Square, Odoo and Fresha lists on a phone scroll WITH the page — no
// list-inside-a-box. So under the phone breakpoint (640 px, the one where the table already turns
// into cards and «Load more») `fill` lets the list grow with the page: neither the cards nor the
// list rows are a scroller of their own, the card is as tall as its content, and the shell's
// `ion-content` scrolls. The desk keeps `fill` exactly as it was.
//
// HOW it grows depends on what the page has AFTER the table, because the module page is a column
// of fixed height (`.page > ok-data-table { flex:1 1 auto; min-height:0 }`) and whatever does not
// fit is taken from someone:
// - the table is the last thing on the page (Tables › Sessions, Kitchen › Stations): its box stays
//   as it was and the cards run past it into the page scroll. Growing the box instead squeezed the
//   blocks ABOVE it — measured in Chromium: the Open/Closed ion-segment (ios) went from 32 to 0 px
//   with 30 closed sessions, an ion-card above the table from 349 to 0 px.
// - something in flow comes after it (a heading and a second table, a notice): the table grows and
//   pushes it down, so the cards never paint over it.
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
  rowKey: string;
  fill: boolean;
  views: boolean;
  updateComplete: Promise<unknown>;
};

/** The viewport both halves read: CSS `@media` (window width) and the table's own matchMedia. */
function viewport(width: number): void {
  (window as unknown as { happyDOM: { setViewport(v: { width: number; height: number }): void } }).happyDOM.setViewport({ width, height: 844 });
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => {
    const max = /max-width:\s*([\d.]+)px/.exec(q);
    return {
      media: q, matches: max ? width <= Number(max[1]) : false, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    };
  };
}

/** A module page as the modules ship it: a block above, the table with the flex rule every module
 *  declares, and whatever the page renders after it. */
async function mountInModulePage(after: HTMLElement[] = []): Promise<Table> {
  const page = document.createElement('div');
  page.style.cssText = 'display:flex; flex-direction:column; height:600px; min-height:0;';
  const above = document.createElement('section');
  above.style.cssText = 'height:480px;';
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.style.cssText = 'flex:1 1 auto; min-height:0;';
  table.rowKey = 'id';
  table.fill = true;
  table.views = true;
  table.columns = [{ key: 'name', header: 'Name' }, { key: 'status', header: 'Status' }];
  table.rows = [{ id: '1', name: 'Bar', status: 'Closed' }, { id: '2', name: 'Grill', status: 'Closed' }];
  page.append(above, table, ...after);
  document.body.appendChild(page);
  await settle(table);
  return table;
}

async function settle(t: Table): Promise<void> {
  await t.updateComplete;
  await new Promise((r) => setTimeout(r, 20));
  await t.updateComplete;
}

function block(css: string, tag = 'section'): HTMLElement {
  const el = document.createElement(tag);
  el.style.cssText = css;
  return el;
}

const part = (t: Table, sel: string): HTMLElement => {
  const el = t.shadowRoot?.querySelector(sel) as HTMLElement | null;
  if (!el) throw new Error(`${sel} is not painted`);
  return el;
};

async function showList(t: Table): Promise<void> {
  const btn = t.shadowRoot?.querySelector('ion-button[aria-label="View as list"]') as HTMLElement | null;
  if (!btn) throw new Error('the list/cards switch is not painted');
  btn.click();
  await t.updateComplete;
}

describe('ok-data-table fill: on a phone the list grows with the page (outfitkit#218)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('phone, cards: the cards are not a scroller of their own boxed in between toolbar and footer', async () => {
    viewport(390);
    const t = await mountInModulePage();
    const grid = part(t, '.cards-grid');
    expect(getComputedStyle(grid).overflow, 'the cards scroll inside a box between toolbar and footer').toBe('visible');
    expect(getComputedStyle(grid).flexShrink, 'the cards are squeezed to what is left of the screen').toBe('0');
  });

  it('phone, table last on the page: its box stays put (the blocks above keep their size) and the card runs past it', async () => {
    viewport(390);
    const t = await mountInModulePage();
    const host = getComputedStyle(t);
    expect(host.height, 'the table box grew and squeezed the ion-segment / ion-card above it').toBe('100%');
    expect(host.flexShrink, 'the table box grew and squeezed the ion-segment / ion-card above it').toBe('1');
    expect(getComputedStyle(part(t, '.card')).flexShrink, 'the card is squeezed into the box left between toolbar and footer').toBe('0');
  });

  it('phone, only out-of-flow elements after it (inline ion-modal, hidden notice): still the last thing on the page', async () => {
    viewport(390);
    const t = await mountInModulePage([block('position:absolute; top:0;', 'ion-modal'), block('display:none;')]);
    expect(t.hasAttribute('content-after'), 'an inline ion-modal / hidden block is taken for content after the table').toBe(false);
    expect(getComputedStyle(t).height).toBe('100%');
  });

  it('phone, content in flow after the table: the table grows with its cards and pushes that content down', async () => {
    viewport(390);
    const t = await mountInModulePage([block('height:40px;', 'h3')]);
    expect(t.hasAttribute('content-after')).toBe(true);
    const host = getComputedStyle(t);
    expect(host.height, 'the cards would paint over the content after the table').toBe('auto');
    expect(host.flexShrink, "the module's `flex:1 1 auto; min-height:0` squeezes the table over what follows").toBe('0');
  });

  it('phone: content that appears after the table later (a notice the page renders) is picked up, and so is its removal', async () => {
    viewport(390);
    const t = await mountInModulePage();
    expect(t.hasAttribute('content-after')).toBe(false);
    const notice = block('height:40px;', 'div');
    t.after(notice);
    await settle(t);
    expect(t.hasAttribute('content-after'), 'a block rendered after the table later is not noticed').toBe(true);
    notice.hidden = true;
    notice.style.display = 'none';
    await settle(t);
    expect(t.hasAttribute('content-after'), 'a block after the table that got hidden still counts').toBe(false);
    notice.remove();
    await settle(t);
    expect(t.hasAttribute('content-after')).toBe(false);
  });

  it('phone, list view: the rows grow with the page too (no vertical box of their own)', async () => {
    viewport(390);
    const t = await mountInModulePage();
    await showList(t);
    const scroll = part(t, '.scroll');
    expect(getComputedStyle(scroll).flexShrink, 'the list rows are squeezed to what is left of the screen').toBe('0');
    expect(getComputedStyle(scroll).flexGrow).toBe('0');
  });

  it('a block after the table that a media query shows only on a phone is picked up when the window narrows', async () => {
    viewport(1440);
    const style = document.createElement('style');
    style.textContent = '.phone-only { display: none; } @media (max-width: 640px) { .phone-only { display: block; } }';
    document.head.appendChild(style);
    try {
      const t = await mountInModulePage([block('height:40px;', 'div')].map((el) => (el.classList.add('phone-only'), el)));
      expect(t.hasAttribute('content-after')).toBe(false);
      viewport(390);
      // happy-dom caches computed styles across a viewport change (a browser does not): rewriting
      // the stylesheet, outside the page the table watches, invalidates that cache silently.
      style.textContent = `${style.textContent} `;
      window.dispatchEvent(new Event('resize'));
      await settle(t);
      expect(t.hasAttribute('content-after'), 'the block the phone now shows after the table is not noticed').toBe(true);
    } finally {
      style.remove();
    }
  });

  it('moved to another page with content after it: the new page is watched', async () => {
    viewport(390);
    const t = await mountInModulePage();
    const other = block('display:flex; flex-direction:column; height:600px;', 'div');
    document.body.appendChild(other);
    other.append(t);
    await settle(t);
    expect(t.hasAttribute('content-after')).toBe(false);
    other.append(block('height:40px;', 'h3'));
    await settle(t);
    expect(t.hasAttribute('content-after'), 'content added after the table on its new page is not noticed').toBe(true);
  });

  it('desk: fill keeps the toolbar and footer fixed and scrolls only the rows, content after it or not', async () => {
    viewport(1440);
    for (const after of [[], [block('height:40px;', 'h3')]]) {
      document.body.replaceChildren();
      const t = await mountInModulePage(after);
      const host = getComputedStyle(t);
      expect(host.height).toBe('100%');
      expect(host.flexShrink).toBe('1');
      const scroll = part(t, '.scroll');
      expect(getComputedStyle(scroll).overflow).toBe('auto');
      expect(getComputedStyle(scroll).flexShrink).toBe('1');
      expect(getComputedStyle(part(t, '.card')).flexShrink).toBe('1');
    }
  });
});
