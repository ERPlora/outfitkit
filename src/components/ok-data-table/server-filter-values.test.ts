// @vitest-environment happy-dom
//
// outfitkit#106 — in `serverSide` the column filter controls never painted their value: the table
// could not be opened already filtered (a module narrowing the list from a query string or a link
// had no property to seed) and it did not even keep what the user had just picked, because both
// `render*Filter` read `clientFilters`, which is only ever written in CLIENT mode. The screen then
// showed fewer rows than exist WITHOUT saying why — the same failure class closed on the engine
// side by ERPlora/hub#1173 and ERPlora/hub#1182.
//
// The contract fixed here: `filterValues` (by column key, same shape the table emits in
// `filterChange`) governs what the controls show in server mode, and the table mirrors it
// optimistically so the pick survives the next render on its own.
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
  serverSide: boolean;
  inlineFilters: boolean;
  filterValues: Record<string, unknown>;
  total: number;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [
  { key: 'name', header: 'Name' },
  {
    key: 'status',
    header: 'Status',
    filterable: true,
    filterType: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'unconfigured', label: 'Needs setup' },
    ],
  },
  {
    key: 'tags',
    header: 'Tags',
    filterable: true,
    filterType: 'multiselect',
    options: [
      { value: 'food', label: 'Food' },
      { value: 'drink', label: 'Drink' },
    ],
  },
  { key: 'created', header: 'Created', filterable: true, filterType: 'daterange' },
  { key: 'sku', header: 'SKU', filterable: true, filterType: 'text' },
];

/** happy-dom has no matchMedia: keep the table on the desktop branch. */
function desktop(): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: false, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Coffee', status: 'active', tags: 'food', created: '2026-01-10', sku: 'A1' }];
  table.columns = COLUMNS;
  table.total = 1;
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

function sr(table: Table): ShadowRoot {
  return table.shadowRoot as ShadowRoot;
}

/** Opens the filter drawer through the public path (the funnel button). */
async function openFilters(table: Table): Promise<void> {
  const funnel = sr(table).querySelector('.bar-main ion-button.toolbtn[aria-label="Filters"]') as HTMLElement | null;
  expect(funnel, 'the filter button is not rendered').toBeTruthy();
  funnel!.click();
  await table.updateComplete;
}

/** The drawer control of a column, found by its Ionic `label` (renderFilterControl) or the
 *  `.flabel` of its range block. */
function drawerSelect(table: Table, header: string): (Element & { value?: unknown }) | null {
  return sr(table).querySelector(`.drawer ion-select[label="${header}"]`) as (Element & { value?: unknown }) | null;
}

function inlineSelect(table: Table, header: string): (Element & { value?: unknown }) | null {
  return sr(table).querySelector(`.bar-main ion-select.tk-filter[aria-label="${header}"]`) as
    (Element & { value?: unknown }) | null;
}

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.lang = 'en';
  desktop();
});

describe('ok-data-table (server): the table can be OPENED already filtered (#106)', () => {
  it('the inline select paints the seeded value', async () => {
    const table = await mount({
      serverSide: true,
      inlineFilters: true,
      filterValues: { status: 'unconfigured' },
    });

    expect(inlineSelect(table, 'Status')?.value, 'the inline filter does not show the seeded value').toBe(
      'unconfigured',
    );
  });

  it('the drawer select paints the seeded value', async () => {
    const table = await mount({ serverSide: true, filterValues: { status: 'unconfigured' } });
    await openFilters(table);

    expect(drawerSelect(table, 'Status')?.value, 'the drawer filter does not show the seeded value').toBe(
      'unconfigured',
    );
  });

  it('a multiselect is seeded with the whole array', async () => {
    const table = await mount({
      serverSide: true,
      inlineFilters: true,
      filterValues: { tags: ['food', 'drink'] },
    });

    expect(inlineSelect(table, 'Tags')?.value, 'the multiselect drops the seeded values').toEqual([
      'food',
      'drink',
    ]);
  });

  it('a date range is seeded on both edges', async () => {
    const table = await mount({
      serverSide: true,
      inlineFilters: true,
      filterValues: { created: { from: '2026-01-01', to: '2026-01-31' } },
    });

    const edges = [...sr(table).querySelectorAll('.tk-daterange ion-input')] as Array<Element & { value?: unknown }>;
    expect(edges.length, 'the date range pill is not rendered').toBe(2);
    expect(edges[0].value, 'the "from" edge is empty').toBe('2026-01-01');
    expect(edges[1].value, 'the "to" edge is empty').toBe('2026-01-31');
  });

  it('the drawer text filter is seeded too', async () => {
    const table = await mount({ serverSide: true, filterValues: { sku: 'A1' } });
    await openFilters(table);

    const input = sr(table).querySelector('.drawer ion-input[label="SKU"]') as (Element & { value?: unknown }) | null;
    expect(input?.value, 'the text filter does not show the seeded value').toBe('A1');
  });

  it('the funnel badge counts the active server filters, so the screen SAYS it is filtered', async () => {
    const table = await mount({ serverSide: true, filterValues: { status: 'unconfigured', sku: 'A1' } });

    const badge = sr(table).querySelector('.bar-main ion-button.toolbtn[aria-label="Filters"] .badge');
    expect(badge?.textContent?.trim(), 'the funnel gives no sign that the list is filtered').toBe('2');
  });

  it('re-seeding with a NEW object replaces the shown state (the consumer clearing filters)', async () => {
    const table = await mount({
      serverSide: true,
      inlineFilters: true,
      filterValues: { status: 'unconfigured' },
    });
    table.filterValues = {};
    await table.updateComplete;

    expect(inlineSelect(table, 'Status')?.value, 'clearing the filters left the old value painted').toBe('');
  });
});

