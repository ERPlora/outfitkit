// @vitest-environment happy-dom
// Two touch defects of the same component (#92 and #99).
//
// The expand toggle is a 22px circle floating on the node's bottom edge with nothing next to it, so
// it is the easy case: the drawing stays at 22px -- a bigger circle would look like a button glued
// to the card -- and only the hit area grows.
//
// The pan surface (`.wrap`, the viewport -- not `.canvas`, which is the world that gets
// transformed) is the other one: it declares `touch-action:none` to run its own gesture but never
// declared `user-select:none`, so dragging with a mouse selected the node text instead of panning,
// and a long press could raise the system callout on iOS.
import { describe, expect, it } from 'vitest';

async function css(): Promise<string> {
  await import('./ok-org-chart');
  const ctor = customElements.get('ok-org-chart') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-org-chart: pressable and draggable with a finger', () => {
  it('the toggle keeps its 22px drawing and gets a full-size hit area (#92)', async () => {
    const all = await css();
    expect(rule(all, '.toggle'), 'the circle must not grow').toMatch(/width\s*:\s*22px/);
    expect(all, 'the shared fragment provides the overlay').toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('the pan surface cuts text selection: dragging must pan, not select the nodes (#99)', async () => {
    const surface = rule(await css(), '.wrap');
    expect(surface, 'it already declared touch-action:none for its own gesture').toMatch(/touch-action\s*:\s*none/);
    expect(surface).toMatch(/user-select\s*:\s*none/);
    expect(surface, 'and iOS must not raise its callout on a long press').toMatch(/-webkit-touch-callout\s*:\s*none/);
  });
});
