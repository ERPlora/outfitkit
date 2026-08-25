// @vitest-environment happy-dom

// outfitkit#79 — «in CARD view the card header stacks in a COLUMN under `ios` mode: checkbox on
// top, title in the middle, icon underneath».
//
// `.rcard-head` declared `display:flex; align-items:center; gap:.5rem` but never a
// `flex-direction`. `ion-card-header` ships its own `flex-direction: column-reverse` in `ios`
// mode — the mode the Hub shell pins (ADR-0143) — and a shorthand-less rule inherits it, so the
// three children ended up on three lines and the header ate ~90px of a 390px screen.
//
// The contract is a single row: [icon] Title ……… [checkbox], the way `md` mode already paints it
// and the way Square/Shopify paint a card header. It is asserted on the stylesheet because the
// offending declaration comes from Ionic's own host CSS, which happy-dom never loads: only the
// explicit `flex-direction` in OUR rule can win over it in a real browser.
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
  cardTitle: (row: Record<string, unknown>) => unknown;
  cardIcon: (row: Record<string, unknown>) => unknown;
  selectable: boolean;
  rowKey: string;
  views: unknown;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

/** The rule that Ionic's `ion-card-header` host CSS competes with. */
function headRule(): string {
  return styles().match(/ion-card-header\.rcard-head[^{]*\{([^}]*)\}/)?.[1] ?? '';
}

async function mountCards(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: '1', name: 'Menú del día', price: '13,50 €' }];
  table.columns = [
    { key: 'name', header: 'Nombre' },
    { key: 'price', header: 'Precio' },
  ];
  table.rowKey = 'id';
  table.cardTitle = (row) => row.name;
  table.cardIcon = () => 'restaurant-outline';
  table.selectable = true;
  table.views = true;
  table.defaultView = 'cards';
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

describe('ok-data-table: la cabecera de la tarjeta es UNA FILA también en modo ios (#79)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('la cabecera declara `flex-direction: row` (Ionic pone `column-reverse` en modo ios)', async () => {
    await mountCards();
    expect(headRule(), 'la cabecera hereda el flex-direction de Ionic y se apila').toMatch(/flex-direction: row;/);
  });

  it('la cabecera no se parte en varias líneas (`flex-wrap: nowrap`)', async () => {
    await mountCards();
    expect(headRule(), 'un título largo empuja el checkbox a una segunda línea').toMatch(/flex-wrap: nowrap;/);
  });

  it('la cabecera sigue centrando en vertical sus tres piezas', async () => {
    await mountCards();
    expect(headRule(), 'icono, título y checkbox dejan de estar alineados').toMatch(/align-items: center;/);
  });

  it('el orden del DOM es [icono] [título] [checkbox] (con `row` es también el orden visual)', async () => {
    const table = await mountCards();
    const head = table.shadowRoot?.querySelector('ion-card-header.rcard-head');
    expect(head, 'la tarjeta no pinta cabecera').toBeTruthy();
    const kinds = [...(head?.children ?? [])].map((el) =>
      el.classList.contains('rc-icon') ? 'icon' : el.classList.contains('rc-title') ? 'title' : el.localName,
    );
    expect(kinds).toEqual(['icon', 'title', 'ion-checkbox']);
  });
});
