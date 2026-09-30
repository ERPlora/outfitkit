// @vitest-environment happy-dom

// outfitkit#267 (from cash_register#127) - "with the side menu open and the window at ~1000px, a
// seven-column list scrolls sideways and the pinned "..." covers half a column".
//
// Measured in Chromium over the built bundle (0.1.130), `mode: ios`, the seven cash-session
// columns of cash_register + four row actions, side menu of 272px open:
//
//   window | table | overflow with the actions folded | cells under the pinned "..."
//   992    | 720   | 28px                              | "-1,00 €"
//   1000   | 728   | 20px                              | "-1,00 €"
//   1024   | 752   | 0                                 | -
//   820    | 820   | 0  (the menu hides below 992px)   | -
//
// Folding the actions (#122) is the cheap half and is not enough here: seven columns at their
// floor do not fit even with ONE "..." button. What the market does when the grid does not fit
// its container and a card/list layout exists: Shopify Polaris IndexTable (`condensed`), Odoo's
// kanban/list on narrow screens, Salesforce's list-to-tiles and MUI's responsive DataGrid recipes
// all hand over to the card/list layout instead of a pinned column painted over the data. The
// table already does exactly that below 640px (#274); this makes the hand-over depend on whether
// the table FITS its hole rather than on the window alone - and only when the consumer declared
// cards (`views`) and the person did not choose the list by hand.
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
import { decideCardsForFit } from './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  views: unknown;
  rowKey: string;
  updateComplete: Promise<unknown>;
};

/** The grid's minimum as Chromium measured it on the bench: 748px folded, 892px with the four
 *  buttons out (4 x 44 + 3 x 4 = 188 vs one 44px "..."). */
const FOLDED_MIN = 748;
const EXPANDED_MIN = 892;

describe('decideCardsForFit: the table hands over to cards only when it cannot fit (#267)', () => {
  const idle = { fitCards: false, fitWidth: 0 };

  it('folded and still overflowing -> cards, remembering the width the table needs', () => {
    // 992px window, side menu open: a 720px hole for a 748px grid.
    expect(
      decideCardsForFit({ allowed: true, hostWidth: 720, folded: { containerWidth: 720, contentWidth: FOLDED_MIN }, ...idle }),
    ).toEqual({ fitCards: true, fitWidth: 748 });
  });

  it('the remembered width counts what the host spends around the scroller (borders, padding)', () => {
    // A host 2px wider than its scroller needs 2px more than the grid to fit again.
    expect(
      decideCardsForFit({ allowed: true, hostWidth: 722, folded: { containerWidth: 720, contentWidth: FOLDED_MIN }, ...idle }),
    ).toEqual({ fitCards: true, fitWidth: 750 });
  });

  it('a table that fits folded stays a table (1024px with the menu, 820px tablet, 1440px desktop)', () => {
    for (const w of [752, 820, 1168]) {
      expect(
        decideCardsForFit({ allowed: true, hostWidth: w, folded: { containerWidth: w, contentWidth: w }, ...idle }),
        `at ${w}px the table fits and must not change`,
      ).toEqual(idle);
    }
  });

  it('never hands over without cards declared, or after the person chose the list', () => {
    expect(
      decideCardsForFit({ allowed: false, hostWidth: 720, folded: { containerWidth: 720, contentWidth: FOLDED_MIN }, ...idle }),
    ).toEqual(idle);
    // And a hand-over already taken is given back the moment it stops being allowed.
    expect(
      decideCardsForFit({ allowed: false, hostWidth: 720, folded: null, fitCards: true, fitWidth: 748 }),
    ).toEqual(idle);
  });

  it('judges only a FOLDED, settled measurement: with the buttons out folding may still be enough', () => {
    // `folded: null` is what the component passes while the buttons are out or the fold decision
    // was just re-taken at a new width: that render is not the table's minimum yet.
    expect(decideCardsForFit({ allowed: true, hostWidth: 720, folded: null, ...idle })).toEqual(idle);
  });

  it('a hole without width yet (Ionic not hydrated) decides nothing', () => {
    expect(
      decideCardsForFit({ allowed: true, hostWidth: 0, folded: { containerWidth: 0, contentWidth: FOLDED_MIN }, ...idle }),
    ).toEqual(idle);
    expect(decideCardsForFit({ allowed: true, hostWidth: 0, folded: null, fitCards: true, fitWidth: 748 })).toEqual({
      fitCards: true,
      fitWidth: 748,
    });
  });

  it('in cards, it goes back to the table exactly when the hole reaches the remembered width', () => {
    const inCards = { allowed: true, folded: null, fitCards: true, fitWidth: 748 };
    expect(decideCardsForFit({ ...inCards, hostWidth: 720 })).toEqual({ fitCards: true, fitWidth: 748 });
    expect(decideCardsForFit({ ...inCards, hostWidth: 747 })).toEqual({ fitCards: true, fitWidth: 748 });
    expect(decideCardsForFit({ ...inCards, hostWidth: 748 })).toEqual(idle);
    expect(decideCardsForFit({ ...inCards, hostWidth: 1168 })).toEqual(idle);
  });

  it('settles: table -> cards -> (same hole) stays cards; wider -> table -> fits, stays table', () => {
    // Back in the table at the remembered width the grid fits (content == container), so the
    // next folded measurement keeps it a table: no flip-flop at the boundary.
    let s = decideCardsForFit({ allowed: true, hostWidth: 720, folded: { containerWidth: 720, contentWidth: FOLDED_MIN }, ...idle });
    for (let i = 0; i < 3; i++) s = decideCardsForFit({ allowed: true, hostWidth: 720, folded: null, ...s });
    expect(s.fitCards).toBe(true);
    s = decideCardsForFit({ allowed: true, hostWidth: 748, folded: null, ...s });
    expect(s.fitCards).toBe(false);
    s = decideCardsForFit({ allowed: true, hostWidth: 748, folded: { containerWidth: 748, contentWidth: FOLDED_MIN }, ...s });
    expect(s.fitCards).toBe(false);
  });
});

