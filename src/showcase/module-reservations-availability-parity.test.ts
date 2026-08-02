import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-reservations-availability.html', import.meta.url);
const moduleUrl = new URL('../../../modules-workspace/modules/reservations/', import.meta.url);
const component = readFileSync(
  new URL('ui/components/erp-reservations-availability/erp-reservations-availability.ts', moduleUrl),
  'utf8',
);
const componentTest = readFileSync(
  new URL('ui/components/erp-reservations-availability/erp-reservations-availability.test.ts', moduleUrl),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/reservations/availability').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase reservations availability — paridad con los dos CRUD reales', () => {
  it('usa Hub + Ionic iOS y dos ok-data-table sin fill', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/reservations/availability'");
    expect(page).toContain("title: 'Disponibilidad'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page).not.toMatch(/mode=["']md["']/);
    expect((page.match(/<ok-data-table/g) ?? [])).toHaveLength(2);
    expect(page).not.toMatch(/<ok-data-table[^>]*\sfill(?:\s|>)/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene columnas y formularios dentro de su propia tabla', () => {
    const page = pageSource();
    for (const key of ['day_of_week', 'start_time', 'end_time', 'max_reservations', 'date', 'reason', 'is_full_day']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toMatch(/<ok-data-table id="reservations-slots"[\s\S]*?<form id="reservations-slot-form" slot="create"[\s\S]*?<\/form>[\s\S]*?<\/ok-data-table>/);
    expect(page).toMatch(/<ok-data-table id="reservations-blocked"[\s\S]*?<form id="reservations-blocked-form" slot="create"[\s\S]*?<\/form>[\s\S]*?<\/ok-data-table>/);
    expect(componentTest).toContain('NO se usa `fill`');
  });

  it('conserva alta y única acción de eliminar en ambos recursos', () => {
    const page = pageSource();
    for (const command of [
      'reservations.timeslots.create', 'reservations.timeslots.delete',
      'reservations.blocked_dates.create', 'reservations.blocked_dates.delete',
    ]) expect(page).toContain(`'${command}'`);
    expect(page).toContain("{ id: 'remove', label: 'Eliminar', icon: 'trash-outline', color: 'danger' }");
    expect(page).not.toMatch(/id:\s*['"](?:edit|duplicate)['"]/);
    expect(page).toContain('slotsTable.close()');
    expect(page).toContain('blockedTable.close()');
  });

  it('mantiene server-side, tarjetas y las seis señales en cada tabla', () => {
    const page = pageSource();
    expect((page.match(/serverSide = true/g) ?? [])).toHaveLength(2);
    expect((page.match(/addable = true/g) ?? [])).toHaveLength(2);
    expect(page).toContain("slotsTable.cardIcon = () => 'time-outline'");
    expect(page).toContain("blockedTable.cardIcon = () => 'calendar-clear-outline'");
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect((page.match(new RegExp(`addEventListener\\('${event}'`, 'g')) ?? [])).toHaveLength(2);
    }
  });

  it('parte de las filas exactas de la prueba oficial', () => {
    const page = pageSource();
    expect(componentTest).toContain("start_time: '13:00:00'");
    expect(componentTest).toContain("date: '2026-12-25'");
    expect(page).toContain('"start_time": "13:00:00"');
    expect(page).toContain('"date": "2026-12-25"');
  });
});
