import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

describe('showcase Hub — páginas de listados actuales', () => {
  const employees = readPage('employees-list.html');
  const files = readPage('settings-file-browser.html');

  it('compone ambas vistas sobre el shell actual del Hub', () => {
    for (const page of [employees, files]) {
      expect(page).toContain("import { defineHubPage } from './_hub.js'");
      expect(page).not.toContain("from './_page.js'");
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('<ok-page-header');
    }

    expect(employees).toMatch(/defineHubPage\(\{[\s\S]*active:\s*'employees'/);
    expect(employees).toContain("title: 'Empleados'");
    expect(files).toMatch(/defineHubPage\(\{[\s\S]*active:\s*'files'/);
    expect(files).toContain("title: 'Archivos'");
  });

  it('reproduce EmployeesPage con ok-data-table como componente central', () => {
    expect(employees.match(/<ok-data-table\b/g)).toHaveLength(3);
    for (const id of ['staff-table', 'roles-table', 'api-keys-table']) {
      expect(employees).toContain(`id="${id}"`);
    }

    for (const tab of ['staff', 'users', 'roles', 'apikeys']) {
      expect(employees).toContain(`value="${tab}"`);
    }

    for (const feature of [
      "searchKeys: ['name', 'email', 'role']",
      "csvName: 'empleados'",
      "searchKeys: ['name', 'scope']",
      "csvName: 'roles'",
      'columnPicker = true',
      'pageSize = 10',
      "{ id: 'edit', label: 'Editar', icon: 'pencil' }",
      "{ id: 'delete', label: 'Borrar', icon: 'trash', color: 'danger' }",
    ]) {
      expect(employees).toContain(feature);
    }

    // Datos que existen hoy en EmployeesPage.vue; evita volver a introducir el tenant ficticio.
    expect(employees).toContain("name: 'Demo Admin'");
    expect(employees).toContain("name: 'Sara Díaz'");
    expect(employees).toContain("name: 'Administrador', scope: 'Sistema'");
    expect(employees).toContain('Array.from({ length: 58 }');
    expect(employees).not.toContain('Joan Castell');
    expect(employees).not.toContain('tenant-rambla');
    expect(employees).not.toContain('<ok-avatar');
    expect(employees).not.toContain('<ion-modal id="emp-modal"');
  });

  it('conserva las pestañas en el footer igual que AppPage', () => {
    expect(employees).toContain("footer: `");
    expect(employees).toContain('<ion-footer class="ion-no-border employees-footer">');
    expect(employees.indexOf('<ion-footer')).toBeLessThan(employees.indexOf('setup(doc)'));
    expect(employees).toContain('Empleados');
    expect(employees).toContain('Usuarios');
    expect(employees).toContain('Roles');
    expect(employees).toContain('API keys');
  });

  it('reproduce FilesPage con el gestor real y sin contenido de almacenamiento inventado', () => {
    expect(files.match(/<ok-file-manager\b/g)).toHaveLength(1);
    expect(files).toContain('<ok-file-manager id="file-manager" searchable uploadable>');
    expect(files).toContain('<ion-toast');
    expect(files).toContain('fileManager.folders = []');
    expect(files).toContain('fileManager.files = []');
    expect(files).toContain('fileManager.path = []');
    expect(files).toContain("fileManager.selected = ''");

    for (const event of [
      'ok-navigate',
      'ok-search',
      'ok-open',
      'ok-download',
      'ok-upload',
      'ok-delete',
      'ok-create-folder',
    ]) {
      expect(files).toContain(`'${event}'`);
    }

    for (const invented of ['tenant-rambla', 'FAC-2026-', 'TKT-2026-', 'backup-2026-', '1,8 GB']) {
      expect(files).not.toContain(invented);
    }
    expect(files).not.toContain('<ok-data-table');
  });
});
