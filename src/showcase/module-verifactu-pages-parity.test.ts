// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageBase = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/verifactu/', import.meta.url);

const pages = {
  records: new URL('module-verifactu-records.html', pageBase),
  contingency: new URL('module-verifactu-contingency.html', pageBase),
  events: new URL('module-verifactu-events.html', pageBase),
  recovery: new URL('module-verifactu-recovery.html', pageBase),
  config: new URL('module-verifactu-config.html', pageBase),
  settings: new URL('module-verifactu-settings.html', pageBase),
};

const components = {
  records: readFileSync(new URL('ui/components/erp-verifactu-records/erp-verifactu-records.ts', moduleBase), 'utf8'),
  contingency: readFileSync(new URL('ui/components/erp-verifactu-contingency/erp-verifactu-contingency.ts', moduleBase), 'utf8'),
  events: readFileSync(new URL('ui/components/erp-verifactu-events/erp-verifactu-events.ts', moduleBase), 'utf8'),
  recovery: readFileSync(new URL('ui/components/erp-verifactu-recovery/erp-verifactu-recovery.ts', moduleBase), 'utf8'),
  config: readFileSync(new URL('ui/components/erp-verifactu-config/erp-verifactu-config.ts', moduleBase), 'utf8'),
  settings: readFileSync(new URL('ui/components/erp-verifactu-settings/erp-verifactu-settings.ts', moduleBase), 'utf8'),
};

// El otorgamiento (verifactu#116) vive en su PROPIO componente, embebido dentro de la pestaña
// «delegated» de Configuración — nunca se le hizo demo propia porque nunca tuvo página propia.
const grantComponent = readFileSync(
  new URL('ui/components/erp-verifactu-grant/erp-verifactu-grant.ts', moduleBase),
  'utf8',
);

