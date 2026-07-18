import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pagesBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/printing/', import.meta.url);

const pages = {
  settings: new URL('module-printing-printing.html', pagesBase),
  routing: new URL('module-printing-routing.html', pagesBase),
};

const components = {
  settings: readFileSync(
    new URL('ui/components/erp-printing-settings/erp-printing-settings.ts', moduleBase),
    'utf8',
  ),
  routing: readFileSync(
    new URL('ui/components/erp-printing-routing/erp-printing-routing.ts', moduleBase),
    'utf8',
  ),
};

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  queries: Record<string, { list?: {
    page_size: number;
    default_sort: string;
    default_dir: string;
    filters: Record<string, unknown>;
  } }>;
  commands: Record<string, unknown>;
};
const settingsSchema = JSON.parse(
  readFileSync(new URL('schemas/settings_update.json', moduleBase), 'utf8'),
) as { required: string[]; properties: { paper_width: { enum: number[] } } };
const routingSchema = JSON.parse(
  readFileSync(new URL('schemas/routing_set.json', moduleBase), 'utf8'),
) as { required: string[]; properties: { station: { enum: string[] } } };
const settingsFixture = JSON.parse(
  readFileSync(new URL('fixtures/printing.settings.get.json', moduleBase), 'utf8'),
) as Record<string, unknown>[];
const routingFixture = JSON.parse(
  readFileSync(new URL('fixtures/printing.routing.list.json', moduleBase), 'utf8'),
) as Record<string, unknown>[];

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de printing/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function jsonFixture(source: string, name: string): Record<string, unknown>[] {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} debe quedar como JSON auditable`).not.toBeNull();
  return JSON.parse(match![1]) as Record<string, unknown>[];
}

function expectHubIos(page: string, route: string, title: string): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toMatch(/mode=["']md["']/);
  expect(page).not.toContain("mode: 'md'");
}

describe('showcase module-printing-printing — ajustes reales de impresión', () => {
  it('usa el shell Hub iOS y solo piezas Ionic porque esta pantalla no necesita otro hueco', () => {
    const page = pageSource('settings');
    expectHubIos(page, '/m/printing/printing', 'Impresoras');

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set());
    for (const tag of ['ion-input', 'ion-select', 'ion-toggle', 'ion-button', 'ion-list', 'ion-item']) {
      expect(page).toContain(`<${tag}`);
    }
  });

  it('parte exactamente de los ajustes oficiales del módulo', () => {
    const page = pageSource('settings');
    expect(jsonFixture(page, 'SETTINGS_FIXTURE')).toEqual(settingsFixture);
    expect(page).toContain("recordQuery('printing.settings.get'");
  });

  it('expone los seis campos del schema y conserva sus dominios reales', () => {
    const page = pageSource('settings');
    expect(settingsSchema.required).toEqual([
      'receipt_header', 'receipt_footer', 'paper_width', 'auto_print_on_sale',
      'open_drawer_on_sale', 'print_kitchen',
    ]);
    for (const field of settingsSchema.required) {
      expect(components.settings).toContain(field);
      expect(page).toContain(`id="printing-${field.replaceAll('_', '-')}"`);
    }
    expect(settingsSchema.properties.paper_width.enum).toEqual([80, 58]);
    expect(page).toContain('<ion-select-option value="80">80 mm</ion-select-option>');
    expect(page).toContain('<ion-select-option value="58">58 mm</ion-select-option>');
  });

  it('guarda el payload correcto y conserva las acciones reales del Bridge', () => {
    const page = pageSource('settings');
    expect(manifest.commands).toHaveProperty('printing.settings.update');
    expect(page).toContain("recordCommand('printing.settings.update', payload)");
    expect(page).toContain("recordPeripheral('discoverPrinters'");
    expect(page).toContain("recordPeripheral('setDeviceRole'");
    expect(page).toContain("recordPeripheral('testPrint'");
    for (const role of ['receipt', 'kitchen', 'bar', 'label']) {
      expect(page).toContain(`value="${role}"`);
    }
    expect(page).not.toContain('<ok-data-table');
  });
});

describe('showcase module-printing-routing — enrutamiento real', () => {
  it('usa Hub iOS y ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource('routing');
    expectHubIos(page, '/m/printing/routing', 'Enrutamiento');
    expect(page).toContain('<ok-data-table id="printing-routing-table" fill>');

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('parte exactamente de las tres reglas oficiales del fixture', () => {
    const page = pageSource('routing');
    expect(jsonFixture(page, 'ROUTING_FIXTURE')).toEqual(routingFixture);
    expect(page).toContain("recordQuery('printing.routing.list'");
  });

  it('reproduce las columnas, filtro y contrato server-side vigentes', () => {
    const page = pageSource('routing');
    const list = manifest.queries['printing.routing.list'].list!;
    expect(list).toMatchObject({ page_size: 50, default_sort: 'category', default_dir: 'asc' });
    expect(Object.keys(list.filters)).toEqual(['station']);
    for (const key of ['category', 'station']) {
      expect(components.routing).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true', 'fill = true', 'addable = true', 'views = true',
      'cardTitle = (row) =>', "cardIcon = () => 'print-outline'", 'searchable = true',
      'pageSize = 50', "sort = 'category'", "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain("filterType: 'select'");
    expect(page).not.toContain("key: 'category', header: 'Categoría', sortable: true, filterable: true");
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
  });

  it('alta y edición comparten el panel create; borrar usa el command real', () => {
    const page = pageSource('routing');
    expect(routingSchema.required).toEqual(['category', 'station']);
    expect(routingSchema.properties.station.enum).toEqual(['receipt', 'kitchen', 'bar']);
    expect(page).toContain('<form id="printing-routing-form" slot="create"');
    expect(page).toContain("recordCommand('printing.routing.set', payload)");
    expect(page).toContain("recordCommand('printing.routing.remove', { category: row.category })");
    expect(page).toContain("table.open('create')");
    expect(page).toContain('table.close()');
    expect(page).toContain("table.actions = [");
    expect(page).toContain("id: 'edit'");
    expect(page).toContain("id: 'remove'");
  });
});
