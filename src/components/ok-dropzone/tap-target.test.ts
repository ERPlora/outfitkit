// @vitest-environment happy-dom
// The per-file remove button was 26x26px (#92). This one simply grows: it sits alone at the end of a
// file row with 0.5rem of gap before it, so the full minimum costs nothing but a slightly taller row
// -- which is the right trade on a touchscreen, where that button is how a mistaken file is undone.
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconCloseOutline: '<svg></svg>',
  iconCloudUploadOutline: '<svg></svg>',
  iconDocumentOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

async function css(): Promise<string> {
  await import('./ok-dropzone');
  const ctor = customElements.get('ok-dropzone') as unknown as { styles: { cssText: string } | Array<{ cssText: string }> };
  return [ctor.styles].flat().map((s) => s.cssText).join('\n');
}

const rule = (all: string, selector: string): string =>
  (all.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

describe('ok-dropzone: removing a queued file is pressable (#92)', () => {
  it('the remove button takes the whole touch minimum', async () => {
    const remove = rule(await css(), '.file .remove');
    expect(remove).toMatch(/width\s*:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(remove).toMatch(/height\s*:\s*var\(--ok-tap-min,\s*44px\)/);
  });
});
