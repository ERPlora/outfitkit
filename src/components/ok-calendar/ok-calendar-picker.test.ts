// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; the navigation
// chevrons are irrelevant to the picker contract fixed here.
vi.mock('../../base/icons.js', () => ({
  iconChevronBackOutline: '<svg></svg>',
  iconChevronForwardOutline: '<svg></svg>',
}));

import './ok-calendar';
import { OkCalendar, localeFirstDayOfWeek } from './ok-calendar';

// outfitkit#198 — picking a date showed a full event calendar (~615 px tall), a Month/Agenda
// toggle whose Agenda view is useless for picking, a week that always started on Monday (also in
// en-US) and days that were `<div @click>`: unreachable with the keyboard.

async function mount(attrs: Record<string, string> = {}, props: Partial<OkCalendar> = {}): Promise<OkCalendar> {
  const el = document.createElement('ok-calendar') as OkCalendar;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const root = (el: OkCalendar) => el.shadowRoot as ShadowRoot;
const weekdays = (el: OkCalendar) => [...root(el).querySelectorAll('.weekday')].map((w) => w.textContent?.trim());
const dayButtons = (el: OkCalendar) => [...root(el).querySelectorAll<HTMLButtonElement>('button[data-date]')];
const dayButton = (el: OkCalendar, date: string) =>
  root(el).querySelector<HTMLButtonElement>(`button[data-date="${date}"]`);
const title = (el: OkCalendar) => root(el).querySelector('.title')?.textContent?.trim();

async function press(el: OkCalendar, from: string, key: string): Promise<void> {
  const btn = dayButton(el, from);
  expect(btn, `no day button for ${from}`).toBeTruthy();
  const ev = new KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true });
  btn!.dispatchEvent(ev);
  // A handled key must not also scroll the page (arrows / PageUp / Home…).
  expect(ev.defaultPrevented, `${key} was not prevented`).toBe(true);
  await el.updateComplete;
  await el.updateComplete;
}

const focusedDate = (el: OkCalendar) => (root(el).activeElement as HTMLElement | null)?.dataset.date;

// Replaces `Intl.Locale#getWeekInfo` / `#weekInfo` whether or not this engine defines them;
// `afterEach` puts the original descriptors back (or deletes what was not there).
const LOCALE_PROTO = Intl.Locale.prototype as unknown as Record<string, unknown>;
const saved: Array<[string, PropertyDescriptor | undefined]> = [];
function stubWeekInfo(opts: { method: { firstDay: number } | undefined; getter: { firstDay: number } | undefined }): void {
  for (const name of ['getWeekInfo', 'weekInfo']) saved.push([name, Object.getOwnPropertyDescriptor(LOCALE_PROTO, name)]);
  Object.defineProperty(LOCALE_PROTO, 'getWeekInfo', {
    configurable: true,
    writable: true,
    value: opts.method ? () => opts.method : undefined,
  });
  Object.defineProperty(LOCALE_PROTO, 'weekInfo', { configurable: true, get: () => opts.getter });
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  for (const [name, desc] of saved.splice(0)) {
    if (desc) Object.defineProperty(LOCALE_PROTO, name, desc);
    else delete LOCALE_PROTO[name];
  }
});

