import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-sales-list.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/sales/ui/components/erp-sales-list/erp-sales-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const locale = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/sales/locales/es.json', import.meta.url),
    'utf8',
  ),
) as { ui: Record<string, string> };
const documentMapperTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/sales/ui/lib/document-mappers.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/sales/sales').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-sales-sales — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/sales/sales'");
    expect(page).toContain("title: 'Ventas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('conserva las tres métricas y sus etiquetas del componente actual', () => {
    const page = pageSource();

    expect(component).toContain('private async loadStats()');
    expect(page.match(/class="sale-stat"/g)).toHaveLength(3);
    for (const key of ['tickets', 'revenue', 'avgTicket']) {
      expect(page).toContain(locale.ui[key]);
    }
    expect(page).toContain('updateStats()');
  });

  it('declara el mismo contrato server-side de erp-sales-list y su vista de tarjetas', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="sales-table" fill>');
    for (const key of ['sale_number', 'customer_name', 'payment_method_name', 'status', 'total']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'receipt-outline'",
      'searchable = true',
      `searchPlaceholder = '${locale.ui.searchSalePlaceholder}'`,
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain("id: 'document'");
    expect(page).not.toContain("cardTitle = 'sale_number'");
    expect(page).not.toContain("cardIcon = 'receipt-outline'");
  });

  it('parte de la venta canónica usada por el visor real, sin crear un catálogo ficticio', () => {
    const page = pageSource();
    const rows = page.match(/const SALE_PREVIEW_ROWS = (\[[\s\S]*?\n\s*\]);/);

    expect(documentMapperTest).toContain("sale_number: 'TICKET-2026-000004'");
    expect(documentMapperTest).toContain('total: 360');
    expect(documentMapperTest).toContain("payment_method_name: 'Efectivo'");
    expect(rows, 'SALE_PREVIEW_ROWS debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(rows![1])).toEqual([
      {
        id: 's1',
        sale_number: 'TICKET-2026-000004',
        status: 'completed',
        total: 360,
        customer_name: '',
        payment_method_name: 'Efectivo',
        created_at: '2026-07-16T19:00:30.884434990+00:00',
      },
    ]);
  });

  it('abre el documento en un modal Ionic y mantiene interacciones locales honestas', () => {
    const page = pageSource();

    expect(page).toContain('<ion-modal id="sale-document-modal"');
    expect(page).toContain('<ion-button id="sale-document-print"');
    expect(page).toContain('<ion-button id="sale-document-close"');
    expect(page).toContain('function openDocument(row)');
    for (const event of [
      'rowAction',
      'pageChange',
      'pageSizeChange',
      'sortChange',
      'searchChange',
      'filterChange',
    ]) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).not.toContain('csvImport');
    expect(page).not.toContain('addable = true');
  });
});
