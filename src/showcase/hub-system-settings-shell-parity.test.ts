import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);

function page(file: string): string {
  const url = new URL(file, base);
  expect(existsSync(url), `falta ${file}`).toBe(true);
  return readFileSync(url, 'utf8');
}

function expectHubPage(source: string, active: string): void {
  expect(source).toContain('<script src="./_ionic-config.js"></script>');
  expect(source.indexOf('./_ionic-config.js')).toBeLessThan(source.indexOf('@ionic/core'));
  expect(source).toContain("import { defineHubPage } from './_hub.js'");
  expect(source).toContain(`active: '${active}'`);
  expect(source).not.toContain('./_page.js');
  expect(source).not.toContain('./_shell.css');
}

describe('showcase Hub — sistema, ajustes y shell actuales', () => {
  it('sistema mantiene recursos, documentos, copias y registros con tablas OutfitKit', () => {
    const source = page('system-index.html');
    expectHubPage(source, '/system');
    for (const tab of ['resources', 'updates', 'documents', 'backups', 'logs']) expect(source).toContain(`value="${tab}"`);
    expect(source).toContain('<ok-gauge');
    expect(source.match(/<ok-data-table/g)?.length).toBe(2);
    expect(source).toContain('<ok-status-pill');
  });

  it('ajustes conserva sus seis pestañas y usa controles Ionic', () => {
    const source = page('settings-hub.html');
    expectHubPage(source, '/settings');
    for (const tab of ['hub', 'store', 'tax', 'tickets', 'permissions', 'data']) expect(source).toContain(`value="${tab}"`);
    for (const tag of ['ion-select', 'ion-toggle', 'ion-input', 'ion-textarea', 'ion-segment']) expect(source).toContain(`<${tag}`);
    expect(source).not.toMatch(/<\/?ok-[a-z-]+/);
  });

  it('documentación conserva aviso, carga y host Swagger sin iframe', () => {
    const source = page('api-docs-hub.html');
    expectHubPage(source, '/api-docs');
    expect(source).toContain('<ok-inline-feedback');
    expect(source).toContain('<ion-spinner');
    expect(source).toContain('id="swagger-host"');
    expect(source).not.toContain('<iframe');
  });

  it('shell monta contenido de módulo y navegación secundaria', () => {
    const source = page('module-shell-hub.html');
    expectHubPage(source, '/apps');
    expect(source).toContain('id="module-outlet"');
    expect(source).toContain('<ok-data-table id="module-demo-table"');
    expect(source).toContain('id="module-tabs"');
    for (const tab of ['sales', 'settings', 'plan']) expect(source).toContain(`value="${tab}"`);
  });
});
