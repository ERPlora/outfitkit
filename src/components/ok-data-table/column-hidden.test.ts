// @vitest-environment happy-dom

// `DataTableColumn.hidden` was declared («hides the column by default; the user brings it back in
// the column chooser») but nothing read it, so a host that wanted fewer columns on screen had to
// drop them from `columns` — and a dropped column also drops its filter, its sort and its control
// in the filter panel. ERPlora/hub#2245: on a phone, «Add apps» filtered by Category on the cards,
// switched to the list view (which drops Category to fit), and all 23 apps came back. A hidden
// column is only not PAINTED: it still filters, sorts and keeps its control.
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

type Column = Record<string, unknown>;
type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Column[];
  rowKey: string;
  updateComplete: Promise<unknown>;
};
type Internals = {
  clientFilters: Record<string, { values?: Set<string> }>;
  clientSort: string;
  clientSortDir: 'asc' | 'desc';
  t: { filters: string };
  setVisibleColumns(keys: string[]): void;
};

const ROWS = [
  { id: '1', name: 'Caja', cat: 'Ventas' },
  { id: '2', name: 'Agenda', cat: 'Clientes' },
  { id: '3', name: 'Facturas', cat: 'Ventas' },
];

const columns = (catHidden: boolean): Column[] => [
  { key: 'name', header: 'App' },
  { key: 'cat', header: 'Categoría', filterable: true, filterType: 'select', hidden: catHidden },
];

async function mount(cols: Column[]): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = cols;
  table.rowKey = 'id';
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const headers = (t: Table) =>
  [...(t.shadowRoot?.querySelectorAll('[role="columnheader"]') ?? [])].map((h) => h.textContent?.trim() ?? '');
const bodyRows = (t: Table) => t.shadowRoot?.querySelectorAll('[role="row"]:not(.ghead)').length ?? 0;
const cellsWith = (t: Table, text: string) =>
  [...(t.shadowRoot?.querySelectorAll('[role="cell"]') ?? [])].filter((c) => c.textContent?.includes(text)).length;

describe('ok-data-table: a column with `hidden: true` is not painted but keeps working', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('is not painted in the list view', async () => {
    const table = await mount(columns(true));
    expect(headers(table).some((h) => h.includes('Categoría'))).toBe(false);
    expect(cellsWith(table, 'Ventas')).toBe(0);
    expect(headers(table).some((h) => h.includes('App'))).toBe(true);
  });

  it('is not painted in the card view either', async () => {
    const table = document.createElement('ok-data-table') as unknown as Table & { views: boolean; defaultView: string };
    table.rows = ROWS;
    table.columns = columns(true);
    table.rowKey = 'id';
    table.views = true;
    table.defaultView = 'cards';
    document.body.appendChild(table);
    await table.updateComplete;
    const labels = [...(table.shadowRoot?.querySelectorAll('ion-card.rcard .rk') ?? [])].map((k) => k.textContent?.trim());
    expect(labels, 'not testing the card view').toContain('App');
    expect(labels).not.toContain('Categoría');
  });

  it('still filters the rows by what is picked for it', async () => {
    const table = await mount(columns(true));
    const before = bodyRows(table);
    (table as unknown as Internals).clientFilters = { cat: { values: new Set(['Ventas']) } };
    await table.updateComplete;
    expect(bodyRows(table)).toBe(before - 1);
    expect(cellsWith(table, 'Agenda')).toBe(0);
  });

  it('keeps its control in the filter panel', async () => {
    const table = await mount(columns(true));
    const label = (table as unknown as Internals).t.filters;
    expect(table.shadowRoot?.querySelector(`ion-button[aria-label="${label}"]`)).not.toBeNull();
  });

  it('still sorts the rows when it is the sort column', async () => {
    const table = await mount(columns(true));
    const t = table as unknown as Internals;
    t.clientSort = 'cat';
    t.clientSortDir = 'asc';
    await table.updateComplete;
    // Clientes < Ventas: Agenda (Clientes) comes first, though it is the second row given.
    const names = [...(table.shadowRoot?.querySelectorAll('[role="cell"]') ?? [])]
      .map((c) => c.textContent?.trim() ?? '')
      .filter((x) => ['Caja', 'Agenda', 'Facturas'].includes(x));
    expect(names[0]).toBe('Agenda');
  });

  it('shows again when the host stops hiding it', async () => {
    const table = await mount(columns(true));
    table.columns = columns(false);
    await table.updateComplete;
    expect(headers(table).some((h) => h.includes('Categoría'))).toBe(true);
  });

  it('hides when the host starts hiding it', async () => {
    const table = await mount(columns(false));
    table.columns = columns(true);
    await table.updateComplete;
    expect(headers(table).some((h) => h.includes('Categoría'))).toBe(false);
  });

  it('comes back when the person picks it in the column chooser', async () => {
    const table = await mount(columns(true));
    (table as unknown as Internals).setVisibleColumns(['name', 'cat']);
    await table.updateComplete;
    expect(headers(table).some((h) => h.includes('Categoría'))).toBe(true);
  });
});
