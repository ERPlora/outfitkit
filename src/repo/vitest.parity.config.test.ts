import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error The suite splitter is JavaScript: CI scripts consume it too.
import { splitTestFiles } from '../../scripts/test-suites.mjs';
import { loadViteConfig } from './test-suites.test.js';

const root = resolve(import.meta.dirname, '../..');

// The parity suite must EXIST and must be AUDIBLE: if it cannot run, it fails and says so. An
// invisible test is worse than no test (outfitkit#66).
describe('parity suite config', () => {
  it('includes exactly the marked tests and checks the checkouts before importing them', async () => {
    const config = await loadViteConfig('vitest.parity.config.ts');
    const { parity } = splitTestFiles(root) as { parity: string[] };

    expect([...config.test.include].sort()).toEqual([...parity].sort());
    expect(config.test.globalSetup ?? []).toContain('./scripts/assert-parity-checkouts.mjs');
  });

  it('the checkout guard THROWS; it never skips the suite nor lets it pass green', () => {
    const guard = readFileSync(resolve(root, 'scripts/assert-parity-checkouts.mjs'), 'utf8');
    expect(guard).toContain('throw new Error');
    expect(guard).not.toContain('process.exit(0)');
  });
});
