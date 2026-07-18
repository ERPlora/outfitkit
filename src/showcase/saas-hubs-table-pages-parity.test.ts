import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

describe('showcase SaaS — tablas actuales de Terminales', () => {
  const active = readPage('hubs-active.html');
  const inactive = readPage('hubs-inactive.html');

  it('compone las dos páginas con el shell SaaS actual y ok-data-table como único ok-*', () => {
    for (const page of [active, inactive]) {
      expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
      expect(page).not.toContain("from './_page.js'");
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('<ok-page-header');
      expect(page).not.toMatch(/Ionic\s*=\s*\{[\s\S]*mode:\s*['"]md['"]/);
      expect(page).not.toMatch(/\bmode=['"]md['"]/);

      const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
      expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
    }

    expect(active).toContain('<ok-data-table id="hubs-active" fill>');
    expect(inactive).toContain('<ok-data-table id="hubs-inactive" fill>');
    expect(active).toContain("active: '/dashboard/hubs/'");
    expect(inactive).toContain("active: '/dashboard/hubs/'");
    expect(active).toContain("title: 'Terminales activos'");
    expect(inactive).toContain("title: 'Terminales inactivos'");
  });

  it('conserva la navegación real de Hubs en el footer', () => {
    for (const page of [active, inactive]) {
      for (const value of ['active', 'inactive', 'create', 'domain']) {
        expect(page).toContain(`value="${value}"`);
      }
      for (const label of ['Activo', 'Inactivo', 'Crear', 'Dominio']) {
        expect(page).toContain(`<ion-label>${label}</ion-label>`);
      }
    }
    expect(active).toContain('<ion-segment value="active"');
    expect(inactive).toContain('<ion-segment value="inactive"');
  });

  it('reproduce las columnas y filtros compartidos de _build_hubs_datatable_config', () => {
    for (const page of [active, inactive]) {
      for (const column of ['Terminal', 'Plan', 'Estado']) {
        expect(page).toContain(`header: '${column}'`);
      }
      expect(page).toContain("searchPlaceholder = 'Buscar terminales…'");
      expect(page).toContain('id="hubs-status-filter"');
      expect(page).toContain('id="hubs-plan-filter"');
      expect(page).toContain('Todos los estados');
      expect(page).toContain('Todos los planes');
    }

    expect(active).toContain("header: 'Próxima factura'");
    for (const column of ['CPU', 'RAM', 'Conexiones (org)']) {
      expect(active).toContain(`header: '${column}'`);
    }
    expect(inactive).toContain("header: 'Creado'");
    expect(inactive).not.toContain("header: 'CPU'");
    expect(inactive).not.toContain("header: 'RAM'");
    expect(inactive).not.toContain("header: 'Conexiones (org)'");
  });

  it('mantiene las acciones activas, sus restricciones y las acciones en lote', () => {
    for (const action of [
      'Abrir Terminal',
      'Migrar a Cloud',
      'Reanudar pago',
      'Editar',
      'Actualizar Hub',
      'Reiniciar',
      'Apagar',
      'Mejorar plan',
      'Usuarios',
      'Módulos',
      'Código QR',
      'Eliminar',
    ]) {
      expect(active).toContain(`label: '${action}'`);
    }
    expect(active).toContain("if (row.kind === 'local')");
    expect(active).toContain("if (row.status === 'pending_payment')");
    expect(active).toContain('table.selectable = true');
    for (const bulk of ['Reiniciar seleccionados', 'Actualizar seleccionados', 'Apagar seleccionados']) {
      expect(active).toContain(`label: '${bulk}'`);
    }
    expect(active).toContain("label: 'Crear Terminal', icon: 'add'");
  });

  it('limita la página inactiva a Reactivar y elimina contenido inventado', () => {
    expect(inactive).toContain("label: 'Reactivar'");
    for (const forbidden of ['Actualizar Hub', 'Reiniciar', 'Apagar', 'Abrir Terminal', 'Eliminar']) {
      expect(inactive).not.toContain(`label: '${forbidden}'`);
    }

    for (const invented of [
      'Política de retención',
      'se eliminan automáticamente tras 60 días',
      'EU-West-1',
      'Empresa',
      'Pedidos',
      'Uptime',
      'Exportar histórico',
    ]) {
      expect(active).not.toContain(invented);
      expect(inactive).not.toContain(invented);
    }
  });
});
