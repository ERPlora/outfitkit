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
const esLocale = JSON.parse(
  readFileSync(new URL('../../../modules-workspace/modules/inventory/locales/es.json', import.meta.url), 'utf8'),
) as { ui: Record<string, string> };
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
    expect(page.match(/<ok-kpi/g)).toHaveLength(5);
    // The four stock KPIs are actionable links to the products view, like the component.
    expect(component).toContain("const productsHref = '/m/inventory/products'");
    expect(page.match(/<a href="\.\/module-inventory-products\.html"><ok-kpi/g)).toHaveLength(4);
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

  it('reproduce las cinco métricas y la tabla responsive del componente actual', () => {
    const page = pageSource();

    // Labels come from the module i18n catalog (ADR-0055); the demo shows the `es` strings.
    for (const [key, label] of [
      ['statsTracked', 'Productos seguidos'],
      ['statsInStock', 'En stock'],
      ['statsOutOfStock', 'Agotados'],
      ['statsLowStock', 'Stock bajo'],
      ['statsValue', 'Valor de existencias'],
    ] as const) {
      expect(component).toContain(`t('ui.${key}')`);
      expect(esLocale.ui[key]).toBe(label);
      expect(page).toContain(`label="${label}"`);
    }
    expect(esLocale.ui.statsValueAtCost).toBe('a coste');
    expect(page).toContain('delta="a coste"');
    // Partial valuation is surfaced, not hidden (products_without_cost).
    expect(component).toContain('products_without_cost > 0');
    expect(page).toContain('stats.products_without_cost > 0');

    for (const key of ['name', 'sku', 'stock', 'low_stock_threshold']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'views = true',
      'cardTitle = (row) =>',
      'pageSize = 5',
      'pageSizeOptions = []',
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain("table.addEventListener('pageChange'");
    expect(page).not.toContain('addable = true');
    // The current component defines no cardIcon for the low-stock table.
    expect(component).not.toContain('cardIcon');
    expect(page).not.toContain('cardIcon');
  });

  it('mantiene cerrado el contrato canónico de query/fixture sin alterar el módulo fuente', () => {
    const page = pageSource();

    // The legacy names (active_products/low_stock/total_value) are gone from the component:
    // the contract keys are the ones stats.sql projects, and the fixtures follow them.
    for (const legacyField of ['active_products', 'total_value']) {
      expect(component).not.toContain(legacyField);
      expect(statsFixture).not.toHaveProperty(legacyField);
    }
    for (const canonicalField of [
      'products_tracked',
      'products_in_stock',
      'products_out_of_stock',
      'products_low_stock',
      'products_without_cost',
      'total_inventory_value',
    ]) {
      expect(statsSql).toContain(canonicalField);
      expect(component).toContain(canonicalField);
      expect(statsFixture).toHaveProperty(canonicalField);
    }
    // low_stock.sql projects no price and only active physical products; p-8 stays at zero stock.
    expect(lowStockSql).toContain('is_active = 1');
    expect(lowStockSql).not.toMatch(/SELECT[^;]*\bprice\b/is);
    for (const row of lowStockFixture) {
      expect(row).not.toHaveProperty('price');
      expect(row).toHaveProperty('low_stock_threshold');
    }
    expect(lowStockFixture.some((row) => row.id === 'p-8')).toBe(true);
    // With the contract closed, the demo no longer documents divergences.
    expect(page).not.toContain('INVENTORY_CONTRACT_GAPS');
  });
});
