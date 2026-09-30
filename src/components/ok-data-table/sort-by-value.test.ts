// @vitest-environment happy-dom

// ERPlora/outfitkit#256: a client-side table sorted a column by the text its `format` paints, not by
// the value behind it. A date shown as «dd/mm/yyyy» put 15/01/2027 before 31/12/2026, an amount
// shown as «100,00 €» came before «9,50 €», and «Sin fin» / «Tras 4 citas» were mixed in with the
// dates by alphabet (appointments, «Recurring»). Like AG Grid, MUI DataGrid and TanStack Table, the
// table now sorts by the value (`sortValue(row)`, else `row[key]`) and only paints the text.
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

type Row = Record<string, unknown>;
type Column = Record<string, unknown>;
type Table = HTMLElement & {
  rows: Row[];
  columns: Column[];
  rowKey: string;
  updateComplete: Promise<unknown>;
};
type Internals = {
  clientFilters: Record<string, { values?: Set<string>; from?: string; to?: string }>;
  distinctValues(col: Column): string[];
};

const dmy = (iso: unknown): string => {
  if (typeof iso !== 'string' || !iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
};

// The «Recurring» list of appointments: the end is a date, «no end» or «after N visits».
const SERIES: Row[] = [
  { id: 'a', name: 'Ana', start_date: '2027-01-15', end_date: '2027-01-15', max: null },
  { id: 'b', name: 'Bea', start_date: '2026-12-31', end_date: null, max: null },
  { id: 'c', name: 'Carla', start_date: '2027-03-31', end_date: '2026-12-31', max: null },
  { id: 'd', name: 'Dora', start_date: '2026-02-01', end_date: null, max: 4 },
  { id: 'e', name: 'Eva', start_date: '2026-11-02', end_date: '2027-03-31', max: 6 },
];

const endsLabel = (r: Row): string => {
  if (r.end_date && r.max) return `${dmy(r.end_date)} · Tras ${r.max} citas`;
  if (r.end_date) return dmy(r.end_date);
  if (r.max) return `Tras ${r.max} citas`;
  return 'Sin fin';
};

async function mount(rows: Row[], columns: Column[]): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = rows;
  table.columns = columns;
  table.rowKey = 'id';
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const header = (t: Table, text: string): HTMLElement => {
  const h = [...(t.shadowRoot?.querySelectorAll<HTMLElement>('[role="columnheader"]') ?? [])].find((x) =>
    x.textContent?.includes(text),
  );
  if (!h) throw new Error(`no header «${text}»`);
  return h;
};

async function sortBy(t: Table, text: string, clicks = 1): Promise<void> {
  for (let i = 0; i < clicks; i++) {
    header(t, text).click();
    await t.updateComplete;
  }
}

/** Texts of one column, top to bottom, as painted in the list view. */
const columnTexts = (t: Table, index: number): string[] =>
  [...(t.shadowRoot?.querySelectorAll('[role="row"]:not(.ghead)') ?? [])].map(
    (r) => r.querySelectorAll('[role="cell"]')[index]?.textContent?.trim() ?? '',
  );

const names = (t: Table): string[] => columnTexts(t, 0);

describe('ok-data-table: a client-side sort follows the value, not the painted text (#256)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  const seriesColumns = (): Column[] => [
    { key: 'name', header: 'Client' },
    { key: 'start_date', header: 'Starts', format: (r: Row) => dmy(r.start_date) },
    { key: 'end_date', header: 'Ends', format: endsLabel },
  ];

  it('sorts a dd/mm/yyyy date column by the date, oldest first', async () => {
    const table = await mount(SERIES, seriesColumns());
    await sortBy(table, 'Starts');
    expect(columnTexts(table, 1)).toEqual(['01/02/2026', '02/11/2026', '31/12/2026', '15/01/2027', '31/03/2027']);
  });

  it('sorts it newest first on the second tap', async () => {
    const table = await mount(SERIES, seriesColumns());
    await sortBy(table, 'Starts', 2);
    expect(columnTexts(table, 1)).toEqual(['31/03/2027', '15/01/2027', '31/12/2026', '02/11/2026', '01/02/2026']);
  });

  it('keeps the series with no end date together at the bottom, whichever the direction', async () => {
    const table = await mount(SERIES, seriesColumns());
    await sortBy(table, 'Ends');
    expect(names(table)).toEqual(['Carla', 'Ana', 'Eva', 'Bea', 'Dora']);
    await sortBy(table, 'Ends');
    expect(names(table).slice(0, 3)).toEqual(['Eva', 'Ana', 'Carla']);
    expect(names(table).slice(3).sort()).toEqual(['Bea', 'Dora']);
  });

  it('sorts a money column by the amount, not by «100,00 €» < «9,50 €»', async () => {
    const rows: Row[] = [
      { id: '1', name: 'Big', total: 100 },
      { id: '2', name: 'Small', total: 9.5 },
      { id: '3', name: 'Mid', total: 20 },
    ];
    const eur = (r: Row) => `${(r.total as number).toFixed(2).replace('.', ',')} €`;
    const table = await mount(rows, [
      { key: 'name', header: 'Name' },
      { key: 'total', header: 'Total', format: eur },
    ]);
    await sortBy(table, 'Total');
    expect(names(table)).toEqual(['Small', 'Mid', 'Big']);
  });

  it('sorts by `sortValue` when the column declares one, over the raw value', async () => {
    const rows: Row[] = [
      { id: '1', name: 'Low', status: 'b_low' },
      { id: '2', name: 'High', status: 'a_high' },
      { id: '3', name: 'Mid', status: 'c_mid' },
    ];
    const rank: Record<string, number> = { a_high: 3, c_mid: 2, b_low: 1 };
    const table = await mount(rows, [
      { key: 'name', header: 'Name' },
      { key: 'status', header: 'Priority', format: (r: Row) => String(r.status), sortValue: (r: Row) => rank[r.status as string] },
    ]);
    await sortBy(table, 'Priority');
    expect(names(table)).toEqual(['Low', 'Mid', 'High']);
  });

  it('sorts a column whose key is not a field of the row by `sortValue`', async () => {
    const table = await mount(SERIES, [
      { key: 'name', header: 'Client' },
      { key: 'ends', header: 'Ends', format: endsLabel, sortValue: (r: Row) => r.end_date },
    ]);
    await sortBy(table, 'Ends');
    expect(names(table)).toEqual(['Carla', 'Ana', 'Eva', 'Bea', 'Dora']);
  });

  it('still sorts a column whose key is not a field of the row by its text when nothing else is given', async () => {
    const rows: Row[] = [
      { id: '1', first: 'Zoe', last: 'Alba' },
      { id: '2', first: 'Ana', last: 'Zamora' },
    ];
    const table = await mount(rows, [
      { key: 'full', header: 'Full name', format: (r: Row) => `${r.first} ${r.last}` },
    ]);
    await sortBy(table, 'Full name');
    expect(names(table)).toEqual(['Ana Zamora', 'Zoe Alba']);
  });

  it('sorts by the text when the field holds an object the text is drawn from', async () => {
    const rows: Row[] = [
      { id: '1', customer: { name: 'Zoe' } },
      { id: '2', customer: { name: 'Ana' } },
      { id: '3', customer: { name: 'Marta' } },
    ];
    const table = await mount(rows, [
      { key: 'customer', header: 'Customer', format: (r: Row) => (r.customer as { name: string }).name },
    ]);
    await sortBy(table, 'Customer');
    expect(names(table)).toEqual(['Ana', 'Marta', 'Zoe']);
  });

  it('filters a dd/mm/yyyy date column by a date range on the date, not on the text', async () => {
    const table = await mount(SERIES, [
      { key: 'name', header: 'Client' },
      { key: 'start_date', header: 'Starts', format: (r: Row) => dmy(r.start_date), filterable: true, filterType: 'daterange' },
    ]);
    (table as unknown as Internals).clientFilters = { start_date: { from: '2026-12-01', to: '2027-01-31' } };
    await table.updateComplete;
    expect(names(table).sort()).toEqual(['Ana', 'Bea']);
  });

  it('sorts a field that holds a Date object by the date', async () => {
    const rows: Row[] = [
      { id: '1', name: 'Later', at: new Date('2027-01-15T00:00:00Z') },
      { id: '2', name: 'Sooner', at: new Date('2026-12-31T00:00:00Z') },
    ];
    const table = await mount(rows, [
      { key: 'name', header: 'Name' },
      { key: 'at', header: 'When', format: (r: Row) => dmy((r.at as Date).toISOString()) },
    ]);
    await sortBy(table, 'When');
    expect(names(table)).toEqual(['Sooner', 'Later']);
  });

  it('keeps offering the painted text as the choices of a multi-select filter', async () => {
    const table = await mount(SERIES, seriesColumns());
    const col = seriesColumns()[1];
    expect((table as unknown as Internals).distinctValues(col)).toContain('31/12/2026');
  });

  it('keeps matching a multi-select pick against the painted text', async () => {
    const table = await mount(SERIES, seriesColumns());
    (table as unknown as Internals).clientFilters = { start_date: { values: new Set(['31/12/2026']) } };
    await table.updateComplete;
    expect(names(table)).toEqual(['Bea']);
  });
  // Review of outfitkit#259: `format` does not only paint a value, it can print OTHER words than the
  // field holds. Those columns must keep the order a person reads, as they did before #256.
  it('keeps sorting a text column by what it prints when the field stores other words (cash movements)', async () => {
    // cash_register «Concept»: the row stores «Sale <uuid>», the cell prints the document number.
    const printed: Record<string, string> = { 'Sale 9f': 'Invoice F-0001', 'Sale 1a': 'Invoice F-0002', 'Sale 5c': 'Invoice F-0003' };
    const rows: Row[] = [
      { id: '1', description: 'Sale 1a' },
      { id: '2', description: 'Sale 9f' },
      { id: '3', description: 'Sale 5c' },
    ];
    const table = await mount(rows, [
      { key: 'description', header: 'Concept', format: (r: Row) => printed[r.description as string] },
    ]);
    await sortBy(table, 'Concept');
    expect(names(table)).toEqual(['Invoice F-0001', 'Invoice F-0002', 'Invoice F-0003']);
  });

  it('keeps sorting a status column by its label, not by the stored code', async () => {
    const label: Record<string, string> = { pending: 'Abierta', closed: 'Cerrada' };
    const rows: Row[] = [
      { id: '1', status: 'pending' },
      { id: '2', status: 'closed' },
    ];
    const table = await mount(rows, [
      { key: 'status', header: 'Status', format: (r: Row) => label[r.status as string] },
    ]);
    await sortBy(table, 'Status');
    expect(names(table)).toEqual(['Abierta', 'Cerrada']);
  });

  it('sorts an amount the hub hands over as a NUMERIC string by the number', async () => {
    // The hub runtime decodes NUMERIC to a string («100.00») to keep its precision.
    const rows: Row[] = [
      { id: '1', name: 'Big', total: '100.00' },
      { id: '2', name: 'Small', total: '9.50' },
      { id: '3', name: 'Mid', total: '20.00' },
      { id: '4', name: 'Refund', total: '-3.25' },
    ];
    const eur = (r: Row) => `${String(r.total).replace('.', ',')} €`;
    const table = await mount(rows, [
      { key: 'name', header: 'Name' },
      { key: 'total', header: 'Total', format: eur },
    ]);
    await sortBy(table, 'Total');
    expect(names(table)).toEqual(['Refund', 'Small', 'Mid', 'Big']);
  });

  it('leaves the order to the server in server mode: it asks, and keeps the rows as they came', async () => {
    const rows: Row[] = [
      { id: '1', name: 'Big', total: '100.00', note: 'b' },
      { id: '2', name: 'Small', total: '9.50', note: 'a' },
    ];
    const table = document.createElement('ok-data-table') as unknown as Table & { serverSide: boolean; total: number };
    table.serverSide = true;
    table.rows = rows;
    table.total = rows.length;
    table.columns = [
      { key: 'name', header: 'Name' },
      { key: 'total', header: 'Total', sortable: true, format: (r: Row) => `${String(r.total)} €` },
      { key: 'note', header: 'Note' },
    ];
    table.rowKey = 'id';
    document.body.appendChild(table);
    await table.updateComplete;
    const asked: unknown[] = [];
    table.addEventListener('sortChange', (e) => asked.push((e as CustomEvent).detail));
    await sortBy(table, 'Total');
    expect(asked).toEqual([{ sort: 'total', dir: 'asc' }]);
    expect(names(table)).toEqual(['Big', 'Small']);
    // A column the module did not mark sortable does not sort, not even in memory.
    await sortBy(table, 'Note');
    expect(asked).toHaveLength(1);
    expect(names(table)).toEqual(['Big', 'Small']);
  });
});
