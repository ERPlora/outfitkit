// @vitest-environment happy-dom
//
// outfitkit#237 (from ERPlora/verifactu#140) — the search box of every list showed TWO crosses to
// clear the text: Ionic's own clear button (grey) and, right next to it, Chromium's native
// cancel button of `<input type="search">` (blue). Seen on the hub bench (`hub:stable` 1.1.30,
// VeriFactu → Events, ios and md, 390/820/1440) with the box focused and some text typed.
//
// Cause: Ionic 8.8.9 means to hide the native one, but writes the rule as
//   `.searchbar-input::-webkit-search-cancel-button, .searchbar-input::-ms-clear { display: none }`
// and Chromium drops the WHOLE rule because it does not know `::-ms-clear` (one invalid selector
// invalidates the list). In the light DOM nobody notices: Ionic's normalize.css hides the native
// cancel at document level. Inside the shadow root of an `ok-*` that document rule never applies,
// so the native cross comes back. Measured in the hub shell: the searchbar in the light DOM paints
// one cross, the same searchbar in a shadow root paints two.
//
// Contract: every `ok-*` that renders an `ion-searchbar` carries, in its OWN styles, a rule that
// hides the native cancel of that searchbar's input — written with only selectors Chromium parses,
// so it cannot die the way Ionic's did. Ionic's clear button stays as the single cross.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import type { CSSResultGroup } from 'lit';

// The icons are baked from Iconify at build time (`~icons/ion/*?raw`), which vitest cannot load
// through a dynamic import: every exported icon becomes a stub SVG, read from the module itself.
vi.mock('./icons.js', async () => {
  const { readFileSync: read } = await import('node:fs');
  const source = read(`${process.cwd()}/src/base/icons.ts`, 'utf8');
  const names = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
  return { ...Object.fromEntries(names.map((n) => [n, '<svg/>'])), okIcon: (v?: string) => v };
});

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const COMPONENTS = join(SRC, 'components');
const NATIVE_CANCEL = '::-webkit-search-cancel-button';

function componentFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) componentFiles(path, out);
    else if (extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/** Components whose template renders an `ion-searchbar`. */
function filesWithSearchbar(): string[] {
  return componentFiles(COMPONENTS).filter((file) => /<ion-searchbar[\s>]/.test(readFileSync(file, 'utf8')));
}

function cssTextOf(styles: CSSResultGroup | undefined): string {
  if (!styles) return '';
  if (Array.isArray(styles)) return styles.map((s) => cssTextOf(s as CSSResultGroup)).join('\n');
  return (styles as { cssText?: string }).cssText ?? '';
}

type Rule = { selectors: string[]; body: string };

/**
 * Top-level style rules with their selector list split. A rule nested in `@media`/`@supports` may
 * never apply on screen (`@media print`), so those blocks are dropped before matching.
 */
function rulesOf(cssText: string): Rule[] {
  const text = cssText
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/@[^{};]+\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, '');
  const rules: Rule[] = [];
  for (const m of text.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const prelude = m[1].trim();
    if (!prelude || prelude.startsWith('@')) continue;
    rules.push({ selectors: prelude.split(',').map((s) => s.trim()), body: m[2] });
  }
  return rules;
}

/** Chromium drops a rule whose list holds a vendor pseudo-element it does not know. */
function chromiumParses(selector: string): boolean {
  return [...selector.matchAll(/::?-([a-z]+)-/g)].every((m) => m[1] === 'webkit');
}

function hides(body: string): boolean {
  return /(^|;)\s*display\s*:\s*none\s*(!important\s*)?(;|$)/.test(body.trim());
}

/** The input exactly as Ionic 8 renders it inside `ion-searchbar` (scoped, no shadow root). */
function ionicSearchInput(mode: 'ios' | 'md'): HTMLInputElement {
  const host = document.createElement('div');
  const root = host.attachShadow({ mode: 'open' });
  const bar = document.createElement('ion-searchbar');
  bar.className = `ion-no-border searchbar-left-aligned ${mode}`;
  const container = document.createElement('div');
  container.className = `searchbar-input-container sc-ion-searchbar-${mode}`;
  const input = document.createElement('input');
  input.type = 'search';
  input.className = `searchbar-input sc-ion-searchbar-${mode}`;
  container.appendChild(input);
  bar.appendChild(container);
  root.appendChild(bar);
  return input;
}

/** Rules of `cssText` that hide the native cancel of Ionic's input in `mode`, parseable by Chromium. */
function workingHideRules(cssText: string, mode: 'ios' | 'md'): Rule[] {
  const input = ionicSearchInput(mode);
  return rulesOf(cssText).filter(
    (rule) =>
      hides(rule.body) &&
      rule.selectors.every(chromiumParses) &&
      rule.selectors.some((s) => s.endsWith(NATIVE_CANCEL) && input.matches(s.slice(0, -NATIVE_CANCEL.length))),
  );
}

describe('ion-searchbar inside an ok-* shows a single clear cross (outfitkit#237)', () => {
  const files = filesWithSearchbar();

  it('finds the components that render a searchbar (the guard is not empty)', () => {
    const names = files.map((f) => relative(COMPONENTS, f)).sort();
    expect(names).toEqual(
      expect.arrayContaining([
        'ok-data-table/ok-data-table.ts',
        'ok-file-manager/ok-file-manager.ts',
        'ok-mail/ok-mail.ts',
      ]),
    );
  });

  for (const file of files) {
    const name = relative(COMPONENTS, file);
    for (const mode of ['ios', 'md'] as const) {
      it(`${name} hides the native cancel of its searchbar (${mode})`, async () => {
        const mod = (await import(file)) as Record<string, unknown>;
        const cls = Object.values(mod).find(
          (v): v is { styles?: CSSResultGroup } => typeof v === 'function' && 'styles' in (v as object),
        );
        expect(cls, `${name} exports its element class`).toBeDefined();
        const found = workingHideRules(cssTextOf(cls!.styles), mode);
        expect(found.length, `${name}: no Chromium-valid rule hides ${NATIVE_CANCEL} of the searchbar input`).toBeGreaterThan(0);
      });
    }
  }
});

describe('the detector itself (positive controls)', () => {
  const input = 'ion-searchbar input';
  it('rejects Ionic 8.8.9 own rule, which Chromium drops because of ::-ms-clear', () => {
    const ionic = `.searchbar-input.sc-ion-searchbar-ios${NATIVE_CANCEL}, .searchbar-input.sc-ion-searchbar-ios::-ms-clear { display: none; }`;
    expect(workingHideRules(ionic, 'ios')).toHaveLength(0);
  });
  it('rejects a rule that does not hide', () => {
    expect(workingHideRules(`${input}${NATIVE_CANCEL} { display: block; }`, 'md')).toHaveLength(0);
  });
  it('rejects a selector that does not reach the input Ionic renders', () => {
    expect(workingHideRules(`ion-searchbar > input${NATIVE_CANCEL} { display: none; }`, 'ios')).toHaveLength(0);
  });
  it('rejects a rule nested in an at-rule, which may never apply on screen', () => {
    expect(workingHideRules(`@media print { ${input}${NATIVE_CANCEL} { display: none; } }`, 'ios')).toHaveLength(0);
    expect(workingHideRules(`@supports (x: y) { ${input}${NATIVE_CANCEL} { display: none; } }`, 'md')).toHaveLength(0);
  });
  it('accepts a Chromium-valid rule on the searchbar input', () => {
    expect(workingHideRules(`${input}${NATIVE_CANCEL} { display: none; }`, 'ios')).toHaveLength(1);
  });
});
