import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

interface GeneratedModulePage {
  id: string;
  name: string;
  icon: string;
  surface: 'modules';
  section: string;
  moduleId: string;
  navId: string;
  component: string;
  source: string;
  route: string;
  parity: 'source' | 'current';
  file?: string;
}

// @ts-expect-error Catálogo JavaScript generado para el navegador.
import { MODULE_PAGES } from '../../showcase/module-pages-data.js';

const temporaryDirectories: string[] = [];

function fixtureRoot(): string {
  const root = mkdtempSync(join(tmpdir(), 'outfitkit-module-pages-'));
  temporaryDirectories.push(root);
  return root;
}

function addModule(
  modulesDirectory: string,
  directoryName: string,
  manifest: Record<string, unknown> | null,
  locale: Record<string, unknown> = {},
  components: string[] = [],
): void {
  const moduleDirectory = join(modulesDirectory, directoryName);
  mkdirSync(join(moduleDirectory, 'locales'), { recursive: true });
  mkdirSync(join(moduleDirectory, 'ui', 'components'), { recursive: true });

  if (manifest) {
    writeFileSync(join(moduleDirectory, 'module.json'), JSON.stringify(manifest));
  } else {
    writeFileSync(join(moduleDirectory, 'module.json.archived'), '{}');
  }
  writeFileSync(join(moduleDirectory, 'locales', 'es.json'), JSON.stringify(locale));

  for (const component of components) {
    const componentDirectory = join(moduleDirectory, 'ui', 'components', component);
    mkdirSync(componentDirectory, { recursive: true });
    writeFileSync(join(componentDirectory, `${component}.ts`), `// ${component}\n`);
  }
}

function parseGeneratedModulePages(outputFile: string): GeneratedModulePage[] {
  const source = readFileSync(outputFile, 'utf8');
  const match = source.match(/export const MODULE_PAGES = (\[[\s\S]*\]);\s*$/);
  if (!match) throw new Error('El catálogo generado no exporta MODULE_PAGES como datos estáticos');
  return JSON.parse(match[1]) as GeneratedModulePage[];
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    rmSync(directory, { recursive: true, force: true });
  }
});

describe('generate-module-pages', () => {
  it('conserva la demo verificada de Inventario al regenerar el catálogo real', () => {
    expect(MODULE_PAGES.find(({ id }: { id: string }) => id === 'module-inventory-products')).toMatchObject({
      route: '/m/inventory/products',
      component: 'erp-inventory-products',
      file: 'pages/module-inventory-products.html',
      parity: 'current',
    });
  });

  it('genera solo páginas navegables reales, localizadas y consolidadas por componente', () => {
    const root = fixtureRoot();
    const modulesDirectory = join(root, 'modules');
    const outputFile = join(root, 'module-pages-data.js');
    mkdirSync(modulesDirectory, { recursive: true });

    addModule(
      modulesDirectory,
      'schedules',
      {
        id: 'schedules',
        name: 'Schedules',
        navigation: [
          { id: 'hours', label: 'Hours', icon: 'time-outline', component: 'erp-schedules-hours' },
          { id: 'special_days', label: 'Special days', icon: 'star-outline', component: 'erp-schedules-hours' },
          { id: 'settings', label: 'Settings', icon: 'settings-outline', component: 'erp-schedules-hours' },
        ],
      },
      {
        name: 'Horarios',
        navigation: {
          hours: { label: 'Horario' },
          special_days: { label: 'Días especiales' },
          settings: { label: 'Ajustes' },
        },
      },
      ['erp-schedules-hours', 'erp-schedules-orphan'],
    );
    addModule(
      modulesDirectory,
      'tables',
      {
        id: 'tables',
        name: 'Tables',
        navigation: [
          { id: 'floor_plan', label: 'Floor plan', icon: 'map-outline', component: 'erp-tables-canvas' },
          { id: 'zones', label: 'Zones', icon: 'layers-outline', component: 'erp-tables-floor-plan' },
          { id: 'tables', label: 'Tables', icon: 'grid-outline', component: 'erp-tables-floor-plan' },
        ],
      },
      {
        name: 'Mesas',
        navigation: {
          floor_plan: { label: 'Plano de sala' },
          zones: { label: 'Zonas' },
          tables: { label: 'Mesas' },
        },
      },
      ['erp-tables-canvas', 'erp-tables-floor-plan'],
    );
    addModule(modulesDirectory, 'kitchen_orders', null, { name: 'Cocina antigua' }, ['erp-kitchen-orders-active']);

    execFileSync(process.execPath, [
      resolve(process.cwd(), 'scripts/generate-module-pages.mjs'),
      '--modules-dir',
      modulesDirectory,
      '--out',
      outputFile,
    ]);

    const pages = parseGeneratedModulePages(outputFile);

    expect(pages).toHaveLength(3);
    expect(pages.map(({ component }) => component)).toEqual([
      'erp-schedules-hours',
      'erp-tables-canvas',
      'erp-tables-floor-plan',
    ]);
    expect(pages[0]).toEqual({
      id: 'module-schedules-hours',
      name: 'Horario',
      icon: 'time-outline',
      surface: 'modules',
      section: 'Horarios',
      moduleId: 'schedules',
      navId: 'hours',
      component: 'erp-schedules-hours',
      source: 'modules-workspace/modules/schedules/ui/components/erp-schedules-hours/erp-schedules-hours.ts',
      route: '/m/schedules/hours',
      file: 'pages/module-schedules-hours.html',
      parity: 'current',
    });
    expect(pages.some(({ moduleId }) => moduleId === 'kitchen_orders')).toBe(false);
    expect(pages.some(({ component }) => component === 'erp-schedules-orphan')).toBe(false);
    expect(pages.map(({ file }) => file)).toEqual([
      'pages/module-schedules-hours.html',
      'pages/module-tables-floor-plan.html',
      'pages/module-tables-zones.html',
    ]);
  });
});
