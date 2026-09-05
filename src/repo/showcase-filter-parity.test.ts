import { describe, expect, it } from 'vitest';

// The sweep stays in JavaScript: the CI clone step and the vitest configs consume it uncompiled,
// exactly like `test-suites.mjs`.
// @ts-expect-error Untyped JavaScript, like the rest of the repo scripts.
import { auditDemo, listDemoQueryModules, readDemoFilterContract } from '../../scripts/showcase-filter-parity.mjs';

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

    const findings = auditDemo({ page: 'module-taxes-categories.html', source, manifest }) as Finding[];

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

    expect(auditDemo({ page: 'module-taxes-categories.html', source, manifest })).toEqual([]);
  });

  it('reports a query the module no longer serves as a list', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.rules.get', { ...state });`,
      columns: `        { key: 'key', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-rules.html', source, manifest }) as Finding[];

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

    const findings = auditDemo({ page: 'module-taxes-pages.html', source, manifest }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['ambiguous_table_query']);
  });

  it('reports a filterable flag that belongs to no column', () => {
    const source = demoPage({ columns: `        { filterable: true },` });

    const findings = auditDemo({ page: 'module-orphan.html', source, manifest: null }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['filterable_without_column_key']);
  });

  it('reports the missing checkout instead of passing for lack of anything to compare', () => {
    const source = demoPage({
      queries: `        recordQuery('taxes.categories.list', { ...state });`,
      columns: `        { key: 'key', filterable: true },`,
    });

    const findings = auditDemo({ page: 'module-taxes-categories.html', source, manifest: null }) as Finding[];

    expect(findings.map((finding) => finding.code)).toEqual(['module_checkout_missing']);
  });

  // A demo with no filter boxes has nothing to lie about, so a missing checkout is not a finding.
  it('does not ask for a checkout the demo has no filters to compare against', () => {
    const source = demoPage({
      queries: `        recordQuery('printing.settings.get', { ...state });`,
    });

    expect(auditDemo({ page: 'module-printing-printing.html', source, manifest: null })).toEqual([]);
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
