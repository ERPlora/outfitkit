// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract exercised here).
vi.mock('../../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
}));

import { OkCarousel } from './ok-carousel.js';
import './ok-carousel.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkCarousel.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-carousel — tap targets (#92)', () => {
  it('.dot keeps the 9px indicator drawing -- that is the correct market size, never grown', () => {
    const css = stylesText();
    const m = /\.dot\s*\{([^}]*)\}/.exec(css);
    expect(m, '.dot rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*9px/);
    expect(body).toMatch(/height:\s*9px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the dots stay 0.5rem apart -- the hit area must fit the real pitch, not grow the row', () => {
    const css = stylesText();
    const m = /\.dots\s*\{([^}]*)\}/.exec(css);
    expect(m, '.dots rule not found').not.toBeNull();
    expect(m![1]).toMatch(/gap:\s*0\.5rem/);
  });

  it('caps the hit area to the real dot pitch (9px dot + 8px gap) so neighbours never overlap', () => {
    const css = stylesText();
    // Deliberately NOT the blanket 44px floor: with an 8px gap between 9px dots, a 44px hit
    // area per dot would overlap every neighbour. The cap is the actual center-to-center pitch.
    const m = /\.dot\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.dot.ok-tap::before override not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*calc\(9px \+ 0\.5rem\)/);
    expect(body).toMatch(/height:\s*calc\(9px \+ 0\.5rem\)/);
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders each dot with the ok-tap marker so the capped hit area applies', async () => {
    const el = document.createElement('ok-carousel') as OkCarousel;
    el.slides = ['one', 'two', 'three'];
    document.body.append(el);
    await el.updateComplete;
    const dots = el.shadowRoot!.querySelectorAll('.dot');
    expect(dots.length).toBe(3);
    dots.forEach((dot) => expect(dot.classList.contains('ok-tap')).toBe(true));
    el.remove();
  });
});
