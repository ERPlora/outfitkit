// @vitest-environment happy-dom
// The 44px sweep (#92) flagged `.caret` at 14px wide. Reading the markup says the flag was pointing
// at the wrong thing: the caret is a decorative `<span>`, and the control is the WHOLE row
// (`role="button"`, `@click` toggles). The caret only claimed `cursor: pointer`, which is a false
// affordance -- it promises a target that is not there.
//
// The row stays dense on purpose: a JSON inspector is a read-only developer tool where 44px rows
// would fit a third of the document on screen, and every viewer on the market (Chrome DevTools
// included) keeps them tight. It does take the WCAG 2.5.8 AA floor of 24px, which costs no density
// worth having.
import { describe, expect, it } from 'vitest';

async function css(): Promise<string> {
  await import('./ok-json-viewer');
  const ctor = customElements.get('ok-json-viewer') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-json-viewer: the row is the target, not the caret (#92)', () => {
  it('the caret does not claim to be pressable: it is a decorative span', async () => {
    expect(rule(await css(), '.caret')).not.toMatch(/cursor\s*:\s*pointer/);
  });

  it('the row that IS pressable says so', async () => {
    expect(rule(await css(), '.row.has-children')).toMatch(/cursor\s*:\s*pointer/);
  });

  it('and it clears the WCAG 2.5.8 AA floor without losing the density the tool lives on', async () => {
    expect(rule(await css(), '.row')).toMatch(/min-height\s*:\s*24px/);
  });
});
