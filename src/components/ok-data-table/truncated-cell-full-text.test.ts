// @vitest-environment happy-dom

// outfitkit#217 — «a cell cut with "…" gives no way to read its full text».
//
// The list view clips a cell that does not fit (`.gcell > span { text-overflow: ellipsis }`) and
// the span carried nothing else: in Combos every row read «Se consume en el local (…» and the
// mouse revealed nothing. The fix follows the grids everybody knows (MUI DataGrid, Ant Design's
// `ellipsis.showTitle`, and our own ok-heatmap): the text cell carries its full text as a native
// `title`. A touch screen has no hover, so there the FIRST tap on a clipped cell unfolds it in
// place and the next one opens the record as always. The clip itself stays: the row keeps one
// line until somebody asks for more.
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

import { html } from 'lit';
import './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  rowKey: string;
  testid: string;
  rowClickable: boolean;
  views: unknown;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

const LONG = 'Se consume en el local (servicio de restauración)';

const ROWS = [
  { id: '1', name: 'Menú del día', mode: LONG, note: '' },
  { id: '2', name: 'Menú infantil', mode: 'Para llevar', note: null },
];

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'mode', header: 'Cómo se vende' },
    { key: 'note', header: 'Nota' },
  ];
  table.rowKey = 'id';
  table.testid = 'combos';
  table.views = false;
  table.defaultView = 'table';
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

/** The text span of a cell: row by key, column by position. */
function cellSpan(t: Table, rowKey: string, col: number): HTMLElement {
  const row = t.shadowRoot?.querySelector(`[data-testid="combos-row-${rowKey}"]`);
  const cell = row?.querySelectorAll('.gcell')[col];
  const span = cell?.querySelector(':scope > span') as HTMLElement | null;
  if (!span) throw new Error(`no text span in row ${rowKey}, column ${col}`);
  return span;
}

/** happy-dom does no layout: a clipped span is one whose content is wider than its box. */
function clip(span: HTMLElement, clipped: boolean): void {
  Object.defineProperty(span, 'scrollWidth', { configurable: true, get: () => (clipped ? 380 : 90) });
  Object.defineProperty(span, 'clientWidth', { configurable: true, get: () => 90 });
}

/** A tap is a pointerdown of the given kind followed by the click the browser synthesises. */
function tap(el: HTMLElement, pointerType: 'touch' | 'mouse'): void {
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true, pointerType }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));
}

function rowClicks(t: Table): Array<Record<string, unknown>> {
  const seen: Array<Record<string, unknown>> = [];
  t.addEventListener('rowClick', (e) => seen.push((e as CustomEvent<{ row: Record<string, unknown> }>).detail.row));
  return seen;
}

