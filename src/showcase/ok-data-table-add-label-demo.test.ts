// @vitest-environment happy-dom
import { html } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('../base/icons.js', () => ({
  iconCalendarOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconChevronForward: '<svg></svg>',
  iconChevronUpOutline: '<svg></svg>',
  iconClose: '<svg></svg>',
  iconEllipsisVertical: '<svg></svg>',
  iconFileTrayOutline: '<svg></svg>',
  iconSwapVerticalOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import '../components/ok-data-table/ok-data-table.js';
// @ts-expect-error The showcase catalog is deliberately plain JavaScript.
import { COMPONENTS } from '../../showcase/components-data.js';

// outfitkit#216 — module authors copy the showcase. A create button that only ever says «Añadir»
// there teaches them nothing, and a screen with two tables ends up with two identical «Añadir».
// The showcase must SHOW (live demo), TEACH (code) and DOCUMENT (API, and therefore the generated
// catalog) that `labels.add` names the create button of each table.

type Comp = {
  id: string;
  example: string;
  setup?: (root: HTMLElement, ctx: unknown) => void;
  code: string;
  api: Array<{ kind: string; name: string; detail: string }>;
};
type Table = HTMLElement & { labels: Record<string, string>; updateComplete: Promise<unknown> };

const dataTable = (COMPONENTS as Comp[]).find((c) => c.id === 'ok-data-table')!;

afterEach(() => {
  document.body.innerHTML = '';
});

describe('showcase ok-data-table — the create button says what it adds (outfitkit#216)', () => {
  it('the live demo names its create button after what it creates, not the bare default', async () => {
    document.documentElement.lang = 'es';
    (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
      media: q, matches: false, onchange: null,
      addListener: () => {}, removeListener: () => {},
      addEventListener: () => {}, removeEventListener: () => {},
      dispatchEvent: () => false,
    });
    const frame = document.createElement('div');
    frame.innerHTML = dataTable.example;
    document.body.appendChild(frame);
    dataTable.setup?.(frame, { h: html });
    const table = frame.querySelector('#dt') as Table;
    await table.updateComplete;

    const add = table.shadowRoot?.querySelector('.bar-main .add-btn')?.textContent?.trim();
    expect(add, 'the demo still paints the anonymous default').not.toBe('Añadir');
    expect(add).toBe(table.labels.add);
  });

  it('the code sample shows how to name it', () => {
    expect(dataTable.code).toMatch(/dt\.labels = \{ add: '[^']+' \}/);
  });

  it('the API lists `.labels` and says `add` renames the create button per table', () => {
    const labels = dataTable.api.find((a) => a.kind === 'prop' && a.name === '.labels');
    expect(labels, 'the data-table API does not document `.labels`').toBeTruthy();
    expect(labels!.detail).toMatch(/\badd\b/);
  });
});
