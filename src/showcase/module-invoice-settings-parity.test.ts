import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-invoice-settings.html', import.meta.url);
const component = readFileSync(
  new URL('../../../modules-workspace/modules/invoice/ui/components/erp-invoice-settings/erp-invoice-settings.ts', import.meta.url),
  'utf8',
);
const componentTest = readFileSync(
  new URL('../../../modules-workspace/modules/invoice/ui/components/erp-invoice-settings/erp-invoice-settings.test.ts', import.meta.url),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/invoice/settings').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-invoice-settings — paridad con el módulo real', () => {
  it('usa Hub iOS y solo añade ok-data-table', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/invoice/settings'");
    expect(page).toContain("title: 'Ajustes de facturación'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('conserva las ocho columnas, tipos y filtros reales', () => {
    const page = pageSource();
    for (const key of ['code', 'name', 'invoice_type', 'year', 'prefix', 'current_number', 'is_active', 'is_default']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const code of ['F1', 'F2', 'F3', 'R1', 'R2', 'R3', 'R4', 'R5']) {
      expect(page).toContain(`value: '${code}'`);
    }
    expect(page).toContain("options: [{ value: '1', label: 'Sí' }, { value: '0', label: 'No' }]");
    expect(page).toContain("{ id: 'edit', label: 'Editar', icon: 'create-outline' }");
  });

  it('mantiene fill, alta, edición y tarjetas sin convertirlo falsamente en server-side', () => {
    const page = pageSource();
    for (const property of [
      'fill = true', 'addable = true', 'views = true', 'cardTitle = (row) =>',
      "cardIcon = () => 'bookmark-outline'", "searchPlaceholder = 'Buscar series…'",
    ]) expect(page).toContain(property);
    expect(page).not.toContain('serverSide = true');
    expect(page).toContain('<form id="invoice-settings-form" slot="create"');
    for (const id of ['series-code', 'series-name', 'series-type', 'series-year', 'series-prefix', 'series-active', 'series-default']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('reutiliza exactamente las dos series de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const SERIES_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("code: 'FACT'");
    expect(componentTest).toContain("code: 'TICKET'");
    expect(fixture).not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      { id: 'sr1', code: 'FACT', name: 'Facturas', invoice_type: 'F1', year: 2026, current_number: 12, prefix: '', is_active: 1, is_default: 1 },
      { id: 'sr2', code: 'TICKET', name: 'Tickets', invoice_type: 'F2', year: 2026, current_number: 340, prefix: 'T', is_active: 1, is_default: 0 },
    ]);
  });

  it('simula alta y edición con sus comandos reales y el mismo panel', () => {
    const page = pageSource();
    expect(page).toContain("addEventListener('rowAction'");
    expect(page).toContain("'invoice.series.create'");
    expect(page).toContain("'invoice.series.update'");
    expect(page).toContain("table.open('create')");
    expect(page).toContain('table.rows = series');
  });
});
