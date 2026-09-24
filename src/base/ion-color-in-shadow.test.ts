// outfitkit#163 — no `ion-*` rendered by an `ok-*` component may declare `color=`.
//
// Ionic paints `color="danger"` with a GLOBAL rule (`.ion-color-danger { --ion-color-base: … }`)
// that never enters the shadow root of an `ok-*`. The control renders with an empty
// `--ion-color-base` and falls back to Ionic's default primary: the trash of «Delete» in `ok-mail`
// came out blue, «Back» in `ok-wizard` too (#162 measured `rgb(0, 84, 233)` under `ios`). Nothing
// throws and nothing warns, so a styling bug like this needs something that looks at it for you.
//
// The fix is `style=${ionTone(tone, variant)}` (`src/base/ion-tone.ts`), which declares the
// custom properties from the theme token. This guard keeps `color=` from creeping back.
//
// `ok-*` children are not concerned: `ok-qr`, `ok-gauge`… take `color` as their own prop.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = join(SRC, 'components');

/**
 * Opening tag of any Ionic element, even across lines. An arrow (`=>`) inside a bound handler such
 * as `@click=${() => this.x()}` is part of the tag, not its end.
 */
const ION_TAG = /<ion-[a-z-]+(?=[\s/>])(?:=>|[^>])*>/gs;

/** `color="…"`, `color=${…}` and the property binding `.color=${…}` alike: all end up as `.ion-color-*`. */
const COLOR_ATTR = /(?:^|[\s.])color=/;

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) componentFiles(path, out);
    else if (extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/** Every Ionic tag of `source` that asks for a colour Ionic will never paint in a shadow root. */
function ionTagsWithDeadColor(source: string): string[] {
  return (source.match(ION_TAG) ?? [])
    .filter((tag) => COLOR_ATTR.test(tag))
    .map((tag) => tag.replace(/\s+/g, ' ').slice(0, 110));
}

function ionTagCount(): number {
  return componentFiles(COMPONENTS).reduce(
    (n, file) => n + (readFileSync(file, 'utf8').match(ION_TAG) ?? []).length,
    0,
  );
}

describe('no ion-* inside an ok-* shadow root declares color= (outfitkit#163)', () => {
  it('no component paints an ion-* with color=', () => {
    const offenders: string[] = [];
    for (const file of componentFiles(COMPONENTS)) {
      for (const tag of ionTagsWithDeadColor(readFileSync(file, 'utf8'))) {
        offenders.push(`  ${relative(SRC, file)}: ${tag}`);
      }
    }
    expect(
      offenders,
      [
        'Ionic resolves color= with a global rule that never enters a shadow root: these controls',
        'keep the default primary tone. Use style=${ionTone(tone, variant)} from src/base/ion-tone.ts:',
        ...offenders,
      ].join('\n'),
    ).toEqual([]);
  });

  it('the scan finds the positive — a green run above means clean, not empty', () => {
    const offending = [
      '<ion-button fill="clear" color="danger"></ion-button>',
      '<ion-button\n  class="main"\n  color=${this.color}\n></ion-button>',
      '<ion-icon .color=${tone}></ion-icon>',
      // after a bound handler whose arrow carries a `>`
      '<ion-button @click=${() => this.back()} color="medium">Back</ion-button>',
    ].join('\n');
    expect(ionTagsWithDeadColor(offending)).toHaveLength(4);

    // And it does not cry wolf: our own ok-* take `color` as a prop, and a `style` that happens to
    // mention a colour, or an SVG stop-color, is none of its business.
    const clean = [
      '<ion-button fill="clear" style=${ionTone("danger", "clear")}></ion-button>',
      '<ok-qr .value=${qr} color="#000"></ok-qr>',
      '<ok-gauge .color=${this.statusColor}></ok-gauge>',
      '<ion-label style="color: red">x</ion-label>',
      '<stop offset="0%" stop-color=${color} />',
    ].join('\n');
    expect(ionTagsWithDeadColor(clean)).toEqual([]);
  });

  it('the scan really reaches the components — otherwise it guards an empty set', () => {
    expect(
      ionTagCount(),
      'almost no ion-* found under src/components: a refactor moved them and this guard stopped guarding',
    ).toBeGreaterThanOrEqual(100);
  });
});
