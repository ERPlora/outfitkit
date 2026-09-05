import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

// @ts-expect-error Untyped JavaScript, like the rest of the repo scripts.
import { listDemoPages, readDemoFilterContract } from '../../scripts/showcase-filter-parity.mjs';

const root = resolve(import.meta.dirname, '../..');

/**
 * Demos that paint filter boxes without saying which module query is behind them (outfitkit#116).
 *
 * A demo is checked against the real module only if it binds a query to its table state; these
 * never call one, so there is nothing to compare their filter boxes against and the cross-repo
 * sweep cannot see them. Declaring them all is a separate sweep (outfitkit#118) — until then this
 * list is a RATCHET: it may only shrink. A demo added today brings its declaration with it, so the
 * hole stops growing while the backlog is worked off.
 */
const PENDING_DECLARATION = [
  'module-cart-checkout-carts.html',
  'module-cart-checkout-orders.html',
  'module-cash-register.html',
  'module-customers-fields.html',
  'module-customers-groups.html',
  'module-customers-list.html',
  'module-customers-tags.html',
  'module-inventory-categories.html',
  'module-inventory-products.html',
  'module-invoice-list.html',
  'module-invoice-settings.html',
  'module-payments-list.html',
  'module-pricing-lists.html',
  'module-reservations-availability.html',
  'module-reservations-list.html',
  'module-reservations-waitlist.html',
  'module-sales-list.html',
  'module-schedules-hours.html',
  'module-services.html',
  'module-staff-members.html',
  'module-staff-roles.html',
  'module-staff-time-off.html',
  'module-tasks-list.html',
  'module-tasks-projects.html',
  'module-tickets-list.html',
  'module-tickets-sla.html',
  'module-whatsapp-inbox-inbox.html',
  'module-whatsapp-inbox-requests.html',
  'module-whatsapp-inbox-templates.html',
];

/** Demos painting filter boxes with no query bound to the table state. */
function demosWithoutDeclaredQuery(): string[] {
  return (listDemoPages(root) as string[]).filter((page) => {
    const source = readFileSync(resolve(root, 'showcase/pages', page), 'utf8');
    const { queries, filterableColumns } = readDemoFilterContract(source);
    return filterableColumns.length > 0 && queries.length !== 1;
  });
}

describe('a demo says which query its filter boxes talk to (outfitkit#116)', () => {
  // This one is hermetic on purpose — it reads only this repo, so it runs in the FAST gate, on
  // every PR, without waiting for the parity job to clone 25 modules.
  it('no NEW demo paints filter boxes without declaring the query behind them', () => {
    expect(
      demosWithoutDeclaredQuery(),
      'a demo painting `filterable: true` must call its list query with the table state '
      + '(`{ ...state }`); otherwise nothing can check that the module accepts that filter. '
      + 'This list may only SHRINK: remove the page you just declared, never add one.',
    ).toEqual(PENDING_DECLARATION);
  });

  it('the ratchet is a list of real demos, not of names that no longer exist', () => {
    const pages = new Set(listDemoPages(root) as string[]);
    for (const page of PENDING_DECLARATION) expect(pages, page).toContain(page);
    expect(PENDING_DECLARATION).toEqual([...PENDING_DECLARATION].sort());
  });
});
