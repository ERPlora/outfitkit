// @vitest-environment happy-dom
//
// ok-theme-picker — selector de tema COMPARTIDO Cloud↔Hub (settings): paleta (swatches) +
// modo claro/oscuro/sistema. Contrato que blindan estos tests:
//
//   1. El componente NO persiste ni toca el <html>: solo emite `ok-change` con
//      {palette, mode}. Quién guarda (cookie/preferencias en Cloud, localStorage/
//      hub_settings en Hub) y quién aplica el atributo es el HOST.
//   2. Las paletas por defecto son EXACTAMENTE las de palettes.css + la marca ERPlora
//      ('erplora', el azul por defecto = quitar el atributo, ver applyPalette).
//   3. `applyPalette(root, id)` es el ÚNICO punto que escribe `data-ok-palette`:
//      'erplora' (o vacío) QUITA el atributo; cualquier otra paleta lo pone.
import { describe, expect, it } from 'vitest';
import './ok-theme-picker.js';
import { DEFAULT_PALETTES, applyPalette } from './ok-theme-picker.js';
import type { OkThemePicker } from './ok-theme-picker.js';

async function mount(attrs: Partial<Pick<OkThemePicker, 'palette' | 'mode' | 'hideMode'>> = {}): Promise<OkThemePicker> {
  const el = document.createElement('ok-theme-picker') as OkThemePicker;
  Object.assign(el, attrs);
  document.body.append(el);
  await el.updateComplete;
  return el;
}

const swatches = (el: OkThemePicker) => [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.swatch')];
const modeBtns = (el: OkThemePicker) => [...el.shadowRoot!.querySelectorAll<HTMLButtonElement>('button.mode')];

describe('paletas por defecto', () => {
  it('DEFAULT_PALETTES = erplora (primera) + las 6 de palettes.css', () => {
    expect(DEFAULT_PALETTES.map((p) => p.id)).toEqual([
      'erplora',
      'terracotta',
      'corporate',
      'minimal',
      'forest',
      'ocean',
      'violet',
    ]);
  });

  it('pinta un swatch por paleta, con nombre accesible', async () => {
    const el = await mount();
    const btns = swatches(el);
    expect(btns).toHaveLength(DEFAULT_PALETTES.length);
    for (const [i, p] of DEFAULT_PALETTES.entries()) {
      expect(btns[i].getAttribute('aria-label')).toBe(p.label);
    }
  });

  it('marca la paleta activa con aria-pressed', async () => {
    const el = await mount({ palette: 'ocean' });
    const pressed = swatches(el).filter((b) => b.getAttribute('aria-pressed') === 'true');
    expect(pressed).toHaveLength(1);
    expect(pressed[0].getAttribute('aria-label')).toBe('Ocean');
  });

  it('sin palette explícita, la activa es erplora', async () => {
    const el = await mount();
    expect(swatches(el)[0].getAttribute('aria-pressed')).toBe('true');
  });
});

describe('selección', () => {
  it('clic en un swatch emite ok-change {palette, mode} y actualiza la prop', async () => {
    const el = await mount({ mode: 'dark' });
    let detail: unknown;
    el.addEventListener('ok-change', (e) => (detail = (e as CustomEvent).detail));
    swatches(el).find((b) => b.getAttribute('aria-label') === 'Violet')!.click();
    expect(detail).toEqual({ palette: 'violet', mode: 'dark' });
    expect(el.palette).toBe('violet');
  });

  it('clic en un modo emite ok-change y actualiza la prop', async () => {
    const el = await mount({ palette: 'forest' });
    let detail: unknown;
    el.addEventListener('ok-change', (e) => (detail = (e as CustomEvent).detail));
    modeBtns(el).find((b) => b.dataset.mode === 'dark')!.click();
    expect(detail).toEqual({ palette: 'forest', mode: 'dark' });
    expect(el.mode).toBe('dark');
  });

  it('los modos son system/light/dark y el activo lleva aria-pressed', async () => {
    const el = await mount({ mode: 'system' });
    expect(modeBtns(el).map((b) => b.dataset.mode)).toEqual(['system', 'light', 'dark']);
    expect(modeBtns(el).find((b) => b.getAttribute('aria-pressed') === 'true')!.dataset.mode).toBe('system');
  });

  it('hide-mode oculta el segmento de modo', async () => {
    const el = await mount({ hideMode: true });
    expect(modeBtns(el)).toHaveLength(0);
  });
});

describe('i18n', () => {
  it('los textos se sobreescriben con .labels', async () => {
    const el = await mount();
    el.labels = { palette: 'Paleta de tema', dark: 'Oscuro' };
    await el.updateComplete;
    expect(el.shadowRoot!.textContent).toContain('Paleta de tema');
    expect(modeBtns(el).find((b) => b.dataset.mode === 'dark')!.textContent).toContain('Oscuro');
  });
});

describe('applyPalette — el único escritor de data-ok-palette', () => {
  it('pone el atributo para una paleta', () => {
    const root = document.createElement('html');
    applyPalette(root, 'ocean');
    expect(root.getAttribute('data-ok-palette')).toBe('ocean');
  });

  it("'erplora' y vacío QUITAN el atributo (default = sin atributo)", () => {
    const root = document.createElement('html');
    root.setAttribute('data-ok-palette', 'ocean');
    applyPalette(root, 'erplora');
    expect(root.hasAttribute('data-ok-palette')).toBe(false);
    root.setAttribute('data-ok-palette', 'ocean');
    applyPalette(root, '');
    expect(root.hasAttribute('data-ok-palette')).toBe(false);
  });
});
