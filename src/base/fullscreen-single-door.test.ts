// SINGLE-DOOR GUARD — the raw Fullscreen API is called from `src/base/fullscreen.ts` and nowhere else.
//
// Why a guard and not just a fix: this was never one bug, it was one MISSING library decision. The
// same ~10 lines had been written four times (ok-video, ok-lightbox, the showcase POS page, the Hub
// shell) and each copy independently got the same two things wrong -- asking the GLOBAL
// `document.fullscreenElement` instead of "is MY element the one", and painting the button without
// checking whether the browser can do this at all. Fixing the four copies without this guard just
// resets the clock until the fifth one is written.
//
// The rule: components and demos ask `base/fullscreen.js`. Two deliberate non-bans:
//   · `webkitEnterFullscreen` -- the one prefixed call that buys real function (an iPhone <video>
//     can go fullscreen when no element can), and it belongs to whoever owns the <video>;
//   · the i18n key `exitFullscreen` -- a label, not the API, which is why the patterns below match
//     the RECEIVER (`document.exitFullscreen`) and not the bare word.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const REPO = fileURLToPath(new URL('../../', import.meta.url));

/** Raw API surface, matched by shape so an i18n key named after it is not a false positive. */
const BANNED: readonly RegExp[] = [
  /\.requestFullscreen\b/,
  /\bdocument\.exitFullscreen\b/,
  /\.fullscreenElement\b/,
  /['"]fullscreenchange['"]/,
];

/** The door itself, and the tests that must install a fake API to exercise anything at all. */
const ALLOWED = [/^src\/base\/fullscreen\.ts$/, /\.test\.ts$/];

/** Comments are prose: a line explaining why we no longer call `document.exitFullscreen` is not a call. */
function stripComments(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');
}

export function usesRawFullscreenApi(src: string): boolean {
  const code = stripComments(src);
  return BANNED.some((re) => re.test(code));
}

function walk(dir: string, exts: string[], out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === 'dist' || name.startsWith('.')) continue;
    const full = `${dir}/${name}`;
    if (statSync(full).isDirectory()) walk(full, exts, out);
    else if (exts.some((e) => name.endsWith(e))) out.push(full);
  }
  return out;
}

function offenders(dir: string, exts: string[]): string[] {
  return walk(`${REPO}${dir}`, exts)
    .map((full) => full.slice(REPO.length))
    .filter((rel) => !ALLOWED.some((re) => re.test(rel)))
    .filter((rel) => usesRawFullscreenApi(readFileSync(`${REPO}${rel}`, 'utf8')));
}

describe('fullscreen — one door for the whole library', () => {
  it('no component talks to the native Fullscreen API directly', () => {
    expect(
      offenders('src', ['.ts']),
      'import { isCapable, isActive, toggle, onChange } from base/fullscreen.js instead',
    ).toEqual([]);
  });

  it('no showcase page does either -- module authors copy these pages verbatim', () => {
    expect(offenders('showcase', ['.html', '.js'])).toEqual([]);
  });
});

describe('the guard itself', () => {
  it('catches the shapes that were actually written in the four copies', () => {
    expect(usesRawFullscreenApi('if (document.fullscreenElement) await doc.exitFullscreen();')).toBe(true);
    expect(usesRawFullscreenApi('void box.requestFullscreen?.().catch(() => undefined);')).toBe(true);
    expect(usesRawFullscreenApi("el.requestFullscreen()")).toBe(true);
    expect(usesRawFullscreenApi("document.addEventListener('fullscreenchange', sync);")).toBe(true);
    expect(usesRawFullscreenApi('if (root.fullscreenElement === el) return true;')).toBe(true);
  });

  it('does not fire on a label named after the API, or on prose about it', () => {
    expect(usesRawFullscreenApi("aria-label=${this.t.exitFullscreen}")).toBe(false);
    expect(usesRawFullscreenApi('  exitFullscreen: "Exit fullscreen",')).toBe(false);
    expect(usesRawFullscreenApi('// we no longer call document.exitFullscreen here')).toBe(false);
    expect(usesRawFullscreenApi('/* document.fullscreenElement is a global */')).toBe(false);
    expect(usesRawFullscreenApi('video.webkitEnterFullscreen?.();')).toBe(false);
    expect(usesRawFullscreenApi("const url = 'https://example.com//x';")).toBe(false);
  });

  it('reads the files it claims to -- a walk that matches nothing is green forever', () => {
    expect(walk(`${REPO}src`, ['.ts']).length).toBeGreaterThan(100);
    expect(walk(`${REPO}showcase`, ['.html', '.js']).length).toBeGreaterThan(10);
  });
});
