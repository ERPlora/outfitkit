// CSS contract of the tabbar drag. Split from `tabbar.test.ts` because that suite runs in
// happy-dom, where `import.meta.url` is not a file URL and the stylesheet cannot be read from disk.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// The CSS half of the drag: `bindTabbar` adds `.ok-tabbar-dragging` while a pointer drag is live,
// and `tabbar.css` is what makes the strip FEEL dragged. Without `user-select:none` the mouse drag
// selects the tab labels instead of panning, which is the classic "this is broken" look.
describe('tabbar.css - the drag affordance', () => {
  // Comments are stripped FIRST, and not for tidiness: this file explains Ionic's rules by quoting
  // them (`:host(.in-toolbar){ width:auto }`), so a naive matcher both cuts the rule short at the
  // comment's brace and would happily accept a declaration that only exists inside a comment.
  const css = readFileSync(new URL('../styles/tabbar.css', import.meta.url), 'utf8').replace(
    /\/\*[\s\S]*?\*\//g,
    ''
  );
  const rule = (selector: string): string =>
    (css.match(new RegExp(`${selector.replace(/[.[\]()-]/g, '\\$&')}\\s*\\{[^}]*\\}`, 'g')) ?? []).join('\n');

  it('the strip advertises it can be grabbed', () => {
    expect(rule('.ok-tabbar')).toMatch(/cursor\s*:\s*grab/);
  });

  it('while dragging it cuts text selection: a mouse drag must pan, not select the labels', () => {
    const dragging = rule('.ok-tabbar-dragging');
    expect(dragging).toMatch(/user-select\s*:\s*none/);
    expect(dragging, 'the cursor has to confirm the grab took').toMatch(/cursor\s*:\s*grabbing/);
  });

  it('while dragging it disables smooth scrolling: the strip must track the pointer 1:1', () => {
    expect(rule('.ok-tabbar-dragging')).toMatch(/scroll-behavior\s*:\s*auto/);
  });
});
