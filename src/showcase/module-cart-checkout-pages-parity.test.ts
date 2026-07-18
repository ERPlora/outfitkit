import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/cart_checkout/', import.meta.url);

const pages = {
  carts: new URL('module-cart-checkout-carts.html', base),
  orders: new URL('module-cart-checkout-orders.html', base),
};

const components = {
  carts: readFileSync(
    new URL('ui/components/erp-cart-checkout-carts/erp-cart-checkout-carts.ts', moduleBase),
    'utf8',
  ),
  orders: readFileSync(
    new URL('ui/components/erp-cart-checkout-orders/erp-cart-checkout-orders.ts', moduleBase),
    'utf8',
  ),
};

const componentTest = readFileSync(
  new URL('ui/components/erp-cart-checkout-carts/erp-cart-checkout-carts.test.ts', moduleBase),
  'utf8',
);
const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  navigation: { id: string; label: string; component: string }[];
  queries: Record<string, { list?: { page_size: number; default_sort: string; default_dir: string } }>;
  commands: Record<string, unknown>;
};
const createSchema = JSON.parse(readFileSync(new URL('schemas/cart_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: Record<string, unknown>;
};
const failSchema = JSON.parse(readFileSync(new URL('schemas/order_fail.json', moduleBase), 'utf8')) as {
  required: string[];
};

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de cart_checkout/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function expectSharedContract(page: string, route: string, title: string, tableId: string): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${tableId}" fill`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toMatch(/mode=["']md["']/);

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  for (const property of [
    'serverSide = true',
    'fill = true',
    'views = true',
    'cardTitle = (row) =>',
    'cardIcon = () =>',
    'searchable = true',
    'pageSize = 50',
    "sort = 'created_at'",
    "sortDir = 'desc'",
  ]) {
    expect(page).toContain(property);
  }
  for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
    expect(page).toContain(`addEventListener('${event}'`);
  }
}

describe('showcase cart_checkout — navegación y base visual reales', () => {
  it('reproduce exactamente las dos páginas declaradas por el manifest', () => {
    expect(manifest.navigation).toEqual([
      { id: 'carts', label: 'Carts', icon: 'bag-check-outline', component: 'erp-cart-checkout-carts' },
      { id: 'orders', label: 'Orders', icon: 'receipt-outline', component: 'erp-cart-checkout-orders' },
    ]);
    expectSharedContract(pageSource('carts'), '/m/cart_checkout/carts', 'Carritos', 'cart-checkout-carts-table');
    expectSharedContract(pageSource('orders'), '/m/cart_checkout/orders', 'Pedidos', 'cart-checkout-orders-table');
  });
});

describe('showcase module-cart-checkout-carts — paridad con la lista real', () => {
  it('mantiene columnas, dominios, búsqueda y paginación server-side del componente', () => {
    const page = pageSource('carts');
    for (const key of ['session_token', 'customer_email', 'status', 'total_items', 'total_amount']) {
      expect(components.carts).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['active', 'abandoned', 'converted', 'expired']) {
      expect(page).toContain(`value: '${status}'`);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar sesión o email…'");
    expect(page).toContain("cardIcon = () => 'cart-outline'");
    expect(manifest.queries['cart_checkout.carts.list'].list).toMatchObject({
      page_size: 50,
      default_sort: 'created_at',
      default_dir: 'desc',
    });
  });

  it('conserva alta dentro de ok-data-table y las dos acciones reales', () => {
    const page = pageSource('carts');
    expect(page).toContain('table.addable = true');
    expect(page).toContain('<form id="cart-checkout-create-form" slot="create"');
    expect(createSchema.required).toEqual(['session_token']);
    for (const field of ['cart-session-token', 'cart-customer-email', 'cart-customer-name']) {
      expect(page).toContain(`id="${field}"`);
    }
    for (const command of [
      'cart_checkout.carts.create',
      'cart_checkout.carts.mark_abandoned',
      'cart_checkout.carts.delete',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
    }
    expect(page).toContain("{ id: 'abandon'");
    expect(page).toContain("{ id: 'delete'");
    expect(page).not.toMatch(/id:\s*['"](?:edit|duplicate|checkout)['"]/);
    expect(page).toContain('table.close()');
  });

  it('parte del único registro de ejemplo que ya prueba el componente real', () => {
    const page = pageSource('carts');
    expect(componentTest).toContain("session_token: 'sess_a1b2c3'");
    expect(page).toContain('"session_token": "sess_a1b2c3"');
    expect(page).toContain('"customer_email": "ana@ejemplo.com"');
    expect(page).toContain('"total_amount": 3150');
  });
});

describe('showcase module-cart-checkout-orders — paridad con la lista real', () => {
  it('mantiene columnas, estados, búsqueda y paginación server-side del componente', () => {
    const page = pageSource('orders');
    for (const key of ['order_number', 'customer_email', 'status', 'payment_method', 'total_amount']) {
      expect(components.orders).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['initiated', 'paid', 'failed', 'completed']) {
      expect(page).toContain(`value: '${status}'`);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar pedido o email…'");
    expect(page).toContain("cardIcon = () => 'receipt-outline'");
    expect(manifest.queries['cart_checkout.orders.list'].list).toMatchObject({
      page_size: 50,
      default_sort: 'created_at',
      default_dir: 'desc',
    });
  });

  it('conserva las tres transiciones reales y sus payloads sin inventar alta', () => {
    const page = pageSource('orders');
    for (const action of ['pay', 'complete', 'fail']) {
      expect(components.orders).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
    for (const command of [
      'cart_checkout.orders.mark_paid',
      'cart_checkout.orders.complete',
      'cart_checkout.orders.fail',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
    }
    expect(failSchema.required).toEqual(['checkout_id', 'reason']);
    expect(page).toContain("{ checkout_id: order.id, reason: 'Cancelled by operator' }");
    expect(page).not.toContain('table.addable = true');
    expect(page).not.toContain('slot="create"');
  });

  it('usa importes en céntimos como define la migración y no añade paneles ajenos', () => {
    const page = pageSource('orders');
    expect(page).toContain('formatMoney(row.total_amount,');
    expect(page).not.toContain('<ion-card');
    expect(page).not.toContain('<ok-kpi');
  });
});
