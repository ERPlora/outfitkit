// @vitest-environment happy-dom

// outfitkit#211 - "the title of the row-actions column reads «ACCI…»".
//
// Measured in Chromium over the built bundle (ios and md, the same numbers), three columns and
// N row actions. "ACCIONES" (11px, uppercase, letter-spacing) needs 63px. The header cell keeps
// 16px of right padding, so the room for the label is the cell width minus 16:
//
//   width | actions | header cell | room | painted
//   834   | 1       | 60px        | 44px | "ACCI…"
//   1440  | 1       | 48px        | 32px | "ACC…"
//   834   | 2       | 108px       | 92px | "ACCIONES"
//   1440  | 2       | 84px        | 68px | "ACCIONES"
//   390   | any     | folded      | -    | nothing (#122)
//
// A truncated title names nothing. When the label does not fit, the column keeps it as its
// accessible name and paints nothing - what #122 already does while the actions are folded, and
// what Shopify (Polaris IndexTable) and Odoo do with an icon-only column. When it fits, it stays.
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
  requestUpdate: () => void;
};

const LABEL_PX = 63; // "ACCIONES" in Chromium

const header = (table: Table): HTMLElement =>
  table.shadowRoot?.querySelector('.ghead .gcell.actions-col') as HTMLElement;

/** happy-dom has no layout: give the header cell and its label the widths Chromium measured,
 *  then let the table render again so it can judge them. */
async function lay(table: Table, cellPx: number, labelPx = LABEL_PX): Promise<void> {
  const cell = header(table);
  Object.defineProperty(cell, 'clientWidth', { configurable: true, get: () => cellPx });
  const label = cell.querySelector('span') as HTMLElement;
  Object.defineProperty(label, 'scrollWidth', { configurable: true, get: () => labelPx });
  table.requestUpdate();
  await table.updateComplete;
  // The judgement lands in `updated`, so the label it decides is painted one render later.
  await table.updateComplete;
}

async function mount(actions = 1): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rowKey = 'id';
  table.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'category', header: 'Categoría' },
  ];
  table.rows = [{ id: '1', name: 'Ventas', category: 'TPV' }];
  table.actions = [
    { id: 'install', label: 'Instalar', icon: 'download-outline' },
    { id: 'edit', label: 'Editar', icon: 'create-outline' },
  ].slice(0, actions);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

describe('ok-data-table: the row-actions header is never painted truncated (#211)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('one action at 834px: 44px of room for a 63px label - named, not painted', async () => {
    const table = await mount(1);
    await lay(table, 60);
    const cell = header(table);
    expect(cell.querySelector('.sr-only')?.textContent?.trim(), 'the column keeps its accessible name').toBe('Acciones');
    expect(cell.textContent?.trim(), 'nothing else may be painted in that cell').toBe('Acciones');
  });

  it('"named, not painted" is what the stylesheet does to that label, not just a class name', async () => {
    const table = await mount(1);
    await lay(table, 60);
    const label = header(table).querySelector('.sr-only') as HTMLElement;
    const cs = getComputedStyle(label);
    expect(cs.position, 'out of the cell flow').toBe('absolute');
    expect(cs.width).toBe('1px');
    expect(cs.height).toBe('1px');
    expect(cs.overflow).toBe('hidden');
    expect(cs.clipPath).toBe('inset(50%)');
  });

  it('one action at 1440px: 32px of room - named, not painted', async () => {
    const table = await mount(1);
    await lay(table, 48);
    expect(header(table).querySelector('.sr-only')?.textContent?.trim()).toBe('Acciones');
  });

  it('the cell padding is not room for the label: a 70px cell leaves 54px, still too short', async () => {
    const table = await mount(2);
    await lay(table, 70);
    expect(header(table).querySelector('.sr-only'), '70 - 16 = 54 < 63').not.toBeNull();
  });

  it('two actions at 1440px: 68px of room - the label is shown whole', async () => {
    const table = await mount(2);
    await lay(table, 84);
    const cell = header(table);
    expect(cell.querySelector('.sr-only'), 'a label that fits is painted, not hidden').toBeNull();
    expect(cell.textContent?.trim()).toBe('Acciones');
  });

  it('a label that fits exactly is shown', async () => {
    const table = await mount(2);
    await lay(table, LABEL_PX + 16);
    expect(header(table).querySelector('.sr-only')).toBeNull();
  });

  it('when the column widens again the label comes back', async () => {
    const table = await mount(2);
    await lay(table, 60);
    expect(header(table).querySelector('.sr-only'), 'narrow first').not.toBeNull();
    await lay(table, 108);
    expect(header(table).querySelector('.sr-only'), 'wide again: painted again').toBeNull();
  });

  it('before anything is laid out (0px everywhere) the label keeps being shown', async () => {
    const table = await mount(1);
    await lay(table, 0, 0);
    expect(header(table).querySelector('.sr-only')).toBeNull();
  });
});
