// @vitest-environment happy-dom

// outfitkit#162 — every row action of a table came out in the same blue: the trash of «Delete»
// declared `color: 'danger'` and still looked exactly like «Edit».
//
// `ok-data-table` passed the action's colour as `color=` to the `ion-button` / `ion-icon` /
// `ion-label` it renders. Ionic paints `color=` with a GLOBAL rule (`.ion-color-danger`) that does
// not enter this component's shadow root, so under the `ios` mode both hosts run the button kept
// Ionic's default primary (measured: `rgb(0, 84, 233)` on a `{ color: 'danger' }` action).
//
// The contract: no `color=` on those controls; the tone is declared as a custom property from the
// theme token, in line (the popovers are overlays and may live outside the shadow root).
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
  testid: string;
  updateComplete: Promise<unknown>;
};

const ACTIONS = [
  { id: 'edit', label: 'Edit', icon: 'create-outline' },
  { id: 'delete', label: 'Delete', icon: 'trash-outline', color: 'danger' },
];

async function mount(collapsed = false): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: '1', name: 'A' }];
  table.columns = [{ key: 'name', header: 'Name' }];
  table.rowKeyField = 'id';
  table.testid = 'dt';
  table.actions = ACTIONS;
  table.menuActions = [
    { id: 'export', label: 'Export', icon: 'download-outline' },
    { id: 'purge', label: 'Purge', icon: 'trash-outline', color: 'danger' },
  ];
  document.body.appendChild(table);
  await table.updateComplete;
  if (collapsed) {
    (table as unknown as { rowActionsCollapsed: boolean }).rowActionsCollapsed = true;
    await table.updateComplete;
  }
  return table;
}

const q = (t: Table, sel: string) => t.shadowRoot!.querySelector(sel) as HTMLElement | null;
const qa = (t: Table, sel: string) => [...t.shadowRoot!.querySelectorAll(sel)] as HTMLElement[];

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ok-data-table row action tones (#162)', () => {
  it('paints a danger action red from the token, without the dead color= attribute', async () => {
    const t = await mount();
    const del = q(t, '[data-testid="dt-row-1-delete"]')!;
    expect(del).not.toBeNull();
    expect(del.hasAttribute('color')).toBe(false);
    expect(del.getAttribute('style')).toContain('--color: var(--ok-danger, var(--ion-color-danger');
  });

  it('paints an action without colour in medium, not in the primary blue', async () => {
    const t = await mount();
    const edit = q(t, '[data-testid="dt-row-1-edit"]')!;
    expect(edit.hasAttribute('color')).toBe(false);
    expect(edit.getAttribute('style')).toContain('--color: var(--ok-medium, var(--ion-color-medium');
  });

  it('paints the collapsed «⋮» row button in medium too', async () => {
    const t = await mount(true);
    const menu = q(t, '[data-testid="dt-row-1-menu"]')!;
    expect(menu).not.toBeNull();
    expect(menu.hasAttribute('color')).toBe(false);
    expect(menu.getAttribute('style')).toContain('--color: var(--ok-medium, var(--ion-color-medium');
  });

  it('paints the icon and label of a danger action in the collapsed row menu', async () => {
    const t = await mount(true);
    q(t, '[data-testid="dt-row-1-menu"]')!.click();
    await t.updateComplete;
    const item = q(t, '[data-testid="dt-row-1-delete"]')!;
    expect(item).not.toBeNull();
    for (const el of [item.querySelector('ion-icon')!, item.querySelector('ion-label')!]) {
      expect(el.hasAttribute('color')).toBe(false);
      expect(el.getAttribute('style')).toContain('color: var(--ok-danger, var(--ion-color-danger');
    }
    const edit = q(t, '[data-testid="dt-row-1-edit"]')!;
    expect(edit.querySelector('ion-label')!.hasAttribute('style')).toBe(false);
  });

  it('paints the icon and label of a danger overflow-menu action', async () => {
    const t = await mount();
    const labels = qa(t, 'ion-popover ion-label');
    const purge = labels.find((l) => l.textContent?.trim() === 'Purge')!;
    expect(purge).toBeDefined();
    const icon = purge.parentElement!.querySelector('ion-icon')!;
    for (const el of [icon, purge]) {
      expect(el.hasAttribute('color')).toBe(false);
      expect(el.getAttribute('style')).toContain('color: var(--ok-danger, var(--ion-color-danger');
    }
    const exp = labels.find((l) => l.textContent?.trim() === 'Export')!;
    expect(exp.hasAttribute('style')).toBe(false);
  });

  it('leaves no color= on any ion-* the table renders', async () => {
    const t = await mount(true);
    q(t, '[data-testid="dt-row-1-menu"]')!.click();
    await t.updateComplete;
    const painted = qa(t, 'ion-button[color], ion-icon[color], ion-label[color]');
    expect(painted.map((e) => e.outerHTML.slice(0, 80))).toEqual([]);
  });
});
