// @vitest-environment happy-dom

// outfitkit#143 — "the QA robot cannot press «Add», search or run a row action: ok-data-table's
// chrome has no stable names".
//
// Almost every list in the Hub (staff, products, tables, bookings, customers) is an
// `<ok-data-table>`. Playwright can read the rows, but the chrome — the Add button, the searchbar,
// the row actions, CSV import/export and the pager — carried ZERO `data-testid` (measured on
// 2026-09-11 against origin/main@9695808), so a spec had to address them by visible text or by
// position. Both break on their own: the text changes with the language (ADR-0055/0199) and the
// position changes the moment the table grows one more action.
//
// The convention is the Hub's own (`architecture/hub/apps/testids.md`): `<surface>-<action>`, and a
// REUSABLE control receives its namespace from whoever uses it — a fixed name inside the component
// would give two tables on the same screen the same hook and `getByTestId` would pick one at
// random. So the host declares the prefix (`testid="products-table"`) and the table derives every
// hook from it; with no prefix it paints none, so nothing changes for whoever does not ask.
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
  actions: Array<Record<string, unknown>>;
  searchKeys: string[];
  addable: boolean;
  csv: boolean;
  views: unknown;
  defaultView?: 'table' | 'cards';
  primaryAction?: Record<string, unknown>;
  testid?: string;
  pageSize: number;
  rowActionsCollapsed: boolean;
  renderRoot: DocumentFragment | HTMLElement;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [{ key: 'name', header: 'Nombre' }];
const ACTIONS = [
  { id: 'edit', label: 'Editar', icon: 'create-outline' },
  { id: 'delete', label: 'Borrar', icon: 'trash-outline' },
];
/** 12 rows against a page size of 10: enough for the pager to have a second page. */
const ROWS = Array.from({ length: 12 }, (_, i) => ({ id: `r${i + 1}`, name: `Producto ${i + 1}` }));

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.columns = COLUMNS;
  table.rows = ROWS;
  table.actions = ACTIONS;
  table.searchKeys = ['name'];
  table.addable = true;
  table.csv = true;
  table.testid = 'products-table';
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

/** Every hook the table currently paints, in document order. */
function hooks(table: Table): string[] {
  return [...table.renderRoot.querySelectorAll('[data-testid]')].map(
    (el) => el.getAttribute('data-testid') ?? '',
  );
}

function byTestId(table: Table, id: string): Element[] {
  return [...table.renderRoot.querySelectorAll(`[data-testid="${id}"]`)];
}

beforeEach(() => {
  document.body.innerHTML = '';
  viewport(false);
});

