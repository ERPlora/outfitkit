// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract exercised here).
vi.mock('../../base/icons.js', () => ({
  iconCloseOutline: '<svg></svg>',
  iconNotificationsOffOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import { OkNotificationCenter } from './ok-notification-center.js';
import './ok-notification-center.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkNotificationCenter.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-notification-center — tap targets (#92)', () => {
  it('.close-btn grows to the 44px floor -- a lone header button, nothing to preserve', () => {
    const css = stylesText();
    const m = /\.close-btn\s*\{([^}]*)\}/.exec(css);
    expect(m, '.close-btn rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('renders the panel close button', async () => {
    const el = document.createElement('ok-notification-center') as OkNotificationCenter;
    el.open = true;
    document.body.append(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.close-btn')).not.toBeNull();
    el.remove();
  });
});
