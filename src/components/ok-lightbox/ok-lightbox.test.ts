// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract exercised here).
vi.mock('../../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
  iconCloseOutline: '<svg></svg>',
  iconDownloadOutline: '<svg></svg>',
  iconExpandOutline: '<svg>expand</svg>',
  iconContractOutline: '<svg>contract</svg>',
  iconPlayOutline: '<svg></svg>',
}));

import { OkLightbox } from './ok-lightbox.js';
import './ok-lightbox.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkLightbox.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-lightbox — tap targets (#92)', () => {
  it('.icon-btn (header actions) grows to the 44px floor -- it had room, nothing to preserve', () => {
    const css = stylesText();
    const m = /\.icon-btn\s*\{([^}]*)\}/.exec(css);
    expect(m, '.icon-btn rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.thumb keeps the 50x36 filmstrip drawing -- widening it would change the strip composition', () => {
    const css = stylesText();
    const m = /\.thumb\s*\{([^}]*)\}/.exec(css);
    expect(m, '.thumb rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*50px/);
    expect(body).toMatch(/height:\s*36px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders each filmstrip thumbnail with the ok-tap marker so the hit area applies', async () => {
    const el = document.createElement('ok-lightbox') as OkLightbox;
    el.items = [
      { src: 'a.jpg', alt: 'a' },
      { src: 'b.jpg', alt: 'b' },
    ];
    el.open = true;
    document.body.append(el);
    await el.updateComplete;
    // The overlay is portaled into document.body's own shadow root.
    const portal = document.body.querySelector('[data-ok-lightbox-portal]');
    expect(portal?.shadowRoot, 'portal not mounted').not.toBeNull();
    const thumb = portal!.shadowRoot!.querySelector('.thumb');
    expect(thumb?.classList.contains('ok-tap')).toBe(true);
    el.remove();
    portal?.remove();
  });
});

// ── Fullscreen (see src/base/fullscreen.ts) ────────────────────────────────────────────────────
//
// Same two defects as ok-video, plus one twist of its own: the overlay lives in a PORTAL with its
// own shadow root, so `document.fullscreenElement` reports the portal host and never `.lightbox`.
// Comparing against the document alone therefore answers "no" even while the lightbox IS the one
// in fullscreen -- which is why the exit case below is worth pinning separately.

const savedRequest = Object.getOwnPropertyDescriptor(Element.prototype, 'requestFullscreen');
const savedExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
const savedElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
const savedEnabled = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled');

function set(target: object, prop: string, value: unknown): void {
  Object.defineProperty(target, prop, { value, configurable: true, writable: true });
}

async function openLightbox(): Promise<{ el: OkLightbox; portal: Element; box: HTMLElement }> {
  const el = document.createElement('ok-lightbox') as OkLightbox;
  el.items = [{ src: 'a.jpg', alt: 'a' }];
  el.open = true;
  document.body.append(el);
  await el.updateComplete;
  const portal = document.body.querySelector('[data-ok-lightbox-portal]')!;
  const box = portal.shadowRoot!.querySelector('.lightbox') as HTMLElement;
  return { el, portal, box };
}

function fullscreenBtn(portal: Element): HTMLElement | null {
  const buttons = [...portal.shadowRoot!.querySelectorAll('button, ion-button')];
  return (buttons.find((b) => /fullscreen/i.test(b.getAttribute('aria-label') ?? '')) ??
    null) as HTMLElement | null;
}

describe('ok-lightbox — fullscreen', () => {
  afterEach(() => {
    for (const [target, prop, desc] of [
      [Element.prototype, 'requestFullscreen', savedRequest],
      [document, 'exitFullscreen', savedExit],
      [document, 'fullscreenElement', savedElement],
      [document, 'fullscreenEnabled', savedEnabled],
    ] as const) {
      if (desc) Object.defineProperty(target, prop, desc);
      else Reflect.deleteProperty(target as object, prop);
    }
    document.body.querySelectorAll('[data-ok-lightbox-portal]').forEach((n) => n.remove());
  });

  it('does NOT paint the button when the browser cannot do fullscreen', async () => {
    set(Element.prototype, 'requestFullscreen', undefined);
    const { el, portal } = await openLightbox();
    expect(fullscreenBtn(portal), 'a control that cannot work must not be offered').toBeNull();
    el.remove();
  });

  it('does NOT paint it inside an iframe that was not allowed fullscreen', async () => {
    set(document, 'fullscreenEnabled', false);
    const { el, portal } = await openLightbox();
    expect(fullscreenBtn(portal)).toBeNull();
    el.remove();
  });

  it('grows the overlay when the SHELL is in fullscreen, it does not exit the shell', async () => {
    const requested: Element[] = [];
    const exitSpy = vi.fn(() => Promise.resolve());
    set(Element.prototype, 'requestFullscreen', function (this: Element) {
      requested.push(this);
      return Promise.resolve();
    });
    set(document, 'exitFullscreen', exitSpy);

    const { el, portal, box } = await openLightbox();
    set(document, 'fullscreenElement', document.documentElement);

    fullscreenBtn(portal)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(exitSpy, 'the shell is not ours to close').not.toHaveBeenCalled();
    expect(requested).toEqual([box]);
    el.remove();
  });

  it('exits when the overlay itself is in fullscreen, seen through its portal shadow root', async () => {
    const exitSpy = vi.fn(() => Promise.resolve());
    set(Element.prototype, 'requestFullscreen', () => Promise.resolve());
    set(document, 'exitFullscreen', exitSpy);

    const { el, portal, box } = await openLightbox();
    set(document, 'fullscreenElement', portal); // retargeted to the portal host
    set(portal.shadowRoot!, 'fullscreenElement', box);

    fullscreenBtn(portal)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(exitSpy).toHaveBeenCalledOnce();
    el.remove();
  });
});
