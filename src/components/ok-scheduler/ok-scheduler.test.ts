// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it (the baked
// navigation chevrons are irrelevant to the move contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
}));

import './ok-scheduler';
import type { OkSchedulerEvent, OkSchedulerResource } from './ok-scheduler';

type SchedulerElement = HTMLElement & {
  resources: OkSchedulerResource[];
  events: OkSchedulerEvent[];
  movable: boolean;
  resizable: boolean;
  snapMin: number;
  startHour: number;
  endHour: number;
  updateComplete: Promise<unknown>;
};

const RESOURCES: OkSchedulerResource[] = [
  { id: 'r1', label: 'Maria Lopez' },
  { id: 'r2', label: 'Juan Perez' },
];

const EVENTS: OkSchedulerEvent[] = [
  { id: 'e1', resourceId: 'r1', start: '09:00', end: '10:00', title: 'Cut' },
  { id: 'e2', resourceId: 'r2', start: '12:00', end: '13:00', title: 'Colour' },
];

/**
 * The lane spans 8:00→20:00 (720 min). We give it 720 px of layout so 1 px == 1 minute,
 * which keeps the drag arithmetic in the tests readable.
 */
const LANE_WIDTH = 720;

function rect(left: number, width: number): DOMRect {
  return {
    top: 0,
    bottom: 56,
    height: 56,
    left,
    right: left + width,
    width,
    x: left,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

async function mount(movable = true, resizable = false): Promise<SchedulerElement> {
  const element = document.createElement('ok-scheduler') as SchedulerElement;
  element.resources = RESOURCES;
  element.events = EVENTS;
  element.movable = movable;
  element.resizable = resizable;
  document.body.appendChild(element);
  await element.updateComplete;
  // happy-dom does no layout: declare the lane geometry the hit tests rely on.
  for (const lane of element.shadowRoot!.querySelectorAll('.lane')) {
    (lane as HTMLElement).getBoundingClientRect = () => rect(0, LANE_WIDTH);
  }
  return element;
}

function block(element: SchedulerElement, id: string): HTMLElement {
  return element.shadowRoot!.querySelector(`[data-event-id="${id}"]`)!;
}

function lane(element: SchedulerElement, resourceId: string): HTMLElement {
  return element.shadowRoot!.querySelector(`.lane[data-resource-id="${resourceId}"]`)!;
}

function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  x: number,
  pointerType = 'mouse',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 3,
      pointerType,
      button: 0,
      clientX: x,
      clientY: 20,
    }),
  );
}

/** The component hit-tests its own shadow root; happy-dom needs the answer spelled out. */
function hitTest(element: SchedulerElement, target: Element): void {
  Object.defineProperty(element.shadowRoot!, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => target),
  });
}

/** Full mouse drag of `id` by `dx` px, dropped over `overLane`. */
function drag(element: SchedulerElement, id: string, dx: number, overLane: HTMLElement): void {
  hitTest(element, overLane);
  const source = block(element, id);
  const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;
  pointer(source, 'pointerdown', 100);
  pointer(grid, 'pointermove', 100 + dx);
  pointer(grid, 'pointerup', 100 + dx);
}

beforeEach(() => {
  document.body.innerHTML = '';
});

afterEach(() => {
  vi.useRealTimers();
});

