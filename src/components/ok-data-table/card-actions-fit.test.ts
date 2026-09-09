// @vitest-environment happy-dom

// ERPlora/appointments#154 — «el botón de cobrar está medio fuera de la pantalla».
//
// The card view's action row was built on an assumption the component states out loud:
// «Las tarjetas tienen su propia fila de acciones a lo ancho de la tarjeta y ahí siempre caben.»
// They do not. The agenda gives an appointment EIGHT actions (charge, reschedule, confirm, start,
// complete, no-show, cancel, delete), and on the 411dp phone the QA ran, that row is wider than
// the card that holds it:
//
//   .cards-grid padding  1rem × 2                    → 411 − 32 = 379px of card
//   .ractions   padding  0.5rem × 2                  → 379 − 16 = 363px for the buttons
//   8 buttons at the 44px tap floor + 7 gaps of 4px  → 380px of content
//
// 380 > 363. And because `.actions` is a flex row with `justify-content: flex-end` and no wrap,
// the 17px it does not have are taken off the START side: the FIRST button —«Cobrar», the one the
// receptionist reaches for when the customer is standing there— hangs off the left edge of the
// card, clipped, with no scrollbar and nothing to tell anybody it is there.
//
// So the row must never be able to clip. Wrapping is the whole fix: every button stays whole and
// tappable at any width and for any number of actions, and a card that already fits on one line
// is untouched — which is every other module in the fleet.
//
// The guard lives in the stylesheet because that is where this contract lives (the same reason
// #67, #120 and #122 assert on `styles.cssText`): no test environment here computes layout.
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
  views: boolean;
  defaultView: string;
  updateComplete: Promise<unknown>;
};

/** The eight actions an appointment carries in the agenda (ERPlora/appointments#154). */
const AGENDA_ACTIONS = [
  { id: 'charge', label: 'Cobrar', icon: 'cash-outline' },
  { id: 'reschedule', label: 'Reprogramar', icon: 'calendar-outline' },
  { id: 'confirm', label: 'Confirmar', icon: 'checkmark-circle-outline' },
  { id: 'start', label: 'Empezar', icon: 'play-circle-outline' },
  { id: 'complete', label: 'Completar', icon: 'checkmark-done-outline' },
  { id: 'no_show', label: 'No vino', icon: 'person-remove-outline' },
  { id: 'cancel', label: 'Cancelar', icon: 'close-circle-outline' },
  { id: 'delete', label: 'Borrar', icon: 'trash-outline' },
];

/** The phone the QA ran (`Pixel_10_Pro`, portrait), in CSS pixels. */
const PHONE_DP = 411;
/** `.cards-grid { padding: 1rem }` on both sides. */
const GRID_PADDING = 16 * 2;
/** `.ractions { padding: 0 0.5rem 0.5rem }` on both sides. */
const ROW_PADDING = 8 * 2;
/** The tap floor the component already pins for coarse pointers. */
const BUTTON_MIN = 44;
/** `.actions { gap: 0.25rem }`. */
const GAP = 4;

/** The component's own stylesheet, as text (its visual contract lives in CSS, not in the DOM). */
function styles(): string {
  const ctor = customElements.get('ok-data-table') as unknown as { styles: unknown };
  const sheets = Array.isArray(ctor.styles) ? ctor.styles : [ctor.styles];
  return sheets.map((s) => String((s as { cssText?: string })?.cssText ?? s)).join('\n');
}

/** The rule that governs the buttons inside a CARD's action row. */
function cardActionsRule(): string {
  const css = styles().replace(/\s+/g, ' ');
  return css.match(/\.ractions \.actions\s*\{[^}]*\}/)?.[0] ?? '';
}

async function mount(actions = AGENDA_ACTIONS): Promise<Table> {
  const table = document.createElement('ok-data-table') as unknown as Table;
  table.rows = [{ id: '1', appointment_number: 'APT-20260909-0001', customer_name: 'Ana Torres' }];
  table.columns = [
    { key: 'appointment_number', header: 'No.' },
    { key: 'customer_name', header: 'Customer' },
  ];
  table.rowKey = 'id';
  table.actions = actions;
  table.views = true;
  table.defaultView = 'cards';
  document.body.appendChild(table);
  await table.updateComplete;
  return table;
}

beforeEach(() => {
  document.body.replaceChildren();
  document.documentElement.lang = 'es';
});

describe("ok-data-table: a card's action row never runs off the card (ERPlora/appointments#154)", () => {
  it('reproduces the premise: eight actions do not fit across the card on a phone', () => {
    const room = PHONE_DP - GRID_PADDING - ROW_PADDING;
    const needed = AGENDA_ACTIONS.length * BUTTON_MIN + (AGENDA_ACTIONS.length - 1) * GAP;

    // If this ever stops being true the defect went away by another road, and the rest of this
    // suite would be guarding a case that no longer exists.
    expect(needed).toBeGreaterThan(room);
  });

  it('renders all eight of the appointment actions inside the card', async () => {
    const table = await mount();
    const buttons = table.shadowRoot?.querySelectorAll('.rcard .ractions ion-button') ?? [];
    expect(buttons).toHaveLength(AGENDA_ACTIONS.length);
  });

  it('lets the row run onto a second line instead of clipping the first button', async () => {
    await mount();
    expect(
      cardActionsRule(),
      'the card action row cannot wrap: whatever does not fit is clipped at the edge',
    ).toMatch(/flex-wrap: wrap/);
  });

  it('leaves the LIST view row alone, the one whose width is measured to pin its track', async () => {
    // `measureActionsTrack()` reads the `scrollWidth` of `.grow-data .gcell.actions-col .actions`
    // to pin the column width (#121). A row that wraps changes width with the track it is measured
    // against, and the decision would oscillate — which is why the wrap is scoped to `.ractions`.
    const css = styles().replace(/\s+/g, ' ');
    const listRule = css.match(/(?<!\.ractions )\.actions \{[^}]*\}/)?.[0] ?? '';
    expect(listRule, 'the base `.actions` rule is not there any more').toBeTruthy();
    expect(listRule, 'the LIST action row must not wrap: its width is measured (#121)')
      .not.toMatch(/flex-wrap: wrap/);
  });
});
