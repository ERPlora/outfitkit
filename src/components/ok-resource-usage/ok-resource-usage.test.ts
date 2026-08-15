// @vitest-environment happy-dom
//
// Contract of ok-resource-usage — a DUMB 0-100% resource panel shared by the Hub
// (Vue) and the Cloud (Django): everything arrives precomputed by the server and
// the component only paints. The hard rules fixed here:
//   - colors ALWAYS derive from the received `status`, never recomputed from `current`;
//   - `known === false` renders an unreadable state — NEVER a green zero (ADR-0237);
//   - the displayed value clamps at 100 while the tooltip keeps the real value;
//   - the upgrade CTA renders only when `upgrade.show` is true.
import { afterEach, describe, expect, it, vi } from 'vitest';

// `icons.js` pulls in the `~icons/…?raw` chain that the test transform denies; mock it
// (the baked icons are irrelevant for the behavioural contract fixed here).
vi.mock('../../base/icons.js', () => ({
  iconAlertCircleOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import './ok-resource-usage.js';
import type { OkResourceMetric, OkResourceUsage } from './ok-resource-usage.js';
import type { OkChart } from '../ok-chart/ok-chart.js';
import type { OkGauge } from '../ok-gauge/ok-gauge.js';

function baseMetric(over: Partial<OkResourceMetric> = {}): OkResourceMetric {
  return {
    known: true,
    current: 42,
    points: [
      [1755200000, 40],
      [1755203600, 42],
    ],
    status: 'ok',
    message: null,
    ...over,
  };
}

async function usage(props: Partial<OkResourceUsage> = {}): Promise<OkResourceUsage> {
  const el = document.createElement('ok-resource-usage') as OkResourceUsage;
  el.metric = baseMetric();
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

function gauge(el: OkResourceUsage): OkGauge | null {
  return el.shadowRoot!.querySelector('ok-gauge');
}
function chart(el: OkResourceUsage): OkChart | null {
  return el.shadowRoot!.querySelector('ok-chart');
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ok-resource-usage', () => {
  it('renders gauge and chart from metric prop', async () => {
    const el = await usage();

    const g = gauge(el);
    expect(g, 'renders an ok-gauge for the current value').not.toBeNull();
    expect(g!.type).toBe('ring');
    expect(g!.value).toBe(42);

    const c = chart(el);
    expect(c, 'renders an ok-chart with the history').not.toBeNull();
    expect(c!.type).toBe('area');
    expect(c!.min).toBe(0);
    expect(c!.max).toBe(100);
    expect(c!.series[0].data).toEqual([40, 42]);
  });

  it('applies warning color at 70 and critical above 80 via provided status', async () => {
    const warn = await usage({ metric: baseMetric({ current: 70, status: 'warning' }) });
    expect(gauge(warn)!.color).toContain('--ion-color-warning');
    expect(warn.shadowRoot!.querySelector('.status--warning')).not.toBeNull();

    const crit = await usage({ metric: baseMetric({ current: 85, status: 'critical' }) });
    expect(gauge(crit)!.color).toContain('--ion-color-danger');
    expect(crit.shadowRoot!.querySelector('.status--critical')).not.toBeNull();
  });

  it('renders unreadable state when known is false (never zero-green)', async () => {
    const el = await usage({
      metric: baseMetric({ known: false, current: null, points: [], status: 'unknown' }),
    });

    expect(gauge(el), 'no gauge: a zero would read as healthy').toBeNull();
    expect(chart(el), 'no chart flat at zero').toBeNull();

    const box = el.shadowRoot!.querySelector('.unreadable');
    expect(box, 'renders the not-measured state').not.toBeNull();
    expect(box!.textContent).toContain('Could not read it'); // English default

    el.unreadableLabel = 'No se ha podido leer';
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('.unreadable')!.textContent).toContain(
      'No se ha podido leer',
    );
  });

  it('shows CTA only when upgrade.show', async () => {
    const without = await usage();
    expect(without.shadowRoot!.querySelector('a.upgrade')).toBeNull();

    const hidden = await usage({ upgrade: { show: false, message: 'Upgrade', url: '/plans' } });
    expect(hidden.shadowRoot!.querySelector('a.upgrade')).toBeNull();

    const shown = await usage({
      upgrade: { show: true, message: 'Upgrade your plan', url: 'https://erplora.com/plans' },
    });
    const cta = shown.shadowRoot!.querySelector('a.upgrade');
    expect(cta).not.toBeNull();
    expect(cta!.getAttribute('href')).toBe('https://erplora.com/plans');
    expect(cta!.textContent).toContain('Upgrade your plan');
  });

  it('clamps displayed percentage at 100 keeping real value in tooltip', async () => {
    const el = await usage({ metric: baseMetric({ current: 137, status: 'critical' }) });

    expect(gauge(el)!.value).toBe(100); // visual clamp

    const tooltip = el.shadowRoot!.querySelector('[title]');
    expect(tooltip, 'the real value survives in the tooltip').not.toBeNull();
    expect(tooltip!.getAttribute('title')).toContain('137');
  });
});
