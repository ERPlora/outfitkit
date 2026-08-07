// Repo hygiene guard: `node_modules` must never be tracked by git (ERPlora/outfitkit#51).
//
// A self-referential `node_modules` symlink was committed twice (2026-07-16, 2026-08-02):
// `.gitignore` listed `node_modules/` with a trailing slash, and that form does not match a
// *symlink* with that name, so it stayed committable. Every fresh checkout then materialised
// the symlink, Vite could no longer resolve `lit/decorators.js` from `outfitkit/dist/`, and
// the Web Component tests of every consuming module failed 100%.
//
// Runs in CI (.github/workflows/ci.yml) and in the vitest suite
// (src/repo/assert-no-tracked-node-modules.test.ts).
// Usage: node scripts/assert-no-tracked-node-modules.mjs
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const repoRoot = process.cwd();
const NODE_MODULES_PATH = /(^|\/)node_modules(\/|$)/;

/** Every tracked path that is, or lives under, a `node_modules` entry. `null` outside a git checkout. */
function trackedNodeModules() {
  let files;
  try {
    files = execFileSync('git', ['ls-files', '-z'], { cwd: repoRoot, encoding: 'utf8' });
  } catch {
    // Not a git checkout (e.g. an npm tarball): there is no index to guard.
    return null;
  }
  return files.split('\0').filter((path) => path && NODE_MODULES_PATH.test(path));
}

/**
 * `.gitignore` must ignore `node_modules` *without* a trailing slash: with the slash the
 * pattern only matches directories, which is exactly how the symlink slipped in twice.
 */
function gitignoreCoversSymlinkForm() {
  const gitignore = resolve(repoRoot, '.gitignore');
  if (!existsSync(gitignore)) return false;
  return readFileSync(gitignore, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .includes('node_modules');
}

const tracked = trackedNodeModules();

if (tracked === null) {
  console.log('✓ no tracked node_modules (skipped: not a git checkout)');
  process.exit(0);
}

const problems = [];

if (tracked.length) {
  const listed = tracked.slice(0, 20).map((path) => `      ${path}`).join('\n');
  const rest = tracked.length > 20 ? `\n      … and ${tracked.length - 20} more` : '';
  problems.push(
    `${tracked.length} tracked path(s) under node_modules — a symlink or real dependencies got committed:\n` +
      `${listed}${rest}\n` +
      '    Fix: git rm --cached -r node_modules  (drops it from the index, keeps the real directory on disk)',
  );
}

if (!gitignoreCoversSymlinkForm()) {
  problems.push(
    '.gitignore has no bare `node_modules` line. `node_modules/` (trailing slash) only matches\n' +
      '    directories, so a symlink named node_modules stays committable.\n' +
      '    Fix: use `node_modules` without the trailing slash.',
  );
}

if (problems.length) {
  console.error(`✗ node_modules hygiene: ${problems.length} problem(s)`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}

console.log('✓ no tracked node_modules, and .gitignore covers the symlink form too');
