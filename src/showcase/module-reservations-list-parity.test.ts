import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-reservations-list.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/reservations/ui/components/erp-reservations-list/erp-reservations-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/reservations/ui/components/erp-reservations-list/erp-reservations-list.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/reservations/list').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-reservations-list — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/reservations/list'");
    expect(page).toContain("title: 'Reservas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('declara las columnas, los seis estados y las acciones vigentes del componente', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="reservations-table" fill>');
    for (const key of ['date', 'time', 'guest_name', 'guest_phone', 'party_size', 'status']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const state of ['pending', 'confirmed', 'seated', 'completed', 'cancelled', 'no_show']) {
      expect(component).toContain(`${state}: 'ui.status`);
      expect(page).toContain(`value: '${state}'`);
    }
    for (const action of ['confirm', 'seat', 'complete', 'cancel']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('mantiene el contrato server-side, el alta y la vista responsive de tarjetas', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'calendar-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar cliente, teléfono o fecha…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'guest_name'");
    expect(page).not.toContain("cardIcon = 'calendar-outline'");
  });

  it('reutiliza exactamente la reserva canónica de la prueba oficial', () => {
    const page = pageSource();
    const fixture = page.match(/const RESERVATION_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("guest_name: 'Ana'");
    expect(componentTest).toContain("date: '2026-07-13'");
    expect(fixture, 'RESERVATION_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'r1',
        guest_name: 'Ana',
        guest_phone: '600',
        guest_email: '',
        date: '2026-07-13',
        time: '20:00:00',
        party_size: 2,
        duration_minutes: 120,
        table_id: null,
        status: 'pending',
        notes: '',
      },
    ]);
  });

  it('sitúa el formulario Ionic dentro del panel create de la tabla', () => {
    const page = pageSource();

    expect(page).toContain('<form id="reservation-create-form" slot="create"');
    expect(page).toContain('<ion-input id="reservation-name"');
    expect(page).toContain('<ion-input id="reservation-phone"');
    expect(page).toContain('<ion-input id="reservation-date"');
    expect(page).toContain('<ion-input id="reservation-time"');
    expect(page).toContain('<ion-input id="reservation-party"');
    expect(page).toContain('table.close()');
  });

  it('simula el controlador y las transiciones reales sin inventar dominios', () => {
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
    expect(page).toContain("confirm: 'confirmed'");
    expect(page).toContain("seat: 'seated'");
    expect(page).toContain("complete: 'completed'");
    expect(page).toContain("cancel: 'cancelled'");
    expect(page).toContain("emitReservationEvent('reservations.reservation.created'");
    expect(page).toContain("emitReservationEvent('reservations.reservation.status_changed'");
    expect(page).not.toMatch(/<ok-(?:kpi|stat|kanban|calendar)\b/);
  });
});
