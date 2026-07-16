// Guard de las PALETAS DE TEMA (src/theme/palettes.css) — el contrato que blinda:
//
//   1. Existen EXACTAMENTE las 6 paletas traídas del showcase ERPlora/ux (terracotta,
//      corporate, minimal, forest, ocean, violet). La marca ERPlora (azul #1496d6) NO es
//      una paleta: es el default de erplora.css y se activa QUITANDO el atributo.
//   2. Cada paleta define su bloque claro `:root[data-ok-palette="id"]` Y su bloque oscuro
//      `:root.ion-palette-dark[data-ok-palette="id"]`.
//   3. Los DOS bloques definen el MISMO set de tokens --ion-* requeridos. Esto no es
//      cosmético: el bloque claro de una paleta (especificidad 0,2,0) empata con el oscuro
//      base de erplora.css (`:root.ion-palette-dark`, 0,2,0) y, al cargar después, LO PISA.
//      Solo el bloque oscuro de la paleta (0,3,0) lo corrige — si a ese bloque le falta un
//      token que el claro sí define, ese token se queda en su valor CLARO en modo oscuro.
//   4. El primario claro de cada paleta es EXACTAMENTE la marca del manifest de ERPlora/ux
//      (lib/templates/manifest.json) — la identidad visual no se degrada en silencio.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync(new URL('./palettes.css', import.meta.url), 'utf8');

const PALETTES = ['terracotta', 'corporate', 'minimal', 'forest', 'ocean', 'violet'] as const;

/** Marca (primario CLARO) por paleta — del manifest de ERPlora/ux (oklch → hex sRGB). */
const BRAND: Record<(typeof PALETTES)[number], string> = {
  terracotta: '#E8552A',
  corporate: '#0F3F9C',
  minimal: '#111111',
  forest: '#1F542A',
  ocean: '#008CBD',
  violet: '#742AD9',
};

/** Tokens que TODO bloque de paleta (claro y oscuro) debe definir. */
const REQUIRED_TOKENS = [
  '--ion-color-primary',
  '--ion-color-primary-rgb',
  '--ion-color-primary-contrast',
  '--ion-color-primary-shade',
  '--ion-color-primary-tint',
  '--ion-background-color',
  '--ion-background-color-rgb',
  '--ion-text-color',
  '--ion-text-color-rgb',
  '--ion-color-medium',
  '--ion-color-medium-rgb',
  '--ion-item-background',
  '--ion-card-background',
  '--ion-border-color',
  '--ion-color-step-50',
  '--ion-color-step-100',
  '--ion-color-step-150',
  '--ion-color-step-200',
  '--ion-color-step-250',
  '--ion-color-step-300',
  '--ion-color-step-500',
  '--ion-color-step-700',
  '--ion-color-step-850',
];

/** Extrae los bloques `selector { cuerpo }` del CSS (plano, sin anidación). */
function blocks(source: string): Map<string, string> {
  const out = new Map<string, string>();
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const selector = m[1].replace(/\/\*[\s\S]*?\*\//g, '').trim();
    if (selector) out.set(selector, (out.get(selector) ?? '') + m[2]);
  }
  return out;
}

const parsed = blocks(css);
const light = (id: string) => parsed.get(`:root[data-ok-palette='${id}']`) ?? parsed.get(`:root[data-ok-palette="${id}"]`);
const dark = (id: string) =>
  parsed.get(`:root.ion-palette-dark[data-ok-palette='${id}']`) ??
  parsed.get(`:root.ion-palette-dark[data-ok-palette="${id}"]`);

describe('palettes.css — contrato de paletas', () => {
  it('no define una paleta "erplora" (el default es SIN atributo)', () => {
    expect(css).not.toMatch(/data-ok-palette=["']erplora["']/);
  });

  for (const id of PALETTES) {
    describe(id, () => {
      it('tiene bloque claro y bloque oscuro', () => {
        expect(light(id), `falta :root[data-ok-palette="${id}"]`).toBeTruthy();
        expect(dark(id), `falta :root.ion-palette-dark[data-ok-palette="${id}"]`).toBeTruthy();
      });

      it('los dos bloques definen todos los tokens requeridos', () => {
        for (const token of REQUIRED_TOKENS) {
          expect(light(id), `claro sin ${token}`).toContain(`${token}:`);
          expect(dark(id), `oscuro sin ${token}`).toContain(`${token}:`);
        }
      });

      it('el primario claro es la marca del manifest de ux', () => {
        const m = light(id)!.match(/--ion-color-primary:\s*([^;]+);/);
        expect(m?.[1].trim().toUpperCase()).toBe(BRAND[id]);
      });
    });
  }
});
