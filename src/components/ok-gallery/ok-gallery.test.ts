// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { OkGallery } from './ok-gallery.js';
import './ok-gallery.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkGallery.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-gallery — tap targets (#92)', () => {
  it('.select keeps the small 22px badge drawing -- widening it would dominate the thumbnail', () => {
    const css = stylesText();
    const m = /\.select\s*\{([^}]*)\}/.exec(css);
    expect(m, '.select rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*22px/);
    expect(body).toMatch(/height:\s*22px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders the selection badge with the ok-tap marker so the hit area applies', async () => {
    const el = document.createElement('ok-gallery') as OkGallery;
    el.images = [{ src: 'a.jpg', alt: 'a' }];
    el.selectable = true;
    document.body.append(el);
    await el.updateComplete;
    const badge = el.shadowRoot!.querySelector('.select');
    expect(badge?.classList.contains('ok-tap')).toBe(true);
    el.remove();
  });
});
