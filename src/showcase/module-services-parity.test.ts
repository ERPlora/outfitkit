import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-services.html', import.meta.url);
const moduleUrl = new URL('../../../modules-workspace/modules/services/', import.meta.url);
const component = readFileSync(new URL('ui/components/erp-services-list/erp-services-list.ts', moduleUrl), 'utf8');
const componentTest = readFileSync(new URL('ui/components/erp-services-list/erp-services-list.test.ts', moduleUrl), 'utf8');

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/services/services').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-services — paridad con la lista real', () => {
  it('usa Hub + Ionic iOS y deja ok-data-table como única extensión', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/services/services'");
    expect(page).toContain("title: 'Servicios'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page).not.toMatch(/mode=["']md["']/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene columnas, filtros cerrados y única acción real', () => {
    const page = pageSource();
    for (const key of ['name', 'category', 'pricing_type', 'price', 'duration_minutes']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const value of ['fixed', 'hourly', 'from', 'variable', 'free']) expect(page).toContain(`{ value: '${value}'`);
    expect(page).toContain("table.actions = [{ id: 'delete', label: 'Eliminar', icon: 'trash', color: 'danger' }]");
    expect(page).not.toMatch(/id:\s*['"](?:edit|duplicate)['"]/);
  });

  it('mantiene server-side, fill y alta dentro de la tabla', () => {
    const page = pageSource();
    for (const property of ['serverSide = true', 'fill = true', 'addable = true', 'searchable = true', 'pageSize = 50', "sort = 'name'", "sortDir = 'asc'"]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="services-form" slot="create"');
    for (const id of ['service-name', 'service-price', 'service-duration', 'service-category', 'service-tax-category']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('reutiliza fixture oficial y conserva alta/borrado y seis señales', () => {
    const page = pageSource();
    expect(componentTest).toContain("name: 'Corte'");
    expect(page).toContain('"name": "Corte"');
    expect(page).toContain("recordCommand('services.services.create'");
    expect(page).toContain("recordCommand('services.services.delete'");
    expect(page).toContain('table.close()');
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
  });
});
