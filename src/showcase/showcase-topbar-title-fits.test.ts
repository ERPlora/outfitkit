// The showcase topbar (showcase/app.js) is an ion-toolbar with the menu button at the start, the
// page title in the middle and the viewport / theme / dark / GitHub controls at the end. The showcase
// runs Ionic in `ios` mode, where ion-title is laid out on its own: absolutely positioned over the
// whole toolbar and centred with a fixed 90 px side padding, blind to how wide the end controls are.
// Those controls are ~180 px wide on a phone, so any title — «ok-receipt», even «Inicio» — was
// painted on top of the theme select («ok-receiptERPlora», outfitkit#254), and at tablet width a
// long name («layout.css (container · grid)») hit the viewport segment.
//
// The title must take only the gap the controls leave (a shrinkable flex item with no oversized
// side padding, ellipsised by ion-title itself) and, on phones, the theme select shows only its
// palette icon so that gap is worth having. Static guard over showcase/showcase.css: values are
// compared as numbers and the LAST declaration of each property wins, as in the cascade.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CSS = readFileSync(join(ROOT, 'showcase', 'showcase.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/** The phone breakpoint the topbar already uses to drop the viewport segment. */
const PHONE_MEDIA = '(max-width: 640px)';

type Block = { media: string | null; selector: string; body: string };

/** Top-level rules and the rules inside each `@media`, in source order. */
function blocks(css: string): Block[] {
  const out: Block[] = [];
  let media: string | null = null;
  const re = /([^{}]+)\{|\}/g;
  let m: RegExpExecArray | null;
  const stack: string[] = [];
  while ((m = re.exec(css))) {
    if (m[0] === '}') {
      stack.pop();
      if (stack.length === 0) media = null;
      continue;
    }
    const head = m[1].trim();
    if (head.startsWith('@media')) {
      media = head.slice('@media'.length).trim();
      stack.push('@media');
      continue;
    }
    const close = css.indexOf('}', re.lastIndex);
    out.push({ media, selector: head.replace(/\s+/g, ' '), body: css.slice(re.lastIndex, close) });
    re.lastIndex = close + 1;
  }
  return out;
}

/** Final value of each property for rules whose selector matches, under the given media (null = none). */
function declared(selectorPart: string, media: string | null): Map<string, string> {
  const props = new Map<string, string>();
  for (const b of blocks(CSS)) {
    if (b.media !== media) continue;
    if (!b.selector.split(',').some((s) => s.includes(selectorPart))) continue;
    for (const decl of b.body.split(';')) {
      const at = decl.indexOf(':');
      if (at < 0) continue;
      props.set(decl.slice(0, at).trim(), decl.slice(at + 1).replace('!important', '').trim());
    }
  }
  return props;
}

/** Inline-axis padding (start, end) resolved from padding / padding-inline / padding-left|right. */
function inlinePadding(props: Map<string, string>): [number, number] | null {
  let start: number | null = null;
  let end: number | null = null;
  for (const [prop, value] of props) {
    const parts = value.split(/\s+/).map((v) => parseFloat(v));
    if (prop === 'padding') {
      const [, right = parts[0], , left = right] = parts;
      start = left;
      end = right;
    } else if (prop === 'padding-inline') {
      start = parts[0];
      end = parts[1] ?? parts[0];
    } else if (prop === 'padding-left' || prop === 'padding-inline-start') {
      start = parts[0];
    } else if (prop === 'padding-right' || prop === 'padding-inline-end') {
      end = parts[0];
    }
  }
  return start === null || end === null ? null : [start, end];
}

describe('showcase topbar title fits between the toolbar controls (outfitkit#254)', () => {
  const title = declared('#topbar-title', null);

  it('lays the title out in the toolbar flow instead of the ios absolute overlay', () => {
    expect(['static', 'relative']).toContain(title.get('position'));
  });

  it('lets the title grow into the gap and shrink below its text width', () => {
    const flex = (title.get('flex') ?? '').split(/\s+/);
    expect(parseFloat(flex[0])).toBeGreaterThanOrEqual(1);
    expect(flex[1] === undefined ? 1 : parseFloat(flex[1])).toBeGreaterThan(0);
    expect(parseFloat(title.get('min-width') ?? 'NaN')).toBe(0);
  });

  it('drops the fixed 90 px ios side padding that reserves room blind to the controls', () => {
    const padding = inlinePadding(title);
    expect(padding).not.toBeNull();
    for (const side of padding!) expect(side).toBeLessThanOrEqual(16);
  });

  it('keeps ion-title from widening to the full toolbar', () => {
    expect(title.get('width')).toBe('auto');
  });

  // Ionic 9 wraps the text, the native button (the tap target) and the icon in part=container, so
  // only part=text may go: hiding the container removes the whole select from the toolbar.
  it('shows only the palette icon of the theme select on phones', () => {
    expect(declared('ion-select.theme-select::part(text)', PHONE_MEDIA).get('display')).toBe('none');
    expect(declared('ion-select.theme-select::part(container)', PHONE_MEDIA).get('display')).not.toBe('none');
    expect(declared('ion-select.theme-select::part(icon)', PHONE_MEDIA).get('display')).not.toBe('none');
  });

  // Without its text the select shrinks to the bare icon (~34 px): keep a 44 px tap target, the
  // minimum Apple's HIG and Material ask for, like the icon-only buttons beside it.
  it('keeps a 44 px tap target for the icon-only theme select on phones', () => {
    expect(parseFloat(declared('ion-select.theme-select', PHONE_MEDIA).get('min-width') ?? '0')).toBeGreaterThanOrEqual(44);
  });

  // Squeezed by the toolbar, the viewport segment was cut to 73 of its 101 px at tablet width and
  // one of the three viewport buttons disappeared. The title is the part that gives way, not it.
  it('keeps the viewport segment at its natural width', () => {
    const segment = declared('ion-segment.viewport-seg', null);
    const flex = segment.get('flex');
    const shrink = flex === 'none' ? 0 : flex !== undefined ? parseFloat(flex.split(/\s+/)[1] ?? '1') : parseFloat(segment.get('flex-shrink') ?? '1');
    expect(shrink).toBe(0);
  });

  it('collapses the theme select at the same 640 px border that hides the viewport segment', () => {
    expect(declared('ion-segment.viewport-seg', PHONE_MEDIA).get('display')).toBe('none');
    const phoneMedias = new Set(blocks(CSS).filter((b) => b.selector.includes('theme-select')).map((b) => b.media));
    expect([...phoneMedias].filter((m) => m !== null)).toEqual([PHONE_MEDIA]);
  });
});
