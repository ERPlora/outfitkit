// @vitest-environment happy-dom

// outfitkit#78 (declared leftover of #76) — «on a phone the footer still shows the DESKTOP
// numbered pager». #76 fixed the toolbar (no column picker, no rows-per-page, a labelled 44px
// create button) but never touched the footer: at 390px the table still painted the record count
// plus «‹ 1 2 3 … 12 ›», page buttons ~24px wide sitting side by side under the thumb.
//
// What the market does: Shopify IndexTable, Fresha, Square and Material all replace the pager with
// a «Load more» control (or infinite scroll) on mobile. None of them paints a numbered pager on a
// phone. The record count stays — it is the one number the user actually reads.
//
// Contract: under 640px the footer paints `ion-button.load-more` (≥44px) instead of `.pager .nav`.
// In CLIENT mode it ACCUMULATES rows (page 1 + 2 + …); in SERVER mode it emits `pageChange` with
// the next page index and the parent loads it. Desktop is untouched.
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
  rowKey: string;
  pageSize: number;
  serverSide: boolean;
  total: number;
  page: number;
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

const COLUMNS = [{ key: 'name', header: 'Nombre' }];
const rowsOf = (n: number): Array<Record<string, unknown>> =>
  Array.from({ length: n }, (_, i) => ({ id: String(i + 1), name: `Servicio ${i + 1}` }));

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = rowsOf(25);
  table.columns = COLUMNS;
  table.rowKey = 'id';
  table.pageSize = 10;
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  await new Promise((r) => setTimeout(r, 0));
  await table.updateComplete;
  return table;
}

const loadMore = (t: Table): HTMLElement | null => t.shadowRoot?.querySelector('.pager ion-button.load-more') as HTMLElement | null;
const dataRows = (t: Table): number => t.shadowRoot?.querySelectorAll('.grow-data').length ?? 0;
const pagerCount = (t: Table): string => t.shadowRoot?.querySelector('.pager .left')?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

async function press(t: Table): Promise<void> {
  loadMore(t)?.click();
  await t.updateComplete;
}

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

