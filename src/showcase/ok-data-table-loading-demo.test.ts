// @vitest-environment happy-dom
import { html } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

vi.mock('../base/icons.js', () => ({
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

import '../components/ok-data-table/ok-data-table.js';
// @ts-expect-error The showcase catalog is deliberately plain JavaScript.
import { COMPONENTS } from '../../showcase/components-data.js';

// outfitkit#268 — module authors copy the showcase. The loading state only reaches the modules if
// the showcase SHOWS it (live demo), TEACHES it (code: `dt.loading = ctrl.loading`) and DOCUMENTS
// it (API, and therefore the generated catalog).

type Comp = {
  id: string;
  example: string;
  setup?: (root: HTMLElement, ctx: unknown) => void;
  code: string;
  api: Array<{ kind: string; name: string; detail: string }>;
};
type Table = HTMLElement & {
  rows: unknown[];
  loading: boolean;
  menuActions: Array<{ id: string; label: string }>;
  updateComplete: Promise<unknown>;
};

const dataTable = (COMPONENTS as Comp[]).find((c) => c.id === 'ok-data-table')!;

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = '';
});

async function mountDemo(): Promise<Table> {
  document.documentElement.lang = 'es';
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: false, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
  const frame = document.createElement('div');
  frame.innerHTML = dataTable.example;
  document.body.appendChild(frame);
  dataTable.setup?.(frame, { h: html });
  const table = frame.querySelector('#dt') as Table;
  await table.updateComplete;
  return table;
}

const pagerText = (t: Table): string => (t.shadowRoot?.querySelector('.pager')?.textContent ?? '').replace(/\s+/g, ' ');

describe('showcase ok-data-table — a list that is still loading (outfitkit#268)', () => {
  it('the live demo replays a first load: loading indicator and no count, then the rows', async () => {
    vi.useFakeTimers();
    const table = await mountDemo();
    const reload = table.menuActions.find((a) => a.id === 'reload');
    expect(reload, 'the demo menu has no way to replay the load').toBeTruthy();
    expect(reload!.label).toBe('Recargar');

    table.dispatchEvent(new CustomEvent('menuAction', { detail: { actionId: 'reload' } }));
    await table.updateComplete;
    expect(table.loading).toBe(true);
    expect(table.shadowRoot?.querySelector('[data-role="loading"]')?.textContent?.trim()).toBe('Cargando…');
    expect(pagerText(table)).not.toMatch(/registros?/);

    await vi.runAllTimersAsync();
    await table.updateComplete;
    expect(table.loading).toBe(false);
    expect(table.rows.length).toBeGreaterThan(0);
    expect(table.shadowRoot?.querySelector('[data-role="loading"]')).toBeNull();
    expect(pagerText(table)).toMatch(/\d+ registros/);
  });

  it('the code sample wires the SDK list controller', () => {
    expect(dataTable.code).toMatch(/dt\.loading = ctrl\.loading;/);
  });

  it('the API documents `loading`, the busy mark and its label', () => {
    const loading = dataTable.api.find((a) => a.kind === 'prop' && a.name === 'loading');
    expect(loading, 'the data-table API does not document `loading`').toBeTruthy();
    expect(loading!.detail).toMatch(/aria-busy/);
    expect(loading!.detail).toMatch(/`loading`/);
  });

  it('the generated catalog lists it among the table props', () => {
    const catalog = readFileSync(resolve(process.cwd(), 'docs/COMPONENT-CATALOG.md'), 'utf8');
    const line = catalog.split('\n').find((l) => l.startsWith('- `ok-data-table` —')) ?? '';
    const props = line.split(' · props: ')[1]?.split(' · eventos: ')[0] ?? '';
    expect(props.split(', ')).toContain('`loading`');
  });
});
