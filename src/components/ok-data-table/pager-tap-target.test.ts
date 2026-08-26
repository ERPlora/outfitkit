// Tap-target guard (#92): the numbered pager buttons (`.pnum`) sat at 28px, well under the 44px
// floor -- and they are packed in a row (`.pager .nav`, gap 0.2rem) right next to the prev/next
// `ion-button`s, which the SAME file already pins to 44px (line 535). Growing `.pnum` to match is
// option A (grow to 44px): the row is desktop-only (`.isMobile` swaps to a single "load more"
// button, see #78 above), so there is plenty of width for bigger numbers, and matching the
// existing 44px nav buttons actually FIXES a visual inconsistency instead of creating one.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./ok-data-table.ts', import.meta.url), 'utf8');

function rule(className: string): string {
  const re = new RegExp(`\\.${className}\\s*\\{([^{}]*)\\}`);
  const m = re.exec(SOURCE);
  if (!m) throw new Error(`rule not found: .${className}`);
  return m[1];
}

describe('ok-data-table: .pnum reaches the 44px tap-target floor (#92)', () => {
  it('min-width and height read from --ok-tap-min, not a bare px value', () => {
    const body = rule('pnum');
    expect(body, 'min-width must float with the theme token').toMatch(/min-width\s*:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body, 'height must float with the theme token').toMatch(/height\s*:\s*var\(--ok-tap-min,\s*44px\)/);
  });
});
