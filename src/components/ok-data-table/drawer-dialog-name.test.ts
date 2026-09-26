// @vitest-environment happy-dom

// outfitkit#193 — «the side panel is a dialog, but a screen reader calls it "Form" while it reads "New"».
//
// Seen in Customers, Staff and Pricing: the create panel opened by «+ Add» was announced with the
// generic `labels.form` («Formulario») whatever its header said, so nothing could tell «the dialog
// New» apart and a test could not scope its «Add» to the panel. Contract: the dialog's accessible
// name is exactly the header the person sees — create, edit, custom title and filters alike.
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
  updateComplete: Promise<unknown>;
};

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Brushing', status: 'active' }];
  table.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'status', header: 'Estado', filterable: true },
  ];
  table.addable = true;
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const dialog = (t: Table) => t.shadowRoot?.querySelector('[role="dialog"]') as HTMLElement | null;
const heading = (t: Table) => t.shadowRoot?.querySelector('.drawer .dh strong')?.textContent?.trim();

/** The name an AT computes: `aria-labelledby` (same shadow root) wins over `aria-label`. */
function accessibleName(t: Table): string | undefined {
  const d = dialog(t);
  const ids = d?.getAttribute('aria-labelledby');
  if (ids) {
    return ids
      .split(/\s+/)
      .map((id) => t.shadowRoot?.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
  }
  return d?.getAttribute('aria-label') ?? undefined;
}

async function openPanel(t: Table, p: 'filters' | 'create' | 'edit', opts?: { title?: string }): Promise<void> {
  t.open(p, opts);
  await t.updateComplete;
}

describe('ok-data-table: the panel dialog is named by its visible header (#193)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('create panel is announced «Nuevo», not the generic «Formulario»', async () => {
    const t = await mount();
    await openPanel(t, 'create');
    expect(heading(t)).toBe('Nuevo');
    expect(accessibleName(t)).toBe('Nuevo');
  });

  it('edit panel is announced «Editar»', async () => {
    const t = await mount();
    await openPanel(t, 'edit');
    expect(accessibleName(t)).toBe('Editar');
  });

  it('in English the create panel is announced «New»', async () => {
    document.documentElement.lang = 'en';
    const t = await mount();
    await openPanel(t, 'create');
    expect(accessibleName(t)).toBe('New');
  });

  it('a title passed by the opener is the dialog name', async () => {
    const t = await mount();
    await openPanel(t, 'create', { title: 'Nuevo cliente' });
    expect(accessibleName(t)).toBe('Nuevo cliente');
  });

  it('the filters panel is announced «Filtros»', async () => {
    const t = await mount();
    await openPanel(t, 'filters');
    expect(heading(t)).toBe('Filtros');
    expect(accessibleName(t)).toBe('Filtros');
  });
});
