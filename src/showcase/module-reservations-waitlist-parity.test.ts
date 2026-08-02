import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-reservations-waitlist.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/reservations/ui/components/erp-reservations-waitlist/erp-reservations-waitlist.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/reservations/ui/components/erp-reservations-waitlist/erp-reservations-waitlist.test.ts',
    import.meta.url,
  ),
  'utf8',
);
const moduleManifest = readFileSync(
  new URL('../../../modules-workspace/modules/reservations/module.json', import.meta.url),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/reservations/waitlist').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-reservations-waitlist — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/reservations/waitlist'");
    expect(page).toContain("title: 'Lista de espera'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('declara las columnas, el filtro cerrado y las tres acciones vigentes', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="reservations-waitlist-table" fill>');
    for (const key of ['date', 'preferred_time', 'guest_name', 'guest_phone', 'party_size', 'is_contacted']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(moduleManifest).toContain('"is_contacted": {');
    expect(page).toContain("filterType: 'select'");
    expect(page).toContain("{ value: '1', label: 'Sí' }");
    expect(page).toContain("{ value: '0', label: 'No' }");
    for (const action of ['contact', 'convert', 'remove']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('mantiene el contrato server-side y la vista responsive de tarjetas', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'hourglass-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar cliente, teléfono o fecha…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'guest_name'");
    expect(page).not.toContain("cardIcon = 'hourglass-outline'");
  });

  it('reutiliza exactamente la entrada canónica de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const WAITLIST_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("guest_name: 'Luis'");
    expect(componentTest).toContain("date: '2026-07-13'");
    expect(fixture, 'WAITLIST_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'w1',
        guest_name: 'Luis',
        guest_phone: '600',
        date: '2026-07-13',
        preferred_time: '21:00:00',
        party_size: 2,
        is_contacted: 0,
        is_converted: 0,
      },
    ]);
  });

  it('sitúa el formulario Ionic dentro del panel create de la tabla', () => {
    const page = pageSource();

    expect(page).toContain('<form id="waitlist-create-form" slot="create"');
    expect(page).toContain('<ion-input id="waitlist-name"');
    expect(page).toContain('<ion-input id="waitlist-phone"');
    expect(page).toContain('<ion-input id="waitlist-date"');
    expect(page).toContain('<ion-input id="waitlist-time"');
    expect(page).toContain('<ion-input id="waitlist-party"');
    expect(page).toContain('table.close()');
  });

  it('simula el controlador y las mutaciones reales sin inventar dominios', () => {
    const page = pageSource();

    for (const event of [
      'rowAction',
      'pageChange',
      'pageSizeChange',
      'sortChange',
      'searchChange',
      'filterChange',
    ]) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("emitWaitlistEvent('reservations.waitlist.created'");
    expect(page).toContain("emitWaitlistEvent('reservations.waitlist.updated'");
    expect(page).toContain("emitWaitlistEvent('reservations.waitlist.deleted'");
    expect(page).not.toMatch(/<ok-(?:kpi|stat|kanban|calendar)\b/);
  });
});
