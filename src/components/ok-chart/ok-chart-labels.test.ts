// @vitest-environment happy-dom
//
// Contract of the ok-chart labels (outfitkit#250, from hub#2392):
//   • in a bar chart every category label sits centred under ITS bar (same
//     geometry as the bar), never spread edge to edge like line points;
//   • no text is drawn inside the stretched SVG (preserveAspectRatio="none"
//     squashes it on a narrow card): axis, category and endpoint labels are
//     HTML laid over the canvas, so they keep their shape at any width;
//   • the value-axis labels sit on their gridline;
//   • when the labels do not fit their slot, the chart skips labels evenly and
//     keeps the LAST one (Recharts «preserveEnd» / Chart.js autoSkip).
import { afterEach, describe, expect, it, vi } from 'vitest';

import './ok-chart.js';
import { OkChart as OkChartClass, xLabelStep } from './ok-chart.js';
import type { OkChart } from './ok-chart.js';

const VB_WIDTH = 600;

async function chartWith(props: Partial<OkChart>): Promise<OkChart> {
  const el = document.createElement('ok-chart') as OkChart;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  await el.updateComplete;
  return el;
}

function xLabels(el: OkChart): HTMLElement[] {
  return [...el.shadowRoot!.querySelectorAll<HTMLElement>('.x-label')];
}

/** Horizontal position of a label in viewBox units (its `left` is a % of the canvas). */
function labelX(label: HTMLElement): number {
  const left = label.style.left;
  expect(left, 'a category label is placed with a percentage').toMatch(/%$/);
  return (parseFloat(left) / 100) * VB_WIDTH;
}

/** Centre of each bar rect, in viewBox units. */
function barCentres(el: OkChart): number[] {
  return [...el.shadowRoot!.querySelectorAll('svg rect')].map(
    (r) => Number(r.getAttribute('x')) + Number(r.getAttribute('width')) / 2,
  );
}

const WEEK = ['23 Sep', '24 Sep', '25 Sep', '26 Sep', '27 Sep', '28 Sep', '29 Sep'];
const SALES = [340, 0, 1500, 340, 0, 1500, 1840];

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('ok-chart — bar labels', () => {
  it('centres every category label under its own bar', async () => {
    const el = await chartWith({
      type: 'bar',
      labels: WEEK,
      axis: ['2,000 €', '1,000 €', '0 €'],
      series: [{ data: SALES }],
    });
    const labels = xLabels(el);
    const bars = barCentres(el);
    expect(labels).toHaveLength(7);
    expect(bars).toHaveLength(7);
    labels.forEach((label, i) => {
      expect(label.textContent!.trim()).toBe(WEEK[i]);
      expect(labelX(label), `label ${i} over bar ${i}`).toBeCloseTo(bars[i], 1);
      expect(label.dataset.anchor, `label ${i} is centred`).toBe('middle');
    });
  });

  it('centres the label on the whole group when there are several series', async () => {
    const el = await chartWith({
      type: 'bar',
      labels: ['Mon', 'Tue', 'Wed'],
      series: [{ data: [1, 2, 3] }, { data: [3, 2, 1] }],
    });
    const bars = barCentres(el); // group-major: g0s0, g0s1, g1s0, …
    xLabels(el).forEach((label, g) => {
      const groupCentre = (bars[g * 2] + bars[g * 2 + 1]) / 2;
      expect(labelX(label), `label ${g} over group ${g}`).toBeCloseTo(groupCentre, 1);
    });
  });

  it('gives a label without data its own slot instead of pushing it off the plot', async () => {
    const el = await chartWith({ type: 'bar', labels: ['a', 'b', 'c'], series: [{ data: [1, 2] }] });
    const bars = barCentres(el);
    const xs = xLabels(el).map(labelX);
    expect(xs[0]).toBeCloseTo(bars[0], 1);
    expect(xs[1]).toBeCloseTo(bars[1], 1);
    expect(xs[2]).toBeLessThan(588); // inside the plot, in the third slot
    expect(xs[2] - xs[1]).toBeCloseTo(xs[1] - xs[0], 1);
  });

  it('styles: a centred label is shifted by half its width, a skipped one keeps its box', () => {
    const css = OkChartClass.styles.toString().replace(/\s+/g, ' ');
    expect(css).toMatch(/\.x-label \{[^}]*transform: translateX\(-50%\)/);
    expect(css).toMatch(/\.x-label\[data-anchor='start'\] \{ transform: none; \}/);
    expect(css).toMatch(/\.x-label\[data-anchor='end'\] \{ transform: translateX\(-100%\); \}/);
    expect(css).toMatch(/\.x-label\.skipped \{ visibility: hidden; \}/);
    expect(css).toMatch(/\.y-label \{[^}]*transform: translateY\(calc\(var\(--y, 0px\) - 50%\)\)/);
  });
});

