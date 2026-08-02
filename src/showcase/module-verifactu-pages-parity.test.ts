import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/verifactu/', import.meta.url);

const pages = {
  records: new URL('module-verifactu-records.html', pageBase),
  contingency: new URL('module-verifactu-contingency.html', pageBase),
  events: new URL('module-verifactu-events.html', pageBase),
  recovery: new URL('module-verifactu-recovery.html', pageBase),
  settings: new URL('module-verifactu-settings.html', pageBase),
};

const components = {
  records: readFileSync(new URL('ui/components/erp-verifactu-records/erp-verifactu-records.ts', moduleBase), 'utf8'),
  contingency: readFileSync(new URL('ui/components/erp-verifactu-contingency/erp-verifactu-contingency.ts', moduleBase), 'utf8'),
  events: readFileSync(new URL('ui/components/erp-verifactu-events/erp-verifactu-events.ts', moduleBase), 'utf8'),
  recovery: readFileSync(new URL('ui/components/erp-verifactu-recovery/erp-verifactu-recovery.ts', moduleBase), 'utf8'),
  settings: readFileSync(new URL('ui/components/erp-verifactu-settings/erp-verifactu-settings.ts', moduleBase), 'utf8'),
};

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  navigation: Array<{ id: string; component: string }>;
  queries: Record<string, { list?: { page_size: number; default_sort: string; default_dir: string } }>;
  commands: Record<string, unknown>;
};
const configSchema = JSON.parse(readFileSync(new URL('schemas/config_save.json', moduleBase), 'utf8')) as {
  properties: {
    mode: { enum: string[] };
    environment: { enum: string[] };
    retry_interval_minutes: { minimum: number; maximum: number };
    max_retries: { minimum: number; maximum: number };
  };
};
const diagnosticSchema = JSON.parse(readFileSync(new URL('schemas/diagnostics_run.json', moduleBase), 'utf8')) as {
  properties: { invoice_type: { enum: string[] } };
};
const manualSchema = JSON.parse(readFileSync(new URL('schemas/recovery_manual.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { record_hash: { pattern: string } };
};

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de verifactu/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function expectHubPage(page: string, route: string, title: string): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  expect(page).not.toMatch(/mode=["']md["']/);
}

function expectServerTable(page: string, id: string): void {
  expect(page).toContain(`<ok-data-table id="${id}"`);
  expect(page).toContain('table.serverSide = true');
  expect(page).toContain('table.views = true');
  expect(page).toContain('table.cardTitle = (row) =>');
  expect(page).toContain('table.cardIcon = () =>');
  expect(page).toContain('table.searchable = true');
  expect(page).toContain('table.pageSize = 50');
  for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
    expect(page).toContain(`addEventListener('${event}'`);
  }
}

describe('showcase verifactu — cinco vistas reales del manifest', () => {
  it('conserva navegación, shell Hub e Ionic iOS', () => {
    expect(manifest.navigation.map(({ id, component }) => ({ id, component }))).toEqual([
      { id: 'records', component: 'erp-verifactu-records' },
      { id: 'contingency', component: 'erp-verifactu-contingency' },
      { id: 'events', component: 'erp-verifactu-events' },
      { id: 'recovery', component: 'erp-verifactu-recovery' },
      { id: 'settings', component: 'erp-verifactu-settings' },
    ]);
    expectHubPage(pageSource('records'), '/m/verifactu/records', 'Registros');
    expectHubPage(pageSource('contingency'), '/m/verifactu/contingency', 'Contingencia');
    expectHubPage(pageSource('events'), '/m/verifactu/events', 'Eventos');
    expectHubPage(pageSource('recovery'), '/m/verifactu/recovery', 'Recuperación');
    expectHubPage(pageSource('settings'), '/m/verifactu/settings', 'Ajustes');
  });
});

describe('showcase module-verifactu-records — tabla fiscal', () => {
  it('reproduce columnas, dominios y contrato de lista sin acciones inventadas', () => {
    const page = pageSource('records');
    expectServerTable(page, 'verifactu-records-table');
    for (const key of [
      'sequence_number', 'invoice_number', 'invoice_date', 'record_type',
      'invoice_type', 'issuer_name', 'total_amount', 'status',
    ]) {
      expect(components.records).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const value of ['alta', 'anulacion', 'pending', 'transmitted', 'accepted', 'rejected', 'error', 'retry']) {
      expect(page).toContain(`value: '${value}'`);
    }
    expect(manifest.queries['verifactu.records.list'].list).toMatchObject({
      page_size: 50,
      default_sort: 'id',
      default_dir: 'asc',
    });
    expect(page).toContain("table.sort = 'id'");
    expect(page).toContain("table.sortDir = 'asc'");
    expect(page).toContain("table.cardIcon = () => 'document-text-outline'");
    expect(page).toContain("table.searchPlaceholder = 'Buscar factura, emisor o NIF…'");
    expect(page).not.toContain('table.actions =');
    expect(page).not.toContain("addEventListener('rowAction'");
  });
});

describe('showcase module-verifactu-contingency — cola operativa', () => {
  it('conserva las seis columnas y las tres operaciones disponibles', () => {
    const page = pageSource('contingency');
    expectServerTable(page, 'verifactu-contingency-table');
    for (const key of ['record_id', 'priority', 'attempts', 'status', 'next_attempt_at', 'last_error']) {
      expect(components.contingency).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(page).toContain("table.actions = [");
    expect(page).toContain("id: 'retry'");
    expect(page).toContain("id: 'cancel'");
    expect(page).not.toMatch(/id:\s*['"](?:edit|delete|transmit)['"]/);
    for (const command of [
      'verifactu.contingency.process',
      'verifactu.contingency.retry',
      'verifactu.contingency.cancel',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
    }
    expect(page).toContain("limit: 100");
    expect(page).toContain('<ion-button id="verifactu-process-queue"');
  });
});

describe('showcase module-verifactu-events — auditoría', () => {
  it('mantiene columnas, severidades y lectura sin mutaciones', () => {
    const page = pageSource('events');
    expectServerTable(page, 'verifactu-events-table');
    for (const key of ['timestamp', 'severity', 'event_type', 'message']) {
      expect(components.events).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const severity of ['debug', 'info', 'warning', 'error', 'critical']) {
      expect(page).toContain(`value: '${severity}'`);
    }
    expect(page).not.toContain('recordCommand(');
    expect(page).not.toContain('table.actions =');
  });
});

describe('showcase module-verifactu-recovery — integridad y recuperación', () => {
  it('reutiliza tabla y feedback, con todas las consultas y acciones reales', () => {
    const page = pageSource('recovery');
    expectServerTable(page, 'verifactu-aeat-table');
    expect(new Set([...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]))).toEqual(
      new Set(['ok-data-table', 'ok-inline-feedback']),
    );
    for (const key of ['invoice_number', 'invoice_date', 'record_hash', 'estado', 'aeat_csv', 'query_timestamp']) {
      expect(components.recovery).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const query of ['verifactu.config.get', 'verifactu.chain.status', 'verifactu.aeat.records.list']) {
      expect(page).toContain(`recordQuery('${query}'`);
    }
    for (const command of [
      'verifactu.chain.validate',
      'verifactu.aeat.query_recent',
      'verifactu.recovery.from_aeat',
      'verifactu.recovery.manual',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`recordCommand('${command}'`);
    }
    expect(manualSchema.required).toEqual(['issuer_nif', 'record_hash']);
    expect(manualSchema.properties.record_hash.pattern).toBe('^[0-9a-fA-F]{64}$');
    expect(page).toContain('const HEX64 = /^[0-9a-fA-F]{64}$/;');
    for (const id of ['verifactu-recovery-nif', 'verifactu-manual-hash', 'verifactu-manual-invoice', 'verifactu-manual-date']) {
      expect(page).toContain(`id="${id}"`);
    }
  });
});

describe('showcase module-verifactu-settings — formulario Ionic', () => {
  it('refleja los controles y límites del componente actual sin crear otro componente', () => {
    const page = pageSource('settings');
    expect(page).not.toContain('<ok-data-table');
    expect(new Set([...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]))).toEqual(
      new Set(['ok-inline-feedback', 'ok-status-pill']),
    );
    for (const id of [
      'verifactu-enabled', 'verifactu-environment', 'verifactu-issuer-nif',
      'verifactu-issuer-name', 'verifactu-certificate', 'verifactu-certificate-password',
      'verifactu-certificate-path', 'verifactu-auto-transmit', 'verifactu-test-type',
    ]) {
      expect(page).toContain(`id="${id}"`);
    }
    expect(configSchema.properties.mode.enum).toEqual(['verifactu', 'no_verifactu']);
    expect(configSchema.properties.environment.enum).toEqual(['testing', 'production']);
    expect(configSchema.properties.retry_interval_minutes).toMatchObject({ minimum: 1, maximum: 1440 });
    expect(configSchema.properties.max_retries).toMatchObject({ minimum: 0, maximum: 100 });
    expect(diagnosticSchema.properties.invoice_type.enum).toEqual(['F1', 'F2']);
    for (const value of ['testing', 'production', 'F1', 'F2']) expect(page).toContain(`value="${value}"`);
    expect(page).toContain("software_id: 'EC'");
    expect(page).toContain("software_nif: 'B27593136'");
    expect(page).toContain("software_name: 'ERPLORA CLOUD SL'");
  });

  it('conecta las lecturas y operaciones visibles del componente real', () => {
    const page = pageSource('settings');
    for (const query of ['verifactu.config.get', 'verifactu.diagnostics.last']) {
      expect(page).toContain(`recordQuery('${query}'`);
    }
    for (const command of [
      'verifactu.config.save',
      'verifactu.certificate.inspect',
      'verifactu.diagnostics.run',
      'invoice.create',
    ]) {
      expect(page).toContain(`recordCommand('${command}'`);
    }
    expect(page).toContain('const toBase64 = (file) =>');
    expect(page).toContain('certificate_pkcs12: certificateBase64');
    expect(page).toContain('certificate_password: String(certificatePassword.value || \'\')');
  });
});
