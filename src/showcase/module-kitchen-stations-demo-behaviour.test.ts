// @vitest-environment happy-dom
// @suite parity — runs the Stations demo of the showcase and compares what it DOES against the
// REAL kitchen component (`modules-workspace/modules/kitchen`). Parity job only (outfitkit#66).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// outfitkit#229 — whoever uses the Stations demo as a reference got a different screen from the
// module: routing asked for raw product/category IDs, the station was «Barra» in the list but
// «Bar» in the pickers, a row click did nothing and «Cancelar» fell alone to another line. These
// tests RUN the demo script and hold each behaviour against the module component.

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(resolve(here, path), 'utf8');

const page = read('../../showcase/pages/module-kitchen-stations.html');
const moduleDir = '../../../modules-workspace/modules/kitchen/';
const component = read(`${moduleDir}ui/components/erp-kitchen-orders-stations/erp-kitchen-orders-stations.ts`);
const componentTest = read(`${moduleDir}ui/components/erp-kitchen-orders-stations/erp-kitchen-orders-stations.test.ts`);
const es = (JSON.parse(read(`${moduleDir}locales/es.json`)) as { ui: Record<string, string> }).ui;

type HubPage = { body: string; setup: (doc: Document) => void };
type Detail = { name: string; payload?: Record<string, unknown>; params?: Record<string, unknown> };
type Field = HTMLElement & { value?: unknown; disabled?: boolean };
type Table = HTMLElement & {
  rowClickable?: boolean;
  cardTitle: (row: Record<string, unknown>) => string;
  columns: Array<{ key: string; format: (row: Record<string, unknown>) => string }>;
};

let listeners = new AbortController();

afterEach(() => {
  listeners.abort();
  listeners = new AbortController();
  document.body.innerHTML = '';
});

/** Runs the page's module script with a `defineHubPage` that only captures the page. */
function mountDemo() {
  const script = page.match(/<script type="module">([\s\S]*?)<\/script>/)![1];
  const importLine = "import { defineHubPage } from './_hub.js';";
  expect(script).toContain(importLine);
  let hubPage: HubPage | undefined;
  new Function('defineHubPage', script.replace(importLine, ''))((definition: HubPage) => {
    hubPage = definition;
  });
  const commands: Detail[] = [];
  const queries: Detail[] = [];
  const { signal } = listeners;
  document.addEventListener('erplora:preview-command', (e) => commands.push((e as CustomEvent<Detail>).detail), { signal });
  document.addEventListener('erplora:preview-query', (e) => queries.push((e as CustomEvent<Detail>).detail), { signal });
  document.body.innerHTML = hubPage!.body;
  hubPage!.setup(document);
  const el = <T extends HTMLElement = Field>(selector: string) => document.querySelector(selector) as T;
  return { commands, queries, el };
}

function choose(field: Field, value: string): void {
  field.value = value;
  field.dispatchEvent(new CustomEvent('ionChange', { detail: { value }, bubbles: true }));
}

function submit(form: HTMLElement): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

const optionTexts = (select: HTMLElement): string[] =>
  Array.from(select.querySelectorAll('ion-select-option')).map((option) => option.textContent?.trim() ?? '');

