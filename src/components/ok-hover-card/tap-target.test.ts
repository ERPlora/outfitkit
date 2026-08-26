// Tap-target guard (#92): the footer action buttons (`.action`, up to 2 side by side via
// `flex: 1`) were pinned at 28px tall. Option A (grow to 44px): the buttons already share the
// footer's full width via flex, so a taller box does not create any overlap -- it just makes the
// footer a bit taller, which is the expected shape for a real button.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(new URL('./ok-hover-card.ts', import.meta.url), 'utf8');

function rule(className: string): string {
  const re = new RegExp(`\\.${className}\\s*\\{([^{}]*)\\}`);
  const m = re.exec(SOURCE);
  if (!m) throw new Error(`rule not found: .${className}`);
  return m[1];
}

describe('ok-hover-card: footer .action reaches the 44px tap-target floor (#92)', () => {
  it('height reads from --ok-tap-min, not a bare px value', () => {
    const body = rule('action');
    expect(body, 'height must float with the theme token').toMatch(/height\s*:\s*var\(--ok-tap-min,\s*44px\)/);
  });
});
