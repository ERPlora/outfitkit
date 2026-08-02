import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-invoice-list.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/invoice/ui/components/erp-invoice-list/erp-invoice-list.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/invoice/ui/components/erp-invoice-list/erp-invoice-list.test.ts',
  import.meta.url,
);
const manifestUrl = new URL('../../../modules-workspace/modules/invoice/module.json', import.meta.url);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as Record<string, unknown>;

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/invoice/invoice').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-invoice-invoice — paridad con el módulo real', () => {
  it('usa el shell Hub con Ionic iOS y deja ok-data-table como núcleo', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/invoice/invoice'");
    expect(page).toContain("title: 'Facturas'");
    expect(page).toContain('<ok-data-table id="invoice-table" fill>');
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table', 'ok-invoice']));
  });

  it('reproduce el contrato server-side, columnas, tarjetas y acciones de la lista actual', () => {
    const page = pageSource();

    for (const key of ['number', 'invoice_type', 'issue_date', 'customer_name', 'status', 'total_amount']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'document-text-outline'",
      'addable = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar número, cliente o estado…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    for (const action of ['view', 'paid', 'rectify']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
    expect(page).not.toContain("id: 'substitute'");
  });

  it('reutiliza la factura canónica de la prueba oficial como fuente auditable', () => {
    const page = pageSource();
    const fixture = page.match(/const INVOICE_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("number: 'FACT-0001'");
    expect(componentTest).toContain("customer_name: 'ACME'");
    expect(fixture, 'INVOICE_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'i1',
        invoice_type: 'F1',
        series: 'FACT',
        number: 'FACT-0001',
        issue_date: '2026-07-13',
        customer_name: 'ACME',
        customer_tax_id: 'B12345678',
        base_amount: 10000,
        tax_amount: 2100,
        total_amount: 12100,
        status: 'issued',
        source_type: 'manual',
      },
    ]);
  });

  it('mantiene el alta manual dentro del panel create y la experiencia de detalle fiscal', () => {
    const page = pageSource();

    expect(page).toContain('<form id="invoice-create-form" slot="create"');
    for (const field of ['invoice-series', 'invoice-customer', 'invoice-customer-tax-id', 'invoice-address', 'invoice-notes']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain('id="invoice-create-lines"');
    expect(page).toContain('id="invoice-add-line"');
    expect(page).toContain("emitInvoiceEvent('invoice.created'");

    expect(page).toContain('id="invoice-detail-page"');
    expect(page).toContain('id="invoice-detail-lines"');
    expect(page).toContain('id="invoice-detail-print"');
    expect(page).toContain('<ok-invoice id="invoice-print-document"');
    expect(page).toContain('id="invoice-rectify-card"');
    expect(page).toContain("emitInvoiceEvent('invoice.rectified'");
  });

  it('simula el controlador real y respeta las restricciones de pago y rectificación', () => {
    const page = pageSource();

    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("row.status !== 'issued'");
    expect(page).toContain("row.invoice_type.startsWith('R') || row.status === 'cancelled'");

    const commands = (manifest.commands ?? {}) as Record<string, unknown>;
    for (const command of ['invoice.create', 'invoice.mark_paid', 'invoice.rectify']) {
      expect(commands).toHaveProperty(command);
      expect(page).toContain(`'${command}'`);
    }
  });
});
