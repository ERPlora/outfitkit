// @vitest-environment happy-dom

// outfitkit#143 — "the QA robot cannot press «Add», search or run a row action: ok-data-table's
// chrome has no stable names".
//
// Almost every list in the Hub (staff, products, tables, bookings, customers) is an
// `<ok-data-table>`. Playwright can read the rows, but the chrome — the Add button, the searchbar,
// the row actions, CSV import/export and the pager — carried ZERO `data-testid` (measured on
// 2026-09-11 against origin/main@9695808), so a spec had to address them by visible text or by
// position. Both break on their own: the text changes with the language (ADR-0055/0199) and the
// position changes the moment the table grows one more action.
//
// The convention is the Hub's own (`architecture/hub/apps/testids.md`): `<surface>-<action>`, and a
// REUSABLE control receives its namespace from whoever uses it — a fixed name inside the component
// would give two tables on the same screen the same hook and `getByTestId` would pick one at
// random. So the host declares the prefix (`testid="products-table"`) and the table derives every
// hook from it; with no prefix it paints none, so nothing changes for whoever does not ask.
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
  actions: Array<Record<string, unknown>>;
  searchKeys: string[];
  addable: boolean;
  csv: boolean;
  views: unknown;
  defaultView?: 'table' | 'cards';
  primaryAction?: Record<string, unknown>;
  testid?: string;
  pageSize: number;
  rowActionsCollapsed: boolean;
  renderRoot: DocumentFragment | HTMLElement;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [{ key: 'name', header: 'Nombre' }];
