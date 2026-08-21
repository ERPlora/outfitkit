import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

// @ts-expect-error The guard is JavaScript: vitest loads it as `globalSetup`, uncompiled.
import { assertParityCheckouts, setup } from '../../scripts/assert-parity-checkouts.mjs';

const created: string[] = [];

function monorepoRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'outfitkit-parity-guard-'));
  created.push(root);
  return root;
}

function addCheckout(root: string, path: string, withManifest = true): void {
  const directory = join(root, ...path.split('/'));
  mkdirSync(directory, { recursive: true });
  if (withManifest) writeFileSync(join(directory, 'module.json'), '{"id":"x"}');
}

afterEach(() => {
  for (const directory of created.splice(0)) rmSync(directory, { recursive: true, force: true });
});

// House rule: if a suite cannot run, the gate SAYS SO. It is never skipped (outfitkit#66). This
// guard is what enforces that for the parity suite.
describe('guard for the checkouts parity compares against', () => {
  it('THROWS, naming what is missing, when a compared repo is not alongside', () => {
    const root = monorepoRoot();
    addCheckout(root, 'modules-workspace/modules/customers');

    expect(() => assertParityCheckouts(root, ['modules-workspace/modules/customers', 'hub'])).toThrow(/hub/);
    expect(() => assertParityCheckouts(root, ['modules-workspace/modules/customers', 'hub'])).toThrow(/never skipped/);
  });

  it('THROWS when the directory exists but is empty: there is nothing to compare', () => {
    const root = monorepoRoot();
    mkdirSync(join(root, 'hub'), { recursive: true });
    expect(() => assertParityCheckouts(root, ['hub'])).toThrow(/hub/);
  });

  it('passes when every checkout the tests ask for is there', () => {
    const root = monorepoRoot();
    addCheckout(root, 'modules-workspace/modules/customers');
    addCheckout(root, 'hub');
    addCheckout(root, 'saas');
    expect(() => assertParityCheckouts(root, ['hub', 'modules-workspace/modules/customers', 'saas'])).not.toThrow();
  });

  // Vitest calls `setup` with ITS context as the first argument: if the guard took that for the
  // root to check, the suite would ALWAYS fail, even with the checkouts right there. It happened
  // while wiring this up, and that is why `setup` takes no parameters.
  it('setup() does not mistake vitest\'s argument for a path', () => {
    expect(setup.length).toBe(0);
    expect(() => setup({ provide: () => {} } as never)).not.toThrow(/\[object Object\]/);
  });
});
