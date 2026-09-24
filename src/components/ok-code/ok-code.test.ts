// @vitest-environment happy-dom
// Copy button texts of ok-code go through the `labels` prop like every other ok-* (English
// defaults, the host passes its translation). They used to be hardcoded in Spanish (outfitkit#166).
import { describe, expect, it, beforeEach, vi } from 'vitest';

import './ok-code';
import { OkCode } from './ok-code';

async function mount(labels?: Partial<OkCode['labels']>): Promise<OkCode> {
  const el = document.createElement('ok-code') as OkCode;
  el.code = 'echo hi';
  el.copy = true;
  if (labels) el.labels = labels;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function copyButton(el: OkCode): HTMLElement {
  return el.shadowRoot!.querySelector('.copy') as HTMLElement;
}

async function clickCopy(el: OkCode): Promise<void> {
  copyButton(el).click();
  // handleCopy awaits the clipboard before flipping the `copied` state.
  await Promise.resolve();
  await Promise.resolve();
  await el.updateComplete;
}

describe('ok-code copy button labels', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('defaults to English source strings', async () => {
    const el = await mount();

    expect(copyButton(el).getAttribute('aria-label')).toBe('Copy code');
    expect(copyButton(el).textContent?.trim()).toBe('Copy');

    await clickCopy(el);
    expect(copyButton(el).textContent?.trim()).toBe('Copied');
  });

  it('renders the translation the host passes via `labels`', async () => {
    const el = await mount({ copy: 'Copiar', copied: 'Copiado', copyAriaLabel: 'Copiar código' });

    expect(copyButton(el).getAttribute('aria-label')).toBe('Copiar código');
    expect(copyButton(el).textContent?.trim()).toBe('Copiar');

    await clickCopy(el);
    expect(copyButton(el).textContent?.trim()).toBe('Copiado');
  });

  it('keeps English defaults for the labels the host does not override', async () => {
    const el = await mount({ copy: 'Copiar' });

    expect(copyButton(el).textContent?.trim()).toBe('Copiar');
    expect(copyButton(el).getAttribute('aria-label')).toBe('Copy code');
  });
});
