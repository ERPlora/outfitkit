// outfitkit#82 — a control that declares `fill` must declare mode="md" too.
//
// Ionic implements `fill` ONLY in `md` mode. From its own source (@ionic/core, input.js):
//
//     const hasOutlineFill = mode === 'md' && this.fill === 'outline';
//
// Both consumers of OutfitKit run Ionic in `ios` mode on purpose: the Hub shell pins it
// (ADR-0143) and so does the Cloud Portal. There, `fill="outline"` is a SILENT no-op — the
// control renders with no box, no border and no surface, just a label floating over the page
// background. Nothing throws and nothing warns, which is why 15 of our own controls carried a
// dead `fill` for months without anyone noticing.
//
// The Hub covers its own views with the twin of this guard
// (`apps/web/src/theme/ionic-fill-needs-md.test.ts`, hub#760), the SaaS with its own (saas#1080)
// and modules with the gate in `erplora validate` (module-toolkit#63). OutfitKit had none, and
// its components render INSIDE those shells, so they inherit `ios` like any other `ion-*`.
//
// Note the Hub shell also normalizes `fill` at `customElements.define` time (hub#1060), which
// hides the defect there. The Cloud Portal has no such net: the dead `fill` does show up. And a
// safety net in one consumer is not a reason to ship broken markup from the library the other 25
// modules build on — this guard is what keeps it from creeping back with the next component.
//
// This is a SOURCE test on purpose: a styling bug that raises no error needs something that looks
// at it for you.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = join(SRC, 'components');

/** Opening tag of an Ionic form control, even when its attributes span several lines. */
const CONTROL = /<ion-(?:input|select|textarea)(?=[\s/>])[^>]*>/gs;

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) componentFiles(path, out);
    else if (extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/** Every control of `source` that asks for a box Ionic will never paint. */
function controlsWithDeadFill(source: string): string[] {
  const dead: string[] = [];
  for (const tag of source.match(CONTROL) ?? []) {
    // `fill="outline"` and `fill=${...}` alike: a bound value is just as dead outside `md`.
    if (!/\bfill=/.test(tag)) continue;
    if (/\bmode="md"/.test(tag)) continue;
    dead.push(tag.replace(/\s+/g, ' ').slice(0, 110));
  }
  return dead;
}

/** How many controls the scan sees at all — the denominator behind a green run. */
function controlCount(): number {
  return componentFiles(COMPONENTS).reduce(
    (n, file) => n + (readFileSync(file, 'utf8').match(CONTROL) ?? []).length,
    0,
  );
}

describe('a control that declares `fill` must declare mode="md" (outfitkit#82)', () => {
  it('no ion-input / ion-select / ion-textarea declares a `fill` that will never paint', () => {
    const offenders: string[] = [];
    for (const file of componentFiles(COMPONENTS)) {
      for (const tag of controlsWithDeadFill(readFileSync(file, 'utf8'))) {
        offenders.push(`  ${relative(SRC, file)}: ${tag}`);
      }
    }
    expect(
      offenders,
      [
        'Ionic only paints `fill` in `md` mode, and both shells pin `ios` (ADR-0143): these',
        'controls render with no box at all. Add mode="md" to each of them:',
        ...offenders,
      ].join('\n'),
    ).toEqual([]);
  });

  it('the scan finds the positive — a green run above means clean, not empty', () => {
    // Without this, deleting the regex, renaming the folder or moving the components would turn
    // this file into a guard that passes by finding nothing at all.
    const offending = [
      '<ion-input label="NIF" fill="outline"></ion-input>',
      '<ion-select\n  label="Country"\n  fill="outline"\n></ion-select>',
      '<ion-textarea fill=${this.fill}></ion-textarea>',
    ].join('\n');
    expect(controlsWithDeadFill(offending)).toHaveLength(3);

    // And it does not cry wolf: an explicit mode is fine, a control with no `fill` is fine, and
    // `ion-button` / `ion-chip` honour `fill` in `ios` too, so they are none of its business.
    const clean = [
      '<ion-input label="NIF" fill="outline" mode="md"></ion-input>',
      '<ion-select label="Country"></ion-select>',
      '<ion-button fill="outline">Save</ion-button>',
      '<ion-chip fill="outline">Tag</ion-chip>',
      '<ion-input-password-toggle fill="outline"></ion-input-password-toggle>',
    ].join('\n');
    expect(controlsWithDeadFill(clean)).toEqual([]);
  });

  it('the scan really reaches the components — otherwise it guards an empty set', () => {
    expect(
      controlCount(),
      'no Ionic form control found under src/components: a refactor moved them and this guard stopped guarding',
    ).toBeGreaterThanOrEqual(20);
  });
});
