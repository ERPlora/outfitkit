// @vitest-environment happy-dom
//
// outfitkit#113 — on DESKTOP the create action was a small «+» icon at the end of the toolbar, the
// same size and the same style as the change-view, filter and export icons. Four identical icons,
// and the one that matters is the last: the person cannot tell which is the main action of the
// screen. On mobile that same button already carried its label («Add») since #76, which only ever
// claimed the mobile bar and left desktop alone on purpose.
//
// The market is unanimous — Odoo («New»), Business Central, Shopify («Add product»), WooCommerce,
// Lightspeed and Fresha all put the create action as a labelled, filled button on desktop; NN/g
// reserves unlabelled buttons for universal actions (search, close). The main action of a screen is
// read, not guessed.
//
// The contract fixed here: `addable` and `primaryAction` paint the SAME labelled primary button in
// both viewports. Everything else on the desktop bar (column picker, rows per page, the icon-only
// tools) is untouched.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconCalendarOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconChevronForward: '<svg></svg>',
  iconChevronUpOutline: '<svg></svg>',
  iconClose: '<svg></svg>',
  iconEllipsisVertical: '<svg></svg>',
  iconFileTrayOutline: '<svg></svg>',
  iconSwapVerticalOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  addable: boolean;
  primaryAction?: { label: string; icon?: string };
  updateComplete: Promise<unknown>;
};

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Corte' }];
  table.columns = [{ key: 'name', header: 'Name' }];
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

describe('ok-data-table: on desktop the create action is read, not guessed (#113)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('desktop: `addable` is a labelled button, not an anonymous «+»', async () => {
    viewport(false);
    const table = await mount({ addable: true });
    const bar = table.shadowRoot?.querySelector('.bar-main');
    const add = bar?.querySelector('.add-btn') as HTMLElement | null;

    expect(add, 'on desktop the create action is still an icon').toBeTruthy();
    expect(add?.textContent?.trim(), 'the create button does not say what it does').toBe('Add');
    expect(
      bar?.querySelector('.toolbtn[aria-label="Add"]'),
      'the anonymous «+» is still there next to the labelled one: two create buttons',
    ).toBeNull();
  });

  it('desktop: the create button reads as the MAIN action (filled, not one more tool icon)', async () => {
    viewport(false);
    const table = await mount({ addable: true });
    const add = table.shadowRoot?.querySelector('.bar-main .add-btn') as HTMLElement | null;
    expect(add?.classList.contains('primary-btn'), 'the create button looks like the export icon').toBe(true);
    expect(styles(), 'the primary fill is not defined').toMatch(/\.primary-btn[^{]*\{[^}]*--background: var\(--primary\)/);
  });

  it('desktop: clicking it opens the create panel, exactly like the old «+»', async () => {
    viewport(false);
    const table = await mount({ addable: true });
    (table.shadowRoot?.querySelector('.bar-main .add-btn') as HTMLElement | null)?.click();
    await table.updateComplete;
    expect(table.shadowRoot?.querySelector('.drawer'), 'the create action opens nothing').toBeTruthy();
  });

  it('desktop: `primaryAction` shows its label and still emits `primaryAction`', async () => {
    viewport(false);
    const table = await mount({ primaryAction: { label: 'New order', icon: 'add' } });
    const btn = table.shadowRoot?.querySelector('.bar-main .primary-btn') as HTMLElement | null;

    expect(btn?.textContent?.trim(), 'the primary action is an anonymous icon on desktop').toBe('New order');
    let fired = 0;
    table.addEventListener('primaryAction', () => (fired += 1));
    btn?.click();
    expect(fired, 'the primary action no longer tells the module it was pressed').toBe(1);
  });

  it('desktop: the create button is translated (es)', async () => {
    document.documentElement.lang = 'es';
    viewport(false);
    const table = await mount({ addable: true });
    expect(table.shadowRoot?.querySelector('.bar-main .add-btn')?.textContent?.trim()).toBe('Añadir');
  });

  it('desktop: the button lines up with the rest of the bar (36px, not the 44px touch target)', async () => {
    // A 44px control next to the 36px tool icons and the 36px searchbar sticks out of the row.
    // The touch target belongs to a coarse pointer, and it is still asserted below for mobile.
    viewport(false);
    await mount({ addable: true });
    expect(styles(), 'the create button is taller than the bar it sits in').toMatch(
      /\.add-btn \{[^}]*min-height: 36px;/,
    );
  });

  it('mobile keeps the 44px touch target and the rest of its bar', async () => {
    viewport(true);
    const table = await mount({ addable: true });
    const bar = table.shadowRoot?.querySelector('.bar-main');
    expect(bar?.querySelector('.add-btn')?.textContent?.trim(), 'mobile lost its labelled button').toBe('Add');
    expect(bar?.querySelector('.tk-cols'), 'mobile gained the desktop column picker').toBeNull();
    expect(styles(), 'mobile lost the 44px touch target on the create button').toMatch(
      /\(pointer: coarse\)[^@]*\.add-btn \{[^}]*min-height: 44px;/,
    );
  });
});
