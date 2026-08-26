// @vitest-environment happy-dom

// Follow-up to #67: the pinned actions column only existed for the global `actions` prop. Hosts
// that render per-row actions in their own column (the Cloud's `okdt.js`, the Hub's ApiKeysPanel)
// got a plain grid cell that still scrolled off-screen. `pinned: 'end'` lets any column opt in.
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
  rowKey: string;
  updateComplete: Promise<unknown>;
};

const ROWS = [
  { id: '1', number: 'TCK-1000', subject: 'No imprime' },
  { id: '2', number: 'TCK-1001', subject: 'Cajón atascado' },
];

async function mount(columns: Array<Record<string, unknown>>): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = columns;
  table.rowKey = 'id';
  table.actions = [];
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const pinnedCells = (t: Table) => [...(t.shadowRoot?.querySelectorAll('.gcell.actions-col') ?? [])];

describe('ok-data-table: a column with `pinned: "end"` is fixed like the actions column', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('marks the header and every row cell of the pinned column as the fixed column', async () => {
    const table = await mount([
      { key: 'number', header: 'Nº' },
      { key: 'subject', header: 'Asunto' },
      { key: '_act', header: 'Acciones', align: 'right', pinned: 'end', render: () => 'x' },
    ]);
    const cells = pinnedCells(table);
    // 1 header + 2 rows
    expect(cells.length, 'header + one cell per row should be pinned').toBe(3);
    expect(cells[0].getAttribute('role')).toBe('columnheader');
    expect(cells[0].textContent).toContain('Acciones');
    expect(cells[1].getAttribute('role')).toBe('cell');
  });

  it('does not pin anything when no column asks for it and there are no actions', async () => {
    const table = await mount([
      { key: 'number', header: 'Nº' },
      { key: 'subject', header: 'Asunto' },
    ]);
    expect(pinnedCells(table).length).toBe(0);
  });
});
