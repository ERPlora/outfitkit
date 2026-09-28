// @vitest-environment happy-dom
// @suite parity — runs the Comandas demo of the showcase and holds its «New order» panel against the
// REAL kitchen module (`modules-workspace/modules/kitchen`). Parity job only (outfitkit#66).
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

// outfitkit#233 — kitchen#128 (kitchen#122) moved the quick add of Comandas from a form ABOVE the
// list into the table's own «+ Nueva comanda» create panel (`addable` + `<form slot="create">`), as
// in Estaciones. The demo kept the old form over the table, and its parity test demanded it. These
// tests RUN the demo and compare its panel with the module component and its catalogue.

const here = dirname(fileURLToPath(import.meta.url));
const read = (path: string): string => readFileSync(resolve(here, path), 'utf8');

const moduleDir = '../../../modules-workspace/modules/kitchen/';
const pagePath = '../../showcase/pages/module-kitchen-active.html';
const component = read(`${moduleDir}ui/components/erp-kitchen-orders-active/erp-kitchen-orders-active.ts`);
const enumsSource = read(`${moduleDir}ui/lib/enums.ts`);
const es = (JSON.parse(read(`${moduleDir}locales/es.json`)) as { ui: Record<string, string> }).ui;

type Row = Record<string, unknown>;
type HubPage = { body: string; setup: (doc: Document) => void };
type Detail = { name: string; payload?: Record<string, unknown>; params?: Record<string, unknown> };
type Table = HTMLElement & {
  rows: Row[];
  page: number;
  addable?: boolean;
  labels?: Record<string, string>;
  close?: () => void;
};
type Field = HTMLElement & { value?: unknown };

let listeners = new AbortController();

afterEach(() => {
  listeners.abort();
  listeners = new AbortController();
  document.body.innerHTML = '';
});

/** Runs the page's module script with a `defineHubPage` that only captures the page. */
function mountDemo() {
  const page = read(pagePath);
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
  const table = document.getElementById('kitchen-active-table') as Table;
  // ok-data-table is not registered in this harness: closing its drawer is the component's business.
  let closed = 0;
  Object.assign(table, { close: () => (closed += 1) });
  return { table, commands, queries, closes: () => closed };
}

/** The create form the demo projects into the table (there must be exactly one). */
function createForm(table: Table): HTMLFormElement {
  const forms = [...document.querySelectorAll('form')];
  expect(forms, 'the only form of the page is the table create panel').toHaveLength(1);
  const form = forms[0] as HTMLFormElement;
  expect(form.parentElement).toBe(table);
  expect(form.getAttribute('slot')).toBe('create');
  return form;
}

function field(form: HTMLElement, tag: 'ion-select' | 'ion-input'): Field {
  const found = form.querySelectorAll(tag);
  expect(found, `the create panel has one ${tag}`).toHaveLength(1);
  return found[0] as Field;
}

