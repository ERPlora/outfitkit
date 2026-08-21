// @vitest-environment happy-dom

// outfitkit#67 — «la columna Acciones se sale de la pantalla y la fila no abre nada».
//
// Measured on the LIST view at 1440x900 with six columns plus actions: `.grid` is
// `min-width: max-content`, so the tracks never shrink and the actions cell —a plain grid cell—
// ends up 335px past the right edge of the viewport, with `document.body.scrollWidth ===
// clientWidth`, i.e. no hint whatsoever that anything is over there. And since rows are not
// clickable, the only control that opens a record is the one that cannot be seen.
//
// The fix follows what the market does (Zendesk, Freshdesk, Jira SM, Odoo, Shopify, Business
// Central, Square): PIN the actions column to the right edge, and offer an opt-in clickable row.
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
  rowKey: string;
  rowClickable: boolean;
  updateComplete: Promise<unknown>;
};

const ROWS = [
  { id: '1', number: 'TCK-1000', subject: 'No imprime', customer: 'La Parra' },
  { id: '2', number: 'TCK-1001', subject: 'Cajón atascado', customer: 'El Rincón' },
];

async function mount(extra: Partial<Table> = {}): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = [
    { key: 'number', label: 'Nº' },
    { key: 'subject', label: 'Asunto' },
    { key: 'customer', label: 'Cliente' },
  ];
  table.rowKey = 'id';
  table.actions = [{ id: 'open', label: 'Abrir' }];
  Object.assign(table, extra);
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

/** The component's own stylesheet, as text (its visual contract lives in CSS, not in the DOM). */
function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n');
}

const rowsOf = (t: Table): HTMLElement[] => [...(t.shadowRoot?.querySelectorAll('.grow-data') ?? [])] as HTMLElement[];

