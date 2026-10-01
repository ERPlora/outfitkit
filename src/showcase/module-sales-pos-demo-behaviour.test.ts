// @vitest-environment happy-dom
// Runs the POS demo of the showcase (Ventas → Vender) and checks the money it shows (outfitkit#274).
//
// The demo had been blank since the fullscreen helpers were imported from a bundle that did not
// export them; once it painted again, every price read ×100 («Café solo 130,00 €»). The sales
// fixtures it embeds are inventory rows, and inventory keeps `price` as INTEGER cents (ADR-0007):
// 130 is 1,30 €. The real POS passes those cents straight to its tiles and to the pre-bill
// (`orderToPrebill`, and `ok-receipt` takes minor units, ADR-0123); the demo multiplied them by 100
// on load and divided by 100 for the bill, so the grid was wrong and the bill right by accident.
// Hermetic: the fixture is the one embedded in the page (the parity suite holds it against sales).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const here = dirname(fileURLToPath(import.meta.url));
const pagePath = resolve(here, '../../showcase/pages/module-sales-pos.html');
const page = readFileSync(pagePath, 'utf8');

type HubPage = { body: string; setup: (doc: Document) => void };
type Row = { id: string; name: string; price: number };
type ReceiptLine = { name: string; qty: number; unit_price: number; total: number };
type Receipt = HTMLElement & { receipt?: { lines: ReceiptLine[]; total: number } };

const HUB_IMPORT = "import { defineHubPage } from './_hub.js';";
const KIT_IMPORT = "import { isCapable, toggle as toggleFullscreen } from '../../dist/outfitkit.js';";

afterEach(() => {
  document.body.innerHTML = '';
});

function productFixture(): Row[] {
  const match = page.match(/const PRODUCT_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
  expect(match, 'PRODUCT_FIXTURE must stay auditable JSON').not.toBeNull();
  return JSON.parse(match![1]) as Row[];
}

/** Runs the page's module script with stand-ins for the hub shell and the fullscreen helpers. */
function mountDemo(): void {
  const script = page.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  expect(script).toContain(HUB_IMPORT);
  expect(script).toContain(KIT_IMPORT);
  let hubPage: HubPage | undefined;
  new Function('defineHubPage', 'isCapable', 'toggleFullscreen', script.replace(HUB_IMPORT, '').replace(KIT_IMPORT, ''))(
    (definition: HubPage) => {
      hubPage = definition;
    },
    () => false,
    () => undefined,
  );
  document.body.innerHTML = hubPage!.body;
  hubPage!.setup(document);
}

const euros = (cents: number): string =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);

describe('showcase sales POS — money is in cents, as in the real POS (outfitkit#274)', () => {
  it('paints each tile with the fixture price read as cents', () => {
    const fixture = productFixture();
    mountDemo();
    const cafe = fixture.find((row) => row.name === 'Café solo')!;
    expect(cafe.price).toBe(130);

    const card = document.querySelector(`ion-card.pos-product[data-product-id="${cafe.id}"]`);
    expect(card, 'the demo must paint the Café solo tile').not.toBeNull();
    expect(card!.querySelector('.pos-product-price')!.textContent).toBe(euros(130));
  });

  it('hands the pre-bill the same cents the tile shows', () => {
    const fixture = productFixture();
    mountDemo();
    const cafe = fixture.find((row) => row.name === 'Café solo')!;
    const card = document.querySelector<HTMLElement>(`ion-card.pos-product[data-product-id="${cafe.id}"]`)!;
    card.click();
    card.click();
    document.getElementById('pos-prebill')!.click();

    const receipt = (document.getElementById('pos-prebill-receipt') as Receipt).receipt;
    expect(receipt?.lines).toEqual([expect.objectContaining({ name: 'Café solo', qty: 2, unit_price: 130, total: 260 })]);
    expect(receipt?.total).toBe(260);
  });
});

describe('showcase sales POS — tiles keep their height on a phone (outfitkit#274)', () => {
  // The tile is an ion-card with overflow:hidden, so its automatic minimum height is 0: in a grid
  // shorter than its content the `auto` rows were shared out and every tile shrank to ~48px at
  // 375x667 (thumbnail and price cut off). The real POS pins the tile height; the demo sizes each
  // row to its tile so the grid scrolls instead, and keeps room for the cart FAB below the last row.
  const css = page.match(/<style>([\s\S]*?)<\/style>/)![1];
  const rule = (block: string, selector: string): string =>
    block.match(new RegExp(`${selector.replace(/[#.]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

  it('sizes every product row to its tile instead of sharing out the grid height', () => {
    expect(rule(css, '#pos-product-grid')).toMatch(/grid-auto-rows:\s*max-content/);
  });

  it('leaves room under the last row for the cart button on narrow screens', () => {
    const narrow = css.slice(css.indexOf('@media (max-width: 820px)'));
    expect(rule(narrow, '#pos-product-grid')).toMatch(/padding-bottom:\s*5\.2rem/);
  });
});
