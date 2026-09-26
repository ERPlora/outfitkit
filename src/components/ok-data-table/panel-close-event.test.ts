// @vitest-environment happy-dom

// outfitkit#195 — «closing the edit panel with the X while it loads does not cancel the load».
//
// A module opens «edit», reads the full row and fills the form after an `await`. If the person
// closes the side panel meanwhile (X, backdrop, Escape) the table never told the module, so the
// late reply re-opened the panel (appointment series) or filled a closed form (staff).
// Contract: every time the side panel goes from open to closed the table emits `panelClose`
// (bubbles, composed) with `{ panel, reason }` — `panel` is what was open, `reason` how it closed.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconCalendarOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconChevronForward: '<svg></svg>',
  iconChevronUpOutline: '<svg></svg>',
  iconClose: '<svg></svg>',
  iconEllipsisVertical: '<svg></svg>',
  iconFileTrayOutline: '<svg></svg>',
  iconSwapVerticalOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import './ok-data-table.js';

type Table = HTMLElement & {
  rows: Array<Record<string, unknown>>;
  columns: Array<Record<string, unknown>>;
  addable: boolean;
  open: (p?: 'filters' | 'create' | 'edit', opts?: { title?: string }) => void;
  close: () => void;
  updateComplete: Promise<unknown>;
};

type CloseDetail = { panel: string; reason: string };

async function mount(): Promise<{ t: Table; events: CloseDetail[]; input: HTMLInputElement }> {
  const t = document.createElement('ok-data-table') as unknown as Table;
  t.rows = [{ id: 1, name: 'Brushing', kind: 'hair' }];
  t.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'kind', header: 'Tipo', filterable: true },
  ];
  t.addable = true;
  const input = document.createElement('input');
  input.slot = 'create';
  t.appendChild(input);
  const events: CloseDetail[] = [];
  // Listened on the document: the event must bubble out of the table.
  document.addEventListener('panelClose', (e) => events.push((e as CustomEvent<CloseDetail>).detail));
  document.body.appendChild(t);
  await t.updateComplete;
  return { t, events, input };
}

const drawer = (t: Table) => t.shadowRoot?.querySelector('.drawer');

async function openEdit(t: Table): Promise<void> {
  t.open('edit', { title: 'Editando servicio — Brushing' });
  await t.updateComplete;
}

function escape(target: EventTarget): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true }));
}

describe('ok-data-table: closing the side panel tells the module (#195)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('the X button closes the panel and emits panelClose', async () => {
    const { t, events } = await mount();
    await openEdit(t);
    (t.shadowRoot?.querySelector('.drawer .dh ion-button') as HTMLElement).click();
    await t.updateComplete;
    expect(drawer(t), 'the X did not close the panel').toBeNull();
    expect(events).toEqual([{ panel: 'edit', reason: 'close-button' }]);
  });

  it('tapping the backdrop closes the panel and emits panelClose', async () => {
    const { t, events } = await mount();
    await openEdit(t);
    (t.shadowRoot?.querySelector('.tk-scrim') as HTMLElement).click();
    await t.updateComplete;
    expect(drawer(t), 'the backdrop did not close the panel').toBeNull();
    expect(events).toEqual([{ panel: 'edit', reason: 'backdrop' }]);
  });

  it('Escape inside the form closes the panel and emits panelClose', async () => {
    const { t, events, input } = await mount();
    await openEdit(t);
    escape(input);
    await t.updateComplete;
    expect(drawer(t), 'Escape did not close the panel').toBeNull();
    expect(events).toEqual([{ panel: 'edit', reason: 'escape' }]);
  });

  it('Escape right after opening (focus still on the row, inside the table) closes it too', async () => {
    const { t, events } = await mount();
    await openEdit(t);
    const row = t.shadowRoot?.querySelector('tbody tr, .grow-data') ?? t.shadowRoot?.querySelector('.card');
    expect(row, 'no row rendered to hold the focus').toBeTruthy();
    escape(row as Element);
    await t.updateComplete;
    expect(drawer(t)).toBeNull();
    expect(events).toEqual([{ panel: 'edit', reason: 'escape' }]);
  });

  it('Escape with the panel already closed does nothing and still reaches the page', async () => {
    const { t, events, input } = await mount();
    let reached = false;
    document.addEventListener('keydown', () => (reached = true), { once: true });
    escape(input);
    await t.updateComplete;
    expect(events).toEqual([]);
    expect(reached, 'a closed table swallowed Escape (a surrounding modal would never close)').toBe(true);
  });

  it('Escape that closes the panel stops there: it does not also close what surrounds the table', async () => {
    const { t, input } = await mount();
    await openEdit(t);
    let reached = false;
    const spy = () => (reached = true);
    document.addEventListener('keydown', spy);
    escape(input);
    document.removeEventListener('keydown', spy);
    expect(reached).toBe(false);
  });

  it('another key does not close the panel', async () => {
    const { t, events, input } = await mount();
    await openEdit(t);
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, composed: true }));
    await t.updateComplete;
    expect(drawer(t)).toBeTruthy();
    expect(events).toEqual([]);
  });

  it('the Add button toggling the create panel off emits panelClose', async () => {
    const { t, events } = await mount();
    const add = () => (t.shadowRoot?.querySelector('.add-btn') as HTMLElement).click();
    add();
    await t.updateComplete;
    add();
    await t.updateComplete;
    expect(drawer(t)).toBeNull();
    expect(events).toEqual([{ panel: 'create', reason: 'toggle' }]);
  });

  it('Add while editing switches to create: not a close, no event', async () => {
    const { t, events } = await mount();
    await openEdit(t);
    (t.shadowRoot?.querySelector('.add-btn') as HTMLElement).click();
    await t.updateComplete;
    expect(drawer(t)).toBeTruthy();
    expect(events).toEqual([]);
  });

  it('close() from the module emits panelClose with reason api, once', async () => {
    const { t, events } = await mount();
    await openEdit(t);
    t.close();
    t.close();
    await t.updateComplete;
    expect(events).toEqual([{ panel: 'edit', reason: 'api' }]);
  });

  it('applying the client filters closes the filters panel with reason apply', async () => {
    const { t, events } = await mount();
    t.open('filters');
    await t.updateComplete;
    const apply = [...(t.shadowRoot?.querySelectorAll('.drawer ion-button') ?? [])].find(
      (b) => b.textContent?.trim() === 'Aplicar',
    ) as HTMLElement | undefined;
    expect(apply, 'no «Aplicar» button in the filters panel').toBeTruthy();
    apply?.click();
    await t.updateComplete;
    expect(drawer(t)).toBeNull();
    expect(events).toEqual([{ panel: 'filters', reason: 'apply' }]);
  });

  it('the event bubbles and crosses shadow roots', async () => {
    const { t } = await mount();
    await openEdit(t);
    let seen: Event | undefined;
    t.addEventListener('panelClose', (e) => (seen = e), { once: true });
    t.close();
    expect(seen?.bubbles).toBe(true);
    expect(seen?.composed).toBe(true);
  });
});
