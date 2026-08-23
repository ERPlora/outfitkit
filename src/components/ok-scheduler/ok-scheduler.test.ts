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

// ── Solape: side-by-side por clúster (outfitkit#71) ─────────────────────────────────────────────
//
// Dos citas a la misma hora en el MISMO carril se pintaban una ENCIMA de otra: los dos bloques
// llevaban `top:0.25rem; bottom:0.25rem`, o sea el alto entero de la fila, así que en pantalla solo
// existía la de arriba. En una agenda ese es justo el momento en que la recepcionista necesita ver
// que hay DOS personas citadas (appointments#77).
//
// El reparto es el algoritmo clásico de las agendas: se agrupan por solape transitivo (clúster) y
// el clúster se parte en N sub-carriles; cada bloque cae en el PRIMER sub-carril libre, así que dos
// citas que no se pisan entre sí reutilizan el mismo. Aquí el timeline es HORIZONTAL, así que el
// reparto es del ALTO de la fila, no del ancho.
//
// El contrato se fija con `data-lane-index` / `data-lane-count` porque happy-dom no calcula layout:
// la aritmética se prueba aquí y los píxeles se comprueban en navegador real (como en #64).

/** Monta un scheduler con SUS eventos (el `mount` de arriba trae los suyos fijos). */
async function mountEvents(
  events: OkSchedulerEvent[],
  resources: OkSchedulerResource[] = RESOURCES,
  movable = true,
  resizable = false,
): Promise<SchedulerElement> {
  const element = document.createElement('ok-scheduler') as SchedulerElement;
  element.resources = resources;
  element.events = events;
  element.movable = movable;
  element.resizable = resizable;
  document.body.appendChild(element);
  await element.updateComplete;
  for (const lane of element.shadowRoot!.querySelectorAll('.lane')) {
    (lane as HTMLElement).getBoundingClientRect = () => rect(0, LANE_WIDTH);
  }
  return element;
}

/** El sub-carril donde ha caído un bloque, y en cuántos se partió su clúster. */
function stack(element: SchedulerElement, id: string): { index: number; count: number } {
  const el = block(element, id);
  return { index: Number(el.dataset.laneIndex), count: Number(el.dataset.laneCount) };
}

describe('ok-scheduler · two appointments at the same time sit side by side', () => {
  it('splits the lane between two blocks that share the slot, instead of stacking them', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Luis' },
    ]);

    expect(stack(element, 'a')).toEqual({ index: 0, count: 2 });
    expect(stack(element, 'b')).toEqual({ index: 1, count: 2 });
  });

  it('leaves a lone appointment using the whole lane', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
    ]);

    expect(stack(element, 'a')).toEqual({ index: 0, count: 1 });
  });

  it('does not split anything when the two appointments merely touch end to start', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '13:00', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '13:00', end: '14:00', title: 'Luis' },
    ]);

    expect(stack(element, 'a')).toEqual({ index: 0, count: 1 });
    expect(stack(element, 'b')).toEqual({ index: 0, count: 1 });
  });

  it('reuses the first free sub-lane, so a chain of overlaps stays two rows tall', async () => {
    // A 10–11 pisa a B 10:30–11:30, B pisa a C 11:15–12, pero A y C no se tocan: C vuelve al 0.
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '10:00', end: '11:00', title: 'A' },
      { id: 'b', resourceId: 'r1', start: '10:30', end: '11:30', title: 'B' },
      { id: 'c', resourceId: 'r1', start: '11:15', end: '12:00', title: 'C' },
    ]);

    expect(stack(element, 'a')).toEqual({ index: 0, count: 2 });
    expect(stack(element, 'b')).toEqual({ index: 1, count: 2 });
    expect(stack(element, 'c')).toEqual({ index: 0, count: 2 });
  });

  it('keeps each cluster of the day independent: the morning does not thin out the afternoon', async () => {
    const element = await mountEvents([
      { id: 'm1', resourceId: 'r1', start: '09:00', end: '10:00', title: 'M1' },
      { id: 'm2', resourceId: 'r1', start: '09:00', end: '10:00', title: 'M2' },
      { id: 'solo', resourceId: 'r1', start: '17:00', end: '18:00', title: 'Solo' },
    ]);

    expect(stack(element, 'm1').count).toBe(2);
    expect(stack(element, 'solo')).toEqual({ index: 0, count: 1 });
  });

  it('splits each resource on its own: a busy lane never thins out the lane below', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Luis' },
      { id: 'other', resourceId: 'r2', start: '12:00', end: '12:30', title: 'Otra' },
    ]);

    expect(stack(element, 'a').count).toBe(2);
    expect(stack(element, 'other')).toEqual({ index: 0, count: 1 });
  });

  it('orders the sub-lanes by start time, so the earlier appointment is on top', async () => {
    const element = await mountEvents([
      { id: 'late', resourceId: 'r1', start: '12:15', end: '13:00', title: 'Late' },
      { id: 'early', resourceId: 'r1', start: '12:00', end: '13:00', title: 'Early' },
    ]);

    expect(stack(element, 'early').index).toBe(0);
    expect(stack(element, 'late').index).toBe(1);
  });

  it('gives every block of a cluster a height, so none is painted over another', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Luis' },
    ]);

    // Se lee el ATRIBUTO `style` tal cual lo escribe Lit, no `style.top`: el CSSOM de happy-dom no
    // sabe parsear un `calc()` anidado y devuelve cadena vacía, así que preguntarle a él mediría el
    // parser en vez del componente. Los píxeles de verdad se comprueban en navegador real.
    const a = block(element, 'a').getAttribute('style') ?? '';
    const b = block(element, 'b').getAttribute('style') ?? '';

    // Cada bloque arranca en un `top` distinto y ninguno ocupa ya el alto entero del carril.
    expect(a).toContain('top:calc(0.25rem + (100% - 0.5rem) * 0 / 2)');
    expect(b).toContain('top:calc(0.25rem + (100% - 0.5rem) * 1 / 2)');
    expect(a).toContain('height:calc((100% - 0.5rem) / 2');
    expect(a).not.toEqual(b);
  });

  it('grows the row instead of shrinking the blocks below a readable height', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '13:00', title: 'A' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '13:00', title: 'B' },
      { id: 'c', resourceId: 'r1', start: '12:00', end: '13:00', title: 'C' },
    ]);

    // El carril declara en cuántos se partió; el CSS lo convierte en alto con `--min-stack-height`.
    expect(lane(element, 'r1').dataset.stacks).toBe('3');
    expect(lane(element, 'r1').getAttribute('style')).toContain('--stacks:3');
    // Y el vecino tranquilo no crece por acompañarlo.
    expect(lane(element, 'r2').dataset.stacks).toBe('1');
  });

  it('breaks a tie on the start by putting the SHORTER appointment first', async () => {
    // Orden de consenso (Bryntum, Google Calendar, Mobiscroll): inicio asc, luego fin más temprano.
    const element = await mountEvents([
      { id: 'long', resourceId: 'r1', start: '12:00', end: '14:00', title: 'Long' },
      { id: 'short', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Short' },
    ]);

    expect(stack(element, 'short').index).toBe(0);
    expect(stack(element, 'long').index).toBe(1);
  });
});

