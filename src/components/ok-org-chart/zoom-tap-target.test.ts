// @vitest-environment happy-dom
// The zoom controls were 32x32px (#92). They float in the top-right corner of the chart with 6px
// between them and nothing else around, so growing them to the minimum only makes the stack taller.
// On a touchscreen these are the only way to zoom besides a pinch, so they have to be hittable.
import { describe, expect, it } from 'vitest';

async function css(): Promise<string> {
  await import('./ok-org-chart');
  const ctor = customElements.get('ok-org-chart') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-org-chart: the zoom controls are pressable (#92)', () => {
  it('each control takes the whole touch minimum', async () => {
    const btn = rule(await css(), '.ctrls button');
    expect(btn).toMatch(/width\s*:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(btn).toMatch(/height\s*:\s*var\(--ok-tap-min,\s*44px\)/);
  });
});
