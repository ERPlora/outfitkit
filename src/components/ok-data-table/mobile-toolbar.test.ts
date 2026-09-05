// @vitest-environment happy-dom

// outfitkit#76 — «on a phone the toolbar shows "Columns" and "Rows per page" (desktop controls)
// and the primary "+" is a 36px icon: at 390px the bar takes three lines before the first row».
//
// Measured on `qa-pm149` (shell 1.1.9) in Appointments and Services at 390×844: searchbar on its
// own line, then «Columns ⌃» + «10 ⌃», then the view toggle + «+». ~170px of chrome before any
// data, on top of the module's own filters. The first record started below 55% of the screen.
//
// What the market does on mobile (Shopify IndexTable, Fresha, Square Items, Material): search +
// filters in ONE line, no column picker, and the create action as a labelled primary control
// (≥44px) instead of an anonymous icon.
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
  views: unknown;
  addable: boolean;
  columnPicker: boolean;
  searchKeys: string[];
  updateComplete: Promise<unknown>;
};

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Corte' }, { id: 2, name: 'Barba' }];
  table.columns = [{ key: 'name', header: 'Nombre' }];
  table.views = true;
  table.addable = true;
  table.searchKeys = ['name'];
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

describe('ok-data-table: la barra en móvil es de móvil (#76)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('en móvil no pinta el selector de columnas ni el de filas por página', async () => {
    viewport(true);
    const table = await mount();
    const bar = table.shadowRoot?.querySelector('.bar-main');
    expect(bar, 'la barra no se pinta').toBeTruthy();
    expect(bar?.querySelector('.tk-cols'), 'el selector de columnas es un control de escritorio').toBeNull();
    expect(bar?.querySelector('.tk-psize'), 'el selector de filas por página es un control de escritorio').toBeNull();
  });

  it('en móvil el alta es un botón primario CON etiqueta, no un icono anónimo', async () => {
    viewport(true);
    const table = await mount();
    const add = table.shadowRoot?.querySelector('.bar-main .add-btn') as HTMLElement | null;
    expect(add, 'no hay botón de alta etiquetado').toBeTruthy();
    expect(add?.textContent?.trim(), 'el botón de alta no dice qué hace').toBe('Add');
    expect(table.shadowRoot?.querySelector('.bar-main .toolbtn[aria-label="Add"]'), 'el «+» icónico sigue ahí además del etiquetado').toBeNull();
  });

  it('el botón de alta etiquetado alcanza 44 px de alto (área táctil)', async () => {
    viewport(true);
    await mount();
    expect(styles(), 'el alta no llega al área táctil mínima').toMatch(/\.add-btn[^{]*\{[^}]*min-height: 44px;/);
  });

  it('pulsar el alta etiquetado abre el panel de alta, como el «+» de escritorio', async () => {
    viewport(true);
    const table = await mount();
    (table.shadowRoot?.querySelector('.bar-main .add-btn') as HTMLElement | null)?.click();
    await table.updateComplete;
    expect(table.shadowRoot?.querySelector('.drawer'), 'el alta no abre nada').toBeTruthy();
  });

  it('el alta etiquetado se traduce (es)', async () => {
    document.documentElement.lang = 'es';
    viewport(true);
    const table = await mount();
    expect(table.shadowRoot?.querySelector('.bar-main .add-btn')?.textContent?.trim()).toBe('Añadir');
  });

  it('en móvil la acción primaria (`primaryAction`) también lleva su etiqueta y 44 px', async () => {
    viewport(true);
    const table = document.createElement('ok-data-table') as unknown as Table & { primaryAction: unknown };
    table.rows = [{ id: 1, name: 'Corte' }];
    table.columns = [{ key: 'name', header: 'Nombre' }];
    table.primaryAction = { label: 'New order', icon: 'add' };
    document.body.appendChild(table);
    await table.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await table.updateComplete;
    const btn = table.shadowRoot?.querySelector('.bar-main .primary-btn') as HTMLElement | null;
    expect(btn, 'la acción primaria no se pinta').toBeTruthy();
    expect(btn?.textContent?.trim(), 'la acción primaria es un icono anónimo en móvil').toBe('New order');
    expect(btn?.classList.contains('add-btn'), 'la acción primaria no comparte el área táctil de 44px').toBe(true);
  });

  // Este test decía «en escritorio NADA cambia» y exigía el «+» icónico (`.toolbtn[aria-label=Add]`)
  // NEGANDO el botón rotulado en escritorio. Eso no era un contrato del componente: era el LÍMITE DE
  // ALCANCE de #76, que solo se metió con la barra de móvil. #113 deroga ese límite a propósito —
  // Odoo, Business Central, Shopify, WooCommerce, Lightspeed y Fresha rotulan la acción principal
  // también en escritorio— así que las dos aserciones del alta se han invertido y viven ahora en
  // `desktop-primary-action.test.ts`. Lo que #76 SÍ decidió (los controles de escritorio no bajan a
  // móvil) sigue aquí, que es lo que este test protege.
  it('en escritorio siguen sus controles propios: columnas y filas por página', async () => {
    viewport(false);
    const table = await mount();
    const bar = table.shadowRoot?.querySelector('.bar-main');
    expect(bar?.querySelector('.tk-cols'), 'escritorio pierde el selector de columnas').toBeTruthy();
    expect(bar?.querySelector('.tk-psize'), 'escritorio pierde el selector de filas por página').toBeTruthy();
  });
});
