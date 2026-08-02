import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}.html`, import.meta.url), 'utf8');

const names = [
  'hubs-dashboard',
  'hubs-create',
  'hubs-settings',
  'hubs-users',
  'hubs-modules',
  'hubs-qr',
  'hubs-domain',
  'hubs-change-plan',
  'hubs-files',
] as const;

describe('showcase SaaS — páginas actuales de detalle de Terminal', () => {
  it('compone todo con el shell SaaS iOS y la navegación real de Hubs', () => {
    for (const name of names) {
      const page = readPage(name);
      expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
      expect(page).toContain('<script src="./_ionic-config.js"></script>');
      expect(page).toContain("active: '/dashboard/hubs/'");
      expect(page).not.toContain("from './_page.js'");
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('<ok-page-header');
      expect(page).not.toMatch(/\bmode=['"]md['"]/);
    }
  });

  it('reproduce el dashboard con sus tres KPIs, hubs recientes y acciones rápidas', () => {
    const page = readPage('hubs-dashboard');
    for (const label of ['Total hubs', 'Activos', 'Usuarios']) {
      expect(page).toContain(`label="${label}"`);
    }
    expect(page.match(/<ok-kpi\b/g)).toHaveLength(3);
    expect(page).toContain('Tus Hubs');
    expect(page).toContain('Última conexión');
    expect(page).toContain('Acceder');
    for (const action of ['Ver todos los Hubs', 'Facturación', 'Ajustes']) {
      expect(page).toContain(action);
    }
  });

  it('mantiene en crear Hub las secciones comerciales y de pago reales, sin wizard inventado', () => {
    const page = readPage('hubs-create');
    for (const label of [
      'Despliegue Cloud', 'Seguro y fiable', 'Configuración inmediata', 'Detalles del Hub',
      'Nombre del Hub', 'Plan de suscripción', 'Método de pago', 'Tarjeta de crédito/débito (Stripe)',
      'Acepto los términos y condiciones', 'Continuar al pago',
    ]) {
      expect(page).toContain(label);
    }
    expect(page).toContain('id="hub-slug-preview"');
    expect(page).toContain('Mensual');
    expect(page).toContain('Anual');
    expect(page).toContain('<ok-inline-feedback tone="warning"');
    expect(page).not.toContain('<ok-stepper');
    expect(page).not.toContain('Paso 2 de 5');
    expect(page).not.toContain('EU-West-1');
  });

  it('refleja ajustes, usuarios y módulos usando DataTable en los listados ricos', () => {
    const settings = readPage('hubs-settings');
    expect(settings).toContain('Ajustes generales');
    expect(settings).toContain('label="Nombre del Hub"');
    expect(settings).toContain('label="Dirección"');
    for (const label of ['ID del Hub', 'Slug', 'Estado', 'Creado']) expect(settings).toContain(label);

    const users = readPage('hubs-users');
    expect(users).toContain('label="Usuarios totales"');
    expect(users).toContain('label="Usuarios activos"');
    expect(users).toContain('<ok-data-table id="hub-users-dt"');
    expect(users).toContain('<ok-data-table id="hub-activity-dt"');
    for (const column of ['Usuario', 'Rol / Estado', 'Añadido']) expect(users).toContain(`header: '${column}'`);
    for (const column of ['Usuario', 'Actividad', 'Cuándo']) expect(users).toContain(`header: '${column}'`);

    const modules = readPage('hubs-modules');
    expect(modules).toContain('<ok-inline-feedback tone="warning" heading="Gestión de módulos">');
    expect(modules).toContain('<ok-data-table id="hub-modules-dt" server-side fill>');
    for (const column of ['Módulo', 'ID', 'Versión', 'Estado', 'Instalado']) {
      expect(modules).toContain(`header: '${column}'`);
    }
    expect(modules).toContain("searchPlaceholder = 'Buscar módulos…'");
    expect(modules).toContain('Todos los estados');
  });

  it('conserva el QR, el dominio y el cambio de plan que existen en SaaS', () => {
    const qr = readPage('hubs-qr');
    expect(qr).toContain('id="qr-container"');
    expect(qr).toContain('ERPlora Bridge');
    expect(qr).toContain('Abrir web');
    for (const step of ['Descarga la app', "Pulsa «Escanear QR»", 'Apunta la cámara', 'se configurará automáticamente']) {
      expect(qr).toContain(step);
    }

    const domain = readPage('hubs-domain');
    expect(domain).toContain('URL del Hub');
    expect(domain).toContain('Dominio personalizado');
    expect(domain).toContain('Instrucciones de configuración');
    expect(domain).toContain('CNAME');
    expect(domain).toContain('Los certificados SSL');

    const plan = readPage('hubs-change-plan');
    expect(plan).toContain('Plan actual');
    expect(plan).toContain('Planes disponibles');
    expect(plan).toContain('Mensual');
    expect(plan).toContain('Anual');
    expect(plan).toContain('Confirmar cambio de plan');
    expect(plan).toContain('Los upgrades se cobran inmediatamente');
  });

  it('reutiliza ok-file-manager para el navegador real y mantiene almacenamiento y backup', () => {
    const page = readPage('hubs-files');
    expect(page).toContain('<ok-file-manager id="hub-files-manager" searchable>');
    expect(page).toContain('Ruta de almacenamiento');
    expect(page).toContain('Base de datos');
    expect(page).toContain('Crear backup en S3');
    expect(page).toContain("search: 'Buscar archivos…'");
    expect(page).toContain("newFolder: 'Nueva carpeta'");
    expect(page).not.toContain('<ok-file-manager id="hub-files-manager" searchable uploadable>');
    expect(page).not.toContain('Cuota usada');
  });
});
