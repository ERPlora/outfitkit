// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';
import { OkRichText } from './ok-rich-text.js';
import './ok-rich-text.js';

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
// ok-rich-text's toolbar packs 8+ format buttons in a row: growing every one to the blanket 44px
// box would double the toolbar's height and eat into the editor's own space, so the buttons keep
// their 28px drawing and get a hit area capped to the toolbar's own gap instead. The paragraph-style
// <select> is the exception -- ::before does not apply to a native <select>, so it is grown outright
// to the row height the buttons already require.
function stylesText(): string {
  const styles = OkRichText.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

async function mount(size?: 'sm' | 'md' | 'lg' | 'minimal'): Promise<OkRichText> {
  const el = document.createElement('ok-rich-text') as OkRichText;
  if (size) el.size = size;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('ok-rich-text — tap targets (#92)', () => {
  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('.select grows to the 44px floor -- native <select> cannot host a ::before overlay', () => {
    const css = stylesText();
    const m = /\.select\s*\{([^}]*)\}/.exec(css);
    expect(m, '.select rule not found').not.toBeNull();
    expect(m![1]).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('the toolbar row is tall enough for the grown .select / capped .btn hit areas', () => {
    const css = stylesText();
    const m = /\.toolbar\s*\{([^}]*)\}/.exec(css);
    expect(m, '.toolbar rule not found').not.toBeNull();
    expect(m![1]).toMatch(/min-height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.btn keeps the 28px drawing -- 8+ format buttons share one packed toolbar row', () => {
    const css = stylesText();
    const m = /\.btn\s*\{([^}]*)\}/.exec(css);
    expect(m, '.btn rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*28px/);
    expect(body).toMatch(/height:\s*28px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('caps the .btn hit area to the toolbar gap (0.25rem) so packed buttons never overlap', () => {
    const css = stylesText();
    const m = /\.btn\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.btn.ok-tap::before override not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*calc\(28px \+ 0\.25rem\)/);
    expect(body).toMatch(/height:\s*calc\(28px \+ 0\.25rem\)/);
  });

  it('.btn svg is exempted as the icon glyph, not a second control', () => {
    const css = stylesText();
    const m = /\.btn svg\s*\{([^}]*)\}/.exec(css);
    expect(m, '.btn svg rule not found').not.toBeNull();
    expect(m![1]).toMatch(/ok-tap-exempt\s*:\s*\S/);
  });

  it('the "lg" size variant caps its own, bigger hit area the same way', () => {
    const css = stylesText();
    const rule = /:host\(\[size='lg'\]\)\s*\.btn\s*\{([^}]*)\}/.exec(css);
    expect(rule, ":host([size='lg']) .btn rule not found").not.toBeNull();
    expect(rule![1], 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );

    const override = /:host\(\[size='lg'\]\)\s*\.btn\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(override, ":host([size='lg']) .btn.ok-tap::before override not found").not.toBeNull();
    expect(override![1]).toMatch(/width:\s*calc\(32px \+ 0\.25rem\)/);
    expect(override![1]).toMatch(/height:\s*calc\(32px \+ 0\.25rem\)/);

    const svgRule = /:host\(\[size='lg'\]\)\s*\.btn svg\s*\{([^}]*)\}/.exec(css);
    expect(svgRule, ":host([size='lg']) .btn svg rule not found").not.toBeNull();
    expect(svgRule![1]).toMatch(/ok-tap-exempt\s*:\s*\S/);
  });

  it('renders the toolbar buttons and the paragraph select with the ok-tap marker', async () => {
    const el = await mount();
    const select = el.shadowRoot!.querySelector('.select');
    expect(select?.classList.contains('ok-tap')).toBe(true);
    const btns = el.shadowRoot!.querySelectorAll('.btn');
    expect(btns.length).toBeGreaterThan(0);
    btns.forEach((btn) => expect(btn.classList.contains('ok-tap')).toBe(true));
    el.remove();
  });
});

// #100 — a drag-selection made with a finger (or moving iOS/Android selection handles) never
// fires `mouseup`, so the toolbar's active-format state went stale. `selectionchange` on the
// `document` fires for mouse, keyboard AND touch alike, which is why it replaces both the
// `@mouseup` and `@keyup` listeners instead of sitting next to them.
describe('ok-rich-text — selection sync follows document selectionchange (#100)', () => {
  const DEBOUNCE_MS = 120;

  afterEach(() => {
    document.querySelectorAll('ok-rich-text').forEach((el) => el.remove());
    vi.restoreAllMocks();
  });

  // happy-dom does not implement `document.queryCommandState`/`execCommand` at all (not even as a
  // stub), so it cannot be used as a spy target: `refreshActiveState` -- the private method the
  // real browser command APIs feed -- is the seam instead. Reaching a private method through a
  // cast is a test-only move; TS privacy is compile-time, the method is a real one on the instance.
  function spyOnRefresh(el: OkRichText) {
    return vi.spyOn(el as unknown as { refreshActiveState(): void }, 'refreshActiveState');
  }

  it('refreshes the active-format state from a document-level selectionchange while focused', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector('.content')!.dispatchEvent(new FocusEvent('focus'));
    const spy = spyOnRefresh(el);

    document.dispatchEvent(new Event('selectionchange'));
    await wait(DEBOUNCE_MS + 50);

    expect(spy, 'a touch/mouse drag selection with no mouseup must still refresh the toolbar').toHaveBeenCalled();
  });

  it('debounces a burst of selectionchange events into a single refresh', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector('.content')!.dispatchEvent(new FocusEvent('focus'));
    const spy = spyOnRefresh(el);

    for (let i = 0; i < 5; i++) document.dispatchEvent(new Event('selectionchange'));
    await wait(DEBOUNCE_MS + 50);

    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('ignores selectionchange while this editor is not focused', async () => {
    const el = await mount();
    const spy = spyOnRefresh(el);

    document.dispatchEvent(new Event('selectionchange'));
    await wait(DEBOUNCE_MS + 50);

    expect(spy).not.toHaveBeenCalled();
  });

  it('removes its document listener on disconnect so a detached editor stays quiet', async () => {
    const el = await mount();
    el.shadowRoot!.querySelector('.content')!.dispatchEvent(new FocusEvent('focus'));
    const spy = spyOnRefresh(el);
    el.remove();

    document.dispatchEvent(new Event('selectionchange'));
    await wait(DEBOUNCE_MS + 50);

    expect(spy, 'a removed editor must not keep refreshing off a leaked listener').not.toHaveBeenCalled();
  });
});
