// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// @ts-expect-error Untyped JavaScript, like the rest of the repo scripts.
import { auditShowcaseFilters } from '../../scripts/showcase-filter-parity.mjs';

type Finding = { page: string; code: string; detail: string };

const root = resolve(import.meta.dirname, '../..');

/**
 * How many demos this sweep can compare TODAY.
 *
 * Only the demos that PAINT filter boxes have anything to compare, and all 43 of them now declare
 * the module query behind those boxes (outfitkit#118); the other 9 of the 52 published paint no
 * filter at all, so the number must still never be read as "all the demos". The floor is here so a
 * demo cannot quietly stop declaring its query and shrink the coverage in silence — the fast gate
 * holds the other end with `demo-filter-declaration-ratchet.test.ts`.
 */
const MAPPED_DEMOS = 43;

const audit = auditShowcaseFilters({
  pagesDirectory: resolve(root, 'showcase/pages'),
  modulesDirectory: resolve(root, '../modules-workspace/modules'),
}) as { findings: Finding[]; mapped: { page: string; queries: string[] }[]; unmapped: string[] };

describe('showcase filters ↔ real module manifests (outfitkit#116)', () => {
  // outfitkit#38 and outfitkit#114 were both this: a demo offering a filter the module had dropped.
  // Both were fixed by hand and came back, because the parity suite compares the manifest mirror
  // WRITTEN IN THE TEST, never what the demo paints.
  it('no demo offers a filter box its real module cannot apply', () => {
    expect(audit.findings.map((finding) => `${finding.page} [${finding.code}] ${finding.detail}`)).toEqual([]);
  });

  it('says how many demos it maps, so the coverage is never read as total', () => {
    const total = audit.mapped.length + audit.unmapped.length;
    console.info(
      `[filter-parity] ${audit.mapped.length} demos mapped against their module query; `
      + `${audit.unmapped.length} paint filters without declaring one — of ${total} with filter boxes`,
    );

    expect(audit.mapped.length).toBeGreaterThanOrEqual(MAPPED_DEMOS);
    for (const { page, queries } of audit.mapped) {
      expect(queries.length, page).toBeGreaterThan(0);
      for (const query of queries) expect(query, page).toMatch(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
    }
  });
});
