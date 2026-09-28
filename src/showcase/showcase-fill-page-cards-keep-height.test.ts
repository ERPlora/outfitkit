// A hub page that fills the viewport is a column flexbox with `height: 100%` whose data table takes
// the leftover height (`flex: 1 1 auto; min-height: 0`). Any `<ion-card>` beside that table is a
// flex item too, and it shrinks by default (`flex-shrink: 1`). Ionic paints `ion-card` with
// `overflow: hidden`, which makes its automatic minimum height 0, so the card is squeezed below
// its content and its fields and buttons get clipped — module-kitchen-stations.html cut the
// «Enrutado» card in half on desktop and on mobile. The card keeps its natural height only if the
// page says so (`flex: none` / `flex-shrink: 0`). Static guard over `showcase/pages/*.html`.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PAGES = join(ROOT, 'showcase', 'pages');

const RULE = /([^{}]+)\{([^{}]*)\}/g;

function rules(source: string): Array<{ selector: string; body: string }> {
  const css = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
  return [...css.matchAll(RULE)].map((m) => ({ selector: m[1].trim(), body: m[2].replace(/\s+/g, ' ') }));
}

function fillsHeightAsColumn(body: string): boolean {
  return /display:\s*flex/.test(body) && /flex-direction:\s*column/.test(body) && /(?:^|[;\s])height:\s*100%/.test(body);
}

const VOID = /^(?:br|hr|img|input|link|meta|source|wbr)$/;

/** Whether the element opened by the tag matching `open` has an `<ion-card>` as a direct child. */
function hasDirectCard(source: string, open: RegExp): boolean {
  const start = open.exec(source);
  if (!start) return false;
  let depth = 0;
  for (const tag of source.slice(start.index + start[0].length).matchAll(/<(\/?)([a-z][\w-]*)[^>]*?(\/?)>/g)) {
    const [, closing, name, selfClosing] = tag;
    if (closing) {
      if (depth === 0) return false;
      depth -= 1;
      continue;
    }
    if (depth === 0 && name === 'ion-card') return true;
    if (!selfClosing && !VOID.test(name)) depth += 1;
  }
  return false;
}

function keepsHeight(body: string): boolean {
  return /flex:\s*(?:none|0\s+0\s+auto)/.test(body) || /flex-shrink:\s*0/.test(body);
}

/** Column-fill containers of `source` that hold an `<ion-card>` left free to shrink. */
export function shrinkableCards(source: string): string[] {
  const all = rules(source);
  const offenders: string[] = [];
  for (const { selector, body } of all) {
    const cls = /^\.([\w-]+)$/.exec(selector)?.[1];
    if (!cls || !fillsHeightAsColumn(body)) continue;
    if (!hasDirectCard(source, new RegExp(`<[a-z][\\w-]*[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>`))) continue;
    const pinned = all.some(
      (r) => new RegExp(`\\.${cls}\\s*>?\\s*ion-card\\b`).test(r.selector) && keepsHeight(r.body),
    );
    if (!pinned) offenders.push(`.${cls}`);
  }
  return offenders;
}

/**
 * Column-fill containers of `source` with a card whose data table may shrink to nothing: on a short
 * phone the pinned card eats the height and a `min-height: 0` table is left with no visible row.
 * The table needs a real minimum so the page scrolls instead.
 */
export function vanishingTables(source: string): string[] {
  const all = rules(source);
  const offenders: string[] = [];
  for (const { selector, body } of all) {
    const cls = /^\.([\w-]+)$/.exec(selector)?.[1];
    if (!cls || !fillsHeightAsColumn(body)) continue;
    if (!hasDirectCard(source, new RegExp(`<[a-z][\\w-]*[^>]*class=["'][^"']*\\b${cls}\\b[^"']*["'][^>]*>`))) continue;
    const table = all.filter((r) => new RegExp(`\\.${cls}\\s*>?\\s*ok-data-table\\b`).test(r.selector));
    const floor = table.map((r) => /min-height:\s*([^;]+)/.exec(r.body)?.[1].trim()).filter(Boolean).pop();
    if (table.length && (!floor || /^0(?:px|rem)?$/.test(floor))) offenders.push(`.${cls}`);
  }
  return offenders;
}

describe('showcase: cards beside a filling data table keep their natural height', () => {
  it('the check catches the positive and lets a pinned card through', () => {
    const page = (extra: string) => `<style>
      .demo-page { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .demo-page > ok-data-table { flex: 1 1 auto; min-height: 0; }
      ${extra}
    </style>
    <div class="demo-page"><ion-card><ion-card-content>form</ion-card-content></ion-card><ok-data-table fill></ok-data-table></div>`;
    expect(shrinkableCards(page(''))).toEqual(['.demo-page']);
    // A rule on the card that still lets it shrink is not a pin.
    expect(shrinkableCards(page('.demo-page > ion-card { flex: 1 1 auto; margin: 0; }'))).toEqual(['.demo-page']);
    expect(shrinkableCards(page('.demo-page > ion-card { flex: none; }'))).toEqual([]);
    expect(shrinkableCards(page('.demo-page > ion-card { flex-shrink: 0; }'))).toEqual([]);
    expect(shrinkableCards('<style>.x { display: flex; flex-direction: column; }</style><div class="x"><ion-card></ion-card></div>')).toEqual([]);
    // A card nested in a scrolling child is not a flex item of the page (api-docs-hub.html).
    expect(shrinkableCards(`<style>.y { height: 100%; display: flex; flex-direction: column; }</style>
      <div class="y"><div class="host"><ion-card></ion-card></div></div>`)).toEqual([]);
  });

  it('the check catches a table that can shrink to nothing beside a card, and lets a floored one through', () => {
    const page = (table: string) => `<style>
      .demo-page { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .demo-page > ok-data-table { ${table} }
      .demo-page > ion-card { flex: none; }
    </style>
    <div class="demo-page"><ion-card></ion-card><ok-data-table fill></ok-data-table></div>`;
    expect(vanishingTables(page('flex: 1 1 auto; min-height: 0;'))).toEqual(['.demo-page']);
    expect(vanishingTables(page('flex: 1 1 auto;'))).toEqual(['.demo-page']);
    expect(vanishingTables(page('flex: 1 1 auto; min-height: 20rem;'))).toEqual([]);
  });

  it('showcase/pages/*.html: a table beside a card keeps a visible minimum height', () => {
    const files = readdirSync(PAGES).filter((f) => f.endsWith('.html'));
    const offenders = files.flatMap((f) =>
      vanishingTables(readFileSync(join(PAGES, f), 'utf8')).map((c) => `showcase/pages/${f}: ${c} > ok-data-table`),
    );
    expect(offenders, `on a short phone the card leaves the table with no visible row — give it a min-height:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('showcase/pages/*.html: no shrinkable card beside a filling table', () => {
    const files = readdirSync(PAGES).filter((f) => f.endsWith('.html'));
    expect(files.length, 'the scan found no showcase pages: the path is wrong').toBeGreaterThan(50);
    const offenders = files.flatMap((f) =>
      shrinkableCards(readFileSync(join(PAGES, f), 'utf8')).map((c) => `showcase/pages/${f}: ${c} > ion-card`),
    );
    expect(offenders, `cards left free to shrink get clipped (ion-card is overflow: hidden) — add \`flex: none\`:\n${offenders.join('\n')}`).toEqual([]);
  });
});
