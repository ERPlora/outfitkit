import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pages = {
  dashboard: 'dashboard-saas.html',
  invoice: 'billing-invoice-detail.html',
  payments: 'billing-payment-history.html',
  assistant: 'assistant-saas.html',
  modules: 'marketplace-modules.html',
  plans: 'marketplace-plans.html',
  moduleDetail: 'marketplace-module-detail.html',
} as const;

const sourceFiles = {
  dashboard: '../../../saas/apps/dashboard/overview/templates/dashboard/overview/partials/index_content.html',
  invoice: '../../../saas/apps/dashboard/billing/templates/dashboard/billing/partials/invoice_detail_content.html',
  payments: '../../../saas/apps/dashboard/payments/views.py',
  assistant: '../../../saas/apps/dashboard/assistant/templates/dashboard/assistant/partials/content.html',
  modules: '../../../saas/apps/dashboard/marketplace/views.py',
  plans: '../../../saas/apps/dashboard/marketplace/templates/dashboard/marketplace/partials/plans_content.html',
  moduleDetail:
    '../../../saas/apps/dashboard/marketplace/templates/dashboard/marketplace/partials/module_detail_content.html',
} as const;

const page = (name: keyof typeof pages): string => {
  const url = new URL(`../../showcase/pages/${pages[name]}`, import.meta.url);
  expect(existsSync(url), `falta ${pages[name]}`).toBe(true);
  return readFileSync(url, 'utf8');
};
const source = (name: keyof typeof sourceFiles): string =>
  readFileSync(new URL(sourceFiles[name], import.meta.url), 'utf8');

