// @vitest-environment happy-dom
// The tour dots are real `role="tab"` buttons that jump to a step (#92), and at 6x6px they were the
// smallest control in the whole library. They cannot GROW: a page-control dot is 6-9px everywhere on
// the market, and a fat one stops reading as an indicator.
//
// So the hit area grows instead, and it is capped rather than taking the blanket 44px: the dots sit
// 4px apart, so a 44px overlay would bury every neighbour under whichever one renders last -- the
// finger would land on a dot and jump to a different step. The cap is the real pitch (6px + the 4px
// gap) across, and the row's own height down, which the 10px gap to the buttons below allows.
import { describe, expect, it } from 'vitest';

async function css(): Promise<string> {
  await import('./ok-coachmark');
  const ctor = customElements.get('ok-coachmark') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-coachmark: the tour dots are pressable (#92)', () => {
  it('the dot keeps its 6px drawing', async () => {
    expect(rule(await css(), '.dots button')).toMatch(/width\s*:\s*6px/);
  });

  it('its hit area is capped to the pitch, so one dot cannot swallow its neighbours', async () => {
    const overlay = rule(await css(), '.dots button::before');
    expect(overlay, 'the overlay exists').toMatch(/content\s*:\s*''/);
    expect(overlay, 'across: the dot plus its gap, never more').toMatch(/width\s*:\s*calc\(6px \+ 4px\)/);
    expect(overlay, 'down: the row has 10px of clearance to the buttons below').toMatch(/height\s*:\s*20px/);
  });

  it('the exemption is argued, not silenced', async () => {
    expect(rule(await css(), '.dots button')).toMatch(/ok-tap-exempt\s*:\s*[A-Za-z]/);
  });
});
