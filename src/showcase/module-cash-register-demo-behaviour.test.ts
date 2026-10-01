// @vitest-environment happy-dom
// @suite parity — runs the Caja demo of the showcase and holds its session list against the REAL
// cash_register module (`modules-workspace/modules/cash_register`). Parity job only (outfitkit#66).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

// outfitkit#272 — cash_register#127/#130 made the session list newest shift first (`opened_at`
// desc, with its own «Abierta el» column), search ONLY by session number and filter the difference
// by range. The demo kept `id` asc, no opening date, a box promising «o estado» and a text filter on
// the difference. These tests RUN the demo and compare what it shows with the module's manifest,
// its dashboard columns and its Spanish catalogue — not with values copied into the test.

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(resolve(here, path), 'utf8');

const moduleDir = '../../../modules-workspace/modules/cash_register/';
const pagePath = '../../showcase/pages/module-cash-register.html';
const component = read(`${moduleDir}ui/components/erp-cashregister-dashboard/erp-cashregister-dashboard.ts`);
const openSql = read(`${moduleDir}commands/open_session.sql`);
const es = (JSON.parse(read(`${moduleDir}locales/es.json`)) as { ui: Record<string, string> }).ui;
const list = (JSON.parse(read(`${moduleDir}module.json`)) as {
  queries: Record<string, { list: { search: string[]; default_sort: string; default_dir: 'asc' | 'desc'; page_size: number } }>;
}).queries['cash_register.sessions.list'].list;

type Row = Record<string, unknown>;
type Column = { key: string; filterable?: boolean; filterType?: string; sortable?: boolean; width?: string };
type HubPage = { body: string; setup: (doc: Document) => void };
type Table = HTMLElement & {
  rows: Row[];
  columns: Column[];
  sort?: string;
  sortDir?: string;
  pageSize?: number;
  searchable?: boolean;
  searchPlaceholder?: string;
};

let listeners = new AbortController();

