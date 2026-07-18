import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

const pages = {
  invoices: readPage('billing-invoices.html'),
  subscriptions: readPage('billing-subscriptions.html'),
  purchases: readPage('billing-purchases.html'),
};

const expectSharedBillingPage = (
  page: string,
  id: string,
  title: string,
  activeTab: string,
): void => {
  expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
  expect(page).toContain("active: '/dashboard/billing/'");
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${id}" server-side fill>`);
  expect(page).toContain('slot="toolbar" class="okdt-filters"');
  expect(page).toContain(`<ion-segment value="${activeTab}" aria-label="Navegación de facturación">`);

  for (const tab of ['invoices', 'subscriptions', 'purchases']) {
    expect(page).toContain(`<ion-segment-button value="${tab}"`);
  }
  for (const label of ['Facturas', 'Suscripciones', 'Compras']) {
    expect(page).toContain(`<ion-label>${label}</ion-label>`);
  }

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));

  expect(page).not.toContain('definePage');
  expect(page).not.toContain('_page.js');
  expect(page).not.toContain('_shell.css');
  expect(page).not.toContain("mode: 'md'");
  expect(page).not.toContain('mode="md"');
};

describe('showcase SaaS — facturación centrada en ok-data-table', () => {
  it('reproduce Facturas desde _invoices_config', () => {
    const page = pages.invoices;
    expectSharedBillingPage(page, 'invoices-dt', 'Facturas', 'invoices');

    for (const column of ['Factura', 'Cliente', 'Estado', 'Total', 'Fecha']) {
      expect(page).toContain(`header: '${column}'`);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar facturas…'");
    expect(page).toContain("id: 'view', label: 'Ver', icon: 'eye-outline'");
    expect(page).toContain("table.menuActions = [{ id: 'export', label: 'Exportar CSV', icon: 'download-outline' }]");
    expect(page).toContain("addEventListener('menuAction'");
    expect(page).not.toContain('table.exportable = true');
    expect(page).toContain('data-okdt-param="hub"');
    expect(page).toContain('data-okdt-param="status"');
    expect(page).toContain('data-okdt-param="invoice_type"');
    expect(page).toContain('data-okdt-param="issue_date_from"');
    expect(page).toContain('data-okdt-param="issue_date_to"');
    for (const status of ['paid', 'pending', 'failed', 'refunded', 'draft']) {
      expect(page).toContain(`<ion-select-option value="${status}">`);
    }
    for (const type of ['module', 'hub_subscription']) {
      expect(page).toContain(`<ion-select-option value="${type}">`);
    }
    expect(page).not.toContain('Vencimiento');
    expect(page).not.toContain('Descargar PDF');
  });

  it('reproduce Suscripciones desde subscriptions_page', () => {
    const page = pages.subscriptions;
    expectSharedBillingPage(page, 'subscriptions-dt', 'Suscripciones', 'subscriptions');

    for (const column of ['Módulo', 'Plan', 'Estado', 'Precio', 'Próxima facturación']) {
      expect(page).toContain(`header: '${column}'`);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar suscripciones…'");
    expect(page).toContain("id: 'manage', label: 'Gestionar', icon: 'settings-outline'");
    expect(page).toContain('data-okdt-param="hub"');
    expect(page).toContain('data-okdt-param="status"');
    expect(page).toContain('data-okdt-param="billing_period"');
    for (const status of ['active', 'past_due', 'cancelled', 'unpaid']) {
      expect(page).toContain(`<ion-select-option value="${status}">`);
    }
    for (const period of ['monthly', 'yearly']) {
      expect(page).toContain(`<ion-select-option value="${period}">`);
    }
    expect(page).not.toContain('Cambios programados');
    expect(page).not.toContain('Nuevo plan');
    expect(page).not.toContain('Precio / mes');
  });

  it('reproduce Compras desde purchases_page', () => {
    const page = pages.purchases;
    expectSharedBillingPage(page, 'purchases-dt', 'Compras', 'purchases');

    for (const column of ['Módulo', 'Hub', 'Estado', 'Importe', 'Fecha']) {
      expect(page).toContain(`header: '${column}'`);
    }
    expect(page).toContain("searchPlaceholder = 'Buscar compras…'");
    expect(page).toContain("id: 'view', label: 'Ver', icon: 'eye-outline'");
    expect(page).toContain('data-okdt-param="hub"');
    expect(page).toContain('data-okdt-param="payment_status"');
    for (const status of ['completed', 'pending', 'failed', 'refunded']) {
      expect(page).toContain(`<ion-select-option value="${status}">`);
    }
    expect(page).not.toContain('Equipamiento');
    expect(page).not.toContain('En tránsito');
    expect(page).not.toContain('Procesando');
    expect(page).not.toContain('Todas');
  });
});
