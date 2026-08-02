import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const read = (file: string): string => {
  const url = new URL(file, base);
  expect(existsSync(url), `falta ${file}`).toBe(true);
  return readFileSync(url, 'utf8');
};

function expectIos(source: string): void {
  expect(source).toContain('<script src="./_ionic-config.js"></script>');
  expect(source.indexOf('./_ionic-config.js')).toBeLessThan(source.indexOf('@ionic/core'));
  expect(source).not.toMatch(/mode=["']md["']/);
}

describe('showcase SaaS — páginas públicas y errores actuales', () => {
  it.each([
    ['public-home.html', 'Inicio'],
    ['public-modules.html', 'Módulos'],
    ['public-module-detail.html', 'Punto de venta'],
    ['public-pricing.html', 'Precios'],
  ])('%s reutiliza el shell público actual', (file, title) => {
    const source = read(file);
    expectIos(source);
    expect(source).toContain("import { defineSaasPublicPage } from './_saas-public.js'");
    expect(source).toContain(title);
  });

  it('catálogo público conserva componentes propios que sí usa el producto', () => {
    const source = read('public-modules.html');
    expect(source).toContain('<ok-reveal');
    expect(source).toContain('<ok-cta-band');
    expect(source).toContain('<ion-button');
  });

  it('detalle público conserva tarjeta, planes, pestañas y CTA', () => {
    const source = read('public-module-detail.html');
    for (const tag of ['ion-card', 'ion-badge', 'ion-segment', 'ok-cta-band']) expect(source).toContain(`<${tag}`);
    for (const tab of ['overview', 'reviews', 'changelog']) expect(source).toContain(`value="${tab}"`);
  });

  it('precios reutiliza ok-pricing-card', () => {
    expect(read('public-pricing.html').match(/<ok-pricing-card/g)?.length).toBe(2);
  });

  it.each([
    ['errors-404.html', '404', 'No encontramos esta página'],
    ['errors-500.html', '500', 'Algo ha fallado'],
  ])('%s mantiene el error sencillo con Ionic', (file, code, heading) => {
    const source = read(file);
    expectIos(source);
    expect(source).toContain(code);
    expect(source).toContain(heading);
    expect(source).toContain('<ion-button');
    expect(source).not.toMatch(/<\/?ok-[a-z-]+/);
  });
});
