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

  // This assertion used to demand `height: 100%`, and it was green BECAUSE the code was wrong.
  // The row only has `min-height`, so its height is indefinite and a percentage height on a flex
  // item degrades to auto: measured in Chrome, the chevron came out 32x16 -- SMALLER than the 20x20
  // it had before this campaign touched it. Missing that 14px band selects the node instead of
  // expanding it.
  //
  // `align-self: stretch` is what actually fills the cross axis of a row whose height is indefinite,
  // and it is what the parent's `align-items: center` would otherwise prevent.
  it('the chevron fills the row height for real, not through a percentage that degrades', async () => {
    const chevron = rule(await css(), '.chevron');
    // Comments stripped for this one: the rule EXPLAINS in prose why it is not height:100%, and a
    // naive matcher would read that explanation as the declaration it forbids.
    const declared = chevron.replace(/\/\*[\s\S]*?\*\//g, '');
    expect(declared, 'a percentage height needs a definite parent height, and .row has none')
      .not.toMatch(/height\s*:\s*\d+%/);
    expect(declared).toMatch(/align-self\s*:\s*stretch/);
    // Stretch fills the row's CONTENT box, and .row carries 0.38rem of vertical padding: measured in
    // Chrome that left the chevron at 32px inside a 44px row. The negative block margin reclaims
    // that padding -- dead space no one else uses -- so the hit area really is the row's full
    // height, which is what the exemption above claims. Without this the comment lies.
    expect(declared, 'the hit area must reclaim the row padding, not stop at the content box')
      .toMatch(/margin-block\s*:\s*-0\.38rem/);
    expect(declared).toMatch(/padding-block\s*:\s*0\.38rem/);
    expect(declared, 'and it widens as far as the label allows').toMatch(/width\s*:\s*32px/);
  });

  it('the narrow axis is an ARGUED exemption, not a silenced one', async () => {
    expect(rule(await css(), '.chevron')).toMatch(/ok-tap-exempt\s*:\s*[A-Za-z]/);
  });
});
