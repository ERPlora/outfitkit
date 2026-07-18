import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-staff-schedules.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/staff/ui/components/erp-staff-schedules/erp-staff-schedules.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/staff/ui/components/erp-staff-schedules/erp-staff-schedules.test.ts',
    import.meta.url,
  ),
  'utf8',
);
const schema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/staff/schemas/schedule_create.json', import.meta.url),
    'utf8',
  ),
) as { required: string[]; properties: { working_hours: { items: { required: string[] } } } };

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/staff/schedules').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-staff-schedules — paridad con el módulo real', () => {
  it('usa Hub iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/staff/schedules'");
    expect(page).toContain("title: 'Horarios'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce el ámbito por miembro y las cinco columnas reales', () => {
    const page = pageSource();
    expect(page).toContain('<ion-select id="schedule-member"');
    expect(page).toContain("emitQuery('staff.schedules.list_for_member'");
    for (const key of ['name', 'is_default', 'effective_from', 'effective_until', 'is_active']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("cardIcon = () => 'calendar-number-outline'");
  });

  it('mantiene fill, alta dentro de la tabla y la semana completa', () => {
    const page = pageSource();
    for (const property of ['fill = true', 'addable = true', 'views = true', 'searchable = false']) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="schedule-form" slot="create"');
    expect(page.match(/class="schedule-day"/g)).toHaveLength(7);
    for (const day of ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']) {
      expect(page).toContain(`>${day}</span>`);
    }
    expect(page.indexOf('<ion-select id="schedule-member"')).toBeLessThan(page.indexOf('<ok-data-table'));
  });

  it('reutiliza los miembros y el horario canónicos de la prueba oficial', () => {
    const page = pageSource();
    const members = page.match(/const MEMBER_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    const schedules = page.match(/const SCHEDULE_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("full_name: 'Ana Ruiz'");
    expect(members).not.toBeNull();
    expect(schedules).not.toBeNull();
    expect(JSON.parse(members![1])).toEqual([
      { id: 'm1', full_name: 'Ana Ruiz', status: 'active' },
      { id: 'm2', full_name: 'Luis Gil', status: 'active' },
    ]);
    expect(JSON.parse(schedules![1])).toEqual([
      {
        id: 'h1', staff_id: 'm1', name: 'Horario habitual', is_default: 1,
        effective_from: null, effective_until: null, is_active: 1,
      },
    ]);
  });

  it('valida y emite el mismo alta semanal del schema y del componente', () => {
    const page = pageSource();
    expect(schema.required).toContain('staff_id');
    expect(schema.properties.working_hours.items.required).toEqual(['day_of_week', 'start_time', 'end_time']);
    expect(page).toContain("emitCommand('staff.schedules.create'");
    expect(page).toContain("start_time: day.start");
    expect(page).toContain("end_time: day.end");
    expect(page).toContain("break_start: day.breakStart || null");
    expect(page).toContain("break_end: day.breakEnd || null");
    expect(page).toContain("if (day.start >= day.end)");
    expect(page).toContain('day.start <= day.breakStart');
    expect(page).toContain('day.breakEnd <= day.end');
  });

  it('el selector recarga por miembro y el panel se cierra al guardar', () => {
    const page = pageSource();
    expect(page).toContain("memberSelect.addEventListener('ionChange'");
    expect(page).toContain("table.addEventListener('pageChange'");
    expect(page).toContain("table.addEventListener('pageSizeChange'");
    expect(page).toContain("table.addEventListener('sortChange'");
    expect(page).toContain('table.close();');
  });
});
