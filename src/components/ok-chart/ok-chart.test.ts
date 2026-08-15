// @vitest-environment happy-dom
//
// Contract of the ok-chart value axis: by default the chart autoscales to the
// min/max of the data (existing behaviour, kept EXACTLY as is), but the consumer
// can pin the axis with explicit `min`/`max` props — a flat series at 3% must sit
// near the floor of a 0..100 canvas instead of filling it.
import { afterEach, describe, expect, it } from 'vitest';

import './ok-chart.js';
import type { OkChart } from './ok-chart.js';

// Canvas geometry with no axis/labels/endpoint (defaults): viewBox 600x200,
// pad 12 on every side → plot area x:[12..588], y:[12..188].
const PAD = 12;
const PLOT_H = 200 - PAD * 2; // 176
const X0 = 12;
const X1 = 588;

async function chartWith(props: Partial<OkChart>): Promise<OkChart> {
  const el = document.createElement('ok-chart') as OkChart;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Parses the first stroked line path ("M12,144 L588,56") into [x,y] pairs. */
function linePoints(el: OkChart): Array<[number, number]> {
  const path = el.shadowRoot!.querySelector('path[fill="none"]');
  expect(path, 'the chart renders a line path').not.toBeNull();
  return path!
    .getAttribute('d')!
    .replace(/[ML]/g, '')
    .trim()
    .split(/\s+/)
    .map((pt) => pt.split(',').map(Number) as [number, number]);
}

/** y coordinate of `value` on a min..max axis in the default plot area. */
function yFor(value: number, min: number, max: number): number {
  return PAD + (1 - (value - min) / (max - min)) * PLOT_H;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('ok-chart — explicit min/max axis', () => {
  it('respects explicit min/max props', async () => {
    const el = await chartWith({ series: [{ data: [25, 75] }], min: 0, max: 100 });
    const pts = linePoints(el);
    expect(pts).toHaveLength(2);
    expect(pts[0][0]).toBeCloseTo(X0);
    expect(pts[1][0]).toBeCloseTo(X1);
    expect(pts[0][1]).toBeCloseTo(yFor(25, 0, 100)); // 144, not the autoscaled floor
    expect(pts[1][1]).toBeCloseTo(yFor(75, 0, 100)); // 56, not the autoscaled ceiling
  });

  it('falls back to data autoscale when min/max absent', async () => {
    const el = await chartWith({ series: [{ data: [25, 75] }] });
    const pts = linePoints(el);
    // Existing behaviour: the data spans the full plot height (25 → floor, 75 → ceiling).
    expect(pts[0][1]).toBeCloseTo(PAD + PLOT_H); // 188
    expect(pts[1][1]).toBeCloseTo(PAD); // 12
  });

  it('keeps a flat low series near the floor when the axis is pinned', async () => {
    const el = await chartWith({ series: [{ data: [3, 3] }], min: 0, max: 100 });
    const pts = linePoints(el);
    for (const [, y] of pts) expect(y).toBeCloseTo(yFor(3, 0, 100)); // ~182.7, near the floor
  });
});