describe('ok-calendar — first day of the week follows the locale (outfitkit#198)', () => {
  it('en-US starts the week on Sunday, also in the grid cells', async () => {
    const el = await mount({ locale: 'en-US', picker: '' }, { value: '2026-10-15' });
    expect(weekdays(el)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    // October 2026 begins on a Thursday → the first cell is Sunday 27 September.
    expect(dayButtons(el)[0].dataset.date).toBe('2026-09-27');
  });

  it('es starts the week on Monday', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    expect(weekdays(el)[0]).toBe('lun');
    expect(dayButtons(el)[0].dataset.date).toBe('2026-09-28');
  });

  it('the full event calendar follows the locale too (not only the picker)', async () => {
    const el = await mount({ locale: 'en-US' }, { value: '2026-10-15' });
    expect(weekdays(el)[0]).toBe('Sun');
  });

  it('first-day-of-week overrides the locale (0 = Sunday … 6 = Saturday)', async () => {
    const el = await mount({ locale: 'es', picker: '', 'first-day-of-week': '0' }, { value: '2026-10-15' });
    expect(weekdays(el)[0]).toBe('dom');
    expect(dayButtons(el)[0].dataset.date).toBe('2026-09-27');
    el.firstDayOfWeek = 6;
    await el.updateComplete;
    expect(weekdays(el)[0]).toBe('sáb');
    expect(dayButtons(el)[0].dataset.date).toBe('2026-09-26');
  });

  it('an out-of-range first-day-of-week is ignored and the locale decides', async () => {
    const el = await mount({ locale: 'es', picker: '', 'first-day-of-week': '9' }, { value: '2026-10-15' });
    expect(weekdays(el)[0]).toBe('lun');
  });

  it('an engine with only the legacy weekInfo getter (Node 20, older Safari) uses it', async () => {
    // en-US starts on Sunday everywhere else (method, table): a getter answering Saturday proves the
    // getter wins over the table and is read at all.
    stubWeekInfo({ method: undefined, getter: { firstDay: 6 } });
    const el = await mount({ locale: 'en-US', picker: '' }, { value: '2026-10-15' });
    expect(dayButtons(el)[0].dataset.date).toBe('2026-09-26'); // a Saturday
  });

  it('without Intl week info (older engines) the region table still gives Sunday / Saturday', async () => {
    // Engines differ: Node 24 ships `getWeekInfo()` AND the legacy `weekInfo` getter, Node 20 (CI)
    // only the getter. Replace whatever exists — and define what does not — so neither answers.
    stubWeekInfo({ method: undefined, getter: undefined });
    const probe = new Intl.Locale('en-US') as unknown as { getWeekInfo?: () => unknown; weekInfo?: unknown };
    expect(probe.getWeekInfo?.() ?? probe.weekInfo).toBeUndefined();
    const us = await mount({ locale: 'en-US', picker: '' }, { value: '2026-10-15' });
    expect(weekdays(us)[0]).toBe('Sun');
    const eg = await mount({ locale: 'ar-EG', picker: '' }, { value: '2026-10-15' });
    expect(dayButtons(eg)[0].dataset.date).toBe('2026-09-26'); // a Saturday
    const es = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    expect(weekdays(es)[0]).toBe('lun');
    // Maldives (CLDR firstDay = fri) is the only Friday region.
    expect(localeFirstDayOfWeek('dv-MV')).toBe(5);
  });
});

