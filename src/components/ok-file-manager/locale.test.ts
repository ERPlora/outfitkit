// @vitest-environment happy-dom
//
// outfitkit#190 (from #184) — `ok-file-manager` rendered its default texts in fixed Spanish whatever
// the document language, and announced «Ruta», «Vista», «Vista lista», «Vista cuadrícula»,
// «Colapsar» and «Expandir» from hardcoded literals that no `labels` override could reach.
//
// Contract (same as `ok-data-table`): English is the source, Spanish is picked when the document
// language is `es*`, the component re-renders on `erplora:locale-changed`, and every text a person
// reads or hears can be overridden through `labels`.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconChevronForwardOutline: '<svg/>',
  iconFolderOpenOutline: '<svg/>',
  okIcon: () => '<svg/>',
}));

import './ok-file-manager.js';
import type { OkFmFolder } from './ok-file-manager.js';

type Host = HTMLElement & {
  labels: Record<string, string>;
  folders: OkFmFolder[];
  searchable: boolean;
  uploadable: boolean;
  updateComplete: Promise<unknown>;
  requestUpdate: () => void;
};

// Folders with children render expanded by default (their caret offers to collapse).
const FOLDERS: OkFmFolder[] = [
  { id: 'a', label: 'a', children: [{ id: 'a/x', label: 'x' }] },
  { id: 'b', label: 'b', children: [{ id: 'b/y', label: 'y' }] },
];

async function mount(labels: Record<string, string> = {}): Promise<Host> {
  const el = document.createElement('ok-file-manager') as Host;
  el.folders = FOLDERS;
  el.searchable = true;
  el.uploadable = true;
  el.labels = labels;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function q(el: Host, selector: string): Element {
  const node = el.shadowRoot?.querySelector(selector);
  if (!node) throw new Error(`missing ${selector}`);
  return node;
}

/** Every text the toolbar and tree expose (visible or to assistive tech). */
function texts(el: Host) {
  const viewBtns = el.shadowRoot?.querySelectorAll('.view-toggle .view-btn') ?? [];
  const carets = [...(el.shadowRoot?.querySelectorAll('button.caret:not(.leaf)') ?? [])];
  return {
    path: q(el, 'nav.crumbs').getAttribute('aria-label'),
    view: q(el, '.view-toggle').getAttribute('aria-label'),
    listView: viewBtns[0]?.getAttribute('aria-label'),
    listTitle: viewBtns[0]?.getAttribute('title'),
    gridView: viewBtns[1]?.getAttribute('aria-label'),
    gridTitle: viewBtns[1]?.getAttribute('title'),
    search: q(el, 'ion-searchbar').getAttribute('placeholder'),
    caretLabels: carets.map((c) => c.getAttribute('aria-label')),
  };
}

describe('ok-file-manager — default texts follow the document language (#190)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = '';
  });
  afterEach(() => {
    document.documentElement.lang = '';
  });

  it('defaults to English when the document has no Spanish language', async () => {
    document.documentElement.lang = 'en';
    const el = await mount();
    const t = texts(el);
    expect(t.search).toBe('Search files…');
    expect(t.path).toBe('Path');
    expect(t.view).toBe('View');
    expect(t.listView).toBe('List view');
    expect(t.listTitle).toBe('List view');
    expect(t.gridView).toBe('Grid view');
    expect(t.gridTitle).toBe('Grid view');
    expect(t.caretLabels).toContain('Collapse');
  });

  it('uses Spanish when the document language is es-*', async () => {
    document.documentElement.lang = 'es-ES';
    const el = await mount();
    const t = texts(el);
    expect(t.search).toBe('Buscar archivos…');
    expect(t.path).toBe('Ruta');
    expect(t.view).toBe('Vista');
    expect(t.listView).toBe('Vista lista');
    expect(t.gridView).toBe('Vista cuadrícula');
    expect(t.caretLabels).toContain('Contraer');
  });

  it('names a collapsed folder caret with the expand text', async () => {
    document.documentElement.lang = 'en';
    const el = await mount();
    const caret = q(el, 'button.caret:not(.leaf)') as HTMLButtonElement;
    caret.click();
    await el.updateComplete;
    expect(texts(el).caretLabels).toContain('Expand');
  });

  it('re-renders in the new language on erplora:locale-changed', async () => {
    document.documentElement.lang = 'en';
    const el = await mount();
    expect(texts(el).path).toBe('Path');
    document.documentElement.lang = 'es';
    window.dispatchEvent(new CustomEvent('erplora:locale-changed', { detail: { locale: 'es' } }));
    await el.updateComplete;
    expect(texts(el).path).toBe('Ruta');
    expect(texts(el).search).toBe('Buscar archivos…');
  });

  it('lets labels override the accessibility texts that were hardcoded', async () => {
    document.documentElement.lang = 'es';
    const el = await mount({
      path: 'Camí',
      view: 'Visualització',
      listView: 'Llista',
      gridView: 'Quadrícula',
      expand: 'Desplega',
      collapse: 'Plega',
    });
    const t = texts(el);
    expect(t.path).toBe('Camí');
    expect(t.view).toBe('Visualització');
    expect(t.listView).toBe('Llista');
    expect(t.listTitle).toBe('Llista');
    expect(t.gridView).toBe('Quadrícula');
    expect(t.caretLabels).toContain('Plega');
    (q(el, 'button.caret:not(.leaf)') as HTMLButtonElement).click();
    await el.updateComplete;
    expect(texts(el).caretLabels).toContain('Desplega');
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
