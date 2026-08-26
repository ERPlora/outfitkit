// outfitkit#84 — the showcase is copy-and-paste material, and it pins `mode: 'ios'` for every page
// (`showcase/pages/_ionic-config.js`). Ionic only implements `fill` in `md`
// (`hasOutlineFill = mode === 'md' && this.fill === 'outline'`), so an `<ion-input|select|textarea>`
// with `fill` and no `mode="md"` paints with no box, no border, no surface — and warns nobody. The
// Hub shell normalises the mode at `customElements.define` (hub#1060); the Cloud Portal has no such
// net, and whoever copies markup from here gets the dead attribute verbatim. Same guard as
// `src/base/ionic-fill-needs-md.test.ts`, over `showcase/**/*.{html,js}` (ADR-0143 amendment).
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SHOWCASE = join(ROOT, 'showcase');

/** The whole opening tag, multiline, of the three form controls Ionic paints with `fill`. */
const CONTROL = /<ion-(?:input|select|textarea)(?=[\s/>])[^>]*>/gs;

function showcaseFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) showcaseFiles(path, out);
    else if (/\.(?:html|js)$/.test(entry.name)) out.push(path);
  }
  return out;
}

/** Every control of `source` that declares `fill` without `mode="md"`, as a short label. */
export function controlsWithDeadFill(source: string): string[] {
  const dead: string[] = [];
  for (const tag of source.match(CONTROL) ?? []) {
    if (/\bfill\s*=/.test(tag) && !/\bmode=["']md["']/.test(tag)) dead.push(tag.replace(/\s+/g, ' ').slice(0, 110));
  }
  return dead;
}

describe('showcase: a control with `fill` declares mode="md" (#84)', () => {
  it('the check catches the positive (a single-line, a multiline and a bound `fill`), and lets a clean tag through', () => {
    const dirty = `
      <ion-input label="A" fill="outline"></ion-input>
      <ion-select
        label="B"
        fill="outline"
        interface="popover"></ion-select>
      <ion-textarea fill=\${x}></ion-textarea>
      <ion-input mode="md" label="C" fill="outline"></ion-input>
      <ion-button fill="outline">not a form control</ion-button>`;
    expect(controlsWithDeadFill(dirty)).toHaveLength(3);
    expect(controlsWithDeadFill('<ion-input label="C" mode="md" fill="outline"></ion-input>')).toHaveLength(0);
  });

  it('showcase/**/*.{html,js}: zero controls with `fill` and no mode="md"', () => {
    const files = showcaseFiles(SHOWCASE);
    expect(files.length, 'the scan found no showcase files: the path is wrong').toBeGreaterThan(50);
    const offenders: string[] = [];
    let seen = 0;
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      seen += (source.match(CONTROL) ?? []).length;
      for (const tag of controlsWithDeadFill(source)) offenders.push(`${relative(ROOT, file)}: ${tag}`);
    }
    expect(seen, 'no controls seen at all: the regex or the path is wrong').toBeGreaterThan(300);
    expect(offenders, `${offenders.length} control(s) declare \`fill\` without mode="md" — Ionic ignores \`fill\` in ios mode (ADR-0143), so they paint without a box:\n${offenders.slice(0, 15).join('\n')}${offenders.length > 15 ? `\n… and ${offenders.length - 15} more` : ''}`).toEqual([]);
  });
});
