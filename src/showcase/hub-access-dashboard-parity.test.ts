// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const hubBase = new URL('../../../hub/apps/web/src/views/', import.meta.url);
const pages = {
  login: new URL('auth-login-hub.html', base),
  activation: new URL('activation-hub.html', base),
  dashboard: new URL('dashboard-hub.html', base),
};
const sources = {
  login: readFileSync(new URL('LoginPage.vue', hubBase), 'utf8'),
  activation: readFileSync(new URL('ActivationPage.vue', hubBase), 'utf8'),
  dashboard: readFileSync(new URL('DashboardPage.vue', hubBase), 'utf8'),
};

function pageSource(name: keyof typeof pages): string {
  expect(existsSync(pages[name]), `falta ${name} real del Hub`).toBe(true);
  return readFileSync(pages[name], 'utf8');
}

function expectIos(page: string): void {
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  // outfitkit#84 / ADR-0143 (amendment 2026-08-11): the shell stays in ios, but the three form controls
  // that take `fill` MUST declare mode="md" per control (Ionic only implements `fill` in md), exactly as
  // the hub and the SaaS do (hub#760, saas#1080). What is forbidden is switching the PAGE config to md.
  expect(page).not.toMatch(/mode:\s*['"]md['"]/);
}

describe('showcase Hub — acceso y dashboard actuales', () => {
  it('login conserva email, confianza, PIN y alta del PIN sin piezas inventadas', () => {
    const page = pageSource('login');
    expectIos(page);
    for (const tag of ['ion-segment', 'ion-input', 'ion-input-password-toggle', 'ion-checkbox', 'ion-popover']) {
      expect(sources.login).toContain(`<${tag}`);
      expect(page).toContain(`<${tag}`);
    }
    expect(page).toContain('<ok-pinpad');
    expect(page).toContain('<ok-avatar');
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-avatar', 'ok-pinpad']));
  });

  it('activación reproduce motivo, reintento y cierre de sesión solo con Ionic', () => {
    const page = pageSource('activation');
    expectIos(page);
    expect(page).toContain('Necesita activación');
    expect(page).toContain('id="activation-reason"');
    expect(page).toContain('id="activation-retry"');
    expect(page).toContain('id="activation-logout"');
    expect(page).not.toMatch(/<\/?ok-[a-z-]+/);
  });

  it('dashboard conserva resumen, apps y actividad con el mismo shell actual', () => {
    const page = pageSource('dashboard');
    expectIos(page);
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/dashboard'");
    for (const tab of ['resumen', 'apps', 'actividad']) expect(page).toContain(`value="${tab}"`);
    expect(page).toContain('<ok-widget-board id="dashboard-board"');
    expect(page).toContain('<ok-data-table id="dashboard-activity-table" fill>');
    expect(page).toContain('id="dashboard-app-grid"');
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-widget-board', 'ok-data-table']));
    expect(sources.dashboard).toContain('<ok-widget-board');
    expect(sources.dashboard).toContain('<ok-data-table');
  });
});
