import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const listUrl = new URL('../../showcase/pages/module-online-booking-bookings.html', import.meta.url);
const settingsUrl = new URL('../../showcase/pages/module-online-booking-settings.html', import.meta.url);
const componentList = readFileSync(
  new URL(
    '../../../modules-workspace/modules/online_booking/ui/components/erp-online-booking-list/erp-online-booking-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/online_booking/ui/components/erp-online-booking-list/erp-online-booking-list.test.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentSettings = readFileSync(
  new URL(
    '../../../modules-workspace/modules/online_booking/ui/components/erp-online-booking-settings/erp-online-booking-settings.ts',
    import.meta.url,
  ),
  'utf8',
);
const manifest = JSON.parse(
  readFileSync(new URL('../../../modules-workspace/modules/online_booking/module.json', import.meta.url), 'utf8'),
) as {
  queries: Record<string, { list?: { page_size?: number; default_sort?: string; default_dir?: string } }>;
  commands: Record<string, unknown>;
};
const createSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/online_booking/schemas/booking_create.json', import.meta.url),
    'utf8',
  ),
) as { required: string[] };
const settingsSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/online_booking/schemas/settings_upsert.json', import.meta.url),
    'utf8',
  ),
) as { properties: Record<string, { default?: unknown; minimum?: number; maximum?: number }> };

function source(url: URL, route: string): string {
  expect(existsSync(url), `falta la demo real de ${route}`).toBe(true);
  return readFileSync(url, 'utf8');
}

describe('showcase module-online-booking-bookings — paridad con el módulo real', () => {
  it('usa Hub iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = source(listUrl, '/m/online_booking/bookings');
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/online_booking/bookings'");
    expect(page).toContain("title: 'Reservas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);

    const tags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(tags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene las siete columnas, los cinco estados y el contrato server-side', () => {
    const page = source(listUrl, '/m/online_booking/bookings');
    for (const key of [
      'booking_reference',
      'customer_name',
      'service_name',
      'staff_name',
      'booking_date',
      'booking_time',
      'status',
    ]) {
      expect(componentList).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['pending', 'confirmed', 'completed', 'cancelled', 'no_show']) {
      expect(page).toContain(`value: '${status}'`);
    }
    expect(manifest.queries['online_booking.bookings.list'].list).toMatchObject({ page_size: 50 });
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'searchable = true',
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
      "cardIcon = () => 'globe-outline'",
    ]) {
      expect(page).toContain(property);
    }
  });

  it('reutiliza exactamente la reserva canónica de la prueba oficial', () => {
    const page = source(listUrl, '/m/online_booking/bookings');
    const fixture = page.match(/const BOOKING_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(componentTest).toContain("booking_reference: 'OB-001'");
    expect(fixture).not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 'b1',
        booking_reference: 'OB-001',
        customer_name: 'Ana',
        customer_email: '',
        customer_phone: '600',
        service_name: 'Corte',
        staff_name: 'Eva',
        booking_date: '2026-07-13',
        booking_time: '10:00:00',
        duration_minutes: 30,
        status: 'pending',
        booking_type: 'appointment',
        notes: '',
      },
    ]);
  });

  it('conserva el alta dentro de la tabla y su payload real', () => {
    const page = source(listUrl, '/m/online_booking/bookings');
    expect(page).toContain('<form id="online-booking-form" slot="create"');
    expect(createSchema.required).toEqual(['customer_name', 'service_name', 'booking_date', 'booking_time']);
    for (const id of ['booking-customer', 'booking-service', 'booking-date', 'booking-time']) {
      expect(page).toContain(`id="${id}"`);
    }
    for (const fragment of [
      "recordCommand('online_booking.bookings.create'",
      "booking_type: 'appointment'",
      "notes: ''",
      "booking_time: time.length === 5 ? `${time}:00` : time",
      'table.close();',
    ]) {
      expect(page).toContain(fragment);
    }
  });

  it('simula la consulta, la barra y las cinco acciones reales de fila', () => {
    const page = source(listUrl, '/m/online_booking/bookings');
    expect(page).toContain("recordQuery('online_booking.bookings.list'");
    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    for (const [action, command] of [
      ['confirm', 'online_booking.bookings.confirm'],
      ['complete', 'online_booking.bookings.complete'],
      ['no_show', 'online_booking.bookings.no_show'],
      ['cancel', 'online_booking.bookings.cancel'],
      ['delete', 'online_booking.bookings.delete'],
    ]) {
      expect(componentList).toContain(`id: '${action}'`);
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`'${action}': '${command}'`);
    }
    expect(page).toContain("addEventListener('rowAction'");
  });
});

describe('showcase module-online-booking-settings — paridad con el módulo real', () => {
  it('usa el shell Hub iOS y solo controles Ionic', () => {
    const page = source(settingsUrl, '/m/online_booking/settings');
    expect(page).toContain("active: '/m/online_booking/settings'");
    expect(page).toContain("title: 'Ajustes'");
    expect(page).toContain('<form id="online-booking-settings-form"');
    expect(page).not.toMatch(/<\/?ok-[a-z-]+/);
    expect(page).not.toMatch(/mode=["']md["']/);
  });

  it('reproduce todos los campos y límites del componente y el schema', () => {
    const page = source(settingsUrl, '/m/online_booking/settings');
    for (const id of [
      'settings-enabled',
      'settings-page-title',
      'settings-primary-color',
      'settings-logo-url',
      'settings-min-advance',
      'settings-max-advance',
      'settings-slot-duration',
      'settings-buffer',
      'settings-require-phone',
      'settings-require-email',
      'settings-allow-staff',
      'settings-allow-notes',
      'settings-welcome',
      'settings-confirmation',
      'settings-cancellation',
    ]) {
      expect(page).toContain(`id="${id}"`);
    }
    expect(settingsSchema.properties.min_advance_hours).toMatchObject({ minimum: 0, maximum: 168 });
    expect(settingsSchema.properties.max_advance_days).toMatchObject({ minimum: 1, maximum: 365 });
    expect(settingsSchema.properties.slot_duration_minutes).toMatchObject({ minimum: 5, maximum: 480 });
    expect(settingsSchema.properties.buffer_minutes).toMatchObject({ minimum: 0, maximum: 120 });
    for (const range of ['min="0" max="168"', 'min="1" max="365"', 'min="5" max="480"', 'min="0" max="120"']) {
      expect(page).toContain(range);
    }
  });

  it('parte de los defaults reales y guarda el objeto completo', () => {
    const page = source(settingsUrl, '/m/online_booking/settings');
    for (const fragment of [
      "page_title: 'Book an Appointment'",
      "primary_color: '#6366f1'",
      'require_phone: 1',
      'require_email: 1',
      'allow_staff_selection: 1',
      'allow_notes: 1',
      'min_advance_hours: 2',
      'max_advance_days: 30',
      'slot_duration_minutes: 30',
      'buffer_minutes: 0',
    ]) {
      expect(componentSettings).toContain(fragment);
    }
    for (const fragment of [
      "page_title: 'Book an Appointment'",
      "primary_color: '#6366f1'",
      'require_phone: true',
      'require_email: true',
      'allow_staff_selection: true',
      'allow_notes: true',
      'min_advance_hours: 2',
      'max_advance_days: 30',
      'slot_duration_minutes: 30',
      'buffer_minutes: 0',
      "recordCommand('online_booking.settings.upsert'",
    ]) {
      expect(page).toContain(fragment);
    }
    for (const key of Object.keys(settingsSchema.properties)) {
      expect(page).toContain(`${key}:`);
    }
  });
});