describe('ok-data-table: la acción de fila es alcanzable sin desplazar (#67)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('marca la celda de acciones —cabecera y fila— como columna fijada', async () => {
    const table = await mount();
    const head = table.shadowRoot?.querySelector('.ghead .gcell.actions-col');
    const cell = table.shadowRoot?.querySelector('.grow-data .gcell.actions-col');
    expect(head, 'la cabecera de acciones no está marcada como columna fijada').toBeTruthy();
    expect(cell, 'la celda de acciones de la fila no está marcada como columna fijada').toBeTruthy();
  });

  it('fija esa columna al borde derecho, con fondo opaco y por encima de las celdas', async () => {
    await mount();
    const css = styles().replace(/\s+/g, ' ');
    expect(css, 'la columna de acciones no se pega al borde derecho').toMatch(
      /\.gcell\.actions-col[^{]*\{[^}]*position: sticky;[^}]*right: 0;/,
    );
    expect(css, 'la columna fijada no lleva fondo opaco: las celdas se leerán por debajo').toMatch(
      /\.gcell\.actions-col[^{]*\{[^}]*background:/,
    );
  });

  it('deja una pista permanente de que la tabla sigue a la derecha', async () => {
    await mount();
    const css = styles().replace(/\s+/g, ' ');
    // Dos pistas, ninguna de las cuales depende de que el usuario ya esté desplazando: barra de
    // scroll SIEMPRE visible (no la overlay de macOS, que se esconde) y sombra en el borde
    // izquierdo de la columna fijada, que es como Zendesk/Shopify marcan que hay más contenido.
    expect(css, 'la barra de scroll horizontal no es permanente (la overlay se esconde)').toMatch(
      /\.scroll::-webkit-scrollbar\b/,
    );
    expect(css, 'la columna fijada no proyecta sombra: nada indica que hay más a la izquierda').toMatch(
      /\.gcell\.actions-col[^{]*\{[^}]*box-shadow:/,
    );
  });

  it('marca el desbordamiento horizontal solo cuando la tabla no cabe', async () => {
    const table = await mount();
    const scroll = table.shadowRoot?.querySelector('.scroll') as HTMLElement;

    // Sin desbordar (happy-dom no calcula ancho: ambos valen 0) no se marca nada: una sombra
    // permanente en una tabla que cabe entera es ruido, no una pista.
    expect(scroll.classList.contains('x-overflow'), 'marca desbordamiento sin haberlo').toBe(false);

    // Ahora la tabla es más ancha que su hueco, como a 1440px con seis columnas.
    Object.defineProperty(scroll, 'scrollWidth', { value: 1860, configurable: true });
    Object.defineProperty(scroll, 'clientWidth', { value: 1440, configurable: true });
    window.dispatchEvent(new Event('resize'));
    await table.updateComplete;

    expect(
      table.shadowRoot?.querySelector('.scroll')?.classList.contains('x-overflow'),
      'la tabla desborda y nada lo delata',
    ).toBe(true);
  });

  it('marca el desbordamiento aunque el ancho llegue DESPUÉS del render', async () => {
    // El caso real: dentro de `ion-content`, el hueco de la tabla no tiene ancho hasta que Ionic
    // hidrata, bastante después de que Lit haya renderizado. Medir solo al renderizar da 0 vs 0
    // —«cabe»— y ya nunca se vuelve a mirar: medido en Chrome a 1440px, la tabla desbordaba 351px
    // y la pista no aparecía. Se observa el contenedor, así que la medida llega cuando llega.
    const callbacks: Array<() => void> = [];
    class FakeResizeObserver {
      constructor(cb: () => void) { callbacks.push(cb); }
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    const previous = (window as unknown as { ResizeObserver: unknown }).ResizeObserver;
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;
    try {
      const table = await mount();
      const scroll = table.shadowRoot?.querySelector('.scroll') as HTMLElement;
      expect(callbacks, 'nadie observa el contenedor: la medida se queda en el primer render').not.toHaveLength(0);

      Object.defineProperty(scroll, 'scrollWidth', { value: 1791, configurable: true });
      Object.defineProperty(scroll, 'clientWidth', { value: 1440, configurable: true });
      callbacks.forEach((cb) => cb());
      await table.updateComplete;

      expect(
        table.shadowRoot?.querySelector('.scroll')?.classList.contains('x-overflow'),
        'el ancho llegó tarde y la pista nunca apareció',
      ).toBe(true);
    } finally {
      (window as unknown as { ResizeObserver: unknown }).ResizeObserver = previous;
    }
  });

  it('con `rowClickable`, pulsar la fila emite `rowClick` con su registro', async () => {
    const table = await mount({ rowClickable: true });
    const seen: Array<Record<string, unknown>> = [];
    table.addEventListener('rowClick', (e) => seen.push((e as CustomEvent<{ row: Record<string, unknown> }>).detail.row));

    rowsOf(table)[1]?.click();

    expect(seen).toHaveLength(1);
    expect(seen[0]).toEqual(ROWS[1]);
  });

  it('con `rowClickable`, la fila se alcanza y se activa con el teclado', async () => {
    const table = await mount({ rowClickable: true });
    const seen: unknown[] = [];
    table.addEventListener('rowClick', (e) => seen.push(e));
    const row = rowsOf(table)[0];

    expect(row?.getAttribute('tabindex'), 'la fila no es enfocable con el tabulador').toBe('0');
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    row?.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));

    expect(seen, 'Enter/Espacio no activan la fila').toHaveLength(2);
  });

  it('sin `rowClickable` la fila sigue muda (la superficie pública no cambia)', async () => {
    const table = await mount();
    const seen: unknown[] = [];
    table.addEventListener('rowClick', (e) => seen.push(e));

    rowsOf(table)[0]?.click();

    expect(seen, 'la fila emite rowClick sin haberlo pedido el consumidor').toHaveLength(0);
    expect(rowsOf(table)[0]?.hasAttribute('tabindex'), 'la fila entra en el orden de tabulación sin pedirlo').toBe(false);
  });

  it('pulsar un botón de acción NO dispara además el clic de la fila', async () => {
    const table = await mount({ rowClickable: true });
    const seen: string[] = [];
    table.addEventListener('rowClick', () => seen.push('rowClick'));
    table.addEventListener('rowAction', () => seen.push('rowAction'));

    const button = rowsOf(table)[0]?.querySelector('ion-button') as HTMLElement | null;
    button?.click();

    expect(seen, 'la acción de fila navega dos veces').toEqual(['rowAction']);
  });
});