describe('ok-data-table (server): the control KEEPS what the user just picked (#106)', () => {
  it('the inline select survives the next render without the consumer echoing the prop back', async () => {
    const table = await mount({ serverSide: true, inlineFilters: true });
    const seen: unknown[] = [];
    table.addEventListener('filterChange', (e) => seen.push((e as CustomEvent).detail));

    inlineSelect(table, 'Status')!.dispatchEvent(
      new CustomEvent('ionChange', { detail: { value: 'active' } }),
    );
    await table.updateComplete;
    // A refresh from the server: new rows land, the table re-renders.
    table.rows = [{ id: 2, name: 'Tea', status: 'active' }];
    await table.updateComplete;

    expect(seen, 'the change is no longer reported to the consumer').toEqual([
      { col: 'status', value: 'active' },
    ]);
    expect(inlineSelect(table, 'Status')?.value, 'the pick was wiped on the next render').toBe('active');
  });

  // The two edges of a range travel in SEPARATE `filterChange` events (`{from}` then `{to}`), so a
  // mirror that replaced instead of merging would drop whichever edge was typed first.
  // Asserted after closing and re-opening the drawer: those nodes are rendered from scratch, so the
  // value read back is the one the table decided, never a leftover of the test's own typing.
  it('a date edge merges into the other one instead of replacing it', async () => {
    const table = await mount({ serverSide: true });
    await openFilters(table);
    const edges = () => [...sr(table).querySelectorAll('.drawer .frange ion-input')] as Array<Element & { value?: unknown }>;

    const type = async (index: number, value: string): Promise<void> => {
      const edge = edges()[index];
      (edge as unknown as { value: string }).value = value;
      edge.dispatchEvent(new CustomEvent('ionInput'));
      await table.updateComplete;
    };

    expect(edges().length, 'the drawer date range is not rendered').toBe(2);
    await type(0, '2026-01-01');
    await type(1, '2026-01-31');

    // Close and re-open: the drawer subtree is destroyed and rebuilt.
    await openFilters(table);
    await openFilters(table);

    expect(edges()[0].value, 'setting "to" wiped "from"').toBe('2026-01-01');
    expect(edges()[1].value, '"to" was not kept').toBe('2026-01-31');
  });
});

describe('ok-data-table (client): nothing changes (#106 regression guard)', () => {
  it('client mode ignores `filterValues` and keeps filtering in memory', async () => {
    const table = await mount({
      serverSide: false,
      inlineFilters: true,
      filterValues: { status: 'unconfigured' },
    });

    expect(inlineSelect(table, 'Status')?.value, 'client mode started with a filter it never applied').toBe('');
    expect(table.rows.length, 'client mode filtered rows out of a filter it never applied').toBe(1);
  });

  it('client mode still paints what the user picks (from clientFilters)', async () => {
    const table = await mount({ serverSide: false, inlineFilters: true });

    inlineSelect(table, 'Status')!.dispatchEvent(
      new CustomEvent('ionChange', { detail: { value: 'active' } }),
    );
    await table.updateComplete;

    expect(inlineSelect(table, 'Status')?.value, 'client mode lost the pick').toBe('active');
  });
});
