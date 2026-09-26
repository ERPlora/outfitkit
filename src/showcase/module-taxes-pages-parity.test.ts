// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const base = new URL('../../showcase/pages/', import.meta.url);
const moduleBase = new URL('../../../modules-workspace/modules/taxes/', import.meta.url);

const pages = {
  categories: new URL('module-taxes-categories.html', base),
  rules: new URL('module-taxes-rules.html', base),
  aliases: new URL('module-taxes-aliases.html', base),
};

const components = {
  categories: readFileSync(new URL('ui/components/erp-taxes-categories/erp-taxes-categories.ts', moduleBase), 'utf8'),
  rules: readFileSync(new URL('ui/components/erp-taxes-rules/erp-taxes-rules.ts', moduleBase), 'utf8'),
  aliases: readFileSync(new URL('ui/components/erp-taxes-aliases/erp-taxes-aliases.ts', moduleBase), 'utf8'),
};

const manifest = JSON.parse(readFileSync(new URL('module.json', moduleBase), 'utf8')) as {
  queries: Record<string, { list?: { page_size: number; default_sort: string; filters: Record<string, unknown> } }>;
  commands: Record<string, unknown>;
};
const seed = readFileSync(new URL('seed/install.postgres.sql', moduleBase), 'utf8');
const categorySchema = JSON.parse(readFileSync(new URL('schemas/category_create.json', moduleBase), 'utf8')) as {
  required: string[];
};
const ruleSchema = JSON.parse(readFileSync(new URL('schemas/rule_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { tax_type: { enum: string[] } };
};
const repairSchema = JSON.parse(readFileSync(new URL('schemas/rule_repair.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { mode: { enum: string[] } };
};
// The demo speaks Spanish: its visible strings are the module's own `es` catalogue, so a wording
// change in the module sends whoever touches it back to the demo.
const esCatalogue = JSON.parse(readFileSync(new URL('locales/es.json', moduleBase), 'utf8')) as {
  ui: Record<string, string>;
  errors: Record<string, string>;
};
const esUi = esCatalogue.ui;
const esErrors = esCatalogue.errors;
const endSchema = JSON.parse(readFileSync(new URL('schemas/rule_end.json', moduleBase), 'utf8')) as {
  required: string[];
};
const aliasSchema = JSON.parse(readFileSync(new URL('schemas/alias_create.json', moduleBase), 'utf8')) as {
  required: string[];
  properties: { source: { enum: string[] } };
};

function pageSource(page: keyof typeof pages): string {
  expect(existsSync(pages[page]), `falta la demo real de taxes/${page}`).toBe(true);
  return readFileSync(pages[page], 'utf8');
}

function jsonFixture(source: string, name: string): Record<string, unknown>[] {
  const match = source.match(new RegExp(`const ${name} = (\\[[\\s\\S]*?\\n\\s*\\]);`));
  expect(match, `${name} debe quedar como JSON auditable`).not.toBeNull();
  return JSON.parse(match![1]) as Record<string, unknown>[];
}

function expectSharedPageContract(
  page: string,
  route: string,
  title: string,
  tableId: string,
  extraOutfitTags: string[] = [],
): void {
  expect(page).toContain("import { defineHubPage } from './_hub.js'");
  expect(page).toContain(`active: '${route}'`);
  expect(page).toContain(`title: '${title}'`);
  expect(page).toContain(`<ok-data-table id="${tableId}" fill>`);
  expect(page).toContain('<script src="./_ionic-config.js"></script>');
  expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
  // outfitkit#84 / ADR-0143 (amendment 2026-08-11): the shell stays in ios, but the three form controls
  // that take `fill` MUST declare mode="md" per control (Ionic only implements `fill` in md), exactly as
  // the hub and the SaaS do (hub#760, saas#1080). What is forbidden is switching the PAGE config to md.
  expect(page).not.toMatch(/mode:\s*['"]md['"]/);

  const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
  expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table', ...extraOutfitTags]));
  for (const property of [
    'serverSide = true',
    'fill = true',
    'addable = true',
    'views = true',
    'cardTitle = (row) =>',
    'cardIcon = () =>',
    'searchable = true',
    'pageSize = 50',
  ]) {
    expect(page).toContain(property);
  }
  expect(page).not.toMatch(/cardTitle\s*=\s*['"]/);
  expect(page).not.toMatch(/cardIcon\s*=\s*['"]/);
  for (const event of ['pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
    expect(page).toContain(`addEventListener('${event}'`);
  }
}

describe('showcase taxes — contrato común real del módulo', () => {
  it('usa Hub + Ionic iOS y deja ok-data-table como pieza OutfitKit (más el aviso de reglas)', () => {
    expectSharedPageContract(pageSource('categories'), '/m/taxes/categories', 'Categorías fiscales', 'taxes-categories-table');
    // Rules also paints the module's warning banner (taxes#64), which is an `ok-inline-feedback`.
    expectSharedPageContract(pageSource('rules'), '/m/taxes/rules', 'Reglas por jurisdicción', 'taxes-rules-table', [
      'ok-inline-feedback',
    ]);
    expectSharedPageContract(pageSource('aliases'), '/m/taxes/aliases', 'Alias de categorías', 'taxes-aliases-table');
  });
});

describe('showcase module-taxes-categories — paridad con categories real', () => {
  it('reproduce columnas, filtros, orden y alta fiscal sin acciones inventadas', () => {
    const page = pageSource('categories');
    const list = manifest.queries['taxes.categories.list'].list!;
    // taxes#38: el nombre y la descripción que se PINTAN son los presentables que resuelve la
    // query al idioma de quien pregunta, no el `name` inglés del seed (ADR-0055).
    for (const key of ['key', 'display_name', 'display_description', 'is_system', 'is_active']) {
      expect(components.categories).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    // taxes#44 (ERPlora/taxes#49, 03/09): la columna de descripción se pintaba `filterable` +
    // `sortable` y el manifest no la declaraba, así que la caja mentía EN SILENCIO —el runtime
    // descarta un `f_*` no declarado sin 422—. `display_description` es ya un filtro real.
    // Y por el MISMO motivo `is_active` dejó de serlo en ERPlora/taxes#53: aquí no queda caja
    // «Activa», solo la columna ordenable. Esta lista es el espejo del manifest a propósito —
    // cuando el módulo cambia sus filtros, este test manda a revisar la demo.
    expect(Object.keys(list.filters)).toEqual([
      'key', 'name', 'is_system', 'display_name', 'display_description',
    ]);
    expect(list.default_sort).toBe('key');
    expect(page).toContain("sort: 'key'");
    expect(page).toContain("searchPlaceholder = 'Buscar clave o nombre…'");
    expect(page).toContain("cardIcon = () => 'calculator-outline'");
    expect(page).not.toContain('table.actions =');
    expect(page).not.toContain("addEventListener('rowAction'");

    expect(categorySchema.required).toEqual(['key', 'name']);
    expect(page).toContain('<form id="taxes-category-form" slot="create"');
    for (const field of ['tax-category-key', 'tax-category-name', 'tax-category-description']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(manifest.commands).toHaveProperty('taxes.categories.create');
    expect(page).toContain("recordCommand('taxes.categories.create'");
    expect(page).toContain('table.close()');
  });

  it('parte de las seis categorías sembradas por el módulo', () => {
    const rows = jsonFixture(pageSource('categories'), 'CATEGORY_FIXTURE');
    expect(rows.map((row) => row.key)).toEqual([
      'restaurant.food', 'restaurant.drink', 'restaurant.alcohol',
      'restaurant.delivery', 'service.generic', 'product.generic',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.key}'`);
      expect(row.is_system).toBe(1);
      expect(row.is_active).toBe(1);
    }
  });
});

describe('showcase module-taxes-rules — paridad con rules real', () => {
  it('reproduce columnas, filtros cerrados, alta y única acción de desactivar', () => {
    const page = pageSource('rules');
    const list = manifest.queries['taxes.rules.list'].list!;
    for (const key of [
      'tax_category_key', 'country_code', 'region_code', 'rate_pct',
      'tax_type', 'valid_from', 'valid_to', 'is_active',
    ]) {
      expect(components.rules).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    // `is_active` va AL FINAL: taxes#53 lo quitó de las tres listas por mentiroso y taxes#52
    // (PR ERPlora/taxes#56) lo devolvió SOLO aquí —una regla desactivada se puede volver a ver y
    // recuperar—, así que reentró por la cola. En reglas es un filtro REAL; en categorías y
    // alias no existe. `is_incoherent` entró detrás con taxes#64 (outfitkit#155), y `overlaps`
    // con taxes#72 (outfitkit#202): lo pone el aviso de solapes, no una caja de columna.
    expect(Object.keys(list.filters)).toEqual([
      'country_code', 'region_code', 'tax_category_key', 'rate_pct',
      'tax_type', 'parent_id', 'operation_class', 'regime_key', 'is_active', 'is_incoherent', 'overlaps',
    ]);
    expect(page).toContain("sort: 'country_code'");
    expect(page).toContain("cardIcon = () => 'options-outline'");
    expect(page).toContain("{ id: 'deactivate'");
    expect(page).not.toMatch(/id:\s*['"](?:edit|delete|duplicate)['"]/);
    expect(page).toContain("recordCommand('taxes.rules.deactivate', { rule_id: row.id })");

    expect(ruleSchema.required).toEqual(['country_code', 'tax_category_key', 'rate_pct']);
    expect(ruleSchema.properties.tax_type.enum).toEqual([
      'vat', 'igic', 'ipsi', 'surcharge', 'sales_tax', 'withholding', 'excise', 'import_duty',
    ]);
    expect(page).toContain('<form id="taxes-rule-form" slot="create"');
    for (const field of [
      'tax-rule-country', 'tax-rule-region', 'tax-rule-category', 'tax-rule-rate',
      'tax-rule-type', 'tax-rule-valid-from', 'tax-rule-valid-to',
      'tax-rule-parent', 'tax-rule-component-label',
    ]) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain("recordCommand('taxes.rules.create'");
  });

  // outfitkit#156 (taxes#52): deactivating keeps the rule with is_active = 0; «Activa: No» widens the
  // list to the deactivated ones and their action is «Reactivar», exactly like the real screen.
  it('deactivates without deleting, and «Activa: No» shows the deactivated rules with «Reactivar»', () => {
    const page = pageSource('rules');

    // Same two actions as the module, with its icon, colour and Spanish label.
    for (const id of ['deactivate', 'restore']) {
      const action = components.rules.match(
        new RegExp(`\\{ id: '${id}', label: t\\('ui\\.([A-Za-z]+)'\\), icon: '([a-z-]+)', color: '([a-z]+)' \\}`),
      );
      expect(action, `the module must keep declaring the ${id} action`).not.toBeNull();
      const [, labelKey, icon, color] = action!;
      expect(page).toContain(`{ id: '${id}', label: '${esUi[labelKey]}', icon: '${icon}', color: '${color}' }`);
    }
    expect(page).not.toContain('power-outline');

    // «Activa: No» is what switches the screen to the deactivated rules and widens the scope.
    expect(components.rules).toContain("this.showingArchived = String(value ?? '') === '0';");
    expect(components.rules).toContain('this.ctrl.state.context = this.showingArchived ? { include_archived: 1 } : {};');
    expect(page).toContain("showingArchived = String(event.detail.value ?? '') === '0';");
    expect(page).toContain('state.context = showingArchived ? { include_archived: 1 } : {};');
    expect(page).toMatch(/if \(showingArchived\) \{\s*return \[\.\.\.repair, restoreAction\];/);

    // Without that scope the list only carries active rules, as the real query does.
    const listSql = readFileSync(new URL('queries/rules_list.sql', moduleBase), 'utf8');
    expect(listSql).toContain("AND (r.is_active = 1 OR COALESCE(CAST(:include_archived AS TEXT), '0') IN ('1', 'true'))");
    expect(page).toContain('if (!Number(row.is_active) && !state.context.include_archived) return false;');
    // The warning counts active rules only: a deactivated rule no longer sells anything.
    expect(page).toContain('listed.filter((row) => Number(row.is_active) === 1 && isIncoherent(row)).length');

    // Deactivating asks first (same alert and copy as the module) and keeps the row.
    expect(components.rules).toContain('data-testid="taxes-rules-deactivate-confirm"');
    expect(page).toContain('<ion-alert id="taxes-rules-deactivate-confirm"></ion-alert>');
    for (const key of ['deactivateConfirmTitle', 'deactivateConfirmMessage', 'deactivateConfirmAction']) {
      expect(page).toContain(esUi[key]);
    }
    expect(page).not.toMatch(/rules = rules\.filter\(/);
    expect(page).toContain('setActive(row.id, 0)');

    // Restoring needs no confirmation and goes through the module's own command.
    expect(manifest.commands).toHaveProperty('taxes.rules.activate');
    expect(components.rules).toContain("erplora().command('taxes.rules.activate', { rule_id: String(row.id) })");
    expect(page).toContain("recordCommand('taxes.rules.activate', { rule_id: String(row.id) })");
    expect(page).toContain('setActive(row.id, 1)');
  });

  it('parte exactamente de las seis reglas IVA sembradas', () => {
    const rows = jsonFixture(pageSource('rules'), 'RULE_FIXTURE');
    expect(rows).toHaveLength(6);
    expect(rows.map((row) => `${row.country_code}|${row.tax_category_key}|${row.rate_pct}`)).toEqual([
      'ES|product.generic|21', 'ES|service.generic|21', 'ES|restaurant.food|10',
      'ES|restaurant.drink|10', 'ES|restaurant.delivery|10', 'ES|restaurant.alcohol|21',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.tax_category_key}'`);
      expect(row.tax_type).toBe('vat');
      expect(row.valid_from).toBe('2012-09-01');
      expect(row.is_active).toBe(1);
      expect(row.operation_class).toBe('subject');
    }
  });

  // taxes#64 (outfitkit#155): rules saved with a rate on a class that charges no tax before the
  // taxes#62 guard are flagged by the server (`is_incoherent`) and the owner repairs them.
  it('enseña el aviso, la marca y «Reparar» de las reglas incoherentes como el módulo', () => {
    const page = pageSource('rules');

    // The module's screen has the four pieces the demo has to mirror.
    for (const piece of [
      'taxes-rules-incoherent-warning',
      "t('ui.incoherentBadge')",
      "id: 'repair'",
      'disabled: (row) => !isIncoherent(row)',
      "erplora().command('taxes.rules.repair', { rule_id: row.id, mode })",
      "role: 'charge_tax'",
      "role: 'no_tax'",
    ]) {
      expect(components.rules).toContain(piece);
    }

    // Command and payload exist in the manifest with exactly these two modes.
    expect(manifest.commands).toHaveProperty('taxes.rules.repair');
    expect(repairSchema.required).toEqual(['rule_id']);
    expect(repairSchema.properties.mode.enum).toEqual(['no_tax', 'charge_tax']);

    // 1. Warning with the count, same tone and test id as the module.
    expect(page).toMatch(/<ok-inline-feedback id="taxes-rules-incoherent-warning"[^>]*tone="warning"/);
    expect(page).toContain(`\`${esUi.incoherentWarning.replace('{count}', '${count}')}\``);
    // 2. Badge on the rate.
    expect(page).toContain(`· ${esUi.incoherentBadge}`);
    // 3. «Reparar» only on the incoherent rows, and the command the module sends.
    expect(page).toContain(`{ id: 'repair', label: '${esUi.actionRepair}', icon: 'construct-outline', color: 'warning', disabled: (row) => !isIncoherent(row) }`);
    expect(page).toContain("recordCommand('taxes.rules.repair', { rule_id: row.id, mode })");
    // 4. Confirmation with the owner's two readings; «charge the tax» only when the own class is wrong.
    expect(page).toContain('<ion-alert id="taxes-rules-repair-confirm"></ion-alert>');
    for (const key of ['repairConfirmTitle', 'repairConfirmMessage', 'repairNoTax', 'repairChargeTax', 'cancel']) {
      expect(page).toContain(`'${esUi[key]}'`);
    }
    expect(page).toContain("role: 'charge_tax'");
    expect(page).toContain("role: 'no_tax'");
    expect(components.rules).toContain("canRepairByChargingTax(this.pendingRepair) ? [{ text: t('ui.repairChargeTax'), role: 'charge_tax' }]");
    expect(page).toContain(`...(canRepairByChargingTax(row)
                ? [{ text: '${esUi.repairChargeTax}', role: 'charge_tax'`);
    expect(page).toContain("return isIncoherent(row) && row.operation_class !== 'subject';");
  });

  it('trae reglas incoherentes de antes de la guarda para que el aviso se vea', () => {
    const rows = jsonFixture(pageSource('rules'), 'LEGACY_RULE_FIXTURE');
    const classes = (JSON.parse(readFileSync(new URL('schemas/rule_create.json', moduleBase), 'utf8')) as {
      properties: { operation_class: { enum: string[] } };
    }).properties.operation_class.enum;
    const byId = new Map(rows.map((row) => [row.id, row]));
    // Same condition as `queries/rules_list.sql`: a rate, and the own or the root class charges no tax.
    const incoherent = (row: Record<string, unknown>): boolean => {
      const root = row.parent_id ? byId.get(row.parent_id) : undefined;
      return Number(row.rate_pct) > 0
        && (row.operation_class !== 'subject' || (root !== undefined && root.operation_class !== 'subject'));
    };
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const row of rows) {
      expect(classes).toContain(row.operation_class);
      expect(seed).toContain(`'${row.tax_category_key}'`);
      expect(incoherent(row), `${String(row.id)} debe ser incoherente`).toBe(true);
    }
    // Both repair paths: a root whose own class is wrong (two buttons) and a subject component
    // under such a root (only «Sin impuesto»).
    expect(rows.some((row) => !row.parent_id && row.operation_class !== 'subject')).toBe(true);
    expect(rows.some((row) => row.parent_id && row.operation_class === 'subject')).toBe(true);
  });

  // taxes#72 (outfitkit#202): two active rules of the same slot saved before the taxes#70 guard are
  // both in force on the same days. The server flags them (`overlaps`), the screen counts them in a
  // warning that narrows the table to them, marks their start date, and the owner resolves the pair
  // with «Poner fecha de fin» (taxes#70) or «Desactivar».
  it('enseña el aviso, «Ver cuáles», la marca y «Poner fecha de fin» de las reglas que se solapan como el módulo', () => {
    const page = pageSource('rules');
    const list = manifest.queries['taxes.rules.list'].list!;

    // The module's screen has the pieces the demo has to mirror.
    for (const piece of [
      'data-testid="taxes-rules-overlap-warning"',
      'data-testid="taxes-rules-overlap-filter"',
      'data-testid="taxes-rules-overlap-mark"',
      "this.ctrl.setFilter('overlaps', on ? '1' : '');",
      "this.showingOverlaps ? t('ui.overlapShowAll') : t('ui.overlapShow')",
      'if (this.showingOverlaps && this.overlapCount === 0) this.toggleOverlapFilter(false);',
      "{ id: 'end', label: t('ui.actionEndRule'), icon: 'calendar-outline' },",
      "erplora().command('taxes.rules.end', { rule_id: String(row.id), valid_to: validTo })",
      'data-testid="taxes-rules-end-confirm"',
      "errorCode(e) === 'taxes.rule_overlaps'",
    ]) {
      expect(components.rules).toContain(piece);
    }
    // «Poner fecha de fin» sits between «Reparar» and «Desactivar» on an active row.
    expect(components.rules).toMatch(/\.\.\.repair,\s*\{ id: 'end'[^\n]*\n\s*\{ id: 'deactivate'/);

    // Filter, command and payload exist in the manifest.
    expect(list.filters.overlaps).toEqual({ op: 'eq' });
    expect(manifest.commands).toHaveProperty('taxes.rules.end');
    expect(endSchema.required).toEqual(['rule_id', 'valid_to']);

    // 1. Warning with the count, same tone and id as the module, and the button that narrows the
    //    table through the real `overlaps` filter — and back.
    expect(page).toMatch(/<ok-inline-feedback id="taxes-rules-overlap-warning"[^>]*tone="warning"/);
    expect(page).toContain(`\`${esUi.overlapWarning.replace('{count}', '${count}')}\``);
    expect(page).toMatch(/<ion-button id="taxes-rules-overlap-filter" slot="actions"/);
    expect(page).toContain(`showingOverlaps ? '${esUi.overlapShowAll}' : '${esUi.overlapShow}'`);
    expect(page).toContain("state.filters.overlaps = on ? '1' : '';");
    // The last overlap gone, the filter undoes itself: no empty table with no word about why.
    expect(page).toContain('if (showingOverlaps && overlapCount === 0) {');
    // 2. Mark under the start date, on its own line (the module's `markedCell`).
    expect(page).toContain(`markedCell(from, '${esUi.overlapBadge}', 'taxes-rules-overlap-mark')`);
    expect(page).toContain(`\`\${from} · ${esUi.overlapBadge}\``);
    // 3. «Poner fecha de fin» on active rows, with the module's dialog, copy and command.
    expect(page).toContain(`const endAction = { id: 'end', label: '${esUi.actionEndRule}', icon: 'calendar-outline' };`);
    expect(page).toMatch(/return \[\.\.\.repair, endAction, deactivateAction\];/);
    expect(page).toContain('<ion-alert id="taxes-rules-end-confirm"></ion-alert>');
    for (const key of ['endRuleTitle', 'endRuleMessage', 'endRuleAction', 'cancel']) {
      expect(page).toContain(`'${esUi[key]}'`);
    }
    expect(page).toContain("recordCommand('taxes.rules.end', { rule_id: String(row.id), valid_to: validTo })");
    // 4. The same refusals as the command: an end before the start, and an end that still overlaps.
    expect(page).toContain(`const ERR_END_INVALID = '${esErrors['taxes.rule_end_invalid']}';`);
    expect(page).toContain(`const ERR_OVERLAPS = '${esUi.errRuleOverlaps}';`);
    expect(page).toMatch(/if \(current\.valid_from && current\.valid_from > validTo\) \{\s*showError\(ERR_END_INVALID\);\s*return;/);
    expect(page).toMatch(/if \(ruleOverlaps\(next\.find\([^\n]*\), next\)\) \{\s*showError\(ERR_OVERLAPS\);\s*return;/);
    expect(page).toMatch(/<ok-inline-feedback id="taxes-rules-form-error"[^>]*tone="danger"/);
  });

  it('marca como solapadas exactamente las reglas que marca `rules_list.sql`', () => {
    const page = pageSource('rules');
    // The predicate the server answers `overlaps` with — and the one taxes.rules.end refuses on.
    const listSql = readFileSync(new URL('queries/rules_list.sql', moduleBase), 'utf8');
    for (const clause of [
      "CASE WHEN r.is_active = 1 AND COALESCE(NULLIF(r.parent_id, ''), '') = '' AND EXISTS (",
      'AND o.id <> r.id',
      'AND o.is_active = 1',
      "AND COALESCE(NULLIF(o.parent_id, ''), '') = ''",
      'AND o.country_code = r.country_code',
      "AND COALESCE(o.region_code, '') = COALESCE(r.region_code, '')",
      'AND o.tax_category_key = r.tax_category_key',
      "AND (COALESCE(o.valid_from, '') = '' OR COALESCE(r.valid_to, '') = '' OR o.valid_from <= r.valid_to)",
      "AND (COALESCE(r.valid_from, '') = '' OR COALESCE(o.valid_to, '') = '' OR r.valid_from <= o.valid_to))",
    ]) {
      expect(listSql).toContain(clause);
    }
    type Rule = Record<string, unknown>;
    const text = (value: unknown): string => (value == null ? '' : String(value));
    const sqlOverlaps = (r: Rule, all: Rule[]): boolean =>
      Number(r.is_active) === 1 && text(r.parent_id) === '' && all.some((o) =>
        o.id !== r.id
        && Number(o.is_active) === 1
        && text(o.parent_id) === ''
        && o.country_code === r.country_code
        && text(o.region_code) === text(r.region_code)
        && o.tax_category_key === r.tax_category_key
        && (text(o.valid_from) === '' || text(r.valid_to) === '' || text(o.valid_from) <= text(r.valid_to))
        && (text(r.valid_from) === '' || text(o.valid_to) === '' || text(r.valid_from) <= text(o.valid_to)));

    // The demo's own predicate, run for real.
    const source = page.match(/\n(\s*)function ruleOverlaps\(row, all\) \{[\s\S]*?\n\1\}/);
    expect(source, 'the demo must keep `ruleOverlaps(row, all)` as a plain function').not.toBeNull();
    const demoOverlaps = new Function(`${source![0]}\nreturn ruleOverlaps;`)() as (row: Rule, all: Rule[]) => boolean;

    const fixture = [
      ...jsonFixture(page, 'RULE_FIXTURE'),
      ...jsonFixture(page, 'LEGACY_RULE_FIXTURE'),
      ...jsonFixture(page, 'OVERLAP_RULE_FIXTURE'),
    ];
    const overlapping = jsonFixture(page, 'OVERLAP_RULE_FIXTURE');
    expect(overlapping.length).toBeGreaterThanOrEqual(1);
    for (const row of overlapping) expect(seed).toContain(`'${row.tax_category_key}'`);
    const newer = overlapping[0];
    const older = fixture.find((row) => row !== newer && sqlOverlaps(row, [row, newer]))!;
    expect(older, 'the overlapping rule must collide with a seeded one').toBeDefined();
    expect(text(older.valid_from) < text(newer.valid_from)).toBe(true);
    const dayBefore = new Date(Date.parse(`${text(newer.valid_from)}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

    const variant = (rows: Rule[], id: unknown, change: Rule): Rule[] =>
      rows.map((row) => (row.id === id ? { ...row, ...change } : row));
    const scenarios: Array<[string, Rule[], number]> = [
      ['the demo as it opens: the pair is flagged', fixture, 2],
      ['older rule ended the day before: fixed', variant(fixture, older.id, { valid_to: dayBefore }), 0],
      ['older rule ended ON the start day: still overlaps', variant(fixture, older.id, { valid_to: newer.valid_from }), 2],
      ['one of them deactivated: fixed', variant(fixture, newer.id, { is_active: 0 }), 0],
      ['another region: no overlap', variant(fixture, newer.id, { region_code: 'CN' }), 0],
      ['another country: no overlap', variant(fixture, newer.id, { country_code: 'PT' }), 0],
      ['another category: no overlap', variant(fixture, newer.id, { tax_category_key: 'product.generic', valid_from: '2012-09-01' }), 2],
      ['a component never counts', variant(fixture, newer.id, { parent_id: older.id }), 0],
      ['open start on both', variant(variant(fixture, newer.id, { valid_from: null }), older.id, { valid_from: '' }), 2],
      ['newer ends before the older starts', variant(fixture, newer.id, { valid_from: '2010-01-01', valid_to: '2012-08-31' }), 0],
    ];
    for (const [label, rows, expected] of scenarios) {
      const flaggedBySql = rows.filter((row) => sqlOverlaps(row, rows)).map((row) => row.id);
      const flaggedByDemo = rows.filter((row) => demoOverlaps(row, rows)).map((row) => row.id);
      expect(flaggedBySql, label).toHaveLength(expected);
      expect(flaggedByDemo, label).toEqual(flaggedBySql);
    }
  });
});

describe('showcase module-taxes-aliases — paridad con aliases real', () => {
  it('reproduce columnas, dominios cerrados y alta aprendida sin acciones inventadas', () => {
    const page = pageSource('aliases');
    const list = manifest.queries['taxes.aliases.list'].list!;
    for (const key of ['alias', 'tax_category_key', 'source', 'is_active']) {
      expect(components.aliases).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    expect(list.page_size).toBe(50);
    // Sin `is_active`: ERPlora/taxes#53. La columna sigue, la caja de filtro no.
    expect(Object.keys(list.filters)).toEqual(['alias', 'tax_category_key', 'source']);
    expect(page).toContain("sort: 'alias'");
    expect(page).toContain("cardIcon = () => 'link-outline'");
    expect(page).not.toContain('table.actions =');
    expect(page).not.toContain("addEventListener('rowAction'");

    expect(aliasSchema.required).toEqual(['alias', 'tax_category_key']);
    expect(aliasSchema.properties.source.enum).toEqual(['shipped', 'learned']);
    expect(page).toContain('<form id="taxes-alias-form" slot="create"');
    for (const field of ['tax-alias-value', 'tax-alias-category', 'tax-alias-source']) {
      expect(page).toContain(`id="${field}"`);
    }
    expect(page).toContain("recordCommand('taxes.aliases.create'");
    expect(page).toContain("source: String(sourceInput.value || 'learned')");
  });

  it('parte exactamente de los catorce alias enviados con el módulo', () => {
    const rows = jsonFixture(pageSource('aliases'), 'ALIAS_FIXTURE');
    expect(rows.map((row) => row.alias)).toEqual([
      'food', 'prepared_food', 'meal', 'pizza', 'drink', 'beverage', 'soft_drink',
      'alcohol', 'beer', 'wine', 'delivery', 'service', 'product', 'goods',
    ]);
    for (const row of rows) {
      expect(seed).toContain(`'${row.alias}'`);
      expect(row.source).toBe('shipped');
      expect(row.is_active).toBe(1);
    }
  });
});
