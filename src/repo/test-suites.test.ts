import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// The suite splitter stays in JavaScript: vitest configs and CI scripts consume it, and those run
// uncompiled.
// @ts-expect-error JavaScript sin tipos, igual que el resto de scripts del repo.
import { PARITY_MARKER, isParityTest, listParityRepos, parityRepoName, listTestFiles, splitTestFiles } from '../../scripts/test-suites.mjs';

const root = resolve(import.meta.dirname, '../..');
const read = (file: string): string => readFileSync(resolve(root, file), 'utf8');

/**
 * Carga un config de vite por su RUTA, no por un `import` estático: importarlo con un especificador
 * literal lo mete en el programa de `tsc --noEmit`, y con él los tipos de vite/unplugin-icons, que
 * no son los de la librería. El typecheck del paquete no tiene por qué cargar con eso.
 */
export async function loadViteConfig(file: string): Promise<{
  test: { include: string[]; exclude: string[]; globalSetup?: string[] };
}> {
  const module = await import(/* @vite-ignore */ new URL(`../../${file}`, import.meta.url).href);
  return module.default;
}

describe('suite split (outfitkit#66)', () => {
  it('sends to parity ONLY what carries the header marker', () => {
    // The marker is COMPOSED: writing it literally here would send this very file to the other suite.
    expect(isParityTest(`// ${PARITY_MARKER} — reads the real module\nimport …`)).toBe(true);
    expect(isParityTest('import { describe } from "vitest";')).toBe(false);
  });

  it('splits EVERY test file into two suites, with no gaps and no overlap', () => {
    const all = listTestFiles(root) as string[];
    const { library, parity } = splitTestFiles(root) as { library: string[]; parity: string[] };

    expect(all.length).toBeGreaterThan(0);
    expect([...library, ...parity].sort()).toEqual([...all].sort());
    expect(library.filter((file) => parity.includes(file))).toEqual([]);
    expect(parity.length).toBeGreaterThan(0);
    expect(library.length).toBeGreaterThan(0);
  });

  // The real safety net is the CLEAN runner of the `quality` job (no sibling repos there), but a
  // test that writes the path outright is caught here, without waiting for CI to see it.
  it('no library-suite test writes a path into modules-workspace', () => {
    for (const file of splitTestFiles(root).library as string[]) {
      const code = read(file)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/(^|[^:])\/\/[^\n]*/g, '$1');
      expect(code, `${file} reads another repo: add the \`${PARITY_MARKER}\` marker to its header`)
        .not.toMatch(/['"`][^'"`]*\.\.\/modules-workspace/);
    }
  });

  it('the library config EXCLUDES exactly the parity ones: none falls off the map', async () => {
    const config = await loadViteConfig('vite.config.ts');
    const { parity } = splitTestFiles(root) as { parity: string[] };

    expect(config.test.include).toEqual(['src/**/*.test.ts']);
    for (const file of parity) expect(config.test.exclude).toContain(file);
    // And it excludes NOTHING from the library: over-excluding is the other way to lose a test.
    for (const file of splitTestFiles(root).library as string[]) {
      expect(config.test.exclude, file).not.toContain(file);
    }
  });

  it('the parity suite is exactly the one comparing against other repos', () => {
    const { parity } = splitTestFiles(root) as { parity: string[] };
    for (const file of parity) {
      expect(read(file), file).toContain(PARITY_MARKER);
    }
    // The 38 `module-*-parity` files + the page contract, which checks that the source of truth
    // of every published demo really exists in its repo.
    expect(parity).toContain('src/showcase/current-page-contract.test.ts');
    expect(parity.filter((file) => file.includes('module-')).length).toBeGreaterThan(30);
  });
});

// CI's `parity` job clones EXACTLY these repos. The list is derived from the tests themselves,
// never hand-maintained: a new test comparing against another repo brings its own clone along.
describe('repos the parity suite needs', () => {
  it('are derived from the tests and are real monorepo paths', () => {
    const repos = listParityRepos(root) as string[];

    expect(repos.length).toBeGreaterThan(20);
    expect(repos).toEqual([...repos].sort());
    expect(new Set(repos).size).toBe(repos.length);
    for (const path of repos) {
      expect(path, path).toMatch(/^(hub|saas|modules-workspace\/modules\/[a-z][a-z0-9_]*)$/);
    }
    for (const id of ['customers', 'kitchen', 'sales', 'staff', 'tables', 'taxes']) {
      expect(repos).toContain(`modules-workspace/modules/${id}`);
    }
    // The three found by simulating a clean runner: they read the Hub and the SaaS.
    expect(repos).toContain('hub');
    expect(repos).toContain('saas');
    // `_retirados/` is a LOCAL archive, not a repo: it must never reach the clone list.
    expect(repos.some((path) => path.includes('_retirados'))).toBe(false);
  });

  // The generic filter sweep (outfitkit#116) names no module in its own source: it reads whichever
  // the DEMOS declare. Without deriving from them too, a demo naming a module no dedicated test
  // compares against would reach CI with nothing to compare to — and no list to fix it in.
  it('include the modules the showcase demos declare, not only those a test names', () => {
    const root = mkdtempSync(join(tmpdir(), 'outfitkit-parity-repos-'));
    try {
      mkdirSync(join(root, 'src'), { recursive: true });
      mkdirSync(join(root, 'showcase', 'pages'), { recursive: true });
      writeFileSync(
        join(root, 'src', 'demo.test.ts'),
        `// ${PARITY_MARKER} — compares against the real module\nimport { it } from 'vitest';\n`,
      );
      writeFileSync(
        join(root, 'showcase', 'pages', 'module-foo-list.html'),
        `<script type="module">
          table.columns = [{ key: 'code', filterable: true }];
          recordQuery('foo.entries.list', { ...state });
        </script>`,
      );

      expect(listParityRepos(root)).toEqual(['modules-workspace/modules/foo']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('every path knows which organisation repo it comes from', () => {
    expect(parityRepoName('modules-workspace/modules/whatsapp_inbox')).toBe('whatsapp_inbox');
    expect(parityRepoName('hub')).toBe('hub');
    expect(parityRepoName('saas')).toBe('saas');
  });
});
