// TAP-TARGET GUARD (#92) — no interactive control may be smaller than the finger that has to hit it.
//
// Why this exists: ERPlora is a POS. The customer's real device is a touchscreen -- a tablet, a
// counter monitor, a phone -- and the mouse is the rare case. The August 2026 touch audit found the
// SAME defect in 21 components: a control declared at 6px, 9px, 18px, 28px. Those are not 57
// separate bugs, they are one missing library decision, and without a guard they come straight back
// the next time someone writes `width: 28px; cursor: pointer`.
//
// 44px is where Apple HIG, Material Design and WCAG 2.5.8 (Target Size) all land.
//
// What the guard reads: the `static styles` of every component. A rule counts as interactive when it
// declares `cursor: pointer` or its selector is a button. If such a rule pins width/height/min-width/
// min-height below 44px, it fails.
//
// The escape hatch is DELIBERATE and has to be argued in writing: a rule may carry
// `/* ok-tap-exempt: <reason> */` inside its own block. Two legitimate shapes:
//   - the drawing MUST stay small (a 9px carousel dot) and the hit area is widened with a
//     transparent `::before` -- the exemption points at it;
//   - the control sits inside something smaller than the minimum by nature (ok-scheduler's resize
//     handle: a 15-minute appointment is shorter than 44px).
// A bare exemption with no reason does not parse, so "silence it and move on" is not available.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ROOT = new URL('../components/', import.meta.url);
const MIN_PX = 44;
const SIZE_PROPS = ['width', 'height', 'min-width', 'min-height'] as const;

/** px value of a length, or null when it is not a fixed length (%, calc, var, auto...). */
function toPx(value: string): number | null {
  const m = /^(-?[\d.]+)(px|rem|em)$/.exec(value.trim());
  if (!m) return null;
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * 16;
}

interface Offence {
  component: string;
  selector: string;
  prop: string;
  px: number;
}

/**
 * Rules are read from the RAW source, comments included: the exemption marker lives in a comment,
 * so stripping them first would throw away the one thing that makes a rule legal.
 */
function offences(component: string, source: string): Offence[] {
  const found: Offence[] = [];
  for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selector = rule[1].trim().split('\n').pop()!.trim();
    const body = rule[2];
    // The reason has to START with a word: `/* ok-tap-exempt: */` would otherwise pass on the
    // comment's own closing `*`, which is exactly the empty exemption this guard refuses.
    if (/ok-tap-exempt\s*:\s*[A-Za-z0-9]/.test(body)) continue;

    const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
    // A pseudo-element rule is never a control: `.dot::before` is the widened HIT AREA, which is the
    // fix for a small target, not another instance of it. Without this the guard reports its own
    // remedy -- and `\b` happily matches the `button` in `.dots button::before`.
    if (/::(before|after)/.test(selector)) continue;

    const interactive = /cursor\s*:\s*pointer/.test(clean) || /(^|\s)(button|\.btn)\b/.test(selector);
    if (!interactive) continue;

    for (const prop of SIZE_PROPS) {
      const decl = new RegExp(`(?:^|;|\\s)${prop}\\s*:\\s*([^;]+);`).exec(clean);
      if (!decl) continue;
      const px = toPx(decl[1]);
      if (px !== null && px > 0 && px < MIN_PX) found.push({ component, selector, prop, px });
    }
  }
  return found;
}

function everyComponent(): Array<{ component: string; source: string }> {
  const out: Array<{ component: string; source: string }> = [];
  for (const dir of readdirSync(ROOT)) {
    try {
      out.push({ component: dir, source: readFileSync(new URL(`${dir}/${dir}.ts`, ROOT), 'utf8') });
    } catch {
      // A folder with no same-named component file (helpers, fixtures) has no styles to guard.
    }
  }
  return out;
}

