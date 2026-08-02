import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-inventory-dashboard.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/inventory/ui/components/erp-inventory-dashboard/erp-inventory-dashboard.ts',
    import.meta.url,
  ),
  'utf8',
);
const statsSql = readFileSync(
  new URL('../../../modules-workspace/modules/inventory/queries/stats.sql', import.meta.url),
  'utf8',
);
const lowStockSql = readFileSync(
  new URL('../../../modules-workspace/modules/inventory/queries/low_stock.sql', import.meta.url),
  'utf8',
);
const statsFixture = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/inventory/fixtures/inventory.products.stats.json', import.meta.url),
    'utf8',
  ),
) as Record<string, unknown>;
const lowStockFixture = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/inventory/fixtures/inventory.products.low_stock.json', import.meta.url),
    'utf8',
  ),
) as Record<string, unknown>[];

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/inventory/dashboard').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-inventory-dashboard — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y reutiliza los componentes de dashboard de OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/inventory/dashboard'");
    expect(page).toContain("title: 'Inventario'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-kpi', 'ok-data-table']));
    expect(page.match(/<ok-kpi/g)).toHaveLength(4);
  });

  it('copia sin inventar los dos fixtures oficiales del dashboard', () => {
    const page = pageSource();
    const stats = page.match(/const STATS_FIXTURE = (\{[\s\S]*?\n\s*\});/);
    const lowStock = page.match(/const LOW_STOCK_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(stats, 'STATS_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(lowStock, 'LOW_STOCK_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(stats![1])).toEqual(statsFixture);
    expect(JSON.parse(lowStock![1])).toEqual(lowStockFixture);
  });

  it('reproduce las cuatro métricas y la tabla responsive del componente actual', () => {
    const page = pageSource();

    for (const label of ['Productos', 'Activos', 'Stock bajo', 'Valor inventario']) {
      expect(component).toContain(label);
      expect(page).toContain(`label="${label}"`);
    }
    for (const key of ['name', 'sku', 'stock', 'price']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'cube-outline'",
      'pageSize = 5',
      'pageSizeOptions = []',
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain("table.addEventListener('pageChange'");
    expect(page).not.toContain('addable = true');
  });

  it('deja explícitas las divergencias actuales de query/fixture sin alterar el módulo fuente', () => {
    const page = pageSource();

    expect(component).toContain('active_products?: number');
    expect(component).toContain('low_stock?: number');
    expect(component).toContain('total_value?: number');
    for (const canonicalField of ['products_in_stock', 'products_low_stock', 'total_inventory_value']) {
      expect(statsSql).toContain(canonicalField);
    }
    expect(lowStockSql).toContain('is_active = 1');
    expect(lowStockSql).not.toMatch(/SELECT[^;]*\bprice\b/is);
    expect(lowStockFixture.some((row) => row.id === 'p-8')).toBe(true);
    expect(page).toContain('const INVENTORY_CONTRACT_GAPS = Object.freeze({');
    expect(page).toContain("statsFields: 'fixture/component use legacy names; SQL exposes canonical widget names'");
    expect(page).toContain("lowStockRows: 'fixture contains price and p-8; SQL omits price and filters inactive products'");
    expect(page).toContain('void INVENTORY_CONTRACT_GAPS;');
  });
});
