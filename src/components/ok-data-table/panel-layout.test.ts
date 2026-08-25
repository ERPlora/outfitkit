// @vitest-environment happy-dom

// outfitkit#75 — «the New/Filters panel is a 340px absolute overlay that COVERS the table on
// desktop and leaves a useless 45px strip on mobile».
//
// Seen on `qa-pm149` in Services and Appointments at 1440 / 768 / 390: at 1440 the panel painted
// over «Duration», half of «Actions» and the «Columns» control; at 390 it took 88% and left a
// 45px sliver of the table (half a magnifier, half a «Co…») that made the form look like a
// misplaced pop-up. What the market does: Square Dashboard's side panel REDUCES the table
// (never covers it); Fresha/Shopify/Odoo open a FULL-SCREEN sheet on mobile.
//
// happy-dom does no layout: the contract is the class the host sets while the panel is open and
// the CSS rules that hang from it, plus the breakpoint. The pixels are checked in the showcase.
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
  open: (p?: 'filters' | 'create') => void;
  close: () => void;
  updateComplete: Promise<unknown>;
};

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: 1, name: 'Corte', minutes: 30 }];
  table.columns = [{ key: 'name', header: 'Nombre' }, { key: 'minutes', header: 'Duración (min)' }];
  table.addable = true;
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n').replace(/\s+/g, ' ');
}

/** The body of the media block whose condition matches `cond` (first match). */
function mediaBlock(css: string, cond: RegExp): string {
  const re = new RegExp(`@media[^{]*${cond.source}[^{]*\\{((?:[^{}]*\\{[^}]*\\})*)`);
  return css.match(re)?.[1] ?? '';
}

describe('ok-data-table: el panel empuja en escritorio y es hoja completa en móvil (#75)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('mientras el panel está abierto el host lo declara (clase de layout)', async () => {
    const table = await mount();
    const card = () => table.shadowRoot?.querySelector('.card');
    expect(card()?.classList.contains('has-panel'), 'cerrado y ya marcado').toBe(false);

    table.open('create');
    await table.updateComplete;
    expect(card()?.classList.contains('has-panel'), 'abierto y sin marcar: el layout no puede reaccionar').toBe(true);
    expect(table.shadowRoot?.querySelector('.drawer')).toBeTruthy();

    table.close();
    await table.updateComplete;
    expect(card()?.classList.contains('has-panel')).toBe(false);
  });

  it('≥ 834 px: la tabla y el panel son DOS columnas (el panel empuja, no tapa)', async () => {
    await mount();
    const block = mediaBlock(styles(), /min-width: 834px/);
    expect(block, 'no hay regla de escritorio para el panel abierto').not.toBe('');
    expect(block, 'el host con panel no pasa a rejilla de dos columnas').toMatch(
      /\.card\.has-panel[^{]*\{[^}]*display: grid;[^}]*grid-template-columns:[^;]*minmax\(0, 1fr\)[^;]*;/,
    );
    expect(block, 'el panel sigue flotando sobre la tabla en escritorio').toMatch(
      /\.card\.has-panel (?:> )?\.drawer[^{]*\{[^}]*position: static;/,
    );
    expect(block, 'el scrim tapa la tabla en escritorio, donde no hay nada que tapar').toMatch(
      /\.card\.has-panel (?:> )?\.tk-scrim[^{]*\{[^}]*display: none;/,
    );
  });

  it('< 834 px: el panel es una hoja a pantalla completa, sin tira de tabla detrás', async () => {
    await mount();
    const block = mediaBlock(styles(), /max-width: 833(?:\.98)?px/);
    expect(block, 'no hay regla de móvil para el panel').not.toBe('');
    expect(block, 'el panel no ocupa toda la pantalla en móvil').toMatch(
      /\.drawer[^{]*\{[^}]*position: fixed;[^}]*inset: 0;/,
    );
    expect(block, 'el panel sigue limitado a 340px / 88% en móvil').toMatch(
      /\.drawer[^{]*\{[^}]*width: 100%;[^}]*max-width: none;/,
    );
  });

  it('en móvil la hoja arranca BAJO la cabecera de la app (mide el ion-content que la contiene)', async () => {
    // Seen at 390×844: `position: fixed; inset: 0` painted the sheet from y=0, and the app's
    // `ion-header` (own stacking context, above the content) covered the sheet's title AND its
    // only Close button. The sheet must start where the content area starts. That offset is not
    // known to CSS inside a shadow root, so the table measures its closest `ion-content` on open.
    const content = document.createElement('ion-content');
    content.getBoundingClientRect = () => ({ top: 56, left: 0, width: 390, height: 788, bottom: 844, right: 390, x: 0, y: 56, toJSON: () => ({}) }) as DOMRect;
    document.body.appendChild(content);
    const table = document.createElement('ok-data-table') as unknown as Table;
    table.rows = [{ id: 1, name: 'Corte' }];
    table.columns = [{ key: 'name', header: 'Nombre' }];
    table.addable = true;
    content.appendChild(table);
    await table.updateComplete;

    table.open('create');
    await table.updateComplete;
    expect(table.style.getPropertyValue('--ok-sheet-top'), 'la hoja no sabe dónde empieza el contenido').toBe('56px');
    expect(styles(), 'la hoja no usa el offset medido').toMatch(/\.drawer[^{]*\{[^}]*top: var\(--ok-sheet-top, 0px\);/);

    table.close();
    await table.updateComplete;
    expect(table.style.getPropertyValue('--ok-sheet-top'), 'cerrada y la variable sigue puesta').toBe('');
  });

  it('el panel lleva cabecera con título y botón Cerrar (única salida en la hoja completa)', async () => {
    const table = await mount();
    table.open('create');
    await table.updateComplete;
    const head = table.shadowRoot?.querySelector('.drawer .dh');
    expect(head?.textContent, 'sin título').toContain('Nuevo');
    expect(head?.querySelector('ion-button[aria-label="Cerrar"]'), 'sin botón Cerrar en la cabecera').toBeTruthy();
  });
});
