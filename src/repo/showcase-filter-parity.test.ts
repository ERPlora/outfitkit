import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

// The sweep stays in JavaScript: the CI clone step and the vitest configs consume it uncompiled,
// exactly like `test-suites.mjs`.
// @ts-expect-error Untyped JavaScript, like the rest of the repo scripts.
import { auditDemo, auditShowcaseFilters, listDemoQueryModules, readDemoFilterContract } from '../../scripts/showcase-filter-parity.mjs';

type Finding = { page: string; code: string; detail: string };

/** A demo page reduced to what the sweep reads: the query it binds and the columns it paints. */
function demoPage({ queries = '', columns = '' }: { queries?: string; columns?: string }): string {
  return `<script type="module">
      table.columns = [
${columns}
      ];
${queries}
    </script>`;
}

describe('what a showcase demo declares about its filters', () => {
  it('takes the list query the demo binds to its OWN table state', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });`,
    });

    expect(readDemoFilterContract(source).queries).toEqual(['taxes.categories.list']);
  });

  // The demos call several queries per page: the table's list, plus lookups that fill a select.
  // Only the one receiving the table state stands for the list the filter boxes talk to.
  it('ignores the queries called with fixed parameters, which are not behind the table', () => {
    const source = demoPage({
      queries: `        recordQuery('tables.tables.list', { ...state });
        recordQuery('tables.zones.list', { sort: 'sort_order', dir: 'asc' });`,
    });

    expect(readDemoFilterContract(source).queries).toEqual(['tables.tables.list']);
  });

  // Not every demo routes through `recordQuery`: module-verifactu-records dispatches a
  // `erplora:preview-query` event instead. What identifies the query is the table state, not the
  // helper that carries it.
  it('does not care HOW the query is sent, only that it carries the table state', () => {
    const source = demoPage({
      queries: `        doc.dispatchEvent(new CustomEvent('erplora:preview-query', { detail: { name: 'verifactu.records.list', params: { ...state } } }));`,
    });

    expect(readDemoFilterContract(source).queries).toEqual(['verifactu.records.list']);
  });

  it('collects every column the demo paints as filterable', () => {
    const source = demoPage({
      columns: `        { key: 'alias', header: 'Alias', sortable: true, filterable: true, filterType: 'text' },
        { key: 'source', header: 'Origen', filterable: true, filterType: 'select' },
        { key: 'created_at', header: 'Alta', sortable: true },`,
    });

    expect(readDemoFilterContract(source).filterableColumns).toEqual(['alias', 'source']);
  });

  // A `format` arrow closes a brace INSIDE the column object. Reading the column as "everything up
  // to the next `}`" loses the flag that comes after it — a false negative, which is the direction
  // that lets a lying filter through.
  it('still sees the flag when a formatter closes a brace before it', () => {
    const source = demoPage({
      columns: `        {
          key: 'is_system',
          header: 'Origen',
          options: [{ value: '1', label: 'Sistema' }],
          format: (row) => (Number(row.is_system) ? 'Sistema' : 'Propia'),
          filterable: true,
        },`,
    });

    expect(readDemoFilterContract(source).filterableColumns).toEqual(['is_system']);
  });
});

describe('a demo audited against the real module manifest', () => {
  const manifest = {
    queries: {
      'taxes.categories.list': { list: { filters: { key: {}, display_name: {} } } },
      'taxes.rules.get': {},
    },
  };

  // The whole point of the guard: outfitkit#38 and outfitkit#114 were this, twice.
  it('reports a filter box the module cannot apply', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });`,
      columns: `        { key: 'key', filterable: true },
        { key: 'is_active', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-categories.html', source, loadManifest: () => manifest }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['filter_not_declared']);
    expect(findings[0].detail).toContain('is_active');
  });

  it('stays silent when every filter box exists in the manifest', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });`,
      columns: `        { key: 'key', filterable: true },
        { key: 'display_name', filterable: true },
        { key: 'is_active', sortable: true },`,
    });

    expect(auditDemo({ page: 'module-taxes-categories.html', source, loadManifest: () => manifest })).toEqual([]);
  });

  it('reports a query the module no longer serves as a list', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.rules.get', { ...state });`,
      columns: `        { key: 'key', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-rules.html', source, loadManifest: () => manifest }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['query_without_list_block']);
  });

  // Two tables on one page cannot be told apart by reading the file, and guessing would compare
  // the columns of one against the filters of the other. It says so instead of inventing a pairing.
  it('refuses to guess when the demo binds two different queries', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });
        recordQuery('taxes.rules.list', { ...state });`,
      columns: `        { key: 'key', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-pages.html', source, loadManifest: () => manifest }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['ambiguous_table_query']);
  });

  it('reports a filterable flag that belongs to no column', () => {
    const source = demoPage({ columns: `        { filterable: true },` });

    const findings = auditDemo({ page: 'module-orphan.html', source, loadManifest: () => null }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['filterable_without_column_key']);
  });

  it('reports the missing checkout instead of passing for lack of anything to compare', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });`,
      columns: `        { key: 'key', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-categories.html', source, loadManifest: () => null }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['module_checkout_missing']);
  });

  // A demo with no filter boxes has nothing to lie about, so a missing checkout is not a finding.
  it('does not ask for a checkout the demo has no filters to compare against', () => {
    const source = demoPage({
      queries: `        recordQuery('printing.settings.get', { ...state });`,
    });

    expect(auditDemo({ page: 'module-printing-printing.html', source, loadManifest: () => null })).toEqual([]);
  });
});

describe('the modules the sweep needs cloned', () => {
  it('are derived from the demos themselves, so CI clones what the sweep reads', () => {
    const root = new URL('../..', import.meta.url).pathname;
    const modules = listDemoQueryModules(root) as string[];

    expect(modules.length).toBeGreaterThan(0);
    expect(modules).toEqual([...modules].sort());
    expect(new Set(modules).size).toBe(modules.length);
    for (const id of ['taxes', 'kitchen', 'verifactu']) expect(modules).toContain(id);
    for (const id of modules) expect(id, id).toMatch(/^[a-z][a-z0-9_]*$/);
  });
});

describe('the window that ties the table state to its query', () => {
  // The real pages fill their selects BEFORE binding the table, so a lookup's name sits above the
  // list's `{ ...state }` in the file. The window is short on purpose: the state is read as the
  // parameters of the query it follows, never of one further up. Widening it would hand the
  // table state to the lookup and lose the list.
  it('ignores a lookup called with fixed parameters even when it comes BEFORE the list', () => {
    const source = demoPage({
      queries: `        const zones = await recordQuery('tables.zones.list', { sort: 'sort_order', dir: 'asc' });
        zoneSelect.options = zones.rows.map((zone) => ({ value: zone.id, label: zone.name }));
        const page = await recordQuery('tables.tables.list', { ...state });`,
    });

    expect(readDemoFilterContract(source).queries).toEqual(['tables.tables.list']);
  });
});

describe('the coverage the sweep reports', () => {
  // A demo that binds a query but paints no filter box has nothing to check. Counting it as
  // "mapped" would inflate the coverage the parity test prints and the floor it holds.
  it('counts as mapped only the demos that paint filter boxes AND bind one query', () => {
    const root = mkdtempSync(join(tmpdir(), 'outfitkit-filter-coverage-'));
    try {
      const pages = join(root, 'pages');
      const modules = join(root, 'modules');
      mkdirSync(pages, { recursive: true });
      mkdirSync(join(modules, 'foo'), { recursive: true });
      writeFileSync(join(modules, 'foo', 'module.json'), JSON.stringify({
        queries: { 'foo.entries.list': { list: { filters: { code: {} } } }, 'foo.settings.get': {} },
      }));
      writeFileSync(join(pages, 'module-foo-list.html'), demoPage({
        queries: `        recordQuery('foo.entries.list', { ...state });`,
        columns: `        { key: 'code', filterable: true },`,
      }));
      writeFileSync(join(pages, 'module-foo-settings.html'), demoPage({
        queries: `        recordQuery('foo.settings.get', { ...state });`,
        columns: `        { key: 'code', sortable: true },`,
      }));
      writeFileSync(join(pages, 'module-foo-orphan.html'), demoPage({
        columns: `        { key: 'code', filterable: true },`,
      }));

      const audit = auditShowcaseFilters({ pagesDirectory: pages, modulesDirectory: modules });

      expect(audit.findings).toEqual([]);
      expect(audit.mapped).toEqual([{ page: 'module-foo-list.html', queries: ['foo.entries.list'] }]);
      expect(audit.unmapped).toEqual(['module-foo-orphan.html']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});

/**
 * Three demos publish SEVERAL tables on one screen, each backed by its own list query
 * (`module-pricing-lists`, `module-reservations-availability`, `module-schedules-hours`). Reading
 * the page as one table would compare the columns of one against the filters of the other, so the
 * pairing is read per table: the columns a table receives, and the query named on the line that
 * wires THAT table to its data.
 */
describe('a demo with several tables, each backed by its own query', () => {
  const twoTables = `<script type="module">
      listsTable.columns = [
        { key: 'code', filterable: true },
        { key: 'currency', filterable: true },
      ];
      rulesTable.columns = [
        { key: 'rule_type', filterable: true },
      ];
      createController(listsTable, priceLists, 'pricing.price_lists.list');
      createController(rulesTable, pricingRules, 'pricing.rules.list');
    </script>`;

  const pricing = {
    queries: {
      'pricing.price_lists.list': { list: { filters: { code: {}, currency: {} } } },
      'pricing.rules.list': { list: { filters: { rule_type: {} } } },
    },
  };

  it('reads the columns of each table apart, with the query that wires it', () => {
    const { tables } = readDemoFilterContract(twoTables) as {
      tables: { element: string; queries: string[]; filterableColumns: string[] }[];
    };

    expect(tables).toEqual([
      { element: 'listsTable', queries: ['pricing.price_lists.list'], filterableColumns: ['code', 'currency'] },
      { element: 'rulesTable', queries: ['pricing.rules.list'], filterableColumns: ['rule_type'] },
    ]);
  });

  it('stays silent when each table only filters by what ITS query declares', () => {
    expect(auditDemo({
      page: 'module-pricing-lists.html',
      source: twoTables,
      loadManifest: () => pricing,
    })).toEqual([]);
  });

  // The pairing earns its keep here: `rule_type` IS a filter of the page — of the other table.
  // Auditing the page as one would let it through.
  it('reports a filter box against the query of ITS OWN table, not of the neighbour', () => {
    const source = twoTables.replace("{ key: 'code', filterable: true },", "{ key: 'rule_type', filterable: true },");

    const findings = auditDemo({
      page: 'module-pricing-lists.html',
      source,
      loadManifest: () => pricing,
    }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['filter_not_declared']);
    expect(findings[0].detail).toContain('pricing.price_lists.list');
  });

  // Each table names its own module, so the checkout is looked up per query, not once per page.
  it('asks for the checkout of the module behind the table that is missing it', () => {
    const findings = auditDemo({
      page: 'module-pricing-lists.html',
      source: twoTables,
      loadManifest: (moduleId: string) => (moduleId === 'pricing' ? null : pricing),
    }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['module_checkout_missing', 'module_checkout_missing']);
  });

  it('still refuses to guess when a table with filter boxes names no query at all', () => {
    const source = twoTables.replace("createController(rulesTable, pricingRules, 'pricing.rules.list');", '')
      + `<script type="module">
        recordQuery('pricing.price_lists.list', { ...state });
        recordQuery('pricing.rules.list', { ...state });
      </script>`;

    const findings = auditDemo({
      page: 'module-pricing-lists.html',
      source,
      loadManifest: () => pricing,
    }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['ambiguous_table_query']);
  });
});
