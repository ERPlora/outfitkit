// @vitest-environment happy-dom
// The tree's chevron is its own control: tapping the chevron expands, tapping the label selects.
// That is what makes it the awkward case of the 44px sweep (#92) -- a 44px-WIDE hit area centred on
// a 20px chevron reaches 12px into the label, so expanding would start stealing selections.
//
// So the two axes are treated differently, and it is written down rather than waved through: the row
// grows to the full touch minimum (vertical, free), the chevron widens to 32px (horizontal,
// constrained by the label). WCAG 2.5.8 AA asks 24x24 and HIG/Material ask 44/48 -- this lands above
// AA on the constrained axis and at the full minimum on the free one.
import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for a contract about declared sizes).
vi.mock('../../base/icons.js', () => ({
  iconChevronForwardOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

async function css(): Promise<string> {
  await import('./ok-tree');
  const ctor = customElements.get('ok-tree') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-tree: the chevron is pressable with a finger (#92)', () => {
  it('the row is at least one full touch target tall', async () => {
    expect(rule(await css(), '.row')).toMatch(/min-height\s*:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('the chevron fills that height, so its hit area is the whole row', async () => {
    const chevron = rule(await css(), '.chevron');
    expect(chevron).toMatch(/height\s*:\s*100%/);
    expect(chevron, 'and it widens as far as the label allows').toMatch(/width\s*:\s*32px/);
  });

  it('the narrow axis is an ARGUED exemption, not a silenced one', async () => {
    expect(rule(await css(), '.chevron')).toMatch(/ok-tap-exempt\s*:\s*[A-Za-z]/);
  });
});
