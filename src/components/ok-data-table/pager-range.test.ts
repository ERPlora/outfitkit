// @vitest-environment happy-dom

// ERPlora/hub#1984 — «Apps → My apps, page 2 says "Showing 11–10 of 14 records"». The upper bound
// of the desktop pager came from the MOBILE accumulated window (#78: `mobileShown || pageSize`),
// which on desktop never moves past the first page. So every page after the first one printed the
// same «to» as page 1, lower than its own «from».
//
// Contract: on desktop the range is the page window, clamped to the record count — «from» is
// `page * size + 1` and «to» is `min((page + 1) * size, count)` — in client AND server mode. On a
// phone (client mode) it keeps counting the accumulated rows from 1.
import { describe, expect, it, vi } from 'vitest';

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
  rowKey: string;
  pageSize: number;
  serverSide: boolean;
  total: number;
  page: number;
  locale: string;
  updateComplete: Promise<unknown>;
};

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

const rowsOf = (n: number, offset = 0): Array<Record<string, unknown>> =>
  Array.from({ length: n }, (_, i) => ({ id: String(offset + i + 1), name: `App ${offset + i + 1}` }));

async function mount(extra: Partial<Table>): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.columns = [{ key: 'name', header: 'Name' }];
  table.rowKey = 'id';
  table.pageSize = 10;
  table.locale = 'en';
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

const pagerText = (t: Table): string =>
  t.shadowRoot?.querySelector('.pager .left')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

async function clickPage(t: Table, n: number): Promise<void> {
  const btn = [...(t.shadowRoot?.querySelectorAll<HTMLButtonElement>('.pager .nav button.pnum') ?? [])]
    .find((b) => b.textContent?.trim() === String(n));
  expect(btn, `page button ${n}`).toBeTruthy();
  btn!.click();
  await t.updateComplete;
}

describe('ok-data-table pager range (hub#1984)', () => {
  it('desktop client mode: the last, partial page shows 11–14 of 14', async () => {
    viewport(false);
    const t = await mount({ rows: rowsOf(14) });
    expect(pagerText(t)).toContain('1–10 of');
    await clickPage(t, 2);
    expect(pagerText(t)).toContain('11–14 of');
    expect(pagerText(t)).not.toContain('11–10');
    t.remove();
  });

  it('desktop client mode: a full middle page shows its own window', async () => {
    viewport(false);
    const t = await mount({ rows: rowsOf(25) });
    await clickPage(t, 2);
    expect(pagerText(t)).toContain('11–20 of');
    await clickPage(t, 3);
    expect(pagerText(t)).toContain('21–25 of');
    t.remove();
  });

  it('desktop server mode: the last page is clamped to the total', async () => {
    viewport(false);
    const t = await mount({ serverSide: true, total: 14, page: 1, rows: rowsOf(4, 10) });
    expect(pagerText(t)).toContain('11–14 of');
    t.remove();
  });

  it('phone client mode keeps counting the accumulated rows from 1', async () => {
    viewport(true);
    const t = await mount({ rows: rowsOf(14) });
    expect(pagerText(t)).toContain('1–10 of');
    t.shadowRoot?.querySelector<HTMLElement>('.pager ion-button.load-more')?.click();
    await t.updateComplete;
    expect(pagerText(t)).toContain('1–14 of');
    t.remove();
  });
});
