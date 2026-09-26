// @vitest-environment happy-dom

// outfitkit#205 (from pricing#47) — «on a phone every card says its name twice: as the title and
// again as the first field».
//
// Without a `renderCard` of its own, the card body lists every visible column, including the one
// `cardTitle` already put on top: «Tarifa mayorista 1 · Código L1 · Nombre Tarifa mayorista 1 · …».
// About 25 modules pass `cardTitle` and rely on the default body, and the shell's ok-data-table is
// the one that paints them all (ADR-0451), so the fix lives here, not in each module.
//
// The contract, the way Shopify, Square and Odoo lay a record out as a card: the name shows once,
// as the title, and the body carries the OTHER fields. The field left out is the one whose cell
// reads exactly like the title of THAT card; anything the table cannot read as text (a title given
// as a template, a column with its own `render`) is left alone.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';

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

type Row = Record<string, unknown>;
type Table = HTMLElement & {
  rows: Row[];
  columns: Array<Record<string, unknown>>;
  cardTitle?: (row: Row) => unknown;
  renderCard?: (row: Row) => unknown;
  rowKey: string;
  views: unknown;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

const COLUMNS = [
  { key: 'code', header: 'Código' },
  { key: 'name', header: 'Nombre' },
  { key: 'currency', header: 'Divisa' },
];

async function mountCards(over: Partial<Table>): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: '1', code: 'L1', name: 'Tarifa mayorista 1', currency: 'EUR' }];
  table.columns = COLUMNS;
  table.rowKey = 'id';
  table.cardTitle = (row) => String(row.name ?? row.code ?? '—');
  table.views = true;
  table.defaultView = 'cards';
  Object.assign(table, over);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

/** The body fields of every card, as «header=value» per card. */
function cardFields(table: Table): string[][] {
  const text = (n: Element | null) => (n?.textContent ?? '').replace(/\s+/g, ' ').trim();
  return [...table.shadowRoot!.querySelectorAll('ion-card.rcard')].map((card) =>
    [...card.querySelectorAll('.rrow')].map((r) => `${text(r.querySelector('.rk'))}=${text(r.querySelector('.rv'))}`),
  );
}

function titles(table: Table): string[] {
  return [...table.shadowRoot!.querySelectorAll('.rc-title')].map((t) => (t.textContent ?? '').trim());
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a card shows its name once: as the title, not again as a field (outfitkit#205)', () => {
  it('leaves the title column out of the body and keeps every other field', async () => {
    const table = await mountCards({});
    expect(titles(table)).toEqual(['Tarifa mayorista 1']);
    expect(cardFields(table)).toEqual([['Código=L1', 'Divisa=EUR']]);
  });

  it('decides per card: a card titled by its fallback leaves that field out instead', async () => {
    const table = await mountCards({
      rows: [
        { id: '1', code: 'L1', name: 'Tarifa mayorista 1', currency: 'EUR' },
        { id: '2', code: 'L2', name: null, currency: 'USD' },
      ],
    });
    expect(titles(table)).toEqual(['Tarifa mayorista 1', 'L2']);
    expect(cardFields(table)).toEqual([
      ['Código=L1', 'Divisa=EUR'],
      ['Nombre=', 'Divisa=USD'],
    ]);
  });

  it('matches what the cell SHOWS, so a formatted column that reads as the title is left out too', async () => {
    const table = await mountCards({
      rows: [{ id: '1', first: 'Ana', last: 'García', phone: '600 000 000' }],
      columns: [
        { key: 'full', header: 'Cliente', format: (r: Row) => `${r.first} ${r.last}` },
        { key: 'phone', header: 'Teléfono' },
      ],
      cardTitle: (r) => `${r.first} ${r.last}`,
    });
    expect(cardFields(table)).toEqual([['Teléfono=600 000 000']]);
  });

  it('matches a numeric title and ignores stray spaces around the text', async () => {
    const table = await mountCards({
      rows: [{ id: '1', number: 12, seats: 4, zone: ' Terraza ' }],
      columns: [
        { key: 'number', header: 'Mesa' },
        { key: 'seats', header: 'Plazas' },
      ],
      cardTitle: (r) => r.number,
    });
    expect(cardFields(table)).toEqual([['Plazas=4']]);
    document.body.innerHTML = '';
    const spaced = await mountCards({
      rows: [{ id: '1', zone: ' Terraza ', seats: 4 }],
      columns: [
        { key: 'zone', header: 'Zona' },
        { key: 'seats', header: 'Plazas' },
      ],
      cardTitle: () => 'Terraza',
    });
    expect(cardFields(spaced)).toEqual([['Plazas=4']]);
  });

  it('leaves out ONE field only: a second column that happens to read the same stays', async () => {
    const table = await mountCards({ rows: [{ id: '1', code: 'VIP', name: 'VIP', currency: 'EUR' }] });
    expect(cardFields(table)).toEqual([['Nombre=VIP', 'Divisa=EUR']]);
  });

  it('keeps every field when the title is not text (a template) or is empty', async () => {
    const templated = await mountCards({ cardTitle: (r) => html`<b>${r.name}</b>` });
    expect(cardFields(templated)).toEqual([['Código=L1', 'Nombre=Tarifa mayorista 1', 'Divisa=EUR']]);
    document.body.innerHTML = '';
    const empty = await mountCards({ rows: [{ id: '1', code: 'L1', name: '', currency: 'EUR' }], cardTitle: (r) => r.name });
    expect(cardFields(empty)).toEqual([['Código=L1', 'Nombre=', 'Divisa=EUR']]);
  });

  it('keeps a column with its own render: the table cannot tell what it paints', async () => {
    const table = await mountCards({
      columns: [
        { key: 'code', header: 'Código' },
        { key: 'name', header: 'Nombre', render: (r: Row) => html`<em>${r.name}</em>` },
      ],
    });
    expect(cardFields(table)).toEqual([['Código=L1', 'Nombre=Tarifa mayorista 1']]);
  });

  it('still paints the cards when a module format returns something that is not text', async () => {
    // Modules are bundled without a typecheck: a `format` that returns a number or `undefined` in
    // one branch painted fine before; comparing it with the title must not break every card.
    const table = await mountCards({
      rows: [{ id: '1', code: 'L1', name: 'Tarifa mayorista 1', priority: 7 }],
      columns: [
        { key: 'code', header: 'Código', format: () => undefined },
        { key: 'priority', header: 'Prioridad', format: (r: Row) => r.priority },
        { key: 'name', header: 'Nombre' },
      ],
    });
    expect(titles(table)).toEqual(['Tarifa mayorista 1']);
    expect(cardFields(table)).toEqual([['Código=', 'Prioridad=7']]);
  });

  it('leaves a host renderCard untouched', async () => {
    const table = await mountCards({ renderCard: () => html`<div class="rrow"><span class="rk">Own</span><span class="rv">body</span></div>` });
    expect(cardFields(table)).toEqual([['Own=body']]);
  });
});
