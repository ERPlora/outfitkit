// @vitest-environment happy-dom
//
// #94 — the trigger only listened to `mouseenter`/`mouseleave`/`focusin`/`focusout`. With a
// finger there is no hover, so the card never opened unless the slotted content happened to be
// focusable and the tap gave it focus — a coincidence, not a design. The fix: a tap toggles the
// card open/closed, and a tap outside closes it. Hover stays exactly as it was for the mouse; the
// tap path is added, not swapped in.
import { beforeEach, describe, expect, it, vi } from 'vitest';

import './ok-hover-card.js';
import type { OkHoverCard } from './ok-hover-card.js';

// Real timers throughout: `show()` chains two `requestAnimationFrame`s to flip the entry
// animation on, and happy-dom's RAF does not play well with vitest's fake timers. Delays are
// zeroed on the instance so the (real, but tiny) open/close waits stay fast and deterministic.
async function mount(): Promise<OkHoverCard> {
  const element = document.createElement('ok-hover-card') as OkHoverCard;
  element.name = 'Ada Lovelace';
  element.body = 'Mathematician';
  element.openDelay = 0;
  element.closeDelay = 0;
  const trigger = document.createElement('span');
  trigger.textContent = '@ada';
  element.appendChild(trigger);
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function triggerEl(element: OkHoverCard): HTMLElement {
  return element.shadowRoot!.querySelector('.trigger') as HTMLElement;
}

function tap(target: HTMLElement): void {
  target.dispatchEvent(new PointerEvent('click', { bubbles: true, composed: true, cancelable: true }));
}

async function waitFrames(n = 2): Promise<void> {
  for (let i = 0; i < n; i++) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  }
}

// Delay 0 still goes through a real `setTimeout(…, 0)`; give it a macrotask turn.
async function tick(): Promise<void> {
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}

async function isShown(element: OkHoverCard): Promise<boolean> {
  await tick();
  await waitFrames();
  await element.updateComplete;
  return element.shadowRoot!.querySelector('.card.shown') != null;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ok-hover-card · a tap opens and closes the card (#94)', () => {
  it('opens on the first tap of the trigger', async () => {
    const element = await mount();
    tap(triggerEl(element));

    expect(await isShown(element)).toBe(true);
  });

  it('closes again on a second tap of the trigger', async () => {
    const element = await mount();
    tap(triggerEl(element));
    expect(await isShown(element)).toBe(true);

    tap(triggerEl(element));
    await tick();
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('.card.shown')).toBeFalsy();
  });

  it('closes when the tap lands outside the card', async () => {
    const element = await mount();
    tap(triggerEl(element));
    expect(await isShown(element)).toBe(true);

    document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await tick();
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('.card.shown')).toBeFalsy();
  });

  it('does not close when the tap lands inside the open card', async () => {
    const element = await mount();
    tap(triggerEl(element));
    expect(await isShown(element)).toBe(true);

    const card = element.shadowRoot!.querySelector('.card') as HTMLElement;
    card.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
    await tick();
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('.card.shown')).toBeTruthy();
  });

  it('a click that bubbles up FROM INSIDE the open card does not toggle it closed', async () => {
    // `.card` renders as a child of `.trigger` (same wrapper the tap listener sits on), so a
    // click anywhere inside the open card — not just the footer buttons — bubbles up to it too.
    const element = await mount();
    tap(triggerEl(element));
    expect(await isShown(element)).toBe(true);

    const head = element.shadowRoot!.querySelector('.head') as HTMLElement;
    tap(head);
    await tick();
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('.card.shown')).toBeTruthy();
  });

  it('emits ok-open on tap, same as the hover path', async () => {
    const element = await mount();
    const opened = vi.fn();
    element.addEventListener('ok-open', (e) => opened((e as CustomEvent).detail));

    tap(triggerEl(element));
    await isShown(element);

    expect(opened).toHaveBeenCalledWith({ open: true });
  });

  it('does not fight the hover path: hover still opens it for the mouse', async () => {
    const element = await mount();

    triggerEl(element).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));

    expect(await isShown(element)).toBe(true);
  });

  it('a tap toggles it closed even when hover is what opened it', async () => {
    const element = await mount();

    triggerEl(element).dispatchEvent(new MouseEvent('mouseenter', { bubbles: true, composed: true }));
    expect(await isShown(element)).toBe(true);

    tap(triggerEl(element));
    await tick();
    await element.updateComplete;

    expect(element.shadowRoot!.querySelector('.card.shown')).toBeFalsy();
  });
});
