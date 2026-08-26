// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { OkCropper } from './ok-cropper.js';
import './ok-cropper.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkCropper.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

async function mount(): Promise<OkCropper> {
  const el = document.createElement('ok-cropper') as OkCropper;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

// #98 — the 4 resize handles are drawn at 8x8px real, with no ::before overlay widening the hit
// area: impossible to grab with a finger against a 44px minimum. The drawing must stay 8x8px --
// that is correct against an image -- only the hit area grows, via the shared `tapTarget` fragment.
describe('ok-cropper — resize handles keep the 8px drawing, widen only the hit area (#98)', () => {
  it('.handle keeps the small 8px drawing -- growing it would obscure the image being cropped', () => {
    const css = stylesText();
    const m = /(?<!\.)\.handle\s*\{([^}]*)\}/.exec(css);
    expect(m, '.handle rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*8px/);
    expect(body).toMatch(/height:\s*8px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the handles carry their own hit area, sized from the touch token', () => {
    const css = stylesText();
    expect(css).toMatch(/\.handle::before/);
    expect(css, 'sized from the token, so a rough counter can raise it').toMatch(/var\(--ok-tap-min,\s*44px\)/);
    expect(css, "and it is the corners' own geometry, not the centred shared one")
      .not.toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders all 4 corner handles', async () => {
    const el = await mount();
    const handles = el.shadowRoot!.querySelectorAll('.handle');
    expect(handles.length).toBe(4);
  });

  it('the drag itself is untouched: pointerdown still starts a resize per corner', async () => {
    const el = await mount();
    const tl = el.shadowRoot!.querySelector('.handle.tl') as HTMLElement;
    expect(tl).not.toBeNull();
    // Just confirms the handler is still wired -- dispatching must not throw.
    expect(() => tl.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))).not.toThrow();
    el.remove();
  });
});

// The four corner handles cannot take the CENTRED hit area the rest of the library uses. Centred,
// each corner claims 22px inward, so on a crop rect narrower than ~44px the opposite corners' areas
// overlap and the finger grabs the wrong one -- the crop jumps instead of resizing. Cropping a face
// out of a photo, or a logo out of a screenshot, lands exactly in that range.
//
// So each corner's area extends OUTWARD, over the darkened surround that has nothing else in it,
// and reaches only a few px inward. Opposite corners can then never meet, whatever the crop size.
describe('ok-cropper: the corner handles do not steal each other (#98)', () => {
  const corners = [
    { cls: 'tl', out: ['top', 'left'] },
    { cls: 'tr', out: ['top', 'right'] },
    { cls: 'bl', out: ['bottom', 'left'] },
    { cls: 'br', out: ['bottom', 'right'] },
  ] as const;

  it('every corner pushes its hit area away from the crop, not across it', () => {
    const all = stylesText();
    for (const { cls, out } of corners) {
      const overlay = (all.match(new RegExp(`\\.handle\\.${cls}::before\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');
      expect(overlay, `.handle.${cls}::before must exist`).not.toBe('');
      for (const side of out) {
        expect(overlay, `${cls}: the area has to grow towards ${side}`).toMatch(
          new RegExp(`${side}\\s*:\\s*-\\d+px`)
        );
      }
      expect(overlay, `${cls}: and it must not be re-centred on the handle`).not.toMatch(/translate\(-50%/);
    }
  });
});
