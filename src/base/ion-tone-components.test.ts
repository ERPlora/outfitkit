// @vitest-environment happy-dom

// outfitkit#163 — the twin of #162 in five more components: the trash of «Delete» in `ok-mail`
// did not come out red, «Back» in `ok-wizard` did not come out grey, `ok-split-button` ignored the
// `color` the screen asked for, and the secondary buttons of `ok-cropper` and `ok-code` were blue.
//
// They all passed the tone as `color=` to an `ion-button` inside their shadow root, where Ionic's
// global `.ion-color-*` rule never arrives. The contract: no `color=`, the tone declared in line
// from the theme token through `ionTone()`.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./icons.js', () => ({
  iconArchiveOutline: '<svg></svg>',
  iconArrowRedoOutline: '<svg></svg>',
  iconArrowUndoOutline: '<svg></svg>',
  iconCheckmarkOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconCreateOutline: '<svg></svg>',
  iconDocumentAttachOutline: '<svg></svg>',
  iconTrashOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));
import '../components/ok-mail/ok-mail.js';
import '../components/ok-wizard/ok-wizard.js';
import '../components/ok-split-button/ok-split-button.js';
import '../components/ok-cropper/ok-cropper.js';
import '../components/ok-code/ok-code.js';

type Lit = HTMLElement & { updateComplete: Promise<unknown> };

async function mount<T extends Lit>(tag: string, props: Record<string, unknown> = {}): Promise<T> {
  const el = document.createElement(tag) as T;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const buttons = (el: Lit) => [...el.shadowRoot!.querySelectorAll('ion-button')] as HTMLElement[];
const style = (el: Element) => el.getAttribute('style') ?? '';

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ion-button tones inside ok-* shadow roots (#163)', () => {
  it('ok-mail: the Delete trash of the open message is red', async () => {
    const mail = await mount<Lit>('ok-mail', {
      folders: [{ id: 'inbox', name: 'Inbox' }],
      messages: [{ id: 'm1', folderId: 'inbox', from: { name: 'Ana', email: 'a@x.es' }, subject: 'Hi', date: '2026-09-01' }],
      activeFolder: 'inbox',
      activeMessage: 'm1',
    });
    const del = buttons(mail).find((b) => b.getAttribute('aria-label') === 'Delete')!;
    expect(del).toBeDefined();
    expect(del.hasAttribute('color')).toBe(false);
    expect(style(del)).toContain('--color: var(--ok-danger, var(--ion-color-danger');
  });

  it('ok-wizard: Back is a grey outline, Next keeps the default primary', async () => {
    const wizard = await mount<Lit>('ok-wizard', {
      steps: [{ label: 'One' }, { label: 'Two' }, { label: 'Three' }],
      current: 1,
    });
    const [back, next] = buttons(wizard).filter((b) => b.closest('.nav'));
    expect(back.textContent?.trim()).toBe('Back');
    expect(back.hasAttribute('color')).toBe(false);
    expect(style(back)).toContain('--border-color: var(--ok-medium, var(--ion-color-medium');
    expect(style(back)).toContain('--color: var(--ok-medium, var(--ion-color-medium');
    expect(next.hasAttribute('color')).toBe(false);
    expect(next.hasAttribute('style')).toBe(false);
  });

  it('ok-split-button: a solid danger paints both halves red, text in the contrast token', async () => {
    const split = await mount<Lit>('ok-split-button', { label: 'Delete', color: 'danger' });
    const halves = buttons(split);
    expect(halves).toHaveLength(2);
    for (const b of halves) {
      expect(b.hasAttribute('color')).toBe(false);
      expect(style(b)).toContain('--background: var(--ok-danger, var(--ion-color-danger');
      expect(style(b)).toContain('--color: var(--ok-danger-contrast, var(--ion-color-danger-contrast');
    }
  });

  it('ok-split-button: the tone follows the fill (outline and clear)', async () => {
    const outline = await mount<Lit>('ok-split-button', { label: 'More', color: 'danger', fill: 'outline' });
    for (const b of buttons(outline)) expect(style(b)).toContain('--border-color: var(--ok-danger');
    const clear = await mount<Lit>('ok-split-button', { label: 'More', color: 'danger', fill: 'clear' });
    for (const b of buttons(clear)) {
      expect(style(b)).toContain('--color: var(--ok-danger, var(--ion-color-danger');
      expect(style(b)).not.toContain('--background:');
    }
  });

  it('ok-split-button: an invalid colour renders no style instead of broken CSS', async () => {
    const split = await mount<Lit>('ok-split-button', { label: 'X', color: 'red; background: url(x)' });
    for (const b of buttons(split)) expect(b.hasAttribute('style')).toBe(false);
  });

  it('ok-cropper: Cancel is grey, Crop keeps the default primary', async () => {
    const cropper = await mount<Lit>('ok-cropper', { src: 'data:image/png;base64,AAAA', cancelLabel: 'Cancel' });
    const all = buttons(cropper);
    const cancel = all.find((b) => b.getAttribute('fill') === 'clear' && b.textContent?.trim() === 'Cancel');
    expect(cancel, 'Cancel button not rendered').toBeDefined();
    expect(cancel!.hasAttribute('color')).toBe(false);
    expect(style(cancel!)).toContain('--color: var(--ok-medium, var(--ion-color-medium');
  });

  it('ok-code: the Copy button is a grey solid', async () => {
    const code = await mount<Lit>('ok-code', { code: 'x = 1', copy: true });
    const [copy] = buttons(code);
    expect(copy.hasAttribute('color')).toBe(false);
    expect(style(copy)).toContain('--background: var(--ok-medium, var(--ion-color-medium');
    expect(style(copy)).toContain('--color: var(--ok-medium-contrast, var(--ion-color-medium-contrast');
  });
});
