// @vitest-environment happy-dom

// outfitkit#122 - "on a small tablet (640-795px) the six-column table still covers Estado with
// the action icons".
//
// Measured in Chromium over the built bundle, `mode: ios`, six bookings columns + four row
// actions. `796` is the table's minimum after #120: six columns at their 88px floor + 188px of
// buttons + 48px of gaps + 32px of padding.
//
//   width | scrollWidth | overflows? | cells covered by the pinned column
//   640   | 796         | yes        | "4", "Pendiente"
//   700   | 796         | yes        | "Pendiente"
//   768   | 796         | yes        | "Pendiente"
//   795   | 796         | yes        | -
//   834   | 834         | no         | -
//
// What the market does when the row actions do not fit: it collapses them into a single overflow
// menu instead of letting them eat a column. Odoo, Shopify (Polaris IndexTable), Business Central,
// Salesforce Lightning Datatable and MUI DataGrid (`showInMenu`) all put the row actions behind a
// "..." / ellipsis button on narrow viewports; AG Grid and Polaris go further and stop pinning
// when the pinned area no longer fits. Collapsing is the cheaper half and the one that keeps the
// counter tablet (834px) untouched: four buttons where they fit, one where they do not.
//
// 4 buttons = 188px, one = 44px, so the table's minimum drops from 796px to 652px.
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
import { decideRowActionsFit } from './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  actions: Array<Record<string, unknown>>;
  rowKey: string;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [
  { key: 'date', header: 'Fecha' },
  { key: 'time', header: 'Hora' },
  { key: 'guest_name', header: 'Cliente' },
  { key: 'guest_phone', header: 'Teléfono' },
  { key: 'party_size', header: 'Pax', align: 'right' },
  { key: 'status', header: 'Estado' },
];
const ACTIONS = [
  { id: 'confirm', label: 'Confirmar', icon: 'checkmark-outline' },
  { id: 'seat', label: 'Sentar', icon: 'restaurant-outline' },
  { id: 'done', label: 'Finalizar', icon: 'checkmark-done-outline' },
  { id: 'cancel', label: 'Cancelar', icon: 'close-outline' },
];
const ROWS = [
  { id: '1', date: '5/9/2026', time: '21:00', guest_name: 'Familia Pérez', guest_phone: '600 111 222', party_size: 4, status: 'Pendiente' },
  { id: '2', date: '5/9/2026', time: '21:30', guest_name: 'Marta Ruiz', guest_phone: '600 333 444', party_size: 6, status: 'Sentada' },
];

/** Everything the grid needs BESIDES the actions track: six columns at their floor + gaps +
 *  padding. 6x88 + 6x8 + 32 = 608, and 608 + 188 = the 796px the bench measured. */
const COLUMNS_MIN = 608;
const EXPANDED_ACTIONS = 188; // 4 x 44px + 3 x 4px gap, measured <=834px
const COLLAPSED_ACTIONS = 44; // one "..." button at the touch floor

/** What Chromium reports as `scrollWidth`: the grid's minimum, or the container when it fits. */
const contentWidth = (containerWidth: number, actionsPx: number): number =>
  Math.max(COLUMNS_MIN + actionsPx, containerWidth);

/**
 * Run the decision the way the component does: a width change re-judges with the buttons OUT
 * (one render), and the next measurement decides whether they fit. Returns the settled state and
 * how many measurements it took to stop moving.
 */
function settle(containerWidth: number, from = { collapsed: false, decidedAtWidth: -1 }): {
  collapsed: boolean;
  decidedAtWidth: number;
  steps: number;
} {
  let state = from;
  let steps = 0;
  for (let i = 0; i < 10; i++) {
    const actionsPx = state.collapsed ? COLLAPSED_ACTIONS : EXPANDED_ACTIONS;
    const next = decideRowActionsFit({
      containerWidth,
      contentWidth: contentWidth(containerWidth, actionsPx),
      collapsed: state.collapsed,
      decidedAtWidth: state.decidedAtWidth,
    });
    steps++;
    if (next.collapsed === state.collapsed && next.decidedAtWidth === state.decidedAtWidth) break;
    state = next;
  }
  return { ...state, steps };
}

async function mount(collapsed = false): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = COLUMNS;
  table.rowKey = 'id';
  table.actions = ACTIONS;
  document.body.appendChild(table);
  await table.updateComplete;
  // happy-dom has no layout, so the component can never measure itself into the collapsed state:
  // the state under test is set directly, and `decideRowActionsFit` is what proves WHEN it is set.
  (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = collapsed;
  await table.updateComplete;
  return table;
}

