// @vitest-environment happy-dom
// @suite parity — runs the Comandas and Historial demos of the showcase and holds their search box
// against the REAL kitchen module (`modules-workspace/modules/kitchen`). Parity job only (outfitkit#66).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// outfitkit#215 — kitchen#114 made Comandas search only by order number and destination (the status
// is picked in its filter) and kitchen#117 made Historial search only by order number and notes (the
// action is picked in its filter). The demos kept promising «estado» / «acción» in the box AND kept
// finding rows by them. These tests RUN each demo and compare the box text and what a search finds
// with the module's own catalogue and the `list.search` columns of its manifest.

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(resolve(here, path), 'utf8');

const moduleDir = '../../../modules-workspace/modules/kitchen/';
const es = (JSON.parse(read(`${moduleDir}locales/es.json`)) as { ui: Record<string, string> }).ui;
const manifest = JSON.parse(read(`${moduleDir}module.json`)) as {
  queries: Record<string, { list?: { search?: string[] } }>;
};

type Row = Record<string, unknown>;
type HubPage = { body: string; setup: (doc: Document) => void };
type Table = HTMLElement & { rows: Row[]; searchable?: boolean; searchPlaceholder?: string };

const demos = [
  {
    name: 'Comandas',
    page: '../../showcase/pages/module-kitchen-active.html',
    component: `${moduleDir}ui/components/erp-kitchen-orders-active/erp-kitchen-orders-active.ts`,
    tableId: 'kitchen-active-table',
    fixture: 'ORDER_FIXTURE',
    query: 'kitchen.orders.list',
  },
  {
    name: 'Historial',
    page: '../../showcase/pages/module-kitchen-history.html',
    component: `${moduleDir}ui/components/erp-kitchen-history/erp-kitchen-history.ts`,
    tableId: 'kitchen-history-table',
    fixture: 'LOG_FIXTURE',
    query: 'kitchen.logs.list',
  },
] as const;

let listeners = new AbortController();

afterEach(() => {
  listeners.abort();
  listeners = new AbortController();
  document.body.innerHTML = '';
});

/** Runs the page's module script with a `defineHubPage` that only captures the page. */
function mountDemo(pagePath: string, tableId: string): Table {
  const page = read(pagePath);
  const script = page.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  const importLine = "import { defineHubPage } from './_hub.js';";
  expect(script).toContain(importLine);
  let hubPage: HubPage | undefined;
  new Function('defineHubPage', script.replace(importLine, ''))((definition: HubPage) => {
    hubPage = definition;
  });
  document.body.innerHTML = hubPage!.body;
  hubPage!.setup(document);
  return document.getElementById(tableId) as Table;
}

function fixtureRows(pagePath: string, name: string): Row[] {
  const match = read(pagePath).match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} must stay auditable JSON`).not.toBeNull();
  return JSON.parse(match![1]) as Row[];
}

const stripAccents = (value: string): string => value.normalize('NFD').replace(/\p{M}/gu, '');
const fold = (value: string): string => stripAccents(value).toLocaleLowerCase('es');

function search(table: Table, term: string): string[] {
  table.dispatchEvent(new CustomEvent('searchChange', { detail: term }));
  return table.rows.map((row) => String(row.id));
}

describe.each(demos)('showcase kitchen $name — the search box is the module one', (demo) => {
  it('says what the module search box says, word for word', () => {
    const key = read(demo.component).match(/\.searchPlaceholder=\$\{t\('ui\.(\w+)'\)\}/)?.[1];
    expect(key, `${demo.component} must name its search box through the catalogue`).toBeTruthy();
    expect(es[key!]).toBeTruthy();

    const table = mountDemo(demo.page, demo.tableId);
    expect(table.searchable).toBe(true);
    expect(table.searchPlaceholder).toBe(es[key!]);
  });

  it('finds a row only through the columns the module searches', () => {
    const columns = manifest.queries[demo.query].list?.search;
    expect(columns, `${demo.query} must declare its list.search columns`).toBeTruthy();
    const fixture = fixtureRows(demo.page, demo.fixture);
    // Every value of every fixture field is tried as a search term: a value the module searches must
    // find exactly the rows that hold it there, and anything else (status, action, type, raw ids…)
    // must find nothing that a searched column does not also hold.
    const terms = [...new Set(fixture.flatMap((row) => Object.values(row).map(String)).filter((value) => value.trim()))];
    expect(terms.length).toBeGreaterThan(fixture.length);

    const table = mountDemo(demo.page, demo.tableId);
    const everything = search(table, '');
    expect(new Set(everything)).toEqual(new Set(fixture.map((row) => String(row.id))));
    for (const term of terms) {
      const needle = fold(term);
      const expected = fixture
        .filter((row) => columns!.some((column) => fold(String(row[column] ?? '')).includes(needle)))
        .map((row) => String(row.id));
      // The module search ignores case AND accents (hub#2096): «MESA», «ines» and «Inés» find the same.
      for (const variant of new Set([term, term.toLocaleUpperCase('es'), stripAccents(term)])) {
        expect(new Set(search(table, variant)), `searching «${variant}»`).toEqual(new Set(expected));
      }
    }
  });

  it('matches the search inside one column, never across two', () => {
    // The module ORs one match per searched column; a term made of the end of one column and the
    // start of the next is not in any of them.
    const [first, second] = manifest.queries[demo.query].list!.search!;
    const row = fixtureRows(demo.page, demo.fixture).find((candidate) => candidate[first] && candidate[second])!;
    const table = mountDemo(demo.page, demo.tableId);
    for (const glue of [' ', '']) {
      expect(search(table, `${String(row[first]).slice(-2)}${glue}${String(row[second]).slice(0, 2)}`)).toEqual([]);
    }
  });

  it('filters a text column ignoring case and accents, like the engine `like` filter', () => {
    const fixture = fixtureRows(demo.page, demo.fixture);
    const table = mountDemo(demo.page, demo.tableId);
    for (const column of manifest.queries[demo.query].list!.search!) {
      for (const row of fixture.filter((candidate) => String(candidate[column] ?? '').trim())) {
        const value = stripAccents(String(row[column])).toLocaleUpperCase('es');
        table.dispatchEvent(new CustomEvent('filterChange', { detail: { col: column, value } }));
        expect(table.rows.map((shown) => shown.id), `filtering ${column} by «${value}»`).toContain(row.id);
        table.dispatchEvent(new CustomEvent('filterChange', { detail: { col: column, value: '' } }));
      }
    }
  });

  it('keeps an accented value in a searched column, so the accent rule is exercised', () => {
    const columns = manifest.queries[demo.query].list!.search!;
    const accented = fixtureRows(demo.page, demo.fixture).some((row) =>
      columns.some((column) => stripAccents(String(row[column] ?? '')) !== String(row[column] ?? '')),
    );
    expect(accented).toBe(true);
  });
});