describe('ok-data-table · data-testid hooks of the chrome (#143)', () => {
  it('paints NO hook without a prefix: whoever does not ask sees no change', async () => {
    const table = await mount({ testid: undefined });

    expect(hooks(table)).toEqual([]);
  });

  it('paints no hook for a blank prefix either (no dangling `-add`)', async () => {
    const table = await mount({ testid: '   ' });

    expect(hooks(table)).toEqual([]);
  });

  it('names the toolbar: add, primary action, search and CSV import/export', async () => {
    const table = await mount({ primaryAction: { id: 'import', label: 'Importar' } });

    expect(byTestId(table, 'products-table-add')).toHaveLength(1);
    expect(byTestId(table, 'products-table-add')[0].tagName.toLowerCase()).toBe('ion-button');

    expect(byTestId(table, 'products-table-primary-action')).toHaveLength(1);

    expect(byTestId(table, 'products-table-search')).toHaveLength(1);
    expect(byTestId(table, 'products-table-search')[0].tagName.toLowerCase()).toBe('ion-searchbar');

    // The import hook goes on the `<input type=file>`, not on the pretty button that triggers it:
    // that is what a spec fills (`setInputFiles`), and nobody drives the button's native dialog.
    // Same criterion as `GrantFilePicker.vue` in the Hub.
    expect(byTestId(table, 'products-table-csv-import')).toHaveLength(1);
    expect(byTestId(table, 'products-table-csv-import')[0].tagName.toLowerCase()).toBe('input');

    expect(byTestId(table, 'products-table-csv-export')).toHaveLength(1);
  });

  it('names every row and every row action by the row identity, never by position', async () => {
    const table = await mount();

    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r2')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-delete')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r2-edit')).toHaveLength(1);

    // Row 11 is on the second page: its hook does NOT exist yet.
    expect(byTestId(table, 'products-table-row-r11')).toHaveLength(0);
  });

  it('names the rows in the CARDS view too (the mobile default)', async () => {
    const table = await mount({ views: true, defaultView: 'cards' });

    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1')[0].tagName.toLowerCase()).toBe('ion-card');
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
  });

  it('names the desktop pager', async () => {
    const table = await mount();

    expect(byTestId(table, 'products-table-page-prev')).toHaveLength(1);
    expect(byTestId(table, 'products-table-page-next')).toHaveLength(1);
  });

  it('on MOBILE the footer is «load more», with its own hook', async () => {
    viewport(true);
    const table = await mount();

    // The numbered pager does not exist on mobile (#78): without this hook a phone spec — the
    // POS viewport — has no way to ask for the next batch of rows.
    expect(byTestId(table, 'products-table-page-next')).toHaveLength(0);
    expect(byTestId(table, 'products-table-load-more')).toHaveLength(1);
  });

  it('with the actions COLLAPSED the hook lives in the menu and is NOT duplicated', async () => {
    const table = await mount();
    table.rowActionsCollapsed = true;
    await table.updateComplete;

    // The row menu trigger has a name of its own…
    expect(byTestId(table, 'products-table-row-r1-menu')).toHaveLength(1);
    (byTestId(table, 'products-table-row-r1-menu')[0] as HTMLElement).click();
    await table.updateComplete;

    // …and the action is named the SAME collapsed or not, so one spec works at any width. Exactly
    // once: two elements with the hook would make `getByTestId` pick one at random.
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')[0].tagName.toLowerCase()).toBe('ion-item');

    // When it unfolds again the hook returns to the direct button, and there is still only one.
    table.rowActionsCollapsed = false;
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')[0].tagName.toLowerCase()).toBe('ion-button');
  });

  it('two tables on the same screen share NOT ONE hook', async () => {
    const products = await mount({ testid: 'products-table' });
    const customers = await mount({ testid: 'customers-table' });

    // Without this first assertion the comparison would be green with both tables mute.
    expect(hooks(products).length).toBeGreaterThan(0);
    expect(hooks(customers).length).toBeGreaterThan(0);

    const shared = hooks(products).filter((h) => hooks(customers).includes(h));
    expect(shared).toEqual([]);
    expect(hooks(customers).every((h) => h.startsWith('customers-table-'))).toBe(true);
  });

  it('EVERY hook the table paints derives from the host prefix — none is fixed', async () => {
    const table = await mount({ primaryAction: { id: 'import', label: 'Importar' } });

    const painted = hooks(table);
    expect(painted.length).toBeGreaterThan(0);
    expect(painted.filter((h) => !h.startsWith('products-table-'))).toEqual([]);
  });

  it('each hook drives the control it names, not merely an element that exists', async () => {
    // A hook is a contract with specs in another repo: `-page-next` that goes BACK, or `-add`
    // that fires `primaryAction` instead of opening the create panel, would pass a presence-only
    // check and break every spec that trusts the name (mutants M1/M2 of the review of #145).
    const table = await mount({ primaryAction: { id: 'import', label: 'Importar' } });
    const events: Array<{ type: string; detail: unknown }> = [];
    for (const type of ['rowAction', 'primaryAction']) {
      table.addEventListener(type, (e) => events.push({ type, detail: (e as CustomEvent).detail }));
    }

    // `-search` filters the rows through the host's own searchbar.
    const search = byTestId(table, 'products-table-search')[0] as HTMLInputElement;
    search.value = 'Producto 12';
    search.dispatchEvent(new Event('ionInput'));
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r12')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(0);
    search.value = '';
    search.dispatchEvent(new Event('ionInput'));
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);

    // `-page-next` shows the second page (row 11 appears, row 1 leaves); `-page-prev` comes back.
    expect(byTestId(table, 'products-table-row-r11')).toHaveLength(0);
    (byTestId(table, 'products-table-page-next')[0] as HTMLElement).click();
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r11')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(0);
    (byTestId(table, 'products-table-page-prev')[0] as HTMLElement).click();
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r11')).toHaveLength(0);

    // `-row-r1-delete` emits rowAction for THAT row and THAT action.
    (byTestId(table, 'products-table-row-r1-delete')[0] as HTMLElement).click();
    expect(events).toContainEqual({ type: 'rowAction', detail: { actionId: 'delete', row: ROWS[0] } });

    // `-primary-action` emits primaryAction and does NOT open the create panel…
    (byTestId(table, 'products-table-primary-action')[0] as HTMLElement).click();
    await table.updateComplete;
    expect(events.some((e) => e.type === 'primaryAction')).toBe(true);
    expect(table.renderRoot.querySelector('slot[name="create"]')).toBeNull();

    // …while `-add` is the one that opens it.
    (byTestId(table, 'products-table-add')[0] as HTMLElement).click();
    await table.updateComplete;
    expect(table.renderRoot.querySelector('slot[name="create"]')).not.toBeNull();
  });
});
