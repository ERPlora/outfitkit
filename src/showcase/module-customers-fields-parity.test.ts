import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-customers-fields.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/customers/ui/components/erp-customers-fields/erp-customers-fields.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/customers/ui/components/erp-customers-fields/erp-customers-fields.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/customers/fields').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-customers-fields — paridad con el módulo real', () => {
  it('usa Hub iOS y reserva OutfitKit para el datatable', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/customers/fields'");
    expect(page).toContain("title: 'Campos'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('conserva columnas, filtros y acciones exactas', () => {
    const page = pageSource();
    for (const key of ['name', 'field_type', 'is_required', 'sort_order']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const type of ['text', 'number', 'date', 'boolean', 'select', 'textarea']) {
      expect(page).toContain(`value: '${type}'`);
    }
    expect(page).toContain("options: [{ value: '1', label: 'Sí' }, { value: '0', label: 'No' }]");
    expect(page).toContain("{ id: 'edit', label: 'Editar', icon: 'create-outline' }");
    expect(page).toContain("{ id: 'delete', label: 'Eliminar', icon: 'trash-outline', color: 'danger' }");
  });

  it('mantiene server-side, fill, alta y tarjetas responsive', () => {
    const page = pageSource();
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'addable = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'layers-outline'",
      "searchPlaceholder = 'Buscar campos…'",
      'pageSize = 50',
      "sort = 'sort_order'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="field-form" slot="create"');
    for (const id of ['field-name', 'field-type', 'field-options', 'field-order', 'field-required', 'field-active']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('reutiliza el campo Alergias de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const FIELD_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("name: 'Alergias'");
    expect(fixture).not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'f1',
        name: 'Alergias',
        field_type: 'text',
        options: '[]',
        is_required: 1,
        sort_order: 2,
        is_active: 1,
      },
    ]);
  });

  it('simula lista, alta, edición y borrado con los contratos reales', () => {
    const page = pageSource();
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    for (const command of ['customers.fields.create', 'customers.fields.update', 'customers.fields.delete']) {
      expect(page).toContain(`'${command}'`);
    }
    expect(page).toContain("table.open('create')");
    expect(page).toContain('id="field-delete-confirm"');
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