describe('ok-data-table: en móvil el pie es «Cargar más», no el pager numerado (#78)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('en móvil el pie NO pinta el pager numerado y sí un botón «Cargar más»', async () => {
    viewport(true);
    const table = await mount();
    expect(table.shadowRoot?.querySelector('.pager .nav'), 'el pager numerado de escritorio sigue en el teléfono').toBeNull();
    expect(loadMore(table), 'no hay botón «Cargar más»').toBeTruthy();
  });

  it('el botón alcanza los 44 px de área táctil', async () => {
    viewport(true);
    await mount();
    expect(styles(), '«Cargar más» no llega al área táctil mínima').toMatch(/\.load-more[^{]*\{[^}]*min-height: 44px;/);
  });

  // ── Modo CLIENTE: acumula ────────────────────────────────────────────────────────────────
  it('cliente: arranca con una página y cada pulsación SUMA otra (no navega)', async () => {
    viewport(true);
    const table = await mount();
    expect(dataRows(table), 'no arranca con una página de filas').toBe(10);

    await press(table);
    expect(dataRows(table), 'la segunda página sustituye a la primera en vez de sumarse').toBe(20);

    await press(table);
    expect(dataRows(table), 'la última pulsación no trae el resto de filas').toBe(25);
  });

  it('cliente: el botón desaparece cuando ya no quedan filas', async () => {
    viewport(true);
    const table = await mount();
    await press(table);
    await press(table);
    expect(loadMore(table), '«Cargar más» sigue ahí sin nada que cargar').toBeNull();
  });

  it('cliente: el contador «N registros» del pie se conserva', async () => {
    viewport(true);
    const table = await mount();
    expect(pagerCount(table), 'el pie pierde el total de registros').toContain('25 records');
    await press(table);
    expect(pagerCount(table), 'el total cambia al cargar más (debe ser el total, no lo visible)').toContain('25 records');
  });

  it('cliente: cambiar la búsqueda vuelve a empezar por la primera página', async () => {
    viewport(true);
    const table = await mount({ searchKeys: ['name'] });
    await press(table);
    expect(dataRows(table)).toBe(20);

    const search = table.shadowRoot?.querySelector('ion-searchbar') as HTMLInputElement | null;
    expect(search, 'la tabla no monta buscador').toBeTruthy();
    if (search) search.value = 'Servicio 1';
    search?.dispatchEvent(new Event('ionInput'));
    await table.updateComplete;

    // «Servicio 1», 10-19 → 11 coincidencias; con el acumulado reseteado se ve solo una página.
    expect(dataRows(table), 'la búsqueda hereda el acumulado de la consulta anterior').toBe(10);
  });

  it('cliente: reemplazar `rows` vuelve a empezar por la primera página', async () => {
    viewport(true);
    const table = await mount();
    await press(table);
    expect(dataRows(table)).toBe(20);

    table.rows = rowsOf(25);
    await table.updateComplete;
    expect(dataRows(table), 'un refresco de datos hereda el acumulado anterior').toBe(10);
  });

  // ── Modo SERVIDOR: pide la página siguiente ──────────────────────────────────────────────
  it('servidor: pulsar emite `pageChange` con la página SIGUIENTE', async () => {
    viewport(true);
    const table = await mount({ serverSide: true, rows: rowsOf(10), total: 25, page: 0 });
    const seen: unknown[] = [];
    table.addEventListener('pageChange', (e) => seen.push((e as CustomEvent).detail));

    await press(table);
    expect(seen, 'no pide la página siguiente al servidor').toEqual([1]);
  });

  it('servidor: el botón se pinta mientras queden páginas y se va con la última', async () => {
    viewport(true);
    const table = await mount({ serverSide: true, rows: rowsOf(10), total: 25, page: 1 });
    expect(loadMore(table), 'con 25 de total y 20 servidas ya no ofrece cargar más').toBeTruthy();

    table.page = 2;
    await table.updateComplete;
    expect(loadMore(table), 'ofrece cargar más cuando el servidor ya no tiene nada').toBeNull();
  });

  // ── i18n ─────────────────────────────────────────────────────────────────────────────────
  it('la etiqueta se traduce (en / es)', async () => {
    viewport(true);
    const en = await mount();
    expect(loadMore(en)?.textContent?.trim()).toBe('Load more');

    document.body.replaceChildren();
    document.documentElement.lang = 'es';
    const es = await mount();
    expect(loadMore(es)?.textContent?.trim()).toBe('Cargar más');
  });

  // ── Caracterización: escritorio NO cambia ────────────────────────────────────────────────
  it('escritorio: sigue el pager numerado y no aparece «Cargar más»', async () => {
    viewport(false);
    const table = await mount();
    expect(table.shadowRoot?.querySelector('.pager .nav'), 'escritorio pierde el pager numerado').toBeTruthy();
    expect(loadMore(table), 'escritorio gana un botón que no pedía').toBeNull();
    expect(dataRows(table), 'escritorio deja de paginar de diez en diez').toBe(10);
  });

  it('escritorio: el pager numerado sigue navegando página a página (no acumula)', async () => {
    viewport(false);
    const table = await mount();
    const second = [...(table.shadowRoot?.querySelectorAll('.pager .nav .pnum') ?? [])].find((b) => b.textContent?.trim() === '2') as HTMLElement | undefined;
    expect(second, 'el pager no ofrece la página 2').toBeTruthy();
    second?.click();
    await table.updateComplete;

    expect(dataRows(table), 'el pager de escritorio ha empezado a acumular filas').toBe(10);
    expect(table.shadowRoot?.querySelector('.grow-data')?.textContent, 'la página 2 no muestra su primer registro').toContain('Servicio 11');
  });
});
