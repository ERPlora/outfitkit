// @vitest-environment happy-dom

// outfitkit#120 - "on the counter tablet (834px) the actions column covers Pax and Estado and the
// headers overlap each other".
//
// Measured in Chromium at 834x1112, `mode: ios`, with the six columns of the bookings list
// (date, time, guest, phone, party size, status) and four row actions:
//
//   grid-template-columns -> 128px 128px 128px 128px 128px 128px 188px
//   scrollWidth 1036 > clientWidth 834  -> the grid overflows
//   the pinned actions cell spans [630,834] and Pax spans [560,688] -> covered from 630 on
//   the pinned header background is rgba(24,24,27,0.04) -> it goes see-through: "PAXCIONESTAD"
//
// Those 128px are the `8rem` floor of the default track, and they are the ONLY reason it does not
// fit: at 834px there are 566px left for six columns (94px each), plenty for "Confirmada" or a
// phone number.
//
// What the market does when the columns do not fit (research in the PR body): columns SHRINK and
// truncate - Business Central "autofit", Odoo, NN/g - instead of overflowing; and the pinned
// column NEVER sits on top of the data (AG Grid unpins itself, Polaris stops pinning when it does
// not fit, Ant Design requires the pinned cell to be OPAQUE - its transparent header is a declared
// bug). Hence the two contracts this file pins down.
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
  updateComplete: Promise<unknown>;
};

/** The counter bookings list, exactly as the module declares it (headers are its real strings). */
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

// Real measurements from the bench (Chromium, 834x1112). Not estimates: they come from
// getBoundingClientRect() over the built component.
const TABLET_WIDTH = 834; // iPad portrait, the counter of the issue
const ROW_PADDING = 32; // .grow { padding: 0 1rem } -> 16 + 16
const GAP = 8; // .grow { gap: 0.5rem }
const ACTIONS_TRACK = 188; // 4 buttons x 44px (touch minimum, #92) + 3 gaps x 4px
const ROOT_FONT_SIZE = 16;

/** happy-dom has no layout, so `scrollWidth` is 0 everywhere and the component can never measure
 *  its own buttons. The bench number is fed in through the only element it reads (#121). */
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
  table.rows = [{ id: '1', date: '5/9/2026', time: '21:00', guest_name: 'Familia Pérez', guest_phone: '600 111 222', party_size: 4, status: 'Pendiente' }];
  table.columns = COLUMNS;
  table.rowKey = 'id';
  table.actions = ACTIONS;
  document.body.appendChild(table);
  await table.updateComplete;
  // #121 — measuring the buttons pins their track, which schedules one more render.
  await table.updateComplete;
  return table;
}

/** The component stylesheet as text: its visual contract lives in the CSS. */
function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n');
}