// Las cadenas en español SALEN de aquí, nunca a mano: si el módulo cambia la redacción del
// otorgamiento o de la conexión de máquina, esta suite lo nota sin que nadie tenga que acordarse.
const esLocale = JSON.parse(readFileSync(new URL('locales/es.json', moduleBase), 'utf8')) as {
  ui: Record<string, string>;
  grant: Record<string, string>;
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
  // outfitkit#84 / ADR-0143 (amendment 2026-08-11): the shell stays in ios, but the three form controls
  // that take `fill` MUST declare mode="md" per control (Ionic only implements `fill` in md), exactly as
  // the hub and the SaaS do (hub#760, saas#1080). What is forbidden is switching the PAGE config to md.
  expect(page).not.toMatch(/mode:\s*['"]md['"]/);
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

describe('showcase verifactu — seis vistas reales del manifest', () => {
  it('conserva navegación, shell Hub e Ionic iOS', () => {
    expect(manifest.navigation.map(({ id, component }) => ({ id, component }))).toEqual([
      { id: 'records', component: 'erp-verifactu-records' },
      { id: 'contingency', component: 'erp-verifactu-contingency' },
      { id: 'events', component: 'erp-verifactu-events' },
      { id: 'recovery', component: 'erp-verifactu-recovery' },
      { id: 'config', component: 'erp-verifactu-config' },
      { id: 'settings', component: 'erp-verifactu-settings' },
    ]);
    expectHubPage(pageSource('records'), '/m/verifactu/records', 'Registros');
    expectHubPage(pageSource('contingency'), '/m/verifactu/contingency', 'Contingencia');
    expectHubPage(pageSource('events'), '/m/verifactu/events', 'Eventos');
    expectHubPage(pageSource('recovery'), '/m/verifactu/recovery', 'Recuperación');
    expectHubPage(pageSource('config'), '/m/verifactu/config', 'Configuración');
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

describe('showcase module-verifactu-config — otorgamiento y certificado propio', () => {
  it('refleja las dos vías reales sin inventar un interruptor que el componente no tiene', () => {
    const page = pageSource('config');
    // config.ts NO lleva `<ok-data-table`: las dos vías son un `ion-segment` con un panel de
    // otorgamiento y otro de certificado, nunca una tabla. Y son solo tres los `ok-*` que importan
    // erp-verifactu-config.ts y erp-verifactu-grant.ts juntos — un cuarto aquí sería un componente
    // que ninguno de los dos usa de verdad.
    expect(new Set([...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]))).toEqual(
      new Set(['ok-status-pill', 'ok-inline-feedback', 'ok-dropzone']),
    );

    // Las DOS pestañas son las dos vías de ADR-0320 §1 — un `ion-segment`, no el interruptor
    // «Usar mi propio certificado» (ese vive en Ajustes/erp-verifactu-settings, no aquí).
    expect(components.config).toContain("t('ui.cfgTabDelegated')");
    expect(components.config).toContain("t('ui.cfgTabOwn')");
    for (const id of ['verifactu-config-tab-delegated', 'verifactu-config-tab-own']) {
      expect(page).toContain(`id="${id}"`);
    }
    expect(page).toContain(esLocale.ui.cfgTabDelegated);
    expect(page).toContain(esLocale.ui.cfgTabOwn);

    // La pestaña «Mi certificado»: el mismo `.p12` que custodia el core (ADR-0081), subido con
    // `pkcs12_b64`/`password` — NUNCA con las claves `certificate_pkcs12`/`certificate_password`
    // del comando `verifactu.config.save` de Ajustes, que es una puerta distinta.
    expect(components.config).toContain("t('ui.cfgP12Title')");
    expect(components.config).toContain('json: { pkcs12_b64: b64, password: this.password }');
    for (const id of ['verifactu-config-p12-file', 'verifactu-config-p12-password', 'verifactu-config-p12-remove']) {
      expect(page).toContain(`id="${id}"`);
    }
    expect(page).toContain('pkcs12_b64');
    expect(page).toContain(esLocale.ui.cfgP12Title);
    expect(page).toContain(esLocale.ui.cfgP12Password);
    expect(page).toContain(esLocale.ui.cfgP12Upload);
    expect(page).toContain(esLocale.ui.cfgRemoveConfirm);
  });

  it('conecta las lecturas reales y el otorgamiento embebido (erp-verifactu-grant, verifactu#116)', () => {
    const page = pageSource('config');
    for (const query of ['verifactu.config.get', 'hub.fiscal.transmission']) {
      expect(components.config).toContain(`'${query}'`);
      expect(page).toContain(`recordQuery('${query}'`);
    }

    // La conexión de MÁQUINA (verifactu#76): título e identidad, tal como los traduce el propio
    // componente — nunca inventados en la demo.
    expect(components.config).toContain("t('ui.gatewayTitle')");
    expect(components.config).toContain("t('ui.gatewayCommonName')");
    expect(components.config).toContain("t('ui.gatewayValidUntil')");
    expect(page).toContain(esLocale.ui.gatewayTitle);
    expect(page).toContain(esLocale.ui.gatewayCommonName);
    expect(page).toContain(esLocale.ui.gatewayValidUntil);

    // El otorgamiento (erp-verifactu-grant.ts) — «Lo que has enviado», el historial y «Volver a
    // enviar» son SU contrato, no el de Configuración; se comprueban contra ESE componente.
    expect(grantComponent).toContain("t('grant.submittedTitle')");
    expect(grantComponent).toContain("t('grant.historyTitle')");
    expect(grantComponent).toContain("'grant.resend'");
    expect(grantComponent).toContain("'grant.resendCancel'");
    expect(page).toContain(esLocale.grant.submittedTitle);
    expect(page).toContain(esLocale.grant.historyTitle);
    expect(page).toContain(esLocale.grant.resend);
    expect(page).toContain(esLocale.grant.resendCancel);

    // Los TRES desenlaces reales de un envío (`historyKey`), no dos: rechazado con motivo,
    // aprobado (vigente) y pendiente de revisión — los mismos que el componente real distingue.
    expect(grantComponent).toContain("return 'grant.historyRejected'");
    expect(grantComponent).toContain("return 'grant.historyInForce'");
    expect(grantComponent).toContain("return 'grant.historyPending'");
    expect(page).toContain(esLocale.grant.historyRejected);
    expect(page).toContain(esLocale.grant.historyInForce);
    expect(page).toContain(esLocale.grant.historyPending);
    expect(page).toContain('El NIF del firmante no coincide con el del obligado.');

    // «Volver a enviar» con un envío `pendiente` explica la frase de ESE estado
    // (`resendHintPending`), no la de un `vigente` (`resendHintInForce`) — son dos avisos
    // distintos y la demo no puede confundirlos.
    expect(grantComponent).toContain('grant.resendHintPending');
    expect(page).toContain(esLocale.grant.resendHintPending);
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
