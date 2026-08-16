// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import './ok-kanban';
import type { OkKanbanColumn } from './ok-kanban';

type KanbanElement = HTMLElement & {
  columns: OkKanbanColumn[];
  updateComplete: Promise<unknown>;
};

const COLUMNS: OkKanbanColumn[] = [
  {
    id: 'todo',
    title: 'Todo',
    cards: [
      { id: 'a', title: 'Alpha' },
      { id: 'b', title: 'Beta' },
    ],
  },
  { id: 'done', title: 'Done', cards: [{ id: 'c', title: 'Gamma' }] },
];

async function mount(): Promise<KanbanElement> {
  const element = document.createElement('ok-kanban') as KanbanElement;
  element.columns = COLUMNS;
  document.body.appendChild(element);
  await element.updateComplete;
  return element;
}

function card(element: KanbanElement, id: string): HTMLElement {
  return element.shadowRoot!.querySelector(`[data-card-id="${id}"]`)!;
}

function handle(element: KanbanElement, id: string): HTMLElement {
  return card(element, id).querySelector('.drag-handle')!;
}

function board(element: KanbanElement): HTMLElement {
  return element.shadowRoot!.querySelector('.board')!;
}

function pointer(
  target: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup' | 'pointercancel',
  x: number,
  y: number,
  pointerType = 'touch',
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      composed: true,
      cancelable: true,
      pointerId: 7,
      pointerType,
      button: 0,
      clientX: x,
      clientY: y,
    }),
  );
}

/**
 * happy-dom no calcula layout. El componente usa el hit-test real del ShadowRoot para saber qué
 * hay bajo un puntero capturado, así que cada prueba declara explícitamente ese resultado.
 */
function hitTest(element: KanbanElement, target: Element): void {
  Object.defineProperty(element.shadowRoot!, 'elementFromPoint', {
    configurable: true,
    value: vi.fn(() => target),
  });
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ok-kanban · drag & drop con Pointer Events', () => {
  it('mueve una tarjeta con un puntero táctil y conserva el contrato ok-card-move', async () => {
    const element = await mount();
    const target = card(element, 'c');
    target.getBoundingClientRect = () =>
      ({
        top: 100,
        height: 80,
        bottom: 180,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;
    hitTest(element, target);

    const moved = vi.fn();
    element.addEventListener('ok-card-move', (event) => moved((event as CustomEvent).detail));

    pointer(handle(element, 'a'), 'pointerdown', 10, 10);
    pointer(board(element), 'pointermove', 20, 120);
    pointer(board(element), 'pointerup', 20, 120);
    await element.updateComplete;

    expect(moved).toHaveBeenCalledOnce();
    expect(moved).toHaveBeenCalledWith({
      cardId: 'a',
      fromColumn: 'todo',
      toColumn: 'done',
      toIndex: 0,
    });
    expect(
      [...element.shadowRoot!.querySelectorAll('[data-column-id="done"] [data-card-id]')].map(
        (node) => (node as HTMLElement).dataset.cardId,
      ),
    ).toEqual(['a', 'c']);
  });

  it('espera 5 px antes de iniciar el drag para no convertir un toque en movimiento', async () => {
    const element = await mount();
    const source = card(element, 'a');
    hitTest(element, card(element, 'c'));
    const moved = vi.fn();
    const clicked = vi.fn();
    element.addEventListener('ok-card-move', moved);
    element.addEventListener('ok-card-click', (event) => clicked((event as CustomEvent).detail));

    pointer(handle(element, 'a'), 'pointerdown', 10, 10);
    pointer(board(element), 'pointermove', 13, 13);
    pointer(board(element), 'pointerup', 13, 13);
    source.click();

    expect(moved).not.toHaveBeenCalled();
    expect(clicked).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
  });

  it('no emite click después de arrastrar la tarjeta', async () => {
    const element = await mount();
    const source = card(element, 'a');
    const target = card(element, 'c');
    target.getBoundingClientRect = () =>
      ({
        top: 100,
        height: 80,
        bottom: 180,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;
    hitTest(element, target);
    const clicked = vi.fn();
    element.addEventListener('ok-card-click', clicked);

    pointer(handle(element, 'a'), 'pointerdown', 10, 10);
    pointer(board(element), 'pointermove', 20, 120);
    pointer(board(element), 'pointerup', 20, 120);
    source.click(); // click sintético que dispara el navegador después de pointerup

    expect(clicked).not.toHaveBeenCalled();
  });

  it('cancela el gesto sin mover la tarjeta', async () => {
    const element = await mount();
    hitTest(element, card(element, 'c'));
    const moved = vi.fn();
    element.addEventListener('ok-card-move', moved);

    pointer(handle(element, 'a'), 'pointerdown', 10, 10);
    pointer(board(element), 'pointermove', 20, 120);
    pointer(board(element), 'pointercancel', 20, 120);
    await element.updateComplete;

    expect(moved).not.toHaveBeenCalled();
    expect(card(element, 'a').classList.contains('dragging')).toBe(false);
  });

  it('ya no depende del atributo draggable de la API HTML5', async () => {
    const element = await mount();
    expect(card(element, 'a').hasAttribute('draggable')).toBe(false);
  });

  it('deja el cuerpo de la tarjeta libre para hacer scroll táctil', async () => {
    const element = await mount();
    const source = card(element, 'a');
    hitTest(element, card(element, 'c'));
    const moved = vi.fn();
    element.addEventListener('ok-card-move', moved);

    pointer(source, 'pointerdown', 10, 10);
    pointer(board(element), 'pointermove', 20, 120);
    pointer(board(element), 'pointerup', 20, 120);

    expect(moved).not.toHaveBeenCalled();
  });

  it('mantiene el arrastre con ratón desde cualquier punto de la tarjeta', async () => {
    const element = await mount();
    const source = card(element, 'a');
    const target = card(element, 'c');
    target.getBoundingClientRect = () =>
      ({
        top: 100,
        height: 80,
        bottom: 180,
        left: 0,
        right: 200,
        width: 200,
        x: 0,
        y: 100,
        toJSON: () => ({}),
      }) as DOMRect;
    hitTest(element, target);
    const moved = vi.fn();
    element.addEventListener('ok-card-move', moved);

    pointer(source, 'pointerdown', 10, 10, 'mouse');
    pointer(board(element), 'pointermove', 20, 120, 'mouse');
    pointer(board(element), 'pointerup', 20, 120, 'mouse');

    expect(moved).toHaveBeenCalledOnce();
  });
});
