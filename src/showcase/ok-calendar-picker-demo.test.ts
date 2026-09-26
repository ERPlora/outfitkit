// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
}));

import '../components/ok-calendar/ok-calendar';
import type { OkCalendar } from '../components/ok-calendar/ok-calendar';
// @ts-expect-error El catálogo del showcase es JavaScript deliberadamente simple.
import { COMPONENTS } from '../../showcase/components-data.js';

// outfitkit#198 — the showcase must SHOW the date picker: compact, without the Month/Agenda
// toggle, with the week of each language (English/US on Sunday, Spanish on Monday).

type Comp = { id: string; example: string; setup?: (root: HTMLElement, ctx: unknown) => void; code: string; api: Array<{ name: string }> };
const calendar = (COMPONENTS as Comp[]).find((c) => c.id === 'ok-calendar')!;

async function mountDemo(): Promise<HTMLElement> {
  const frame = document.createElement('div');
  frame.innerHTML = calendar.example;
  document.body.appendChild(frame);
  calendar.setup?.(frame, { h: () => '' });
  await Promise.all([...frame.querySelectorAll<OkCalendar>('ok-calendar')].map((c) => c.updateComplete));
  return frame;
}

const firstWeekday = (el: OkCalendar) => el.shadowRoot!.querySelector('.weekday')?.textContent?.trim();

afterEach(() => {
  document.body.innerHTML = '';
});

describe('showcase ok-calendar — date picker demo (outfitkit#198)', () => {
  it('keeps the event calendar and adds an English and a Spanish picker', async () => {
    const frame = await mountDemo();
    const full = frame.querySelector<OkCalendar>('#cal')!;
    expect(full.picker).toBe(false);
    const en = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-en"]')!;
    const es = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-es"]')!;
    expect(en.picker).toBe(true);
    expect(es.picker).toBe(true);
    expect(en.locale).toBe('en-US');
    expect(es.locale).toBe('es');
    expect(en.shadowRoot!.querySelector('.toggle')).toBeNull();
    expect(es.shadowRoot!.querySelector('.toggle')).toBeNull();
  });

  it('each picker shows the week of its language and a preselected day', async () => {
    const frame = await mountDemo();
    const en = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-en"]')!;
    const es = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-es"]')!;
    expect(firstWeekday(en)).toBe('Sun');
    expect(firstWeekday(es)).toBe('lun');
    expect(en.value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(en.shadowRoot!.querySelector('button[aria-pressed="true"]')?.getAttribute('data-date')).toBe(en.value);
  });

  it('the Spanish picker speaks Spanish (navigation labels)', async () => {
    const frame = await mountDemo();
    const es = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-es"]')!;
    const navs = [...es.shadowRoot!.querySelectorAll('ion-button')].map((b) => b.getAttribute('aria-label'));
    expect(navs).toEqual(['Mes anterior', 'Mes siguiente']);
  });

  it('the picked date is shown next to each picker', async () => {
    const frame = await mountDemo();
    const es = frame.querySelector<OkCalendar>('[data-testid="calendar-picker-es"]')!;
    const out = frame.querySelector('[data-testid="calendar-picker-es-value"]')!;
    const day = es.shadowRoot!.querySelectorAll<HTMLButtonElement>('button[data-date]')[20];
    day.click();
    expect(out.textContent).toContain(day.dataset.date);
  });

  it('documents the picker API', () => {
    const names = calendar.api.map((a) => a.name).join(' ');
    expect(names).toContain('picker');
    expect(names).toContain('first-day-of-week');
    expect(calendar.code).toContain('picker');
  });
});
