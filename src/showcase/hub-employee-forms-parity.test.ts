import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const hubSource = readFileSync(
  new URL('../../../hub/apps/web/src/views/EmployeeFormPage.vue', import.meta.url),
  'utf8',
);

function page(name: 'add' | 'edit'): string {
  const file = new URL(`employees-${name}.html`, pageBase);
  expect(existsSync(file)).toBe(true);
  return readFileSync(file, 'utf8');
}

function expectCurrentForm(source: string, title: string): void {
  expect(source).toContain('<script src="./_ionic-config.js"></script>');
  expect(source.indexOf('./_ionic-config.js')).toBeLessThan(source.indexOf('@ionic/core'));
  expect(source).toContain("import { defineHubPage } from './_hub.js'");
  expect(source).toContain(`title: '${title}'`);
  expect(source).toContain("backHref: '/employees'");
  for (const tag of ['ion-card', 'ion-input', 'ion-select', 'ion-select-option', 'ion-toggle', 'ion-button']) {
    expect(hubSource).toContain(`<${tag}`);
    expect(source).toContain(`<${tag}`);
  }
  for (const role of ['Administrador', 'Encargado', 'Cajero', 'Almacén']) {
    expect(source).toContain(role);
  }
  expect(source).not.toMatch(/<\/?ok-[a-z-]+/);
  expect(source).not.toContain('./_page.js');
  expect(source).not.toContain('./_shell.css');
}

describe('showcase Hub — formulario de empleados actual', () => {
  it('alta usa el mismo formulario Ionic sencillo que el Hub', () => {
    const source = page('add');
    expectCurrentForm(source, 'Nuevo empleado');
    expect(source).toContain('id="employee-create"');
  });

  it('edición reutiliza el formulario y los valores actuales', () => {
    const source = page('edit');
    expectCurrentForm(source, 'Editar empleado');
    expect(source).toContain('value="María García"');
    expect(source).toContain('value="maria@tienda.com"');
    expect(source).toContain('id="employee-save"');
  });
});
