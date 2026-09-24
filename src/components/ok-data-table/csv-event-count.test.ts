// @vitest-environment happy-dom
//
// outfitkit#139 — the CSV events used the same key `rows` for two different things: a NUMBER in
// `csvExport`/`export` and the parsed LIST in `csvImport`/`import`. A consumer that read `rows` as a
// count for both (the Hub's action toast) showed a customer «CSV imported · [object Object],… rows»
// after importing a 14-product catalogue (inventory#90).
//
// The contract fixed here: all four events carry `count`, a field that can only be the number of
// rows. `rows` keeps its current meaning in each event so no existing consumer breaks.
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
  csv: boolean;
  testid: string;
  updateComplete: Promise<unknown>;
};

/** happy-dom has no matchMedia: keep the table on the desktop branch. */
function desktop(): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: false, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(rows: Array<Record<string, unknown>>): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = rows;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.csv = true;
  table.testid = 'products';
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

function capture(table: Table, names: string[]): Record<string, Record<string, unknown>> {
  const seen: Record<string, Record<string, unknown>> = {};
  for (const n of names) {
    table.addEventListener(n, (e) => { seen[n] = (e as CustomEvent).detail; });
  }
  return seen;
}

/** What the person does: pick a CSV file in the table's hidden file input. */
async function importFile(table: Table, text: string): Promise<void> {
  const input = table.shadowRoot?.querySelector('[data-testid="products-csv-import"]') as HTMLInputElement;
  expect(input, 'the table renders no CSV import input').toBeTruthy();
  const file = new File([text], 'catalogue.csv', { type: 'text/csv' });
  Object.defineProperty(input, 'files', { value: [file], configurable: true });
  input.dispatchEvent(new Event('change'));
  // onImportFile awaits file.arrayBuffer(): let it settle.
  for (let i = 0; i < 5; i++) await new Promise((r) => setTimeout(r, 0));
}

describe('ok-data-table: CSV events carry an unambiguous row count (#139)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
    desktop();
  });

  it('import: `count` is the number of imported rows, `rows` stays the parsed list', async () => {
    const table = await mount([]);
    const seen = capture(table, ['csvImport', 'import']);

    await importFile(table, 'name,price\r\nCafé,1.5\r\nTé,1.2\r\nZumo,2\r\n');

    for (const name of ['csvImport', 'import']) {
      const detail = seen[name];
      expect(detail, `${name} was not emitted`).toBeTruthy();
      expect(detail.count, `${name}: no numeric count, a toast would print the list`).toBe(3);
      expect(Array.isArray(detail.rows), `${name}: \`rows\` must keep being the parsed list`).toBe(true);
      expect((detail.rows as unknown[]).length).toBe(3);
      expect(detail.headers).toEqual(['name', 'price']);
    }
  });

  it('import: a CSV with only headers reports zero rows', async () => {
    const table = await mount([]);
    const seen = capture(table, ['csvImport']);

    await importFile(table, 'name,price\r\n');

    expect(seen.csvImport?.count).toBe(0);
  });

  it('export: `count` is the number of exported rows, `rows` stays the same number', async () => {
    const createObjectURL = vi.fn(() => 'blob:test');
    const revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const table = await mount([{ name: 'Café' }, { name: 'Té' }]);
    const seen = capture(table, ['csvExport', 'export']);

    const button = table.shadowRoot?.querySelector('[data-testid="products-csv-export"]') as HTMLElement;
    expect(button, 'the table renders no CSV export button').toBeTruthy();
    button.click();

    for (const name of ['csvExport', 'export']) {
      expect(seen[name], `${name} was not emitted`).toBeTruthy();
      expect(seen[name].count).toBe(2);
      expect(seen[name].rows).toBe(2);
    }
  });
});