describe('ok-calendar picker — compact, no Month/Agenda toggle (outfitkit#198)', () => {
  it('hides the toggle, the event chips and never renders the agenda', async () => {
    const el = await mount(
      { locale: 'es', picker: '' },
      { value: '2026-10-15', view: 'agenda', events: [{ id: 'e1', date: '2026-10-15', title: 'Corte' }] },
    );
    expect(root(el).querySelector('.toggle')).toBeNull();
    expect(root(el).querySelector('.agenda, .agenda-empty')).toBeNull();
    expect(root(el).querySelector('.chip')).toBeNull();
    expect(dayButtons(el)).toHaveLength(42);
  });

  it('the full calendar keeps its toggle (non-picker mode unchanged)', async () => {
    const el = await mount({ locale: 'es' }, { value: '2026-10-15' });
    expect(root(el).querySelector('.toggle')).toBeTruthy();
  });

  it('reflects the picker attribute so the compact styles apply when set as a property', async () => {
    const el = await mount({ locale: 'es' }, { picker: true, value: '2026-10-15' });
    expect(el.hasAttribute('picker')).toBe(true);
  });

  it('the focus ring of an edge column is not clipped by the grid', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    // The event grid clips its rounded border (overflow: hidden); the picker draws a 2 px focus
    // outline OUTSIDE the day, which that clip cut in half on Monday / Sunday (seen in the bench).
    expect(getComputedStyle(root(el).querySelector('.grid')!).overflow).toBe('visible');
  });

  it('is compact: capped width and 44 px day cells, not the 5.5 rem event cells', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    expect(getComputedStyle(el).maxWidth).toBe('320px'); // 20rem (happy-dom resolves rem to px)
    const day = dayButton(el, '2026-10-15')!;
    expect(getComputedStyle(day).height).toBe('44px'); // 2.75rem
    expect(getComputedStyle(day).minHeight).not.toBe('88px'); // 5.5rem, the event cell
  });

  it('the picked day is filled, days of other months are dimmed', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    const picked = getComputedStyle(dayButton(el, '2026-10-15')!);
    const other = getComputedStyle(dayButton(el, '2026-10-16')!);
    expect(picked.backgroundColor).not.toBe(other.backgroundColor);
    expect(picked.backgroundColor).not.toBe('none');
    expect(dayButton(el, '2026-09-28')!.classList.contains('other-month')).toBe(true);
    expect(getComputedStyle(dayButton(el, '2026-09-28')!).opacity).toBe('0.4');
    expect(getComputedStyle(dayButton(el, '2026-10-16')!).opacity).not.toBe('0.4');
  });

  it('today is ringed and announced as the current date', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 9, 20, 12));
    try {
      const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
      const today = dayButton(el, '2026-10-20')!;
      expect(today.getAttribute('aria-current')).toBe('date');
      expect(dayButton(el, '2026-10-21')!.hasAttribute('aria-current')).toBe(false);
      expect(getComputedStyle(today).boxShadow).toContain('inset');
      expect(getComputedStyle(dayButton(el, '2026-10-21')!).boxShadow).not.toContain('inset');
    } finally {
      vi.useRealTimers();
    }
  });

  it('the keyboard focus is visible: a solid outline on :focus-visible', () => {
    // happy-dom does not match :focus-visible, so the rule is read from the component styles.
    const css = (OkCalendar.styles as { cssText: string }).cssText.replace(/\s+/g, ' ');
    expect(css).toMatch(/\.pday:focus-visible \{ outline: 2px solid [^;]+; outline-offset: 1px; \}/);
  });
});

