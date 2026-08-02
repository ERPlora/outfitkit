import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-appointments.html', import.meta.url);
const moduleUrl = new URL('../../../modules-workspace/modules/appointments/', import.meta.url);
const component = readFileSync(new URL('ui/components/erp-appointments-list/erp-appointments-list.ts', moduleUrl), 'utf8');
const componentTest = readFileSync(new URL('ui/components/erp-appointments-list/erp-appointments-list.test.ts', moduleUrl), 'utf8');

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/appointments/appointments').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-appointments — paridad con la agenda real', () => {
  it('usa Hub + Ionic iOS y ok-data-table como única extensión', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/appointments/appointments'");
    expect(page).toContain("title: 'Citas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page).not.toMatch(/mode=["']md["']/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene alcance día/estado fuera y alta dentro de la tabla', () => {
    const page = pageSource();
    expect(page).toContain('<div class="appointment-scope">');
    expect(page).toContain('id="appointment-day"');
    expect(page).toContain('id="appointment-status"');
    expect(page).toContain('<form id="appointment-form" slot="create"');
    expect(page).toContain('table.fill = true');
    expect(page).toContain('table.addable = true');
    expect(page).not.toContain('table.serverSide = true');
  });

  it('conserva columnas, seis estados y cinco acciones', () => {
    const page = pageSource();
    for (const key of ['start_datetime', 'appointment_number', 'customer_name', 'service_name', 'staff_name', 'status']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show']) expect(page).toContain(`value="${status}"`);
    for (const action of ['confirm', 'start', 'complete', 'cancel', 'delete']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('reutiliza fixture oficial y conserva alta, acciones y hora local', () => {
    const page = pageSource();
    expect(componentTest).toContain("appointment_number: 'A-001'");
    expect(page).toContain('"appointment_number": "A-001"');
    for (const command of ['create', 'confirm', 'start', 'complete', 'cancel', 'delete']) {
      expect(page).toContain(`'appointments.appointments.${command}'`);
    }
    expect(page).toContain("toLocaleTimeString('es-ES'");
    expect(page).toContain('table.close()');
    expect(page).toContain("table.addEventListener('rowAction'");
  });
});
