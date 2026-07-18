import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-tasks-projects.html', import.meta.url);
const component = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tasks/ui/components/erp-tasks-projects/erp-tasks-projects.ts',
    import.meta.url,
  ),
  'utf8',
);
const componentTest = readFileSync(
  new URL(
    '../../../modules-workspace/modules/tasks/ui/components/erp-tasks-projects/erp-tasks-projects.test.ts',
    import.meta.url,
  ),
  'utf8',
);
const manifest = readFileSync(
  new URL('../../../modules-workspace/modules/tasks/module.json', import.meta.url),
  'utf8',
);
const createSchema = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/tasks/schemas/create_project.json', import.meta.url),
    'utf8',
  ),
) as { required: string[]; properties: Record<string, unknown> };

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/tasks/projects').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-tasks-projects — paridad con el módulo real', () => {
  it('usa el shell Hub en iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();

    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/tasks/projects'");
    expect(page).toContain("title: 'Proyectos'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    expect(page).not.toContain("mode: 'md'");

    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene las columnas y los filtros de erp-tasks-projects', () => {
    const page = pageSource();

    for (const key of ['code', 'name', 'color', 'is_active']) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(component).toContain("filterType: 'select'");
    expect(page).toContain("filterType: 'select'");
    expect(page).toContain("{ value: '1', label: 'Sí' }");
    expect(page).toContain("{ value: '0', label: 'No' }");
    expect(page).not.toContain('rowActions =');
  });

  it('conserva el contrato server-side, el alto completo y la vista responsive', () => {
    const page = pageSource();

    for (const property of [
      'serverSide = true',
      'fill = true',
      'addable = true',
      'views = true',
      'cardTitle = (row) =>',
      "cardIcon = () => 'folder-outline'",
      'searchable = true',
      "searchPlaceholder = 'Buscar código o nombre…'",
      'pageSize = 50',
      "sort = 'created_at'",
      "sortDir = 'desc'",
    ]) {
      expect(page).toContain(property);
    }
    expect(page).not.toContain("cardTitle = 'name'");
    expect(page).not.toContain("cardIcon = 'folder-outline'");
  });

  it('reutiliza exactamente el proyecto de la prueba oficial del módulo', () => {
    const page = pageSource();
    const fixture = page.match(/const PROJECT_FIXTURE = (\[[\s\S]*?\n\s*\]);/);

    expect(componentTest).toContain("code: 'q3-audit'");
    expect(componentTest).toContain("name: 'Auditoría Q3'");
    expect(fixture, 'PROJECT_FIXTURE debe quedar como JSON auditable').not.toBeNull();
    expect(JSON.parse(fixture![1])).toEqual([
      { id: 'p1', code: 'q3-audit', name: 'Auditoría Q3', color: '#ff0000', is_active: 1 },
    ]);
  });

  it('mantiene el alta dentro de la tabla y respeta el contrato del comando', () => {
    const page = pageSource();

    expect(manifest).toContain('"tasks.projects.create"');
    expect(createSchema.required).toEqual(['code', 'name']);
    expect(Object.keys(createSchema.properties)).toEqual(['code', 'name', 'color', 'owner_ref']);
    expect(page).toContain('<form id="project-create-form" slot="create"');
    expect(page).toContain('<ion-input id="project-code"');
    expect(page).toContain('<ion-input id="project-name"');
    expect(page).toContain('<ion-input id="project-color"');
    expect(page).toContain('owner_ref: null');
    expect(page).toContain('table.close()');
  });

  it('simula el controlador real sin añadir áreas o acciones ajenas', () => {
    const page = pageSource();

    for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).toContain('function queryPage()');
    expect(page).toContain('project.owner_ref ??');
    expect(page).toContain("if (key === 'name') return actual.includes(expected)");
    expect(page).toContain('return actual === expected');
    expect(page).toContain('table.total = filtered.length');
    expect(page).toContain('table.rows = filtered.slice(');
    expect(page).not.toContain("addEventListener('rowAction'");
    expect(page).not.toMatch(/<ok-(?:kpi|stat|kanban|calendar)\b/);
    expect(page).not.toMatch(/ventas|facturaci[oó]n|inventario/i);
  });
});
