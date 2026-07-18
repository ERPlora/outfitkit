import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-tickets-list.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tickets/ui/components/erp-tickets-list/erp-tickets-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tickets/ui/components/erp-tickets-list/erp-tickets-list.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/tickets/list').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-tickets-list — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/tickets/list'");
    expect(page).toContain("title: 'Tickets'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('reproduce las columnas y los filtros cerrados de la lista actual', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="tickets-table" fill>');
    for (const key of ['ticket_number', 'subject', 'customer_name', 'priority', 'status', 'category']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'cancelled']) {
      expect(component).toContain(`'${status}'`);
      expect(page).toContain(`value: '${status}'`);
    }
    for (const priority of ['low', 'medium', 'high', 'urgent']) {
      expect(component).toContain(`'${priority}'`);
      expect(page).toContain(`value: '${priority}'`);
    }
    for (const category of ['general', 'billing', 'technical', 'feature_request']) {
      expect(component).toContain(`'${category}'`);
      expect(page).toContain(`value: '${category}'`);
    }
  });

  it('mantiene el contrato server-side, el alta y las tarjetas responsive', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'help-buoy-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar nº, asunto o cliente…'",
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'subject'");
    expect(page).not.toContain("cardIcon = 'help-buoy-outline'");

    expect(page).toContain('<form id="ticket-create-form" slot="create"');
    for (const field of ['ticket-subject', 'ticket-customer', 'ticket-priority', 'ticket-category']) {
      expect(page).toContain(`id="${field}"`);
    }
  });

  it('reutiliza exactamente el ticket de la prueba oficial como fixture auditable', () => {
    const page = pageSource();
    const fixture = page.match(/const TICKET_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("ticket_number: 'TKT-0001'");
    expect(componentTest).toContain("subject: 'La impresora no imprime'");
    expect(fixture, 'TICKET_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 't1',
        ticket_number: 'TKT-0001',
        subject: 'La impresora no imprime',
        description: '',
        customer_name: 'Bar Pepe',
        customer_email: '',
        customer_phone: '',
        status: 'open',
        priority: 'high',
        category: 'technical',
        assigned_to_ref: null,
        created_by_ref: null,
        sla_id: null,
        opened_at: '2026-07-13T09:00:00',
        first_response_at: null,
        resolved_at: null,
        closed_at: null,
        satisfaction_rating: null,
        created_at: '2026-07-13T09:00:00',
      },
    ]);
  });

  it('conserva el detalle real: estado, asignación, resolución y comentarios con Ionic', () => {
    const page = pageSource();

    expect(page).toContain('id="ticket-detail"');
    expect(page).toContain('id="ticket-status"');
    expect(page).toContain('id="ticket-agent"');
    expect(page).toContain('id="ticket-resolution-note"');
    expect(page).toContain('id="ticket-rating"');
    expect(page).toContain('id="ticket-reopen-reason"');
    expect(page).toContain('<form id="ticket-comment-form"');
    expect(page).toContain('id="ticket-comment-internal"');
    expect(page).toContain("id: 'detail'");

    for (const transition of [
      "open: ['in_progress', 'waiting_customer', 'resolved', 'cancelled']",
      "resolved: ['closed', 'open']",
      "closed: ['open']",
      "cancelled: ['open']",
    ]) {
      expect(component).toContain(transition);
      expect(page).toContain(transition);
    }
  });

  it('simula honestamente el controlador server-side y las acciones del detalle', () => {
    const page = pageSource();

    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("emitTicketEvent('tickets.ticket.created'");
    expect(page).toContain("eventName = 'tickets.ticket.status_changed'");
    expect(page).toContain("emitTicketEvent('tickets.ticket.assigned'");
    expect(page).toContain("'tickets.ticket.resolved'");
    expect(page).toContain("'tickets.ticket.closed'");
    expect(page).toContain("'tickets.ticket.reopened'");
    expect(page).toContain("emitTicketEvent('tickets.comment.added'");
  });
});
