import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const root = new URL('../../../', import.meta.url);
const moduleRoot = new URL('modules-workspace/modules/whatsapp_inbox/', root);
const showcaseRoot = new URL('outfitkit/showcase/', root);
const manifest = JSON.parse(readFileSync(new URL('module.json', moduleRoot), 'utf8')) as {
  navigation: Array<{ id: string; component: string }>;
};
const generatedCatalog = readFileSync(new URL('module-pages-data.js', showcaseRoot), 'utf8');

const cases = [
  {
    id: 'module-whatsapp-inbox-inbox',
    navId: 'inbox',
    route: '/m/whatsapp_inbox/inbox',
    title: 'Bandeja de WhatsApp',
    component: 'erp-whatsapp-inbox-inbox',
    file: 'module-whatsapp-inbox-inbox.html',
    source: 'ui/components/erp-whatsapp-inbox-inbox/erp-whatsapp-inbox-inbox.ts',
  },
  {
    id: 'module-whatsapp-inbox-requests',
    navId: 'requests',
    route: '/m/whatsapp_inbox/requests',
    title: 'Solicitudes',
    component: 'erp-whatsapp-inbox-requests',
    file: 'module-whatsapp-inbox-requests.html',
    source: 'ui/components/erp-whatsapp-inbox-requests/erp-whatsapp-inbox-requests.ts',
  },
  {
    id: 'module-whatsapp-inbox-templates',
    navId: 'templates',
    route: '/m/whatsapp_inbox/templates',
    title: 'Plantillas de WhatsApp',
    component: 'erp-whatsapp-inbox-templates',
    file: 'module-whatsapp-inbox-templates.html',
    source: 'ui/components/erp-whatsapp-inbox-templates/erp-whatsapp-inbox-templates.ts',
  },
] as const;

function pageSource(file: string): string {
  const pageUrl = new URL(`pages/${file}`, showcaseRoot);
  expect(existsSync(pageUrl), `falta la demo real ${file}`).toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase · páginas reales de whatsapp_inbox', () => {
  it.each(cases)('respeta la ruta y fuente generadas de $id', ({ id, navId, route, component, file, source }) => {
    const page = pageSource(file);
    const implementation = readFileSync(new URL(source, moduleRoot), 'utf8');

    expect(generatedCatalog).toContain(`"id": "${id}"`);
    expect(generatedCatalog).toContain(`"source": "modules-workspace/modules/whatsapp_inbox/${source}"`);
    expect(generatedCatalog).toContain(`"route": "${route}"`);
    expect(manifest.navigation).toContainEqual(expect.objectContaining({ id: navId, component }));
    expect(implementation).toContain(`define('${component}'`);
    expect(page).toContain(`active: '${route}'`);
  });

  it.each(cases)('usa el shell Hub en iOS y ok-data-table como única pieza OutfitKit en $id', ({ file, title }) => {
    const page = pageSource(file);

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain(`title: '${title}'`);
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce el contrato actual de la bandeja, incluidos filtros y tarjetas', () => {
    const page = pageSource('module-whatsapp-inbox-inbox.html');
    const component = readFileSync(new URL(cases[0].source, moduleRoot), 'utf8');

    expect(page).toContain('<ok-data-table id="whatsapp-inbox-table">');
    for (const key of ['contact_name', 'contact_phone', 'status', 'unread_count', 'last_message_at']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'chatbubbles-outline'",
      'searchable = true',
      "searchPlaceholder = 'Filtrar contacto o teléfono…'",
      'pageSize = 50',
      "sort = 'id'",
      "sortDir = 'asc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'contact_name'");
    expect(page).not.toContain("cardIcon = 'chatbubbles-outline'");
  });

  it('reproduce solicitudes y sus únicas acciones reales de revisión', () => {
    const page = pageSource('module-whatsapp-inbox-requests.html');
    const component = readFileSync(new URL(cases[1].source, moduleRoot), 'utf8');

    expect(page).toContain('<ok-data-table id="whatsapp-requests-table">');
    for (const key of ['reference_number', 'request_type', 'contact_name', 'status', 'confidence_score', 'id']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const type of ['order', 'reservation', 'appointment', 'quote', 'transport', 'custom']) {
      expect(page).toContain(`value: '${type}'`);
    }
    for (const status of ['pending_review', 'confirmed', 'fulfilled', 'rejected', 'cancelled']) {
      expect(page).toContain(`value: '${status}'`);
    }
    expect(page).toContain('id="whatsapp-pending-review"');
    expect(page).toContain("emitCommand('whatsapp_inbox.requests.approve'");
    expect(page).toContain("emitCommand('whatsapp_inbox.requests.reject'");
    expect(page).not.toContain('whatsapp_inbox.requests.fulfill');
    expect(page).not.toContain('whatsapp_inbox.requests.delete');
  });

  it('mantiene el alta de plantillas dentro del panel create de ok-data-table', () => {
    const page = pageSource('module-whatsapp-inbox-templates.html');
    const component = readFileSync(new URL(cases[2].source, moduleRoot), 'utf8');
    const componentTest = readFileSync(
      new URL('ui/components/erp-whatsapp-inbox-templates/erp-whatsapp-inbox-templates.test.ts', moduleRoot),
      'utf8',
    );

    expect(page).toContain('<ok-data-table id="whatsapp-templates-table" fill>');
    for (const key of ['name', 'language', 'category', 'meta_status', 'is_active']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'document-text-outline'",
      "searchPlaceholder = 'Buscar nombre o categoría…'",
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).toContain('<form id="whatsapp-template-form" slot="create"');
    expect(page).toMatch(/<ion-input\s+id="whatsapp-template-name"/);
    expect(page).toMatch(/<ion-select\s+id="whatsapp-template-category"/);
    expect(page).toMatch(/<ion-textarea\s+id="whatsapp-template-body"/);
    expect(page).toContain("emitCommand('whatsapp_inbox.templates.create'");
    expect(componentTest).toContain("name: 'recordatorio_cita'");
    expect(page).toContain('"name": "recordatorio_cita"');
  });

  it.each(cases)('simula el controlador server-side completo en $id', ({ file }) => {
    const page = pageSource(file);

    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
