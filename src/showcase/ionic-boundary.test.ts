import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// @ts-expect-error — datos JS del showcase.
import { IONIC_RECIPES } from '../../showcase/ionic-recipes-data.js';
// @ts-expect-error — datos JS del showcase.
import { COMPONENTS } from '../../showcase/components-data.js';

const replacedByIonic = [
  'ok-drawer',
  'ok-skeleton',
  'ok-date-picker',
  'ok-time-picker',
  'ok-range-dual',
];

describe('frontera Ionic / OutfitKit', () => {
  it('no exporta wrappers cuando Ionic ya cubre el patrón', () => {
    const packageJson = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    for (const id of replacedByIonic) {
      expect(packageJson.exports[`./${id}`], id).toBeUndefined();
      expect(
        existsSync(resolve(process.cwd(), 'src', 'components', id)),
        id,
      ).toBe(false);
      expect(COMPONENTS.some((component: { id: string }) => component.id === id), id).toBe(false);
    }
  });

  it('enseña el equivalente Ionic que usa ERPlora', () => {
    expect(IONIC_RECIPES.map((recipe: { id: string }) => recipe.id)).toEqual([
      'ionic-drawer',
      'ionic-skeleton',
      'ionic-date-time',
      'ionic-range-dual',
    ]);
    expect(IONIC_RECIPES.every((recipe: { code: string }) => recipe.code.includes('<ion-'))).toBe(true);
  });
});
