// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract exercised here).
vi.mock('../../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
  iconCloseOutline: '<svg></svg>',
  iconDownloadOutline: '<svg></svg>',
  iconExpandOutline: '<svg></svg>',
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
