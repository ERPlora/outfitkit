// Every ficha of the showcase (component, current page and pending page, all rendered by
// showcase/app.js) opens with a row of tags — the surface or tag name and «paridad 1:1» /
// «fuente real» — painted as pills. The pill style lived only under `.comp`, the wrapper of the old
// components gallery, which no view renders any more: the tags came out as plain text glued
// together («saasparidad 1:1», outfitkit#257).
//
// Static guard: for each `<div class="tags">` in app.js, collect the classes of its ancestors in
// its template and require a showcase.css rule that reaches `.tag` through one of them and paints
// it as a pill (background, padding, rounded corners) with a gap between pills.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const APP = readFileSync(join(ROOT, 'showcase', 'app.js'), 'utf8');
const CSS = readFileSync(join(ROOT, 'showcase', 'showcase.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

const VOID = new Set(['br', 'hr', 'img', 'input', 'meta', 'link', 'source', 'col', 'wbr']);

/** Classes of the open elements enclosing each `<div class="tags">`, one set per occurrence. */
function tagRowAncestors(js: string): Set<string>[] {
  const out: Set<string>[] = [];
  const marker = '<div class="tags">';
  for (let at = js.indexOf(marker); at >= 0; at = js.indexOf(marker, at + 1)) {
    const start = js.lastIndexOf('innerHTML = `', at);
    const stack: { name: string; classes: string[] }[] = [];
    const re = /<(\/?)([a-z][\w-]*)([^>]*)>/g;
    const template = js.slice(start, at);
    let m: RegExpExecArray | null;
    while ((m = re.exec(template))) {
      const [, closing, name, attrs] = m;
      if (VOID.has(name) || attrs.trim().endsWith('/')) continue;
      if (closing) {
        const i = stack.map((e) => e.name).lastIndexOf(name);
        if (i >= 0) stack.splice(i);
        continue;
      }
      const cls = /class="([^"$]*)"/.exec(attrs)?.[1] ?? '';
      stack.push({ name, classes: cls.split(/\s+/).filter(Boolean) });
    }
    out.push(new Set(stack.flatMap((e) => e.classes)));
  }
  return out;
}

type Rule = { selector: string; body: string };

/** Top-level rules (outside any @media), in source order. */
function rules(css: string): Rule[] {
  const out: Rule[] = [];
  let depth = 0;
  const re = /([^{}]+)\{|\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    if (m[0] === '}') {
      depth = Math.max(0, depth - 1);
      continue;
    }
    const head = m[1].trim();
    if (head.startsWith('@')) {
      depth++;
      continue;
    }
    const close = css.indexOf('}', re.lastIndex);
    if (depth === 0) out.push({ selector: head.replace(/\s+/g, ' '), body: css.slice(re.lastIndex, close) });
    re.lastIndex = close + 1;
  }
  return out;
}

/** Does `selector` (a descendant chain of class selectors) match `.target` inside `ancestors`? */
function reaches(selector: string, target: string, ancestors: Set<string>): boolean {
  const parts = selector.trim().split(' ');
  if (parts.pop() !== `.${target}`) return false;
  return parts.every((p) => /^\.[\w-]+$/.test(p) && (ancestors.has(p.slice(1)) || p === '.tags'));
}

/** Final declarations of the rules that reach `.target` inside `ancestors`. */
function styleOf(target: string, ancestors: Set<string>): Map<string, string> {
  const props = new Map<string, string>();
  for (const r of rules(CSS)) {
    if (!r.selector.split(',').some((s) => reaches(s, target, ancestors))) continue;
    for (const decl of r.body.split(';')) {
      const at = decl.indexOf(':');
      if (at < 0) continue;
      props.set(decl.slice(0, at).trim(), decl.slice(at + 1).trim());
    }
  }
  return props;
}

describe('showcase ficha tags (outfitkit#257)', () => {
  const rows = tagRowAncestors(APP);

  it('finds the tag rows of the component, page and pending-page fichas', () => {
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('paints every tag of every ficha as a pill', () => {
    for (const ancestors of rows) {
      const tag = styleOf('tag', ancestors);
      expect(tag.get('background') ?? tag.get('background-color'), [...ancestors].join(' ')).toBeTruthy();
      expect(parseFloat(tag.get('padding') ?? '0')).toBeGreaterThan(0);
      expect(parseFloat(tag.get('border-radius') ?? '0')).toBeGreaterThan(0);
    }
  });

  it('keeps a gap between the pills', () => {
    for (const ancestors of rows) {
      const row = styleOf('tags', ancestors);
      const tag = styleOf('tag', ancestors);
      const gap = /flex|grid/.test(row.get('display') ?? '') ? parseFloat(row.get('gap') ?? '0') : 0;
      const margin = parseFloat((tag.get('margin') ?? '0').split(/\s+/)[1] ?? '0');
      expect(Math.max(gap, margin), [...ancestors].join(' ')).toBeGreaterThan(0);
    }
  });
});
