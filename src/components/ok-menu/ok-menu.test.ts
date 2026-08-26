// @vitest-environment happy-dom
//
// #93 — `trigger="context"` only opened on the `contextmenu` event. Chrome on Android fires that
// on a long press; iOS/iPadOS Safari never does, so the iPad — the most likely counter tablet of
// a POS — had no way to open it at all. The fix is a long press of its own: ~500ms with the finger
// still, cancelled the moment it travels (that is a scroll, not a press), gated to
// `pointerType === 'touch'` so the mouse (where right-click already opens it) is untouched.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the touch-open contract fixed here).
vi.mock('../../base/icons.js', () => ({
  okIcon: (v?: string) => v,
}));

import './ok-menu.js';
import type { OkMenu, OkMenuEntry } from './ok-menu.js';

const ITEMS: OkMenuEntry[] = [{ id: 'copy', label: 'Copy' }];

function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  clientX: number,
  clientY: number,
  pointerType: string,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 7,
      pointerType,
      button: 0,
      clientX,
      clientY,
    }),
  );
}

async function mount(): Promise<OkMenu> {
  const element = document.createElement('ok-menu') as OkMenu;
  element.trigger = 'context';
  element.items = ITEMS;
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ok-menu · trigger="context" opens on a touch long press (#93)', () => {
  it('opens after holding a finger still for the long-press duration', async () => {
    vi.useFakeTimers();
    const element = await mount();

    pointer(element, 'pointerdown', 50, 60, 'touch');
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(true);
  });

  it('does not open on a plain tap that lifts before the hold completes', async () => {
    vi.useFakeTimers();
    const element = await mount();

    pointer(element, 'pointerdown', 50, 60, 'touch');
    vi.advanceTimersByTime(300);
    pointer(element, 'pointerup', 50, 60, 'touch');
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(false);
  });

  it('cancels the press when the finger travels first — that is a scroll', async () => {
    vi.useFakeTimers();
    const element = await mount();

    pointer(element, 'pointerdown', 50, 60, 'touch');
    pointer(element, 'pointermove', 150, 60, 'touch'); // well past the tolerance
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(false);
  });

  it('tolerates a tiny jitter under the movement threshold', async () => {
    vi.useFakeTimers();
    const element = await mount();

    pointer(element, 'pointerdown', 50, 60, 'touch');
    pointer(element, 'pointermove', 52, 61, 'touch'); // a couple of px — still a held finger
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(true);
  });

  it('does not arm a long press for the mouse — right-click already opens it', async () => {
    vi.useFakeTimers();
    const element = await mount();

    pointer(element, 'pointerdown', 50, 60, 'mouse');
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(false);
  });

  it('opens at the coordinates of the press, like the context-menu path does', async () => {
    vi.useFakeTimers();
    const element = await mount();
    Object.defineProperty(element, 'getBoundingClientRect', {
      value: () => ({ left: 10, top: 20, right: 0, bottom: 0, width: 0, height: 0, x: 10, y: 20, toJSON: () => ({}) }),
    });

    pointer(element, 'pointerdown', 50, 60, 'touch');
    vi.advanceTimersByTime(500);
    await element.updateComplete;

    const panel = element.shadowRoot!.querySelector('.panel') as HTMLElement;
    expect(panel.style.getPropertyValue('--ctx-x')).toBe('40px');
    expect(panel.style.getPropertyValue('--ctx-y')).toBe('40px');
  });

  it('the right-click contextmenu path still works (not replaced, just no longer the only way)', async () => {
    const element = await mount();

    element.dispatchEvent(
      new MouseEvent('contextmenu', { bubbles: true, composed: true, cancelable: true, clientX: 50, clientY: 60 }),
    );

    expect(element.open).toBe(true);
  });

  it('does not react to the long press when trigger is "click"', async () => {
    vi.useFakeTimers();
    const element = await mount();
    element.trigger = 'click';
    await element.updateComplete;

    pointer(element, 'pointerdown', 50, 60, 'touch');
    vi.advanceTimersByTime(500);

    expect(element.open).toBe(false);
  });
});

describe('ok-menu · iOS must not layer its own system menu on top (#93)', () => {
  it('the trigger wrapper disables the native touch callout', () => {
    const styles = Array.isArray(OkMenuStyles()) ? OkMenuStyles() : [OkMenuStyles()];
    const cssText = (styles as Array<{ cssText: string }>).map((s) => s.cssText).join('\n');
    expect(cssText).toMatch(/\.anchor\.context\s*\{[^}]*-webkit-touch-callout:\s*none/);
  });
});

function OkMenuStyles(): unknown {
  return (customElements.get('ok-menu') as unknown as { styles: unknown }).styles;
}
