import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

describe('showcase Hub — Apps y Facturación actuales', () => {
  const apps = readPage('modules-hub-installed.html');
  const billing = readPage('billing-hub.html');

  it('usa el shell Hub y configura Ionic iOS antes de cargar Ionic', () => {
    for (const page of [apps, billing]) {
      expect(page).toContain("import { defineHubPage } from './_hub.js'");
      expect(page).not.toContain("from './_page.js'");
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('<ok-page-header');
      expect(page).not.toMatch(/mode=["']md["']/);

      const config = page.indexOf('<script src="./_ionic-config.js"></script>');
      const ionic = page.indexOf('@ionic/core/dist/ionic/ionic.esm.js');
      expect(config).toBeGreaterThan(-1);
      expect(config).toBeLessThan(ionic);
    }

    expect(apps).toMatch(/defineHubPage\(\{[\s\S]*active:\s*'apps'/);
    expect(apps).toContain("title: 'Apps'");
    expect(billing).toMatch(/defineHubPage\(\{[\s\S]*active:\s*'billing'/);
    expect(billing).toContain("title: 'Facturación'");
  });

  it('reproduce AppsPage con las dos tablas ricas y sus tres pestañas', () => {
    expect(apps.match(/<ok-data-table\b/g)).toHaveLength(2);
    expect(apps).toContain('<ok-data-table id="mine-table" fill>');
    expect(apps).toContain('<ok-data-table id="catalog-table" fill hidden>');

    for (const tab of ['mine', 'all', 'paid']) {
      expect(apps).toContain(`value="${tab}"`);
    }
    expect(apps).toContain('Mis módulos');
    expect(apps).toContain('Catálogo');
    expect(apps).toContain('Pago');
    expect(apps).toContain("views = ['cards', 'table']");
    expect(apps).toContain("defaultView = 'cards'");
    expect(apps).toContain('columnPicker = true');
    expect(apps).toContain('pageSize = 10');
    expect(apps).toContain("searchKeys = ['name']");
    expect(apps).toContain("searchKeys = ['name', 'desc', 'cat']");

    for (const module of [
      'Inventario',
      'TPV / POS',
      'Clientes (CRM)',
      'Facturación',
      'Envíos',
      'Reservas',
      'Mensajería',
      'Analítica',
    ]) {
      expect(apps).toContain(`name: '${module}'`);
    }

    expect(apps).toContain('<ion-modal id="consent-modal">');
    expect(apps).toContain('Permisos solicitados');
    expect(apps).toContain('Instalar y conceder');
    expect(apps).toContain('<ion-toast id="apps-toast"');
    expect(apps).not.toContain('Migración fallida');
    expect(apps).not.toContain('Abriendo log');
  });

  it('reproduce BillingPage con facturas y suscripciones en data-table', () => {
    expect(billing.match(/<ok-data-table\b/g)).toHaveLength(2);
    expect(billing).toContain('<ok-data-table id="invoices-table" fill>');
    expect(billing).toContain('<ok-data-table id="subscriptions-table" fill>');

    for (const tab of ['invoices', 'subscriptions', 'payments']) {
      expect(billing).toContain(`value="${tab}"`);
    }
    for (const label of ['Facturas', 'Suscripciones', 'Pagos']) {
      expect(billing).toContain(label);
    }

    for (const key of ['number', 'issueDate', 'dueDate', 'total', 'status']) {
      expect(billing).toContain(`key: '${key}'`);
    }
    for (const key of ['planName', 'planPrice', 'currentPeriodEnd', 'status']) {
      expect(billing).toContain(`key: '${key}'`);
    }
    expect(billing).toContain("{ id: 'download', label: 'Descargar', icon: 'download-outline' }");
    expect(billing).toContain('Actualizar plan');
    expect(billing).toContain('La gestión del método de pago se realiza desde el portal de facturación.');
    expect(billing).toContain("views = ['table', 'cards']");
    expect(billing).toContain("window.matchMedia('(max-width: 768px)')");
    expect(billing).toContain('invoicesTable.viewMode = initialView');
    expect(billing).toContain('subscriptionsTable.viewMode = initialView');
    expect(billing).toContain('columnPicker = true');
    expect(billing).toContain('pageSize = 10');

    for (const invented of [
      'Cafetería La Rambla',
      'Joan Castell',
      'INV-2026-0411',
      'VISA',
      'Abrir portal Stripe',
      'Mejorar a Pro',
      'Pagar ahora',
    ]) {
      expect(billing).not.toContain(invented);
    }
    expect(billing).not.toContain('<ok-inline-feedback');
    expect(billing).not.toContain('<ok-status-pill');
  });
});
