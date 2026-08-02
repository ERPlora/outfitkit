import { describe, expect, it } from 'vitest';

// @ts-expect-error — helper JS consumido por el showcase estático.
import { groupPagesBySurface } from '../../showcase/page-navigation.js';

describe('navegación de páginas del showcase', () => {
  it('agrupa primero por producto y después por sección conservando el orden', () => {
    const groups = groupPagesBySurface([
      { id: 'a', surface: 'saas', section: 'Auth' },
      { id: 'b', surface: 'hub', section: 'Principal' },
      { id: 'c', surface: 'saas', section: 'Auth' },
      { id: 'd', surface: 'modules', section: 'Ventas' },
      { id: 'e', surface: 'saas', section: 'Cuenta' },
    ]);

    expect(groups).toEqual([
      {
        surface: 'saas',
        sections: [
          { section: 'Auth', pages: [{ id: 'a', surface: 'saas', section: 'Auth' }, { id: 'c', surface: 'saas', section: 'Auth' }] },
          { section: 'Cuenta', pages: [{ id: 'e', surface: 'saas', section: 'Cuenta' }] },
        ],
      },
      { surface: 'hub', sections: [{ section: 'Principal', pages: [{ id: 'b', surface: 'hub', section: 'Principal' }] }] },
      { surface: 'modules', sections: [{ section: 'Ventas', pages: [{ id: 'd', surface: 'modules', section: 'Ventas' }] }] },
    ]);
  });
});
