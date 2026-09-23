// outfitkit#162 — the single place that paints an `ion-*` rendered inside an `ok-*` shadow root.
//
// `color="danger"` does NOT work there: Ionic resolves it with a global rule
// (`.ion-color-danger { --ion-color-base: … }`) that never enters a shadow root, so the control
// keeps its default primary tone. Instead we declare the custom property ourselves, in line, from
// the theme token chain `--ok-<tone>` → `--ion-color-<tone>` → Ionic's default hex. In line (not
// in `static styles`) because overlays such as `ion-popover` may be moved out of the shadow root.

/** Ionic 8 default palette, the last fallback when neither token is defined. */
const DEFAULT_HEX: Record<string, string> = {
  primary: '#0054e9',
  secondary: '#0163aa',
  tertiary: '#6030ff',
  success: '#2dd55b',
  warning: '#ffc409',
  danger: '#c5000f',
  light: '#f4f5f8',
  medium: '#636469',
  dark: '#222428',
};

/** A theme colour name: lowercase, digits and dashes. Anything else is refused (it goes into CSS). */
const TONE_NAME = /^[a-z][a-z0-9-]*$/;

/**
 * Inline style that paints an Ionic control with a theme tone.
 * - `clear`: an `ion-button` with `fill="clear"` (sets its `--color`).
 * - `text`: an `ion-icon` / `ion-label` (sets `color`).
 * Returns `undefined` for an empty or invalid tone, so `style=${ionTone(…) ?? nothing}` renders no attribute.
 */
export function ionTone(tone: string | undefined, variant: 'clear' | 'text'): string | undefined {
  if (!tone || !TONE_NAME.test(tone)) return undefined;
  const hex = DEFAULT_HEX[tone];
  const value = `var(--ok-${tone}, var(--ion-color-${tone}${hex ? `, ${hex}` : ''}))`;
  return variant === 'clear' ? `--color: ${value};` : `color: ${value};`;
}
