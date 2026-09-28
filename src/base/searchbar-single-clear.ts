import { css } from 'lit';

/**
 * outfitkit#237 — one clear cross in an `ion-searchbar` rendered inside an `ok-*` shadow root.
 *
 * Ionic's searchbar input is an `<input type="search">`, so Chromium adds its own native cancel
 * button next to Ionic's clear button. Ionic 8 tries to hide it, but writes the selector together
 * with `::-ms-clear`, and Chromium drops the whole rule for that unknown pseudo-element. Outside a
 * shadow root Ionic's normalize.css hides it at document level; inside ours nothing does, and the
 * search box of every list showed two crosses.
 *
 * Spread it into the styles of any component that renders an `ion-searchbar`:
 *
 *   static styles = [searchbarSingleClear, css`…`];
 *
 * The guard `searchbar-single-clear.test.ts` fails for a component that renders one without it.
 * Keep the selector alone in its rule: adding a vendor pseudo-element of another engine kills it.
 */
export const searchbarSingleClear = css`
  ion-searchbar input::-webkit-search-cancel-button {
    -webkit-appearance: none;
    appearance: none;
    display: none;
  }
`;
