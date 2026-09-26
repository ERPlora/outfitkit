// @vitest-environment happy-dom

// outfitkit#207 (from services#109) — «on the phone the Filters sheet does not close and covers the
// list». In `serverSide` mode every filter applies the moment it is picked, so the panel painted no
// footer at all: on a phone the sheet covers the whole list and the only way out was a 28px X in the
// corner — people believed the sheet could not be closed (Services → Status «Archived» → restore).
// Contract: the server-mode Filters panel ends in a footer with ONE primary «Show results» button
// that closes the sheet (panelClose reason `apply`) without emitting another `filterChange` — the
// filters were already applied live. The footer stays out of the scrolling body, so it is always
// on screen however many filters there are.
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
  serverSide: boolean;
  testid: string;
  open: (p?: 'filters' | 'create' | 'edit') => void;
  updateComplete: Promise<unknown>;
};

async function mount(serverSide: boolean): Promise<{ t: Table; closes: unknown[]; filterChanges: unknown[] }> {
  const t = document.createElement('ok-data-table') as unknown as Table;
  t.serverSide = serverSide;
  t.testid = 'services-list-table';
  t.rows = [{ id: 1, name: 'Brushing', status: 'active' }];
  t.columns = [
    { key: 'name', header: 'Nombre', filterable: true, filterType: 'text' },
    {
      key: 'status',
      header: 'Estado',
      filterable: true,
      filterType: 'select',
      options: [
        { value: 'active', label: 'Activo' },
        { value: 'inactive', label: 'Archivado' },
      ],
    },
  ];
  const closes: unknown[] = [];
  const filterChanges: unknown[] = [];
  t.addEventListener('panelClose', (e) => closes.push((e as CustomEvent).detail));
  t.addEventListener('filterChange', (e) => filterChanges.push((e as CustomEvent).detail));
  document.body.appendChild(t);
  await t.updateComplete;
  t.open('filters');
  await t.updateComplete;
  return { t, closes, filterChanges };
}

const q = (t: Table, sel: string) => t.shadowRoot?.querySelector(sel) as HTMLElement | null;
const showResults = (t: Table) => q(t, '[data-testid="services-list-table-filters-show-results"]');

describe('ok-data-table: the server-mode Filters sheet has «Show results» (#207)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('paints a footer with one primary «Ver resultados» button', async () => {
    const { t } = await mount(true);
    const btn = showResults(t);
    expect(btn, 'the server-mode Filters sheet has no way back to the list but the X').toBeTruthy();
    expect(btn?.tagName.toLowerCase()).toBe('ion-button');
    expect(btn?.textContent?.trim()).toBe('Ver resultados');
    expect(btn?.classList.contains('primary-btn')).toBe(true);
    expect(btn?.getAttribute('expand'), 'the button must span the sheet (large tap target)').toBe('block');
    // `.df` is a flex ROW aligned to the end: without growing, `expand="block"` measured 139px (ios)
    // / 164px (md) pushed to the right of a 390px sheet in the bench.
    expect(getComputedStyle(btn as HTMLElement).flexGrow, 'the button does not fill the footer').toBe('1');
    expect(btn?.closest('footer.df')?.parentElement?.classList.contains('drawer')).toBe(true);
  });

  it('says «Show results» in English', async () => {
    document.documentElement.lang = 'en';
    const { t } = await mount(true);
    expect(showResults(t)?.textContent?.trim()).toBe('Show results');
  });

  it('tapping it closes the sheet with reason apply and no extra filterChange', async () => {
    const { t, closes, filterChanges } = await mount(true);
    showResults(t)?.click();
    await t.updateComplete;
    expect(q(t, 'aside.drawer'), '«Show results» did not close the sheet').toBeNull();
    expect(closes).toEqual([{ panel: 'filters', reason: 'apply' }]);
    expect(filterChanges, 'filters are live in server mode: closing must not re-apply them').toEqual([]);
  });

  it('the footer sits below the scrolling body, so it never scrolls out of the sheet', async () => {
    const { t } = await mount(true);
    const drawer = q(t, 'aside.drawer') as HTMLElement;
    const body = q(t, 'aside.drawer > .db') as HTMLElement;
    const footer = q(t, 'aside.drawer > footer.df') as HTMLElement;
    expect(footer, 'no footer in the server-mode Filters sheet').toBeTruthy();
    expect(body.nextElementSibling).toBe(footer);
    expect(getComputedStyle(drawer).display).toBe('flex');
    expect(getComputedStyle(drawer).flexDirection).toBe('column');
    expect(getComputedStyle(body).overflow).toBe('auto');
    expect(getComputedStyle(body).flexGrow).toBe('1');
    expect(getComputedStyle(footer).flexShrink, 'the footer shrinks away when there are many filters').toBe('0');
  });

  it('client mode keeps its own Clear / Apply footer (no «Show results»)', async () => {
    const { t } = await mount(false);
    expect(showResults(t)).toBeNull();
    expect(q(t, 'footer.df .df-clear')).toBeTruthy();
  });

  it('the create/edit panel gets no Filters footer', async () => {
    const { t } = await mount(true);
    t.open('create');
    await t.updateComplete;
    expect(showResults(t)).toBeNull();
    expect(q(t, 'aside.drawer footer.df')).toBeNull();
  });
});
