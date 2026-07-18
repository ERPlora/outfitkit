import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-staff-roles.html', import.meta.url);
const component = readFileSync(
  new URL('../../../modules-workspace/modules/staff/ui/components/erp-staff-roles/erp-staff-roles.ts', import.meta.url),
  'utf8',
);
const componentTest = readFileSync(
  new URL('../../../modules-workspace/modules/staff/ui/components/erp-staff-roles/erp-staff-roles.test.ts', import.meta.url),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/staff/roles').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-staff-roles — paridad con el módulo real', () => {
  it('usa Hub iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/staff/roles'");
    expect(page).toContain("title: 'Roles'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene las tres columnas y filtros reales', () => {
    const page = pageSource();
    for (const key of ['name', 'description', 'member_count']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("filterType: 'range'");
    expect(page).not.toContain('table.actions');
  });

  it('mantiene server-side, fill, alta y tarjetas responsive', () => {
    const page = pageSource();
    for (const property of [
      'serverSide = true', 'fill = true', 'addable = true', 'views = true',
      'cardTitle = (row) =>', "cardIcon = () => 'shield-outline'",
      "searchPlaceholder = 'Buscar roles…'", 'pageSize = 50', "sort = 'name'", "sortDir = 'asc'",
    ]) expect(page).toContain(property);
    expect(page).toContain('<form id="role-form" slot="create"');
    for (const id of ['role-name', 'role-description', 'role-color']) expect(page).toContain(`id="${id}"`);
  });

  it('reutiliza el rol Peluquero de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const ROLE_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("name: 'Peluquero'");
    expect(fixture).not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      { id: 'r1', name: 'Peluquero', description: 'Corte y color', color: '#aa0000', member_count: 2 },
    ]);
  });

  it('simula el listado y el alta con el contrato actual', () => {
    const page = pageSource();
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain("'staff.roles.create'");
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).not.toContain('rowAction');
  });
});
