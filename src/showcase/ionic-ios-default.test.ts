import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error Catálogo JavaScript consumido directamente por el showcase.
import { PAGES } from '../../showcase/pages-data.js';

const IONIC_MODULE = 'https://cdn.jsdelivr.net/npm/@ionic/core/dist/ionic/ionic.esm.js';
const CONFIG_SCRIPT = '<script src="./_ionic-config.js"></script>';

describe('Ionic usa el estilo iOS por defecto', () => {
  it('define una única configuración compartida sin modo Material', () => {
    const config = readFileSync(resolve(process.cwd(), 'showcase/pages/_ionic-config.js'), 'utf8');
    expect(config).toContain("mode: 'ios'");
    expect(config).not.toMatch(/mode:\s*['"]md['"]/);
  });

  it('configura el showcase principal antes de registrar Ionic', () => {
    const index = readFileSync(resolve(process.cwd(), 'showcase/index.html'), 'utf8');
    expect(index).toContain('<script src="pages/_ionic-config.js"></script>');
    expect(index.indexOf('pages/_ionic-config.js')).toBeLessThan(index.indexOf(IONIC_MODULE));
  });

  it('toda página marcada current hereda iOS antes de cargar Ionic', () => {
    const currentPages = PAGES.filter(({ parity }: { parity: string }) => parity === 'current');
    for (const page of currentPages) {
      const html = readFileSync(resolve(process.cwd(), 'showcase', page.file), 'utf8');
      expect(html, page.id).toContain(CONFIG_SCRIPT);
      expect(html.indexOf('_ionic-config.js'), page.id).toBeLessThan(html.indexOf(IONIC_MODULE));
      expect(html, page.id).not.toMatch(/mode:\s*['"]md['"]/);
    }
  });
});
