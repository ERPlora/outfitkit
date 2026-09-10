// @vitest-environment happy-dom
//
// Contract of the ONE fullscreen door of the library (#TBD).
//
// Why this exists: the same 30 lines of Fullscreen API were written FOUR times across the product
// (`ok-video`, `ok-lightbox`, a showcase POS page and the Hub shell's immersive mode) and each copy
// got a different half of it wrong. Two of those wrongs are user-visible and are pinned below:
//
//   1. Every copy asked `document.fullscreenElement` — a GLOBAL — instead of "is MY element the one
//      in fullscreen". So with the Hub shell already immersive (it fullscreens `documentElement`),
//      pressing the fullscreen button of a video dropped the SHELL out of immersive mode and left
//      the video exactly as it was.
//   2. Nobody published whether the browser can do this at all, so the button was painted always.
//      On iOS Safari `requestFullscreen` is simply absent (caniuse: partial) and the button did
//      nothing at all when pressed — a dead control on the device the POS runs on.
//
// The shadow-DOM retarget below is the reason (1) cannot be fixed with a plain `=== el` either:
// when an element inside a shadow root goes fullscreen, `document.fullscreenElement` reports the
// HOST, and only `shadowRoot.fullscreenElement` reports the real one. Every ok-* fullscreens
// something inside its own shadow root, so the naive comparison is false for all of them.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { activeEl, exit, isActive, isCapable, onChange, request, toggle } from './fullscreen.js';

type Mutable = { requestFullscreen?: unknown };

const originalRequest = Object.getOwnPropertyDescriptor(Element.prototype, 'requestFullscreen');
const originalExit = Object.getOwnPropertyDescriptor(document, 'exitFullscreen');
const originalElement = Object.getOwnPropertyDescriptor(document, 'fullscreenElement');
const originalEnabled = Object.getOwnPropertyDescriptor(document, 'fullscreenEnabled');

/** Elements handed to `requestFullscreen`, in order. */
let requested: Element[] = [];
/** How many times `exitFullscreen` was called. */
let exited = 0;

function define(target: object, prop: string, value: unknown): void {
  Object.defineProperty(target, prop, { value, configurable: true, writable: true });
}

/** Pretends the document currently has `el` in fullscreen (or nothing when null). */
function pretendActive(el: Element | null): void {
  define(document, 'fullscreenElement', el);
}

/** Installs (or removes) the native API. `capable: false` is the iPhone. */
function installApi(capable: boolean): void {
  if (capable) {
    define(Element.prototype, 'requestFullscreen', function (this: Element) {
      requested.push(this);
      return Promise.resolve();
    });
    define(document, 'exitFullscreen', () => {
      exited += 1;
      return Promise.resolve();
    });
  } else {
    define(Element.prototype, 'requestFullscreen', undefined);
    define(document, 'exitFullscreen', undefined);
  }
}

beforeEach(() => {
  requested = [];
  exited = 0;
  installApi(true);
  define(document, 'fullscreenEnabled', true);
  pretendActive(null);
});

afterEach(() => {
  for (const [target, prop, desc] of [
    [Element.prototype, 'requestFullscreen', originalRequest],
    [document, 'exitFullscreen', originalExit],
    [document, 'fullscreenElement', originalElement],
    [document, 'fullscreenEnabled', originalEnabled],
  ] as const) {
    if (desc) Object.defineProperty(target, prop, desc);
    else Reflect.deleteProperty(target as object, prop);
  }
});

describe('isCapable', () => {
  it('is false when the element API is missing (iOS Safari)', () => {
    installApi(false);
    expect(isCapable()).toBe(false);
  });

  it('is false when the document forbids it (iframe without allow="fullscreen")', () => {
    define(document, 'fullscreenEnabled', false);
    expect(isCapable()).toBe(false);
  });

  it('can be asked about one concrete element', () => {
    const el = document.createElement('div');
    expect(isCapable(el)).toBe(true);
    define(el as unknown as Mutable, 'requestFullscreen', undefined);
    expect(isCapable(el)).toBe(false);
  });
});

describe('isActive', () => {
  it('tells MY element apart from somebody else in fullscreen', () => {
    // The bug this pins: the shell is immersive, so *something* is fullscreen. A video asking the
    // global question concluded "I am fullscreen" and exited the shell.
    const mine = document.createElement('div');
    const shell = document.documentElement;
    pretendActive(shell);

    expect(isActive()).toBe(true); // something is
    expect(isActive(mine)).toBe(false); // but it is not me
    expect(activeEl()).toBe(shell);
  });

  it('sees through the shadow-DOM retarget', () => {
    // `document.fullscreenElement` reports the HOST; the real element only shows in its own root.
    const host = document.createElement('div');
    document.body.append(host);
    const root = host.attachShadow({ mode: 'open' });
    const stage = document.createElement('div');
    root.append(stage);

    pretendActive(host);
    define(root, 'fullscreenElement', stage);

    expect(isActive(stage)).toBe(true);
    host.remove();
  });

  it('is false when nothing is in fullscreen', () => {
    expect(isActive()).toBe(false);
    expect(activeEl()).toBeNull();
  });
});

describe('request', () => {
  it('defaults to the document element', async () => {
    await request();
    expect(requested).toEqual([document.documentElement]);
  });

  it('rejects with "Not capable" instead of doing nothing in silence', async () => {
    installApi(false);
    await expect(request()).rejects.toThrow(/not capable/i);
    expect(requested).toEqual([]);
  });

  it('lets a denial from the browser reach the caller', async () => {
    define(Element.prototype, 'requestFullscreen', () => Promise.reject(new Error('denied')));
    await expect(request()).rejects.toThrow('denied');
  });
});

describe('exit', () => {
  it('is a no-op when nothing is in fullscreen', async () => {
    await exit();
    expect(exited).toBe(0);
  });

  it('exits when something is', async () => {
    pretendActive(document.documentElement);
    await exit();
    expect(exited).toBe(1);
  });
});

describe('toggle', () => {
  it('REQUESTS mine while somebody else is in fullscreen, it does not exit theirs', async () => {
    // The regression guard for bug (1): shell immersive + press the video's fullscreen button.
    const mine = document.createElement('div');
    pretendActive(document.documentElement);

    await toggle(mine);

    expect(requested).toEqual([mine]);
    expect(exited).toBe(0);
  });

  it('exits when the element in fullscreen is mine', async () => {
    const mine = document.createElement('div');
    pretendActive(mine);

    await toggle(mine);

    expect(exited).toBe(1);
    expect(requested).toEqual([]);
  });
});

describe('onChange', () => {
  it('reports the change and unsubscribes on demand', () => {
    const seen: (Element | null)[] = [];
    const stop = onChange((el) => seen.push(el));

    pretendActive(document.documentElement);
    document.dispatchEvent(new Event('fullscreenchange'));
    pretendActive(null);
    document.dispatchEvent(new Event('fullscreenchange'));

    expect(seen).toEqual([document.documentElement, null]);

    stop();
    pretendActive(document.documentElement);
    document.dispatchEvent(new Event('fullscreenchange'));
    expect(seen).toHaveLength(2);
  });

  it('does not leak listeners when stopped twice', () => {
    const spy = vi.spyOn(document, 'removeEventListener');
    const stop = onChange(() => {});
    stop();
    stop();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});