function expectSaasPage(contents: string, active: string, title: string): void {
  expect(contents).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
  expect(contents).toContain(`active: '${active}'`);
  expect(contents).toContain(`title: '${title}'`);
  expect(contents).toContain('<script src="./_ionic-config.js"></script>');
  expect(contents.indexOf('./_ionic-config.js')).toBeLessThan(contents.indexOf('@ionic/core'));
  expect(contents).not.toMatch(/mode=["']md["']/);
  expect(contents).not.toContain("mode: 'md'");
  expect(contents).not.toContain('definePage');
  expect(contents).not.toContain('_page.js');
  expect(contents).not.toContain('_shell.css');
}

function outfitTags(contents: string): Set<string> {
  return new Set([...contents.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]));
}

describe('showcase SaaS — Operaciones y Marketplace desde sus plantillas actuales', () => {
  it('reconstruye las siete páginas sobre el shell SaaS con Ionic iOS', () => {
    expectSaasPage(page('dashboard'), '/dashboard/', 'Resumen general');
    expectSaasPage(page('invoice'), '/dashboard/billing/', 'Factura INV-2025-00001');
    expectSaasPage(page('payments'), '/dashboard/payments/', 'Historial de compras');
    expectSaasPage(page('assistant'), '/dashboard/assistant/', 'Asistente');
    expectSaasPage(page('modules'), '/dashboard/marketplace/', 'Marketplace');
    expectSaasPage(page('plans'), '/dashboard/marketplace/plans/', 'Planes de hub');
    expectSaasPage(page('moduleDetail'), '/dashboard/marketplace/modules/whatsapp-inbox/', 'WhatsApp Inbox');
  });

  it('mantiene OutfitKit solo donde la fuente tiene una carencia real de Ionic', () => {
    expect(outfitTags(page('dashboard'))).toEqual(new Set(['ok-inline-feedback']));
    expect(outfitTags(page('invoice'))).toEqual(new Set());
    expect(outfitTags(page('payments'))).toEqual(new Set(['ok-data-table']));
    expect(outfitTags(page('assistant'))).toEqual(new Set(['ok-inline-feedback']));
    expect(outfitTags(page('modules'))).toEqual(new Set(['ok-data-table']));
    expect(outfitTags(page('plans'))).toEqual(new Set());
    expect(outfitTags(page('moduleDetail'))).toEqual(new Set());
  });

  it('reproduce el resumen con aviso, cuatro KPI, aplicaciones, hubs y actividad', () => {
    const contents = page('dashboard');
    const template = source('dashboard');
    for (const id of ['section-stats', 'section-modules', 'card-hubs-status', 'card-recent-activity']) {
      expect(template).toContain(`id="${id}"`);
      expect(contents).toContain(`id="${id}"`);
    }
    for (const label of ['Hubs activos', 'Módulos activos', 'Gasto mensual', 'Facturas']) {
      expect(contents).toContain(label);
    }
    expect(contents).toContain('const kpis = stats.map(');
    expect(contents).toContain('class="dashboard-kpi"');
    expect(contents).toContain('<ok-inline-feedback tone="warning"');
    expect(contents).toContain('<ion-segment value="overview"');
    expect(contents).toContain('<ion-segment-button value="users"');
  });

  it('reproduce el detalle de la factura canónica y todas sus secciones reales', () => {
    const contents = page('invoice');
    const template = source('invoice');
    for (const section of ['Invoice Date', 'Due Date', 'Payment Date', 'Bill To', 'Items', 'Subtotal', 'Total']) {
      expect(template).toContain(section);
    }
    for (const label of ['Fecha de factura', 'Fecha de vencimiento', 'Fecha de pago', 'Facturar a', 'Conceptos', 'Subtotal', 'Total']) {
      expect(contents).toContain(label);
    }
    for (const fixture of ['INV-2025-00001', '119,79 €', 'test@example.com', 'ES', 'in_test_123']) {
      expect(contents).toContain(fixture);
    }
    expect(contents).toContain('<ion-badge color="success">Pagada</ion-badge>');
    expect(contents).toContain('<ion-button id="invoice-pdf"');
    expect(contents).toContain('<ion-segment value="invoices"');
  });

  it('reproduce el historial server-side con las cinco columnas y los cuatro estados reales', () => {
    const contents = page('payments');
    const view = source('payments');
    expect(contents).toContain('<ok-data-table id="payments-dt" server-side fill>');
    for (const column of ['Módulo', 'Fecha', 'ID de pago', 'Importe', 'Estado']) {
      expect(contents).toContain(`header: '${column}'`);
    }
    for (const status of ['completed', 'pending', 'failed', 'refunded']) {
      expect(view).toContain(`"${status}"`);
      expect(contents).toContain(`<ion-select-option value="${status}">`);
    }
    expect(contents).toContain("searchPlaceholder = 'Buscar compras…'");
    expect(contents).toContain("addEventListener('searchChange'");
    expect(contents).toContain("addEventListener('pageChange'");
    expect(contents).toContain('Pagos seguros.');
    expect(contents).toContain('<ion-segment value="purchases"');
  });

  it('reproduce la superficie del asistente y sus interacciones básicas', () => {
    const contents = page('assistant');
    const template = source('assistant');
    for (const id of [
      'cloud-assistant-messages',
      'cloud-assistant-form',
      'cloud-assistant-message-input',
      'cloud-assistant-textarea',
      'cloud-assistant-send',
    ]) {
      expect(template).toContain(`id="${id}"`);
      expect(contents).toContain(`id="${id}"`);
    }
    expect(contents).toContain('Cloud Assistant');
    expect(contents).toMatch(/<ok-inline-feedback\b[^>]*\btone="info"/);
    expect(contents).toContain('Nuevo chat');
    expect(contents).toContain("addEventListener('keydown'");
    expect(contents).toContain("addEventListener('submit'");
    expect(contents).toContain('appendMessage(');
  });

  it('reproduce el catálogo de módulos de pago como la segunda tabla rica', () => {
    const contents = page('modules');
    const view = source('modules');
    expect(contents).toContain('<ok-data-table id="marketplace-modules-dt" server-side fill>');
    for (const column of ['Módulo', 'Precio', 'Estado']) {
      expect(view).toContain(`label=_("${column === 'Módulo' ? 'Module' : column === 'Precio' ? 'Price' : 'Status'}")`);
      expect(contents).toContain(`header: '${column}'`);
    }
    expect(contents).toContain('Premium Mod');
    expect(contents).toContain('WhatsApp Inbox');
    expect(contents).not.toContain('Free Mod');
    expect(contents).toContain("id: 'view-plans', label: 'Ver planes'");
    expect(contents).toContain("searchPlaceholder = 'Buscar módulos…'");
    expect(contents).toContain('<ion-segment value="modules"');
  });

  it('reproduce los planes por hub y el cambio con confirmación Ionic', () => {
    const contents = page('plans');
    const template = source('plans');
    expect(template).toContain('id="form-plan-hub-select"');
    expect(contents).toContain('id="form-plan-hub-select"');
    expect(contents).toContain('<ion-select id="plans-hub"');
    expect(contents).toContain('Starter');
    expect(contents).toContain('29,99 €');
    expect(contents).toContain('Pro');
    expect(contents).toContain('109,99 €');
    expect(contents).toContain('<ion-badge color="primary">Plan actual: Starter</ion-badge>');
    expect(contents).toContain('<ion-alert id="plan-change-confirm"');
    expect(contents).toContain("addEventListener('ionChange'");
    expect(contents).toContain("addEventListener('submit'");
    expect(contents).toContain('<ion-segment value="plans"');
  });

  it('reproduce la ficha, selector, tier y checkout dentro de ion-modal', () => {
    const contents = page('moduleDetail');
    const template = source('moduleDetail');
    for (const id of ['form-hub-select', 'marketplace-checkout-modal', 'marketplace-checkout-close']) {
      expect(template).toContain(`id="${id}"`);
      expect(contents).toContain(`id="${id}"`);
    }
    expect(contents).toContain('WhatsApp Inbox');
    expect(contents).toContain('Main Hub — Test Org');
    expect(contents).toContain('Second Hub — Test Org');
    expect(contents).toContain('19,00 €');
    expect(contents).toContain('1.000 conversaciones/mes');
    expect(contents).toContain('Suscribirse');
    expect(contents).toContain('Prueba gratuita de 15 días');
    expect(contents).toContain("addEventListener('submit'");
    expect(contents).toContain('checkoutModal.isOpen = true');
    expect(contents).toContain('<ion-segment value="modules"');
  });
});