describe('ok-scheduler · move an event by dragging (Pointer Events)', () => {
  it('moves the block inside its own lane and reports the new time', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    drag(element, 'e1', 60, lane(element, 'r1'));
    await element.updateComplete;

    expect(moved).toHaveBeenCalledOnce();
    expect(moved.mock.calls[0][0]).toMatchObject({
      id: 'e1',
      resourceId: 'r1',
      start: '10:00',
      end: '11:00',
      from: { resourceId: 'r1', start: '09:00', end: '10:00' },
    });
  });

  it('moves the block to another resource lane in the same gesture', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    drag(element, 'e1', 120, lane(element, 'r2'));
    await element.updateComplete;

    expect(moved.mock.calls[0][0]).toMatchObject({
      id: 'e1',
      resourceId: 'r2',
      start: '11:00',
      end: '12:00',
    });
  });

  it('snaps the new start to the grid (15 min by default) and keeps the duration', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    // 09:00 + 70 min = 10:10 → snapped to 10:15; the hour of duration survives.
    drag(element, 'e1', 70, lane(element, 'r1'));
    await element.updateComplete;

    expect(moved.mock.calls[0][0]).toMatchObject({ start: '10:15', end: '11:15' });
  });

  it('never drags the block out of the visible time range', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    drag(element, 'e2', 600, lane(element, 'r2'));
    await element.updateComplete;

    // 12:00 + 600 min would be 22:00; the last hour that fits a 60 min block is 19:00.
    expect(moved.mock.calls[0][0]).toMatchObject({ start: '19:00', end: '20:00' });
  });

  it('waits 5 px before starting a drag, so a tap still opens the event', async () => {
    const element = await mount();
    const moved = vi.fn();
    const clicked = vi.fn();
    element.addEventListener('ok-event-move', moved);
    element.addEventListener('ok-event-click', (e) => clicked((e as CustomEvent).detail));

    drag(element, 'e1', 3, lane(element, 'r1'));
    block(element, 'e1').click();

    expect(moved).not.toHaveBeenCalled();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  it('does not open the event with the click the browser fires after a drag', async () => {
    const element = await mount();
    const clicked = vi.fn();
    element.addEventListener('ok-event-click', clicked);

    drag(element, 'e1', 60, lane(element, 'r1'));
    block(element, 'e1').click();

    expect(clicked).not.toHaveBeenCalled();
  });

  it('cancels the gesture without moving anything', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', moved);
    hitTest(element, lane(element, 'r2'));
    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;

    pointer(block(element, 'e1'), 'pointerdown', 100);
    pointer(grid, 'pointermove', 200);
    pointer(grid, 'pointercancel', 200);
    await element.updateComplete;

    expect(moved).not.toHaveBeenCalled();
    expect(block(element, 'e1').classList.contains('dragging')).toBe(false);
  });

  it('does not use the HTML5 drag API, which is dead on touch', async () => {
    const element = await mount();
    expect(block(element, 'e1').hasAttribute('draggable')).toBe(false);
  });

  it('stays inert when the host did not opt into moving', async () => {
    const element = await mount(false);
    const moved = vi.fn();
    element.addEventListener('ok-event-move', moved);

    drag(element, 'e1', 60, lane(element, 'r1'));
    await element.updateComplete;

    expect(moved).not.toHaveBeenCalled();
  });
});

