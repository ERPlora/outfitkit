/**
 * outfitkit#182/#184 — Ionic 8's `ion-searchbar` renders its inner `<input>` with a constant
 * `aria-label="search text"` and only forwards `lang`/`dir` from the host, so screen readers
 * announce «search text» instead of the visible hint. Stencil only rewrites that attribute when its
 * vdom value changes (never, it is a constant), so setting it on the input survives re-renders.
 * Call it from `updated()` so it follows hint changes and a searchbar re-created by Lit.
 * `name` is read when the input resolves (not when the call starts): a later call may resolve
 * first, and a stale value must not win.
 */
export function syncSearchbarInputName(root: ParentNode | null | undefined, name: () => string): void {
  const bar = root?.querySelector('ion-searchbar');
  if (!bar) return;
  void customElements.whenDefined('ion-searchbar')
    .then(() => (bar as HTMLElement & { getInputElement?: () => Promise<HTMLInputElement> }).getInputElement?.())
    .then((input) => {
      const n = name();
      if (input && input.getAttribute('aria-label') !== n) {
        input.setAttribute('aria-label', n);
      }
    })
    .catch(() => {
      // Best-effort a11y: a missing searchbar/input (not yet upgraded, torn down mid-flight) is
      // not a failure worth surfacing.
    });
}
