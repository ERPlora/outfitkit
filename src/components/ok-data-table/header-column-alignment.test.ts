// @vitest-environment happy-dom

// outfitkit#121 - "the column name is not on top of its data: the further right, the more it
// drifts".
//
// Measured in Chromium over the built bundle, `mode: ios`, with the six columns of the bookings
// list (date, time, guest, phone, party size, status) and four row actions:
//
//   width | header tracks                  | row tracks              | drift per column
//   834   | 115.19 x6 + 62.83              | 94.33 x6 + 188          | 0 21 42 63 83 104 125
//   1440  | 216.19 x6 + 62.83              | 203.28 x6 + 140.31      | 0 13 26 39 52 65 77
//
// Root cause: `.ghead` and every `.grow-data` are SEPARATE grids that share the same
// `grid-template-columns` STRING, but that string carried a CONTENT-SIZED track (`max-content`)
// for the actions column. A content-sized track is not a length: each grid resolves it against
// ITS OWN content - the word "ACCIONES" in the header (62.83px) and four buttons in the row
// (188px). The leftover that the `1fr` data columns share is therefore different in each grid, so
// the same string yields different columns and the header slides right.
//
// The contract this file pins down: whatever the component emits as a track must be a LENGTH,
// identical for header and rows. The actions track is measured once from the rendered buttons and
// pinned in px - which is exactly what makes the two grids resolve the same way.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
  updateComplete: Promise<unknown>;
};

const COLUMNS = [
  { key: 'date', header: 'Fecha' },
  { key: 'time', header: 'Hora' },
  { key: 'guest_name', header: 'Cliente' },
  { key: 'guest_phone', header: 'Teléfono' },
  { key: 'party_size', header: 'Pax', align: 'right' },
  { key: 'status', header: 'Estado' },
];
const ACTIONS = [
  { id: 'confirm', label: 'Confirmar', icon: 'checkmark-outline' },
  { id: 'seat', label: 'Sentar', icon: 'restaurant-outline' },
  { id: 'done', label: 'Finalizar', icon: 'checkmark-done-outline' },
  { id: 'cancel', label: 'Cancelar', icon: 'close-outline' },
];
const ROWS = [
  { id: '1', date: '5/9/2026', time: '21:00', guest_name: 'Familia Pérez', guest_phone: '600 111 222', party_size: 4, status: 'Pendiente' },
  { id: '2', date: '5/9/2026', time: '21:30', guest_name: 'Marta Ruiz', guest_phone: '600 333 444', party_size: 6, status: 'Sentada' },
];

/** Natural width of the four row buttons on the counter tablet, measured in Chromium. */
const ROW_ACTIONS_PX = 188; // 4 x 44px (touch floor, #92) + 3 x 4px gap

/** happy-dom has no layout: every `scrollWidth` is 0. The component measures the row buttons to
 *  pin their track, so the bench number is fed in through the only element it reads. */
function stubActionsWidth(px: number): () => void {
  const proto = window.Element.prototype as unknown as Record<string, unknown>;
  const original = Object.getOwnPropertyDescriptor(proto, 'scrollWidth');
  Object.defineProperty(proto, 'scrollWidth', {
    configurable: true,
    get(this: Element) {
      return this.classList?.contains('actions') ? px : 0;
    },
  });
  return () => {
    if (original) Object.defineProperty(proto, 'scrollWidth', original);
    else delete proto.scrollWidth;
  };
}

async function mount(): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = ROWS;
  table.columns = COLUMNS;
  table.rowKey = 'id';
  table.actions = ACTIONS;
  document.body.appendChild(table);
  await table.updateComplete;
  // The measurement happens in `updated()`; pinning the track schedules one more render.
  await table.updateComplete;
  return table;
}

function templateOf(el: Element | null | undefined): string {
  return ((el as HTMLElement | null)?.style.gridTemplateColumns ?? '').trim();
}

