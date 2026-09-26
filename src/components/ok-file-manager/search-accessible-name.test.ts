// @vitest-environment happy-dom
//
// outfitkit#184 (from #182) — the search box of `ok-file-manager` was announced by screen readers as
// «search text» instead of the hint the component shows. Ionic 8's `ion-searchbar` renders its
// inner `<input>` with a constant `aria-label="search text"` and only forwards `lang`/`dir` from
// the host. Same defect fixed in `ok-data-table` by #183.
//
// Contract: the inner input is named with the visible hint (the `labels.search` override or the
// default), it follows a change of that hint, and it still gets named when Ionic registers
// `ion-searchbar` after the component has rendered (lazy load).
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconChevronForwardOutline: '<svg/>',
  iconFolderOpenOutline: '<svg/>',
  okIcon: () => '<svg/>',
}));

import './ok-file-manager.js';

type Host = HTMLElement & {
  labels: Record<string, string>;
  updateComplete: Promise<unknown>;
};

/** Stand-in for Ionic's searchbar: constant `aria-label`, async `getInputElement()`. */
class FakeIonSearchbar extends HTMLElement {
  private input?: HTMLInputElement;
  connectedCallback(): void {
    if (this.input) return;
    this.input = document.createElement('input');
    this.input.setAttribute('aria-label', 'search text');
    this.appendChild(this.input);
  }
  async getInputElement(): Promise<HTMLInputElement> {
    if (!this.input) throw new Error('ion-searchbar not rendered');
    return this.input;
  }
}

function defineSearchbar(): void {
  if (!customElements.get('ion-searchbar')) customElements.define('ion-searchbar', FakeIonSearchbar);
}

async function settle(el: Host): Promise<void> {
  for (let i = 0; i < 3; i++) {
    await el.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
  }
}

async function mount(labels: Record<string, string> = {}): Promise<Host> {
  const el = document.createElement('ok-file-manager') as Host;
  el.labels = labels;
  document.body.appendChild(el);
  await settle(el);
  return el;
}

function searchInputName(el: Host): string | null {
  const input = el.shadowRoot?.querySelector('ion-searchbar input');
  if (!input) throw new Error('the searchbar has no inner input');
  return input.getAttribute('aria-label');
}

describe('ok-file-manager — the search box is named after its hint (#184)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  // Must stay FIRST: once `ion-searchbar` is defined in this file it cannot be undefined again.
  it('names the input when Ionic registers ion-searchbar after the component rendered', async () => {
    expect(customElements.get('ion-searchbar')).toBeUndefined();
    const el = await mount({ search: 'Buscar…' });
    defineSearchbar();
    await settle(el);
    expect(searchInputName(el)).toBe('Buscar…');
  });

  it('names the inner input with the default hint', async () => {
    defineSearchbar();
    const el = await mount();
    // #190 — the default is English when the document is not Spanish (happy-dom has no lang).
    expect(searchInputName(el)).toBe('Search files…');
  });

  it('follows a change of the hint', async () => {
    defineSearchbar();
    const el = await mount({ search: 'Buscar…' });
    el.labels = { search: 'Search everything…' };
    await settle(el);
    expect(searchInputName(el)).toBe('Search everything…');
  });
});
