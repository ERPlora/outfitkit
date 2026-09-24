// @vitest-environment happy-dom
//
// outfitkit#171 — in client mode, a search (or column filter) that left no row standing showed the
// SAME message as a table with no rows at all. In the hub's blueprint catalogue that message is
// «No templates published for your business yet», so a person who mistyped a search read "the
// catalogue is empty" and gave up, when clearing the box would have shown six templates.
//
// The contract fixed here: "empty" (no rows) and "no matches" (rows exist, the search/filters hide
// them all) are different states. The second one says so — own label, `no-matches-message`
// override — and offers a button that clears the search and filters in one tap.
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
  searchKeys: string[];
  serverSide: boolean;
  searchable: boolean;
  emptyMessage?: string;
  noMatchesMessage?: string;
  labels: Record<string, string>;
  updateComplete: Promise<unknown>;
};

type Searchbar = HTMLElement & { value?: string };

function desktop(): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: false, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

const ROWS = [
  { id: 1, name: 'Restaurant', status: 'published' },
  { id: 2, name: 'Hair salon', status: 'published' },
];

async function settle(table: Table): Promise<void> {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', filter: 'select' },
  ];
  table.searchKeys = ['name'];
  table.emptyMessage = 'No templates published yet';
  Object.assign(table, props);
  document.body.appendChild(table);
  await settle(table);
  return table;
}

const root = (t: Table): ShadowRoot => t.shadowRoot as ShadowRoot;
const emptyText = (t: Table): string =>
  (root(t).querySelector('.empty')?.textContent ?? '').replace(/\s+/g, ' ').trim();
const resetButton = (t: Table): HTMLButtonElement | null =>
  root(t).querySelector('[data-role="no-matches-reset"]');

async function type(table: Table, text: string): Promise<void> {
  const bar = root(table).querySelector('ion-searchbar') as Searchbar;
  bar.value = text;
  bar.dispatchEvent(new CustomEvent('ionInput', { detail: { value: text } }));
  await settle(table);
}

describe('ok-data-table — "no matches" is not "empty" (outfitkit#171)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = 'en';
    desktop();
  });

  it('a search that hides every row does not claim the list is empty', async () => {
    const table = await mount();
    await type(table, 'zzz');
    expect(root(table).querySelector('.row, [role="row"][data-key]')).toBeNull();
    expect(emptyText(table)).not.toContain('No templates published yet');
    expect(emptyText(table)).toContain('No results match your search or filters');
  });

  it('with no rows at all it keeps the empty message and offers no reset', async () => {
    const table = await mount({ rows: [] });
    expect(emptyText(table)).toContain('No templates published yet');
    expect(resetButton(table)).toBeNull();
  });

  it('with no rows at all and a leftover search, it is still "empty"', async () => {
    const table = await mount({ rows: [] });
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('No templates published yet');
    expect(resetButton(table)).toBeNull();
  });

  it('the consumer can word the "no matches" message', async () => {
    const table = await mount({ noMatchesMessage: 'No template matches' });
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('No template matches');
  });

  it('the attribute `no-matches-message` works from plain HTML', async () => {
    const table = await mount();
    table.setAttribute('no-matches-message', 'Nothing here for that');
    await settle(table);
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('Nothing here for that');
  });

  it('is translated to Spanish by the document language', async () => {
    document.documentElement.lang = 'es';
    const table = await mount();
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('Ningún resultado coincide con la búsqueda o los filtros');
    expect(resetButton(table)?.textContent?.trim()).toBe('Mostrar todo');
  });

  it('`labels` can override both texts', async () => {
    const table = await mount({ labels: { noMatches: 'Nope', showAll: 'Everything' } });
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('Nope');
    expect(resetButton(table)?.textContent?.trim()).toBe('Everything');
  });

  it('"Show all" clears the search: every row is back and the box is empty', async () => {
    const table = await mount();
    await type(table, 'zzz');
    const btn = resetButton(table);
    expect(btn?.textContent?.trim()).toBe('Show all');
    btn!.click();
    await settle(table);
    expect(root(table).querySelector('.empty')).toBeNull();
    expect(root(table).textContent).toContain('Restaurant');
    expect(root(table).textContent).toContain('Hair salon');
    const bar = root(table).querySelector('ion-searchbar') as Searchbar;
    expect(bar.value).toBe('');
  });

  it('a column filter that hides every row is also "no matches", and "Show all" clears it', async () => {
    const table = await mount();
    const events: unknown[] = [];
    table.addEventListener('filterChange', (e) => events.push((e as CustomEvent).detail));
    // Drive the internal state the filter drawer writes (status ∈ {archived}): no row matches.
    const t = table as unknown as { clientFilters: Record<string, { values?: Set<string> }> };
    t.clientFilters = { status: { values: new Set(['archived']) } };
    await settle(table);
    expect(emptyText(table)).toContain('No results match your search or filters');
    resetButton(table)!.click();
    await settle(table);
    expect(root(table).textContent).toContain('Restaurant');
    expect(events.at(-1)).toEqual({ filters: {} });
  });

  it('server-side keeps its own empty message: the consumer owns the query', async () => {
    const table = await mount({ serverSide: true, searchable: true, rows: [] });
    await type(table, 'zzz');
    expect(emptyText(table)).toContain('No templates published yet');
    expect(resetButton(table)).toBeNull();
  });
});
