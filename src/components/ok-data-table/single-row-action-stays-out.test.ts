// @vitest-environment happy-dom

// ERPlora/outfitkit#213 — "on a phone, a table with a single button per row hides it in a '...' menu".
//
// When the row buttons do not fit (#122) the list view folds them into a per-row "..." menu. With
// ONE action that is all cost and no gain: the "..." button is as wide as the action's own icon
// button (measured in Chromium at 390px: both sit in the same 60px pinned track), so nothing is
// freed, and "Install" goes from one tap to two. Shopify Polaris, MUI DataGrid, Material and the
// Apple HIG agree: an overflow menu GROUPS several actions, it never replaces a single one.
//
// The rule is per ROW, because `hidden(row)` (hub#2014) can leave one row with a single action
// while its neighbour keeps three.
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
type Table = HTMLElement & {
  rows: Row[];
  columns: Row[];
  actions: Row[];
  rowKeyField: string;
  testid: string;
  updateComplete: Promise<unknown>;
};

const ROWS: Row[] = [
  { id: 'a', name: 'Modifiers', update: null },
  { id: 'b', name: 'Sales', update: '2.0.0' },
];

async function mount(actions: Row[], rows: Row[] = ROWS): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = rows;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.rowKeyField = 'id';
  table.testid = 'apps';
  table.actions = actions;
  document.body.appendChild(table);
  await table.updateComplete;
  await table.updateComplete;
  return table;
}

// The state under test is set directly: happy-dom lays nothing out, and WHEN the table folds is
// what `decideRowActionsFit` (narrow-tablet-row-actions.test.ts) proves.
async function collapse(table: Table): Promise<void> {
  (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = true;
  await table.updateComplete;
}

const rowButtons = (table: Table, rowIndex: number): HTMLElement[] => {
  const cell = table.shadowRoot?.querySelectorAll('.grow-data .gcell.actions-col')[rowIndex];
  return [...(cell?.querySelectorAll('ion-button') ?? [])] as HTMLElement[];
};

const byTestId = (table: Table, id: string): Element[] => [
  ...(table.shadowRoot?.querySelectorAll(`[data-testid="${id}"]`) ?? []),
];

describe('ok-data-table: a single row action is never folded into the "..." menu (#213)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('with one action per row, the folded list keeps the action\'s own button', async () => {
    const table = await mount([{ id: 'install', label: 'Install', icon: 'download-outline' }]);
    await collapse(table);

    for (const [index, key] of ['a', 'b'].entries()) {
      const buttons = rowButtons(table, index);
      expect(buttons, `row ${key}: one button, the action itself`).toHaveLength(1);
      expect(buttons[0].getAttribute('data-testid')).toBe(`apps-row-${key}-install`);
      expect(buttons[0].getAttribute('aria-label')).toBe('Install');
      expect(buttons[0].hasAttribute('aria-haspopup'), 'it opens nothing').toBe(false);
      expect(byTestId(table, `apps-row-${key}-menu`), `row ${key}: no "..." button`).toHaveLength(0);
    }
  });

  it('one tap on the single action emits rowAction with its row', async () => {
    const table = await mount([{ id: 'install', label: 'Install', icon: 'download-outline' }]);
    await collapse(table);
    const seen: unknown[] = [];
    table.addEventListener('rowAction', (e) => seen.push((e as CustomEvent).detail));

    rowButtons(table, 1)[0].click();

    expect(seen).toEqual([{ actionId: 'install', row: ROWS[1] }]);
    expect(table.shadowRoot?.querySelector('ion-popover.row-menu'), 'no menu was opened').toBeNull();
  });

  it('a single action keeps its per-row state: label from the row, disabled and loading', async () => {
    const table = await mount([
      {
        id: 'install',
        label: (row: Row) => `Install ${row.name}`,
        icon: 'download-outline',
        disabled: (row: Row) => row.id === 'a',
        loading: (row: Row) => row.id === 'b',
      },
    ]);
    await collapse(table);

    const [a] = rowButtons(table, 0);
    expect(a.getAttribute('aria-label')).toBe('Install Modifiers');
    expect(a.hasAttribute('disabled')).toBe(true);
    const [b] = rowButtons(table, 1);
    expect(b.querySelector('ion-spinner'), 'loading shows the spinner').not.toBeNull();
    expect(b.hasAttribute('disabled')).toBe(true);
  });

  it('decides per row: a row left with one visible action shows it, a row with two folds them', async () => {
    const table = await mount([
      { id: 'update', label: 'Update', icon: 'cloud-download-outline', hidden: (row: Row) => !row.update },
      { id: 'uninstall', label: 'Uninstall', icon: 'trash-outline' },
    ]);
    await collapse(table);

    const a = rowButtons(table, 0);
    expect(a.map((btn) => btn.getAttribute('data-testid')), 'row a: only "Uninstall" applies').toEqual([
      'apps-row-a-uninstall',
    ]);
    const b = rowButtons(table, 1);
    expect(b.map((btn) => btn.getAttribute('data-testid')), 'row b: two actions fold').toEqual(['apps-row-b-menu']);
  });

  it('the hook stays unique: a menu opened on a row that later drops to one action does not duplicate it', async () => {
    const actions = [
      { id: 'update', label: 'Update', icon: 'cloud-download-outline', hidden: (row: Row) => !row.update },
      { id: 'uninstall', label: 'Uninstall', icon: 'trash-outline' },
    ];
    const table = await mount(actions);
    await collapse(table);
    rowButtons(table, 1)[0].dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    await table.updateComplete;
    expect(byTestId(table, 'apps-row-b-uninstall'), 'folded: the hook lives on the menu item').toHaveLength(1);

    // The popover survives its dismissal (#143), and the update gets installed: row b now has one action.
    table.shadowRoot?.querySelector('.row-menu')?.dispatchEvent(new CustomEvent('didDismiss'));
    table.rows = [ROWS[0], { ...ROWS[1], update: null }];
    await table.updateComplete;

    const hooks = byTestId(table, 'apps-row-b-uninstall');
    expect(hooks, 'exactly one element carries the hook').toHaveLength(1);
    expect(hooks[0].tagName.toLowerCase(), 'and it is the button on the row').toBe('ion-button');
  });
});
