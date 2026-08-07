// @vitest-environment happy-dom
//
// Contract of the page lock of ok-app-launcher: while the sheet is open its portal (mounted on
// `<body>`) covers the whole viewport, so everything else on the page must be INERT — out of the
// accessibility tree, not focusable and not clickable. Closing restores the page to EXACTLY the
// state it had before opening: whatever was already `inert`/`aria-hidden` stays that way.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the behavioural contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconAppsOutline: '<svg></svg>',
  iconCloseOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import './ok-app-launcher.js';
import type { OkAppLauncher } from './ok-app-launcher.js';

let launcher: OkAppLauncher;
let page: HTMLElement;

function portalHost(): HTMLElement | null {
  return document.querySelector('[data-ok-app-launcher-portal]');
}

async function openSheet(): Promise<void> {
  (launcher.shadowRoot!.querySelector('button.trigger') as HTMLElement).click();
  await launcher.updateComplete;
}

// Closes through the public path (Esc) and finishes the exit transition by hand: happy-dom never
// fires `transitionend` on its own, and the sheet is unmounted when that event arrives.
async function closeSheet(): Promise<void> {
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  await launcher.updateComplete;
  portalHost()
    ?.shadowRoot?.querySelector('.sheet')
    ?.dispatchEvent(new Event('transitionend'));
  await launcher.updateComplete;
  await launcher.updateComplete;
}

beforeEach(async () => {
  page = document.createElement('main');
  page.innerHTML = '<button id="under">Under the sheet</button>';
  document.body.appendChild(page);
  launcher = document.createElement('ok-app-launcher') as OkAppLauncher;
  launcher.apps = [{ id: 'sales', label: 'Sales' }];
  document.body.appendChild(launcher);
  await launcher.updateComplete;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ok-app-launcher — page lock while the sheet is open', () => {
  it('marks the page under the sheet inert and hidden from the accessibility tree', async () => {
    expect(page.hasAttribute('inert'), 'the page is interactive before opening').toBe(false);

    await openSheet();

    expect(page.hasAttribute('inert'), 'the page is inert while open').toBe(true);
    expect(page.getAttribute('aria-hidden'), 'the page is hidden from AT while open').toBe('true');
  });

  it('keeps its own portal interactive', async () => {
    await openSheet();

    const portal = portalHost();
    expect(portal, 'the portal is mounted on the body').toBeTruthy();
    expect(portal!.hasAttribute('inert'), 'the overlay itself is never inert').toBe(false);
    expect(portal!.hasAttribute('aria-hidden'), 'the overlay stays in the a11y tree').toBe(false);
  });

  it('restores the page exactly when the sheet closes', async () => {
    await openSheet();
    await closeSheet();

    expect(page.hasAttribute('inert'), 'inert is released on close').toBe(false);
    expect(page.hasAttribute('aria-hidden'), 'aria-hidden is released on close').toBe(false);
    expect(page.style.pointerEvents, 'no inline pointer-events is left behind').toBe('');
  });

  it('does not un-inert content that was already inert (or aria-hidden) before opening', async () => {
    page.setAttribute('inert', '');
    page.setAttribute('aria-hidden', 'true');

    await openSheet();
    await closeSheet();

    expect(page.hasAttribute('inert'), 'a pre-existing inert survives the close').toBe(true);
    expect(page.getAttribute('aria-hidden'), 'a pre-existing aria-hidden survives').toBe('true');
  });

  it('releases the page when the launcher is disconnected while open', async () => {
    await openSheet();
    launcher.remove();

    expect(page.hasAttribute('inert'), 'no page is left locked by a removed launcher').toBe(false);
    expect(page.hasAttribute('aria-hidden')).toBe(false);
  });

  it('gives focus back to whatever was focused before opening', async () => {
    const outside = page.querySelector('#under') as HTMLElement;
    outside.focus();

    await openSheet();
    // A real engine blurs whatever focus ends up inside an inert subtree; happy-dom does not, so
    // reproduce it here — otherwise closing would leave focus on `<body>`.
    (document.activeElement as HTMLElement | null)?.blur();

    await closeSheet();

    expect(document.activeElement, 'focus returns to the pre-open element').toBe(outside);
  });

  it('falls back to pointer-events:none where inert is not supported, and restores it', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'inert')!;
    // Simulate an engine without `inert` support (older WebViews): the lock must still keep the
    // page unclickable and out of the a11y tree.
    delete (HTMLElement.prototype as unknown as Record<string, unknown>).inert;
    try {
      page.style.pointerEvents = 'auto';

      await openSheet();
      expect(page.style.pointerEvents, 'fallback blocks the pointer').toBe('none');
      expect(page.getAttribute('aria-hidden'), 'fallback hides it from AT').toBe('true');

      await closeSheet();
      expect(page.style.pointerEvents, 'the previous inline value is restored').toBe('auto');
      expect(launcher.hasAttribute('style'), 'no empty style attribute is left behind').toBe(false);
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'inert', descriptor);
    }
  });
});
