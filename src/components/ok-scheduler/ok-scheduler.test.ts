// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

async function mount(movable = true): Promise<SchedulerElement> {
  const element = document.createElement('ok-scheduler') as SchedulerElement;
  element.resources = RESOURCES;
  element.events = EVENTS;
  element.movable = movable;
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

describe('ok-scheduler · the finger gets more room than the mouse', () => {
  function touchDrag(element: SchedulerElement, dx: number, overLane: HTMLElement): void {
    hitTest(element, overLane);
    const grid = element.shadowRoot!.querySelector('.grid') as HTMLElement;
    pointer(block(element, 'e1'), 'pointerdown', 100, 'touch');
    pointer(grid, 'pointermove', 100 + dx, 'touch');
    pointer(grid, 'pointerup', 100 + dx, 'touch');
  }

  it('reads a small wobble of the finger as a tap, not as a move', async () => {
    const element = await mount();
    const moved = vi.fn();
    const clicked = vi.fn();
    element.addEventListener('ok-event-move', moved);
    element.addEventListener('ok-event-click', (e) => clicked((e as CustomEvent).detail));

    // 8 px would already be a drag for a mouse; a fingertip is not that precise.
    touchDrag(element, 8, lane(element, 'r2'));
    block(element, 'e1').click();

    expect(moved).not.toHaveBeenCalled();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }));
  });

  it('moves the appointment once the finger clearly travelled', async () => {
    const element = await mount();
    const moved = vi.fn();
    element.addEventListener('ok-event-move', (e) => moved((e as CustomEvent).detail));

    touchDrag(element, 60, lane(element, 'r2'));
    await element.updateComplete;

    expect(moved.mock.calls[0][0]).toMatchObject({ resourceId: 'r2', start: '10:00' });
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