describe('ok-chart — text keeps its shape', () => {
  it('draws no text inside the stretched svg', async () => {
    const el = await chartWith({
      type: 'line',
      labels: ['a', 'b', 'c'],
      axis: ['100', '50', '0'],
      endpoint: true,
      endpointLabel: '42 %',
      series: [{ data: [10, 20, 42] }],
    });
    expect(el.shadowRoot!.querySelector('svg')!.getAttribute('preserveAspectRatio')).toBe('none');
    expect(el.shadowRoot!.querySelectorAll('svg text')).toHaveLength(0);
    expect(xLabels(el).map((l) => l.textContent!.trim())).toEqual(['a', 'b', 'c']);
    const ticks = [...el.shadowRoot!.querySelectorAll('.y-label')].map((l) => l.textContent!.trim());
    expect(ticks).toEqual(['100', '50', '0']);
    expect(el.shadowRoot!.querySelector('.value-label')!.textContent!.trim()).toBe('42 %');
  });

  it('puts each value-axis label on its gridline', async () => {
    const el = await chartWith({
      type: 'bar',
      labels: WEEK,
      axis: ['2,000 €', '1,500 €', '1,000 €', '500 €', '0 €'],
      series: [{ data: SALES }],
    });
    const gridY = [...el.shadowRoot!.querySelectorAll('.grid line')].map((l) =>
      Number(l.getAttribute('y1')),
    );
    const ticks = [...el.shadowRoot!.querySelectorAll<HTMLElement>('.y-label')];
    expect(ticks).toHaveLength(5);
    ticks.forEach((t, i) => {
      // The svg is 1:1 vertically (viewBox height == css height), so units == px.
      expect(Number(t.style.getPropertyValue('--y').replace('px', '')), `tick ${i}`).toBeCloseTo(
        gridY[i],
        1,
      );
    });
  });

  it('keeps the line labels at the ends of the line (first starts, last ends)', async () => {
    const el = await chartWith({ type: 'line', labels: ['a', 'b', 'c'], series: [{ data: [1, 2, 3] }] });
    const labels = xLabels(el);
    expect(labels.map((l) => l.dataset.anchor)).toEqual(['start', 'middle', 'end']);
    expect(labelX(labels[0])).toBeCloseTo(12, 1);
    expect(labelX(labels[1])).toBeCloseTo(300, 1);
    expect(labelX(labels[2])).toBeCloseTo(588, 1);
  });
});

describe('ok-chart — labels that do not fit are skipped evenly', () => {
  it('computes the smallest step that leaves room for the widest label', () => {
    expect(xLabelStep(7, 120, 42, 8)).toBe(1);
    expect(xLabelStep(7, 50, 42, 8)).toBe(1);
    expect(xLabelStep(7, 49.9, 42, 8)).toBe(2);
    expect(xLabelStep(7, 20, 42, 8)).toBe(3);
    expect(xLabelStep(7, 1, 42, 8)).toBe(7);
    expect(xLabelStep(1, 1, 42, 8)).toBe(1);
    expect(xLabelStep(7, 0, 42, 8)).toBe(1); // not laid out yet: show everything
  });

  /** Fakes the layout: the label row is `rowWidth` px and every label `labelWidth` px. */
  function fakeLayout(rowWidth: number, labelWidth: number) {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      const width = this.classList.contains('x-axis')
        ? rowWidth
        : this.classList.contains('x-label')
          ? labelWidth
          : 0;
      return { width, height: 12, x: 0, y: 0, top: 0, left: 0, right: width, bottom: 12 } as DOMRect;
    });
  }

  const visible = (el: OkChart) =>
    xLabels(el)
      .filter((l) => !l.classList.contains('skipped'))
      .map((l) => l.textContent!.trim());

  it('shows every label when they fit (tablet / desktop card)', async () => {
    fakeLayout(700, 42);
    const el = await chartWith({ type: 'bar', labels: WEEK, series: [{ data: SALES }] });
    expect(visible(el)).toEqual(WEEK);
  });

  it('skips every other label on a phone card and keeps the last day', async () => {
    // 300 px row, 7 bars on a 576/600 plot → ~41 px per bar < 42 px label + 8 px gap.
    fakeLayout(300, 42);
    const el = await chartWith({ type: 'bar', labels: WEEK, series: [{ data: SALES }] });
    expect(visible(el)).toEqual(['23 Sep', '25 Sep', '27 Sep', '29 Sep']);
  });

  it('keeps the LAST label when the count is even', async () => {
    fakeLayout(300, 42);
    const days = WEEK.slice(1);
    const el = await chartWith({ type: 'bar', labels: days, series: [{ data: SALES.slice(1) }] });
    // 6 bars on 300 px → 48 px per bar < 50 px: every other label, ending on today.
    expect(visible(el)).toEqual(['25 Sep', '27 Sep', '29 Sep']);
  });

  it('leaves a gap between labels and measures the BAR slot, not the line spacing', async () => {
    // 38 px labels: they would touch in a 41 px bar slot (38 + 8 > 41) → skip.
    // (Without the gap, or measuring the 48 px line spacing, all 7 would show.)
    fakeLayout(300, 38);
    const el = await chartWith({ type: 'bar', labels: WEEK, series: [{ data: SALES }] });
    expect(visible(el)).toHaveLength(4);
  });

  it('re-fits the labels when the card is resized', async () => {
    let onResize: () => void = () => {};
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(cb: () => void) {
          onResize = cb;
        }
        observe() {}
        disconnect() {}
      },
    );
    fakeLayout(700, 42);
    const el = await chartWith({ type: 'bar', labels: WEEK, series: [{ data: SALES }] });
    expect(visible(el)).toHaveLength(7);
    fakeLayout(300, 42);
    onResize();
    await el.updateComplete;
    expect(visible(el)).toHaveLength(4);
    vi.unstubAllGlobals();
  });

  it('shows the labels again when the card grows', async () => {
    fakeLayout(300, 42);
    const el = await chartWith({ type: 'bar', labels: WEEK, series: [{ data: SALES }] });
    expect(visible(el)).toHaveLength(4);
    fakeLayout(700, 42);
    el.requestUpdate();
    await el.updateComplete;
    await el.updateComplete;
    expect(visible(el)).toEqual(WEEK);
  });
});
