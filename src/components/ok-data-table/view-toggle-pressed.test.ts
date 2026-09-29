// @vitest-environment happy-dom
//
// outfitkit#247 — the list/cards switch told its state only by colour (solid vs outline): a screen
// reader heard «View as list» and «View as cards» and could not tell which one was on. The active
// view is now announced as PRESSED and the other one as not pressed (`aria-pressed`, the toggle
// button pattern of Shopify Polaris / Material), and it follows every switch.
//
// `aria-pressed` goes on the `ion-button` host: Ionic 8 copies it to its inner <button> on load
// and WATCHES it afterwards (`@Watch('aria-pressed')` in button.tsx), so a later change reaches
// the accessibility tree too — measured in real Chromium with the hub's @ionic/core 8.8.9
// (CDP Accessibility.getFullAXTree, ios/md × 390/834/1440).
//
// The second half of the issue (two tables on one screen repeating «View as list» / «Filters»)
// needs no new door: `.labels` is PER INSTANCE, like `labels.add` (#216). This test pins that
// `viewList`, `viewCards` and `filters` name exactly their button in each table, so a module can
// say «View periods as cards» in one and «Filter special days» in the other.
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
  views: unknown;
  defaultView?: 'table' | 'cards';
  labels: Record<string, string>;
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

async function settle(table: Table): Promise<void> {
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Christmas' }, { id: 2, name: 'New year' }];
  table.columns = [{ key: 'name', header: 'Name', filterable: true }];
  table.views = ['table', 'cards'];
  Object.assign(table, props);
  document.body.appendChild(table);
  await settle(table);
  return table;
}

const toggles = (t: Table) => [...(t.shadowRoot?.querySelectorAll('.viewseg ion-button') ?? [])] as HTMLElement[];
const listBtn = (t: Table) => toggles(t)[0];
const cardsBtn = (t: Table) => toggles(t)[1];
const filtersBtn = (t: Table) =>
  [...(t.shadowRoot?.querySelectorAll('ion-button.toolbtn') ?? [])].find((b) => !b.closest('.viewseg')) as HTMLElement | undefined;

describe('ok-data-table: the list/cards switch says which view is on (#247)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
    viewport(false);
  });

  it('the list view is announced as pressed and cards as not pressed', async () => {
    const table = await mount();
    expect(toggles(table)).toHaveLength(2);
    expect(listBtn(table).getAttribute('aria-pressed')).toBe('true');
    expect(cardsBtn(table).getAttribute('aria-pressed')).toBe('false');
  });

  it('a table that starts in cards announces cards as pressed', async () => {
    const table = await mount({ defaultView: 'cards' });
    expect(listBtn(table).getAttribute('aria-pressed')).toBe('false');
    expect(cardsBtn(table).getAttribute('aria-pressed')).toBe('true');
  });

  it('the pressed state follows every switch, both ways', async () => {
    const table = await mount();
    cardsBtn(table).click();
    await settle(table);
    expect(table.shadowRoot?.querySelector('.cards-grid')).toBeTruthy();
    expect(listBtn(table).getAttribute('aria-pressed')).toBe('false');
    expect(cardsBtn(table).getAttribute('aria-pressed')).toBe('true');

    listBtn(table).click();
    await settle(table);
    expect(listBtn(table).getAttribute('aria-pressed')).toBe('true');
    expect(cardsBtn(table).getAttribute('aria-pressed')).toBe('false');
  });

  it('on a phone (starts in cards) the state is announced too', async () => {
    viewport(true);
    const table = await mount();
    expect(listBtn(table).getAttribute('aria-pressed')).toBe('false');
    expect(cardsBtn(table).getAttribute('aria-pressed')).toBe('true');
  });

  it('only the view switch is a toggle: the other bar buttons carry no pressed state', async () => {
    const table = await mount();
    const filters = filtersBtn(table);
    expect(filters).toBeTruthy();
    expect(filters?.hasAttribute('aria-pressed')).toBe(false);
  });
});

describe('ok-data-table: two tables on one screen can name their switch and filters (#247)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    viewport(false);
  });

  for (const lang of ['en', 'es'] as const) {
    it(`${lang}: \`labels.viewList/viewCards/filters\` name only their own table's buttons`, async () => {
      document.documentElement.lang = lang;
      const special = await mount({
        labels: { viewList: 'View special days as list', viewCards: 'View special days as cards', filters: 'Filter special days' },
      });
      const periods = await mount({
        labels: { viewList: 'View periods as list', viewCards: 'View periods as cards', filters: 'Filter periods' },
      });
      const untouched = await mount();

      expect(listBtn(special).getAttribute('aria-label')).toBe('View special days as list');
      expect(cardsBtn(special).getAttribute('aria-label')).toBe('View special days as cards');
      expect(filtersBtn(special)?.getAttribute('aria-label')).toBe('Filter special days');
      expect(listBtn(periods).getAttribute('aria-label')).toBe('View periods as list');
      expect(cardsBtn(periods).getAttribute('aria-label')).toBe('View periods as cards');
      expect(filtersBtn(periods)?.getAttribute('aria-label')).toBe('Filter periods');

      // A table without overrides keeps the locale defaults.
      const defaults = lang === 'es'
        ? ['Vista lista', 'Vista tarjetas', 'Filtros']
        : ['View as list', 'View as cards', 'Filters'];
      expect([listBtn(untouched), cardsBtn(untouched), filtersBtn(untouched)].map((b) => b?.getAttribute('aria-label'))).toEqual(defaults);
    });
  }
});
