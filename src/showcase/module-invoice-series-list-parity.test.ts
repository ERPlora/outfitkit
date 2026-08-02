import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-invoice-series-list.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/invoice_series/ui/components/erp-invoice-series-list/erp-invoice-series-list.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/invoice_series/ui/components/erp-invoice-series-list/erp-invoice-series-list.test.ts',
  import.meta.url,
);
const manifestUrl = new URL('../../../modules-workspace/modules/invoice_series/module.json', import.meta.url);
const createSchemaUrl = new URL(
  '../../../modules-workspace/modules/invoice_series/schemas/series_create.json',
  import.meta.url,
);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as {
  queries?: Record<string, unknown>;
  commands?: Record<string, unknown>;
};
const createSchema = JSON.parse(readFileSync(createSchemaUrl, 'utf8')) as {
  required?: string[];
  properties?: Record<string, { enum?: string[] }>;
};

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/invoice_series/list').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-invoice-series-list — paridad con invoice_series real', () => {
  it('usa el shell Hub con Ionic iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/invoice_series/list'");
    expect(page).toContain("title: 'Series de numeración'");
    expect(page).toContain('<ok-data-table id="invoice-series-table" fill>');
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce el contrato server-side, columnas, tarjetas y paginación del componente', () => {
    const page = pageSource();

    for (const key of ['code', 'name', 'document_type', 'fiscal_year', 'current_sequence']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'bookmark-outline'",
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
      'searchable = true',
      "searchPlaceholder = 'Buscar código o nombre…'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain("`${row.code}${row.is_default ? '  ★' : ''}`");
  });

  it('usa los cinco tipos documentales cerrados y sus etiquetas reales', () => {
    const page = pageSource();
    const enumValues = createSchema.properties?.document_type?.enum;

    expect(enumValues).toEqual(['invoice', 'credit_note', 'proforma', 'receipt', 'quote']);
    for (const [value, label] of [
      ['invoice', 'Factura'],
      ['credit_note', 'Abono'],
      ['proforma', 'Proforma'],
      ['receipt', 'Recibo'],
      ['quote', 'Presupuesto'],
    ]) {
      expect(page).toContain(`${value}: '${label}'`);
      expect(page).toContain(`value="${value}"`);
    }
    expect(page).toContain("filterType: 'select'");
  });

  it('parte de la serie canónica de la prueba oficial sin inventar registros', () => {
    const page = pageSource();
    const fixture = page.match(/const SERIES_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("code: 'FA'");
    expect(componentTest).toContain("document_type: 'invoice'");
    expect(fixture, 'SERIES_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 's1',
        code: 'FA',
        name: 'Facturas',
        document_type: 'invoice',
        prefix: 'FA',
        fiscal_year: 2026,
        current_sequence: 12,
        is_default: 1,
        is_active: 1,
      },
    ]);
  });

  it('mantiene el alta dentro del panel create con el payload fiscal real', () => {
    const page = pageSource();

    expect(page).toContain('<form id="invoice-series-form" slot="create"');
    for (const field of [
      'series-code',
      'series-name',
      'series-prefix',
      'series-type',
      'series-country',
      'series-year',
    ]) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(createSchema.required).toEqual([
      'code',
      'name',
      'document_type',
      'prefix',
      'country_code',
      'fiscal_year',
    ]);
    for (const fragment of [
      "recordCommand('invoice_series.series.create'",
      "suffix: ''",
      "format: '{prefix}-{year}-{seq:05d}'",
      "region_code: ''",
      'is_default: 0',
      'table.close()',
    ]) {
      expect(page).toContain(fragment);
    }
  });

  it('simula consultas, acciones y recarga server-side sin falsear el contrato', () => {
    const page = pageSource();

    for (const query of ['invoice_series.series.list', 'invoice_series.series.peek_next']) {
      expect(manifest.queries).toHaveProperty(query);
      expect(page).toContain(`'${query}'`);
    }
    for (const command of [
      'invoice_series.series.create',
      'invoice_series.series.next_number',
      'invoice_series.series.set_default',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`'${command}'`);
    }
    for (const action of ['peek', 'next', 'default']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("actionId === 'next' && row.is_active");
    expect(page).toContain("actionId === 'default' && row.is_active && !row.is_default");
  });
});
