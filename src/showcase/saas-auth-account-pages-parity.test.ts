import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}.html`, import.meta.url), 'utf8');

const pages = {
  setup: readPage('auth-2fa-setup'),
  profile: readPage('auth-2fa-profile'),
  disable: readPage('auth-2fa-disable'),
  password: readPage('auth-change-password'),
  sessions: readPage('auth-sessions'),
  deletion: readPage('auth-delete-account'),
};

describe('showcase SaaS — autenticación y cuenta fieles a las plantillas Django', () => {
  it('reutiliza el shell SaaS e Ionic iOS sin conservar el prototipo antiguo', () => {
    for (const page of Object.values(pages)) {
      expect(page).toContain('<script src="./_ionic-config.js"></script>');
      expect(page).toContain('@ionic/core/dist/ionic/ionic.esm.js');
      expect(page).toContain('@ionic/core/css/ionic.bundle.css');
      expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
      expect(page).toContain("active: '/dashboard/settings/'");

      expect(page).not.toContain('definePage');
      expect(page).not.toContain('_page.js');
      expect(page).not.toContain('_shell.css');
      expect(page).not.toContain('dist/outfitkit.js');
      expect(page).not.toContain('ok-page-header');
      expect(page).not.toContain('ok-status-pill');
      expect(page).not.toContain('ok-data-table');
    }
  });

  it('muestra el estado inicial real del alta TOTP, sin pasos ni códigos inventados', () => {
    const page = pages.setup;
    expect(page).toContain("title: 'Configurar autenticación en dos pasos'");
    expect(page).toContain('Protege tu cuenta');
    expect(page).toContain('Una aplicación de autenticación en tu móvil');
    expect(page).toContain('Google Authenticator, Authy u otra similar');
    expect(page).toContain('>Empezar</ion-button>');
    expect(page).toContain('>Cancelar</ion-button>');

    expect(page).not.toContain('ok-stepper');
    expect(page).not.toContain('Códigos de respaldo');
    expect(page).not.toContain('JBSW Y3DP');
    expect(page).not.toContain('Google Authenticator</div>');
  });

  it('refleja el estado por defecto Email OTP del perfil 2FA', () => {
    const page = pages.profile;
    expect(page).toContain("title: 'Autenticación en dos pasos'");
    expect(page).toContain('Verificación por email activada');
    expect(page).toContain('Se envía un código de 6 dígitos a tu email');
    expect(page).toContain('Mejorar con una aplicación de autenticación');
    expect(page).toContain('Desactivar verificación por email');
    expect(page).toContain('Métodos de seguridad');

    expect(page).not.toContain('Dispositivos registrados');
    expect(page).not.toContain('Códigos de respaldo');
    expect(page).not.toContain('Último uso');
  });

  it('mantiene la confirmación real para desactivar 2FA y reutiliza el feedback de peligro', () => {
    const page = pages.disable;
    expect(page).toContain('../../dist/ok-inline-feedback.js');
    expect(page).toContain('<ok-inline-feedback tone="danger"');
    expect(page).toContain('Esto reducirá la seguridad de tu cuenta');
    expect(page).toContain('tu cuenta quedará protegida únicamente por tu contraseña');
    expect(page).toContain('>Cancelar</ion-button>');
    expect(page).toContain('>Desactivar 2FA</ion-button>');
  });

  it('conserva el formulario y el bridge real de cambio de contraseña', () => {
    const page = pages.password;
    expect(page).toContain('../../dist/ok-inline-feedback.js');
    expect(page).toContain('heading="Requisitos de la contraseña"');
    expect(page).toContain('data-bind="old_password"');
    expect(page).toContain('name="old_password"');
    expect(page).toContain('data-bind="new_password1"');
    expect(page).toContain('name="new_password1"');
    expect(page).toContain('data-bind="new_password2"');
    expect(page).toContain('name="new_password2"');
    expect(page).toContain("querySelectorAll('ion-input[data-bind]')");
    expect(page).toContain("form.addEventListener('submit', sync)");
    expect(page).toContain('Usa una contraseña única para esta cuenta');
  });

  it('lista únicamente sesiones reales de Hub y conserva las acciones del backend', () => {
    const page = pages.sessions;
    expect(page).toContain('Cada elemento es un Hub Desktop, Hub Local o aplicación móvil');
    expect(page).toContain('Cerrar sesión en los demás dispositivos');
    expect(page).toContain('name="action" value="revoke_others"');
    expect(page).toContain('name="action" value="revoke"');
    expect(page).toContain('name="session_id"');
    expect(page).toContain('Este dispositivo');
    expect(page).toContain('Revocada');

    expect(page).not.toContain('Chrome 142');
    expect(page).not.toContain('Historial de logins');
    expect(page).not.toContain('Nueva ubicación');
    expect(page).not.toContain('30 días');
  });

  it('conserva las consecuencias y confirmación reales de eliminar la cuenta', () => {
    const page = pages.deletion;
    expect(page).toContain('heading="Aviso: esta acción es permanente"');
    for (const consequence of [
      'Tu perfil e información personal',
      'Todos tus hubs y sus datos',
      'Tu suscripción e información de facturación',
      'Todos los módulos y configuraciones',
      'Historial de pagos y facturas',
    ]) {
      expect(page).toContain(consequence);
    }
    expect(page).toContain('name="action" value="delete_account"');
    expect(page).toContain('data-bind="password"');
    expect(page).toContain('>Eliminar mi cuenta</ion-button>');
    expect(page).toContain('>Contactar con soporte</ion-button>');

    expect(page).not.toContain('4 organizaciones');
    expect(page).not.toContain('3 hubs continúan activos');
    expect(page).not.toContain('7 años');
    expect(page).not.toContain('TRANSFERIR PROPIEDAD');
  });

  it('usa solamente ok-inline-feedback donde Ionic no cubre el callout', () => {
    for (const [name, page] of Object.entries(pages)) {
      const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
      const expected = ['disable', 'password', 'sessions', 'deletion'].includes(name)
        ? new Set(['ok-inline-feedback'])
        : new Set();
      expect(new Set(outfitTags)).toEqual(expected);
    }
  });
});
