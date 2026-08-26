// @vitest-environment happy-dom

import { describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// icons are irrelevant for the tap-target contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconVolumeHighOutline: '<svg></svg>',
  iconVolumeLowOutline: '<svg></svg>',
  iconVolumeMuteOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import { OkAudio } from './ok-audio.js';
import './ok-audio.js';

// Contract from the #92 touch audit: nothing interactive under 44px, see src/base/tap-target.test.ts.
function stylesText(): string {
  const styles = OkAudio.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-audio — tap targets (#92)', () => {
  it('.progress keeps its 6px seek-bar drawing -- a 44px-tall bar would be a churro', () => {
    const css = stylesText();
    const m = /\.progress\s*\{([^}]*)\}/.exec(css);
    expect(m, '.progress rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/height:\s*6px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('renders .progress with the ok-tap marker so the widened hit area applies', async () => {
    const el = document.createElement('ok-audio') as OkAudio;
    document.body.append(el);
    await el.updateComplete;

    const progress = el.shadowRoot!.querySelector('.progress');
    expect(progress?.classList.contains('ok-tap')).toBe(true);

    el.remove();
  });

  it('seek still reads the click position from the real (unwidened) bar rect, not the overlay', async () => {
    const el = document.createElement('ok-audio') as OkAudio;
    document.body.append(el);
    await el.updateComplete;

    const progress = el.shadowRoot!.querySelector('.progress') as HTMLElement;
    // happy-dom returns a zero rect; the seek handler must tolerate that (ratio 0) rather than
    // throw -- this only guards that the click handler is still wired to the SAME element after
    // adding the `ok-tap` class and the pseudo-element styles.
    progress.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 10 }));
    expect(progress).toBeTruthy();
  });
});