describe('ok-scheduler · on touch the drag needs a long press', () => {
  /**
   * The single most documented failure of drag & drop in appointment books is the accidental
   * drag on a tablet: a scroll or a tap on a block moves a real client's appointment, nobody
   * notices, and there is no record of the original time. The products that hit that wall put a
   * hold in front of the gesture (Vagaro) or moved it onto a dedicated handle (Mindbody Booker).
   */
  function down(element: SchedulerElement, overLane: HTMLElement): HTMLElement {
    hitTest(element, overLane);
    pointer(block(element, 'e1'), 'pointerdown', 100, 'touch');
    return element.shadowRoot!.querySelector('.grid') as HTMLElement;
  }

  it('does not move anything when the finger swipes straight away', async () => {
    vi.useFakeTimers();
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', moved);

    const grid = down(element, lane(element, 'r2'));
    pointer(grid, 'pointermove', 200, 'touch');
    pointer(grid, 'pointerup', 200, 'touch');

    expect(moved).not.toHaveBeenCalled();
  });

  it('moves the appointment after holding the block still', async () => {
    vi.useFakeTimers();
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    const grid = down(element, lane(element, 'r1'));
    vi.advanceTimersByTime(500);
    pointer(grid, 'pointermove', 160, 'touch');
    pointer(grid, 'pointerup', 160, 'touch');

    expect(moved).toHaveBeenCalledOnce();
    expect(moved.mock.calls[0][0]).toMatchObject({ resourceId: 'r1', start: '10:00' });
  });

  it('gives up the long press if the finger travels first — that gesture was a scroll', async () => {
    vi.useFakeTimers();
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', moved);

    const grid = down(element, lane(element, 'r2'));
    pointer(grid, 'pointermove', 130, 'touch'); // the finger left before the hold completed
    vi.advanceTimersByTime(500);
    pointer(grid, 'pointermove', 200, 'touch');
    pointer(grid, 'pointerup', 200, 'touch');

    expect(moved).not.toHaveBeenCalled();
  });

  it('still opens the block on a plain tap', async () => {
    vi.useFakeTimers();
    const element = await mount();
    const clicked = vi.fn();
    const moved = vi.fn();
    element.addEventListener('ok-event-click', (e) => clicked((e as CustomEvent).detail));
    element.addEventListener('ok-event-move', moved);

    const grid = down(element, lane(element, 'r1'));
    pointer(grid, 'pointerup', 100, 'touch');
    block(element, 'e1').click();

    expect(moved).not.toHaveBeenCalled();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  it('marks the block as held so the tablet shows the gesture armed', async () => {
    vi.useFakeTimers();
    const element = await mount();
    down(element, lane(element, 'r1'));
    vi.advanceTimersByTime(500);
    await element.updateComplete;

    expect(block(element, 'e1').classList.contains('held')).toBe(true);
  });

  it('does not make the mouse wait: it is precise enough already', async () => {
    vi.useFakeTimers();
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', moved);

    drag(element, 'e1', 60, lane(element, 'r1')); // mouse, no timers advanced
    expect(moved).toHaveBeenCalledOnce();
  });
});

describe('ok-scheduler · the host decides, the grid obeys', () => {
  it('shows the block at the new place while the host confirms', async () => {
    const element = await mount();
    drag(element, 'e1', 60, lane(element, 'r2'));
    await element.updateComplete;

    const moved = block(element, 'e1');
    expect(moved.closest('.lane')!.getAttribute('data-resource-id')).toBe('r2');
    expect(moved.getAttribute('style')).toContain('left:16.6');
  });

  it('puts the block back where it was when the host rejects the move', async () => {
    const element = await mount();
    let detail: { revert: () => void } | null = null;
    element.addEventListener('ok-event-move', (e) => {
      detail = (e as CustomEvent).detail;
    });

    drag(element, 'e1', 60, lane(element, 'r2'));
    await element.updateComplete;

    detail!.revert();
    await element.updateComplete;

    const back = block(element, 'e1');
    expect(back.closest('.lane')!.getAttribute('data-resource-id')).toBe('r1');
    expect(back.getAttribute('style')).toContain('left:8.3');
  });

  it('drops the optimistic position as soon as the host refreshes its events', async () => {
    const element = await mount();
    drag(element, 'e1', 60, lane(element, 'r2'));
    await element.updateComplete;

    element.events = [
      { id: 'e1', resourceId: 'r1', start: '09:00', end: '10:00', title: 'Cut' },
      ...EVENTS.slice(1),
    ];
    await element.updateComplete;

    expect(block(element, 'e1').closest('.lane')!.getAttribute('data-resource-id')).toBe('r1');
  });
});

describe('ok-scheduler · keyboard is a first-class way to move', () => {
  function key(target: HTMLElement, k: string, shift = false): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, shiftKey: shift, bubbles: true, cancelable: true }),
    );
  }

  it('exposes every block as a focusable button', async () => {
    const element = await mount();
    const b = block(element, 'e1');
    expect(b.getAttribute('tabindex')).toBe('0');
    expect(b.getAttribute('role')).toBe('button');
    expect(b.getAttribute('aria-label')).toContain('Cut');
  });

  it('moves the event forward and back in time with the arrow keys', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    key(block(element, 'e1'), 'ArrowRight');
    await element.updateComplete;

    expect(moved.mock.calls[0][0]).toMatchObject({ resourceId: 'r1', start: '09:15', end: '10:15' });
  });

  it('changes resource with the vertical arrows', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    key(block(element, 'e1'), 'ArrowDown');
    await element.updateComplete;

    expect(moved.mock.calls[0][0]).toMatchObject({ resourceId: 'r2', start: '09:00', end: '10:00' });
  });

  it('opens the event with Enter, which is the route that always works', async () => {
    const element = await mount();
    const clicked = vi.fn();
    const moved = vi.fn();
    element.addEventListener('ok-event-click', (e) => clicked((e as CustomEvent).detail));
    element.addEventListener('ok-event-move', moved);

    key(block(element, 'e1'), 'Enter');

    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
    expect(moved).not.toHaveBeenCalled();
  });

  it('keeps Enter working when the host did not opt into moving', async () => {
    const element = await mount(false);
    const clicked = vi.fn();
    const moved = vi.fn();
    element.addEventListener('ok-event-click', (e) => clicked((e as CustomEvent).detail));
    element.addEventListener('ok-event-move', moved);

    key(block(element, 'e1'), 'Enter');
    key(block(element, 'e1'), 'ArrowRight');

    expect(clicked).toHaveBeenCalledOnce();
    expect(moved).not.toHaveBeenCalled();
  });
});

