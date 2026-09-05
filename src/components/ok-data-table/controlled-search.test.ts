// @vitest-environment happy-dom
//
// outfitkit#112 — in `serverSide` the `ion-searchbar` was rendered WITHOUT `.value`, so it was an
// uncontrolled control: the table emitted `searchChange` outwards but there was no way back for the
// container to impose a value. A module that offers "clear the search" cleared the LIST and left
// the typed text sitting in the box: the screen contradicted itself — the searchbar claimed a
// filter was on while the list showed everything, and the person could not tell whether they were
// looking at search results or not.
//
// Reported from ERPlora/reservations#41, where the module works around it by reaching through the
// table's `shadowRoot` from `clearQuery()` and blanking the `ion-searchbar` value by hand. Every
// module offering "clear filters" needed that same workaround.
//
// The contract fixed here: `search` governs what the searchbar shows (same string the table emits
// in `searchChange`), the table mirrors it optimistically so typing survives the next render, and
// a consumer that never sets it keeps today's uncontrolled behaviour untouched.
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
  searchable: boolean;
  searchKeys: string[];
  pageSize: number;
  search?: string;
  total: number;
  updateComplete: Promise<unknown>;
};

type Searchbar = HTMLElement & { value?: string };

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
  table.rows = [
    { id: 1, name: 'García' },
    { id: 2, name: 'Pérez' },
  ];
  table.columns = [{ key: 'name', header: 'Name' }];
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

const searchbar = (table: Table): Searchbar =>
  table.shadowRoot?.querySelector('ion-searchbar') as Searchbar;

/** What the person does: type in the box. `ion-searchbar` writes its own `value`, then emits. */
async function type(table: Table, text: string): Promise<void> {
  const bar = searchbar(table);
  bar.value = text;
  bar.dispatchEvent(new CustomEvent('ionInput', { detail: { value: text } }));
  await table.updateComplete;
}

describe('ok-data-table: the searchbar takes its value from the outside (#112)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
    desktop();
  });

  it('server mode: clearing the search from the module empties the searchbar too', async () => {
    const table = await mount({ serverSide: true, searchable: true, total: 2 });
    await type(table, 'García');
    expect(searchbar(table).value, 'the box does not even keep what was typed').toBe('García');

    // The module's own "clear the search" button: it owns the query in server mode.
    table.search = '';
    await table.updateComplete;

    expect(searchbar(table).value, 'the list shows everything but the box still says «García»').toBe('');
  });

  it('server mode: the table opens already showing a search set from the outside', async () => {
    const table = await mount({ serverSide: true, searchable: true, total: 1, search: 'García' });
    expect(searchbar(table).value, 'a table opened from a link with a query shows an empty box').toBe('García');
  });

  it('server mode: typing still emits `searchChange` with what was typed', async () => {
    const table = await mount({ serverSide: true, searchable: true, total: 2 });
    const seen: string[] = [];
    table.addEventListener('searchChange', (e) => seen.push((e as CustomEvent<string>).detail));

    await type(table, 'Gar');

    expect(seen, 'the module no longer learns what the person typed').toEqual(['Gar']);
  });

  it('setting `search` from the outside does NOT emit `searchChange` (no feedback loop)', async () => {
    const table = await mount({ serverSide: true, searchable: true, total: 2 });
    const seen: string[] = [];
    table.addEventListener('searchChange', (e) => seen.push((e as CustomEvent<string>).detail));

    table.search = 'García';
    await table.updateComplete;

    expect(seen, 'the table answers its own consumer and both re-query forever').toEqual([]);
  });

  it('a consumer that never sets `search` keeps typing (the property is not mandatory)', async () => {
    const table = await mount({ serverSide: true, searchable: true, total: 2 });
    await type(table, 'García');
    // A render triggered by anything else must not blank a box nobody is controlling.
    table.total = 1;
    await table.updateComplete;
    expect(searchbar(table).value, 'an uncontrolled table wipes what the person is typing').toBe('García');
  });

  it('`search` back to `undefined` releases control instead of blanking the box', async () => {
    // A consumer binding an optional ref (`:search="query"` with `query` going undefined) must not
    // be read as «clear it»: `q` is a string, and assigning `undefined` made `q.trim()` throw in
    // client mode. Undefined means «I am not controlling this», so the user's text stands.
    const table = await mount({ searchKeys: ['name'], search: 'García' });
    table.search = undefined;
    await table.updateComplete;

    expect(searchbar(table).value, 'undefined was taken as an order to clear the search').toBe('García');
    const body = table.shadowRoot?.textContent ?? '';
    expect(body, 'the row list blew up when the property went undefined').toContain('García');
  });

  it('client mode: a search from the outside starts at the first page of the new result set', async () => {
    const table = await mount({ searchKeys: ['name'], pageSize: 1 });
    // The person is on page 2 (Pérez) when the module narrows the list from the outside.
    (table as unknown as { clientPage: number }).clientPage = 1;
    await table.updateComplete;
    expect(table.shadowRoot?.textContent ?? '').toContain('Pérez');

    table.search = 'García';
    await table.updateComplete;

    expect(
      (table as unknown as { clientPage: number }).clientPage,
      'a new result set keeps the old page number and the list jumps back on clearing',
    ).toBe(0);
  });

  it('client mode: `search` from the outside filters the rows and is shown in the box', async () => {
    const table = await mount({ searchKeys: ['name'] });
    table.search = 'García';
    await table.updateComplete;

    expect(searchbar(table).value).toBe('García');
    const body = table.shadowRoot?.textContent ?? '';
    expect(body, 'the rows ignore a search set from the outside').toContain('García');
    expect(body, 'the rows ignore a search set from the outside').not.toContain('Pérez');
  });
});
