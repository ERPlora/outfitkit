import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Repo hygiene guard: `node_modules` must never be tracked by git.
//
// A self-referential `node_modules` symlink was committed twice (2026-07-16 and 2026-08-02)
// because `.gitignore` listed `node_modules/` with a trailing slash, and that form does not
// match a *symlink* with that name. Every fresh checkout materialised it, Vite could then no
// longer resolve `lit/decorators.js` from `outfitkit/dist/`, and the Web Component tests of
// every module failed 100% with `Failed to resolve import "lit/decorators.js"`
// (ERPlora/outfitkit#51).
//
// The check itself lives in the script CI runs, so there is a single implementation.
const guardScript = resolve(process.cwd(), 'scripts/assert-no-tracked-node-modules.mjs');

describe('repo hygiene', () => {
  it('keeps node_modules out of the git index', () => {
    let output: string;
    try {
      output = execFileSync('node', [guardScript], { encoding: 'utf8', stdio: 'pipe' });
    } catch (error) {
      const { stdout = '', stderr = '' } = error as { stdout?: string; stderr?: string };
      throw new Error(`assert-no-tracked-node-modules failed:\n${stdout}${stderr}`);
    }

    expect(output).toContain('no tracked node_modules');
  });
});
