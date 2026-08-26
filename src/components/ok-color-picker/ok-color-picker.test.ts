// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { OkColorPicker } from './ok-color-picker.js';
import './ok-color-picker.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkColorPicker.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-color-picker — tap targets (#92)', () => {
  it('.swatch grows to the 44px floor -- a standalone trigger button, nothing to squeeze against', () => {
    const css = stylesText();
    const m = /\.swatch\s*\{([^}]*)\}/.exec(css);
    expect(m, '.swatch rule not found').not.toBeNull();
    expect(m![1]).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(m![1]).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.hue keeps its 14px bar -- a thicker slider would dwarf the SV square above it', () => {
    const css = stylesText();
    const m = /\.hue\s*\{([^}]*)\}/.exec(css);
    expect(m, '.hue rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/height:\s*14px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('caps the .hue hit area to the real vertical room (its own margin-top + the hexrow gap below) so it never covers the SV square or the hex input', () => {
    const css = stylesText();
    // Deliberately NOT the blanket 44px floor: the panel is only 0.7rem away from the SV square
    // above and the hex row below. A 44px-tall target centered on a 14px bar would eat into both.
    const m = /\.hue\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.hue.ok-tap::before override not found').not.toBeNull();
    expect(m![1]).toMatch(/height:\s*calc\(14px \+ 0\.7rem \+ 0\.7rem\)/);
  });

  it('.presets button keeps its 20px swatch drawing -- shrinking the preset row would defeat the point of a quick-pick palette', () => {
    const css = stylesText();
    const m = /\.presets button\s*\{([^}]*)\}/.exec(css);
    expect(m, '.presets button rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*20px/);
    expect(body).toMatch(/height:\s*20px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('caps the .presets button hit area to the real pitch (20px swatch + 0.3rem gap) so neighbouring presets never overlap', () => {
    const css = stylesText();
    const m = /\.presets button\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.presets button.ok-tap::before override not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*calc\(20px \+ 0\.3rem\)/);
    expect(body).toMatch(/height:\s*calc\(20px \+ 0\.3rem\)/);
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders .hue and every preset swatch with the ok-tap marker so the capped hit areas apply', async () => {
    const el = document.createElement('ok-color-picker') as OkColorPicker;
    el.presets = ['#111111', '#222222'];
    document.body.append(el);
    await el.updateComplete;
    (el.shadowRoot!.querySelector('button.swatch') as HTMLElement).click();
    await el.updateComplete;

    const hue = el.shadowRoot!.querySelector('.hue');
    expect(hue?.classList.contains('ok-tap')).toBe(true);

    const presetButtons = el.shadowRoot!.querySelectorAll('.presets button');
    expect(presetButtons.length).toBe(2);
    presetButtons.forEach((btn) => expect(btn.classList.contains('ok-tap')).toBe(true));

    el.remove();
  });
});
