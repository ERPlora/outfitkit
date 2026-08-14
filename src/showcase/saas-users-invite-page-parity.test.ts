import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Sustituye a saas-organizations-users-detail-pages-parity.test.ts: las páginas de
// organización se retiraron con la propia entidad (ADR-0201) y aquí queda la parte
// que sigue existiendo en el producto, la invitación de usuarios.
const usersInvite = readFileSync(
  new URL('../../showcase/pages/users-invite.html', import.meta.url),
  'utf8',
);

describe('showcase SaaS — invitar usuario actual', () => {
  it('usa el shell SaaS compartido y el modo iOS sin conservar el prototipo', () => {
    expect(usersInvite).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
    expect(usersInvite).toContain('<script src="./_ionic-config.js"></script>');
    expect(usersInvite).not.toContain("from './_page.js'");
    expect(usersInvite).not.toContain('_shell.css');
    expect(usersInvite).not.toContain('<ok-page-header');
    expect(usersInvite).not.toMatch(/\bmode=['"]md['"]/);
    expect(usersInvite).toContain("active: '/dashboard/users/'");
  });

  it('mantiene el formulario de invitación con sus campos y roles', () => {
    expect(usersInvite).toContain("title: 'Invitar usuario'");
    expect(usersInvite).toContain('label="Hub (opcional)"');
    expect(usersInvite).toContain('label="Rol"');
    expect(usersInvite).toContain('Miembro · Acceso a hubs asignados');
    expect(usersInvite).toContain('Propietario · Control total');
    expect(usersInvite).toContain('<ok-inline-feedback tone="info">');
  });
});
