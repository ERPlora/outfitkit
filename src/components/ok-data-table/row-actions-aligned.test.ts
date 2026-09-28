// @vitest-environment happy-dom

// ERPlora/outfitkit#240 (from ERPlora/invoice#109) — "the row buttons shift around when one row
// does not offer an action".
//
// `hidden(row)` (hub#2014) dropped the action from the row's flex box, and that box is right-aligned
// (`justify-content: flex-end`): the buttons that stayed slid over to fill the gap. In the invoices
// list the "view" of a paid invoice (no "Mark paid") landed ~36px left of the "view" of an issued
// one, and a voided invoice (only "view") put it somewhere else again — the same button was never
// in the same place going down the list. Shopify, Stripe or Odoo keep each row action in its
// column and leave the gap of the one that does not apply empty.
//
// The list view now paints an invisible stand-in, the same button, for each hidden action: it
// takes the button's width, so every action lands in the same column on every row, and it is out
// of the tab order, the accessibility tree and the click path. happy-dom has no layout, so this
// asserts the structure that makes the columns line up (same slots, same order, same content per
// slot); the pixels were measured in a real browser at 390/820/1440 (see the PR).
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
  views: boolean;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

// The invoice list of invoice#109: issued (every action), paid (no "Mark paid"), voided (only
// "view"; "Refund" is text-only on purpose, so a slot must also keep the width of a TEXT button).
const ROWS: Row[] = [
  { id: 'issued', status: 'issued' },
  { id: 'paid', status: 'paid' },
  { id: 'voided', status: 'voided' },
];
const ACTIONS: Row[] = [
  { id: 'view', label: 'View', icon: 'eye-outline' },
  { id: 'mark-paid', label: 'Mark paid', icon: 'checkmark-outline', hidden: (r: Row) => r.status !== 'issued' },
  { id: 'refund', label: 'Refund', hidden: (r: Row) => r.status === 'voided' },
];

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [{ key: 'status', header: 'Status' }];
  table.rowKeyField = 'id';
  table.testid = 'inv';
  table.actions = ACTIONS;
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  await table.updateComplete;
  return table;
}

const listBoxes = (t: Table): HTMLElement[] =>
  [...(t.shadowRoot?.querySelectorAll('.grow-data .gcell.actions-col .actions') ?? [])] as HTMLElement[];

/** What sits in each position of a row's actions box: the action id, or `slot:<id>` for a gap. */
function layout(box: HTMLElement): string[] {
  return [...box.children].map((el) => {
    const tid = el.getAttribute('data-testid');
    if (tid) return tid.replace(/^inv-row-[^-]+-/, '');
    return `slot:${el.getAttribute('data-slot-for') ?? '?'}`;
  });
}

async function collapse(table: Table): Promise<void> {
  (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = true;
  await table.updateComplete;
}

describe('ok-data-table: row actions stay in their column when a row hides one (outfitkit#240)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('list view: every row keeps one position per action, in order, with a gap where it is hidden', async () => {
    const table = await mount();
    expect(listBoxes(table).map(layout)).toEqual([
      ['view', 'mark-paid', 'refund'],
      ['view', 'slot:mark-paid', 'refund'],
      ['view', 'slot:mark-paid', 'slot:refund'],
    ]);
  });

  it('a gap is the same button (icon for an icon action, the text for a text one), so it is as wide', async () => {
    const table = await mount();
    const [, paid, voided] = listBoxes(table);
    const iconGap = paid.querySelector('[data-slot-for="mark-paid"]') as HTMLElement;
    const textGap = voided.querySelector('[data-slot-for="refund"]') as HTMLElement;

    expect(iconGap.tagName).toBe('ION-BUTTON');
    expect(iconGap.getAttribute('size')).toBe('small');
    expect(iconGap.getAttribute('fill'), 'a solid button pads differently from a clear one').toBe('clear');
    expect(iconGap.querySelector('ion-icon[slot="icon-only"]')).not.toBeNull();
    expect(textGap.tagName).toBe('ION-BUTTON');
    expect(textGap.textContent?.trim()).toBe('Refund');
  });

  it('a gap is invisible, outside the tab order and the accessibility tree, and does nothing', async () => {
    const table = await mount();
    const gaps = [...(table.shadowRoot?.querySelectorAll('[data-slot-for]') ?? [])] as HTMLElement[];
    expect(gaps).toHaveLength(3);

    const events: unknown[] = [];
    table.addEventListener('rowAction', (e) => events.push((e as CustomEvent).detail));
    for (const gap of gaps) {
      expect(getComputedStyle(gap).visibility, 'the gap must not be painted').toBe('hidden');
      expect(gap.getAttribute('aria-hidden')).toBe('true');
      expect(gap.hasAttribute('inert'), 'nor reachable with Tab').toBe(true);
      expect(gap.hasAttribute('aria-label'), 'nor named').toBe(false);
      gap.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
    }
    expect(events, 'a hidden action must never fire').toEqual([]);
  });

  it('the real buttons keep firing their own action', async () => {
    const table = await mount();
    const events: { actionId: string; row: Row }[] = [];
    table.addEventListener('rowAction', (e) => events.push((e as CustomEvent).detail));
    (table.shadowRoot?.querySelector('[data-testid="inv-row-paid-refund"]') as HTMLElement).click();
    expect(events.map((e) => [e.actionId, e.row.id])).toEqual([['refund', 'paid']]);
  });

  it('a row-dependent label is not asked for a row that hides the action (it may not apply there)', async () => {
    const table = await mount({
      actions: [
        { id: 'view', label: 'View', icon: 'eye-outline' },
        {
          id: 'refund',
          // Reads a field only refundable invoices carry: asking it for a voided one would throw.
          label: (r: Row) => `Refund ${(r.refund as { amount: string }).amount}`,
          hidden: (r: Row) => !r.refund,
        },
      ],
      rows: [
        { id: 'issued', status: 'issued', refund: { amount: '10 €' } },
        { id: 'voided', status: 'voided' },
      ],
    });
    const [issued, voided] = listBoxes(table);
    expect(layout(issued)).toEqual(['view', 'refund']);
    expect(layout(voided)).toEqual(['view', 'slot:refund']);
    // The gap borrows the label of a row that does show the action, so it keeps a real width.
    expect(voided.querySelector('[data-slot-for="refund"]')?.textContent?.trim()).toBe('Refund 10 €');

    // New rows, new labels: the borrowed text follows them instead of the first list it saw.
    table.rows = [
      { id: 'issued', status: 'issued', refund: { amount: '1.250,00 €' } },
      { id: 'voided', status: 'voided' },
    ];
    await table.updateComplete;
    expect(listBoxes(table)[1].querySelector('[data-slot-for="refund"]')?.textContent?.trim()).toBe('Refund 1.250,00 €');
  });

  it('collapsed list ("..." menu, #122/#213): no gaps — each row shows one 44px button and they line up', async () => {
    const table = await mount();
    await collapse(table);
    expect(table.shadowRoot?.querySelectorAll('[data-slot-for]').length).toBe(0);
    expect(listBoxes(table).map((b) => b.children.length)).toEqual([1, 1, 1]);
  });

  it('cards view: no gaps — a card has no column to line up with', async () => {
    const table = await mount({ views: true, defaultView: 'cards' });
    await table.updateComplete;
    expect(table.shadowRoot?.querySelectorAll('.ractions').length).toBe(3);
    expect(table.shadowRoot?.querySelectorAll('[data-slot-for]').length).toBe(0);
  });
});
