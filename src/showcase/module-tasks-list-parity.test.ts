import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-tasks-list.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tasks/ui/components/erp-tasks-list/erp-tasks-list.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tasks/ui/components/erp-tasks-list/erp-tasks-list.test.ts',
    import.meta.url,
  ),
  'utf8',
);

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/tasks/all').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-tasks-list — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/tasks/all'");
    expect(page).toContain("title: 'Tareas'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene columnas, enums y acciones de erp-tasks-list', () => {
    const page = pageSource();

    expect(page).toContain('<ok-data-table id="tasks-table" fill>');
    for (const key of ['task_number', 'title', 'status', 'priority', 'due_date']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const status of ['todo', 'in_progress', 'blocked', 'done', 'cancelled']) {
      expect(component).toContain(`'${status}'`);
      expect(page).toContain(`value: '${status}'`);
    }
    for (const priority of ['low', 'medium', 'high', 'urgent']) {
      expect(component).toContain(`'${priority}'`);
      expect(page).toContain(`value: '${priority}'`);
    }
    for (const action of ['detail', 'start', 'complete']) {
      expect(component).toContain(`id: '${action}'`);
      expect(page).toContain(`id: '${action}'`);
    }
  });

  it('conserva el contrato rico y responsive de la tabla actual', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'checkbox-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar nº o título…'",
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'title'");
    expect(page).not.toContain("cardIcon = 'checkbox-outline'");
  });

  it('reutiliza exactamente la tarea de la prueba oficial del módulo', () => {
    const page = pageSource();
    const fixture = page.match(/const TASK_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("task_number: 'TSK-1'");
    expect(componentTest).toContain("title: 'Revisar caja'");
    expect(fixture, 'TASK_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      {
        id: 't1',
        task_number: 'TSK-1',
        title: 'Revisar caja',
        description: '',
        project_id: null,
        status: 'todo',
        priority: 'medium',
        assigned_to_ref: null,
        created_by_ref: null,
        due_date: null,
        completed_at: null,
        parent_task_id: null,
        tags: '',
        created_at: '2026-07-13T09:00:00',
      },
    ]);
  });

  it('mantiene Todas/Mis tareas, el alta dentro de la tabla y el detalle operativo', () => {
    const page = pageSource();

    expect(page).toContain('<ion-segment id="tasks-view" value="all">');
    expect(page).toContain('<ion-segment-button value="all">');
    expect(page).toContain('<ion-segment-button value="mine">');
    expect(page).toContain('<form id="task-create-form" slot="create"');
    expect(page).toContain('<ion-input id="task-title"');
    expect(page).toContain('<ion-select id="task-priority"');
    expect(page).toContain('<section id="task-detail"');
    expect(page).toContain('<ion-select id="task-detail-status"');
    expect(page).toContain('<form id="task-comment-form"');
    expect(page).toContain('<form id="task-subtask-form"');
  });

  it('simula el controlador server-side y las acciones reales sin inventar otras áreas', () => {
    const page = pageSource();

    for (const event of ['rowAction', 'pageChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).toContain("task.status = 'in_progress'");
    expect(page).toContain("task.status = 'done'");
    expect(page).toContain('task.assigned_to_ref =');
    expect(page).toContain('comments.push(');
    expect(page).toContain('subtasks.push(');
    expect(page).not.toMatch(/<ok-(?:kpi|stat|kanban|calendar)\b/);
    expect(page).not.toMatch(/ventas|facturaci[oó]n|inventario/i);
  });
});
