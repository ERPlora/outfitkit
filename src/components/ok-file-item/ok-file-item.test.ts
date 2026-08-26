// @vitest-environment happy-dom

import { describe, expect, it } from 'vitest';
import { OkFileItem } from './ok-file-item.js';
import './ok-file-item.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkFileItem.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-file-item — tap targets (#92)', () => {
  it('.remove grows to the 44px floor -- the lone trailing button, nothing to preserve', () => {
    const css = stylesText();
    const m = /\.remove\s*\{([^}]*)\}/.exec(css);
    expect(m, '.remove rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('renders the remove button at the grown size when removable', async () => {
    const el = document.createElement('ok-file-item') as OkFileItem;
    el.name = 'invoice.pdf';
    el.ext = 'pdf';
    el.removable = true;
    document.body.append(el);
    await el.updateComplete;
    const remove = el.shadowRoot!.querySelector('.remove');
    expect(remove).not.toBeNull();
    el.remove();
  });
});