function submit(form: HTMLElement): void {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

/** `ui.<key>` resolved in the module's Spanish catalogue. */
function word(key: string): string {
  const text = es[key.replace(/^ui\./, '')];
  expect(text, `locales/es.json must hold ${key}`).toBeTruthy();
  return text;
}

describe('showcase kitchen Comandas — the list cells are the module ones', () => {
  it('paints priority and status as the module text, not as badges it does not have', () => {
    // kitchen#108: the module paints both cells through `format` (catalogue text, no `render`). The
    // demo painted an ion-badge instead, which the table clipped mid-word («En preparació») at 768 px.
    const { table } = mountDemo();
    const columns = (table as unknown as { columns: Array<Record<string, unknown>> }).columns;
    for (const [key, source] of [
      ['priority', 'PRIORITY_KEY'],
      ['status', 'STATUS_KEY'],
    ] as const) {
      const moduleColumn = component.match(new RegExp(`key: '${key}',[\\s\\S]*?\\n    \\},`))![0];
      expect(moduleColumn).toContain(`format: (r) => enumLabel(${source}, r.${key})`);
      expect(moduleColumn).not.toContain('render:');

      const column = columns.find((candidate) => candidate.key === key)!;
      expect(column.render, `the demo ${key} cell must not render a badge`).toBeUndefined();
      const keys = [...enumsSource.match(new RegExp(`export const ${source}[^{]*\\{([^}]*)\\}`))![1].matchAll(/(\w+): '(ui\.\w+)'/g)];
      expect(keys.length).toBeGreaterThan(1);
      for (const [, value, catalogueKey] of keys) {
        expect((column.format as (row: Row) => string)({ [key]: value })).toBe(word(catalogueKey));
      }
    }
  });
});

describe('showcase kitchen Comandas — a new order is created from the table panel, as in the module', () => {
  it('opens the panel from the toolbar button the module names, and nothing sits over the list', () => {
    const labels = component.match(/\.labels=\$\{\{ add: t\('(ui\.\w+)'\), newRecord: t\('(ui\.\w+)'\) \}\}/);
    expect(labels, 'the module names its add button and panel through .labels').not.toBeNull();
    expect(component).toContain('.addable=${true}');
    expect(component).toContain('<form slot="create"');

    const { table } = mountDemo();
    expect(table.addable).toBe(true);
    expect(table.labels).toEqual({ add: word(labels![1]), newRecord: word(labels![2]) });
    createForm(table);
    // Only the table (with its panel inside) lives in the page: no quick add above the list.
    const page = table.parentElement!;
    expect([...page.children].map((child) => child.tagName.toLowerCase())).toEqual(['ok-data-table']);
  });

  it('asks for the same fields, with the same words, as the module panel', () => {
    const moduleForm = component.match(/<form slot="create"[\s\S]*?<\/form>/)![0];
    const { table } = mountDemo();
    const form = createForm(table);

    const type = field(form, 'ion-select');
    const typeLabel = moduleForm.match(/<ion-select\b[^>]*\blabel=\$\{t\('(ui\.\w+)'\)\}/)![1];
    expect(type.getAttribute('label')).toBe(word(typeLabel));
    expect(type.getAttribute('label-placement')).toBe('stacked');
    // The picker opens on the module default (DEFAULT_ORDER_TYPE) — never blank: order_type is required.
    const fallback = component.match(/const DEFAULT_ORDER_TYPE = '(\w+)';/)![1];
    expect(String(type.getAttribute('value'))).toBe(fallback);
    const typeKeys = [...enumsSource.match(/export const ORDER_TYPE_KEY[^{]*\{([^}]*)\}/)![1].matchAll(/(\w+): '(ui\.\w+)'/g)];
    expect(moduleForm).toContain('enumOptions(ORDER_TYPE_KEY)');
    const options = [...type.querySelectorAll('ion-select-option')].map((option) => [
      option.getAttribute('value'),
      option.textContent!.trim(),
    ]);
    expect(options).toEqual(typeKeys.map(([, value, key]) => [value, word(key)]));

    const notes = field(form, 'ion-input');
    const notesTag = moduleForm.match(/<ion-input\b[^>]*>/)![0];
    expect(notes.getAttribute('label')).toBe(word(notesTag.match(/\blabel=\$\{t\('(ui\.\w+)'\)\}/)![1]));
    expect(notes.getAttribute('placeholder')).toBe(word(notesTag.match(/\bplaceholder=\$\{t\('(ui\.\w+)'\)\}/)![1]));
    expect(notes.getAttribute('label-placement')).toBe('stacked');

    const submitKey = moduleForm.match(/t\('(ui\.\w+)'\)\}<\/ion-button>/)![1];
    expect(submitKey).toBe('ui.createOrder');
    const buttons = [...form.querySelectorAll('ion-button')];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].getAttribute('type')).toBe('submit');
    expect(buttons[0].textContent!.trim()).toBe(word(submitKey));
    // Two different words: the toolbar button opens the panel, this one creates the order.
    expect(word(submitKey)).not.toBe(table.labels?.add);
  });

  it('creates the order with the chosen type, closes the panel and shows it first in the list', () => {
    const { table, commands, queries, closes } = mountDemo();
    const form = createForm(table);
    const type = field(form, 'ion-select');
    const notes = field(form, 'ion-input');
    const before = table.rows.length;
    // From another page: the module reloads the list, and the new order shows on the first one.
    table.dispatchEvent(new CustomEvent('pageChange', { detail: 1 }));
    expect(table.rows).toEqual([]);
    type.value = 'takeaway';
    type.dispatchEvent(new CustomEvent('ionChange', { detail: { value: 'takeaway' }, bubbles: true }));
    notes.value = '  Sin gluten  ';
    const queriesBefore = queries.length;

    submit(form);

    // Same payload as the module createOrder(): notes trimmed, priority normal, no items yet.
    expect(commands).toEqual([
      { name: 'kitchen.orders.create', payload: { order_type: 'takeaway', priority: 'normal', notes: 'Sin gluten', items: [] } },
    ]);
    expect(closes(), 'the panel closes once the order exists').toBe(1);
    expect(queries.length, 'the list is reloaded').toBe(queriesBefore + 1);
    expect(queries.at(-1)!.name).toBe('kitchen.orders.list');
    expect(table.rows).toHaveLength(before + 1);
    expect(table.rows[0]).toMatchObject({ order_type: 'takeaway', status: 'pending', notes: 'Sin gluten' });
    expect(table.page).toBe(0);
    // The module clears the notes and keeps the chosen type for the next ticket.
    expect(notes.value).toBe('');
    expect(type.value).toBe('takeaway');
    // The module says nothing else on success: the panel closes over the new row. No invented toast.
    expect(document.querySelector('ion-toast')).toBeNull();
  });
});