beforeAll(() => {
  // Ionic is not loaded here: the demo only needs its toast to accept `present()` after a command.
  if (!customElements.get('ion-toast')) {
    customElements.define('ion-toast', class extends HTMLElement { present(): void {} });
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  listeners.abort();
  listeners = new AbortController();
  document.body.innerHTML = '';
});

/** Runs the page's module script with a `defineHubPage` that only captures the page. */
function mountDemo(): Table {
  const script = read(pagePath).match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  const importLine = "import { defineHubPage } from './_hub.js';";
  expect(script).toContain(importLine);
  let hubPage: HubPage | undefined;
  new Function('defineHubPage', script.replace(importLine, ''))((definition: HubPage) => {
    hubPage = definition;
  });
  document.body.innerHTML = hubPage!.body;
  hubPage!.setup(document);
  return document.getElementById('cash-register-table') as Table;
}

function fixtureRows(): Row[] {
  const match = read(pagePath).match(/const SESSION_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
  expect(match, 'SESSION_FIXTURE must stay auditable JSON').not.toBeNull();
  return JSON.parse(match![1]) as Row[];
}

/** The module's dashboard columns, in order, each with the filter it offers. */
function moduleColumns(): Column[] {
  const getter = component.slice(component.indexOf('get columns()'), component.indexOf('get rowActions()'));
  const pieces = getter.split(/(?=key: ')/).slice(1);
  expect(pieces.length).toBeGreaterThan(0);
  return pieces.map((piece) => ({
    key: piece.match(/^key: '(\w+)'/)![1],
    sortable: /sortable: true/.test(piece),
    filterable: /filterable: true/.test(piece),
    filterType: piece.match(/filterType: '(\w+)'/)?.[1],
    // cash_register#127 sized each column so the seven fit a landscape tablet with the menu open.
    width: piece.match(/width: '([^']+)'/)?.[1],
  }));
}

function byDefaultOrder(rows: Row[]): string[] {
  const sorted = [...rows].sort((left, right) => {
    const result = String(left[list.default_sort] ?? '').localeCompare(String(right[list.default_sort] ?? ''));
    return list.default_dir === 'desc' ? -result : result;
  });
  return sorted.map((row) => String(row.id));
}

describe('showcase module-cash-register — the session list is the module one', () => {
  it('opens on the module default order, newest shift first', () => {
    // The dashboard asks for the same order the manifest declares, so the demo can follow either.
    expect(component).toContain(`sort: '${list.default_sort}',`);
    expect(component).toContain(`dir: '${list.default_dir}',`);
    const fixture = fixtureRows();
    // The ids must not already be in that order, or a demo still sorting by id would pass.
    expect(byDefaultOrder(fixture)).not.toEqual([...fixture.map((row) => String(row.id))].sort());

    const table = mountDemo();
    expect(table.sort).toBe(list.default_sort);
    expect(table.sortDir).toBe(list.default_dir);
    expect(table.pageSize).toBe(list.page_size);
    expect(table.rows.map((row) => String(row.id))).toEqual(byDefaultOrder(fixture));
  });

  it('numbers its shifts like the server does, S-YYMMDD-NNNN', () => {
    // cash_register#49: the server mints the number from the day and a per-day counter.
    expect(openSql).toContain("'S-' || :session_day || '-' ||");
    expect(openSql).toContain('substr(CAST(10000 + c.last_number AS TEXT), 2)');
    for (const row of fixtureRows()) expect(String(row.session_number)).toMatch(/^S-\d{6}-\d{4}$/);
  });

  it('opens a shift with the module payload and puts it at the top, numbered and dated', () => {
    const sent: Array<[string, Record<string, unknown>]> = [];
    vi.spyOn(console, 'info').mockImplementation((tag: unknown, name: unknown, payload: unknown) => {
      if (tag === '[showcase command]') sent.push([String(name), payload as Record<string, unknown>]);
    });
    const opening = component.match(/command\('cash_register\.session\.open', \{([\s\S]*?)\}\);/)?.[1];
    expect(opening, 'the dashboard must open its shift through cash_register.session.open').toBeTruthy();
    const moduleKeys = [...opening!.matchAll(/^\s*(\w+):/gm)].map((match) => match[1]);

    const table = mountDemo();
    (document.getElementById('cash-opening-balance') as HTMLInputElement & { value: string }).value = '100';
    document.getElementById('cash-open-form')!.dispatchEvent(new Event('submit', { cancelable: true }));

    // The demo sends what the module sends: the number is the server's, never the caller's.
    expect(sent.map(([name]) => name)).toEqual(['cash_register.session.open']);
    expect(Object.keys(sent[0][1]).sort()).toEqual([...moduleKeys].sort());
    const [first] = table.rows;
    expect(table.rows).toHaveLength(fixtureRows().length + 1);
    expect(first.opening_balance).toBe(10000);
    expect(Number.isNaN(new Date(String(first[list.default_sort])).getTime())).toBe(false);
    const now = new Date();
    const day = [now.getFullYear() % 100, now.getMonth() + 1, now.getDate()].map((n) => String(n).padStart(2, '0')).join('');
    const sameDay = fixtureRows().filter((row) => String(row.session_number).startsWith(`S-${day}-`)).length;
    expect(first.session_number).toBe(`S-${day}-${String(sameDay + 1).padStart(4, '0')}`);
  });

  it('shows the module columns, in its order, with the same sort, filter and width on each', () => {
    const table = mountDemo();
    expect(table.columns.map(({ key, sortable, filterable, filterType, width }) => ({
      key, sortable: Boolean(sortable), filterable: Boolean(filterable), filterType, width,
    }))).toEqual(moduleColumns());
    expect(fixtureRows().every((row) => row[list.default_sort])).toBe(true);
  });

  it('names each column as the module does in Spanish and fills the opening date', () => {
    const getter = component.slice(component.indexOf('get columns()'), component.indexOf('get rowActions()'));
    const headers = [...getter.matchAll(/header: t\('ui\.(\w+)'\)/g)].map((match) => es[match[1]]);
    expect(headers.every(Boolean), 'every module header must be in locales/es.json').toBe(true);
    const table = mountDemo();
    expect((table.columns as Array<Column & { header?: string }>).map((column) => column.header)).toEqual(headers);
    // «Abierta el» carries the default order: a blank cell would hide it.
    const openedAt = table.columns.find((column) => column.key === list.default_sort) as Column & { format?: (row: Row) => string };
    for (const row of fixtureRows()) {
      const shown = openedAt.format!(row);
      expect(shown, `opening date of ${String(row.session_number)}`).toMatch(/\d/);
      expect(shown).not.toBe(String(row[list.default_sort]));
    }
  });

  it('filters the difference by range, like the module', () => {
    const table = mountDemo();
    const fixture = fixtureRows().filter((row) => row.difference != null);
    expect(fixture.length).toBeGreaterThan(0);
    const [row] = fixture;
    const value = Number(row.difference);
    table.dispatchEvent(new CustomEvent('filterChange', { detail: { col: 'difference', value: { min: value, max: value } } }));
    expect(table.rows.map((shown) => shown.id)).toEqual([row.id]);
    table.dispatchEvent(new CustomEvent('filterChange', { detail: { col: 'difference', value: { min: value + 1 } } }));
    expect(table.rows.map((shown) => shown.id)).not.toContain(row.id);
  });

  it('says what the module search box says, word for word', () => {
    const key = component.match(/\.searchPlaceholder=\$\{t\('ui\.(\w+)'\)\}/)?.[1];
    expect(key, 'the dashboard must name its search box through the catalogue').toBeTruthy();
    expect(es[key!]).toBeTruthy();
    const table = mountDemo();
    expect(table.searchable).toBe(true);
    expect(table.searchPlaceholder).toBe(es[key!]);
  });

  it('finds a session only through the columns the module searches', () => {
    const fixture = fixtureRows();
    const table = mountDemo();
    const terms = [...new Set(fixture.flatMap((row) => Object.values(row).map(String)))].filter((term) => term.trim().length >= 2);
    for (const term of terms) {
      const needle = term.toLocaleLowerCase('es');
      const expected = fixture
        .filter((row) => list.search.some((column) => String(row[column] ?? '').toLocaleLowerCase('es').includes(needle)))
        .map((row) => String(row.id));
      table.dispatchEvent(new CustomEvent('searchChange', { detail: term }));
      expect(new Set(table.rows.map((row) => String(row.id))), `searching «${term}»`).toEqual(new Set(expected));
    }
    // The status is picked in its filter, never typed in the box.
    table.dispatchEvent(new CustomEvent('searchChange', { detail: 'open' }));
    expect(table.rows).toEqual([]);
  });
});
