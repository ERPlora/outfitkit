import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-inventory-products.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/inventory/ui/components/erp-inventory-products/erp-inventory-products.ts',
    import.meta.url,
  ),
  'utf8',
);
const fixture = JSON.parse(
  readFileSync(
    new URL(
      '../../../modules-workspace/modules/inventory/fixtures/inventory.products.list.json',
      import.meta.url,
    ),
    'utf8',
  ),
) as Record<string, unknown>[];

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/inventory/products').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-inventory-products — paridad con el módulo real', () => {
  it('usa el shell Hub y deja ok-data-table como única pieza OutfitKit de la página', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/inventory/products'");
    expect(page).toContain("title: 'Productos'");
    expect(page).toContain('<ok-data-table id="inventory-products-table" fill>');

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("window.Ionic = { config: { mode: 'md' }");
  });

  it('declara el mismo contrato de tabla rica que erp-inventory-products', () => {
    const page = pageSource();

    for (const key of ['name', 'sku', 'price', 'stock', 'is_active']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'views = true',
      'columnPicker = true',
      'csv = true',
      "csvName = 'inventory-products.csv'",
      'addable = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar nombre o SKU…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }

    for (const action of ['detail', 'edit', 'delete']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('copia solo el fixture oficial y lo adapta a la frontera actual de céntimos', () => {
    const page = pageSource();
    const match = page.match(/const PRODUCT_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(match, 'PRODUCT_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(match![1])).toEqual(fixture);
    expect(page).toContain('price: Math.round(Number(row.price) * 100)');
    expect(page).toContain('cost: Math.round(Number(row.cost) * 100)');
  });

  it('reutiliza Ionic directo para el formulario y los modales del contrato real', () => {
    const page = pageSource();

    expect(page).toContain('<form id="inventory-product-form" slot="create"');
    expect(page).toContain('<ion-input id="product-name"');
    expect(page).toContain('<ion-input id="product-sku"');
    expect(page).toContain('<ion-input id="product-price"');
    expect(page).toContain('<ion-select id="product-tax-category"');
    expect(page).toContain('<ion-modal id="inventory-product-detail"');
    expect(page).toContain('<ion-modal id="inventory-import-tax-modal"');
    expect(page).toContain('<ion-segment id="inventory-import-tax-choice"');
  });

  it('conserva las interacciones de tabla sin añadir secciones ajenas al módulo', () => {
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
