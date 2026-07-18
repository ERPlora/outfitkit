import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const read = (file: string): string => {
  const url = new URL(file, base);
  expect(existsSync(url), `falta ${file}`).toBe(true);
  return readFileSync(url, 'utf8');
};

function expectDashboard(source: string, active: string): void {
  expect(source).toContain('<script src="./_ionic-config.js"></script>');
  expect(source.indexOf('./_ionic-config.js')).toBeLessThan(source.indexOf('@ionic/core'));
  expect(source).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
  expect(source).toContain(`active: '${active}'`);
  expect(source).not.toContain('./_page.js');
}

describe('showcase SaaS — cuenta, ajustes y ayuda actuales', () => {
  it('perfil conserva avatar, datos personales y seguridad con Ionic', () => {
    const source = read('profile-saas.html');
    expectDashboard(source, '/dashboard/profile/');
    for (const tag of ['ion-avatar', 'ion-input', 'ion-card', 'ion-button']) expect(source).toContain(`<${tag}`);
    expect(source).not.toMatch(/<\/?ok-[a-z-]+/);
  });

  it('preferencias mantiene localización, paleta, interfaz y avisos', () => {
    const source = read('settings-preferences.html');
    expectDashboard(source, '/dashboard/settings/');
    expect(source).toContain('<ok-theme-picker');
    expect(source).toContain('<ion-select');
    expect(source).toContain('<ion-toggle');
  });

  it('dispositivos conserva descargas, lista, revocar y aviso', () => {
    const source = read('settings-devices.html');
    expectDashboard(source, '/dashboard/settings/');
    expect(source).toContain('Descargar aplicaciones');
    expect(source).toContain('Revocar');
    expect(source).toContain('<ok-inline-feedback');
  });

  it('centro de ayuda conserva guías y acceso al soporte', () => {
    const source = read('settings-help.html');
    expectDashboard(source, '/dashboard/help/');
    expect(source).toContain('Guías de usuario');
    expect(source).toContain('Informar de un problema');
  });

  it('soporte usa el formulario Ionic real', () => {
    const source = read('help-support.html');
    expectDashboard(source, '/dashboard/help/');
    expect(source).toContain('<ion-input');
    expect(source).toContain('<ion-textarea');
    expect(source).toContain('<ok-inline-feedback');
  });

  it('documento mantiene índice, artículo y enlace al soporte', () => {
    const source = read('help-document.html');
    expectDashboard(source, '/dashboard/help/');
    expect(source).toContain('class="help-doc-content"');
    expect(source).toContain('Informar de un problema');
  });
});
