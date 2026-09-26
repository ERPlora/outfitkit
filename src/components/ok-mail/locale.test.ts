// @vitest-environment happy-dom
//
// outfitkit#190 (from #184) — `ok-mail` rendered its default texts in fixed English whatever the
// document language. Contract (same as `ok-data-table`): English is the source, Spanish is picked
// when the document language is `es*`, the component re-renders on `erplora:locale-changed`, and
// `labels` still overrides every text.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconArchiveOutline: '<svg/>',
  iconArrowRedoOutline: '<svg/>',
  iconArrowUndoOutline: '<svg/>',
  iconChevronBack: '<svg/>',
  iconCreateOutline: '<svg/>',
  iconDocumentAttachOutline: '<svg/>',
  iconTrashOutline: '<svg/>',
  okIcon: () => '<svg/>',
}));

import './ok-mail.js';

type Host = HTMLElement & {
  labels: Record<string, string>;
  updateComplete: Promise<unknown>;
  requestUpdate: () => void;
};

async function mount(labels: Record<string, string> = {}): Promise<Host> {
  const el = document.createElement('ok-mail') as Host;
  el.labels = labels;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function texts(el: Host) {
  const root = el.shadowRoot;
  return {
    search: root?.querySelector('ion-searchbar')?.getAttribute('placeholder'),
    noMessages: root?.querySelector('ok-empty-state')?.getAttribute('heading'),
    compose: root?.textContent ?? '',
  };
}

describe('ok-mail — default texts follow the document language (#190)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = '';
  });
  afterEach(() => {
    document.documentElement.lang = '';
  });

  it('defaults to English when the document has no Spanish language', async () => {
    document.documentElement.lang = 'en-GB';
    const t = texts(await mount());
    expect(t.search).toBe('Search mail…');
    expect(t.noMessages).toBe('No messages');
    expect(t.compose).toContain('Compose');
  });

  it('uses Spanish when the document language is es-*', async () => {
    document.documentElement.lang = 'es-ES';
    const t = texts(await mount());
    expect(t.search).toBe('Buscar correo…');
    expect(t.noMessages).toBe('Sin mensajes');
    expect(t.compose).toContain('Redactar');
    expect(t.compose).not.toContain('Compose');
  });

  it('re-renders in the new language on erplora:locale-changed', async () => {
    document.documentElement.lang = 'en';
    const el = await mount();
    expect(texts(el).search).toBe('Search mail…');
    document.documentElement.lang = 'es';
    window.dispatchEvent(new CustomEvent('erplora:locale-changed', { detail: { locale: 'es' } }));
    await el.updateComplete;
    expect(texts(el).search).toBe('Buscar correo…');
  });

  it('keeps labels overrides above the document language', async () => {
    document.documentElement.lang = 'es';
    const t = texts(await mount({ searchPlaceholder: 'Cerca…' }));
    expect(t.search).toBe('Cerca…');
    expect(t.noMessages).toBe('Sin mensajes');
  });

  it('stops listening for locale changes once removed from the page', async () => {
    // Not «removeEventListener was called»: a handler removed with the wrong reference would
    // still fire. The proof is that the event no longer reaches the component.
    document.documentElement.lang = 'en';
    const el = await mount();
    el.remove();
    const update = vi.spyOn(el, 'requestUpdate');
    document.documentElement.lang = 'es';
    window.dispatchEvent(new CustomEvent('erplora:locale-changed', { detail: { locale: 'es' } }));
    expect(update).not.toHaveBeenCalled();
    update.mockRestore();
  });
});
