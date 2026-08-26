// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/kitchen/', import.meta.url);

const pages = {
  history: new URL('module-kitchen-history.html', pageBase),
  active: new URL('module-kitchen-active.html', pageBase),
  stations: new URL('module-kitchen-stations.html', pageBase),
};

const components = {
  history: readFileSync(new URL('ui/components/erp-kitchen-history/erp-kitchen-history.ts', moduleBase), 'utf8'),
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
  settings: Record<string, string>;
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
  // outfitkit#84 / ADR-0143 (amendment 2026-08-11): the shell stays in ios, but the three form controls
  // that take `fill` MUST declare mode="md" per control (Ionic only implements `fill` in md), exactly as
  // the hub and the SaaS do (hub#760, saas#1080). What is forbidden is switching the PAGE config to md.
  expect(page).not.toMatch(/mode:\s*['"]md['"]/);

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
    // kitchen#4 partió la pestaña: «Pantalla» pasó a ser el KDS (rejilla por estación, bump por
    // línea) y la auditoría salió a «Historial», que estrenó componente. La demo siguió al
    // componente que reproducía; «Pantalla» aún no tiene demo del KDS.
    expect(manifest.navigation.map(({ id, component }) => ({ id, component }))).toEqual([
      { id: 'display', component: 'erp-kitchen-display' },
      { id: 'active', component: 'erp-kitchen-orders-active' },
      { id: 'stations', component: 'erp-kitchen-orders-stations' },
      { id: 'history', component: 'erp-kitchen-history' },
    ]);
    expectSharedPage(pageSource('history'), '/m/kitchen/history', 'Historial', 'kitchen-history-table');
    expectSharedPage(pageSource('active'), '/m/kitchen/active', 'Comandas', 'kitchen-active-table');
    expectSharedPage(pageSource('stations'), '/m/kitchen/stations', 'Estaciones', 'kitchen-stations-table');
  });

  it('no resucita kitchen_orders: ninguna demo publicada monta sus componentes', () => {
    // Antes esto comprobaba el estado del ARCHIVO local `modules-workspace/_retirados/`, que no
    // es un repo ni existe fuera de la máquina de quien lo tenga: en un runner limpio la
    // aserción no puede correr, y una batería que no puede correr no vigila nada (outfitkit#66).
    // Lo que sí es asunto de este repo es que el showcase no publique la superficie retirada.
    for (const page of Object.values(pages)) {
      expect(page.pathname).not.toContain('kitchen-orders-');
    }
    expect(manifest.navigation.map(({ component }) => component)).not.toContain('erp-kitchen-orders');
    for (const file of Object.values(pages)) {
      expect(readFileSync(file, 'utf8')).not.toContain('kitchen_orders');
    }
  });
});

describe('showcase module-kitchen-history — la auditoría real de la línea', () => {
  it('reproduce las cuatro columnas de auditoría y sus filtros cerrados', () => {
    const page = pageSource('history');
    // kitchen#44: la comanda se identifica por su NÚMERO, no por el UUID — nadie casa un UUID a
    // ojo con el tique que tiene delante. El `order_id` sigue siendo el último recurso del format.
    for (const key of ['action', 'order_number', 'notes', 'created_at']) {
      expect(components.history).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    // El bump por línea (kitchen#4) también se audita: dos acciones más que antes.
    // kitchen#44 dejó UN solo mapa acción→clave de etiqueta (`ACTION_LABEL_KEY`) del que salen a la
    // vez el desplegable del filtro y la celda, así que en el módulo la acción ya no se escribe como
    // `value: 'x'` sino como entrada del mapa. Se busca la entrada, no la forma vieja: exigir
    // `value:` obligaría a duplicar la lista, que es justo lo que esa issue quitó.
    for (const action of ['received', 'started', 'bumped', 'item_bumped', 'item_recalled', 'served', 'recalled', 'cancelled']) {
      expect(components.history).toContain(`${action}: 'ui.action`);
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

  it('no reinventa los ajustes de cocina: los sirve el formulario genérico del shell', () => {
    const page = pageSource('history');
    // ADR-0082: el módulo declara `settings` en el manifest y el SHELL pinta el formulario.
    // Ningún componente de kitchen pinta ya uno propio, así que la demo tampoco.
    expect(settingsSchema.required).toHaveLength(16);
    expect(manifest.settings).toMatchObject({
      schema: 'schemas/settings_update.json',
      get: 'kitchen.settings.get',
      set: 'kitchen.settings.update',
    });
    expect(manifest.commands).toHaveProperty('kitchen.settings.update');
    // Ojo: `kitchen.settings.updated` (el EVENTO que el KDS escucha) contiene esta subcadena.
    // Lo que no puede haber es una LLAMADA al command desde un componente del módulo.
    expect(components.history).not.toContain("command('kitchen.settings.update'");
    expect(components.display).not.toContain("command('kitchen.settings.update'");
    expect(page).not.toContain('kitchen-settings-panel');
    expect(page).not.toContain("recordCommand('kitchen.settings.update'");
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
    // kitchen#5: `set_status` lleva SOLO los verbos de `change_order`. Servir y cancelar salieron
    // a comandos propios — la fila sigue ofreciendo las cinco transiciones, por tres puertas.
    expect(statusSchema.properties.action_name.enum).toEqual(['fire', 'mark_ready', 'recall']);
    for (const action of ['fire', 'mark_ready', 'mark_served', 'recall', 'cancel']) {
      expect(components.active).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
    for (const command of ['kitchen.orders.set_status', 'kitchen.orders.mark_served', 'kitchen.orders.cancel']) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
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
    // kitchen#45: una estación es un dato maestro TRADUCIDO — la fila trae su `name` base y su
    // `name_es`, y la vista pinta el del idioma del hub (ADR-0378). La estación canónica de la
    // prueba oficial del módulo es «Bar»/«Barra», no la «Plancha» de antes.
    expect(stationComponentTest).toContain("name: 'Bar', name_es: 'Barra'");
    expect(rows).toEqual([
      {
        id: 'st1',
        name: 'Bar',
        name_es: 'Barra',
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
    for (const key of ['name_es', 'printer_name', 'pending_count', 'is_active']) {
      expect(components.stations).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain('<ok-data-table id="kitchen-stations-table" fill>');
    expect(page).toContain('fill = true');
    expect(page).toContain('addable = true');
    expect(page).toContain('<form id="kitchen-station-create" slot="create"');
    expect(page).toContain("options: [{ value: '1', label: 'Sí' }, { value: '0', label: 'No' }]");
    expect(page).toContain("cardIcon = () => 'flame-outline'");
    expect(page).toContain("sort = 'name_es'");
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
