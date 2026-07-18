import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-tickets-sla.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tickets/ui/components/erp-tickets-sla/erp-tickets-sla.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tickets/ui/components/erp-tickets-sla/erp-tickets-sla.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/tickets/sla').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-tickets-sla — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y solo añade ok-data-table sobre Ionic', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/tickets/sla'");
    expect(page).toContain("title: 'Objetivos SLA'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce las cinco columnas y sus filtros de dominio reales', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="sla-table" fill>');
    for (const key of [
      'priority',
      'name',
      'response_time_hours',
      'resolution_time_hours',
      'is_active',
    ]) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const priority of ['low', 'medium', 'high', 'urgent']) {
      expect(page).toContain(`value: '${priority}'`);
    }
    expect(page).toContain("options: [{ value: '1', label: 'Sí' }, { value: '0', label: 'No' }]");
  });

  it('mantiene server-side, fill, alta y tarjetas responsive', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'timer-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar nombre o prioridad…'",
      'pageSize = 50',
      "sort = 'name'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="sla-create-form" slot="create"');
    for (const id of ['sla-name', 'sla-priority', 'sla-response', 'sla-resolution']) {
      expect(page).toContain(`id="${id}"`);
    }
  });

  it('reutiliza el SLA Oro de la prueba oficial como fixture auditable', () => {
    const page = pageSource();
    const fixture = page.match(/const SLA_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("name: 'Oro'");
    expect(componentTest).toContain("priority: 'high'");
    expect(fixture, 'SLA_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 's1',
        name: 'Oro',
        description: '',
        priority: 'high',
        response_time_hours: 4,
        resolution_time_hours: 24,
        is_active: 1,
      },
    ]);
  });

  it('simula el controlador y el alta sin inventar más acciones', () => {
    const page = pageSource();

    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("emitSlaEvent('tickets.sla.created'");
    expect(page).toContain("commandName: 'tickets.slas.create'");
    expect(page).not.toContain('rowAction');
  });
});