/** `{ id: 'p-1', name: 'Alitas de pollo', … }` rows of a fixture array in the module's own test. */
function moduleFixture(name: string): Array<{ id: string; name: string }> {
  const block = componentTest.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\];`))![1];
  return [...block.matchAll(/\{ id: '([^']+)', name: '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }));
}

/** Declarations of the first CSS rule whose selector list is exactly `selector`. */
function declarations(css: string, selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/,\s*/g, ',\\s*');
  const body = css.match(new RegExp(`(?:^|[}\\s])${escaped}\\s*\\{([^}]*)\\}`))?.[1];
  expect(body, `no CSS rule for ${selector}`).toBeTruthy();
  return Object.fromEntries(
    body!
      .split(';')
      .map((decl) => decl.split(':').map((part) => part.trim()))
      .filter(([prop, value]) => prop && value)
      .map(([prop, value]) => [prop, value.replace(/(^|[\s,(])\./g, (_, lead: string) => `${lead}0.`)]),
  );
}

describe('showcase module-kitchen-stations — behaves like the module (outfitkit#229)', () => {
  it('a row click opens that station in the edit panel, as the module wires rowClick', () => {
    expect(component).toContain('.rowClickable=${true}');
    expect(component).toMatch(/@rowClick=\$\{[^\n]{0,200}?actionId: 'edit'/);

    const { el } = mountDemo();
    const table = el<Table>('#kitchen-stations-table');
    const panel = el('#kitchen-station-edit');
    expect(table.rowClickable, 'without rowClickable the row is dead, unlike the module').toBe(true);
    expect(panel.hidden).toBe(true);

    table.dispatchEvent(new CustomEvent('rowClick', { detail: { row: { id: 'st1', name: 'Bar', name_es: 'Barra', is_active: 1 } } }));

    expect(panel.hidden).toBe(false);
    expect(el('#kitchen-station-edit-title').textContent?.trim()).toBe(`${es.editStationTitle} · Barra`);
  });

  it('names the station the same everywhere: list, card, routing picker and edit title', () => {
    expect(component).toContain('${stationName(s)}</ion-select-option>');
    expect(component).toContain("${t('ui.editStationTitle')} · ${stationName(this.editing)}");

    const { el } = mountDemo();
    const table = el<Table>('#kitchen-stations-table');
    const bar = { id: 'st1', name: 'Bar', name_es: 'Barra' };
    const untranslated = { id: 'st2', name: 'Kitchen', name_es: '' };
    expect(table.columns[0].format(bar)).toBe('Barra');
    expect(table.cardTitle(bar)).toBe('Barra');
    expect(optionTexts(el('#kitchen-routing-station'))).toEqual(['Barra']);

    table.dispatchEvent(new CustomEvent('rowAction', { detail: { actionId: 'edit', row: untranslated } }));
    expect(el('#kitchen-station-edit-title').textContent?.trim()).toBe(`${es.editStationTitle} · Kitchen`);
  });

  it('routing picks product and category BY NAME from inventory lists, never a typed ID', () => {
    expect(component).toMatch(/<ion-select data-testid="kitchen-stations-routing-product"[^>]*interface="popover"/);
    expect(component).toMatch(/<ion-select data-testid="kitchen-stations-routing-category"[^>]*interface="popover"/);
    expect(component).toContain("query<InventoryOption[]>('inventory.products.list', { limit: 500 })");
    expect(component).toContain("query<InventoryOption[]>('inventory.categories.list', { limit: 500 })");

    const { el, queries } = mountDemo();
    const form = el('#kitchen-routing-form');
    expect(form.querySelectorAll('ion-input'), 'the demo still asks for raw IDs').toHaveLength(0);
    expect(form.querySelectorAll('ion-select')).toHaveLength(3);

    const cases = [
      { id: '#kitchen-routing-product', label: es.labelProduct, fixture: moduleFixture('PRODUCTS'), query: 'inventory.products.list' },
      { id: '#kitchen-routing-category', label: es.labelCategory, fixture: moduleFixture('CATEGORIES'), query: 'inventory.categories.list' },
    ];
    for (const { id, label, fixture, query } of cases) {
      const select = el(id);
      expect(select.tagName).toBe('ION-SELECT');
      expect(select.getAttribute('interface')).toBe('popover');
      expect(select.getAttribute('label')).toBe(label);
      expect(select.getAttribute('placeholder')).toBe(es.placeholderOptional);
      expect(fixture.length).toBeGreaterThan(0);
      expect(optionTexts(select)).toEqual(fixture.map((row) => row.name));
      expect(Array.from(select.querySelectorAll('ion-select-option')).map((o) => o.getAttribute('value'))).toEqual(
        fixture.map((row) => row.id),
      );
      expect(queries).toContainEqual({ name: query, params: { limit: 500 } });
    }
  });

  it('«Save routing» stays disabled until a station and a product or category are chosen, then sends the chosen ids', () => {
    expect(component).toContain(
      "?disabled=${this.saving || !this.routeStationId || (!this.routeProductId && !this.routeCategoryId)}",
    );

    const { el, commands } = mountDemo();
    const station = el('#kitchen-routing-station');
    const product = el('#kitchen-routing-product');
    const category = el('#kitchen-routing-category');
    const save = el('#kitchen-routing-form ion-button[type="submit"]');
    expect(save.textContent?.trim()).toBe(es.saveRouting);
    expect(save.disabled).toBe(true);

    choose(product, 'p-1');
    expect(save.disabled, 'a product with no station routes nowhere').toBe(true);
    choose(product, '');
    choose(station, 'st1');
    expect(save.disabled, 'a station alone routes nothing').toBe(true);
    choose(category, 'cat-2');
    expect(save.disabled).toBe(false);
    choose(category, '');
    expect(save.disabled).toBe(true);
    choose(product, 'p-1');
    expect(save.disabled).toBe(false);

    submit(el('#kitchen-routing-form'));

    expect(commands).toContainEqual({
      name: 'kitchen.stations.set_routing',
      payload: { station_id: 'st1', product_id: 'p-1', category_id: '' },
    });
    expect(product.value).toBe('');
    expect(category.value).toBe('');
    expect(save.disabled, 'after saving, the pickers are cleared again').toBe(true);
    expect(el('#kitchen-stations-saved').hidden).toBe(false);
    expect(el('#kitchen-stations-saved').textContent?.trim()).toBe(es.routingSaved);
  });

  it('saving a station edit says so on the page, as the module does, and a new action clears it', () => {
    expect(component).toContain("this.formMsg = erplora().t(CATALOG, 'ui.stationUpdated');");

    const { el, commands } = mountDemo();
    const table = el<Table>('#kitchen-stations-table');
    const saved = el('#kitchen-stations-saved');
    expect(saved.hidden).toBe(true);
    expect(page).not.toContain('<ion-toast');

    table.dispatchEvent(new CustomEvent('rowClick', { detail: { row: { id: 'st1', name: 'Bar', name_es: 'Barra', is_active: 1 } } }));
    submit(el('#kitchen-station-edit-form'));

    expect(commands.map((c) => c.name)).toContain('kitchen.stations.update');
    expect(el('#kitchen-station-edit').hidden).toBe(true);
    expect(saved.hidden).toBe(false);
    expect(saved.textContent?.trim()).toBe(es.stationUpdated);

    table.dispatchEvent(new CustomEvent('rowClick', { detail: { row: { id: 'st1', name: 'Bar', name_es: 'Barra', is_active: 1 } } }));
    expect(saved.hidden, 'the message belongs to the previous save').toBe(true);
  });

  it('routing to a row or deleting one clears the previous «saved» message, as the module resets formMsg', () => {
    for (const actionId of ['route', 'delete']) {
      const { el } = mountDemo();
      const table = el<Table>('#kitchen-stations-table');
      choose(el('#kitchen-routing-station'), 'st1');
      choose(el('#kitchen-routing-category'), 'cat-1');
      submit(el('#kitchen-routing-form'));
      expect(el('#kitchen-stations-saved').hidden).toBe(false);

      table.dispatchEvent(new CustomEvent('rowAction', { detail: { actionId, row: { id: 'st1', name: 'Bar', name_es: 'Barra' } } }));
      expect(el('#kitchen-stations-saved').hidden, `${actionId} keeps a stale message`).toBe(true);
      listeners.abort();
      listeners = new AbortController();
    }
  });

  it('«Guardar» and «Cancelar» sit together: the panel forms wrap like the module .form, not a grid', () => {
    const moduleCss = component.match(/static styles = css`([\s\S]*?)`;/)![1];
    const demoCss = page.match(/<style>([\s\S]*?)<\/style>/)![1];
    const moduleForm = declarations(moduleCss, '.form');
    const moduleFields = declarations(moduleCss, '.form ion-input, .form ion-select');

    for (const formId of ['kitchen-station-edit-form', 'kitchen-routing-form']) {
      const formClass = page.match(new RegExp(`<form id="${formId}" class="([\\w-]+)"`))![1];
      const demoForm = declarations(demoCss, `.${formClass}`);
      for (const prop of ['display', 'gap', 'flex-wrap', 'align-items']) {
        expect(demoForm[prop], `${formId} ${prop}`).toBe(moduleForm[prop]);
      }
      expect(demoForm).not.toHaveProperty('grid-template-columns');
      expect(declarations(demoCss, `.${formClass} ion-input, .${formClass} ion-select`)).toEqual(moduleFields);
    }
    // The buttons keep their own width: nothing makes them grow onto a line of their own.
    expect(demoCss).not.toMatch(/panel-form[^{]*ion-button[^{]*\{[^}]*flex/);
  });

  it('the edit and routing panels are the module section.panel, not an ion-card that narrows the form', () => {
    // An ion-card adds its own margin and padding: on an ios phone that pushed «Cancelar» alone
    // onto the next line, where the module keeps it beside «Guardar».
    expect(component).toContain('<section class="panel" data-testid="kitchen-stations-edit-panel">');
    expect(component).toContain("<h3>${t('ui.routingTitle')}</h3>");
    expect(component).not.toContain('<ion-card');
    const moduleCss = component.match(/static styles = css`([\s\S]*?)`;/)![1];
    const demoCss = page.match(/<style>([\s\S]*?)<\/style>/)![1];

    const { el } = mountDemo();
    expect(document.querySelectorAll('ion-card')).toHaveLength(0);
    for (const [panelSelector, title] of [
      ['#kitchen-station-edit', 'Editar estación'],
      ['.kitchen-station-panel:has(#kitchen-routing-form)', es.routingTitle],
    ]) {
      const panel = el(panelSelector);
      expect(panel?.tagName, panelSelector).toBe('SECTION');
      expect(panel.firstElementChild?.tagName).toBe('H3');
      expect(panel.firstElementChild?.textContent?.trim()).toBe(title);
      expect(panel.classList.contains('kitchen-station-panel')).toBe(true);
    }
    expect(declarations(demoCss, '.kitchen-station-panel')).toEqual(declarations(moduleCss, '.panel'));
    expect(declarations(demoCss, '.kitchen-station-panel h3')).toEqual(declarations(moduleCss, 'h3'));
  });
});
