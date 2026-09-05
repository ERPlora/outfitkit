// showcase-filter-parity — a demo may not offer a filter the real module cannot apply (outfitkit#116).
//
// The showcase publishes one demo page per module screen. Each one paints an `ok-data-table` whose
// columns can declare `filterable: true`, and each one names the module query it stands for. If the
// module drops a filter from that query, the demo keeps painting the box: the visitor sees a control
// that filters nothing, and whoever copies the demo into their module takes the defect with them.
//
// It has happened twice — outfitkit#38 and outfitkit#114 — and both times it was fixed by hand and
// came back, because nothing stopped it. The parity suite looks like the natural guard but is BLIND
// to this: it compares the manifest mirror WRITTEN IN THE TEST against the real manifest, never
// against what the demo paints. Putting the lying filter back into the categories demo while leaving
// the mirror right kept the suite at 236/236 green.
//
// So the pairing is read from the page itself:
//
//   · The query behind the table is the one the demo calls WITH THE TABLE STATE (`{ ...state }`).
//     Not the helper's name — some pages use `recordQuery`, `module-verifactu-records.html`
//     dispatches an `erplora:preview-query` event — but the state, which only the list gets. The
//     lookups that fill a select are called with fixed parameters and are not behind the table.
//   · Three demos publish SEVERAL tables on one screen, each with its own list behind it
//     (`module-pricing-lists`, `module-reservations-availability`, `module-schedules-hours`).
//     Reading those as one table would compare the columns of one against the filters of the
//     other, so the pairing is read PER TABLE: the columns a table receives in `<table>.columns`,
//     and the query named on the line that wires THAT table to its data. A table that names none
//     falls back to the page's single state-bound query, which is how the one-table demos declare.
//   · A column is filterable where a `filterable: true` follows a `key: '<name>'`. Reading the
//     column as "up to the next `}`" loses the flag when a `format` arrow closes a brace first,
//     and a false negative here is precisely what lets a lying filter through.
//
// Findings carry a CODE, not prose (ADR-0055): the tests assert on the code.

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

/** Demo pages of the showcase: one per module screen. */
export const DEMO_PAGE_PATTERN = /^module-.*\.html$/;

/**
 * A query name (`<module>.<entity>.<verb>`) followed by the table state.
 *
 * The window is short on purpose: the state must be the query's OWN parameters, not some other
 * `{ ...state }` further down the file.
 */
