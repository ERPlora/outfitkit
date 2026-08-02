import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-schedules-hours.html', import.meta.url);
const moduleUrl = new URL('../../../modules-workspace/modules/schedules/', import.meta.url);
const component = readFileSync(new URL('ui/components/erp-schedules-hours/erp-schedules-hours.ts', moduleUrl), 'utf8');
const componentTest = readFileSync(new URL('ui/components/erp-schedules-hours/erp-schedules-hours.test.ts', moduleUrl), 'utf8');

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real del componente erp-schedules-hours').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-schedules-hours — paridad con la vista real', () => {
  it('usa Hub + Ionic iOS y conserva las tres vistas del mismo componente', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/schedules/hours'");
    expect(page).toContain("title: 'Horarios'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page).not.toMatch(/mode=["']md["']/);
    for (const tab of ['hours', 'special_days', 'settings']) expect(page).toContain(`data-tab="${tab}"`);
    expect(componentTest).toContain('nav button');
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene las tres tablas y sus columnas reales', () => {
    const page = pageSource();
    for (const key of [
      'day_of_week', 'open_time', 'close_time', 'break_start',
      'date', 'name', 'recurring_yearly',
      'start_date', 'end_date', 'reason', 'is_closed',
    ]) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const id of ['schedule-hours-table', 'schedule-special-table', 'schedule-overrides-table']) {
      expect(page).toContain(`<ok-data-table id="${id}" fill>`);
    }
  });

  it('deja cada alta de fila dentro de su tabla y ajustes fuera', () => {
    const page = pageSource();
    for (const form of ['schedule-hours-form', 'schedule-special-form', 'schedule-override-form']) {
      expect(page).toContain(`<form id="${form}" slot="create"`);
    }
    expect(page).toContain('<form id="schedule-settings-form" class="schedule-settings">');
    expect(page).not.toContain('<form id="schedule-settings-form" slot="create"');
  });

  it('conserva los seis comandos reales, edición de horario y borrados', () => {
    const page = pageSource();
    for (const command of [
      'schedules.business_hours.set', 'schedules.special_days.create',
      'schedules.special_days.delete', 'schedules.overrides.create',
      'schedules.overrides.delete', 'schedules.settings.save',
    ]) expect(page).toContain(`'${command}'`);
    expect(page).toContain("hoursTable.actions = [{ id: 'edit'");
    expect(page).toContain("specialTable.actions = [{ id: 'delete'");
    expect(page).toContain("overridesTable.actions = [{ id: 'delete'");
    expect(page).toContain("hoursTable.open('create')");
  });

  it('parte de las filas y ajustes exactos de la prueba oficial', () => {
    const page = pageSource();
    for (const text of ["open_time: '09:00'", "name: 'Navidad'", "reason: 'Vacaciones'", "timezone: 'Europe/Madrid'"]) {
      expect(componentTest).toContain(text);
    }
    expect(page).toContain('"open_time": "09:00"');
    expect(page).toContain('"name": "Navidad"');
    expect(page).toContain('"reason": "Vacaciones"');
    expect(page).toContain("timezone: 'Europe/Madrid'");
  });
});