const ACTIONS = [
  { id: 'edit', label: 'Editar', icon: 'create-outline' },
  { id: 'delete', label: 'Borrar', icon: 'trash-outline' },
];
/** 12 rows against a page size of 10: enough for the pager to have a second page. */
const ROWS = Array.from({ length: 12 }, (_, i) => ({ id: `r${i + 1}`, name: `Producto ${i + 1}` }));

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(mobile: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q, matches: mobile, onchange: null,
    addListener: () => {}, removeListener: () => {},
    addEventListener: () => {}, removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(props: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.columns = COLUMNS;
  table.rows = ROWS;
  table.actions = ACTIONS;
  table.searchKeys = ['name'];
  table.addable = true;
  table.csv = true;
  table.testid = 'products-table';
  Object.assign(table, props);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

/** Every hook the table currently paints, in document order. */
function hooks(table: Table): string[] {
  return [...table.renderRoot.querySelectorAll('[data-testid]')].map(
    (el) => el.getAttribute('data-testid') ?? '',
  );
}

function byTestId(table: Table, id: string): Element[] {
  return [...table.renderRoot.querySelectorAll(`[data-testid="${id}"]`)];
}

beforeEach(() => {
  document.body.innerHTML = '';
  viewport(false);
});

describe('ok-data-table · ganchos data-testid del cromo (#143)', () => {
  it('sin prefijo no pinta NINGÚN gancho: quien no lo pide no ve ningún cambio', async () => {
    const table = await mount({ testid: undefined });

    expect(hooks(table)).toEqual([]);
  });

  it('un prefijo en blanco tampoco pinta ganchos (no deja `-add` suelto)', async () => {
    const table = await mount({ testid: '   ' });

    expect(hooks(table)).toEqual([]);
  });

  it('nombra la barra: alta, acción primaria, buscador e import/export CSV', async () => {
    const table = await mount({ primaryAction: { id: 'import', label: 'Importar' } });

    expect(byTestId(table, 'products-table-add')).toHaveLength(1);
    expect(byTestId(table, 'products-table-add')[0].tagName.toLowerCase()).toBe('ion-button');

    expect(byTestId(table, 'products-table-primary-action')).toHaveLength(1);

    expect(byTestId(table, 'products-table-search')).toHaveLength(1);
    expect(byTestId(table, 'products-table-search')[0].tagName.toLowerCase()).toBe('ion-searchbar');

    // El gancho de importar va en el `<input type=file>`, no en el botón bonito que lo dispara:
    // es lo que un spec rellena (`setInputFiles`), y el diálogo nativo del botón no lo conduce
    // nadie. Mismo criterio que `GrantFilePicker.vue` en el Hub.
    expect(byTestId(table, 'products-table-csv-import')).toHaveLength(1);
    expect(byTestId(table, 'products-table-csv-import')[0].tagName.toLowerCase()).toBe('input');

    expect(byTestId(table, 'products-table-csv-export')).toHaveLength(1);
  });

  it('nombra cada fila y cada acción con la identidad de la fila, nunca por posición', async () => {
    const table = await mount();

    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r2')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-delete')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r2-edit')).toHaveLength(1);

    // La fila 11 está en la segunda página: su gancho NO existe todavía.
    expect(byTestId(table, 'products-table-row-r11')).toHaveLength(0);
  });

  it('nombra también las filas en vista TARJETAS (el arranque del móvil)', async () => {
    const table = await mount({ views: true, defaultView: 'cards' });

    expect(byTestId(table, 'products-table-row-r1')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1')[0].tagName.toLowerCase()).toBe('ion-card');
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
  });

  it('nombra el pager en escritorio', async () => {
    const table = await mount();

    expect(byTestId(table, 'products-table-page-prev')).toHaveLength(1);
    expect(byTestId(table, 'products-table-page-next')).toHaveLength(1);
  });

  it('en MÓVIL el pie es «cargar más», y lleva su propio gancho', async () => {
    viewport(true);
    const table = await mount();

    // El pager numerado no existe en móvil (#78): sin este gancho, un spec de teléfono —el
    // viewport del TPV— no tiene forma de pedir la siguiente tanda de filas.
    expect(byTestId(table, 'products-table-page-next')).toHaveLength(0);
    expect(byTestId(table, 'products-table-load-more')).toHaveLength(1);
  });

  it('con las acciones PLEGADAS el gancho vive en el menú y NO se duplica', async () => {
    const table = await mount();
    table.rowActionsCollapsed = true;
    await table.updateComplete;

    // El disparador del menú de la fila tiene nombre propio…
    expect(byTestId(table, 'products-table-row-r1-menu')).toHaveLength(1);
    (byTestId(table, 'products-table-row-r1-menu')[0] as HTMLElement).click();
    await table.updateComplete;

    // …y la acción se llama IGUAL esté plegada o no, así que el mismo spec vale a cualquier
    // ancho. Una sola vez: dos elementos con el gancho harían que `getByTestId` eligiera al azar.
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')[0].tagName.toLowerCase()).toBe('ion-item');

    // Al desplegarse de nuevo el gancho vuelve al botón directo, y sigue habiendo uno solo.
    table.rowActionsCollapsed = false;
    await table.updateComplete;
    expect(byTestId(table, 'products-table-row-r1-edit')).toHaveLength(1);
    expect(byTestId(table, 'products-table-row-r1-edit')[0].tagName.toLowerCase()).toBe('ion-button');
  });

  it('dos tablas en la misma pantalla no comparten NI UN gancho', async () => {
    const products = await mount({ testid: 'products-table' });
    const customers = await mount({ testid: 'customers-table' });

    // Sin esta primera aserción la comparación sería verde con las dos tablas mudas.
    expect(hooks(products).length).toBeGreaterThan(0);
    expect(hooks(customers).length).toBeGreaterThan(0);

    const shared = hooks(products).filter((h) => hooks(customers).includes(h));
    expect(shared).toEqual([]);
    expect(hooks(customers).every((h) => h.startsWith('customers-table-'))).toBe(true);
  });

  it('TODO gancho que pinta la tabla sale del prefijo del host — ninguno es fijo', async () => {
    const table = await mount({ primaryAction: { id: 'import', label: 'Importar' } });

    const painted = hooks(table);
    expect(painted.length).toBeGreaterThan(0);
    expect(painted.filter((h) => !h.startsWith('products-table-'))).toEqual([]);
  });
});
