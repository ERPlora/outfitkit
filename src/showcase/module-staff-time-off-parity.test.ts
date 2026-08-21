// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-staff-time-off.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/staff/ui/components/erp-staff-time-off/erp-staff-time-off.ts',
    import.meta.url,
  ),
  'utf8',
);
const createSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/staff/schemas/time_off_create.json', import.meta.url),
    'utf8',
  ),
) as { required: string[]; properties: { leave_type: { enum: string[] } } };
const statusSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/staff/schemas/time_off_set_status.json', import.meta.url),
    'utf8',
  ),
) as { properties: { status: { enum: string[] } } };

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/staff/time-off').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-staff-time-off — paridad con el módulo real', () => {
  it('usa Hub iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/staff/time-off'");
    expect(page).toContain("title: 'Ausencias'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('conserva las cinco columnas, filtros y dominios cerrados reales', () => {
    const page = pageSource();
    for (const key of ['staff_name', 'leave_type', 'start_date', 'end_date', 'status']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("filterType: 'daterange'");
    for (const status of statusSchema.properties.status.enum) {
      expect(page).toContain(`value: '${status}'`);
    }
    for (const type of createSchema.properties.leave_type.enum) {
      expect(page).toContain(`value: '${type}'`);
    }
  });

  it('mantiene server-side, tarjetas responsive y la paginación del contrato', () => {
    const page = pageSource();
    for (const property of [
      'serverSide = true',
      'fill = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'airplane-outline'",
      "searchPlaceholder = 'Buscar miembro…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('table.rows = filtered.slice(');
  });

  it('solo ofrece aprobar o rechazar y solo actúa sobre solicitudes pendientes', () => {
    const page = pageSource();
    expect(page).toContain("{ id: 'approve', label: 'Aprobar', icon: 'checkmark-circle-outline', color: 'primary' }");
    expect(page).toContain("{ id: 'reject', label: 'Rechazar', icon: 'close-circle-outline', color: 'medium' }");
    expect(page).toContain("if (row.status !== 'pending') return;");
    expect(page).toContain("emitCommand('staff.time_off.set_status'");
    expect(page).not.toContain("id: 'delete'");
    expect(page).not.toContain("id: 'edit'");
  });

  it('reproduce el alta que staff#36 abrió, con sus campos y su payload', () => {
    const page = pageSource();
    // staff#36 abrió la puerta de `staff.time_off.create`: la demo la tiene que enseñar.
    expect(component).toContain("'staff.time_off.create'");
    expect(page).toContain("emitCommand('staff.time_off.create'");
    expect(page).toContain('<form id="time-off-form" slot="create"');
    expect(page).toContain('table.addable = true;');

    // Los campos del alta son EXACTAMENTE los del schema (sin `notes`, que el componente no pide).
    for (const field of ['staff_id', 'leave_type', 'start_date', 'end_date', 'is_full_day', 'start_time', 'end_time', 'reason']) {
      expect(component).toContain(`${field}:`);
      expect(page).toContain(`${field}:`);
    }
    for (const required of createSchema.required) {
      expect(page).toContain(`${required}:`);
    }
    // Por horas (no día completo) el par es obligatorio y ordenado, igual que en el componente.
    expect(page).toContain('if (!fullDay && (!startTime || !endTime || startTime >= endTime)) return;');
  });
});
