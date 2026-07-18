import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-customers-groups.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-groups/erp-customers-groups.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-groups/erp-customers-groups.test.ts',
  import.meta.url,
);
const createSchemaUrl = new URL(
  '../../../modules-workspace/modules/customers/schemas/group_create.json',
  import.meta.url,
);
const updateSchemaUrl = new URL(
  '../../../modules-workspace/modules/customers/schemas/group_update.json',
  import.meta.url,
);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const createSchema = JSON.parse(readFileSync(createSchemaUrl, 'utf8')) as { required: string[] };
const updateSchema = JSON.parse(readFileSync(updateSchemaUrl, 'utf8')) as { required: string[] };

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/customers/groups').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-customers-groups — paridad con el módulo real', () => {
  it('usa el shell Hub y el modo iOS global sin crear wrappers redundantes', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/customers/groups'");
    expect(page).toContain("title: 'Grupos de clientes'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce las columnas, acciones y valores del fixture oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const GROUP_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    for (const key of ['name', 'description', 'discount_percent', 'customer_count', 'sort_order']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("{ id: 'edit', label: 'Editar', icon: 'create-outline' }");
    expect(page).toContain("{ id: 'delete', label: 'Eliminar', icon: 'trash-outline', color: 'danger' }");
    expect(componentTest).toContain("id: 'g1', name: 'VIP', description: 'Clientes VIP'");
    expect(fixture, 'GROUP_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'g1',
        name: 'VIP',
        description: 'Clientes VIP',
        discount_percent: 10,
        color: 'primary',
        sort_order: 1,
        is_active: 1,
        customer_count: 3,
      },
    ]);
  });

  it('mantiene ok-data-table como núcleo y su vista de tarjetas usa funciones', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="customer-groups-table" fill>');
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'people-outline'",
      'addable = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar grupo…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'name'");
    expect(page).not.toContain("cardIcon = 'people-outline'");
  });

  it('reutiliza el panel create para alta y edición con todos los campos de los schemas', () => {
    const page = pageSource();

    expect(page).toContain('<form id="customer-group-form" slot="create"');
    expect(page).toContain("table.open('create')");
    expect(page).toContain("id: 'edit'");
    expect(page).toContain("id: 'delete'");

    for (const field of createSchema.required) {
      expect(page).toContain(`id="customer-group-${field.replaceAll('_', '-')}"`);
    }
    for (const field of updateSchema.required.filter((field) => field !== 'group_id')) {
      expect(page).toContain(`id="customer-group-${field.replaceAll('_', '-')}"`);
    }

    expect(page).toContain("emitGroupCommand('customers.groups.create'");
    expect(page).toContain("emitGroupCommand('customers.groups.update'");
  });

  it('confirma el borrado con Ionic y simula todo el controlador server-side', () => {
    const page = pageSource();

    expect(page).toContain('<ion-alert id="customer-group-delete-alert"');
    expect(page).toContain("emitGroupCommand('customers.groups.delete'");
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
