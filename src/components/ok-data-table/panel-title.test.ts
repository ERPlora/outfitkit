// @vitest-environment happy-dom

// outfitkit#150 — «the table panel is titled "New" even when you are editing an existing record».
//
// Seen in Services: the edit icon on «Brushing» opened the side panel with the header «Nuevo» while
// its own body said «Editando servicio — Brushing». The header only knew two cases (filters / new).
// Contract: the opener says which mode it opens (`open('edit')` → «Editar» / «Edit») and may pass
// the header itself (`open('edit', { title })`); a custom title never leaks into the next opening.
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
  labels: Record<string, string>;
  open: (p?: 'filters' | 'create' | 'edit', opts?: { title?: string }) => void;
  close: () => void;
  updateComplete: Promise<unknown>;
};

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Brushing' }];
  table.columns = [{ key: 'name', header: 'Nombre' }];
  table.addable = true;
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const heading = (t: Table) => t.shadowRoot?.querySelector('.drawer .dh strong')?.textContent?.trim();
const drawer = (t: Table) => t.shadowRoot?.querySelector('.drawer');

async function clickAdd(t: Table): Promise<void> {
  (t.shadowRoot?.querySelector('.add-btn') as HTMLElement).click();
  await t.updateComplete;
}

describe('ok-data-table: the panel header says what is being done (#150)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('create mode keeps «Nuevo»', async () => {
    const t = await mount();
    t.open('create');
    await t.updateComplete;
    expect(heading(t)).toBe('Nuevo');
  });

  it('edit mode is titled «Editar», never «Nuevo»', async () => {
    const t = await mount();
    t.open('edit');
    await t.updateComplete;
    expect(heading(t)).toBe('Editar');
    expect(drawer(t)?.querySelector('slot[name="create"]'), 'edit mode must render the same form slot').toBeTruthy();
  });

  it('edit mode is titled «Edit» in English', async () => {
    document.documentElement.lang = 'en';
    const t = await mount();
    t.open('edit');
    await t.updateComplete;
    expect(heading(t)).toBe('Edit');
  });

  it('the consumer label overrides editRecord', async () => {
    const t = await mount();
    t.labels = { editRecord: 'Modificar' };
    t.open('edit');
    await t.updateComplete;
    expect(heading(t)).toBe('Modificar');
  });

  it('the opener can pass the header itself', async () => {
    const t = await mount();
    t.open('edit', { title: 'Editando servicio — Brushing' });
    await t.updateComplete;
    expect(heading(t)).toBe('Editando servicio — Brushing');
    expect(drawer(t)?.getAttribute('aria-label'), 'the dialog is announced with its visible title').toBe(
      'Editando servicio — Brushing',
    );
  });

  it('a custom title does not leak into the next opening', async () => {
    const t = await mount();
    t.open('edit', { title: 'Editando servicio — Brushing' });
    await t.updateComplete;
    t.close();
    await t.updateComplete;
    await clickAdd(t);
    expect(heading(t)).toBe('Nuevo');
    t.close();
    await t.updateComplete;
    t.open('edit');
    await t.updateComplete;
    expect(heading(t)).toBe('Editar');
  });

  it('pressing Add while editing switches the panel to create instead of closing it', async () => {
    const t = await mount();
    t.open('edit', { title: 'Editando servicio — Brushing' });
    await t.updateComplete;
    await clickAdd(t);
    expect(drawer(t), 'Add closed the panel').toBeTruthy();
    expect(heading(t)).toBe('Nuevo');
  });
});
