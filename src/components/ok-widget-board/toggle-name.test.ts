// @vitest-environment happy-dom

// outfitkit#180 (from hub#2075) — in «Customize panel» every widget row carries an `ion-toggle`,
// but it was created with no text and no `aria-label`, so the `switch` Ionic renders inside had no
// accessible name: a screen reader announced «switch, on» without saying which widget, and
// `getByRole('switch', { name: 'Set up your business' })` found nothing. Measured on
// ghcr.io/erplora/hub:stable (outfitkit 0.1.73): `listitem → heading "…" · switch [checked]`.
//
// Contract: each toggle is named after its widget title — the text the row already shows, so it
// is translated by whoever passes the catalogue — in both lists (active and available), and the
// name follows the row when the widget moves from one list to the other.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconEllipsisVertical: '<svg></svg>',
}));

import './ok-widget-board.js';
import type { OkWidgetBoard, WidgetDef } from './ok-widget-board.js';

const widget = (id: string, title: string): WidgetDef => ({ id, title, render: () => undefined });

let board: OkWidgetBoard;

function modal(): HTMLElement {
  const m = document.body.querySelector('ion-modal');
  if (!m) throw new Error('customize modal was not built');
  return m as HTMLElement;
}

function toggleNames(): Array<string | null> {
  return Array.from(modal().querySelectorAll('ion-toggle')).map((t) => t.getAttribute('aria-label'));
}

beforeEach(async () => {
  board = document.createElement('ok-widget-board') as OkWidgetBoard;
  board.editable = true;
  board.widgets = [widget('setup', 'Set up your business'), widget('sales', 'Sales today')];
  board.value = ['setup'];
  document.body.appendChild(board);
  await board.updateComplete;
  (board.shadowRoot!.querySelector('ion-button') as HTMLElement).click();
});

afterEach(() => {
  board.remove();
  document.body.replaceChildren();
});

describe('ok-widget-board — customize toggles have an accessible name', () => {
  it('names the toggle of every widget, active and available, after its title', () => {
    expect(toggleNames()).toEqual(['Set up your business', 'Sales today']);
  });

  it('keeps the name when a widget moves between the lists', () => {
    const available = modal().querySelectorAll('ion-toggle')[1];
    available.dispatchEvent(new CustomEvent('ionChange'));
    expect(board.value).toEqual(['setup', 'sales']);
    expect(toggleNames()).toEqual(['Set up your business', 'Sales today']);
  });
});
