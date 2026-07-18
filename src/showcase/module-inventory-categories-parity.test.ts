import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-inventory-categories.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/inventory/ui/components/erp-inventory-categories/erp-inventory-categories.ts',
    import.meta.url,
  ),
  'utf8',
);
const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../../../modules-workspace/modules/inventory/fixtures/inventory.categories.list.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as Record<string, unknown>[];

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/inventory/categories').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-inventory-categories — paridad con el módulo real', () => {
  it('usa el shell Hub, Ionic iOS y ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/inventory/categories'");
    expect(page).toContain("title: 'Categorías'");
    expect(page).toContain('<ok-data-table id="inventory-categories-table" fill>');

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
  });

  it('copia sin inventar el fixture oficial de categorías', () => {
    const page = pageSource();
    const match = page.match(/const CATEGORY_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(match, 'CATEGORY_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(match![1])).toEqual(fixture);
  });

  it('reproduce el contrato rico y responsive de erp-inventory-categories', () => {
    const page = pageSource();

    for (const key of ['name', 'slug', 'product_count']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'views = true',
      'columnPicker = true',
      'csv = true',
      "csvName = 'inventory-categories.csv'",
      'addable = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar categoría…'",
      'pageSize = 25',
      "sort = 'name'",
      "sortDir = 'asc'",
      "cardTitle = (row) => String(row.name ?? '—')",
      "cardIcon = () => 'pricetags-outline'",
    ]) {
      expect(page).toContain(property);
    }

    for (const action of ['edit', 'delete']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('reutiliza Ionic directo para alta, edición y confirmación de borrado', () => {
    const page = pageSource();

    expect(page).toContain('<form id="inventory-category-form" slot="create"');
    expect(page).toContain('<ion-input id="category-name"');
    expect(page).toContain('<ion-input id="category-slug"');
    expect(page).toContain('<ion-select id="category-tax"');
    expect(page).toContain('<ion-alert id="inventory-category-delete"');
    expect(page).toContain("header: 'Eliminar categoría'");
    expect(page).toContain("text: 'Eliminar', role: 'destructive'");
    expect(page).toContain('editingId = row.id');
  });

  it('mantiene búsqueda, filtros, paginación, CSV y acciones de la tabla real', () => {
    const page = pageSource();

    for (const event of [
      'rowAction',
      'pageChange',
      'pageSizeChange',
      'sortChange',
      'searchChange',
      'filterChange',
      'csvImport',
    ]) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).not.toContain('<ok-kpi');
    expect(page).not.toContain('<ion-card');
    expect(page).not.toMatch(/ventas|pedidos|facturaci[oó]n/i);
  });
});
