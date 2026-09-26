// @vitest-environment happy-dom

// outfitkit#185 — `shadowAnchorEvent` turns the click that opens an `ion-popover` from inside a
// shadow root into the event Ionic can still anchor AFTER the dispatch is over: Ionic reads
// `ev.detail.ionShadowTarget || ev.target` when the popover presents, and by then the browser has
// retargeted `ev.target` to the shadow host.
import { describe, expect, it } from 'vitest';

import { shadowAnchorEvent } from './anchor.js';

describe('shadowAnchorEvent', () => {
  it('carries the element the listener sits on as ionShadowTarget, read during the dispatch', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = host.attachShadow({ mode: 'open' });
    const button = document.createElement('button');
    const icon = document.createElement('span');
    button.appendChild(icon);
    root.appendChild(button);

    let anchored: CustomEvent<{ ionShadowTarget: Element }> | undefined;
    button.addEventListener('click', (ev) => {
      anchored = shadowAnchorEvent(ev);
    });
    // The tap lands on the icon inside the button: the anchor is still the button.
    icon.dispatchEvent(new MouseEvent('click', { bubbles: true, composed: true }));

    expect(anchored?.detail.ionShadowTarget).toBe(button);
  });

  it('falls back to the event target when there is no current target', () => {
    const button = document.createElement('button');
    const ev = new MouseEvent('click');
    Object.defineProperty(ev, 'target', { value: button });

    expect(shadowAnchorEvent(ev).detail.ionShadowTarget).toBe(button);
  });
});
