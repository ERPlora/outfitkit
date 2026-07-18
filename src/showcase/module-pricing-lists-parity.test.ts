import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-pricing-lists.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/pricing/ui/components/erp-pricing-lists/erp-pricing-lists.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/pricing/ui/components/erp-pricing-lists/erp-pricing-lists.test.ts',
  import.meta.url,
);
const manifestUrl = new URL('../../../modules-workspace/modules/pricing/module.json', import.meta.url);
const localeUrl = new URL('../../../modules-workspace/modules/pricing/locales/es.json', import.meta.url);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as {
  queries?: Record<string, unknown>;
  commands?: Record<string, unknown>;
};
const locale = JSON.parse(readFileSync(localeUrl, 'utf8')) as {
  navigation?: { lists?: { label?: string } };
  ui?: Record<string, unknown>;
};

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/pricing/lists').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-pricing-lists — paridad con pricing real', () => {
  it('usa el shell Hub con Ionic iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(locale.navigation?.lists?.label).toBe('Tarifas');
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/pricing/lists'");
    expect(page).toContain("title: 'Tarifas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce las dos tablas, columnas, tarjetas y paginación del componente actual', () => {
    const page = pageSource();

    expect(page.match(/<ok-data-table\b/g)).toHaveLength(2);
    expect(page).toContain('<ok-data-table id="pricing-lists-table" fill>');
    expect(page).toContain('<ok-data-table id="pricing-rules-table" fill>');
    for (const key of ['code', 'name', 'currency', 'segment']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const key of ['rule_type', 'value', 'priority']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
      'searchable = true',
      "searchPlaceholder = 'Buscar código o nombre…'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('listsTable.cardTitle = (row) =>');
    expect(page).toContain("listsTable.cardIcon = () => 'pricetags-outline'");
    expect(page).toContain('rulesTable.cardTitle = (row) =>');
    expect(page).toContain("rulesTable.cardIcon = () => 'options-outline'");
    expect(page).not.toContain("cardTitle = 'name'");
  });

  it('parte únicamente de las dos filas canónicas de la prueba oficial', () => {
    const page = pageSource();
    const listsFixture = page.match(/const PRICE_LISTS_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    const rulesFixture = page.match(/const PRICING_RULES_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("code: 'BASE'");
    expect(componentTest).toContain("code: 'BLACK'");
    expect(listsFixture, 'PRICE_LISTS_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(rulesFixture, 'PRICING_RULES_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(listsFixture![1])).toEqual([
      {
        id: 'l1',
        code: 'BASE',
        name: 'Tarifa base',
        currency: 'EUR',
        is_default: 1,
        segment: 'retail',
      },
    ]);
    expect(JSON.parse(rulesFixture![1])).toEqual([
      {
        id: 'r1',
        code: 'BLACK',
        name: 'Black Friday',
        rule_type: 'percent',
        value: '10',
        priority: 1,
      },
    ]);
  });

  it('mantiene los filtros cerrados reales para segmento y tipo de regla', () => {
    const page = pageSource();

    expect(page).toContain("const SEGMENTS = ['customer', 'business', 'wholesale', 'retail']");
    expect(page).toContain("const RULE_TYPES = ['percent', 'fixed', 'buy_x_get_y', 'tiered']");
    expect(page).toContain("customer: 'Particular'");
    expect(page).toContain("percent: 'Porcentaje'");
    expect(page.match(/filterType: 'select'/g)).toHaveLength(2);
  });

  it('mantiene el alta real dentro del panel create de la primera tabla', () => {
    const page = pageSource();

    expect(manifest.commands).toHaveProperty('pricing.price_lists.create');
    expect(page).toContain('<form id="pricing-list-create-form" slot="create"');
    for (const field of ['pricing-list-code', 'pricing-list-name', 'pricing-list-currency']) {
      expect(page).toContain(`id="${field}"`);
    }
    for (const fragment of [
      "recordCommand('pricing.price_lists.create'",
      'segment: null',
      'is_default: false',
      'valid_from: null',
      'valid_until: null',
      'listsTable.close()',
    ]) {
      expect(page).toContain(fragment);
    }
    expect(page).not.toContain('<form id="pricing-rule-create-form"');
  });

  it('simula por separado los dos controladores server-side y todos sus eventos', () => {
    const page = pageSource();

    for (const query of ['pricing.price_lists.list', 'pricing.rules.list']) {
      expect(manifest.queries).toHaveProperty(query);
      expect(page).toContain(`'${query}'`);
    }
    expect(page).toContain('function createServerTableController(table, sourceRows, queryName)');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain("createServerTableController(listsTable, priceLists, 'pricing.price_lists.list')");
    expect(page).toContain("createServerTableController(rulesTable, pricingRules, 'pricing.rules.list')");
  });
});