// ── The component, with Chromium's measurements played back (happy-dom lays nothing out) ─────

const COLUMNS = [
  { key: 'session_number', header: 'Sesión', width: 'minmax(7rem,1fr)' },
  { key: 'opened_at', header: 'Apertura', width: 'minmax(6.25rem,1fr)' },
  { key: 'status', header: 'Estado', width: 'minmax(4.25rem,1fr)' },
  { key: 'opening_balance', header: 'Inicial', align: 'right' },
  { key: 'expected_balance', header: 'Esperado', align: 'right' },
  { key: 'closing_balance', header: 'Contado', align: 'right', width: 'minmax(5rem,1fr)' },
  { key: 'difference', header: 'Diferencia', align: 'right', width: 'minmax(5.75rem,1fr)' },
];
const ACTIONS = [
  { id: 'detail', label: 'Detalle', icon: 'document-text-outline' },
  { id: 'movement', label: 'Movimiento', icon: 'swap-vertical-outline' },
  { id: 'count', label: 'Arqueo', icon: 'calculator-outline' },
  { id: 'close', label: 'Cerrar', icon: 'lock-closed-outline' },
];
const ROWS = [
  { id: '1', session_number: 'S-260930-0001', opened_at: '30/9/26 23:45', status: 'Cerrada', opening_balance: '100,00 €', expected_balance: '250,50 €', closing_balance: '249,50 €', difference: '-1,00 €' },
  { id: '2', session_number: 'S-260930-0002', opened_at: '30/9/26 23:50', status: 'Abierta', opening_balance: '100,00 €', expected_balance: '100,00 €', closing_balance: '', difference: '' },
];

/** The hole the table gets, in px (what the side menu leaves at the window under test). */
let hole = 720;
/** The grid's folded minimum for the columns on screen (five columns need less than seven). */
let foldedMin = FOLDED_MIN;

function isCards(table: Table): boolean {
  return !!table.shadowRoot?.querySelector('.cards-grid');
}

/** Width of one icon button in `mode: ios`, as painted in the row with its margins. */
const BUTTON = 32;
/** What `getBoundingClientRect` reports for that button, and the inline margin on each side:
 *  Chromium paints the ios icon button 28px wide with 2px of `margin-inline` (the track is 32). */
let buttonRect = BUTTON;
let buttonMargin = 0;

type Measured = Table & { rowActionsCollapsed: boolean; actionsTrackPx: number };

/** Plays back the layout: the host and its scroller are `hole` wide; the grid needs its folded or
 *  expanded minimum, or the whole hole when that is bigger (what `scrollWidth` reports). A track
 *  pinned wider than the buttons it holds (`actionsTrackPx`) widens the grid by the difference. */
