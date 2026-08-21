// assert-parity-checkouts — the door of the PARITY suite (outfitkit#66).
//
// Vitest `globalSetup`: it runs BEFORE a single test file is imported. The parity suite compares
// each showcase demo against the REAL code it reproduces, and that code lives in OTHER repos of
// the monorepo (`hub/`, `saas/`, `modules-workspace/modules/<id>`). If any of them is not next to
// us, the suite cannot compare anything — so it FAILS, and it says which one is missing.
//
// It never skips itself. An invisible test is worse than no test at all, and that silence is
// exactly the hole outfitkit#66 came to close: 471 tests CI never ran, with nine files months in
// the red without anyone noticing.

import { existsSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { listParityRepos } from './test-suites.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** The monorepo root: outfitkit/ and its sibling repos hang from here. */
export const MONOREPO_ROOT = resolve(repoRoot, '..');

/**
 * Checks that every checkout the suite needs is present.
 *
 * Kept apart from `setup` so it can be tested against a fake root: vitest calls `setup` with ITS
 * own context object as the first argument, so that slot cannot take a parameter.
 */
export function assertParityCheckouts(monorepoRoot, required) {
  const missing = required.filter((path) => {
    const directory = resolve(monorepoRoot, path);
    // An EMPTY directory is as useless as a missing one, and more treacherous: it would let the
    // suite pass without comparing anything.
    return !existsSync(directory) || readdirSync(directory).length === 0;
  });

  if (missing.length) {
    throw new Error(
      [
        'The parity suite cannot run: missing checkout of',
        ...missing.map((path) => `  · ${resolve(monorepoRoot, path)}`),
        '',
        'These tests compare each showcase demo against the REAL code it reproduces, and that',
        'code lives in another repo. Without the checkout there is nothing to compare against.',
        '',
        '  · Locally: work from the monorepo (outfitkit/ and its siblings under the same root).',
        '  · In CI: the `parity` job clones them; if you are reading this there, the clone step',
        '    failed or the token has no access to one of those repos.',
        '',
        'This suite is never skipped. An invisible test is worse than no test (outfitkit#66).',
      ].join('\n'),
    );
  }
}

/** `globalSetup` entry point. Vitest passes it its context; it is not used here. */
export function setup() {
  const required = listParityRepos(repoRoot);
  assertParityCheckouts(MONOREPO_ROOT, required);
  console.info(`[parity] ${required.length} checkouts available under ${MONOREPO_ROOT}`);
}