describe('tap targets: nothing interactive under 44px (#92)', () => {
  it('the guard can actually see an offence -- otherwise a green run proves nothing', () => {
    const fake = '.dot { width: 9px; height: 9px; cursor: pointer; }';
    expect(offences('fake', fake)).toHaveLength(2);
  });

  it('a pseudo-element is not a control: the overlay that FIXES a small target must not be flagged', () => {
    const overlay = ".dots button::before { content: ''; width: 20px; height: 20px; }";
    expect(offences('fake', overlay), 'the hit area is the fix, not the defect').toHaveLength(0);
  });

  it('an argued exemption is respected, and only when it carries a reason', () => {
    const argued = '.dot { /* ok-tap-exempt: hit area widened by .dot::before */ width: 9px; cursor: pointer; }';
    expect(offences('fake', argued)).toHaveLength(0);

    const bare = '.dot { /* ok-tap-exempt: */ width: 9px; cursor: pointer; }';
    expect(bare && offences('fake', bare), 'an empty reason is not an exemption').toHaveLength(1);
  });

  it('no component declares an interactive control below the minimum', () => {
    const all = everyComponent().flatMap(({ component, source }) => offences(component, source));
    const report = all.map((o) => `${o.component}: ${o.selector} -> ${o.prop}: ${o.px}px`).sort();
    expect(report, `controls under ${MIN_PX}px:\n${report.join('\n')}`).toEqual([]);
  });
});

