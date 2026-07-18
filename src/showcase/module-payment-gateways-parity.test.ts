import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-payment-gateways.html', import.meta.url);
const componentUrl = new URL(
  '../../../modules-workspace/modules/payment_gateways/ui/components/erp-payment-gateways-gateways/erp-payment-gateways-gateways.ts',
  import.meta.url,
);
const componentTestUrl = new URL(
  '../../../modules-workspace/modules/payment_gateways/ui/components/erp-payment-gateways-gateways/erp-payment-gateways-gateways.test.ts',
  import.meta.url,
);
const manifestUrl = new URL('../../../modules-workspace/modules/payment_gateways/module.json', import.meta.url);
const createSchemaUrl = new URL(
  '../../../modules-workspace/modules/payment_gateways/schemas/gateway_create.json',
  import.meta.url,
);

const component = readFileSync(componentUrl, 'utf8');
const componentTest = readFileSync(componentTestUrl, 'utf8');
const manifest = JSON.parse(readFileSync(manifestUrl, 'utf8')) as {
  queries?: Record<string, { list?: { page_size?: number; default_sort?: string; default_dir?: string } }>;
  commands?: Record<string, unknown>;
};
const createSchema = JSON.parse(readFileSync(createSchemaUrl, 'utf8')) as {
  required?: string[];
  properties?: Record<string, { enum?: string[]; default?: unknown }>;
};

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/payment_gateways/gateways').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-payment-gateways — paridad con payment_gateways real', () => {
  it('usa el shell Hub con Ionic iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/payment_gateways/gateways'");
    expect(page).toContain("title: 'Pasarelas de pago'");
    expect(page).toContain('<ok-data-table id="payment-gateways-table" fill>');
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce columnas, filtros y dominios cerrados del componente vigente', () => {
    const page = pageSource();

    for (const key of ['code', 'name', 'provider', 'is_test_mode', 'supports_refunds']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }

    const providers = createSchema.properties?.provider?.enum;
    expect(providers).toEqual(['stripe', 'redsys', 'paypal', 'manual', 'other']);
    for (const provider of providers ?? []) {
      expect(page).toContain(`value="${provider}"`);
      expect(page).toContain(`'${provider}'`);
    }
    expect(page).toContain("{ value: '1', label: 'test' }");
    expect(page).toContain("{ value: '0', label: 'live' }");
    expect(page).toContain("{ value: '1', label: 'Sí' }");
    expect(page).toContain("{ value: '0', label: 'No' }");
  });

  it('mantiene el contrato server-side y la vista responsive de tarjetas', () => {
    const page = pageSource();
    const list = manifest.queries?.['payment_gateways.gateways.list']?.list;

    expect(list).toMatchObject({ page_size: 50, default_sort: 'created_at', default_dir: 'desc' });
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'card-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar código, nombre o proveedor…'",
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'name'");
    expect(page).not.toContain("cardIcon = 'card-outline'");
  });

  it('parte de la pasarela canónica de la prueba oficial sin inventar registros', () => {
    const page = pageSource();
    const fixture = page.match(/const GATEWAY_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("id: 'g1', code: 'stripe-eu', name: 'Stripe UE', provider: 'stripe'");
    expect(fixture, 'GATEWAY_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'g1',
        code: 'stripe-eu',
        name: 'Stripe UE',
        provider: 'stripe',
        is_active: 1,
        is_test_mode: 1,
        supports_refunds: 1,
      },
    ]);
  });

  it('sitúa el alta Ionic dentro del panel create y conserva el payload seguro real', () => {
    const page = pageSource();

    expect(page).toContain('<form id="payment-gateway-form" slot="create"');
    expect(createSchema.required).toEqual(['code', 'name', 'provider']);
    for (const field of ['gateway-code', 'gateway-name', 'gateway-provider']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(manifest.commands).toHaveProperty('payment_gateways.gateways.create');
    for (const fragment of [
      "recordCommand('payment_gateways.gateways.create'",
      'is_test_mode: 1',
      "config: '{}'",
      'supports_refunds: 1',
      "supported_currencies: '[]'",
      'table.close()',
    ]) {
      expect(page).toContain(fragment);
    }
  });

  it('simula la consulta y todos los eventos de la barra sin inventar acciones de fila', () => {
    const page = pageSource();

    expect(manifest.queries).toHaveProperty('payment_gateways.gateways.list');
    expect(page).toContain("recordQuery('payment_gateways.gateways.list'");
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).not.toContain("addEventListener('rowAction'");
    expect(page).not.toContain('table.actions =');
  });
});