describe('ok-data-table: a clipped cell can be read in full (#217)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('a text cell carries its full text as the native title (desktop hover)', async () => {
    const table = await mount();
    expect(cellSpan(table, '1', 1).getAttribute('title')).toBe(LONG);
    expect(cellSpan(table, '2', 1).getAttribute('title')).toBe('Para llevar');
  });

  it('the title is the FORMATTED text, the same one painted', async () => {
    const table = await mount({
      columns: [
        { key: 'name', header: 'Nombre' },
        { key: 'mode', header: 'Cómo se vende', format: (r: Record<string, unknown>) => `» ${String(r.mode)}` },
      ],
    });
    const span = cellSpan(table, '1', 1);
    expect(span.textContent).toBe(`» ${LONG}`);
    expect(span.getAttribute('title')).toBe(`» ${LONG}`);
  });

  it('an empty cell gets no title (no blank tooltip)', async () => {
    const table = await mount();
    expect(cellSpan(table, '1', 2).hasAttribute('title')).toBe(false);
    expect(cellSpan(table, '2', 2).hasAttribute('title')).toBe(false);
  });

  it('a column with its own render is left alone', async () => {
    const table = await mount({
      columns: [
        { key: 'name', header: 'Nombre' },
        { key: 'mode', header: 'Cómo se vende', render: (r: Record<string, unknown>) => html`<b class="own">${String(r.mode)}</b>` },
      ],
    });
    const cell = table.shadowRoot?.querySelector('[data-testid="combos-row-1"]')?.querySelectorAll('.gcell')[1];
    expect(cell?.querySelector(':scope > b.own')).toBeTruthy();
    expect(cell?.querySelector('[title]')).toBeNull();
  });

  it('a column header, clipped by the same rule, carries its full label as the title too', async () => {
    const table = await mount();
    const header = table.shadowRoot?.querySelectorAll('.ghead .gcell.gh')[1];
    const label = header?.querySelector(':scope > span') as HTMLElement | null;
    expect(label?.textContent).toBe('Cómo se vende');
    expect(label?.getAttribute('title')).toBe('Cómo se vende');
  });

  it('the clip stays: one line with an ellipsis until someone asks for more', async () => {
    const table = await mount();
    const cs = getComputedStyle(cellSpan(table, '1', 1));
    expect(cs.textOverflow).toBe('ellipsis');
    expect(cs.whiteSpace).toBe('nowrap');
    expect(cs.overflow).toBe('hidden');
  });

  describe('touch (no hover, so no title)', () => {
    it('the first tap on a clipped cell unfolds it in place and does not open the record', async () => {
      const table = await mount({ rowClickable: true });
      const seen = rowClicks(table);
      const span = cellSpan(table, '1', 1);
      clip(span, true);
      tap(span, 'touch');
      await table.updateComplete;
      const unfolded = cellSpan(table, '1', 1);
      expect(unfolded.classList.contains('unfolded')).toBe(true);
      expect(getComputedStyle(unfolded).whiteSpace).toBe('normal');
      expect(seen).toHaveLength(0);
    });

    it('once unfolded, the next tap opens the record as always', async () => {
      const table = await mount({ rowClickable: true });
      const seen = rowClicks(table);
      const span = cellSpan(table, '1', 1);
      clip(span, true);
      tap(span, 'touch');
      await table.updateComplete;
      tap(cellSpan(table, '1', 1), 'touch');
      expect(seen.map((r) => r.id)).toEqual(['1']);
    });

    it('only the tapped cell unfolds, not its neighbours nor the same column in other rows', async () => {
      const table = await mount({ rowClickable: true });
      const span = cellSpan(table, '1', 1);
      clip(span, true);
      tap(span, 'touch');
      await table.updateComplete;
      expect(cellSpan(table, '1', 0).classList.contains('unfolded')).toBe(false);
      expect(cellSpan(table, '2', 1).classList.contains('unfolded')).toBe(false);
    });

    it('a tap on a cell that fits opens the record straight away', async () => {
      const table = await mount({ rowClickable: true });
      const seen = rowClicks(table);
      const span = cellSpan(table, '2', 1);
      clip(span, false);
      tap(span, 'touch');
      await table.updateComplete;
      expect(cellSpan(table, '2', 1).classList.contains('unfolded')).toBe(false);
      expect(seen.map((r) => r.id)).toEqual(['2']);
    });

    it('also unfolds in a table whose rows do not open anything', async () => {
      const table = await mount({ rowClickable: false });
      const span = cellSpan(table, '1', 1);
      clip(span, true);
      tap(span, 'touch');
      await table.updateComplete;
      expect(cellSpan(table, '1', 1).classList.contains('unfolded')).toBe(true);
    });

    it('new rows start folded again', async () => {
      const table = await mount({ rowClickable: true });
      const span = cellSpan(table, '1', 1);
      clip(span, true);
      tap(span, 'touch');
      await table.updateComplete;
      table.rows = [...ROWS];
      await table.updateComplete;
      expect(cellSpan(table, '1', 1).classList.contains('unfolded')).toBe(false);
    });
  });

  it('with a mouse a click keeps opening the record: the desktop has the title', async () => {
    const table = await mount({ rowClickable: true });
    const seen = rowClicks(table);
    const span = cellSpan(table, '1', 1);
    clip(span, true);
    tap(span, 'mouse');
    await table.updateComplete;
    expect(cellSpan(table, '1', 1).classList.contains('unfolded')).toBe(false);
    expect(seen.map((r) => r.id)).toEqual(['1']);
  });
});
