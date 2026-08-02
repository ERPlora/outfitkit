import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

describe('showcase SaaS dashboard — shell y Users fieles al producto actual', () => {
  const shell = readPage('_saas-dashboard.js');
  const css = readPage('_saas-dashboard.css');
  const users = readPage('users-list.html');

  it('expone un shell pequeño basado en la jerarquía Ionic real del SaaS', () => {
    expect(shell).toMatch(/export function defineSaasDashboardPage\s*\(\s*\{/);
    for (const option of ['active', 'title', 'body', 'footer', 'setup']) {
      expect(shell).toMatch(new RegExp(`\\b${option}\\b`));
    }

    expect(shell).toContain('../../dist/erplora.css');
    expect(shell).toContain('./_saas-dashboard.css');
    expect(shell).toContain('<ion-app>');
    expect(shell).toContain('<ion-split-pane content-id="main" when="lg" class="saas-dashboard-shell">');
    expect(shell).toContain('<ion-menu content-id="main" type="overlay" menu-id="main-menu"');
    expect(shell).toContain('<div id="main" class="dash-main">');
    expect(shell).toContain('<ion-header class="dash-header ion-no-border">');
    expect(shell).toContain('<ion-content class="dash-content">');
    expect(shell).toContain('<div id="dashboard-page-content" class="dash-page">');
  });

  it('conserva la navegación y el chrome visibles actuales sin wrappers OutfitKit', () => {
    for (const route of [
      '/dashboard/',
      '/dashboard/billing/',
      '/dashboard/marketplace/',
      '/dashboard/assistant/',
      '/dashboard/organizations/',
      '/dashboard/users/',
      '/dashboard/settings/',
      '/dashboard/help/',
      '/dashboard/hubs/',
    ]) {
      expect(shell).toContain(`path: '${route}'`);
    }

    expect(shell).toContain('lucide:layout-dashboard');
    expect(shell).toContain('lucide:sparkles');
    expect(shell).toContain('lucide:bell');
    expect(shell).toContain('lucide:sun-moon');
    expect(shell).toContain('class="erp-lockup sm brand-link"');
    expect(shell.match(/<i class="erp-(?:nw|n|ne|w|hub|e|sw|s|se)"><\/i>/g)).toHaveLength(9);
    expect(shell).not.toMatch(/<\/?ok-[a-z-]+/);
  });

  it('mantiene la geometría, el rail, la superficie redondeada y el modo fill reales', () => {
    expect(css).toContain('--side-width: 248px');
    expect(css).toContain('--side-width: 68px');
    expect(css).toContain('@media (min-width: 992px)');
    expect(css).toContain('.rail-toggle');
    expect(css).toContain('border-radius: 25px');
    expect(css).toContain('.nav-item[aria-current="page"]');
    expect(css).toContain('.dash-page:has(.dash-fill)');
    expect(css).toContain('.dash-fill > ok-data-table[fill]');
    expect(css).toContain('@media (min-width: 768px)');
  });

  it('migra Users desde su contrato real y deja ok-data-table como único ok-*', () => {
    expect(users).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
    expect(users).toContain("active: '/dashboard/users/'");
    expect(users).toContain("title: 'Usuarios'");
    expect(users).toContain('<ok-data-table id="users-dt" server-side fill>');
    expect(users).toContain('slot="toolbar" class="okdt-filters"');

    const outfitTags = [...users.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));

    for (const column of ['Usuario', 'Organización', 'Rol', 'Alta']) {
      expect(users).toContain(`header: '${column}'`);
    }
    expect(users).toContain("searchPlaceholder = 'Buscar usuarios…'");
    expect(users).toContain("label: 'Invitar usuario'");
    expect(users).toContain("label: 'Todos los roles'");
    expect(users).toContain("label: 'Todas las organizaciones'");
    expect(users).toContain("addEventListener('searchChange'");
    expect(users).toContain("addEventListener('pageChange'");
    expect(users).toContain("addEventListener('sortChange'");
    expect(users).toContain('<ion-segment-button value="users"');
    expect(users).toContain('<ion-segment-button value="invite"');
  });

  it('elimina del ejemplo Users los campos y acciones inventados por el prototipo', () => {
    expect(users).not.toContain('Usuarios de hubs');
    expect(users).not.toContain('Hubs accesibles');
    expect(users).not.toContain('Última conexión');
    expect(users).not.toContain("header: 'Estado'");
    expect(users).not.toContain('Exportar CSV');
    expect(users).not.toContain('Suspendido');
    expect(users).not.toContain('definePage');
    expect(users).not.toContain('_page.js');
    expect(users).not.toContain('_shell.css');
  });
});