// The shared fix. 43 offences across 21 components are not 43 different problems, so they must not
// become 43 different patches: `tapTarget` is the one piece every component reuses.
describe('tapTarget: the shared hit-area fragment', () => {
  it('widens the HIT AREA without touching the drawing', async () => {
    const { tapTarget } = await import('./tap-target');
    const css = tapTarget.cssText;

    expect(css, 'the overlay must be a pseudo-element, so the control keeps its own box').toMatch(/::before/);
    expect(css, 'it must never paint: it only catches the finger').toMatch(/content\s*:\s*''/);
    expect(css, 'it grows to the minimum only when the control is smaller').toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  // Measured in Chrome, and it is how ok-color-picker shipped broken: `position:absolute` resolves
  // against the nearest POSITIONED ancestor, so a host that forgets `position:relative` sends its
  // hit area somewhere else entirely. The 10 preset swatches landed stacked in the middle of the
  // panel, on top of the saturation square -- a click there set the colour to #000000.
  //
  // Leaving that to each component to remember is not a contract, it is a trap. The fragment
  // positions the host itself; a component that genuinely needs another value declares it in its own
  // rule, which comes later in `static styles` and wins.
  it('positions the HOST, so the overlay cannot land on an ancestor', async () => {
    const { tapTarget } = await import('./tap-target');
    const noComments = tapTarget.cssText.replace(/\/\*[\s\S]*?\*\//g, '');
    const host = (noComments.match(/\.ok-tap(?!::)[^{]*\{[^}]*\}/g) ?? []).join('\n');
    expect(host, 'the fragment must style .ok-tap itself, not only its ::before').not.toBe('');
    expect(host).toMatch(/position\s*:\s*relative/);
  });

  it('reads the minimum from the theme token, with 44px as the built-in floor', async () => {
    const { tapTarget } = await import('./tap-target');
    expect(tapTarget.cssText).toMatch(/var\(--ok-tap-min,\s*44px\)/);
  });

  it('the theme declares the token, so a product can raise it for a rougher counter', () => {
    const theme = readFileSync(new URL('../theme/erplora.css', import.meta.url), 'utf8');
    expect(theme).toMatch(/--ok-tap-min\s*:\s*44px/);
  });
});

// An overlay is only a hit area if it lands ON its control. `position: absolute` resolves against the
// nearest POSITIONED ancestor, so a `.dot::before` whose `.dot` is still `static` anchors to some
// grandparent and the touch zone ends up somewhere else on screen -- invisible, so nothing catches it
// by eye. This is the check that makes the sweep trustworthy instead of merely green.
// The other blind spot that shipped a defect: `toPx()` returns null for a percentage, so the guard
// waved through `.chevron { height: 100% }` -- and a percentage height needs a DEFINITE parent
// height. The row only had `min-height`, so it degraded to auto and the chevron came out 32x16 in
// Chrome, SMALLER than the 20x20 it had before the campaign. The guard called that a pass.
//
// A percentage height on an interactive control cannot be verified from the stylesheet alone, so it
// is not allowed to pass silently: either it is written in a unit that can be checked, or it carries
// an argued exemption like any other.
describe('a size that cannot be verified is not a size', () => {
  function percentHeights(source: string): string[] {
    const found: string[] = [];
    for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim().split('\n').pop()!.trim();
      const body = rule[2];
      if (/ok-tap-exempt\s*:\s*[A-Za-z0-9]/.test(body)) continue;
      const clean = body.replace(/\/\*[\s\S]*?\*\//g, '');
      if (!/cursor\s*:\s*pointer/.test(clean) && !/(^|\s)(button|\.btn)\b/.test(selector)) continue;
      if (/(?:^|;|\s)height\s*:\s*\d+(\.\d+)?%/.test(clean)) found.push(selector);
    }
    return found;
  }

  it('the check sees a percentage height on an interactive control', () => {
    expect(percentHeights('.chevron { height: 100%; cursor: pointer; }')).toEqual(['.chevron']);
    expect(percentHeights('.chevron { /* ok-tap-exempt: measured, parent has a definite height */ height: 100%; cursor: pointer; }')).toEqual([]);
  });

  it('no component sizes an interactive control with an unverifiable percentage height', () => {
    const all = everyComponent().flatMap(({ component, source }) =>
      percentHeights(source).map((selector) => `${component}: ${selector}`)
    );
    expect(all, `percentage heights that cannot be verified:\n${all.join('\n')}`).toEqual([]);
  });
});

describe('every hit-area overlay lands on its own control', () => {
  /** `X::before { position: absolute }` requires `X { position: relative|absolute|fixed|sticky }`. */
  function orphanOverlays(source: string): string[] {
    const rules = new Map<string, string>();
    for (const rule of source.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      const selector = rule[1].trim().split('\n').pop()!.trim();
      rules.set(selector, (rules.get(selector) ?? '') + rule[2]);
    }
    const orphans: string[] = [];
    for (const [selector, body] of rules) {
      if (!/::(before|after)/.test(selector)) continue;
      if (!/position\s*:\s*absolute/.test(body)) continue;
      // Only HIT AREAS, not decoration. Every overlay this guard exists for is centred on its control
      // with `translate(-50%, -50%)` or sized from `--ok-tap-min`; a burger-menu bar or an unread dot
      // is a different question, is deliberately anchored to an ancestor, and is none of this test's
      // business. Widening the net here would report decoration as a touch defect.
      const isHitArea = /translate\(-50%,\s*-50%\)/.test(body) || /--ok-tap-min/.test(body);
      if (!isHitArea) continue;
      // The host is looked up by its LAST compound, not by the whole selector string: positioning is
      // routinely declared on the plain element (`.circle-row { position: relative }`) while the
      // overlay hangs off a qualified one (`.step:not(:first-child) .circle-row::before`). Comparing
      // the full strings would report every one of those as broken.
      const host = selector.replace(/::(before|after)/, '').trim();
      const tail = host.split(/\s+/).pop()!;
      let positioned = false;
      for (const [otherSelector, otherBody] of rules) {
        if (/::(before|after)/.test(otherSelector)) continue;
        const matchesHost = otherSelector.split(',').some((one) => one.trim().endsWith(tail));
        if (matchesHost && /position\s*:\s*(relative|absolute|fixed|sticky)/.test(otherBody)) {
          positioned = true;
          break;
        }
      }
      if (!positioned) orphans.push(selector);
    }
    return orphans;
  }

  it('the check can see an orphan -- otherwise a green run proves nothing', () => {
    const broken =
      ".dot { width: 9px; } .dot::before { content: ''; position: absolute; transform: translate(-50%, -50%); }";
    expect(orphanOverlays(broken)).toEqual(['.dot::before']);

    const fixed =
      ".dot { position: relative; width: 9px; } .dot::before { content: ''; position: absolute; transform: translate(-50%, -50%); }";
    expect(orphanOverlays(fixed)).toEqual([]);
  });

  it('no component ships an overlay anchored to the wrong element', () => {
    const orphans = everyComponent().flatMap(({ component, source }) =>
      orphanOverlays(source).map((sel) => `${component}: ${sel}`)
    );
    expect(orphans, `overlays with no positioned host:\n${orphans.join('\n')}`).toEqual([]);
  });
});
