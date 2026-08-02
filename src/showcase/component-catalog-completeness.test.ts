import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// @ts-expect-error El catálogo del showcase es JavaScript deliberadamente simple.
import { COMPONENTS } from '../../showcase/components-data.js';

describe('catálogo de componentes OutfitKit', () => {
  it('documenta cada Web Component que forma parte de src/components', () => {
    const sourceComponents = readdirSync(resolve(process.cwd(), 'src/components'))
      .sort();
    const documentedComponents = new Set(COMPONENTS.map(({ id }: { id: string }) => id));

    expect(sourceComponents.filter((id) => !documentedComponents.has(id))).toEqual([]);
  });
});
