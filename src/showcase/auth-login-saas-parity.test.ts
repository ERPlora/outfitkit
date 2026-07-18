import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const page = readFileSync(new URL('../../showcase/pages/auth-login-saas.html', import.meta.url), 'utf8');
const cssUrl = new URL('../../showcase/pages/_saas-auth.css', import.meta.url);

describe('showcase auth-login-saas — paridad con el login efectivo del SaaS', () => {
  it('reproduce el estado inicial auth del wizard con los mismos primitivos Ionic', () => {
    expect(page).toContain('<ion-header class="ion-no-border auth-header">');
    expect(page).toContain('<ion-toolbar class="auth-toolbar">');
    expect(page).toContain('class="erp-logo lg"');
    expect(page.match(/<i class="erp-(?:nw|n|ne|w|hub|e|sw|s|se)"><\/i>/g)).toHaveLength(9);

    expect(page).toMatch(/<form\s+method="post"\s+action="">/);
    expect(page).toContain('data-bind="auth-username"');
    expect(page).toContain('name="auth-username"');
    expect(page).toContain('data-bind="auth-password"');
    expect(page).toContain('name="auth-password"');
    expect(page).toContain('label-placement="floating"');
    expect(page).toContain('name="auth-remember"');
    expect(page).toContain('>Sign in</ion-button>');
  });

  it('usa el bridge real ion-input → hidden input para el POST nativo', () => {
    expect(page).toContain("querySelectorAll('ion-input[data-bind]')");
    expect(page).toContain("inp.addEventListener('ionInput', sync)");
    expect(page).toContain("inp.addEventListener('ionChange', sync)");
    expect(page).toContain("form.addEventListener('submit', sync)");
  });

  it('no conserva el flujo, marca ni proveedores inventados del prototipo', () => {
    expect(page).not.toMatch(/<ok-/);
    expect(page).not.toContain('definePage');
    expect(page).not.toContain('_page.js');
    expect(page).not.toContain('ionic.bundle.css');
    expect(page).not.toContain('>EX<');
    expect(page).not.toContain('Continuar con Google');
    expect(page).not.toContain('Continuar con Microsoft');
    expect(page).not.toContain('Continuar con GitHub');
    expect(page).not.toContain('step-2fa');
    expect(page).not.toContain('00:42');
  });

  it('carga el CSS compartido extraído de los includes auth y conserva el glass/logo real', () => {
    expect(page).toContain('href="./_saas-auth.css"');

    const css = readFileSync(cssUrl, 'utf8');
    expect(css).toContain('.login-shell');
    expect(css).toContain('max-width: 420px');
    expect(css).toContain('.auth-card ion-card.glass');
    expect(css).toContain('backdrop-filter: blur(8px)');
    expect(css).toContain('.auth-header');
    expect(css).toContain('.erp-logo.lg { --u: 1.333px; }');
    expect(css).toContain('--erp-red: #ef4444');
    expect(css).toContain('--erp-green: #10b981');
    expect(css).toContain('--erp-yellow: #f59e0b');
  });
});
