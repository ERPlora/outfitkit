import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

const pageNames = [
  'modules-overview.html',
  'modules-upload.html',
  'modules-edit.html',
  'modules-stats.html',
  'modules-members.html',
  'modules-repositories.html',
  'modules-add-from-git.html',
  'developer-api-docs.html',
  'billing-stripe-connect.html',
] as const;

const pages = Object.fromEntries(pageNames.map((name) => [name, readPage(name)]));

const expectDeveloperPage = (name: typeof pageNames[number], activeTab: string): string => {
  const page = pages[name];
  expect(page).toContain("import { defineDeveloperPage } from './_saas-developer.js'");
  expect(page).toContain(`activeTab: '${activeTab}'`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toContain("from './_page.js'");
  expect(page).not.toContain('_shell.css');
  expect(page).not.toContain('ok-page-header');
  expect(page).not.toContain('ok-avatar');
  expect(page).not.toMatch(/mode=["']md["']/);
  expect(page).not.toContain("mode: 'md'");
  return page;
};

describe('showcase SaaS — páginas actuales de Developer', () => {
  it('centraliza el shell y las siete secciones reales del área Developer', () => {
    const helper = readPage('_saas-developer.js');
    expect(helper).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
    expect(helper).toContain("active: '/dashboard/developer/'");

    for (const tab of ['overview', 'earnings', 'payouts', 'modules', 'blueprints', 'repositories', 'apidocs']) {
      expect(helper).toContain(`value="${tab}"`);
    }
  });

  it('reproduce el resumen con avisos, cuatro KPI y actividad reciente real', () => {
    const page = expectDeveloperPage('modules-overview.html', 'overview');
    for (const text of [
      'Hazte vendedor',
      'Conecta Stripe para recibir pagos',
      'Ingresos totales',
      'Saldo pendiente',
      'Descargas',
      'Mis módulos',
      'Ingresos recientes',
      'Pagos recientes',
    ]) expect(page).toContain(text);
    expect(page).toContain('<ok-inline-feedback');
    expect(page).not.toContain('ok-data-table');
  });

  it('reproduce la subida real con formulario Ionic y dropzones solo para archivos', () => {
    const page = expectDeveloperPage('modules-upload.html', 'modules');
    for (const text of [
      'Información básica',
      'Nombre del módulo',
      'Descripción',
      'Nombre del autor',
      'Precios',
      'Tipo de módulo',
      'Archivos',
      'Tipos de negocio',
      'Bloques funcionales',
      'Proceso de revisión',
      'Enviar módulo',
    ]) expect(page).toContain(text);
    expect(page).toContain('<ok-dropzone id="module-icon" accept="image/*"');
    expect(page).toContain('<ok-dropzone id="module-zip" accept=".zip"');
    expect(page).not.toContain('ok-stepper');
    expect(page).not.toContain('manifest.yml');
    expect(page).not.toContain('Vista previa del marketplace');
  });

  it('reproduce la edición con taxonomía completa y precio de solo lectura', () => {
    const page = expectDeveloperPage('modules-edit.html', 'modules');
    for (const text of [
      'Inventario Avanzado',
      'Sincronizar desde Git',
      'Taxonomía',
      'Categoría',
      'Subcategoría principal',
      'Subcategorías secundarias',
      'Tipos de negocio',
      'Clasificación',
      'Países',
      'declarado en module.json',
      'no se puede editar aquí',
      'Guardar cambios',
      'Eliminar este módulo',
    ]) expect(page).toContain(text);
  });

  it('reproduce las estadísticas sin gráficos ni tablas inventadas', () => {
    const page = expectDeveloperPage('modules-stats.html', 'modules');
    for (const text of [
      'Descargas totales',
      'Compras totales',
      'Ingresos totales',
      'Instalaciones activas',
      'Precios',
      'Clasificación',
      'Valoración',
      'Rendimiento del módulo',
    ]) expect(page).toContain(text);
    expect(page).not.toContain('ok-data-table');
    expect(page).not.toContain('<canvas');
  });

  it('reproduce miembros como lista Ionic y mantiene los cuatro roles reales', () => {
    const page = expectDeveloperPage('modules-members.html', 'modules');
    for (const text of [
      'Total de miembros',
      'Incluye al creador',
      'Creador',
      'Miembros del equipo',
      'Permisos por rol',
      'Propietario',
      'Mantenedor',
      'Desarrollador',
      'Lector',
    ]) expect(page).toContain(text);
    expect(page).toContain('<ion-list id="members-list"');
    expect(page).not.toContain('ok-data-table');
  });

  it('reproduce repositorios con el DataTable central y su configuración real', () => {
    const page = expectDeveloperPage('modules-repositories.html', 'repositories');
    expect(page).toContain('<ok-inline-feedback tone="warning"');
    expect(page).toContain('<ok-data-table id="repositories-dt" server-side fill>');
    for (const column of ['Repositorio', 'Rama', 'Última sincronización', 'Módulos', 'Estado']) {
      expect(page).toContain(`header: '${column}'`);
    }
    expect(page).toContain('data-okdt-param="provider"');
    expect(page).toContain('data-okdt-param="is_active"');
    expect(page).toContain("searchPlaceholder = 'Buscar repositorios…'");
    expect(page).toContain("primaryAction = { label: 'Importar desde Git', icon: 'add' }");
    expect(page).toContain('Cómo funciona el gestor de módulos');
  });

  it('reproduce la importación Git con origen público/privado y module.json', () => {
    const page = expectDeveloperPage('modules-add-from-git.html', 'repositories');
    for (const text of [
      'Repositorios públicos',
      'Repositorios privados',
      'Instalar GitHub App',
      'URL del repositorio',
      'Rama',
      'Sector',
      'Unidad funcional',
      'Tipo de módulo',
      'Ejemplo de module.json',
      'Importar módulo',
    ]) expect(page).toContain(text);
    expect(page).toContain('id="module-type-select"');
    expect(page).toContain('data-price-field="one_time"');
    expect(page).toContain('data-price-field="subscription"');
    expect(page).not.toContain('ok-data-table');
  });

  it('mantiene Swagger dentro del shell del dashboard', () => {
    const page = expectDeveloperPage('developer-api-docs.html', 'apidocs');
    expect(page).toContain('<iframe src="/api/docs/" title="API Docs"');
    expect(page).toContain('class="developer-api-frame"');
    expect(page).not.toContain('target="_blank"');
  });

  it('reproduce la conexión inicial de Stripe con sus tres pasos y selector de país', () => {
    const page = expectDeveloperPage('billing-stripe-connect.html', 'payouts');
    for (const text of [
      'Crear cuenta de Stripe Connect',
      'País',
      'Conectar con Stripe',
      'Cómo funciona',
      'Crear cuenta',
      'Completar onboarding',
      'Recibir pagos',
      'Seguro y fiable',
    ]) expect(page).toContain(text);
    expect(page).toContain('<ion-select id="country-select"');
    expect(page).not.toContain('ok-data-table');
  });
});
