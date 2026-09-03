// @vitest-environment happy-dom

// outfitkit#110 — "a row action's label cannot depend on the row".
//
// `DataTableAction` already decides `disabled` and `loading` PER ROW, but not what the button
// SAYS: `label` was a plain `string`, evaluated once and applied to every row alike. So a label
// carrying a value from the row —an amount, a counter, a name— could not be written at all.
//
// The market puts the number at the point of choice: Square and Lightspeed label the refund action
// with what is left to refund ("Refund remaining (70.00 €)") instead of opening a dialog that
// explains the state. Business Central does the same with its per-line actions.
//
// This also matters for ACCESSIBILITY, and that is the part that would bite hardest: the
// cross-module guard (ADR-0133) makes `icon` mandatory on row actions, so every row action in the
// fleet is icon-only and `label` IS its accessible name (`aria-label` + `title`). A function label
// that did not resolve there would leave the table without a per-row accessible name — worse than
// the gap it closes.
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
  menuActions: Array<Record<string, unknown>>;
  rowKeyField: string;
  views: boolean;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

// Two rows on purpose: with a single row a static label would pass this suite unchanged.
const ROWS = [
  { id: '1', number: 'V-1000', total: 100, refunded_total: 30 },
  { id: '2', number: 'V-1001', total: 50, refunded_total: 0 },
];

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [{ key: 'number', header: 'Nº' }];
  table.rowKeyField = 'id';
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

/** Action buttons of every row of the LIST view, in row order. */
function rowButtons(table: Table): HTMLElement[][] {
  return [...(table.shadowRoot?.querySelectorAll('.grow-data') ?? [])].map(
    (row) => [...row.querySelectorAll('.gcell.actions-col ion-button')] as HTMLElement[],
  );
}

const remaining = (row: Record<string, unknown>): number =>
  Number(row.total ?? 0) - Number(row.refunded_total ?? 0);

describe('ok-data-table: the label of a row action can depend on the row (#110)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('renders a DIFFERENT text on each row when the label is a function', async () => {
    const table = await mount({
      actions: [{ id: 'refund', label: (row: Record<string, unknown>) => `Devolver el resto (${remaining(row)} €)` }],
    });

    const [first, second] = rowButtons(table).map((buttons) => buttons[0]);
    expect(first?.textContent?.trim(), 'row 1 does not show its own amount').toBe('Devolver el resto (70 €)');
    expect(second?.textContent?.trim(), 'row 2 does not show its own amount').toBe('Devolver el resto (50 €)');
    expect(
      first?.textContent?.trim(),
      'both rows render the same text: the label is still evaluated once for the whole table',
    ).not.toBe(second?.textContent?.trim());
  });

  it('resolves the function label as the accessible name per row (icon-only action)', async () => {
    // The real shape in the fleet: `icon` is mandatory (ADR-0133), so the button has NO text and
    // `label` is the whole accessible name.
    const table = await mount({
      actions: [
        {
          id: 'refund',
          icon: 'arrow-undo-outline',
          label: (row: Record<string, unknown>) => `Devolver el resto (${remaining(row)} €)`,
        },
      ],
    });

    const [first, second] = rowButtons(table).map((buttons) => buttons[0]);
    expect(first?.getAttribute('aria-label'), 'row 1 has no per-row accessible name').toBe('Devolver el resto (70 €)');
    expect(second?.getAttribute('aria-label'), 'row 2 has no per-row accessible name').toBe('Devolver el resto (50 €)');
    expect(first?.getAttribute('title'), 'row 1 tooltip is not the row label').toBe('Devolver el resto (70 €)');
    expect(second?.getAttribute('title'), 'row 2 tooltip is not the row label').toBe('Devolver el resto (50 €)');
  });

  it('keeps the plain string form working, on every row (backwards compatible)', async () => {
    const table = await mount({ actions: [{ id: 'open', label: 'Abrir' }] });

    for (const [index, buttons] of rowButtons(table).entries()) {
      expect(buttons[0]?.textContent?.trim(), `row ${index + 1} lost its static text`).toBe('Abrir');
      expect(buttons[0]?.getAttribute('aria-label'), `row ${index + 1} lost its static aria-label`).toBe('Abrir');
      expect(buttons[0]?.getAttribute('title'), `row ${index + 1} lost its static title`).toBe('Abrir');
    }
  });

  it('resolves the function label in the CARDS view too', async () => {
    const table = await mount({
      views: true,
      defaultView: 'cards',
      actions: [{ id: 'refund', label: (row: Record<string, unknown>) => `Devolver el resto (${remaining(row)} €)` }],
    });

    const buttons = [...(table.shadowRoot?.querySelectorAll('.rcard .ractions ion-button') ?? [])] as HTMLElement[];
    expect(buttons.map((b) => b.textContent?.trim())).toEqual([
      'Devolver el resto (70 €)',
      'Devolver el resto (50 €)',
    ]);
  });

  it('leaves the toolbar overflow menu untouched: it has no row, so its label stays a string', async () => {
    const table = await mount({ menuActions: [{ id: 'export', label: 'Exportar CSV', icon: 'download-outline' }] });

    const labels = [...(table.shadowRoot?.querySelectorAll('ion-popover ion-item ion-label') ?? [])];
    expect(labels.map((l) => l.textContent?.trim()), 'the overflow menu lost its label').toEqual(['Exportar CSV']);
  });
});