/** Floor (MINIMUM sizing function) of the data column tracks, in px. */
function columnFloorsPx(table: Table): number[] {
  const head = table.shadowRoot?.querySelector('.ghead') as HTMLElement | null;
  const template = head?.style.gridTemplateColumns ?? '';
  // `minmax(<floor>,1fr)` per column, plus the trailing track of the actions column.
  return [...template.matchAll(/minmax\(\s*([\d.]+)(rem|px)\s*,/g)].map((m) => (m[2] === 'rem' ? Number(m[1]) * ROOT_FONT_SIZE : Number(m[1])));
}

describe('ok-data-table: the list fits the counter tablet without covering data (#120)', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'es';
  });

  it('the six bookings columns plus the four actions fit in 834px', async () => {
    const table = await mount();
    const floors = columnFloorsPx(table);

    expect(floors.length, 'every data column must declare its floor in the grid-template').toBe(COLUMNS.length);

    const needed = floors.reduce((a, b) => a + b, 0) + ACTIONS_TRACK + GAP * COLUMNS.length + ROW_PADDING;
    expect(
      needed,
      `the grid needs ${needed}px and the tablet has ${TABLET_WIDTH}px: it overflows, and the ` +
        'pinned actions column ends up on top of Pax and Estado',
    ).toBeLessThanOrEqual(TABLET_WIDTH);
  });

  it('the column floor leaves room for six columns on a tablet', async () => {
    const table = await mount();
    const available = TABLET_WIDTH - ROW_PADDING - GAP * COLUMNS.length - ACTIONS_TRACK;
    for (const floor of columnFloorsPx(table)) {
      expect(floor, `the column floor (${floor}px) does not fit six times in the ${available}px available`).toBeLessThanOrEqual(
        available / COLUMNS.length,
      );
    }
  });

  it('the grid is not anchored to `max-content`: that equals EVERY column to the widest one', () => {
    const css = styles();
    const rule = css.match(/\.grid\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule, 'there is no rule for `.grid`').not.toBe('');
    // With `min-width: max-content` the grid sizes itself to its maximum, and there a `1fr` track
    // is NOT worth what its own column asks for: they are all worth what the widest one asks.
    // Measured at 834px with the actions column still icon-less: 148.86px x 6 = 893px of tracks
    // for content asking 66 + 40 + 100 + 88 + 10 + 72 = 376px. The per-column floor stops
    // mattering and the table overflows all the same. The right anchor is `min-content` = the SUM
    // of the floors.
    expect(rule, '`.grid` must not anchor to max-content: it equals every column to the widest').not.toMatch(
      /min-width:\s*max-content/,
    );
    expect(rule, '`.grid` must declare its floor as the sum of the column minimums').toMatch(
      /min-width:\s*min-content/,
    );
  });

  it('the actions track cannot shrink: it is the only thing keeping the buttons over their background', async () => {
    const table = await mount();
    const head = table.shadowRoot?.querySelector('.ghead') as HTMLElement | null;
    const tracks = (head?.style.gridTemplateColumns ?? '').trim().split(/\s+(?![^(]*\))/);
    const actionsTrack = tracks[tracks.length - 1];

    // `.gcell` declares `min-width: 0`, so the minimum contribution of the actions cell is ZERO:
    // with the grid anchored to `min-content` (see above) an `auto` track collapses. Measured at
    // 834px with twelve columns: the track settled at 16px - just the padding - while the buttons
    // measured 92px, so they spilled out of their own cell and painted OVER the text of the
    // neighbouring column, with no opaque background underneath. The track has to reserve the
    // width of its buttons.
    //
    // #121 AMENDED what that track is. `max-content` reserved the buttons all right, but it is
    // not a LENGTH: the header and the rows are separate grids and each resolved it against its
    // own content (62.83px for the word "ACCIONES", 188px for the buttons), so the headers slid
    // off their columns. The track is now the width MEASURED on the buttons, in px - which
    // reserves exactly the same room and resolves the same in both grids. `max-content` survives
    // only as the fallback for the frame before the first measurement (and for a table that has
    // never been laid out, which is every table under happy-dom).
    expect(actionsTrack, 'the actions column must declare its track').toBeTruthy();
    expect(actionsTrack, 'an `auto` track collapses to 0 when the grid settles at its minimum').not.toBe('auto');
    expect(actionsTrack, 'unmeasured, the track still has to reserve the width of its content').toBe('max-content');

    const restore = stubActionsWidth(ACTIONS_TRACK);
    try {
      const measured = await mount();
      const measuredTrack = ((measured.shadowRoot?.querySelector('.ghead') as HTMLElement | null)?.style
        .gridTemplateColumns ?? '')
        .trim()
        .split(/\s+(?![^(]*\))/)
        .pop();
      expect(measuredTrack, 'once measured, the track is the width of the buttons in px').toBe(`${ACTIONS_TRACK}px`);
    } finally {
      restore();
    }
  });

  it('the pinned column header is OPAQUE: one column is never read through another', () => {
    const css = styles();
    // `background: inherit` takes it from `.ghead`, which is `--header-background` - a 4% alpha
    // tint. On overflow the pinned header goes see-through and "PAX"/"ESTADO" are read UNDER
    // "ACCIONES". The pinned cell needs its own opaque base beneath the tint.
    const rule = css.match(/\.ghead\s+\.gcell\.actions-col\s*\{[^}]*\}/)?.[0] ?? '';
    expect(rule, 'there is no dedicated rule for the pinned column header').not.toBe('');
    expect(rule, 'the pinned header must sit on the OPAQUE table background, not just on the translucent tint').toContain(
      'var(--background)',
    );
  });
});