const rowActionsCell = (table: Table): HTMLElement | null =>
  table.shadowRoot?.querySelector('.grow-data .gcell.actions-col') as HTMLElement | null;

describe('ok-data-table: on a narrow tablet the row actions do not eat a column (#122)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('collapses the row actions exactly at the widths where the six columns do not fit', () => {
    // The band of the issue. With four buttons the grid needs 796px, so every one of these
    // overflows and the pinned column lands on top of the data.
    for (const width of [640, 700, 720, 768, 795]) {
      expect(settle(width).collapsed, `at ${width}px the four buttons do not fit and must collapse`).toBe(true);
    }
  });

  it('leaves the counter tablet and the desktop alone: four buttons where they fit', () => {
    // 834px is the tablet #120 fixed, and it fits with the four buttons out. Collapsing there
    // would take one-tap "Confirmar"/"Sentar" away from the counter for nothing.
    for (const width of [834, 1024, 1440]) {
      expect(settle(width).collapsed, `at ${width}px the four buttons fit and must stay out`).toBe(false);
    }
  });

  it('once collapsed the table FITS: nothing is left under the pinned column from 652px up', () => {
    for (const width of [652, 700, 720, 768, 795]) {
      const state = settle(width);
      const needed = contentWidth(width, state.collapsed ? COLLAPSED_ACTIONS : EXPANDED_ACTIONS);
      expect(needed, `at ${width}px the grid still needs ${needed}px and keeps covering a cell`).toBeLessThanOrEqual(
        width,
      );
    }
  });

  it('below 652px the table still scrolls, but the overflow drops from 156px to 12px', () => {
    // Honest limit: at 640px six columns at their 88px floor plus ONE button already need 652px.
    // What is left is horizontal scroll with the pinned-column shadow - the market fallback - over
    // 12px instead of over a whole column. Under 640px `MOBILE_BREAKPOINT` hands over to cards,
    // when the consumer declared them.
    const state = settle(640);
    expect(state.collapsed).toBe(true);
    expect(contentWidth(640, EXPANDED_ACTIONS) - 640, 'the overflow the issue reported').toBe(156);
    expect(contentWidth(640, COLLAPSED_ACTIONS) - 640, 'what is left after collapsing').toBe(12);
  });

  it('the decision settles and does not flip back and forth', () => {
    // Collapsing makes the grid narrower, which fires the observer again. Re-judging on that
    // second pass would expand it, widen it, and loop forever. The width the decision was taken
    // at is what stops it: while the hole does not change size, the state only moves once.
    for (const width of [640, 700, 795, 834]) {
      expect(settle(width).steps, `at ${width}px the decision keeps flipping`).toBeLessThanOrEqual(3);
    }
    // And re-measuring a settled state changes nothing.
    const settled = settle(700);
    const again = decideRowActionsFit({
      containerWidth: 700,
      contentWidth: contentWidth(700, COLLAPSED_ACTIONS),
      collapsed: settled.collapsed,
      decidedAtWidth: settled.decidedAtWidth,
    });
    expect(again).toEqual({ collapsed: true, decidedAtWidth: 700 });
  });

  it('a wider hole re-judges with the buttons out again', () => {
    // Rotating the tablet back to landscape has to bring the four buttons back.
    const narrow = settle(700);
    expect(narrow.collapsed).toBe(true);
    expect(settle(1024, { collapsed: narrow.collapsed, decidedAtWidth: narrow.decidedAtWidth }).collapsed).toBe(false);
  });

  it('a hole that gets its width while the buttons are already OUT is decided in ONE measurement', () => {
    // Measured in Chromium over the built bundle: a table fully rendered in a 0px-wide hole (what
    // `ion-content` is before Ionic hydrates) that then receives 700px kept its four buttons out,
    // needed 748px in a 700px hole and left the pinned column on top of "Pendiente" until a window
    // `resize` happened to come by. Why: at 0px the overflow flag was ALREADY true (748 > 0) and the
    // buttons' track ALREADY measured, so when the width landed the ResizeObserver fired once,
    // the decision reset itself "with the buttons out" and nothing else changed - no re-render, no
    // second measurement, nobody to take the decision the reset was waiting for.
    // With the buttons already out, `contentWidth` IS the measurement taken with the buttons out:
    // the decision does not need a second pass, so it must not wait for one.
    expect(decideRowActionsFit({ containerWidth: 700, contentWidth: 748, collapsed: false, decidedAtWidth: -1 })).toEqual({
      collapsed: true,
      decidedAtWidth: 700,
    });
    // Same when the hole changes size later (a side panel opening) with the buttons out.
    expect(decideRowActionsFit({ containerWidth: 700, contentWidth: 796, collapsed: false, decidedAtWidth: 900 })).toEqual({
      collapsed: true,
      decidedAtWidth: 700,
    });
    // And a hole where they fit keeps them out, in one pass too.
    expect(decideRowActionsFit({ containerWidth: 834, contentWidth: 834, collapsed: false, decidedAtWidth: -1 })).toEqual({
      collapsed: false,
      decidedAtWidth: 834,
    });
    // Collapsed, the hole changing size still goes through the two-step path: the buttons come
    // out first (that render IS the second measurement), and the next pass judges them.
    expect(decideRowActionsFit({ containerWidth: 700, contentWidth: 700, collapsed: true, decidedAtWidth: 640 })).toEqual({
      collapsed: false,
      decidedAtWidth: 700,
    });
  });

  it('an unmeasured table (no layout yet) keeps the buttons out', () => {
    // Inside `ion-content` the hole has no width until Ionic hydrates. Judging on 0x0 would
    // collapse every table on the way in - the same timing bug as #67 and #274.
    expect(decideRowActionsFit({ containerWidth: 0, contentWidth: 0, collapsed: false, decidedAtWidth: -1 })).toEqual({
      collapsed: false,
      decidedAtWidth: -1,
    });
  });

  it('collapsed, each row shows ONE button that opens the actions, in Spanish', async () => {
    const table = await mount(true);
    const cell = rowActionsCell(table);
    const buttons = [...(cell?.querySelectorAll('ion-button') ?? [])];

    expect(buttons.length, 'the four buttons must become one').toBe(1);
    expect(buttons[0].getAttribute('aria-label'), 'the button needs an accessible name').toBe('Más acciones');
    const html = table.shadowRoot?.innerHTML ?? '';
    expect(html, 'the source string must not leak into a Spanish table').not.toContain('More actions');
  });

  it('collapsed, the "Acciones" header stops being painted over its neighbour', async () => {
    const table = await mount(true);
    const head = table.shadowRoot?.querySelector('.ghead .gcell.actions-col') as HTMLElement | null;

    // "ACCIONES" measures 62.83px and the collapsed track is 44px: left as visible text it spills
    // out of its own cell and over "Estado". It stays as the column's accessible name only.
    expect(head, 'the actions column must keep its header cell').not.toBeNull();
    const label = head?.querySelector('.sr-only');
    expect(label?.textContent?.trim(), 'the header keeps naming the column for assistive tech').toBe('Acciones');
    expect(head?.textContent?.trim(), 'nothing else may be painted in a 44px cell').toBe('Acciones');
  });

  it('expanded, the header keeps its visible "Acciones" label', async () => {
    const table = await mount(false);
    const head = table.shadowRoot?.querySelector('.ghead .gcell.actions-col') as HTMLElement | null;
    expect(head?.textContent?.trim()).toBe('Acciones');
    expect(head?.querySelector('.sr-only'), 'with 188px of room the label is shown, not hidden').toBeNull();
  });

  it('choosing an action from the menu emits rowAction for THAT row', async () => {
    const table = await mount(true);
    const seen: Array<{ actionId: string; row: Record<string, unknown> }> = [];
    table.addEventListener('rowAction', (e) => seen.push((e as CustomEvent).detail));

    const trigger = rowActionsCell(table)?.querySelector('ion-button') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await table.updateComplete;

    const items = [...(table.shadowRoot?.querySelectorAll('.row-menu ion-item') ?? [])];
    expect(items.length, 'every row action must be reachable from the menu').toBe(ACTIONS.length);
    expect(items.map((i) => i.textContent?.trim())).toEqual(['Confirmar', 'Sentar', 'Finalizar', 'Cancelar']);

    (items[1] as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(seen).toHaveLength(1);
    expect(seen[0].actionId).toBe('seat');
    expect(seen[0].row.id).toBe('1');
  });

  it('an action disabled for a row stays disabled inside the menu', async () => {
    const table = await mount(true);
    table.actions = [
      { id: 'confirm', label: 'Confirmar', icon: 'checkmark-outline', disabled: (r: Record<string, unknown>) => r.id === '1' },
      ...ACTIONS.slice(1),
    ];
    await table.updateComplete;

    const trigger = rowActionsCell(table)?.querySelector('ion-button') as HTMLElement;
    trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await table.updateComplete;

    const first = table.shadowRoot?.querySelector('.row-menu ion-item') as HTMLElement | null;
    expect(first?.hasAttribute('disabled'), 'a disabled action must not be clickable from the menu').toBe(true);
    const seen: unknown[] = [];
    table.addEventListener('rowAction', (e) => seen.push(e));
    first?.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    expect(seen, 'a disabled action must not emit').toHaveLength(0);
  });
});
