import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-money — money as the screen shows it, from the INTEGER the system keeps (ADR-0123).
//
// ERPlora never holds money in a float: the runtime stores and returns minor units as integers
// (1650 = 16,50 €), and this is the ONE place in OutfitKit where that integer becomes text. It does
// so BY STRING — the digits are cut `decimals` from the end and the rest grouped by three — never by
// dividing: there is no `/100`, no `toFixed`, nothing that could round or drift. The `value`
// attribute keeps the integer untouched; only the shadow text is formatted.
//
// The language only decides the two separators (`,`/`.` in `es`, `.`/`,` in `en`), read once from
// `Intl` for the locale — the element's `locale`, else the document's `<html lang>`, else `en`.
// Thousands are ALWAYS grouped (hub#1090: CLDR would leave «1234,56» ungrouped in Spanish).
//
// Usage:
//   <ok-money value="1650" currency="€"></ok-money>            → 16,50 € (in a Spanish document)
//   <ok-money value="1999" decimals="0" currency="¥"></ok-money> → 1.999 ¥
//   formatMinor(1650, { decimals: 2, locale: 'es', currency: '€' }) — the same, as a function, for
//   components that paint money inside their own template (ok-receipt, ok-invoice).

export interface FormatMinorOptions {
  /** Digits after the separator — the currency's scale (EUR 2, JPY 0, KWD 3). */
  decimals: number;
  /** BCP-47 locale that decides the separators. */
  locale: string;
  /** Symbol or ISO code painted after the number, separated by a space. Empty = none. */
  currency?: string;
}

/** What is painted when the value is not an integer: a float here is a contract violation upstream
 *  (money divided at the wrong door), and inventing an amount from it would hide that. */
export const NOT_AN_AMOUNT = '—';

/** The two separators of a locale, from `Intl` (same trick as `ok-currency`). */
export function separatorsOf(locale: string): { decimal: string; group: string } {
  try {
    const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
    return {
      decimal: parts.find((p) => p.type === 'decimal')?.value ?? '.',
      group: parts.find((p) => p.type === 'group')?.value ?? ',',
    };
  } catch {
    return { decimal: '.', group: ',' };
  }
}

/** The document's language, the way `ok-data-table` picks its ES/EN labels. */
export function documentLocale(): string {
  if (typeof document === 'undefined') return 'en';
  const lang = document.documentElement?.lang?.trim();
  return lang || 'en';
}

/** Integer minor units → text, by string. Non-integers (a float, NaN, text) → `NOT_AN_AMOUNT`. */
export function formatMinor(value: unknown, opts: FormatMinorOptions): string {
  const raw = typeof value === 'number' ? (Number.isInteger(value) ? String(value) : '') : typeof value === 'string' ? value.trim() : '';
  if (!/^-?\d+$/.test(raw)) return opts.currency ? `${NOT_AN_AMOUNT} ${opts.currency}` : NOT_AN_AMOUNT;
  const negative = raw.startsWith('-');
  let digits = raw.replace(/^-0*/, '').replace(/^0+(?=\d)/, '');
  if (digits === '' || digits === '-') digits = '0';
  const decimals = Math.max(0, Math.floor(opts.decimals));
  const padded = digits.padStart(decimals + 1, '0');
  const intPart = padded.slice(0, padded.length - decimals);
  const fracPart = padded.slice(padded.length - decimals);
  const { decimal, group } = separatorsOf(opts.locale);
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, group);
  const number = decimals > 0 ? `${grouped}${decimal}${fracPart}` : grouped;
  const signed = negative && /[1-9]/.test(digits) ? `-${number}` : number;
  return opts.currency ? `${signed} ${opts.currency}` : signed;
}

export class OkMoney extends LitElement {
  static styles = css`
    :host { display: inline; font-variant-numeric: tabular-nums; white-space: nowrap; }
  `;

  /** Integer in minor units (1650 = 16,50 €). String or number; the attribute is never rewritten. */
  @property() value: string | number | undefined = undefined;
  /** The currency's scale. Default 2 (EUR, USD…). */
  @property({ type: Number }) decimals = 2;
  /** Symbol or ISO code painted after the number. Empty = none. */
  @property() currency = '';
  /** BCP-47 locale for the separators. Default: the document's `<html lang>`, else `en`. */
  @property() locale = '';

  render() {
    return html`${formatMinor(this.value, {
      decimals: this.decimals,
      locale: this.locale || documentLocale(),
      currency: this.currency,
    })}`;
  }
}

define('ok-money', OkMoney);

declare global {
  interface HTMLElementTagNameMap {
    'ok-money': OkMoney;
  }
}