describe('ok-scheduler · dragging still works when two blocks share the slot', () => {
  it('moves the block the gesture started on, not the one that used to cover it', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Luis' },
    ]);
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    drag(element, 'b', 60, lane(element, 'r1'));

    expect(moved).toHaveBeenCalledOnce();
    expect(moved.mock.calls[0][0].id).toBe('b');
  });

  it('puts the block back in its own sub-lane when the host rejects the move', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '12:00', end: '12:30', title: 'Luis' },
    ]);
    let detail: { revert: () => void } | null = null;
    element.addEventListener('ok-event-move', (e) => {
      detail = (e as CustomEvent).detail;
    });

    drag(element, 'b', 60, lane(element, 'r1'));
    await element.updateComplete;
    detail!.revert();
    await element.updateComplete;

    expect(stack(element, 'b')).toEqual({ index: 1, count: 2 });
    expect(stack(element, 'a')).toEqual({ index: 0, count: 2 });
  });

  it('re-splits the lane once a dragged block lands on top of another one', async () => {
    const element = await mountEvents([
      { id: 'a', resourceId: 'r1', start: '12:00', end: '13:00', title: 'Ana' },
      { id: 'b', resourceId: 'r1', start: '16:00', end: '17:00', title: 'Luis' },
    ]);
    expect(stack(element, 'a').count).toBe(1);

    // 16:00 → 12:00 son 240 min hacia atrás; con 1 px == 1 min, −240 px.
    drag(element, 'b', -240, lane(element, 'r1'));
    await element.updateComplete;

    expect(stack(element, 'b').count).toBe(2);
    expect(stack(element, 'a').count).toBe(2);
  });
});

// ── El contrato del SCROLL horizontal (outfitkit#71 §2) ─────────────────────────────────────────
//
// El QA midió el timeline RECORTADO sin barra de scroll (a 834 px acababa a las 14:00) contra una
// copia VIEJA del componente: el código lleva el scroll desde la v0.1.40. Sin un test que lo fije,
// una copia vieja se vuelve a detectar en el salón y no en CI, que es exactamente lo que pasó.
describe('ok-scheduler · the timeline always has a way to reach the end of the day', () => {
  it('gives the scroller `overflow-x:auto`, so the day is never clipped without an escape', async () => {
    const element = await mountEvents([]);
    const css = (element.constructor as unknown as { styles: { cssText: string } }).styles.cssText;

    expect(css).toMatch(/\.scroll\s*\{[^}]*overflow-x:\s*auto/);
  });

  it('sizes the grid by the HOURS on show, so it outgrows a narrow container', async () => {
    const element = await mountEvents([]);
    element.startHour = 8;
    element.endHour = 20;
    await element.updateComplete;

    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;
    // 12 horas de franja + la columna sticky del recurso.
    expect(grid.getAttribute('style')).toContain('12 * var(--hour-width)');
    expect(grid.getAttribute('style')).toContain('var(--resource-width)');
  });
});