function playBackLayout(): void {
  const hostOf = (el: Element): Measured | null => {
    const root = el.getRootNode() as ShadowRoot;
    return (root?.host as Measured | undefined) ?? null;
  };
  const realRect = Element.prototype.getBoundingClientRect;
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    if (this.tagName === 'ION-BUTTON' && this.closest('.actions-col')) return { width: buttonRect, height: 32, top: 0, left: 0, right: buttonRect, bottom: 32, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
    return realRect.call(this);
  });
  const realStyle = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element, pseudo?: string | null) => {
    const style = realStyle(el, pseudo);
    if (el.tagName !== 'ION-BUTTON' || !el.closest('.actions-col')) return style;
    return new Proxy(style, {
      get: (target, prop) =>
        prop === 'marginLeft' || prop === 'marginRight' ? `${buttonMargin}px` : Reflect.get(target, prop),
    });
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.tagName === 'OK-DATA-TABLE') return hole;
    if (this.classList?.contains('scroll')) return hole;
    return 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function (this: HTMLElement) {
    if (this.classList?.contains('scroll')) {
      const host = hostOf(this);
      const collapsed = !!host?.rowActionsCollapsed;
      const buttons = collapsed ? BUTTON : EXPANDED_MIN - FOLDED_MIN + BUTTON;
      const stale = host?.actionsTrackPx ? host.actionsTrackPx - buttons : 0;
      return Math.max((collapsed ? foldedMin : foldedMin + (EXPANDED_MIN - FOLDED_MIN)) + stale, hole);
    }
    return 0;
  });
}

/** Re-measures the way a window resize / ResizeObserver does, until nothing moves any more. */
async function settle(table: Table): Promise<void> {
  for (let i = 0; i < 6; i++) {
    window.dispatchEvent(new Event('resize'));
    await table.updateComplete;
  }
}

async function mount(views: unknown = true): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rowKey = 'id';
  table.views = views;
  table.columns = COLUMNS;
  table.actions = ACTIONS;
  table.rows = ROWS;
  document.body.appendChild(table);
  await table.updateComplete;
  await settle(table);
  return table;
}