describe('ok-data-table: every column header sits on top of its own data (#121)', () => {
  let restore = (): void => {};

  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
    restore = stubActionsWidth(ROW_ACTIONS_PX);
  });
  afterEach(() => restore());

  it('the header and every row are laid out with the very same track list', async () => {
    const table = await mount();
    const head = templateOf(table.shadowRoot?.querySelector('.ghead'));
    const rows = [...(table.shadowRoot?.querySelectorAll('.grow-data') ?? [])];

    expect(head, 'the header must declare its tracks').not.toBe('');
    expect(rows.length, 'the two bookings must render').toBe(ROWS.length);
    for (const row of rows) expect(templateOf(row)).toBe(head);
  });

  it('no track is sized by its CONTENT: that is what desynchronises header and rows', async () => {
    const table = await mount();
    const head = templateOf(table.shadowRoot?.querySelector('.ghead'));

    // `max-content` / `min-content` / `auto` / `fit-content()` are not lengths: two grids that
    // share the string still resolve them against their own content. In Chromium that turned the
    // one actions track into 62.83px in the header and 188px in the row, and the 1fr columns
    // absorbed the difference - 125px of drift by the last column.
    for (const keyword of ['max-content', 'min-content', 'fit-content']) {
      expect(head, `\`${keyword}\` is resolved per grid: header and rows stop matching`).not.toContain(keyword);
    }
    expect(head, '`auto` is resolved per grid too').not.toMatch(/(^|\s)auto(\s|$)/);
  });

  it('the actions track is pinned to the MEASURED width of the row buttons', async () => {
    const table = await mount();
    const head = templateOf(table.shadowRoot?.querySelector('.ghead'));
    const tracks = head.split(/\s+(?![^(]*\))/);

    // The header cell holds the word "ACCIONES" (62.83px) and the row cell four buttons (188px).
    // Pinning the track to the measured 188px is what makes both grids agree; it is also what
    // keeps the opaque background under the buttons (the reason #120 refused an `auto` track).
    expect(tracks[tracks.length - 1], 'the actions track must be the measured width, in px').toBe(
      `${ROW_ACTIONS_PX}px`,
    );
  });

  it('the row buttons never shrink: otherwise the measurement chases the track it sets', async () => {
    // The track is pinned to the measured width of the buttons. If the buttons could shrink, a
    // narrow track would shrink them, the next measurement would come back smaller, and the track
    // would shrink again - the measurement would be a property of the layout instead of a property
    // of the content. `flex: 0 0 auto` is what makes measuring it twice give the same number.
    const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
    const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
    const css = sheets.map((sheet) => String((sheet as { cssText?: string })?.cssText ?? sheet)).join('\n');
    const rule = css.match(/\.actions ion-button \{[^}]*\}/)?.[0] ?? '';
    expect(rule, 'there is no rule for the row action buttons').not.toBe('');
    expect(rule, 'the row action buttons must not be shrinkable').toMatch(/flex:\s*0\s+0\s+auto/);
  });

  it('with the tracks pinned, header and rows land on the SAME x at 834px and at 1440px', async () => {
    const table = await mount();
    const head = templateOf(table.shadowRoot?.querySelector('.ghead'));
    const actionsTrack = head.split(/\s+(?![^(]*\))/).pop() ?? '';

    // Model of how Chromium resolved this grid, checked against the bench: the fixed tracks come
    // out of the container and the leftover is shared between the `1fr` columns.
    //   834px, `max-content`: header (834-32-48-62.83)/6 = 115.19  ·  row (834-32-48-188)/6 = 94.33
    //   1440px, `max-content`: header 216.19  ·  row (1440-32-48-140.31)/6 = 203.28
    // Both match the measurement to the second decimal, so the model is a faithful stand-in for
    // the layout happy-dom cannot do. The point of the test is what the ACTIONS track is worth in
    // each grid: with a content-sized track it is worth the header word in one and the buttons in
    // the other, and the drift comes out; with a length it is worth the same in both.
    const CONTENT_WIDTH: Record<'head' | 'row', Record<number, number>> = {
      head: { 834: 62.83, 1440: 62.83 }, // the word "ACCIONES" at 11px
      row: { 834: 188, 1440: 140.31 }, // four buttons: touch-sized <=834px, Ionic `small` above
    };
    const actionsPxFor = (band: 'head' | 'row', width: number): number =>
      /^[\d.]+px$/.test(actionsTrack) ? Number(actionsTrack.replace('px', '')) : CONTENT_WIDTH[band][width];

    const lefts = (width: number, band: 'head' | 'row'): number[] => {
      const free = width - 32 /* .grow padding 0 1rem */ - 8 * COLUMNS.length /* gaps */ - actionsPxFor(band, width);
      const each = free / COLUMNS.length;
      return COLUMNS.map((_, i) => 16 + i * (each + 8));
    };

    for (const width of [834, 1440]) {
      const drift = lefts(width, 'head').map((x, i) => Math.abs(x - lefts(width, 'row')[i]));
      expect(
        Math.max(...drift),
        `at ${width}px the header of the last column still sits ${Math.max(...drift).toFixed(2)}px off its data`,
      ).toBeLessThan(0.5);
    }
  });
});
