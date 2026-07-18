import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-staff-members.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/staff/ui/components/erp-staff-members/erp-staff-members.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/staff/ui/components/erp-staff-members/erp-staff-members.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/staff/staff').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-staff-members — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y solo añade ok-data-table', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/staff/staff'");
    expect(page).toContain("title: 'Personal'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('conserva columnas, filtros cerrados y la única acción real', () => {
    const page = pageSource();
    for (const key of ['full_name', 'role_name', 'email', 'phone', 'status', 'hourly_rate']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("{ value: 'Peluquero', label: 'Peluquero' }");
    expect(page).toContain("{ value: 'Recepción', label: 'Recepción' }");
    expect(page).toContain("options: [{ value: 'active', label: 'Activo' }, { value: 'inactive', label: 'Inactivo' }]");
    expect(page).toContain("{ id: 'edit', label: 'Editar', icon: 'create-outline' }");
    expect(page).not.toContain("id: 'delete'");
  });

  it('mantiene server-side, fill, alta y tarjetas responsive', () => {
    const page = pageSource();
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'person-outline'",
      "searchPlaceholder = 'Buscar personal…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="staff-form" slot="create"');
    for (const id of ['staff-first-name', 'staff-last-name', 'staff-email', 'staff-role']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('reutiliza el miembro y los roles de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const STAFF_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    const roles = page.match(/const ROLE_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("full_name: 'Ana Ruiz'");
    expect(fixture).not.toBeNull();
    expect(roles).not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'm1', first_name: 'Ana', last_name: 'Ruiz', full_name: 'Ana Ruiz',
        email: 'ana@salon.es', phone: '600', role_id: 'r1', role_name: 'Peluquero',
        status: 'active', is_bookable: 1, hourly_rate: '12.00',
      },
    ]);
    expect(JSON.parse(roles![1])).toEqual([
      { id: 'r1', name: 'Peluquero' },
      { id: 'r2', name: 'Recepción' },
    ]);
  });

  it('simula lista, alta y edición y conecta también el tamaño de página', () => {
    const page = pageSource();
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain("'staff.members.create'");
    expect(page).toContain("'staff.members.update'");
    expect(page).toContain("table.open('create')");
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
