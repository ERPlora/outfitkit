import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}.html`, import.meta.url), 'utf8');

const pages = {
  create: readPage('orgs-create'),
  detail: readPage('orgs-detail'),
  invite: readPage('orgs-invite'),
  usersInvite: readPage('users-invite'),
};

describe('showcase SaaS — organizaciones y alta de usuarios actuales', () => {
  it('usa el shell SaaS compartido y el modo iOS sin conservar el prototipo', () => {
    for (const page of Object.values(pages)) {
      expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
      expect(page).toContain('<script src="./_ionic-config.js"></script>');
      expect(page).not.toContain("from './_page.js'");
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('<ok-page-header');
      expect(page).not.toMatch(/\bmode=['"]md['"]/);
    }
    expect(pages.create).toContain("active: '/dashboard/organizations/'");
    expect(pages.usersInvite).toContain("active: '/dashboard/users/'");
  });

  it('reduce crear organización al formulario real', () => {
    expect(pages.create).toContain("title: 'Crear organización'");
    expect(pages.create).toContain('id="organization-name"');
    expect(pages.create).toContain('label="Nombre de la organización"');
    expect(pages.create).toContain('Crear organización');
    expect(pages.create).toContain('Cancelar');
    for (const invented of ['Color de marca', 'Sector (opcional)', 'erplora.com/o/', 'Vista previa']) {
      expect(pages.create).not.toContain(invented);
    }
  });

  it('refleja KPIs, ajustes, miembros, hubs y zona de peligro del detalle real', () => {
    for (const label of ['Hubs', 'Miembros', 'Plan', 'Rol']) {
      expect(pages.detail).toContain(`label="${label}"`);
    }
    expect(pages.detail.match(/<ok-kpi\b/g)).toHaveLength(4);
    expect(pages.detail).toContain('id="organization-members"');
    expect(pages.detail).toContain('id="organization-hubs"');
    expect(pages.detail).toContain("header: 'Miembro'");
    expect(pages.detail).toContain("header: 'Alta'");
    expect(pages.detail).toContain("header: 'Hub'");
    expect(pages.detail).toContain("header: 'Estado'");
    expect(pages.detail).toContain('Base de datos compartida');
    expect(pages.detail).toContain('Zona de peligro');
    expect(pages.detail).toContain('Salir de la organización');
    expect(pages.detail).toContain('Eliminar organización');
  });

  it('mantiene las diferencias entre invitar a organización e invitar usuario', () => {
    expect(pages.invite).toContain("title: 'Invitar miembro'");
    expect(pages.invite).toContain('id="organization-member-email"');
    expect(pages.invite).toContain('value="member"');
    expect(pages.invite).toContain('se añadirá como miembro');
    expect(pages.invite).not.toContain('label="Organización *"');

    expect(pages.usersInvite).toContain("title: 'Invitar usuario'");
    expect(pages.usersInvite).toContain('label="Organización *"');
    expect(pages.usersInvite).toContain('label="Hub (opcional)"');
    expect(pages.usersInvite).toContain('label="Rol"');
    expect(pages.usersInvite).toContain('Todos los hubs (nivel de organización)');
    expect(pages.usersInvite).toContain('Miembro · Acceso a hubs asignados');
    expect(pages.usersInvite).toContain('Administrador · Gestionar organización');
    expect(pages.usersInvite).toContain('Propietario · Control total');
    expect(pages.usersInvite).toContain('<ok-inline-feedback tone="info">');
  });
});
