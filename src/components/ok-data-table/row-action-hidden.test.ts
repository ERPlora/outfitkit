// @vitest-environment happy-dom

// ERPlora/hub#2014 — "a row action can only be DISABLED per row, never HIDDEN".
//
// `DataTableAction.disabled(row)` paints the button greyed out. That is right for an action the
// person could take if something changed first, but wrong for one that simply does not apply to
// the row: in the hub's "My apps" list every card carried a grey "Update" icon next to "Open"
// whenever there was no new version (almost always), and people read it as "Open is disabled"
// (hub#1984). App stores and Shopify's app list show "Update" only when there is an update.
//
// `hidden(row)` drops the action from THAT row everywhere it can be reached: the list view, the
// cards and the collapsed "..." menu. A row left with nothing to do gets no "..." button, and the
// pinned actions track is sized by the WIDEST row, not by whichever row happens to be first.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  views: boolean;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

// The "My apps" shape: row 1 has no new version, row 2 has one. Two rows on purpose — with one
// row a table that hid the action everywhere (or nowhere) could still pass.
const ROWS: Row[] = [
  { id: 'a', name: 'Modifiers', update: null },
  { id: 'b', name: 'Sales', update: '2.0.0' },
];
const ACTIONS: Row[] = [
  { id: 'open', label: 'Open', icon: 'open-outline' },
  { id: 'update', label: 'Update', icon: 'cloud-download-outline', hidden: (row: Row) => !row.update },
  { id: 'uninstall', label: 'Uninstall', icon: 'trash-outline' },
];

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.rowKeyField = 'id';
  table.testid = 'apps';
  table.actions = ACTIONS;
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  await table.updateComplete;
  return table;
}

const testIds = (root: ParentNode | null | undefined, selector: string): string[] =>
  [...(root?.querySelectorAll(selector) ?? [])].map((el) => el.getAttribute('data-testid') ?? '');

async function collapse(table: Table): Promise<void> {
  (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = true;
  await table.updateComplete;
}

async function openMenuOf(table: Table, rowIndex: number): Promise<HTMLElement[]> {
  const cell = table.shadowRoot?.querySelectorAll('.grow-data .gcell.actions-col')[rowIndex];
  const trigger = cell?.querySelector('ion-button') as HTMLElement;
  trigger.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  await table.updateComplete;
  return [...(table.shadowRoot?.querySelectorAll('.row-menu ion-item') ?? [])] as HTMLElement[];
}

describe('ok-data-table: a row action can be HIDDEN per row, not just disabled (hub#2014)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('list view: the hidden action is not rendered on that row, and stays on the others', async () => {
    const table = await mount();
    const [first, second] = [...(table.shadowRoot?.querySelectorAll('.grow-data .gcell.actions-col') ?? [])];

    expect(testIds(first, 'ion-button'), 'row without a new version must not carry "update"').toEqual([
      'apps-row-a-open',
      'apps-row-a-uninstall',
    ]);
    expect(testIds(second, 'ion-button'), 'row with a new version must keep "update" in its place').toEqual([
      'apps-row-b-open',
      'apps-row-b-update',
      'apps-row-b-uninstall',
    ]);
  });

  it('hidden is not disabled: no greyed-out button is left behind', async () => {
    const table = await mount();
    const disabled = table.shadowRoot?.querySelectorAll('.grow-data .gcell.actions-col ion-button[disabled]') ?? [];
    expect(disabled.length).toBe(0);
  });

  it('cards view: the hidden action is not rendered on that card either', async () => {
    const table = await mount({ views: true, defaultView: 'cards' });
    await table.updateComplete;
    const cards = [...(table.shadowRoot?.querySelectorAll('.ractions') ?? [])];

    expect(cards).toHaveLength(2);
    expect(testIds(cards[0], 'ion-button')).toEqual(['apps-row-a-open', 'apps-row-a-uninstall']);
    expect(testIds(cards[1], 'ion-button')).toEqual(['apps-row-b-open', 'apps-row-b-update', 'apps-row-b-uninstall']);
  });

  it('collapsed "..." menu: the hidden action is not offered for that row', async () => {
    const table = await mount();
    await collapse(table);

    const itemsA = await openMenuOf(table, 0);
    expect(itemsA.map((i) => i.textContent?.trim())).toEqual(['Open', 'Uninstall']);

    // Picking nothing closes the popover (Ionic fires didDismiss) before the next row is opened.
    table.shadowRoot?.querySelector('.row-menu')?.dispatchEvent(new CustomEvent('didDismiss'));
    await table.updateComplete;
    const itemsB = await openMenuOf(table, 1);
    expect(itemsB.map((i) => i.textContent?.trim())).toEqual(['Open', 'Update', 'Uninstall']);
  });

  it('collapsed: a row whose actions are ALL hidden gets no "..." button (it would open an empty menu)', async () => {
    const table = await mount({
      actions: [{ id: 'update', label: 'Update', icon: 'cloud-download-outline', hidden: (row: Row) => !row.update }],
    });
    await collapse(table);

    expect(table.shadowRoot?.querySelector('[data-testid="apps-row-a-menu"]'), 'row a has nothing to do').toBeNull();
    expect(table.shadowRoot?.querySelector('[data-testid="apps-row-b-menu"]'), 'row b still has "update"').not.toBeNull();
  });

  it('an action without `hidden` is rendered on every row (backwards compatible)', async () => {
    const table = await mount({ actions: [{ id: 'open', label: 'Open', icon: 'open-outline' }] });
    expect(testIds(table.shadowRoot, '.grow-data .gcell.actions-col ion-button')).toEqual(['apps-row-a-open', 'apps-row-b-open']);
  });

  describe('the pinned actions track fits the WIDEST row', () => {
    const BUTTON_PX = 44;
    let restore: () => void = () => {};

    afterEach(() => restore());

    it('is sized by the row with the most visible buttons, even when it is not the first row', async () => {
      // happy-dom has no layout: every `scrollWidth` is 0. Feed each `.actions` box the width its
      // buttons would take, so a row with fewer buttons measures narrower.
      const proto = window.Element.prototype as unknown as Record<string, unknown>;
      const original = Object.getOwnPropertyDescriptor(proto, 'scrollWidth');
      Object.defineProperty(proto, 'scrollWidth', {
        configurable: true,
        get(this: Element) {
          return this.classList?.contains('actions') ? this.querySelectorAll('ion-button').length * BUTTON_PX : 0;
        },
      });
      restore = () => {
        if (original) Object.defineProperty(proto, 'scrollWidth', original);
        else delete proto.scrollWidth;
      };

      const table = await mount();
      await table.updateComplete;

      expect(
        (table as unknown as { actionsTrackPx: number }).actionsTrackPx,
        'the track was sized by row 1 (2 buttons) and would clip row 2 (3 buttons)',
      ).toBe(3 * BUTTON_PX);
    });
  });
});
