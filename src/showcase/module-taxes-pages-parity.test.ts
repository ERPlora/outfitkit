import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/taxes/', import.meta.url);

const pages = {
  categories: new URL('module-taxes-categories.html', base),
  rules: new URL('module-taxes-rules.html', base),
  aliases: new URL('module-taxes-aliases.html', base),
};

const components = {
  categories: readFileSync(new URL('ui/components/erp-taxes-categories/erp-taxes-categories.ts', moduleBase), 'utf8'),
  rules: readFileSync(new URL('ui/components/erp-taxes-rules/erp-taxes-rules.ts', moduleBase), 'utf8'),
  aliases: readFileSync(new URL('ui/components/erp-taxes-aliases/erp-taxes-aliases.ts', moduleBase), 'utf8'),
};

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  queries: Record<string, { list?: { page_size: number; filters: Record<string, unknown> } }>;
  commands: Record<string, unknown>;
};
const seed = readFileSync(new URL('seed/install.sqlite.sql', moduleBase), 'utf8');
const categorySchema = JSON.parse(readFileSync(new URL('schemas/category_create.json', moduleBase), 'utf8')) as {
  required: string[];
};
const ruleSchema = JSON.parse(readFileSync(new URL('schemas/rule_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { tax_type: { enum: string[] } };
};
const aliasSchema = JSON.parse(readFileSync(new URL('schemas/alias_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { source: { enum: string[] } };
};

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de taxes/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function jsonFixture(source: string, name: string): Record<string, unknown>[] {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} debe quedar como JSON auditable`).not.toBeNull();
  return JSON.parse(match![1]) as Record<string, unknown>[];
}

function expectSharedPageContract(page: string, route: string, title: string, tableId: string): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${tableId}" fill>`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toMatch(/mode=["']md["']/);

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  for (const property of [
    'serverSide = true',
    'fill = true',
    'addable = true',
    'views = true',
    'cardTitle = (row) =>',
    'cardIcon = () =>',
    'searchable = true',
    'pageSize = 50',
  ]) {
    expect(page).toContain(property);
  }
  expect(page).not.toMatch(/cardTitle\s*=\s*['"]/);
  expect(page).not.toMatch(/cardIcon\s*=\s*['"]/);
  for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
    expect(page).toContain(`addEventListener('${event}'`);
  }
}

describe('showcase taxes — contrato común real del módulo', () => {
  it('usa Hub + Ionic iOS y deja ok-data-table como única pieza OutfitKit', () => {
    expectSharedPageContract(pageSource('categories'), '/m/taxes/categories', 'Categorías fiscales', 'taxes-categories-table');
    expectSharedPageContract(pageSource('rules'), '/m/taxes/rules', 'Reglas por jurisdicción', 'taxes-rules-table');
    expectSharedPageContract(pageSource('aliases'), '/m/taxes/aliases', 'Alias de categorías', 'taxes-aliases-table');
  });
});

describe('showcase module-taxes-categories — paridad con categories real', () => {
  it('reproduce columnas, filtros, orden y alta fiscal sin acciones inventadas', () => {
    const page = pageSource('categories');
    const list = manifest.queries['taxes.categories.list'].list!;
    for (const key of ['key', 'name', 'description', 'is_system', 'is_active']) {
      expect(components.categories).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    expect(Object.keys(list.filters)).toEqual(['key', 'name', 'is_system', 'is_active']);
    expect(page).toContain("sort: 'name'");
    expect(page).toContain("searchPlaceholder = 'Buscar clave o nombre…'");
    expect(page).toContain("cardIcon = () => 'calculator-outline'");
    expect(page).not.toContain('table.actions =');
    expect(page).not.toContain("addEventListener('rowAction'");

    expect(categorySchema.required).toEqual(['key', 'name']);
    expect(page).toContain('<form id="taxes-category-form" slot="create"');
    for (const field of ['tax-category-key', 'tax-category-name', 'tax-category-description']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(manifest.commands).toHaveProperty('taxes.categories.create');
    expect(page).toContain("recordCommand('taxes.categories.create'");
    expect(page).toContain('table.close()');
  });

  it('parte de las seis categorías sembradas por el módulo', () => {
    const rows = jsonFixture(pageSource('categories'), 'CATEGORY_FIXTURE');
    expect(rows.map((row) => row.key)).toEqual([
      'restaurant.food', 'restaurant.drink', 'restaurant.alcohol',
      'restaurant.delivery', 'service.generic', 'product.generic',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.key}'`);
      expect(row.is_system).toBe(1);
      expect(row.is_active).toBe(1);
    }
  });
});

describe('showcase module-taxes-rules — paridad con rules real', () => {
  it('reproduce columnas, filtros cerrados, alta y única acción de desactivar', () => {
    const page = pageSource('rules');
    const list = manifest.queries['taxes.rules.list'].list!;
    for (const key of [
      'tax_category_key', 'country_code', 'region_code', 'rate_pct',
      'tax_type', 'valid_from', 'valid_to', 'is_active',
    ]) {
      expect(components.rules).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    expect(Object.keys(list.filters)).toEqual([
      'country_code', 'region_code', 'tax_category_key', 'rate_pct',
      'tax_type', 'parent_id', 'is_active',
    ]);
    expect(page).toContain("sort: 'country_code'");
    expect(page).toContain("cardIcon = () => 'options-outline'");
    expect(page).toContain("table.actions = [{ id: 'deactivate'");
    expect(page).not.toMatch(/id:\s*['"](?:edit|delete|duplicate)['"]/);
    expect(page).toContain("recordCommand('taxes.rules.deactivate', { rule_id: row.id })");

    expect(ruleSchema.required).toEqual(['country_code', 'tax_category_key', 'rate_pct']);
    expect(ruleSchema.properties.tax_type.enum).toEqual([
      'vat', 'surcharge', 'sales_tax', 'withholding', 'excise', 'import_duty',
    ]);
    expect(page).toContain('<form id="taxes-rule-form" slot="create"');
    for (const field of [
      'tax-rule-country', 'tax-rule-region', 'tax-rule-category', 'tax-rule-rate',
      'tax-rule-type', 'tax-rule-valid-from', 'tax-rule-valid-to',
      'tax-rule-parent', 'tax-rule-component-label',
    ]) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain("recordCommand('taxes.rules.create'");
  });

  it('parte exactamente de las seis reglas IVA sembradas', () => {
    const rows = jsonFixture(pageSource('rules'), 'RULE_FIXTURE');
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => `${row.country_code}|${row.tax_category_key}|${row.rate_pct}`)).toEqual([
      'ES|product.generic|21', 'ES|service.generic|21', 'ES|restaurant.food|10',
      'ES|restaurant.drink|10', 'ES|restaurant.delivery|10', 'ES|restaurant.alcohol|21',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.tax_category_key}'`);
      expect(row.tax_type).toBe('vat');
      expect(row.valid_from).toBe('2012-09-01');
      expect(row.is_active).toBe(1);
    }
  });
});

describe('showcase module-taxes-aliases — paridad con aliases real', () => {
  it('reproduce columnas, dominios cerrados y alta aprendida sin acciones inventadas', () => {
    const page = pageSource('aliases');
    const list = manifest.queries['taxes.aliases.list'].list!;
    for (const key of ['alias', 'tax_category_key', 'source', 'is_active']) {
      expect(components.aliases).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    expect(Object.keys(list.filters)).toEqual(['alias', 'tax_category_key', 'source', 'is_active']);
    expect(page).toContain("sort: 'alias'");
    expect(page).toContain("cardIcon = () => 'link-outline'");
    expect(page).not.toContain('table.actions =');
    expect(page).not.toContain("addEventListener('rowAction'");

    expect(aliasSchema.required).toEqual(['alias', 'tax_category_key']);
    expect(aliasSchema.properties.source.enum).toEqual(['shipped', 'learned']);
    expect(page).toContain('<form id="taxes-alias-form" slot="create"');
    for (const field of ['tax-alias-value', 'tax-alias-category', 'tax-alias-source']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain("recordCommand('taxes.aliases.create'");
    expect(page).toContain("source: String(sourceInput.value || 'learned')");
  });

  it('parte exactamente de los catorce alias enviados con el módulo', () => {
    const rows = jsonFixture(pageSource('aliases'), 'ALIAS_FIXTURE');
    expect(rows.map((row) => row.alias)).toEqual([
      'food', 'prepared_food', 'meal', 'pizza', 'drink', 'beverage', 'soft_drink',
      'alcohol', 'beer', 'wine', 'delivery', 'service', 'product', 'goods',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.alias}'`);
      expect(row.source).toBe('shipped');
      expect(row.is_active).toBe(1);
    }
  });
});
