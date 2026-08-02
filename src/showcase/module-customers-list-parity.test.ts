import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-customers-list.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-list/erp-customers-list.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/customers/ui/components/erp-customers-list/erp-customers-list.test.ts',
  import.meta.url,
);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/customers/customers').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-customers-list — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y compone solo los dos componentes OutfitKit reales', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/customers/customers'");
    expect(page).toContain("title: 'Clientes'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table', 'ok-kpi']));
  });

  it('mantiene las cuatro KPIs que sí existen en erp-customers-list', () => {
    const page = pageSource();

    expect(component).toContain('private renderStats()');
    expect(page.match(/<ok-kpi\b/g)).toHaveLength(4);
    for (const label of ['Clientes', 'Activos', 'VIP', 'Ingresos']) {
      expect(page).toContain(`label="${label}"`);
    }
  });

  it('declara el contrato completo de ok-data-table, incluida la vista tarjetas funcional', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="customers-table" fill>');
    for (const key of ['name', 'email', 'phone', 'lifecycle_stage', 'total_spent']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'person-outline'",
      'addable = true',
      'columnPicker = true',
      'csv = true',
      "csvName = 'clientes.csv'",
      'searchable = true',
      "searchPlaceholder = 'Buscar nombre o email…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'name'");
    expect(page).not.toContain("cardIcon = 'person-outline'");
  });

  it('reutiliza el cliente de prueba oficial y no inventa una fuente de datos paralela', () => {
    const page = pageSource();
    const fixture = page.match(/const CUSTOMER_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("name: 'Ada Lovelace'");
    expect(fixture, 'CUSTOMER_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'c1',
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        phone: '600000000',
        tax_id: '',
        address: '',
        city: '',
        postal_code: '',
        country: '',
        notes: '',
        is_active: 1,
        lifecycle_stage: 'lead',
        source: 'walk_in',
        company_name: '',
        birthday: null,
        anniversary: null,
        preferred_channel: 'none',
        marketing_consent: 0,
        consent_date: null,
        total_purchases: 0,
        total_spent: 0,
        last_purchase_date: null,
      },
    ]);
  });

  it('cubre CRUD y CSV con formularios Ionic dentro de la experiencia de la tabla', () => {
    const page = pageSource();

    expect(page).toContain('<form id="customer-create-form" slot="create"');
    expect(page).toContain('<form id="customer-edit-form"');
    expect(page).toContain('<ion-input id="customer-create-name"');
    expect(page).toContain('<ion-select id="customer-edit-stage"');
    expect(page).toContain("id: 'view'");
    expect(page).toContain("id: 'delete'");
    expect(page).toContain("addEventListener('csvImport'");
    expect(page).toContain("emitCustomerEvent('customer.created'");
    expect(page).toContain("emitCustomerEvent('customer.updated'");
    expect(page).toContain("emitCustomerEvent('customer.deleted'");
    expect(page).toContain('const deleteHost = detailPage.hidden ? listPage : detailPage');
    expect(page).toContain('deleteHost.insertBefore(deleteConfirm');
  });

  it('simula el controlador server-side para todos los eventos de ok-data-table', () => {
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
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
