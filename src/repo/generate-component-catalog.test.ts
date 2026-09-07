import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error The generator is JavaScript: it is loaded uncompiled, like the other repo guards.
import { renderComponentCatalog } from '../../scripts/generate-component-catalog.mjs';

// Guard for the catalog whoever WRITES a screen reads (outfitkit#126).
//
// `showcase/components-data.js` already holds the full registry — id, category, desc and api for
// every component — and `component-catalog-completeness.test.ts` keeps it from falling behind
// `src/components/`. But that file is ~2900 lines of live demos and fixture data: nobody reads it
// to answer "does a component for this already exist?", so the answer got copied by hand into the
// agent-facing skill instead. That copy drifted — three different totals (92 / 94 / 95) and five
// real components missing, two of them (`ok-calculator`, `ok-theme-picker`) predating the copy.
//
// So the short index is DERIVED, never written: this test regenerates it and fails if the
// committed file differs. An index that cannot be edited by hand cannot drift out of sync.
const CATALOG_PATH = resolve(process.cwd(), 'docs/COMPONENT-CATALOG.md');

/** Components dropped because Ionic covers the pattern — see `ionic-boundary.test.ts`. */
const REPLACED_BY_IONIC = [
  'ok-drawer',
  'ok-skeleton',
  'ok-date-picker',
  'ok-time-picker',
  'ok-range-dual',
];

describe('generated component catalog', () => {
  it('is committed, so readers get it without running the build', () => {
    expect(existsSync(CATALOG_PATH)).toBe(true);
  });

  it('matches what the generator produces right now', async () => {
    const committed = readFileSync(CATALOG_PATH, 'utf8');

    expect(committed).toBe(await renderComponentCatalog());
  });

  it('lists every component in src/components', async () => {
    const catalog = await renderComponentCatalog();
    const components = readdirSync(resolve(process.cwd(), 'src/components')).sort();

    expect(components.filter((id) => !catalog.includes(`\`${id}\``))).toEqual([]);
  });

  it('states the component count it actually lists', async () => {
    const catalog = await renderComponentCatalog();
    const components = readdirSync(resolve(process.cwd(), 'src/components'));

    // The hand-written copy claimed three different totals at once. The number is derived here.
    expect(catalog).toContain(`${components.length} componentes`);
  });

  it('never re-proposes a component Ionic replaced', async () => {
    const catalog = await renderComponentCatalog();

    for (const id of REPLACED_BY_IONIC) {
      expect(catalog.includes(`\`${id}\``), id).toBe(false);
    }
  });

  it('gives every component a one-line purpose, so the reader can choose without opening it', async () => {
    const catalog = await renderComponentCatalog();
    const entries = [...catalog.matchAll(/^- `(ok-[a-z0-9-]+)` — (.*)$/gm)];
    const components = readdirSync(resolve(process.cwd(), 'src/components'));

    expect(entries.length).toBe(components.length);
    expect(entries.filter(([, , purpose]) => purpose.trim().length === 0)).toEqual([]);
  });
});
