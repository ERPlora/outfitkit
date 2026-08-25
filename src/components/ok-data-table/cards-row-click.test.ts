// @vitest-environment happy-dom

// outfitkit#74 — «in CARD view `rowClickable` does not emit `rowClick`: on a phone the record
// cannot be opened».
//
// #67 wired `rowClickable` on the GRID row only. The card renderer — the one the table picks by
// itself under 640px — had no `@click`, no `tabindex`, no affordance. Measured on Chrome at
// 390×844 with `combos` 0.1.4: 0 `rowClick` after clicking the card, its title and its body, while
// the same table at the same width emitted the event as soon as the view was toggled back to grid.
// The menu builder of `combos` (the whole module) was unreachable from a phone.
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
  views: unknown;
  defaultView: string;
  selectable: boolean;
  rowKey: string;
  rowClickable: boolean;
  updateComplete: Promise<unknown>;
};

const ROWS = [
  { id: '1', name: 'Menú del día', price: '13,50 €' },
  { id: '2', name: 'Menú degustación', price: '32,00 €' },
];

async function mountCards(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'price', header: 'Precio' },
  ];
  table.rowKey = 'id';
  table.actions = [{ id: 'edit', label: 'Editar' }];
  table.views = true;
  table.defaultView = 'cards';
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

const cardsOf = (t: Table): HTMLElement[] => [...(t.shadowRoot?.querySelectorAll('ion-card.rcard') ?? [])] as HTMLElement[];

describe('ok-data-table: la tarjeta abre el registro igual que la fila (#74)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('monta en vista de tarjetas (precondición del resto de la batería)', async () => {
    const table = await mountCards({ rowClickable: true });
    expect(table.shadowRoot?.querySelector('.cards-grid'), 'no se está probando la vista de tarjetas').toBeTruthy();
    expect(cardsOf(table)).toHaveLength(2);
  });

  it('con `rowClickable`, pulsar la tarjeta emite `rowClick` con su registro', async () => {
    const table = await mountCards({ rowClickable: true });
    const seen: Array<Record<string, unknown>> = [];
    table.addEventListener('rowClick', (e) => seen.push((e as CustomEvent<{ row: Record<string, unknown> }>).detail.row));

    cardsOf(table)[1]?.click();

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual(ROWS[1]);
  });

  it('pulsar el cuerpo o el título de la tarjeta también abre (el usuario no apunta al borde)', async () => {
    const table = await mountCards({ rowClickable: true, selectable: true });
    const seen: unknown[] = [];
    table.addEventListener('rowClick', (e) => seen.push(e));

    (cardsOf(table)[0]?.querySelector('.rcard-body') as HTMLElement | null)?.click();
    (cardsOf(table)[0]?.querySelector('.rc-title') as HTMLElement | null)?.click();

    expect(seen).toHaveLength(2);
  });

  it('con `rowClickable`, la tarjeta parece y se comporta como pulsable (afford + teclado)', async () => {
    const table = await mountCards({ rowClickable: true });
    const seen: unknown[] = [];
    table.addEventListener('rowClick', (e) => seen.push(e));
    const card = cardsOf(table)[0];

    expect(card?.classList.contains('clickable'), 'la tarjeta no lleva el afford de clicable').toBe(true);
    expect(card?.getAttribute('tabindex'), 'la tarjeta no es enfocable con el tabulador').toBe('0');
    expect(card?.getAttribute('role'), 'la tarjeta no se anuncia como control').toBe('button');

    card?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    card?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(seen, 'Enter/Espacio no activan la tarjeta').toHaveLength(2);
  });

  it('sin `rowClickable` la tarjeta sigue muda (la superficie pública no cambia)', async () => {
    const table = await mountCards();
    const seen: unknown[] = [];
    table.addEventListener('rowClick', (e) => seen.push(e));

    cardsOf(table)[0]?.click();

    expect(seen, 'la tarjeta emite rowClick sin haberlo pedido el consumidor').toHaveLength(0);
    expect(cardsOf(table)[0]?.hasAttribute('tabindex'), 'la tarjeta entra en el orden de tabulación sin pedirlo').toBe(false);
    expect(cardsOf(table)[0]?.classList.contains('clickable')).toBe(false);
  });

  it('pulsar un botón de acción de la tarjeta NO dispara además el clic del registro', async () => {
    const table = await mountCards({ rowClickable: true });
    const seen: string[] = [];
    table.addEventListener('rowClick', () => seen.push('rowClick'));
    table.addEventListener('rowAction', () => seen.push('rowAction'));

    const button = cardsOf(table)[0]?.querySelector('.ractions ion-button') as HTMLElement | null;
    expect(button, 'la tarjeta no pinta sus acciones').toBeTruthy();
    button?.click();

    expect(seen, 'la acción de tarjeta navega dos veces').toEqual(['rowAction']);
  });

  it('marcar el checkbox de selección de la tarjeta NO abre el registro', async () => {
    const table = await mountCards({ rowClickable: true, selectable: true });
    const seen: string[] = [];
    table.addEventListener('rowClick', () => seen.push('rowClick'));

    const checkbox = cardsOf(table)[0]?.querySelector('ion-checkbox') as HTMLElement | null;
    expect(checkbox, 'la tarjeta seleccionable no pinta su checkbox').toBeTruthy();
    checkbox?.click();

    expect(seen, 'seleccionar una tarjeta abre el registro').toEqual([]);
  });

  it('el afford visual de la tarjeta clicable existe en la hoja de estilos', async () => {
    await mountCards({ rowClickable: true });
    const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    const css = sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
    expect(css, 'la tarjeta clicable no cambia el cursor').toMatch(/ion-card\.rcard\.clickable[^{]*\{[^}]*cursor: pointer;/);
    expect(css, 'la tarjeta clicable no tiene anillo de foco').toMatch(/ion-card\.rcard\.clickable:focus-visible[^{]*\{[^}]*outline:/);
  });
});
