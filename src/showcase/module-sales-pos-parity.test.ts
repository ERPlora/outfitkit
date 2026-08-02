import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-sales-pos.html', import.meta.url);
const selector = readFileSync(
  new URL('../../../modules-workspace/modules/sales/ui/components/erp-pos/erp-pos.ts', import.meta.url),
  'utf8',
);
const touch = readFileSync(
  new URL(
    '../../../modules-workspace/modules/sales/ui/components/erp-pos-touch/erp-pos-touch.ts',
    import.meta.url,
  ),
  'utf8',
);
const receiptComponent = readFileSync(
  new URL('../components/ok-receipt/ok-receipt.ts', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(
  readFileSync(new URL('../../../modules-workspace/modules/sales/module.json', import.meta.url), 'utf8'),
) as { navigation: Array<Record<string, unknown>> };

function fixture(name: string): unknown {
  return JSON.parse(
    readFileSync(
      new URL(`../../../modules-workspace/modules/sales/fixtures/${name}.json`, import.meta.url),
      'utf8',
    ),
  );
}

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/sales/pos').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-sales-pos — paridad con el TPV táctil real', () => {
  it('usa el shell Hub en iOS y no fuerza una tabla donde el POS real no la usa', () => {
    const page = pageSource();

    expect(manifest.navigation[0]).toMatchObject({ id: 'pos', label: 'Vender', component: 'erp-pos' });
    expect(selector).toContain("this.layout = row?.pos_layout === 'desktop' ? 'desktop' : 'touch'");
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/sales/pos'");
    expect(page).toContain("title: 'Vender'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain('<ok-data-table');

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-qty-stepper', 'ok-spotlight-search', 'ok-receipt']));
  });

  it('copia los fixtures oficiales que alimentan el preview del TPV', () => {
    const page = pageSource();
    const cases = [
      ['PRODUCT_FIXTURE', 'inventory.products.list'],
      ['CATEGORY_FIXTURE', 'inventory.categories.list'],
      ['PRODUCT_CATEGORY_FIXTURE', 'inventory.product_categories'],
      ['PAYMENT_METHOD_FIXTURE', 'sales.payment_methods'],
      ['SETTINGS_FIXTURE', 'sales.settings.get'],
      ['PARKED_TICKET_FIXTURE', 'sales.parked_tickets'],
    ] as const;

    for (const [constant, file] of cases) {
      const match = page.match(new RegExp(`const ${constant} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
      expect(match, `${constant} debe quedar como JSON auditable`).not.toBeNull();
      expect(JSON.parse(match![1])).toEqual(fixture(file));
    }
    expect(page).toContain('price: Math.round(Number(row.price) * 100)');
  });

  it('mantiene el canvas táctil: categorías, catálogo, carrito y cobro', () => {
    const page = pageSource();

    for (const marker of [
      'class="pos-category-strip"',
      'id="pos-product-grid"',
      'class="pos-cart"',
      'id="pos-cart-lines"',
      'id="pos-close-cart"',
      'id="pos-payment-methods"',
      'id="pos-fire-order"',
      'id="pos-prebill"',
      'id="pos-charge"',
      'id="pos-charge-modal"',
      'id="pos-prebill-modal"',
    ]) {
      expect(page).toContain(marker);
    }
    expect(page).toContain("grid-template-columns: minmax(0, 1fr) 23rem");
    expect(page).toContain('@media (max-width: 820px)');
    expect(page).toContain('<ion-card button class="pos-product"');
    expect(page).toContain('<ion-list id="pos-cart-lines"');
    expect(page).toContain('<ok-qty-stepper');
    expect(page).toContain('<ion-segment id="pos-payment-methods"');
    expect(page).toContain("cartElement.removeAttribute('data-open')");
  });

  it('reutiliza los tres componentes especializados que usa la pantalla real', () => {
    const page = pageSource();

    for (const tag of ['ok-qty-stepper', 'ok-spotlight-search', 'ok-receipt']) {
      expect(touch).toContain(`<${tag}`);
      expect(page).toContain(`<${tag}`);
    }
    expect(page).toContain("stepper.addEventListener('ok-change'");
    expect(page).toContain("search.addEventListener('ok-input'");
    expect(touch).toContain('<ok-receipt id="prebill-doc" .data=');
    expect(receiptComponent).toContain('@property({ attribute: false }) receipt?: ReceiptData');
    expect(page).toContain('receipt.receipt = buildPrebillData();');
    expect(page).not.toContain('receipt.data = buildPrebillData();');
  });

  it('hace honestas las interacciones locales de categoría, carrito, tickets y cobro', () => {
    const page = pageSource();

    for (const functionName of [
      'renderCategories',
      'renderProducts',
      'addProduct',
      'renderCart',
      'parkCurrentCart',
      'retrieveParkedTicket',
      'openCharge',
      'confirmCharge',
    ]) {
      expect(page).toContain(`function ${functionName}`);
    }
    expect(page).toContain("paymentSegment.addEventListener('ionChange'");
    expect(page).toContain("chargeModal.addEventListener('ionModalDidDismiss'");
    expect(page).toContain("emitCommand('sales.order.fire'");
    expect(page).toContain("emitCommand('sales.complete_sale'");
    expect(page).toContain('cart = [];');
  });
});
