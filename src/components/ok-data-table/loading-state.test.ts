// @vitest-environment happy-dom
//
// ERPlora/outfitkit#268 — while a module's list was still being asked to the hub, the module
// swapped the empty message for «Loading…» but the footer already said «0 records»: for seconds,
// on a slow connection, the screen claimed there was nothing before having looked.
//
// The contract fixed here: "still loading" is a state of its own, like "could not load" (pm#530).
// While `loading` is set and there are no rows to show yet, the table does not count records nor
// claim the list is empty: it shows a loading indicator, announced as a status. Rows already on
// screen (a reload after a search or a page change) stay, with their count, and the table is
// marked busy.
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
  total: number;
  title: string;
  testid?: string;
  views: string[];
  viewMode: string;
  emptyMessage?: string;
  error?: string;
  loading: boolean;
  columnPicker: boolean;
  labels: Record<string, string>;
  updateComplete: Promise<unknown>;
};

function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile && q.includes('max-width'), onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

const ROWS = [
  { id: 1, name: 'Ana' },
  { id: 2, name: 'Luis' },
];

async function settle(table: Table): Promise<void> {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.serverSide = true;
  table.rows = [];
  table.total = 0;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.title = 'Customers';
  table.emptyMessage = 'No customers.';
  Object.assign(table, props);
  document.body.appendChild(table);
  await settle(table);
  return table;
}

