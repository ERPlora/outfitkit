// test-suites — who runs where (outfitkit#66).
//
// This repo has two kinds of test and only one of them can run on a clean runner:
//
//   · LIBRARY — reads files of THIS repo only (src/, showcase/, scripts/). It is the gate's
//     suite: hermetic, fast and always runnable.
//   · PARITY  — compares the showcase demos against the REAL code they reproduce, which lives in
//     sibling repos of the monorepo (`hub/`, `saas/`, `modules-workspace/modules/<id>`). Without
//     those checkouts these files blow up on import (ENOENT in their top-level `readFileSync`).
//
// Until outfitkit#66 the gate never called `npm test` at all: 471 tests that CI had never run,
// and nine files months in the red without anyone noticing. Plugging in a plain `vitest run`
// would have left the gate permanently red because of the parity ones.
//
// The split is an EXPLICIT MARKER in the file header — not a separate list, not a heuristic. A
// list drifts out of sync, and a heuristic gets it wrong both ways: some tests only NAME
// `modules-workspace` inside a text assertion and are perfectly hermetic, and some read another
// repo without writing that word at all (`resolve(cwd, '..', page.source)`). The marker lives
// where whoever opens the file can see it.
//
// And it does not depend on anyone remembering it: the `quality` job runs the library suite on a
// CLEAN runner, where the sibling repos do not exist. A test that reads another repo without the
// marker dies there, red and at once.

import { readFileSync, readdirSync } from 'node:fs';
import { relative, resolve } from 'node:path';

/** Header marker that sends a file to the parity suite. */
export const PARITY_MARKER = '@suite parity';

/** How many header lines are scanned. The marker is a DECLARATION, not any old mention. */
const HEADER_LINES = 10;

/**
 * Does this file declare itself part of the parity suite (i.e. does it read another repo)?
 *
 * Only the HEADER counts: if the bare string sufficed anywhere in the file, a test that talks
 * ABOUT the marker — such as this splitter's own test — would send itself to the other suite.
 * That happened for real while wiring this up.
 */
export function isParityTest(source) {
  return source.split('\n', HEADER_LINES).join('\n').includes(PARITY_MARKER);
}

/**
 * The repos the parity suite compares against, derived from the tests themselves.
 *
 * This is what CI's `parity` job clones. It is derived rather than hand-maintained on purpose: a
 * new test that compares against another repo brings its own clone along, and a retired one stops
 * dragging it. Paths are RELATIVE to the monorepo root, the way the tests write them
 * (`../../../<this>`), so the clone step can reproduce them verbatim.
 *
 * Only `modules-workspace/modules/`: `_retirados/` is a LOCAL archive, not a repo.
 */
export function listParityRepos(root) {
  const found = new Set();
  for (const file of splitTestFiles(root).parity) {
    const source = readFileSync(resolve(root, file), 'utf8');
    for (const [, id] of source.matchAll(/modules-workspace\/modules\/([a-z][a-z0-9_]*)/g)) {
      found.add(`modules-workspace/modules/${id}`);
    }
    for (const [, id] of source.matchAll(/['"`]\.\.\/\.\.\/\.\.\/(hub|saas)\//g)) {
      found.add(id);
    }
  }
  return [...found].sort();
}

/** The GitHub repo behind each path of `listParityRepos` (ERPlora/<name>). */
export function parityRepoName(path) {
  return path.startsWith('modules-workspace/modules/') ? path.split('/').pop() : path;
}

/** Every test file of the repo, as paths relative to the root, sorted. */
export function listTestFiles(root, directory = 'src') {
  const absolute = resolve(root, directory);
  const files = [];
  for (const entry of readdirSync(absolute, { withFileTypes: true })) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const child = resolve(absolute, entry.name);
    if (entry.isDirectory()) files.push(...listTestFiles(root, relative(root, child)));
    else if (entry.name.endsWith('.test.ts')) files.push(relative(root, child));
  }
  return files.sort();
}

/**
 * Splits the test files into the two suites. The union is ALWAYS the whole set and the
 * intersection always empty: no file is left without a suite to run in.
 */
export function splitTestFiles(root) {
  const library = [];
  const parity = [];
  for (const file of listTestFiles(root)) {
    (isParityTest(readFileSync(resolve(root, file), 'utf8')) ? parity : library).push(file);
  }
  return { library, parity };
}
