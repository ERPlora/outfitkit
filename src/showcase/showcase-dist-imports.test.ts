// Every NAMED import a showcase page takes from a built bundle (`dist/<entry>.js`) must be an export
// of that bundle's source entry (outfitkit#274).
//
// A browser resolves ES module bindings before running a single line: one missing name and the
// whole <script type="module"> never runs, so the demo stays BLANK at every size. The POS demo
// imported `isCapable`/`toggle` from `dist/outfitkit.js`, which is built from `src/cdn.ts` — an
// entry that registered every component but re-exported none of the fullscreen helpers that
// `src/index.ts` does. The parity tests read the HTML as text and never caught it.
//
// The bundle → source map is read from vite.config.ts (both builds), and the exports come from the
// TypeScript checker, so `export *` and re-exports count exactly as the bundler sees them.

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import ts from 'typescript';

const ROOT = process.cwd();
const SHOWCASE = resolve(ROOT, 'showcase');

/** `dist/<file>.js` → `src/...ts`, from the `lib.entry` maps of both Vite configs. */
function distEntries(): Map<string, string> {
  const entries = new Map<string, string>();
  const entryPattern = /['"]?([\w.-]+)['"]?\s*:\s*resolve\(__dirname,\s*'([^']+)'\)/g;
  for (const config of ['vite.config.ts', 'vite.config.cdn.ts']) {
    const source = readFileSync(resolve(ROOT, config), 'utf8');
    for (const [, name, file] of source.matchAll(entryPattern)) entries.set(`${name}.js`, file);
  }
  return entries;
}

function showcaseFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return showcaseFiles(path);
    return /\.(html|js|mjs)$/.test(name) ? [path] : [];
  });
}

interface NamedImport {
  file: string;
  bundle: string;
  name: string;
}

/** `import { a, b as c } from '…/dist/<bundle>.js'` → one row per imported name. */
function namedDistImports(): NamedImport[] {
  const importPattern = /import\s*\{([^}]*)\}\s*from\s*['"](?:\.\.?\/)+dist\/([\w.-]+\.js)['"]/g;
  return showcaseFiles(SHOWCASE).flatMap((path) => {
    const file = relative(ROOT, path);
    return [...readFileSync(path, 'utf8').matchAll(importPattern)].flatMap(([, names, bundle]) =>
      names
        .split(',')
        .map((spec) => spec.trim().split(/\s+as\s+/)[0].trim())
        .filter(Boolean)
        .map((name) => ({ file, bundle, name })),
    );
  });
}

function exportsOf(sourceFile: string): Set<string> {
  const path = resolve(ROOT, sourceFile);
  const program = ts.createProgram([path], {
    target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    allowJs: true,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(path);
  const symbol = source && checker.getSymbolAtLocation(source);
  if (!symbol) return new Set();
  return new Set(
    checker
      .getExportsOfModule(symbol)
      // A page imports VALUES: a type-only export does not exist at run time.
      .filter((exported) => {
        const target = exported.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exported) : exported;
        return (target.flags & ts.SymbolFlags.Value) !== 0;
      })
      .map((exported) => exported.getName()),
  );
}

describe('showcase pages only import what the built bundles export (outfitkit#274)', () => {
  const imports = namedDistImports();
  const entries = distEntries();

  it('finds the named imports it guards (control: the POS demo imports the fullscreen helpers)', () => {
    expect(imports).toContainEqual({
      file: 'showcase/pages/module-sales-pos.html',
      bundle: 'outfitkit.js',
      name: 'isCapable',
    });
    expect(entries.get('outfitkit.js')).toBe('src/cdn.ts');
  });

  it('every named import exists in the source entry of its bundle', () => {
    const cache = new Map<string, Set<string>>();
    const missing = imports
      .filter(({ bundle, name }) => {
        const source = entries.get(bundle);
        if (!source) return true;
        if (!cache.has(source)) cache.set(source, exportsOf(source));
        return !cache.get(source)!.has(name);
      })
      .map(({ file, bundle, name }) => `${file}: '${name}' from dist/${bundle}`);
    expect(missing).toEqual([]);
  });
});
