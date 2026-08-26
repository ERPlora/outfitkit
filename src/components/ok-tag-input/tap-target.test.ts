// @vitest-environment happy-dom
// The chip's remove button was 1.15rem (18.4px) (#92). It cannot grow: the button lives INSIDE a
// pill, so a 44px box would inflate every chip and turn a compact tag row into three lines.
//
// The hit area grows instead, capped to the chip's own height plus its gap. That lands at 24px --
// the WCAG 2.5.8 AA target -- which is the most this control can honestly take without the pill
// growing around it. The blanket 44px would also reach into the neighbouring chip's remove button.
import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for a contract about declared sizes).
vi.mock('../../base/icons.js', () => ({ iconCloseOutline: '<svg></svg>', okIcon: (v?: string) => v }));

async function css(): Promise<string> {
  await import('./ok-tag-input');
  const ctor = customElements.get('ok-tag-input') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-tag-input: removing a tag is pressable (#92)', () => {
  it('the × keeps its size, so the chip stays a chip', async () => {
    expect(rule(await css(), '.chip .remove')).toMatch(/width\s*:\s*1\.15rem/);
  });

  it('its hit area reaches the AA target without spilling into the next chip', async () => {
    const overlay = rule(await css(), '.chip .remove::before');
    expect(overlay).toMatch(/content\s*:\s*''/);
    expect(overlay).toMatch(/width\s*:\s*24px/);
    expect(overlay).toMatch(/height\s*:\s*24px/);
  });

  it('the exemption is argued, not silenced', async () => {
    expect(rule(await css(), '.chip .remove')).toMatch(/ok-tap-exempt\s*:\s*[A-Za-z]/);
  });
});