const STATE_BOUND_QUERY = /'([a-z_0-9]+(?:\.[a-z_0-9]+)+)'[\s\S]{0,60}?\{\s*\.\.\.state\b/g;

const COLUMN_KEY = /key:\s*'([a-zA-Z_0-9]+)'/g;
const FILTERABLE_FLAG = /filterable:\s*true/g;

/** `<table>.columns = [ … ]`, or `<table>.columns = <identifier>` when the array is named apart. */
const TABLE_COLUMNS = /([A-Za-z_$][\w$]*)\.columns\s*=\s*(\[|[A-Za-z_$][\w$]*)/g;

/** A query name (`<module>.<entity>.<verb>`) written as a string literal. */
const QUERY_NAME = /'([a-z_0-9]+(?:\.[a-z_0-9]+)+)'/g;

/** Index of the closing quote of the string opened at `start`, or the end of the source. */
function endOfString(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i += 1) {
    if (source[i] === '\\') { i += 1; continue; }
    if (source[i] === quote) return i;
  }
  return source.length - 1;
}

/**
 * The array literal that opens at `openIndex`, as `[start, end)`.
 *
 * Counting brackets naively would stop at the first `]` inside a string or a comment — a column
 * array cut short loses the flags below it, and a false negative is what lets a lying filter
 * through. Strings and comments are skipped whole; a template literal is skipped with whatever
 * `${…}` it carries, which is enough because no column array closes inside one.
 */
function arrayLiteralRange(source, openIndex) {
  let depth = 0;
  for (let i = openIndex; i < source.length; i += 1) {
    const char = source[i];
    if (char === "'" || char === '"' || char === '`') { i = endOfString(source, i); continue; }
    if (char === '/' && source[i + 1] === '/') { i = source.indexOf('\n', i); if (i === -1) break; continue; }
    if (char === '/' && source[i + 1] === '*') { i = source.indexOf('*/', i); if (i === -1) break; i += 1; continue; }
    if (char === '[') depth += 1;
    else if (char === ']') {
      depth -= 1;
      if (depth === 0) return [openIndex, i + 1];
    }
  }
  return [openIndex, source.length];
}

/** The columns a fragment paints as filterable, and the flags that belong to no column. */
function readColumns(text) {
  const keys = [...text.matchAll(COLUMN_KEY)];
  const filterableColumns = [];
  const orphanFlags = [];
  for (const flag of text.matchAll(FILTERABLE_FLAG)) {
    // The flag belongs to the column whose key it follows: the nearest `key:` before it.
    let owner = null;
    for (const key of keys) {
      if (key.index > flag.index) break;
      owner = key[1];
    }
    if (owner === null) orphanFlags.push(flag.index);
    else if (!filterableColumns.includes(owner)) filterableColumns.push(owner);
  }
  return { filterableColumns, orphanFlags };
}

/** Where each table's column array lives in the page, by the variable that receives it. */
function columnRanges(source) {
  const ranges = [];
  for (const match of source.matchAll(TABLE_COLUMNS)) {
    const [, element, target] = match;
    let open;
    if (target === '[') {
      open = source.indexOf('[', match.index);
    } else {
      const declaration = new RegExp(`(?:const|let|var)\\s+${target}\\s*=\\s*\\[`).exec(source);
      if (!declaration) continue;
      open = declaration.index + declaration[0].length - 1;
    }
    if (open === -1) continue;
    ranges.push({ element, range: arrayLiteralRange(source, open) });
  }
  return ranges;
}

/** An argument list with no call nested inside it: `(listsTable, rows, 'pricing.rules.list')`. */
const INNERMOST_CALL_ARGUMENTS = /\(([^()]*)\)/g;

/**
 * The queries wired to ONE table: those handed to a call that ALSO receives the table itself.
 *
 * The demos with several tables pass the query alongside the table to whatever drives it
 * (`createServerTableController(listsTable, priceLists, 'pricing.price_lists.list')`), so the
 * pairing is written where the wiring is. It has to be the same call and not merely the same line:
 * `table.csvName = 'clientes.csv'` sits on a line that names the table and reads as a query name.
 * Calls inside the table's own column array do not count either — a formatter there names no query.
 */
function queriesWiredTo(source, element, ranges) {
  const mentionsTable = new RegExp(`\\b${element}\\b`);
  const found = [];
  for (const call of source.matchAll(INNERMOST_CALL_ARGUMENTS)) {
    if (ranges.some(({ range }) => call.index >= range[0] && call.index < range[1])) continue;
    if (!mentionsTable.test(call[1])) continue;
    for (const [, name] of call[1].matchAll(QUERY_NAME)) if (!found.includes(name)) found.push(name);
  }
  return found;
}

/**
 * What a demo declares about its filters: the list queries it binds to its table, the columns it
 * paints as filterable — in the order they appear, with the flags that belong to no column
 * reported apart so the caller can say so instead of dropping them — and the same read PER TABLE,
 * for the demos that publish several lists on one screen.
 */
export function readDemoFilterContract(source) {
  const queries = [...new Set([...source.matchAll(STATE_BOUND_QUERY)].map(([, name]) => name))];
  const { filterableColumns, orphanFlags } = readColumns(source);

  const ranges = columnRanges(source);
  const tables = ranges.map(({ element, range }) => ({
    element,
    queries: queriesWiredTo(source, element, ranges),
    filterableColumns: readColumns(source.slice(range[0], range[1])).filterableColumns,
  }));

  return { queries, filterableColumns, orphanFlags, tables };
}

/**
 * Which query each filter box has to be checked against.
 *
 * A table that names its own query answers for its own columns; one that names none falls back to
 * the page's single state-bound query, which is how every one-table demo declares. What cannot be
 * attributed is reported rather than dropped: `ambiguous` when the page offers several queries and
 * nothing says which is which, `unattributed` when it offers none at all.
 */
export function attributeFilterColumns({ queries, filterableColumns, tables }) {
  const attributions = [];
  const ambiguous = [];
  const unattributed = [];
  const pending = [];
  const inTables = new Set();

  for (const table of tables) {
    if (!table.filterableColumns.length) continue;
    for (const column of table.filterableColumns) inTables.add(column);
    if (table.queries.length === 1) attributions.push({ query: table.queries[0], columns: table.filterableColumns });
    else if (table.queries.length > 1) ambiguous.push(table.queries);
    else pending.push(...table.filterableColumns);
  }
  // A flag painted outside any `<table>.columns` array still has to be checked: dropping it here
  // is the silent skip the guard exists to replace.
  pending.push(...filterableColumns.filter((column) => !inTables.has(column)));

  if (pending.length) {
    if (queries.length === 1) attributions.push({ query: queries[0], columns: pending });
    else if (queries.length > 1) ambiguous.push(queries);
    else unattributed.push(...pending);
  }
  return { attributions, ambiguous, unattributed };
}

/** The filter keys a manifest declares for a list query, or `null` if that query serves no list. */
export function declaredListFilters(manifest, query) {
  const list = manifest?.queries?.[query]?.list;
  return list ? Object.keys(list.filters ?? {}) : null;
}

/**
 * Audits ONE demo against the manifests of the modules it stands for.
 *
 * `loadManifest(moduleId)` returns `null` when that module checkout is not there. That is a finding
 * rather than a pass: a comparison that compares nothing is the silent skip this repo does not
 * allow (outfitkit#66). It is asked per query, not once per page, because a page may pair each of
 * its tables with a different list.
 */
export function auditDemo({ page, source, loadManifest }) {
  const contract = readDemoFilterContract(source);
  const findings = contract.orphanFlags.map(() => ({
    page,
    code: 'filterable_without_column_key',
    detail: 'a `filterable: true` belongs to no column: the filter box cannot be checked',
  }));

  if (!contract.filterableColumns.length) return findings;

  const { attributions, ambiguous } = attributeFilterColumns(contract);
  for (const candidates of ambiguous) {
    findings.push({
      page,
      code: 'ambiguous_table_query',
      detail: `the demo binds ${candidates.length} queries to a table state (${candidates.join(', ')}): `
        + 'which columns belong to which cannot be read from the page',
    });
  }

  for (const { query, columns } of attributions) {
    const moduleId = query.split('.')[0];
    const manifest = loadManifest(moduleId);
    if (!manifest) {
      findings.push({
        page,
        code: 'module_checkout_missing',
        detail: `no checkout of module '${moduleId}' to compare ${query} against`,
      });
      continue;
    }

    const declared = declaredListFilters(manifest, query);
    if (declared === null) {
      findings.push({
        page,
        code: 'query_without_list_block',
        detail: `the module no longer serves ${query} as a list, so it filters by nothing`,
      });
      continue;
    }

    for (const column of columns) {
      if (declared.includes(column)) continue;
      findings.push({
        page,
        code: 'filter_not_declared',
        detail: `the demo filters by '${column}' and ${query} does not declare it `
          + `(it declares: ${declared.join(', ') || 'no filter at all'})`,
      });
    }
  }
  return findings;
}

/** Every demo page of the showcase, by file name, sorted. */
export function listDemoPages(root) {
  return readdirSync(resolve(root, 'showcase/pages'))
    .filter((name) => DEMO_PAGE_PATTERN.test(name))
    .sort();
}

/**
 * The module ids the sweep needs cloned, derived from the demos themselves.
 *
 * CI's `parity` job clones what `test-suites.mjs#listParityRepos` derives from the test sources, and
 * this sweep names no module in its own source: it reads whichever the demos declare. A demo naming
 * a module no dedicated test compares against would otherwise arrive with nothing to compare to.
 */
export function listDemoQueryModules(root) {
  const modules = new Set();
  for (const page of listDemoPages(root)) {
    const source = readFileSync(resolve(root, 'showcase/pages', page), 'utf8');
    const contract = readDemoFilterContract(source);
    if (!contract.filterableColumns.length) continue;
    for (const { query } of attributeFilterColumns(contract).attributions) modules.add(query.split('.')[0]);
  }
  return [...modules].sort();
}

/**
 * Sweeps every demo of the showcase against the real modules.
 *
 * Returns the findings AND the coverage, because the coverage is smaller than it looks: only the
 * demos that paint filter boxes AND bind a query can be checked at all, and a number read as "all
 * of them" would turn this guard into the reassurance it exists to replace.
 */
export function auditShowcaseFilters({ pagesDirectory, modulesDirectory }) {
  const manifests = new Map();
  const loadManifest = (moduleId) => {
    if (!manifests.has(moduleId)) {
      const path = resolve(modulesDirectory, moduleId, 'module.json');
      manifests.set(moduleId, existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null);
    }
    return manifests.get(moduleId);
  };

  const findings = [];
  const mapped = [];
  const unmapped = [];
  for (const page of readdirSync(pagesDirectory).filter((name) => DEMO_PAGE_PATTERN.test(name)).sort()) {
    const source = readFileSync(resolve(pagesDirectory, page), 'utf8');
    const contract = readDemoFilterContract(source);
    // Coverage counts only the demos that have something to check: filter boxes. A demo that binds
    // a query but paints none would inflate the number the parity test prints and the floor it holds.
    if (contract.filterableColumns.length) {
      const { attributions, ambiguous, unattributed } = attributeFilterColumns(contract);
      if (ambiguous.length || unattributed.length) unmapped.push(page);
      else mapped.push({ page, queries: [...new Set(attributions.map(({ query }) => query))].sort() });
    }
    findings.push(...auditDemo({ page, source, loadManifest }));
  }
  return { findings, mapped, unmapped };
}
