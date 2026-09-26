// @vitest-environment happy-dom

// outfitkit#185 - "on a tablet the row '⋮' menu opens stuck to the bottom and only shows the first
// option".
//
// Measured in Chromium (headless shell) over the CDN bundle + Ionic 8.8.9, 12 rows, 8 actions:
//
//   mode | viewport  | row | button y | popover top | items visible
//   ios  | 768x1024  | 2   | 183      | 823         | 4 / 8
//   ios  | 768x1024  | 6   | 440      | 823         | 4 / 8
//   ios  | 390x844   | 2   | 143      | 783         | 1 / 8
//   md   | 768x1024  | 6   | 440      | 813         | 4 / 8
//
// The popover lands in the same place whatever row is tapped. Root cause: the popover is given the
// click event and Ionic resolves the anchor as `ev.detail.ionShadowTarget || ev.target` when it
// PRESENTS, which is after the dispatch is over. By then the browser has retargeted `ev.target` to
// the shadow HOST (the whole `ok-data-table`), so Ionic anchors to the table's bounding box, opens
// below it and clamps to the bottom edge. `ionShadowTarget` is Ionic's own escape hatch for a
// trigger inside a shadow root (ion-breadcrumb uses it): the component must hand it the button.
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
  menuActions: Row[];
  rowKeyField: string;
  testid: string;
  updateComplete: Promise<unknown>;
};
type PopoverEl = HTMLElement & { event?: Event & { detail?: { ionShadowTarget?: Element } } };

const ROWS: Row[] = [
  { id: 'a', name: 'Ana' },
  { id: 'b', name: 'Bea' },
  { id: 'c', name: 'Carla' },
];

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.rowKeyField = 'id';
  table.testid = 'appts';
  table.actions = [
    { id: 'charge', label: 'Charge', icon: 'cash-outline' },
    { id: 'confirm', label: 'Confirm', icon: 'checkmark-outline' },
  ];
  table.menuActions = [{ id: 'export', label: 'Export' }];
  document.body.appendChild(table);
  await table.updateComplete;
  (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = true;
  await table.updateComplete;
  return table;
}

/** DOM spec: once dispatch is over, `event.target` is the target retargeted against the document,
 *  i.e. the outermost shadow host. Chromium does it (probe: `target` reads the host `<div>` after
 *  a click on a `<button>` in its shadow root); happy-dom keeps the inner node, which would make
 *  this suite pass against the bug. So the retargeting is applied here. */
function retargetToDocument(node: unknown): unknown {
  let current = node as Node | null;
  while (current) {
    const root = current.getRootNode();
    if (!(root instanceof ShadowRoot)) return current;
    current = root.host;
  }
  return current;
}

/** What Ionic 8 anchors a popover to when it presents (popover/utils.js `getPopoverPosition`,
 *  reference `trigger`, no `trigger` prop): read AFTER the click dispatch has finished. */
const ionicAnchor = (popover: PopoverEl): unknown =>
  popover.event?.detail?.ionShadowTarget ?? retargetToDocument(popover.event?.target);

async function tap(table: Table, el: HTMLElement): Promise<void> {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
  await table.updateComplete;
}

describe('ok-data-table: popovers anchor to the button that opened them (outfitkit#185)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('the row "⋮" menu is anchored to THAT row\'s button, not to the whole table', async () => {
    const table = await mount();
    const second = table.shadowRoot!.querySelector('[data-testid="appts-row-b-menu"]') as HTMLElement;

    await tap(table, second);

    const popover = table.shadowRoot!.querySelector('ion-popover.row-menu') as PopoverEl;
    expect(ionicAnchor(popover)).toBe(second);
  });

  it('opening another row moves the anchor to the new row', async () => {
    const table = await mount();
    const first = table.shadowRoot!.querySelector('[data-testid="appts-row-a-menu"]') as HTMLElement;
    const third = table.shadowRoot!.querySelector('[data-testid="appts-row-c-menu"]') as HTMLElement;

    await tap(table, first);
    table.shadowRoot!.querySelector('ion-popover.row-menu')!.dispatchEvent(new CustomEvent('didDismiss'));
    await table.updateComplete;
    await tap(table, third);

    const popover = table.shadowRoot!.querySelector('ion-popover.row-menu') as PopoverEl;
    expect(ionicAnchor(popover)).toBe(third);
  });

  it('the toolbar overflow menu is anchored to its own "⋮" button', async () => {
    const table = await mount();
    const button = table.shadowRoot!.querySelector('ion-button.toolbtn + ion-popover')
      ?.previousElementSibling as HTMLElement;

    await tap(table, button);

    const popover = button.nextElementSibling as PopoverEl;
    expect(ionicAnchor(popover)).toBe(button);
  });
});
