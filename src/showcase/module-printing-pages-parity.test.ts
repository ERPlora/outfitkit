// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pagesBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/printing/', import.meta.url);

const pages = {
  settings: new URL('module-printing-printing.html', pagesBase),
};

const components = {
  settings: readFileSync(
    new URL('ui/components/erp-printing-settings/erp-printing-settings.ts', moduleBase),
    'utf8',
  ),
};

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  navigation: Array<{ id: string; component: string }>;
  queries: Record<string, unknown>;
  commands: Record<string, unknown>;
};
const settingsSchema = JSON.parse(
  readFileSync(new URL('schemas/settings_update.json', moduleBase), 'utf8'),
) as { required: string[]; properties: { paper_width: { enum: number[] } } };
const settingsFixture = JSON.parse(
  readFileSync(new URL('fixtures/printing.settings.get.json', moduleBase), 'utf8'),
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

// La pestaña «Enrutamiento» se RETIRÓ del módulo (printing#25 → PR #27: superficie muerta
// publicada al comerciante). Su demo del showcase se fue con ella. Este test es lo que queda
// de la paridad: si el módulo vuelve a declarar la ruta, el showcase tiene que volver a
// tener su demo — y aquí nos enteramos, en vez de descubrirlo con un ENOENT al importar.
describe('showcase module-printing — el enrutamiento retirado no vuelve por la puerta de atrás', () => {
  it('ni el módulo declara la ruta ni el showcase publica su demo', () => {
    expect(manifest.navigation.map((entry) => entry.id)).not.toContain('routing');
    expect(existsSync(new URL('ui/components/erp-printing-routing/erp-printing-routing.ts', moduleBase))).toBe(false);
    expect(existsSync(new URL('module-printing-routing.html', pagesBase))).toBe(false);
  });
});