describe('ok-calendar picker — days are real buttons, selectable and keyboard-navigable (outfitkit#198)', () => {
  it('each day is a button with a full-date label; the selected one is aria-pressed', async () => {
    const el = await mount({ locale: 'en-US', picker: '' }, { value: '2026-10-15' });
    const sel = dayButton(el, '2026-10-15')!;
    expect(sel.tagName).toBe('BUTTON');
    expect(sel.type).toBe('button');
    expect(sel.getAttribute('aria-pressed')).toBe('true');
    expect(sel.getAttribute('aria-label')).toBe('Thursday, October 15, 2026');
    expect(dayButton(el, '2026-10-16')!.getAttribute('aria-pressed')).toBe('false');
  });

  it('one single tab stop: the selected day', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    const tabbable = dayButtons(el).filter((b) => b.tabIndex === 0);
    expect(tabbable.map((b) => b.dataset.date)).toEqual(['2026-10-15']);
    expect(dayButtons(el).filter((b) => b.tabIndex === -1)).toHaveLength(41);
  });

  it('with no selection in the visible month, the tab stop is the 1st of the month', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2020-01-10' });
    root(el).querySelectorAll('ion-button')[1].dispatchEvent(new Event('click'));
    await el.updateComplete;
    expect(dayButtons(el).filter((b) => b.tabIndex === 0).map((b) => b.dataset.date)).toEqual(['2020-02-01']);
  });

  it('clicking a day selects it and emits ok-date-select', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    const got: string[] = [];
    el.addEventListener('ok-date-select', (e) => got.push((e as CustomEvent<{ date: string }>).detail.date));
    dayButton(el, '2026-10-20')!.click();
    await el.updateComplete;
    expect(got).toEqual(['2026-10-20']);
    expect(el.value).toBe('2026-10-20');
    expect(dayButton(el, '2026-10-20')!.getAttribute('aria-pressed')).toBe('true');
    expect(dayButton(el, '2026-10-20')!.tabIndex).toBe(0);
  });

  it('after moving with the keyboard, clicking another day moves the tab stop to it', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    await press(el, '2026-10-15', 'ArrowRight');
    dayButton(el, '2026-10-20')!.click();
    await el.updateComplete;
    expect(dayButtons(el).filter((b) => b.tabIndex === 0).map((b) => b.dataset.date)).toEqual(['2026-10-20']);
  });

  it('arrow keys move the focus by a day and by a week', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    await press(el, '2026-10-15', 'ArrowRight');
    expect(focusedDate(el)).toBe('2026-10-16');
    expect(dayButton(el, '2026-10-16')!.tabIndex).toBe(0);
    await press(el, '2026-10-16', 'ArrowDown');
    expect(focusedDate(el)).toBe('2026-10-23');
    await press(el, '2026-10-23', 'ArrowLeft');
    expect(focusedDate(el)).toBe('2026-10-22');
    await press(el, '2026-10-22', 'ArrowUp');
    expect(focusedDate(el)).toBe('2026-10-15');
    // Moving the focus does not pick: the value only changes on Enter / Space / click.
    expect(el.value).toBe('2026-10-15');
  });

  it('Home / End go to the start / end of the week of the locale', async () => {
    const es = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    await press(es, '2026-10-15', 'Home');
    expect(focusedDate(es)).toBe('2026-10-12'); // Monday
    await press(es, '2026-10-12', 'End');
    expect(focusedDate(es)).toBe('2026-10-18'); // Sunday
    const us = await mount({ locale: 'en-US', picker: '' }, { value: '2026-10-15' });
    await press(us, '2026-10-15', 'Home');
    expect(focusedDate(us)).toBe('2026-10-11'); // Sunday
    await press(us, '2026-10-11', 'End');
    expect(focusedDate(us)).toBe('2026-10-17'); // Saturday
  });

  it('PageUp / PageDown change month keeping the day (clamped) and emit ok-nav', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-03-31' });
    const nav: Array<{ year: number; month: number }> = [];
    el.addEventListener('ok-nav', (e) => nav.push((e as CustomEvent<{ year: number; month: number }>).detail));
    await press(el, '2026-03-31', 'PageUp');
    expect(focusedDate(el)).toBe('2026-02-28');
    expect(title(el)).toBe('Febrero de 2026');
    await press(el, '2026-02-28', 'PageDown');
    expect(focusedDate(el)).toBe('2026-03-28');
    expect(nav).toEqual([{ year: 2026, month: 2 }, { year: 2026, month: 3 }]);
  });

  it('crossing the month edge with an arrow shows the next month', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-31' });
    await press(el, '2026-10-31', 'ArrowRight');
    expect(title(el)).toBe('Noviembre de 2026');
    expect(focusedDate(el)).toBe('2026-11-01');
  });

  it('changing month does not recycle the picked day button for another date', async () => {
    // Reusing the node made the day in the same grid cell of the new month flash as picked while
    // the 150 ms background/colour transition faded out (seen in the bench: 12 Sep → 10 Oct).
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-09-12' });
    const picked = dayButton(el, '2026-09-12')!;
    await press(el, '2026-09-12', 'PageDown');
    expect(!picked.isConnected || picked.dataset.date === '2026-09-12').toBe(true);
  });

  it('other keys are left alone (Tab still leaves the grid)', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    const ev = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, composed: true, cancelable: true });
    dayButton(el, '2026-10-15')!.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(false);
  });
});

describe('ok-calendar — month title is sentence case (outfitkit#198 comment)', () => {
  it('Spanish: «Octubre de 2026», not «Octubre De 2026»', async () => {
    const el = await mount({ locale: 'es', picker: '' }, { value: '2026-10-15' });
    expect(title(el)).toBe('Octubre de 2026');
    // The CSS must not re-capitalise every word on top of it.
    expect(getComputedStyle(root(el).querySelector('.title')!).textTransform).not.toBe('capitalize');
  });

  it('agenda day headers are sentence case too', async () => {
    const el = await mount(
      { locale: 'es', view: 'agenda' },
      { events: [{ id: 'e1', date: '2099-10-15', title: 'Corte' }] },
    );
    const header = root(el).querySelector('.agenda-date')!;
    expect(header.textContent?.trim()).toBe('Jueves, 15 de octubre');
    expect(getComputedStyle(header).textTransform).not.toBe('capitalize');
  });
});
