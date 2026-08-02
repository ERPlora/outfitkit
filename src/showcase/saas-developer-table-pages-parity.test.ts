import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

const pages = {
  modules: readPage('modules-my.html'),
  earnings: readPage('billing-vendor-earnings.html'),
  payouts: readPage('billing-payouts.html'),
};

const expectDeveloperPage = (
  page: string,
  id: string,
  title: string,
  activeTab: string,
): void => {
  expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
  expect(page).toContain("active: '/dashboard/developer/'");
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${id}" server-side fill>`);
  expect(page).toContain('slot="toolbar" class="okdt-filters"');
  expect(page).toContain(`<ion-segment value="${activeTab}" aria-label="Secciones de desarrollador">`);

  for (const tab of ['overview', 'earnings', 'payouts', 'modules', 'blueprints', 'repositories', 'apidocs']) {
    expect(page).toContain(`<ion-segment-button value="${tab}"`);
  }

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));

  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toContain("from './_page.js'");
  expect(page).not.toContain('_shell.css');
  expect(page).not.toMatch(/mode=["']md["']/);
  expect(page).not.toContain("mode: 'md'");
};

describe('showcase SaaS — páginas actuales del área Developer', () => {
  it('reproduce Mis módulos desde DataTableConfig y conserva sus tres KPI reales', () => {
    const page = pages.modules;
    expectDeveloperPage(page, 'my-modules-dt', 'Mis módulos', 'modules');

    for (const column of ['Módulo', 'Versión', 'Descargas', 'Precio', 'Estado']) {
      expect(page).toContain(`header: '${column}'`);
    }
    for (const kpi of ['Total de módulos', 'Descargas totales', 'Ingresos totales']) {
      expect(page).toContain(kpi);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar módulos…'");
    expect(page).toContain('data-okdt-param="module_type"');
    expect(page).toContain('data-okdt-param="is_published"');
    expect(page).toContain("id: 'stats', label: 'Estadísticas'");
    expect(page).toContain("id: 'edit', label: 'Editar'");
    expect(page).toContain("table.primaryAction = { label: 'Subir módulo', icon: 'add' }");
    expect(page).toContain('table.selectable = true');
    for (const action of ['Publicar', 'Despublicar', 'Eliminar']) {
      expect(page).toContain(`label: '${action}'`);
    }
    expect(page).toContain('Guía para módulos');
    expect(page).not.toContain('Rating');
    expect(page).not.toContain('Update pendiente');
  });

  it('reproduce Ingresos desde su DataTableConfig y sus cuatro KPI actuales', () => {
    const page = pages.earnings;
    expectDeveloperPage(page, 'earnings-dt', 'Ingresos', 'earnings');

    for (const column of ['Módulo', 'Fecha', 'Bruto', 'Comisión', 'Neto', 'Estado']) {
      expect(page).toContain(`header: '${column}'`);
    }
    for (const kpi of ['Neto total', 'Pendiente', 'Ingresos brutos', 'Comisión (15%)']) {
      expect(page).toContain(kpi);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar por módulo…'");
    expect(page).toContain('data-okdt-param="status"');
    expect(page).toContain('data-okdt-param="module"');
    expect(page).toContain("id: 'view', label: 'Ver'");
    expect(page).toContain('Cómo funcionan las comisiones');
    expect(page).not.toContain('Solicitar payout');
    expect(page).not.toContain('Exportar CSV');
  });

  it('reproduce Payouts desde su DataTableConfig y el estado Stripe real', () => {
    const page = pages.payouts;
    expectDeveloperPage(page, 'payouts-dt', 'Pagos', 'payouts');

    for (const column of ['Fecha', 'Importe', 'Ingresos', 'Estado', 'Pagado el']) {
      expect(page).toContain(`header: '${column}'`);
    }
    for (const kpi of ['Saldo disponible', 'Total pagado', 'Pago mínimo', 'Estado de la cuenta']) {
      expect(page).toContain(kpi);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar pagos…'");
    expect(page).toContain('data-okdt-param="status"');
    expect(page).toContain("id: 'view', label: 'Ver detalles'");
    expect(page).toContain('Conecta Stripe para recibir pagos');
    expect(page).toContain('Información sobre los pagos');
    expect(page).toContain('3–5 días laborables');
    expect(page).toContain('Stripe Connect (transferencia bancaria directa)');
    expect(page).not.toContain('Procesador');
    expect(page).not.toContain('Cuenta destino');
  });
});
