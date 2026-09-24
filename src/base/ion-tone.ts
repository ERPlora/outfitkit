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

/** Ionic 8 default contrast of each tone: what a solid button writes its text with. */
const DEFAULT_CONTRAST: Record<string, string> = {
  primary: '#fff',
  secondary: '#fff',
  tertiary: '#fff',
  success: '#000',
  warning: '#000',
  danger: '#fff',
  light: '#000',
  medium: '#fff',
  dark: '#fff',
};

/** A theme colour name: lowercase, digits and dashes. Anything else is refused (it goes into CSS). */
const TONE_NAME = /^[a-z][a-z0-9-]*$/;

/** How the control is filled, which decides the custom properties that carry the tone. */
export type IonToneVariant = 'clear' | 'text' | 'solid' | 'outline';

/** `var(--ok-<name>, var(--ion-color-<name>, <hex>))`, the hex only when Ionic ships one. */
function tokenChain(okName: string, ionName: string, hex: string | undefined): string {
  return `var(--ok-${okName}, var(--ion-color-${ionName}${hex ? `, ${hex}` : ''}))`;
}

/**
 * Inline style that paints an Ionic control with a theme tone.
 * - `clear`: an `ion-button` with `fill="clear"` (sets its `--color`).
 * - `text`: an `ion-icon` / `ion-label` (sets `color`).
 * - `solid`: an `ion-button` with `fill="solid"` (background from the tone, text from its contrast,
 *   and hover / press / focus from its tint / shade so they do not flash Ionic's primary).
 * - `outline`: an `ion-button` with `fill="outline"` (text and border from the tone).
 * Returns `undefined` for an empty or invalid tone, so `style=${ionTone(…) ?? nothing}` renders no attribute.
 */
export function ionTone(tone: string | undefined, variant: IonToneVariant): string | undefined {
  if (!tone || !TONE_NAME.test(tone)) return undefined;
  const value = tokenChain(tone, tone, DEFAULT_HEX[tone]);
  switch (variant) {
    case 'text':
      return `color: ${value};`;
    case 'clear':
      return `--color: ${value};`;
    case 'outline':
      return (
        `--color: ${value}; --border-color: ${value}; ` +
        `--background-activated: ${value}; --background-focused: ${value};`
      );
    case 'solid': {
      const contrast = tokenChain(`${tone}-contrast`, `${tone}-contrast`, DEFAULT_CONTRAST[tone]);
      return (
        `--background: ${value}; --color: ${contrast}; ` +
        `--background-hover: var(--ion-color-${tone}-tint, ${value}); ` +
        `--background-activated: var(--ion-color-${tone}-shade, ${value}); ` +
        `--background-focused: var(--ion-color-${tone}-shade, ${value});`
      );
    }
  }
}
