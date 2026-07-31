// @vitest-environment happy-dom

// #274 — «Servicios no cambia a tarjetas en móvil»: ok-data-table solo conmutaba a tarjetas con
// el toggle manual; `viewMode` por defecto era 'table' y NO había ningún matchMedia/breakpoint que
// la forzara en móvil. En pantallas estrechas el usuario se quedaba en tabla (con scroll lateral)
// aunque la vista de tarjetas estuviera disponible. Aquí se fija: si las tarjetas están habilitadas
// y el viewport es estrecho, arranca en tarjetas.
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
  // viewMode es privado; lo leemos por reflection sobre el render (cards vs table) y por API si la hay.
  updateComplete: Promise<unknown>;
};

function mount(): Table {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Corte' }, { id: 2, name: 'Barba' }];
  table.columns = [{ key: 'name', header: 'Nombre' }];
  table.views = true; // habilita tarjetas
  document.body.appendChild(table);
  return table;
}

/** El render de tarjetas produce `.cards-grid`; el de tabla produce `.thead`/`.scroll table`. */
function isCardView(table: Table): boolean {
  return !!table.shadowRoot?.querySelector('.cards-grid');
}

describe('ok-data-table cambia a tarjetas en móvil (#274)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
    // happy-dom no implementa matchMedia; se inyecta abajo en cada test.
  });

  it('en viewport estrecho arranca en vista de tarjetas (no en tabla con scroll)', async () => {
    // matchMedia que reporta matches=true (móvil) para el breakpoint de tarjetas.
    (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
      media: q, matches: true, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: (_e: string, cb: (e: unknown) => void) => {
        // guarda el listener para poder dispararlo (simular resize a escritorio más abajo).
        (window as unknown as { __mqListener?: (e: unknown) => void }).__mqListener = cb;
      },
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    const table = mount();
    await table.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await table.updateComplete;
    expect(isCardView(table), 'en móvil con tarjetas habilitadas debe pintar .cards-grid').toBe(true);
  });

  it('en viewport ancho sigue en tabla por defecto', async () => {
    (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
      media: q, matches: false, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    const table = mount();
    await table.updateComplete;
    await new Promise((r) => setTimeout(r, 0));
    await table.updateComplete;
    expect(isCardView(table), 'en escritorio arranca en tabla').toBe(false);
  });
});