// ── Redimensionar (outfitkit#65) ────────────────────────────────────────────────────────────────
//
// Alargar o acortar una cita arrastrando su BORDE DE FIN es lo que hacen Fresha, Phorest, Outlook,
// DaySmart, Google Calendar y Odoo Planning. En sus agendas el día es vertical y ese borde es el
// inferior; aquí el timeline es HORIZONTAL, así que el mismo borde —el del final— es el derecho.
//
// Y es un asa DEDICADA, no el cuerpo del bloque: el asa y el arrastre conviven en el mismo
// elemento y uno se comería al otro. Mindbody Booker llegó a sacar el arrastre del cuerpo por esto.
// Aquí gana el asa sobre sí misma (detiene la propagación del `pointerdown`) y el cuerpo sigue
// moviendo en todo lo demás.
function handle(element: SchedulerElement, id: string): HTMLElement {
  return element.shadowRoot!.querySelector(`[data-event-id="${id}"] .resize-handle`)!;
}

/** Arrastre del asa de fin de `id` por `dx` px. */
function resize(element: SchedulerElement, id: string, dx: number): void {
  const grip = handle(element, id);
  const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;
  pointer(grip, 'pointerdown', 160);
  pointer(grid, 'pointermove', 160 + dx);
  pointer(grid, 'pointerup', 160 + dx);
}

