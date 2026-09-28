// @vitest-environment happy-dom
//
// ERPlora/pm#530 — when a module's list could not load (the hub answered 502), the module showed
// its own warning on top, but the table underneath still said «Sin clientes.» and «0 registros»,
// as if the business had no customers at all. And there was no way to try again short of reloading
// the whole page.
//
// The contract fixed here: "could not load" is a third state, distinct from "empty" and from
// "no matches". While `error` carries a reason, the table does not claim the list is empty nor
// count zero records: it says the data could not be loaded, shows the reason and offers a «Retry»
// button that emits `retry` so the owner of the query can load it again.
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

const REASON = 'The hub is not responding. Try again in a moment.';
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
const errorBlock = (t: Table): HTMLElement | null => root(t).querySelector('[data-role="load-error"]');
const errorText = (t: Table): string => (errorBlock(t)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const retryButton = (t: Table): HTMLElement | null => root(t).querySelector('[data-role="load-error-retry"]');

describe('ok-data-table — "could not load" is not "empty" (ERPlora/pm#530)', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.documentElement.lang = 'en';
    viewport(false);
  });

  it('a failed load does not claim the list is empty nor count zero records', async () => {
    const table = await mount({ error: REASON });
    expect(text(table)).not.toContain('No customers.');
    expect(text(table)).not.toContain('No results');
    expect(text(table)).not.toMatch(/\b0 records\b/);
    expect(root(table).querySelector('.empty')).toBeNull();
    expect(root(table).querySelector('.title-count')).toBeNull();
  });

  it('says the data could not be loaded, gives the reason and is announced', async () => {
    const table = await mount({ error: REASON });
    expect(errorBlock(table)).not.toBeNull();
    expect(errorBlock(table)?.getAttribute('role')).toBe('alert');
    expect(errorText(table)).toContain("Couldn't load the data");
    expect(errorText(table)).toContain(REASON);
    expect(retryButton(table)?.textContent?.trim()).toBe('Retry');
  });

  it('the Retry button emits `retry` once, bubbling out of the shadow root', async () => {
    const table = await mount({ error: REASON });
    const seen: Event[] = [];
    document.body.addEventListener('retry', (e) => seen.push(e));
    retryButton(table)?.click();
    expect(seen).toHaveLength(1);
    expect(seen[0].target).toBe(table);
    expect(seen[0].bubbles).toBe(true);
    expect(seen[0].composed).toBe(true);
  });

  it('rows left over from an earlier load are not shown as if they were current', async () => {
    const table = await mount({ rows: ROWS, total: 2, error: REASON });
    expect(root(table).querySelector('[role="row"].grow-data')).toBeNull();
    expect(text(table)).not.toContain('Ana');
    expect(text(table)).not.toMatch(/\b2 records\b/);
    expect(errorBlock(table)).not.toBeNull();
  });

  it('the card view shows the same error state', async () => {
    const table = await mount({ views: ['table', 'cards'], viewMode: 'cards', rows: ROWS, total: 2, error: REASON });
    expect(root(table).querySelector('.cards-grid')).toBeNull();
    expect(errorText(table)).toContain("Couldn't load the data");
    expect(retryButton(table)).not.toBeNull();
  });

  it('on a phone there is no «Load more» and no record count while the load failed', async () => {
    viewport(true);
    const table = await mount({ rows: ROWS, total: 40, error: REASON });
    expect(root(table).querySelector('.load-more')).toBeNull();
    expect(root(table).querySelector('.pager')).toBeNull();
    expect(retryButton(table)).not.toBeNull();
  });

  it('clearing the error brings the table back to its normal states', async () => {
    const table = await mount({ error: REASON });
    table.error = '';
    await settle(table);
    expect(errorBlock(table)).toBeNull();
    expect(text(table)).toContain('No customers.');
    table.rows = ROWS;
    table.total = 2;
    await settle(table);
    expect(text(table)).toContain('Ana');
  });

  it('a blank reason is not an error', async () => {
    const table = await mount({ error: '   ' });
    expect(errorBlock(table)).toBeNull();
    expect(text(table)).toContain('No customers.');
  });

  it('client mode shows the error state too', async () => {
    const table = await mount({ serverSide: false, rows: ROWS, error: REASON });
    expect(text(table)).not.toContain('Ana');
    expect(errorBlock(table)).not.toBeNull();
  });

  it('speaks Spanish on a Spanish document', async () => {
    document.documentElement.lang = 'es';
    const table = await mount({ error: 'El hub no responde.' });
    expect(errorText(table)).toContain('No se han podido cargar los datos');
    expect(errorText(table)).toContain('El hub no responde.');
    expect(retryButton(table)?.textContent?.trim()).toBe('Reintentar');
    expect(text(table)).not.toMatch(/\b0 registros\b/);
  });

  it('the consumer can word the title and the button through `.labels`', async () => {
    const table = await mount({ error: REASON, labels: { loadError: 'Customers could not be loaded', retry: 'Try again' } });
    expect(errorText(table)).toContain('Customers could not be loaded');
    expect(retryButton(table)?.textContent?.trim()).toBe('Try again');
  });

  it('on touch screens the Retry button reaches the 44px tap target, like «Load more»', () => {
    const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    const css = sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
    const touch = css.split('@media (pointer: coarse), (max-width: 834px) {').slice(1).map((b) => b.split(' } }')[0]);
    expect(touch.some((b) => /\.load-error ion-button \{[^}]*min-height: 44px;/.test(b))).toBe(true);
  });

  it('the error block reads as an error and keeps the place of the rows (fill mode, open panel)', async () => {
    const table = await mount({ error: REASON });
    table.setAttribute('fill', '');
    await settle(table);
    const block = errorBlock(table) as HTMLElement;
    // Fill mode: it stretches between toolbar and footer, like the empty state, instead of sticking to the top.
    expect(getComputedStyle(block).flexGrow).toBe('1');
    // Red icon and a heading in text colour, not the muted grey of «empty».
    expect(getComputedStyle(block.querySelector('.empty-ic') as HTMLElement).color).toBe('#c5000f');
    const title = block.querySelector('.load-error-title') as HTMLElement;
    expect(getComputedStyle(title).color).not.toBe(getComputedStyle(block).color);
    expect(getComputedStyle(title).fontWeight).toBe('600');
    // Desktop with the create panel open: the block takes the rows' cell next to the panel.
    (table as unknown as { open: (mode: string) => void }).open('create');
    await settle(table);
    expect(root(table).querySelector('.card')?.classList.contains('has-panel')).toBe(true);
    const placed = getComputedStyle(errorBlock(table) as HTMLElement);
    expect([placed.gridColumn, placed.gridRow]).toEqual(['1', '2']);
  });

  it('the Retry button carries a test hook derived from `testid`', async () => {
    const table = await mount({ testid: 'customers', error: REASON });
    expect(retryButton(table)?.getAttribute('data-testid')).toBe('customers-retry');
  });
});
