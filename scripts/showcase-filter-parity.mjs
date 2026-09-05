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

/**
 * What a demo declares about its filters: the list queries it binds to its table, and the columns
 * it paints as filterable — the latter in the order they appear, with the flags that belong to no
 * column reported as `null` so the caller can say so instead of dropping them.
 */
export function readDemoFilterContract(source) {
  const queries = [...new Set([...source.matchAll(STATE_BOUND_QUERY)].map(([, name]) => name))];

  const keys = [...source.matchAll(COLUMN_KEY)];
  const filterableColumns = [];
  const orphanFlags = [];
  for (const flag of source.matchAll(FILTERABLE_FLAG)) {
    // The flag belongs to the column whose key it follows: the nearest `key:` before it.
    let owner = null;
    for (const key of keys) {
      if (key.index > flag.index) break;
      owner = key[1];
    }
    if (owner === null) orphanFlags.push(flag.index);
    else if (!filterableColumns.includes(owner)) filterableColumns.push(owner);
  }

  return { queries, filterableColumns, orphanFlags };
}

/** The filter keys a manifest declares for a list query, or `null` if that query serves no list. */
export function declaredListFilters(manifest, query) {
  const list = manifest?.queries?.[query]?.list;
  return list ? Object.keys(list.filters ?? {}) : null;
}

/**
 * Audits ONE demo against the manifest of the module it stands for.
 *
 * `manifest` is `null` when the module checkout is not there. That is a finding rather than a pass:
 * a comparison that compares nothing is the silent skip this repo does not allow (outfitkit#66).
 */
export function auditDemo({ page, source, manifest }) {
  const { queries, filterableColumns, orphanFlags } = readDemoFilterContract(source);
  const findings = orphanFlags.map(() => ({
    page,
    code: 'filterable_without_column_key',
    detail: 'a `filterable: true` belongs to no column: the filter box cannot be checked',
  }));

  if (!filterableColumns.length) return findings;
  if (!queries.length) return findings;
  if (queries.length > 1) {
    return [...findings, {
      page,
      code: 'ambiguous_table_query',
      detail: `the demo binds ${queries.length} queries to a table state (${queries.join(', ')}): `
        + 'which columns belong to which cannot be read from the page',
    }];
  }

  const [query] = queries;
  if (!manifest) {
    return [...findings, {
      page,
      code: 'module_checkout_missing',
      detail: `no checkout of module '${query.split('.')[0]}' to compare ${query} against`,
    }];
  }

  const declared = declaredListFilters(manifest, query);
  if (declared === null) {
    return [...findings, {
      page,
      code: 'query_without_list_block',
      detail: `the module no longer serves ${query} as a list, so it filters by nothing`,
    }];
  }

  for (const column of filterableColumns) {
    if (declared.includes(column)) continue;
    findings.push({
      page,
      code: 'filter_not_declared',
      detail: `the demo filters by '${column}' and ${query} does not declare it `
        + `(it declares: ${declared.join(', ') || 'no filter at all'})`,
    });
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
    const { queries, filterableColumns } = readDemoFilterContract(source);
    if (!filterableColumns.length) continue;
    for (const query of queries) modules.add(query.split('.')[0]);
  }
  return [...modules].sort();
}

/**
 * Sweeps every demo of the showcase against the real modules.
 *
 * Returns the findings AND the coverage, because the coverage is smaller than it looks: only the
 * demos that bind a query can be checked at all, and a number read as "all of them" would turn this
 * guard into the reassurance it exists to replace.
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
    const { queries, filterableColumns } = readDemoFilterContract(source);
    const [query] = queries;
    if (queries.length === 1) mapped.push({ page, query });
    else if (filterableColumns.length) unmapped.push(page);
    findings.push(...auditDemo({
      page,
      source,
      manifest: query ? loadManifest(query.split('.')[0]) : null,
    }));
  }
  return { findings, mapped, unmapped };
}
