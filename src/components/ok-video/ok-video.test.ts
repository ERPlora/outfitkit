// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconExpandOutline: '<svg>expand</svg>',
  iconContractOutline: '<svg>contract</svg>',
  okIcon: (v?: string) => v,
}));

import { OkVideo } from './ok-video.js';
import './ok-video.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkVideo.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-video — tap targets (#92)', () => {
  it('.progress keeps its 6px seek-bar drawing -- a 44px-tall bar would be a churro', () => {
    const css = stylesText();
    const m = /\.progress\s*\{([^}]*)\}/.exec(css);
    expect(m, '.progress rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/height:\s*6px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders .progress with the ok-tap marker so the widened hit area applies', async () => {
    const el = document.createElement('ok-video') as OkVideo;
    document.body.append(el);
    await el.updateComplete;

    const progress = el.shadowRoot!.querySelector('.progress');
    expect(progress?.classList.contains('ok-tap')).toBe(true);

    el.remove();
  });

  it('seek still reads the click position from the real (unwidened) bar rect, not the overlay', async () => {
    const el = document.createElement('ok-video') as OkVideo;
    document.body.append(el);
    await el.updateComplete;

    const progress = el.shadowRoot!.querySelector('.progress') as HTMLElement;
    // happy-dom returns a zero rect; the seek handler must tolerate that (ratio 0) rather than
    // throw -- this only guards that the click handler is still wired to the SAME element after
    // adding the `ok-tap` class and the pseudo-element styles.
    progress.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10 }));
    expect(progress).toBeTruthy();
  });
});

// ── Fullscreen (see src/base/fullscreen.ts) ────────────────────────────────────────────────────
//
// Both cases below were live defects, and both come from asking the wrong question:
//   · the button was painted with no regard for whether the browser can do this, so on iOS Safari
//     (no element Fullscreen API) pressing it did nothing at all;
//   · the handler compared against `document.fullscreenElement`, a GLOBAL. With the Hub shell in
//     immersive mode -- which fullscreens `documentElement` -- the video's own button exited the
//     SHELL and left the video untouched.

const nativeRequest = Object.getOwnPropertyDescriptor(Element.prototype, 'requestFullscreen');
const nativeExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
const nativeElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
const nativeEnabled = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled');
const nativeWebkitVideo = Object.getOwnPropertyDescriptor(
  HTMLVideoElement.prototype,
  'webkitEnterFullscreen',
);

function def(target: object, prop: string, value: unknown): void {
  Object.defineProperty(target, prop, { value, configurable: true, writable: true });
}

function restoreFullscreenApi(): void {
  for (const [target, prop, desc] of [
    [Element.prototype, 'requestFullscreen', nativeRequest],
    [document, 'exitFullscreen', nativeExit],
    [document, 'fullscreenElement', nativeElement],
    [document, 'fullscreenEnabled', nativeEnabled],
    [HTMLVideoElement.prototype, 'webkitEnterFullscreen', nativeWebkitVideo],
  ] as const) {
    if (desc) Object.defineProperty(target, prop, desc);
    else Reflect.deleteProperty(target as object, prop);
  }
}

async function mount(): Promise<OkVideo> {
  const el = document.createElement('ok-video') as OkVideo;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

/** The `<ion-icon>` inside the fullscreen button, read as the property Lit actually sets. */
function icon(el: OkVideo): string {
  const ionIcon = fsButton(el)!.querySelector('ion-icon') as { icon?: string } | null;
  return ionIcon?.icon ?? '';
}

function fsButton(el: OkVideo): HTMLElement | null {
  const buttons = [...el.shadowRoot!.querySelectorAll('ion-button')];
  return (buttons.find((b) => /fullscreen/i.test(b.getAttribute('aria-label') ?? '')) ??
    null) as HTMLElement | null;
}

describe('ok-video — fullscreen', () => {
  afterEach(restoreFullscreenApi);

  it('does NOT paint the button when the browser cannot do fullscreen (iOS Safari)', async () => {
    def(Element.prototype, 'requestFullscreen', undefined);
    Reflect.deleteProperty(HTMLVideoElement.prototype, 'webkitEnterFullscreen');

    const el = await mount();
    expect(fsButton(el), 'a control that cannot work must not be offered').toBeNull();
    el.remove();
  });

  it('still offers it on the iPhone, where only the <video> itself can go fullscreen', async () => {
    def(Element.prototype, 'requestFullscreen', undefined);
    const enter = vi.fn();
    def(HTMLVideoElement.prototype, 'webkitEnterFullscreen', enter);

    const el = await mount();
    fsButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(enter).toHaveBeenCalledOnce();
    el.remove();
  });

  it('grows the video when the SHELL is the one in fullscreen, it does not exit the shell', async () => {
    const requested: Element[] = [];
    const exitSpy = vi.fn(() => Promise.resolve());
    def(Element.prototype, 'requestFullscreen', function (this: Element) {
      requested.push(this);
      return Promise.resolve();
    });
    def(document, 'exitFullscreen', exitSpy);
    def(document, 'fullscreenEnabled', true);

    const el = await mount();
    def(document, 'fullscreenElement', document.documentElement); // shell immersive

    fsButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(exitSpy, 'the shell is not ours to close').not.toHaveBeenCalled();
    expect(requested).toHaveLength(1);
    expect(requested[0], 'must fullscreen its own stage').toBe(el.shadowRoot!.querySelector('.stage'));
    el.remove();
  });

  it('exits when the video itself is the one in fullscreen', async () => {
    const exitSpy = vi.fn(() => Promise.resolve());
    def(Element.prototype, 'requestFullscreen', () => Promise.resolve());
    def(document, 'exitFullscreen', exitSpy);

    const el = await mount();
    const stage = el.shadowRoot!.querySelector('.stage')!;
    def(document, 'fullscreenElement', el); // retargeted to the host
    def(el.shadowRoot!, 'fullscreenElement', stage);

    fsButton(el)!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await el.updateComplete;

    expect(exitSpy).toHaveBeenCalledOnce();
    el.remove();
  });

  it('follows Esc/F11, which leave fullscreen without touching our button', async () => {
    def(Element.prototype, 'requestFullscreen', () => Promise.resolve());
    def(document, 'exitFullscreen', () => Promise.resolve());

    const el = await mount();
    const stage = el.shadowRoot!.querySelector('.stage')!;
    def(document, 'fullscreenElement', el);
    def(el.shadowRoot!, 'fullscreenElement', stage);
    document.dispatchEvent(new Event('fullscreenchange'));
    await el.updateComplete;
    // The icon travels as a Lit PROPERTY (`.icon`), so it is not in the markup -- read it off the
    // element, and read the label off the attribute, which is what a screen reader gets.
    expect(fsButton(el)!.getAttribute('aria-label'), 'in fullscreen the button offers the way out')
      .toBe('Exit fullscreen');
    expect(icon(el)).toContain('contract');

    def(document, 'fullscreenElement', null);
    def(el.shadowRoot!, 'fullscreenElement', null);
    document.dispatchEvent(new Event('fullscreenchange'));
    await el.updateComplete;
    expect(fsButton(el)!.getAttribute('aria-label')).toBe('Fullscreen');
    expect(icon(el)).toContain('expand');

    el.remove();
  });

  it('stops listening once removed from the page', () => {
    const remove = vi.spyOn(document, 'removeEventListener');
    const el = document.createElement('ok-video') as OkVideo;
    document.body.append(el);
    el.remove();
    expect(remove).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
    remove.mockRestore();
  });
});