const root = (t: Table): ShadowRoot => t.shadowRoot as ShadowRoot;
const text = (t: Table): string => (root(t).textContent ?? '').replace(/\s+/g, ' ').trim();
const loadingBlock = (t: Table): HTMLElement | null => root(t).querySelector('[data-role="loading"]');
const loadingText = (t: Table): string => (loadingBlock(t)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const pagerText = (t: Table): string => (root(t).querySelector('.pager')?.textContent ?? '').replace(/\s+/g, ' ').trim();
const card = (t: Table): HTMLElement => root(t).querySelector('.card') as HTMLElement;

describe('ok-data-table — "still loading" is not "empty" (ERPlora/outfitkit#268)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = 'en';
    viewport(false);
  });

  it('a first load in flight does not count zero records nor claim the list is empty', async () => {
    const table = await mount({ loading: true });
    expect(text(table)).not.toContain('No customers.');
    expect(root(table).querySelector('.empty')).toBeNull();
    expect(root(table).querySelector('.title-count')).toBeNull();
    // With the page-size selector up in the toolbar the footer would only hold the count: no
    // footer at all, rather than an empty strip.
    expect(root(table).querySelector('.pager')).toBeNull();
  });

  it('without a toolbar the footer keeps its page-size selector, but no record count', async () => {
    const table = await mount({ title: '', columnPicker: false, loading: true });
    expect(root(table).querySelector('.bar')).toBeNull();
    expect(root(table).querySelector('.pager select.psize')).not.toBeNull();
    expect(pagerText(table)).not.toMatch(/\brecords?\b/);
  });

  it('a retry in flight without a toolbar keeps the same footer as a first load', async () => {
    const table = await mount({ title: '', columnPicker: false, error: 'The hub is not responding.', loading: true });
    expect(root(table).querySelector('.pager select.psize')).not.toBeNull();
    expect(pagerText(table)).not.toMatch(/\brecords?\b/);
  });

  it('shows a loading indicator, announced as a status, and marks the table busy', async () => {
    const table = await mount({ loading: true });
    expect(loadingBlock(table)).not.toBeNull();
    expect(loadingBlock(table)?.getAttribute('role')).toBe('status');
    expect(loadingText(table)).toBe('Loading…');
    expect(loadingBlock(table)?.querySelector('ion-spinner')).not.toBeNull();
    expect(card(table).getAttribute('aria-busy')).toBe('true');
  });

  it('when the answer arrives the table counts and shows what came back', async () => {
    const table = await mount({ loading: true });
    table.loading = false;
    table.rows = ROWS;
    table.total = 2;
    await settle(table);
    expect(loadingBlock(table)).toBeNull();
    expect(card(table).hasAttribute('aria-busy')).toBe(false);
    expect(text(table)).toContain('Ana');
    expect(root(table).querySelector('.title-count')?.textContent?.trim()).toBe('2');
    expect(pagerText(table)).toMatch(/\b2 records\b/);
  });

  it('an empty answer brings back the empty message and «0 records»', async () => {
    const table = await mount({ loading: true });
    table.loading = false;
    await settle(table);
    expect(loadingBlock(table)).toBeNull();
    expect(text(table)).toContain('No customers.');
    expect(pagerText(table)).toMatch(/\b0 records\b/);
  });

  it('a reload with rows already on screen keeps them and their count, and marks the table busy', async () => {
    const table = await mount({ rows: ROWS, total: 2, loading: true });
    expect(loadingBlock(table)).toBeNull();
    expect(text(table)).toContain('Ana');
    expect(pagerText(table)).toMatch(/\b2 records\b/);
    expect(card(table).getAttribute('aria-busy')).toBe('true');
  });

  it('a retry in flight shows the loading indicator, not the old error and its Retry button', async () => {
    const table = await mount({ error: 'The hub is not responding.', loading: true });
    expect(root(table).querySelector('[data-role="load-error"]')).toBeNull();
    expect(root(table).querySelector('[data-role="load-error-retry"]')).toBeNull();
    expect(loadingBlock(table)).not.toBeNull();
    // Same footer as a first load: nothing to count yet.
    expect(pagerText(table)).not.toMatch(/\brecords?\b/);
  });

  it('a retry in flight over rows left from an earlier load shows the indicator, not those rows nor the error', async () => {
    const table = await mount({ rows: ROWS, total: 2, error: 'The hub is not responding.', loading: true });
    expect(root(table).querySelector('[data-role="load-error"]')).toBeNull();
    expect(text(table)).not.toContain('Ana');
    expect(loadingBlock(table)).not.toBeNull();
  });

  it('the card view shows the same loading state', async () => {
    const table = await mount({ views: ['table', 'cards'], viewMode: 'cards', loading: true });
    expect(root(table).querySelector('.empty')).toBeNull();
    expect(loadingText(table)).toBe('Loading…');
  });

  it('on a phone there is no record count nor «Load more» while the first load is in flight', async () => {
    viewport(true);
    const table = await mount({ loading: true });
    expect(root(table).querySelector('.load-more')).toBeNull();
    expect(text(table)).not.toMatch(/\b0 records\b/);
    expect(loadingBlock(table)).not.toBeNull();
  });

  it('client mode shows the loading state too', async () => {
    const table = await mount({ serverSide: false, loading: true });
    expect(text(table)).not.toContain('No customers.');
    expect(loadingBlock(table)).not.toBeNull();
  });

  it('speaks Spanish on a Spanish document', async () => {
    document.documentElement.lang = 'es';
    const table = await mount({ loading: true });
    expect(loadingText(table)).toBe('Cargando…');
    expect(text(table)).not.toMatch(/\b0 registros\b/);
  });

  it('the consumer can word the indicator through `.labels`', async () => {
    const table = await mount({ loading: true, labels: { loading: 'Fetching customers…' } });
    expect(loadingText(table)).toBe('Fetching customers…');
  });

  it('the loading block keeps the place of the rows (fill mode, open panel)', async () => {
    const table = await mount({ loading: true });
    table.setAttribute('fill', '');
    await settle(table);
    // Fill mode: it stretches between toolbar and footer, like the empty and error states.
    expect(getComputedStyle(loadingBlock(table) as HTMLElement).flexGrow).toBe('1');
    // Desktop with the create panel open: the block takes the rows' cell next to the panel.
    (table as unknown as { open: (mode: string) => void }).open('create');
    await settle(table);
    expect(card(table).classList.contains('has-panel')).toBe(true);
    const placed = getComputedStyle(loadingBlock(table) as HTMLElement);
    expect([placed.gridColumn, placed.gridRow]).toEqual(['1', '2']);
  });

  it('the loading block carries a test hook derived from `testid`', async () => {
    const table = await mount({ testid: 'customers', loading: true });
    expect(loadingBlock(table)?.getAttribute('data-testid')).toBe('customers-loading');
  });

  it('the `loading` attribute turns it on from markup', async () => {
    const table = await mount();
    table.setAttribute('loading', '');
    await settle(table);
    expect(loadingBlock(table)).not.toBeNull();
  });
});
