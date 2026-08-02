import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/kitchen/', import.meta.url);
const archivedBase = new URL('../../../modules-workspace/_retirados/kitchen_orders/', import.meta.url);

const pages = {
  display: new URL('module-kitchen-display.html', pageBase),
  active: new URL('module-kitchen-active.html', pageBase),
  stations: new URL('module-kitchen-stations.html', pageBase),
};

const components = {
  display: readFileSync(new URL('ui/components/erp-kitchen-display/erp-kitchen-display.ts', moduleBase), 'utf8'),
  active: readFileSync(
    new URL('ui/components/erp-kitchen-orders-active/erp-kitchen-orders-active.ts', moduleBase),
    'utf8',
  ),
  stations: readFileSync(
    new URL('ui/components/erp-kitchen-orders-stations/erp-kitchen-orders-stations.ts', moduleBase),
    'utf8',
  ),
};

const stationComponentTest = readFileSync(
  new URL('ui/components/erp-kitchen-orders-stations/erp-kitchen-orders-stations.test.ts', moduleBase),
  'utf8',
);
const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  navigation: Array<{ id: string; component: string }>;
  queries: Record<string, { list?: { page_size: number; default_sort: string; default_dir: string } }>;
  commands: Record<string, unknown>;
};
const createOrderSchema = JSON.parse(readFileSync(new URL('schemas/order_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { order_type: { enum: string[] }; priority: { enum: string[] } };
};
const statusSchema = JSON.parse(
  readFileSync(new URL('schemas/order_set_status.json', moduleBase), 'utf8'),
) as { required: string[]; properties: { action_name: { enum: string[] } } };
const settingsSchema = JSON.parse(
  readFileSync(new URL('schemas/settings_update.json', moduleBase), 'utf8'),
) as { required: string[] };

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de kitchen/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function jsonFixture(source: string, name: string): Record<string, unknown>[] {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} debe quedar como JSON auditable`).not.toBeNull();
  return JSON.parse(match![1]) as Record<string, unknown>[];
}

function expectSharedPage(page: string, route: string, title: string, tableId: string): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${tableId}"`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toMatch(/mode=["']md["']/);

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  for (const property of [
    'serverSide = true',
    'views = true',
    'cardTitle = (row) =>',
    'cardIcon = () =>',
    'searchable = true',
    'pageSize = 50',
  ]) {
    expect(page).toContain(property);
  }
  for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
    expect(page).toContain(`addEventListener('${event}'`);
  }
}

describe('showcase kitchen — inventario canónico tras la fusión', () => {
  it('expone exactamente display, comandas y estaciones desde kitchen', () => {
    expect(manifest.navigation.map(({ id, component }) => ({ id, component }))).toEqual([
      { id: 'display', component: 'erp-kitchen-display' },
      { id: 'active', component: 'erp-kitchen-orders-active' },
      { id: 'stations', component: 'erp-kitchen-orders-stations' },
    ]);
    expectSharedPage(pageSource('display'), '/m/kitchen/display', 'Pantalla', 'kitchen-display-table');
    expectSharedPage(pageSource('active'), '/m/kitchen/active', 'Comandas', 'kitchen-active-table');
    expectSharedPage(pageSource('stations'), '/m/kitchen/stations', 'Estaciones', 'kitchen-stations-table');
  });

  it('no resucita kitchen_orders: el repo antiguo carece de manifest instalable', () => {
    expect(existsSync(new URL('module.json', archivedBase))).toBe(false);
    expect(existsSync(new URL('module.json.archived', archivedBase))).toBe(true);
    expect(readFileSync(new URL('ARCHIVED.md', archivedBase), 'utf8')).toContain('fusionó en `kitchen`');
    for (const page of Object.values(pages)) {
      expect(page.pathname).not.toContain('kitchen-orders-');
    }
  });
});

describe('showcase module-kitchen-display — actividad y ajustes reales', () => {
  it('reproduce las cuatro columnas de auditoría y sus filtros cerrados', () => {
    const page = pageSource('display');
    for (const key of ['action', 'order_id', 'notes', 'created_at']) {
      expect(components.display).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const action of ['received', 'started', 'bumped', 'served', 'recalled', 'cancelled']) {
      expect(page).toContain(`value: '${action}'`);
    }
    expect(page).toContain("sort = 'created_at'");
    expect(page).toContain("sortDir = 'desc'");
    expect(page).toContain("searchPlaceholder = 'Buscar acción, comanda o notas…'");
    expect(page).toContain("cardIcon = () => 'restaurant-outline'");
    expect(manifest.queries['kitchen.logs.list'].list).toMatchObject({
      page_size: 50,
      default_sort: 'created_at',
      default_dir: 'desc',
    });
  });

  it('usa controles Ionic para el snapshot completo de ajustes', () => {
    const page = pageSource('display');
    expect(settingsSchema.required).toHaveLength(16);
    for (const field of settingsSchema.required.filter((key) => key !== 'default_order_type')) {
      expect(page).toContain(`['${field}',`);
    }
    expect(page).toContain('id="kitchen-setting-${key.replaceAll(\'_\', \'-\')}"');
    expect(page).toContain('id="kitchen-setting-default-order-type"');
    expect(page).toContain('id="kitchen-settings-toggle"');
    expect(page).toContain('id="kitchen-settings-panel"');
    expect(page).toContain("recordQuery('kitchen.settings.get'");
    expect(page).toContain("recordCommand('kitchen.settings.update'");
    expect(manifest.commands).toHaveProperty('kitchen.settings.update');
    expect(page).not.toContain('<ok-form');
  });
});

describe('showcase module-kitchen-active — comandas reales', () => {
  it('conserva columnas, dominios y las cinco transiciones del componente', () => {
    const page = pageSource('active');
    for (const key of ['order_number', 'label', 'order_type', 'priority', 'status', 'total']) {
      expect(components.active).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(createOrderSchema.required).toEqual(['order_type']);
    expect(createOrderSchema.properties.order_type.enum).toEqual(['dine_in', 'takeaway', 'delivery']);
    expect(createOrderSchema.properties.priority.enum).toEqual(['normal', 'rush', 'vip']);
    expect(statusSchema.required).toEqual(['order_id', 'action_name']);
    expect(statusSchema.properties.action_name.enum).toEqual([
      'fire',
      'mark_ready',
      'mark_served',
      'cancel',
      'recall',
    ]);
    for (const action of statusSchema.properties.action_name.enum) {
      expect(page).toContain(`id: '${action}'`);
    }
    expect(page).toContain("cardIcon = () => 'restaurant-outline'");
    expect(page).toContain("sort = 'created_at'");
    expect(page).toContain("sortDir = 'desc'");
  });

  it('mantiene el alta Ionic fuera de la tabla y conecta las órdenes del módulo', () => {
    const page = pageSource('active');
    expect(page).toContain('<form id="kitchen-order-form"');
    expect(page.indexOf('<form id="kitchen-order-form"')).toBeLessThan(
      page.indexOf('<ok-data-table id="kitchen-active-table"'),
    );
    expect(page).not.toContain('slot="create"');
    for (const field of ['kitchen-order-type', 'kitchen-order-notes']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain("recordCommand('kitchen.orders.create'");
    expect(page).toContain("recordCommand('kitchen.orders.set_status'");
    expect(manifest.commands).toHaveProperty('kitchen.orders.create');
    expect(manifest.commands).toHaveProperty('kitchen.orders.set_status');
  });
});

describe('showcase module-kitchen-stations — CRUD y enrutado reales', () => {
  it('parte de la estación canónica de la prueba oficial', () => {
    const rows = jsonFixture(pageSource('stations'), 'STATION_FIXTURE');
    expect(stationComponentTest).toContain("name: 'Plancha'");
    expect(rows).toEqual([
      {
        id: 'st1',
        name: 'Plancha',
        color: '#F97316',
        icon: 'flame',
        printer_name: 'COCINA-1',
        is_active: 1,
        pending_count: 3,
      },
    ]);
  });

  it('mantiene la tabla rellena, el alta en su panel y los filtros reales', () => {
    const page = pageSource('stations');
    for (const key of ['name', 'printer_name', 'pending_count', 'is_active']) {
      expect(components.stations).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain('<ok-data-table id="kitchen-stations-table" fill>');
    expect(page).toContain('fill = true');
    expect(page).toContain('addable = true');
    expect(page).toContain('<form id="kitchen-station-create" slot="create"');
    expect(page).toContain("options: [{ value: '1', label: 'Sí' }, { value: '0', label: 'No' }]");
    expect(page).toContain("cardIcon = () => 'flame-outline'");
    expect(page).toContain("sort = 'name'");
    expect(page).toContain("sortDir = 'asc'");
  });

  it('conserva editar, enrutar y borrar sin inventar acciones', () => {
    const page = pageSource('stations');
    for (const action of ['edit', 'route', 'delete']) {
      expect(page).toContain(`id: '${action}'`);
    }
    expect(page).not.toMatch(/id:\s*['"](?:duplicate|archive|activate)['"]/);
    expect(page).toContain('id="kitchen-station-edit"');
    expect(page).toContain('id="kitchen-routing-form"');
    for (const command of [
      'kitchen.stations.create',
      'kitchen.stations.update',
      'kitchen.stations.delete',
      'kitchen.stations.set_routing',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
    }
  });
});