describe('ok-scheduler · resize an event by dragging its end edge', () => {
  it('only shows the handle when the host opted in', async () => {
    const off = await mount(true, false);
    expect(off.shadowRoot!.querySelector('.resize-handle')).toBeNull();

    const on = await mount(true, true);
    expect(handle(on, 'e1')).toBeTruthy();
  });

  it('lengthens the event and reports the new end, keeping the start', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    resize(element, 'e1', 60);
    await element.updateComplete;

    expect(resized).toHaveBeenCalledOnce();
    expect(resized.mock.calls[0][0]).toMatchObject({
      id: 'e1',
      start: '09:00',
      end: '11:00',
      from: { start: '09:00', end: '10:00' },
    });
  });

  it('shortens it too, and snaps the end to the grid', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    resize(element, 'e1', -22); // 38 min → imantado a 45
    await element.updateComplete;

    expect(resized.mock.calls[0][0]).toMatchObject({ start: '09:00', end: '09:45' });
  });

  it('never lets a block get shorter than one snap', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    resize(element, 'e1', -300);
    await element.updateComplete;

    expect(resized.mock.calls[0][0]).toMatchObject({ start: '09:00', end: '09:15' });
  });

  it('does not let the end run past the visible range', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    resize(element, 'e1', 2000);
    await element.updateComplete;

    expect(resized.mock.calls[0][0]).toMatchObject({ start: '09:00', end: '20:00' });
  });

  it('emits NOTHING when the end lands back on the same minute', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    resize(element, 'e1', 2);
    await element.updateComplete;

    expect(resized).not.toHaveBeenCalled();
  });

  it('paints the new length optimistically and `revert()` undoes it', async () => {
    const element = await mount(true, true);
    let detail: { revert: () => void } | null = null;
    element.addEventListener('ok-event-resize', (e) => {
      detail = (e as CustomEvent).detail;
    });

    resize(element, 'e1', 60);
    await element.updateComplete;
    const wide = block(element, 'e1').style.width;

    detail!.revert();
    await element.updateComplete;

    expect(wide).not.toBe(block(element, 'e1').style.width);
    expect(block(element, 'e1').getAttribute('aria-label')).toContain('10:00');
  });

  it('the handle wins over the body: dragging it never moves the event', async () => {
    const element = await mount(true, true);
    const moved = vi.fn();
    const resized = vi.fn();
    element.addEventListener('ok-event-move', moved);
    element.addEventListener('ok-event-resize', resized);
    hitTest(element, lane(element, 'r1'));

    resize(element, 'e1', 60);
    await element.updateComplete;

    expect(resized).toHaveBeenCalledOnce();
    expect(moved).not.toHaveBeenCalled();
  });

  it('and the body still moves: the two gestures live together', async () => {
    const element = await mount(true, true);
    const moved = vi.fn();
    const resized = vi.fn();
    element.addEventListener('ok-event-move', moved);
    element.addEventListener('ok-event-resize', resized);

    drag(element, 'e1', 60, lane(element, 'r1'));
    await element.updateComplete;

    expect(moved).toHaveBeenCalledOnce();
    expect(resized).not.toHaveBeenCalled();
  });

  it('with a finger the handle needs no long press: it IS the deliberate target', async () => {
    vi.useFakeTimers();
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));
    const grip = handle(element, 'e1');
    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;

    pointer(grip, 'pointerdown', 160, 'touch');
    pointer(grid, 'pointermove', 220, 'touch'); // sin esperar los 400 ms del movimiento
    pointer(grid, 'pointerup', 220, 'touch');

    expect(resized).toHaveBeenCalledOnce();
    expect(resized.mock.calls[0][0]).toMatchObject({ end: '11:00' });
  });

  it('a tap on the handle resizes nothing (and still opens the event)', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', resized);
    const grip = handle(element, 'e1');
    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;

    pointer(grip, 'pointerdown', 160);
    pointer(grid, 'pointerup', 161);
    await element.updateComplete;

    expect(resized).not.toHaveBeenCalled();
  });

  it('does nothing at all when the host did not opt into resizing', async () => {
    const element = await mount(true, false);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', resized);

    const source = block(element, 'e1');
    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;
    hitTest(element, lane(element, 'r1'));
    pointer(source, 'pointerdown', 160);
    pointer(grid, 'pointermove', 220);
    pointer(grid, 'pointerup', 220);

    expect(resized).not.toHaveBeenCalled();
  });
});

describe('ok-scheduler · resizing with the keyboard', () => {
  function key(target: HTMLElement, k: string, shift = false): void {
    target.dispatchEvent(
      new KeyboardEvent('keydown', { key: k, shiftKey: shift, bubbles: true, cancelable: true }),
    );
  }

  it('Shift+Right lengthens by one snap and Shift+Left shortens it', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    key(block(element, 'e1'), 'ArrowRight', true);
    await element.updateComplete;
    expect(resized.mock.calls[0][0]).toMatchObject({ start: '09:00', end: '10:15' });

    key(block(element, 'e1'), 'ArrowLeft', true);
    await element.updateComplete;
    expect(resized.mock.calls[1][0]).toMatchObject({ start: '09:00', end: '10:00' });
  });

  it('Shift+Left never goes below one snap', async () => {
    const element = await mount(true, true);
    const resized = vi.fn();
    element.addEventListener('ok-event-resize', (e) => resized((e as CustomEvent).detail));

    for (let i = 0; i < 10; i++) key(block(element, 'e1'), 'ArrowLeft', true);
    await element.updateComplete;

    const last = resized.mock.calls.at(-1)![0];
    expect(last).toMatchObject({ start: '09:00', end: '09:15' });
  });

  it('without `resizable`, Shift keeps its old meaning: a coarser MOVE step', async () => {
    const element = await mount(true, false);
    const moved = vi.fn();
    const resized = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));
    element.addEventListener('ok-event-resize', resized);

    key(block(element, 'e1'), 'ArrowRight', true);
    await element.updateComplete;

    expect(resized).not.toHaveBeenCalled();
    expect(moved.mock.calls[0][0]).toMatchObject({ start: '10:00', end: '11:00' });
  });
});