describe('ok-data-table: a list that does not fit even folded shows cards (#267)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
    hole = 720;
    foldedMin = FOLDED_MIN;
    buttonRect = BUTTON;
    buttonMargin = 0;
    playBackLayout();
  });
  afterEach(() => vi.restoreAllMocks());

  it('992px with the menu open (720px hole): cards, so nothing sits under the "..."', async () => {
    const table = await mount();
    expect(isCards(table), 'the seven columns overflow 28px folded: the list must hand over to cards').toBe(true);
    // Every figure of the issue is readable: the difference is on the card, not under a button.
    expect(table.shadowRoot?.querySelector('.cards-grid')?.textContent).toContain('-1,00 €');
  });

  it('1024px with the menu open (752px hole) and a 820px tablet stay a table', async () => {
    for (const w of [752, 820, 1168]) {
      document.body.replaceChildren();
      hole = w;
      const table = await mount();
      expect(isCards(table), `at a ${w}px hole the table fits folded and must not change`).toBe(false);
    }
  });

  it('closing the menu (the hole grows) brings the table back', async () => {
    const table = await mount();
    expect(isCards(table)).toBe(true);
    hole = 992;
    await settle(table);
    expect(isCards(table), 'with room for the grid the list must come back').toBe(false);
  });

  it('without cards declared it stays a table (nothing to hand over to)', async () => {
    const table = await mount(false);
    expect(isCards(table)).toBe(false);
  });

  it('the person choosing the list by hand wins over the hand-over', async () => {
    const table = await mount();
    expect(isCards(table)).toBe(true);
    // The list/cards toggle of the toolbar calls `setViewMode`.
    (table as unknown as { setViewMode: (m: string) => void }).setViewMode('table');
    await settle(table);
    expect(isCards(table), 'an explicit choice of the list must not be overridden').toBe(false);
  });

  it('a new columns array with the same columns (a parent re-render) does not bounce back to the table', async () => {
    const table = await mount();
    expect(isCards(table)).toBe(true);
    // Consumers build `columns` in a getter: every parent render assigns a new array.
    table.columns = COLUMNS.map((c) => ({ ...c }));
    await table.updateComplete;
    expect(isCards(table), 'the same columns must not re-open the table for a frame').toBe(true);
  });

  it('hiding columns so the list may fit takes it back to the table to measure again', async () => {
    const table = await mount();
    expect(isCards(table)).toBe(true);
    // Five columns at their floor + one "..." need 560px: they fit the 720px hole.
    foldedMin = 560;
    table.columns = COLUMNS.slice(0, 5);
    await settle(table);
    expect(isCards(table), 'different columns need a new measurement, and these fit').toBe(false);
  });

  it('a list without a pinned column scrolls as before: nothing is painted over its data', async () => {
    // A wide list with no row actions (and no column pinned to the end) only scrolls sideways,
    // like every data grid; there is no button on top of a figure to take away.
    const table = document.createElement('ok-data-table') as unknown as Table;
    table.rowKey = 'id';
    table.views = true;
    table.columns = COLUMNS;
    table.actions = [];
    table.rows = ROWS;
    document.body.appendChild(table);
    await table.updateComplete;
    await settle(table);
    expect(isCards(table), 'without a pinned column the overflow covers nothing').toBe(false);
  });

  it('a folded "..." inside a track still pinned to the four buttons is not the list\'s minimum', async () => {
    // Measured in Chromium with the CPU slowed down (showcase reservations, 1000px, menu open):
    // the track was pinned at 140px with the four buttons out, the actions folded, and for a few
    // frames the ONE "..." sat in that 140px track - the grid measured 748px in a 728px hole that
    // it fits once the track is measured again. Judging that frame left the list in cards for
    // good (the hole never grew to "give it back").
    hole = 752; // 1024px with the menu: fits folded with an honest 32px track
    const table = await mount();
    expect(isCards(table)).toBe(false);
    const t = table as unknown as Measured;
    t.actionsTrackPx = 140; // the stale pin, 108px wider than the one button it holds
    await table.updateComplete;
    await settle(table);
    expect(isCards(table), 'a stale track must not hand the list over to cards').toBe(false);
  });

  it('an honest track counts the buttons\' margins: the ios "..." (28px + 2px each side) fills 32px', async () => {
    // Measured in Chromium on the showcase invoices at 1000px with the menu open: one "..." painted
    // 28px wide in a 32px track (ios `margin-inline: 2px`). Leaving the margins out read that track
    // as stale and the list stayed a table with two figures under the button.
    buttonRect = 28;
    buttonMargin = 2;
    const table = document.createElement('ok-data-table') as unknown as Table;
    table.rowKey = 'id';
    table.views = true;
    table.columns = COLUMNS;
    table.actions = ACTIONS;
    table.rows = ROWS;
    document.body.appendChild(table);
    await table.updateComplete;
    (table as unknown as Measured).actionsTrackPx = BUTTON; // what the track measures on screen
    await settle(table);
    expect(isCards(table), 'a 32px track holding a 28px button + 4px of margin is honest').toBe(true);
  });

  it('default-view="table" is where the list starts, not a veto on the hand-over', async () => {
    // Like the phone breakpoint (#274), a list that does not fit wins over the starting view:
    // re-applying "table" on every render would put the "..." back on top of the figures.
    const table = document.createElement('ok-data-table') as unknown as Table & { defaultView: string };
    table.rowKey = 'id';
    table.views = true;
    table.defaultView = 'table';
    table.columns = COLUMNS;
    table.actions = ACTIONS;
    table.rows = ROWS;
    document.body.appendChild(table);
    await table.updateComplete;
    await settle(table);
    table.rows = ROWS.map((r) => ({ ...r })); // a later render (new data) must not bounce it back
    await settle(table);
    expect(isCards(table), 'default-view="table" must not keep a list that does not fit').toBe(true);
  });

  it('closing the side menu brings the table back without any window resize', async () => {
    // The menu resizes the table's hole, not the window: only the host's own ResizeObserver sees it.
    const observed: Array<() => void> = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly cb: () => void) {}
        observe(el: Element): void {
          if (el.tagName === 'OK-DATA-TABLE') observed.push(() => this.cb());
        }
        unobserve(): void {}
        disconnect(): void {}
      },
    );
    try {
      const table = await mount();
      expect(isCards(table)).toBe(true);
      hole = 992;
      for (const fire of observed) fire();
      await table.updateComplete;
      expect(isCards(table), 'the host growing must give the list back').toBe(false);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('the list chosen by hand stays the list when the hole shrinks later', async () => {
    hole = 992;
    const table = await mount();
    expect(isCards(table)).toBe(false);
    (table as unknown as { setViewMode: (m: string) => void }).setViewMode('table');
    hole = 720; // the side menu opens afterwards
    await settle(table);
    expect(isCards(table), 'a choice made before the overflow still wins').toBe(false);
  });
});
