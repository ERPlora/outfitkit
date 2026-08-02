import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const organizations = readFileSync(
  new URL('../../showcase/pages/orgs-list.html', import.meta.url),
  'utf8',
);

describe('showcase SaaS — listado real de organizaciones', () => {
  it('usa el shell actual y ok-data-table como único componente OutfitKit', () => {
    expect(organizations).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
    expect(organizations).toContain("active: '/dashboard/organizations/'");
    expect(organizations).toContain("title: 'Organizaciones'");
    expect(organizations).toContain('<ok-data-table id="organizations-dt" server-side fill>');

    const outfitTags = [...organizations.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('refleja exactamente el contrato DataTableConfig de la vista Django', () => {
    for (const column of ['Organización', 'Hubs', 'Miembros', 'Rol', 'Alta']) {
      expect(organizations).toContain(`header: '${column}'`);
    }
    expect(organizations).toContain("searchPlaceholder = 'Buscar organizaciones…'");
    expect(organizations).toContain("label: 'Nueva organización'");
    expect(organizations).toContain("id: 'view', label: 'Ver'");
    expect(organizations).toContain("value: 'owner', label: 'Propietario'");
    expect(organizations).toContain("value: 'admin', label: 'Administrador'");
    expect(organizations).toContain("value: 'member', label: 'Miembro'");
  });

  it('no conserva secciones o acciones del prototipo anterior', () => {
    expect(organizations).not.toContain('definePage');
    expect(organizations).not.toContain('_page.js');
    expect(organizations).not.toContain('_shell.css');
    expect(organizations).not.toContain('Exportar CSV');
    expect(organizations).not.toContain('Plan Enterprise');
    expect(organizations).not.toContain('Facturación');
  });
});
