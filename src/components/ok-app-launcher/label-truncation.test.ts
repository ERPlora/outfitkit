// @vitest-environment happy-dom
//
// outfitkit#104 (from ERPlora/hub#1106) — with the 25 modules installed, the launcher cut 6 of the
// 25 names with an ellipsis and NO tooltip, so there was no way to tell which was which:
// «Reservas o…» sat next to «Reservas» — two different apps (the restaurant table booking and the
// online booking) told apart by three clipped letters.
//
// Cause: `.label` was a single line — `white-space: nowrap` + `overflow: hidden` +
// `text-overflow: ellipsis` — and the tile carried no `title`/`aria-label`.
//
// What the market does (Google Workspace app launcher, Odoo Apps, macOS Launchpad): the name
// WRAPS to two lines, and only what still does not fit is truncated, always with a tooltip.
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconAppsOutline: '<svg></svg>',
  iconCloseOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import { OkAppLauncher } from './ok-app-launcher.js';

// The six names the QA pass found truncated on a full hub, plus the one they sit next to.
const LONG_NAMES = [
  'Reservas online',
  'Series de facturación',
  'Pasarelas de pago',
  'Carrito y pedidos',
  'Bandeja de entrada',
  'Automatizaciones',
];

let launcher: OkAppLauncher;

function stylesText(): string {
  const styles = OkAppLauncher.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

/** The rule body of a selector in the component stylesheet. */
function rule(selector: string): string {
  const m = new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(stylesText());
  expect(m, `rule ${selector} not found`).not.toBeNull();
  return m![1];
}

function portal(): ShadowRoot {
  const host = document.querySelector('[data-ok-app-launcher-portal]') as HTMLElement | null;
  expect(host, 'the sheet portal is not mounted').toBeTruthy();
  return host!.shadowRoot as ShadowRoot;
}

async function openSheet(): Promise<void> {
  (launcher.shadowRoot!.querySelector('button.trigger') as HTMLElement).click();
  await launcher.updateComplete;
}

beforeEach(async () => {
  document.body.replaceChildren();
  launcher = document.createElement('ok-app-launcher') as OkAppLauncher;
  launcher.apps = [
    { id: 'reservations', label: 'Reservas' },
    ...LONG_NAMES.map((label, i) => ({ id: `app-${i}`, label })),
  ];
  document.body.appendChild(launcher);
  await launcher.updateComplete;
});

describe('ok-app-launcher: a long app name is readable, not three clipped letters (#104)', () => {
  it('the label wraps to TWO lines instead of being cut on the first', () => {
    const label = rule('.app .label');
    expect(label, 'the label is still pinned to a single line').not.toMatch(/white-space:\s*nowrap/);
    expect(label, 'the label does not clamp to two lines').toMatch(/-webkit-line-clamp:\s*2/);
    expect(label, 'the clamp needs the -webkit-box display to take effect').toMatch(/display:\s*-webkit-box/);
    expect(label, 'the clamp needs a vertical box orientation').toMatch(/-webkit-box-orient:\s*vertical/);
  });

  it('never breaks a word mid-word: it wraps at word boundaries', () => {
    const label = rule('.app .label');
    expect(label, 'break-all splits words at any character («Automatizacio / nes»)').not.toMatch(
      /word-break:\s*break-all/,
    );
    expect(label, 'overflow-wrap:anywhere splits words at any character').not.toMatch(
      /overflow-wrap:\s*anywhere/,
    );
    expect(label, 'the label must wrap on word boundaries').toMatch(/word-break:\s*normal/);
    expect(label, 'break-word splits a too-long word at an arbitrary character too').toMatch(
      /overflow-wrap:\s*normal/,
    );
    // What does not fit even on two lines is TRUNCATED (and then the tooltip carries the name).
    expect(label, 'a name that does not fit is hard-clipped, with no «…»').toMatch(
      /text-overflow:\s*ellipsis/,
    );
  });

  it('every tile carries the FULL name as a tooltip, so a truncated one can still be told apart', async () => {
    await openSheet();
    const tiles = [...portal().querySelectorAll('button.app')] as HTMLElement[];

    expect(tiles.length, 'the tiles are not rendered').toBe(7);
    for (const [i, tile] of tiles.entries()) {
      const expected = launcher.apps[i].label;
      expect(tile.getAttribute('title'), `«${expected}» has no tooltip`).toBe(expected);
    }
  });

  it('the accessible name is the full one too — the tooltip alone leaves the keyboard out', async () => {
    await openSheet();
    const tiles = [...portal().querySelectorAll('button.app')] as HTMLElement[];

    for (const [i, tile] of tiles.entries()) {
      const expected = launcher.apps[i].label;
      expect(tile.getAttribute('aria-label'), `«${expected}» has no complete accessible name`).toBe(expected);
    }
  });

  it('«Reservas online» and «Reservas» stay distinguishable: the label text is never cut in the DOM', async () => {
    await openSheet();
    const labels = [...portal().querySelectorAll('button.app .label')].map((n) => n.textContent?.trim());

    expect(labels, 'a name was shortened in the markup instead of by CSS').toEqual([
      'Reservas',
      ...LONG_NAMES,
    ]);
  });
});
