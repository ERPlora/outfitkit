// outfitkit#162 — `color=` on an `ion-*` rendered inside an `ok-*` shadow root paints nothing.
//
// Ionic resolves `color="danger"` with a GLOBAL rule (`.ion-color-danger { --ion-color-base: … }`)
// that never reaches into our shadow roots, so the control falls back to its default (primary)
// tone. The fix is to declare the custom properties ourselves, from the theme token. This helper
// is the single place that builds those declarations.
import { describe, expect, it } from 'vitest';
import { ionTone } from './ion-tone.js';

describe('ionTone', () => {
  it('builds a clear-button style from the token chain --ok-* → --ion-color-* → hex', () => {
    expect(ionTone('danger', 'clear')).toBe(
      '--color: var(--ok-danger, var(--ion-color-danger, #c5000f));',
    );
  });

  it('builds a text style for icons and labels', () => {
    expect(ionTone('medium', 'text')).toBe('color: var(--ok-medium, var(--ion-color-medium, #636469));');
  });

  it('builds a solid-button style: background from the tone, text from its contrast token', () => {
    const style = ionTone('danger', 'solid')!;
    expect(style).toContain('--background: var(--ok-danger, var(--ion-color-danger, #c5000f));');
    expect(style).toContain('--color: var(--ok-danger-contrast, var(--ion-color-danger-contrast, #fff));');
    // hover / press / focus follow the tone too — otherwise they flash Ionic's primary blue
    expect(style).toContain('--background-hover: var(--ion-color-danger-tint, var(--ok-danger');
    expect(style).toContain('--background-activated: var(--ion-color-danger-shade, var(--ok-danger');
    expect(style).toContain('--background-focused: var(--ion-color-danger-shade, var(--ok-danger');
  });

  it('uses a dark contrast on light tones (warning, success, light)', () => {
    expect(ionTone('warning', 'solid')).toContain('--color: var(--ok-warning-contrast, var(--ion-color-warning-contrast, #000));');
  });

  it('builds an outline-button style: text and border from the tone', () => {
    const style = ionTone('medium', 'outline')!;
    expect(style).toContain('--color: var(--ok-medium, var(--ion-color-medium, #636469));');
    expect(style).toContain('--border-color: var(--ok-medium, var(--ion-color-medium, #636469));');
    expect(style).toContain('--background-activated: var(--ok-medium, var(--ion-color-medium, #636469));');
    expect(style).toContain('--background-focused: var(--ok-medium, var(--ion-color-medium, #636469));');
  });

  it('keeps a custom theme colour working for solid buttons, contrast included', () => {
    expect(ionTone('brand', 'solid')).toContain('--color: var(--ok-brand-contrast, var(--ion-color-brand-contrast));');
  });

  it('keeps a custom theme color (no hex fallback known) working through its --ion-color-* token', () => {
    expect(ionTone('brand', 'text')).toBe('color: var(--ok-brand, var(--ion-color-brand));');
  });

  it('returns undefined when there is no tone, so the caller renders nothing', () => {
    expect(ionTone(undefined, 'text')).toBeUndefined();
    expect(ionTone('', 'clear')).toBeUndefined();
  });

  it('refuses anything that is not a plain color name (no CSS injection through a prop)', () => {
    expect(ionTone('red; background: url(x)', 'text')).toBeUndefined();
    expect(ionTone('Danger', 'text')).toBeUndefined();
    expect(ionTone('red; background: url(x)', 'solid')).toBeUndefined();
  });
});
