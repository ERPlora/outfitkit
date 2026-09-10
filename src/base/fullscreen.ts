// The ONE door to the native Fullscreen API for the whole library.
//
// Not a component and not a plugin: a plain framework-agnostic helper, same shape as `anchor.ts`
// or `relay.ts`. Every `ok-*` keeps being a Web Component and keeps its own button; what it stops
// owning is the API dance, which was written four times and got a different half wrong each time.
//
// Two things every copy was missing, and both are user-visible:
//
//   · WHO is in fullscreen. `document.fullscreenElement` is a global: with the Hub shell already
//     immersive (it fullscreens `documentElement`), a video asking that question concluded "I am
//     fullscreen" and its button dropped the SHELL out of immersive mode instead of growing the
//     video. `isActive(el)` asks about one element, so the two no longer fight.
//
//   · WHETHER the browser can do it at all. On iOS Safari `requestFullscreen` is simply absent, so
//     a button painted unconditionally does nothing when pressed. `isCapable()` is published so the
//     component can hide the control rather than lie about it.
//
// No vendor prefixes on purpose. Quasar carries `webkit`/`moz`/`ms` for 2015 browsers; our floor is
// Ionic 8 over WebView2/WKWebView, where the unprefixed API is the only one that matters. Where a
// prefix buys real function (`video.webkitEnterFullscreen` on the iPhone) it belongs in the
// component that has the `<video>`, not here.

/** The DOM types declare these as always present; on iOS Safari and old webviews they are not. */
type MaybeFullscreen = { requestFullscreen?: (options?: FullscreenOptions) => Promise<void> };
type MaybeExit = { exitFullscreen?: () => Promise<void> };

function notCapable(): Promise<never> {
  return Promise.reject(new Error('Not capable'));
}

/**
 * Can this browser put `target` (the whole page by default) in fullscreen?
 *
 * Two independent noes: the API is missing (iOS Safari), or the document forbids it —
 * `fullscreenEnabled` is false inside an iframe that was not given `allow="fullscreen"`, which is
 * how the showcase and any embedded preview run.
 */
export function isCapable(target?: Element): boolean {
  if (typeof document === 'undefined') return false;
  if (document.fullscreenEnabled === false) return false;
  const el = (target ?? document.documentElement) as Element & MaybeFullscreen;
  return typeof el?.requestFullscreen === 'function';
}

/** The element currently in fullscreen, retargeted to the document tree, or null. */
export function activeEl(): Element | null {
  if (typeof document === 'undefined') return null;
  return document.fullscreenElement ?? null;
}

/**
 * Is `el` the element in fullscreen? With no argument: is ANYTHING in fullscreen?
 *
 * The root lookup is what makes this usable from inside a component: when an element inside a
 * shadow root goes fullscreen, `document.fullscreenElement` reports the HOST and only
 * `shadowRoot.fullscreenElement` reports the real one. Every ok-* fullscreens something inside its
 * own shadow root, so comparing against the document alone is false for all of them.
 */
export function isActive(el?: Element): boolean {
  if (typeof document === 'undefined') return false;
  if (!el) return activeEl() !== null;
  // `fullscreenElement` is optional here on purpose: a detached node's root is a plain
  // DocumentFragment, which does not have it at all.
  const root = el.getRootNode() as Node & Partial<DocumentOrShadowRoot>;
  if (root !== (document as Node) && root.fullscreenElement === el) return true;
  return document.fullscreenElement === el;
}

/**
 * Enter fullscreen on `target` (the whole page by default).
 *
 * Rejects with `Not capable` when the browser cannot, and lets a denial from the browser through
 * untouched: a caller that wants to ignore it says so with `.catch()`, which is a decision, unlike
 * the silence it replaces. Needs a user gesture — call it from the click handler, not later.
 */
export function request(target?: Element): Promise<void> {
  if (typeof document === 'undefined') return notCapable();
  const el = (target ?? document.documentElement) as Element & MaybeFullscreen;
  if (!isCapable(el)) return notCapable();
  return el.requestFullscreen!();
}

/** Leave fullscreen. A no-op (resolved) when nothing is in fullscreen, so it is safe to call blind. */
export function exit(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (activeEl() === null) return Promise.resolve();
  const exitFn = (document as Document & MaybeExit).exitFullscreen;
  if (typeof exitFn !== 'function') return notCapable();
  return exitFn.call(document);
}

/**
 * Enter fullscreen on `target`, or leave it if `target` is ALREADY the one in fullscreen.
 *
 * Note what it does not do: somebody else being in fullscreen is not a reason to exit. Requesting
 * while an ancestor holds it pushes onto the browser's fullscreen stack and both survive.
 */
export function toggle(target?: Element): Promise<void> {
  return isActive(target) ? exit() : request(target);
}

/**
 * Subscribe to fullscreen changes; returns the unsubscriber (calling it twice is harmless).
 *
 * A function instead of reactive state because OutfitKit ships Web Components to three hosts (Ionic
 * Vue, Django templates, a module's Lit bundle) and cannot depend on any one framework's
 * reactivity. A Vue host wraps this in its own `ref`.
 *
 * Worth subscribing to even when you own the button: Esc and F11 leave fullscreen without going
 * through it, and a control that does not hear about it goes on showing the wrong icon.
 */
export function onChange(fn: (el: Element | null) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const handler = (): void => fn(activeEl());
  document.addEventListener('fullscreenchange', handler);
  let stopped = false;
  return () => {
    if (stopped) return;
    stopped = true;
    document.removeEventListener('fullscreenchange', handler);
  };
}
