// @vitest-environment happy-dom
//
// outfitkit#182 (from ERPlora/saas#2245) — the table's search box was announced by screen readers
// as «search text»: in English, and without saying what it searches, even though the screen shows
// «Search users…» as its hint. Measured on PRE (Chromium accessibility tree, 25/09):
// `searchbox "search text"` on every dashboard list. For the same reason
// `getByRole('searchbox', { name: 'Search users…' })` found nothing.
//
// Cause: Ionic 8's `ion-searchbar` renders its inner `<input>` with a constant
// `aria-label="search text"` and only forwards `lang`/`dir` from the host, so an `aria-label` on
// `ion-searchbar` never reaches the input. Checked in @ionic/core 8.8.9.
//
// Contract: the inner input is named with the same text the table shows as hint (the consumer's
// `search-placeholder`, or the translated default), it follows a change of that text, and it still
// gets named when Ionic registers `ion-searchbar` after the table has rendered (lazy load).
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
  searchable: boolean;
  searchPlaceholder?: string;
  updateComplete: Promise<unknown>;
};

/**
 * Stand-in for Ionic 8's `ion-searchbar`, faithful to what matters here: a scoped component whose
 * inner `<input>` carries a constant `aria-label="search text"`, reachable through the async
 * `getInputElement()`. Like Stencil's vdom, a re-render only writes the attribute when its value
 * in the vdom changes — which never happens, so the constant is written once, on first render.
 */
class FakeIonSearchbar extends HTMLElement {
  private input?: HTMLInputElement;
  connectedCallback(): void {
    if (this.input) return;
    this.input = document.createElement('input');
    this.input.setAttribute('aria-label', 'search text');
    this.appendChild(this.input);
  }
  async componentOnReady(): Promise<this> {
    return this;
  }
  async getInputElement(): Promise<HTMLInputElement> {
    if (!this.input) throw new Error('ion-searchbar not rendered');
    return this.input;
  }
}

function defineSearchbar(): void {
  if (!customElements.get('ion-searchbar')) customElements.define('ion-searchbar', FakeIonSearchbar);
}

/** happy-dom has no matchMedia: keep the table on the desktop branch. */
function desktop(): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: false, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function settle(table: Table): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await table.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'García' }];
  table.columns = [{ key: 'name', header: 'Name' }];
  table.searchable = true;
  Object.assign(table, props);
  document.body.appendChild(table);
  await settle(table);
  return table;
}

function searchInputName(table: Table): string | null {
  const input = table.shadowRoot?.querySelector('ion-searchbar input');
  if (!input) throw new Error('the searchbar has no inner input');
  return input.getAttribute('aria-label');
}

describe('ok-data-table — the search box is named after its hint (#182)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
    desktop();
  });

  // Must stay FIRST: once `ion-searchbar` is defined in this file it cannot be undefined again.
  it('names the input when Ionic registers ion-searchbar after the table rendered', async () => {
    expect(customElements.get('ion-searchbar')).toBeUndefined();
    const table = await mount({ searchPlaceholder: 'Search users…' });
    defineSearchbar();
    await settle(table);
    expect(searchInputName(table)).toBe('Search users…');
  });

  it('names the inner input with the consumer search-placeholder', async () => {
    defineSearchbar();
    const table = await mount({ searchPlaceholder: 'Search users…' });
    expect(searchInputName(table)).toBe('Search users…');
  });

  it('falls back to the translated default hint', async () => {
    defineSearchbar();
    document.documentElement.lang = 'es';
    const table = await mount();
    expect(searchInputName(table)).toBe('Buscar…');
  });

  it('follows a change of the hint', async () => {
    defineSearchbar();
    const table = await mount({ searchPlaceholder: 'Search users…' });
    table.searchPlaceholder = 'Search invoices…';
    await settle(table);
    expect(searchInputName(table)).toBe('Search invoices…');
  });
});
