import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const overviewUrl = new URL('../../showcase/pages/module-backup-backup.html', import.meta.url);
const settingsUrl = new URL('../../showcase/pages/module-backup-settings.html', import.meta.url);
const overviewComponent = readFileSync(
  new URL(
    '../../../modules-workspace/modules/backup/ui/components/erp-backup-overview/erp-backup-overview.ts',
    import.meta.url,
  ),
  'utf8',
);
const settingsComponent = readFileSync(
  new URL(
    '../../../modules-workspace/modules/backup/ui/components/erp-backup-settings/erp-backup-settings.ts',
    import.meta.url,
  ),
  'utf8',
);
const migration = readFileSync(
  new URL('../../../modules-workspace/modules/backup/migrations/sqlite/001_init.sql', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(
  readFileSync(new URL('../../../modules-workspace/modules/backup/module.json', import.meta.url), 'utf8'),
) as { queries: Record<string, unknown>; commands: Record<string, unknown> };
const settingsSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/backup/schemas/settings_update.json', import.meta.url),
    'utf8',
  ),
) as {
  required: string[];
  properties: {
    enabled: { enum: number[] };
    schedule: { enum: string[] };
    retention_days: { minimum: number; maximum: number };
  };
};

function source(url: URL, route: string): string {
  expect(existsSync(url), `falta la demo real de ${route}`).toBe(true);
  return readFileSync(url, 'utf8');
}

describe('showcase module-backup-backup — paridad con el módulo real', () => {
  it('usa Hub iOS y resuelve la vista solo con controles Ionic', () => {
    const page = source(overviewUrl, '/m/backup/backup');
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/backup/backup'");
    expect(page).toContain("title: 'Copia de seguridad'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).toContain('<ion-list id="backup-history">');
    expect(page).not.toMatch(/<\/?ok-[a-z-]+/);
    expect(page).not.toMatch(/mode=["']md["']/);
  });

  it('muestra la programación y los tres estados válidos del historial', () => {
    const page = source(overviewUrl, '/m/backup/backup');
    const fixture = page.match(/const BACKUP_FIXTURE = (\[[\s\S]*?\n\s*\]);/);
    expect(migration).toContain('pending | uploaded | failed');
    expect(fixture).not.toBeNull();
    expect(JSON.parse(fixture![1]).map((row: { status: string }) => row.status)).toEqual([
      'uploaded',
      'pending',
      'failed',
    ]);
    for (const status of ['pending', 'uploaded', 'failed']) {
      expect(overviewComponent).toContain(`${status}:`);
      expect(page).toContain(`${status}:`);
    }
    for (const schedule of ['daily', 'weekly', 'manual']) {
      expect(page).toContain(`${schedule}:`);
    }
  });

  it('ejecuta la copia manual, registra la consulta y refresca el historial', () => {
    const page = source(overviewUrl, '/m/backup/backup');
    expect(manifest.queries).toHaveProperty('backup.list');
    expect(manifest.queries).toHaveProperty('backup.settings.get');
    expect(manifest.commands).toHaveProperty('backup.create');
    expect(page).toContain("recordQuery('backup.settings.get'");
    expect(page).toContain("recordQuery('backup.list'");
    expect(page).toContain("recordCommand('backup.create', { trigger: 'manual' })");
    expect(page).toContain("status: 'pending'");
    expect(page).toContain("addEventListener('click'");
    expect(page).toContain('renderHistory();');
  });
});

describe('showcase module-backup-settings — paridad con el módulo real', () => {
  it('usa el shell Hub iOS, controles Ionic y ion-alert para confirmar', () => {
    const page = source(settingsUrl, '/m/backup/settings');
    expect(page).toContain("active: '/m/backup/settings'");
    expect(page).toContain("title: 'Ajustes'");
    expect(page).toContain('<ion-toggle id="backup-enabled"');
    expect(page).toContain('<ion-select id="backup-schedule"');
    expect(page).toContain('<ion-input id="backup-retention"');
    expect(page).toContain('<ion-alert id="backup-confirm"');
    expect(page).not.toMatch(/<\/?ok-[a-z-]+/);
    expect(page).not.toContain('class="scrim"');
  });

  it('mantiene defaults, dominio y límites del schema', () => {
    const page = source(settingsUrl, '/m/backup/settings');
    expect(settingsSchema.required).toEqual(['enabled', 'schedule', 'retention_days']);
    expect(settingsSchema.properties.enabled.enum).toEqual([0, 1]);
    expect(settingsSchema.properties.schedule.enum).toEqual(['daily', 'weekly', 'manual']);
    expect(settingsSchema.properties.retention_days).toMatchObject({ minimum: 1, maximum: 365 });
    expect(settingsComponent).toContain("{ enabled: 0, schedule: 'daily', retention_days: 7 }");
    expect(page).toContain("const settings = { enabled: 0, schedule: 'daily', retention_days: 7 };");
    for (const value of ['daily', 'weekly', 'manual']) {
      expect(page).toContain(`value="${value}"`);
    }
    expect(page).toContain('min="1"');
    expect(page).toContain('max="365"');
  });

  it('confirma el objeto completo y revierte si se cancela', () => {
    const page = source(settingsUrl, '/m/backup/settings');
    expect(manifest.commands).toHaveProperty('backup.settings.update');
    expect(page).toContain("recordCommand('backup.settings.update', {");
    expect(page).toContain('enabled: settings.enabled');
    expect(page).toContain('schedule: settings.schedule');
    expect(page).toContain('retention_days: settings.retention_days');
    expect(page).toContain('Object.assign(settings, previous);');
    expect(page).toContain("role: 'cancel'");
    expect(page).toContain("role: 'confirm'");
  });
});
