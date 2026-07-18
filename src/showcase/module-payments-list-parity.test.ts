import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-payments-list.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/payments/ui/components/erp-payments-list/erp-payments-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/payments/ui/components/erp-payments-list/erp-payments-list.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/payments/list').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-payments-list — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/payments/list'");
    expect(page).toContain("title: 'Pagos'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('declara las columnas, estados y acciones vigentes de erp-payments-list', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="payments-table" fill>');
    for (const key of ['reference', 'payment_date', 'beneficiary_name', 'amount', 'status']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const state of ['draft', 'approved', 'sent', 'completed', 'cancelled']) {
      expect(component).toContain(`value: '${state}'`);
      expect(page).toContain(`value: '${state}'`);
    }
    for (const action of ['advance', 'cancel']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('mantiene el contrato rico y responsive de la tabla actual', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'wallet-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar referencia o beneficiario…'",
      'pageSize = 50',
      "sort = 'payment_date'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'reference'");
    expect(page).not.toContain("cardIcon = 'wallet-outline'");
  });

  it('reutiliza exactamente los datos de prueba oficiales del módulo', () => {
    const page = pageSource();
    const methods = page.match(/const PAYMENT_METHODS = (\[[\s\S]*?\n\s*\]);/);
    const payments = page.match(/const PAYMENT_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("name: 'Transferencia'");
    expect(componentTest).toContain("reference: 'PAY-0001'");
    expect(methods, 'PAYMENT_METHODS debe quedar como JSON auditable').not.toBeNull();
    expect(payments, 'PAYMENT_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(methods![1])).toEqual([
      { id: 'm1', name: 'Transferencia', method_type: 'transfer', bank_account_ref: 'ES00', is_active: 1 },
      { id: 'm2', name: 'Caja', method_type: 'cash', bank_account_ref: '', is_active: 1 },
    ]);
    expect(JSON.parse(payments![1])).toEqual([
      {
        id: 'p1',
        reference: 'PAY-0001',
        payment_method_id: 'm1',
        payment_date: '2026-07-13',
        amount: '250.00',
        currency: 'EUR',
        beneficiary_name: 'Proveedor SL',
        beneficiary_iban: '',
        concept: 'Factura 12',
        status: 'draft',
        supplier_invoice_ref: '',
      },
    ]);
  });

  it('sitúa el alta Ionic dentro del panel create de la tabla', () => {
    const page = pageSource();

    expect(page).toContain('<form id="payment-create-form" slot="create"');
    expect(page).toContain('<ion-select id="payment-method"');
    expect(page).toContain('<ion-input id="payment-date"');
    expect(page).toContain('<ion-input id="payment-amount"');
    expect(page).toContain('<ion-input id="payment-beneficiary"');
    expect(page).toContain('<ion-input id="payment-concept"');
    expect(page).toContain('<ion-alert id="payment-cancel-alert"');
  });

  it('simula el controlador server-side y todas las transiciones reales sin inventar rutas', () => {
    const page = pageSource();

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
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("case 'draft':");
    expect(page).toContain("return 'approved'");
    expect(page).toContain("case 'approved':");
    expect(page).toContain("return 'sent'");
    expect(page).toContain("case 'sent':");
    expect(page).toContain("return 'completed'");
    expect(page).toContain("payment.status = 'cancelled'");
    expect(page).not.toMatch(/<ok-(?:kpi|stat|kanban|calendar)\b/);
  });
});
