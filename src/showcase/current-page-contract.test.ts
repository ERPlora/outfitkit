import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error El catálogo del showcase se mantiene en JavaScript para el navegador.
import { PAGES } from '../../showcase/pages-data.js';

describe('contrato de páginas con paridad actual', () => {
  const currentPages = PAGES.filter(({ parity }: { parity: string }) => parity === 'current');

  it('solo publica páginas con demo y fuente de verdad existentes', () => {
    for (const page of currentPages) {
      expect(page.file, page.id).toBeTruthy();
      expect(existsSync(resolve(process.cwd(), 'showcase', page.file)), page.file).toBe(true);
      expect(existsSync(resolve(process.cwd(), '..', page.source)), page.source).toBe(true);
    }
  });

  it('no permite que una página actual dependa del shell del prototipo antiguo', () => {
    for (const page of currentPages) {
      const source = readFileSync(resolve(process.cwd(), 'showcase', page.file), 'utf8');
      expect(source, page.id).not.toContain("from './_page.js'");
      expect(source, page.id).not.toContain('href="./_shell.css"');
    }
  });
});
