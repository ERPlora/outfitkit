import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-customers-tags.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-tags/erp-customers-tags.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-tags/erp-customers-tags.test.ts',
  import.meta.url,
);
const createSchemaUrl = new URL(
  '../../../modules-workspace/modules/customers/schemas/tag_create.json',
  import.meta.url,
);
const updateSchemaUrl = new URL(
  '../../../modules-workspace/modules/customers/schemas/tag_update.json',
  import.meta.url,
);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const createSchema = JSON.parse(readFileSync(createSchemaUrl, 'utf8')) as { required: string[] };
const updateSchema = JSON.parse(readFileSync(updateSchemaUrl, 'utf8')) as { required: string[] };

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/customers/tags').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-customers-tags — paridad con el módulo real', () => {
  it('usa el shell Hub y el modo iOS global sin crear componentes redundantes', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/customers/tags'");
    expect(page).toContain("title: 'Etiquetas de clientes'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce las columnas, acciones y etiqueta de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const TAG_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    for (const key of ['name', 'color']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("{ id: 'edit', label: 'Editar', icon: 'create-outline' }");
    expect(page).toContain("{ id: 'delete', label: 'Eliminar', icon: 'trash-outline', color: 'danger' }");
    expect(componentTest).toContain("id: 't1', name: 'Fiel', color: 'success', is_active: 1");
    expect(fixture, 'TAG_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      { id: 't1', name: 'Fiel', color: 'success', is_active: 1 },
    ]);
  });

  it('mantiene ok-data-table como núcleo y las tarjetas reciben funciones', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="customer-tags-table" fill>');
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'pricetag-outline'",
      'addable = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar etiqueta…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'name'");
    expect(page).not.toContain("cardIcon = 'pricetag-outline'");
  });

  it('reutiliza el panel create para alta y edición con el contrato de los schemas', () => {
    const page = pageSource();

    expect(page).toContain('<form id="customer-tag-form" slot="create"');
    expect(page).toContain("table.open('create')");

    for (const field of createSchema.required) {
      expect(page).toContain(`id="customer-tag-${field.replaceAll('_', '-')}"`);
    }
    for (const field of updateSchema.required.filter((field) => field !== 'tag_id')) {
      expect(page).toContain(`id="customer-tag-${field.replaceAll('_', '-')}"`);
    }

    expect(page).toContain("emitTagCommand('customers.tags.create'");
    expect(page).toContain("emitTagCommand('customers.tags.update'");
  });

  it('confirma el borrado con Ionic y simula el controlador server-side completo', () => {
    const page = pageSource();

    expect(page).toContain('<ion-alert id="customer-tag-delete-alert"');
    expect(page).toContain("emitTagCommand('customers.tags.delete'");
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
