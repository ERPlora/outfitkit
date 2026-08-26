// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { OkImage } from './ok-image.js';
import './ok-image.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkImage.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-image — tap targets (#92)', () => {
  it('.lb-close grows to the 44px floor -- a lone corner button, nothing to preserve', () => {
    const css = stylesText();
    const m = /\.lb-close\s*\{([^}]*)\}/.exec(css);
    expect(m, '.lb-close rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('renders the lightbox close button at the grown size', async () => {
    const el = document.createElement('ok-image') as OkImage;
    el.src = 'a.jpg';
    el.zoom = 'lightbox';
    document.body.append(el);
    await el.updateComplete;
    el.shadowRoot!.querySelector<HTMLElement>('.frame')!.click();
    await el.updateComplete;
    const close = el.shadowRoot!.querySelector('.lb-close');
    expect(close).not.toBeNull();
    el.remove();
  });
});
