// @vitest-environment happy-dom
//
// outfitkit#216 — the create button of the bar («Add» / «Añadir») must be able to say WHAT it adds.
// A screen with two tables (Reservations › Availability: time slots + blocked dates) painted two
// identical «Add» buttons, and a screen reader heard the same name twice.
//
// The door already exists and this test pins it: `.labels` is PER INSTANCE and merges over the
// locale defaults, and `labels.add` is read by that button and nothing else. A module names its
// create button with `.labels=${{ add: t('ui.addSlot') }}` (its own translated string); the
// untouched tables keep «Add» (en) / «Añadir» (es), and every other text of the table stays.
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
  labels: Record<string, string>;
  searchPlaceholder?: string;
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
  table.rows = [{ id: 1, name: 'Lunch' }];
  table.columns = [{ key: 'name', header: 'Name' }];
  table.addable = true;
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

const addButton = (t: Table) => t.shadowRoot?.querySelector('.bar-main .add-btn') as HTMLElement | null;

/** The accessible name of an ion-button is its text (the icon is decorative) unless an explicit
 *  aria-label overrides it — so an aria-label that disagrees with the text would lie to AT. */
function accessibleName(btn: HTMLElement | null): string | undefined {
  return btn?.getAttribute('aria-label') ?? btn?.textContent?.trim();
}

describe('ok-data-table: the create button says what it adds (#216)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  for (const mobile of [false, true]) {
    const vp = mobile ? 'mobile' : 'desktop';

    it(`${vp}: \`labels.add\` renames the create button and is its accessible name`, async () => {
      viewport(mobile);
      const table = await mount({ labels: { add: 'Add time slot' } });
      const btn = addButton(table);
      expect(btn?.textContent?.trim(), 'the module cannot say what the button adds').toBe('Add time slot');
      expect(accessibleName(btn), 'a screen reader hears a different name than the text').toBe('Add time slot');
    });

    it(`${vp}: two tables on one screen give two distinct create buttons`, async () => {
      viewport(mobile);
      const slots = await mount({ labels: { add: 'Add time slot' } });
      const blocked = await mount({ labels: { add: 'Block date' } });
      expect(accessibleName(addButton(slots))).toBe('Add time slot');
      expect(accessibleName(addButton(blocked)), 'the label leaked from one instance to the other').toBe('Block date');
    });
  }

  it('without `labels.add` the button keeps the locale default (en «Add», es «Añadir»)', async () => {
    viewport(false);
    const en = await mount();
    expect(accessibleName(addButton(en))).toBe('Add');
    document.documentElement.lang = 'es';
    const es = await mount();
    expect(accessibleName(addButton(es))).toBe('Añadir');
  });

  it('a Spanish screen with its own `labels.add` shows the module text, not «Añadir»', async () => {
    document.documentElement.lang = 'es';
    viewport(false);
    const table = await mount({ labels: { add: 'Bloquear fecha' } });
    expect(accessibleName(addButton(table))).toBe('Bloquear fecha');
  });

  it('`labels.add` only renames the create button: every other text keeps its default', async () => {
    viewport(false);
    const table = await mount({ labels: { add: 'Add time slot' } });
    addButton(table)?.click();
    await table.updateComplete;
    const heading = table.shadowRoot?.querySelector('.drawer .dh strong')?.textContent?.trim();
    expect(heading, 'renaming the button also renamed the create panel').toBe('New');
  });

  it('changing `labels` after the first paint renames the button (a module switching language)', async () => {
    viewport(false);
    const table = await mount({ labels: { add: 'Add time slot' } });
    table.labels = { add: 'Añadir franja' };
    await table.updateComplete;
    expect(accessibleName(addButton(table))).toBe('Añadir franja');
  });
});
