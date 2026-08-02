import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

// El catálogo se ejecuta directamente en el navegador del showcase; Vitest también
// lo importa para impedir que vuelva a separarse de las superficies reales.
// @ts-expect-error — módulo JS del showcase, sin declaraciones TypeScript.
import { PAGES, SURFACES } from '../../showcase/pages-data.js';

interface ShowcasePage {
  id: string;
  name: string;
  file?: string;
  surface: 'saas' | 'hub' | 'modules';
  section: string;
  route: string;
  source: string;
  parity: 'current' | 'pending' | 'source';
}

const pages = PAGES as ShowcasePage[];

describe('catálogo de páginas reales', () => {
  it('se organiza por SaaS, Hub y Módulos', () => {
    expect(SURFACES.map((surface: { id: string }) => surface.id)).toEqual([
      'saas',
      'hub',
      'modules',
    ]);
    expect(new Set(pages.map((page) => page.surface))).toEqual(
      new Set(['saas', 'hub', 'modules']),
    );
  });

  it('mantiene trazabilidad hacia la ruta y la fuente reales', () => {
    for (const page of pages) {
      expect(page.section, page.id).toBeTruthy();
      expect(page.route, page.id).toMatch(/^\//);
      expect(page.source, page.id).toMatch(/^(saas|hub|modules-workspace)\//);
      expect(['current', 'pending', 'source'], page.id).toContain(page.parity);
      if (page.file) {
        expect(
          existsSync(resolve(process.cwd(), 'showcase', page.file.replace(/^pages\//, 'pages/'))),
          page.id,
        ).toBe(true);
      }
    }
  });

  it('no publica demos que no existen en los productos actuales', () => {
    const removed = [
      'marketplace-saas-cart',
      'marketplace-saas-checkout',
      'marketplace-saas-success',
      'marketplace-hub-index',
      'marketplace-hub-catalog',
      'marketplace-hub-detail',
      'profile-hub',
      'public-index',
      'public-catalog',
      'public-product',
      'errors-405',
      'errors-bootstrap',
      'errors-bootstrap-detail',
      'errors-unauthorized',
    ];
    expect(pages.filter((page) => removed.includes(page.id))).toEqual([]);

    const obsoleteFiles = [
      'marketplace-saas-shop.html',
      'marketplace-saas-cart.html',
      'marketplace-saas-checkout.html',
      'marketplace-saas-success.html',
      'marketplace-hub-index.html',
      'marketplace-hub-catalog.html',
      'marketplace-hub-detail.html',
      'marketplace-hub-solutions.html',
      'marketplace-hub-business-types.html',
      'marketplace-hub-compliance.html',
      'marketplace-hub-my-purchases.html',
      'marketplace-hub-checkout.html',
      'marketplace-hub-readme.html',
      'profile-hub.html',
      'public-index.html',
      'public-catalog.html',
      'public-product.html',
      'errors-403.html',
      'errors-405.html',
      'errors-bootstrap.html',
      'errors-bootstrap-detail.html',
      'errors-unauthorized.html',
      'system-bridge-setup.html',
      'roles-list.html',
      'roles-form.html',
      'roles-detail.html',
      'roles-confirm-delete.html',
      'orgs-billing.html',
      'orgs-shipping.html',
      'orgs-payment-methods.html',
      'billing-vendor-dashboard.html',
      'settings-hub-config.html',
      'settings-compliance.html',
      'settings-printers.html',
      'settings-backup.html',
      'settings-tax-classes.html',
      'settings-scheduled-tasks.html',
      'settings-files.html',
    ];
    for (const file of obsoleteFiles) {
      expect(existsSync(resolve(process.cwd(), 'showcase', 'pages', file)), file).toBe(false);
    }
  });

  it('conserva la URL pública del login SaaS y la enlaza a su plantilla efectiva', () => {
    expect(pages.find((page) => page.id === 'auth-login-saas')).toMatchObject({
      surface: 'saas',
      route: '/account/login/',
      source: 'saas/templates/two_factor/core/login.html',
      file: 'pages/auth-login-saas.html',
      parity: 'current',
    });
  });

  it('publica únicamente las páginas ya reconstruidas desde producto', () => {
    const currentIds = [
      'auth-login-saas',
      'auth-2fa-setup',
      'auth-2fa-profile',
      'auth-2fa-disable',
      'auth-change-password',
      'auth-sessions',
      'auth-delete-account',
      'dashboard-saas',
      'billing-invoices',
      'billing-invoice-detail',
      'billing-subscriptions',
      'billing-purchases',
      'billing-payment-history',
      'assistant-saas',
      'marketplace-modules',
      'marketplace-plans',
      'marketplace-module-detail',
      'orgs-list',
      'orgs-create',
      'orgs-detail',
      'orgs-invite',
      'users-list',
      'users-invite',
      'hubs-dashboard',
      'hubs-active',
      'hubs-inactive',
      'hubs-create',
      'hubs-settings',
      'hubs-users',
      'hubs-modules',
      'hubs-qr',
      'hubs-domain',
      'hubs-change-plan',
      'hubs-files',
      'profile-saas',
      'settings-preferences',
      'settings-devices',
      'settings-help',
      'help-support',
      'help-document',
      'modules-overview',
      'modules-my',
      'modules-upload',
      'modules-edit',
      'modules-stats',
      'modules-members',
      'modules-repositories',
      'modules-add-from-git',
      'developer-api-docs',
      'developer-earnings',
      'developer-payouts',
      'developer-stripe-connect',
      'public-home',
      'public-modules',
      'public-module-detail',
      'public-pricing',
      'errors-404',
      'errors-500',
      'auth-login-hub',
      'activation-hub',
      'dashboard-hub',
      'employees-list',
      'employees-add',
      'employees-edit',
      'files-hub',
      'billing-hub',
      'apps-hub',
      'system-index',
      'api-docs-hub',
      'settings-hub',
      'module-shell-hub',
      'module-appointments-appointments',
      'module-backup-backup',
      'module-backup-settings',
      'module-cart-checkout-carts',
      'module-cart-checkout-orders',
      'module-cash-register-cash-register',
      'module-customers-customers',
      'module-customers-groups',
      'module-customers-tags',
      'module-customers-fields',
      'module-inventory-dashboard',
      'module-inventory-products',
      'module-inventory-categories',
      'module-invoice-invoice',
      'module-invoice-settings',
      'module-invoice-series-list',
      'module-kitchen-display',
      'module-kitchen-active',
      'module-kitchen-stations',
      'module-online-booking-bookings',
      'module-online-booking-settings',
      'module-payment-gateways-gateways',
      'module-payments-list',
      'module-pricing-lists',
      'module-printing-printing',
      'module-printing-routing',
      'module-reservations-list',
      'module-reservations-waitlist',
      'module-reservations-availability',
      'module-sales-pos',
      'module-sales-sales',
      'module-schedules-hours',
      'module-services-services',
      'module-staff-staff',
      'module-staff-roles',
      'module-staff-time-off',
      'module-staff-schedules',
      'module-tables-floor-plan',
      'module-tables-zones',
      'module-tasks-all',
      'module-tasks-projects',
      'module-taxes-categories',
      'module-taxes-rules',
      'module-taxes-aliases',
      'module-tickets-list',
      'module-tickets-sla',
      'module-verifactu-records',
      'module-verifactu-contingency',
      'module-verifactu-events',
      'module-verifactu-recovery',
      'module-verifactu-settings',
      'module-whatsapp-inbox-inbox',
      'module-whatsapp-inbox-requests',
      'module-whatsapp-inbox-templates',
    ];
    expect(pages.filter((page) => page.parity === 'current').map((page) => page.id)).toEqual(currentIds);
  });
});
