// @vitest-environment happy-dom
//
// outfitkit#184 (from #182) — shared fix for Ionic 8's `ion-searchbar`, whose inner `<input>` is
// always announced as «search text». `ok-data-table`, `ok-mail` and `ok-file-manager` render their
// own searchbar, so the naming lives here once instead of being copied into each component.
import { beforeEach, describe, expect, it } from 'vitest';

import { syncSearchbarInputName } from './searchbar-name.js';

/** Minimal stand-in for Ionic's searchbar: constant `aria-label`, async `getInputElement()`. */
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

const flush = () => new Promise((r) => setTimeout(r, 0));

function inputOf(root: ParentNode): HTMLInputElement {
  const input = root.querySelector('ion-searchbar input');
  if (!input) throw new Error('the searchbar has no inner input');
  return input as HTMLInputElement;
}

describe('syncSearchbarInputName (#184)', () => {
  let root: HTMLDivElement;

  beforeEach(() => {
    document.body.replaceChildren();
    root = document.createElement('div');
    root.appendChild(document.createElement('ion-searchbar'));
    document.body.appendChild(root);
  });

  // Must stay FIRST: once `ion-searchbar` is defined in this file it cannot be undefined again.
  it('waits for ion-searchbar to be registered before naming the input', async () => {
    expect(customElements.get('ion-searchbar')).toBeUndefined();
    syncSearchbarInputName(root, () => 'Search mail…');
    customElements.define('ion-searchbar', FakeIonSearchbar);
    await flush();
    expect(inputOf(root).getAttribute('aria-label')).toBe('Search mail…');
  });

  it('uses the name current when the input resolves, not when the call started', async () => {
    let name = 'Old hint';
    syncSearchbarInputName(root, () => name);
    name = 'New hint';
    await flush();
    expect(inputOf(root).getAttribute('aria-label')).toBe('New hint');
  });

  it('does nothing when there is no searchbar or no root', async () => {
    expect(() => syncSearchbarInputName(null, () => 'x')).not.toThrow();
    expect(() => syncSearchbarInputName(document.createElement('div'), () => 'x')).not.toThrow();
    await flush();
  });
});
