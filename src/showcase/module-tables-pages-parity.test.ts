import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/tables/', import.meta.url);

const pages = {
  floorPlan: new URL('module-tables-floor-plan.html', pageBase),
  zones: new URL('module-tables-zones.html', pageBase),
};

const components = {
  floorPlan: readFileSync(
    new URL('ui/components/erp-tables-canvas/erp-tables-canvas.ts', moduleBase),
    'utf8',
  ),
  zones: readFileSync(
    new URL('ui/components/erp-tables-floor-plan/erp-tables-floor-plan.ts', moduleBase),
    'utf8',
  ),
};

const componentTest = readFileSync(
  new URL('ui/components/erp-tables-floor-plan/erp-tables-floor-plan.test.ts', moduleBase),
  'utf8',
);

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  navigation: Array<{ id: string; label: string; icon: string; component: string }>;
  queries: Record<string, { list?: { page_size: number; default_sort: string; default_dir: string } }>;
  commands: Record<string, unknown>;
};

const tableCreate = JSON.parse(readFileSync(new URL('schemas/table_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { shape: { enum: string[] } };
};
const tableUpdate = JSON.parse(readFileSync(new URL('schemas/table_update.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { shape: { enum: string[] }; status: { enum: string[] } };
};
const zoneCreate = JSON.parse(readFileSync(new URL('schemas/zone_create.json', moduleBase), 'utf8')) as {
  required: string[];
};

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de tables/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function jsonFixture(source: string, name: string): Record<string, unknown>[] {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} debe quedar como JSON auditable`).not.toBeNull();
  return JSON.parse(match![1]) as Record<string, unknown>[];
}

function expectIonicHubPage(source: string, route: string, title: string): void {
  expect(source).toContain("import { defineHubPage } from './_hub.js'");
  expect(source).toContain(`active: '${route}'`);
  expect(source).toContain(`title: '${title}'`);
  expect(source).toContain('<script src="./_ionic-config.js"></script>');
  expect(source.indexOf('./_ionic-config.js')).toBeLessThan(source.indexOf('@ionic/core'));
  expect(source).not.toMatch(/mode=["']md["']/);
  expect(source).not.toContain("window.Ionic = { config: { mode: 'md' }");
}

describe('showcase tables — rutas reales del manifest', () => {
  it('refleja plano y zonas con sus componentes reales', () => {
    expect(manifest.navigation.slice(0, 2).map(({ id, component }) => ({ id, component }))).toEqual([
      { id: 'floor_plan', component: 'erp-tables-canvas' },
      { id: 'zones', component: 'erp-tables-floor-plan' },
    ]);

    expectIonicHubPage(pageSource('floorPlan'), '/m/tables/floor_plan', 'Plano de sala');
    expectIonicHubPage(pageSource('zones'), '/m/tables/zones', 'Zonas');
  });
});

describe('showcase module-tables-floor-plan — editor visual real', () => {
  it('parte únicamente de los datos canónicos de la prueba oficial', () => {
    const source = pageSource('floorPlan');
    const zones = jsonFixture(source, 'ZONE_FIXTURE');
    const tables = jsonFixture(source, 'TABLE_FIXTURE');

    expect(componentTest).toContain("{ id: 'z1', name: 'Terraza'");
    expect(componentTest).toContain("{ id: 'z2', name: 'Salón'");
    expect(componentTest).toContain("id: 'm1'");
    expect(zones).toEqual([
      { id: 'z1', name: 'Terraza', color: '#0f0', sort_order: 1, is_active: 1 },
      { id: 'z2', name: 'Salón', color: '#00f', sort_order: 2, is_active: 1 },
    ]);
    expect(tables).toEqual([
      {
        id: 'm1',
        number: '12',
        name: '',
        capacity: 4,
        shape: 'square',
        status: 'available',
        is_active: 1,
        zone: 'Terraza',
        zone_id: 'z1',
        position_x: 32,
        position_y: 32,
        width: 72,
        height: 72,
      },
    ]);
  });

  it('reutiliza Ionic y conserva el lienzo de dominio sin inventar componentes OutfitKit', () => {
    const source = pageSource('floorPlan');
    expect(source).toContain('id="tables-floor-plan-canvas"');
    expect(source).toContain('<ion-segment id="tables-floor-plan-zones"');
    expect(source).toContain('<ion-modal id="tables-table-modal"');
    expect(source).toContain('<ion-modal id="tables-zone-modal"');
    expect(source).toContain("const BOX = 72");
    expect(source).toContain("const DRAG_THRESHOLD = 5");
    expect(source).not.toMatch(/<\/?ok-[a-z-]+/);
  });

  it('mantiene dominios, consultas y todas las acciones del canvas real', () => {
    const source = pageSource('floorPlan');
    expect(tableCreate.properties.shape.enum).toEqual(['square', 'round', 'rectangle']);
    expect(tableUpdate.properties.status.enum).toEqual(['available', 'occupied', 'reserved', 'blocked']);
    expect(zoneCreate.required).toEqual(['name', 'description', 'color', 'sort_order']);

    for (const value of tableCreate.properties.shape.enum) expect(source).toContain(`value="${value}"`);
    for (const value of tableUpdate.properties.status.enum) expect(source).toContain(`value="${value}"`);
    for (const query of ['tables.zones.list', 'tables.tables.list', 'tables.zones.get']) {
      expect(source).toContain(`recordQuery('${query}'`);
    }
    for (const command of [
      'tables.zones.create',
      'tables.zones.update',
      'tables.zones.delete',
      'tables.tables.create',
      'tables.tables.update',
      'tables.tables.move',
      'tables.tables.delete',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(source).toContain(`recordCommand('${command}'`);
    }
  });
});

describe('showcase module-tables-zones — lista real de mesas', () => {
  it('no inventa una tabla de zonas: el manifest monta erp-tables-floor-plan, que lista mesas', () => {
    const source = pageSource('zones');
    expect(source).toContain('<ok-data-table id="tables-zones-table" fill>');
    const outfitTags = [...source.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));

    for (const key of ['number', 'name', 'zone', 'capacity', 'status']) {
      expect(components.zones).toContain(`key: '${key}'`);
      expect(source).toContain(`key: '${key}'`);
    }
    expect(source).not.toContain("key: 'color'");
    expect(source).not.toContain("key: 'sort_order'");
  });

  it('conserva el contrato rico de la tabla y el alta rápida en su panel', () => {
    const source = pageSource('zones');
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'searchable = true',
      "searchPlaceholder = 'Buscar mesa o zona…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(source).toContain(property);
    }
    expect(source).toContain('<form id="tables-zone-create" slot="create"');
    expect(source).toContain("recordQuery('tables.tables.list'");
    expect(source).toContain("recordQuery('tables.zones.list'");
    expect(source).toContain("recordCommand('tables.tables.create'");
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(source).toContain(`addEventListener('${event}'`);
    }
    expect(manifest.queries['tables.tables.list'].list).toMatchObject({
      page_size: 50,
      default_sort: 'name',
      default_dir: 'asc',
    });
  });

  it('usa los datos canónicos y no añade acciones que el componente no ofrece', () => {
    const source = pageSource('zones');
    expect(jsonFixture(source, 'ZONE_FIXTURE')).toHaveLength(2);
    expect(jsonFixture(source, 'TABLE_FIXTURE')).toHaveLength(1);
    expect(source).not.toContain('table.actions =');
    expect(source).not.toContain("addEventListener('rowAction'");
  });
});
