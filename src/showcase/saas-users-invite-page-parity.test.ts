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
    // outfitkit#84 / ADR-0143 (enmienda 2026-08-11): the SHELL stays in ios, but the three form controls that
    // take `fill` must declare mode="md" (Ionic only implements `fill` in md) — the SaaS page itself does
    // (saas#1080). What this guard forbids is switching the page CONFIG to md, not the per-control attribute.
    expect(usersInvite).not.toMatch(/mode:\s*['"]md['"]/);
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
