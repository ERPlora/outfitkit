import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const pageUrl = new URL('../../showcase/pages/module-cash-register.html', import.meta.url);
const moduleUrl = new URL('../../../modules-workspace/modules/cash_register/', import.meta.url);
const component = readFileSync(
  new URL('ui/components/erp-cashregister-dashboard/erp-cashregister-dashboard.ts', moduleUrl),
  'utf8',
);
const manifest = JSON.parse(readFileSync(new URL('module.json', moduleUrl), 'utf8')) as {
  queries: Record<string, { list?: { page_size: number; default_sort: string; default_dir: string } }>;
  commands: Record<string, unknown>;
};

function pageSource(): string {
  expect(existsSync(pageUrl), 'falta la demo real de /m/cash_register/cash_register').toBe(true);
  return readFileSync(pageUrl, 'utf8');
}

describe('showcase module-cash-register — paridad con el dashboard real', () => {
  it('usa Hub + Ionic iOS y deja ok-data-table como única pieza OutfitKit', () => {
    const page = pageSource();
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).toContain("active: '/m/cash_register/cash_register'");
    expect(page).toContain("title: 'Caja'");
    expect(page).toContain('<script src="./_ionic-config.js"></script>');
    expect(page.indexOf('./_ionic-config.js')).toBeLessThan(page.indexOf('@ionic/core'));
    expect(page).not.toMatch(/mode=["']md["']/);
    const outfitTags = [...page.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-data-table']));
  });

  it('mantiene las columnas, la lista server-side y las tres acciones reales', () => {
    const page = pageSource();
    for (const key of [
      'session_number', 'status', 'opening_balance', 'expected_balance',
      'closing_balance', 'difference',
    ]) {
      expect(component).toContain(`key: '${key}'`);
      expect(page).toContain(`key: '${key}'`);
    }
    for (const id of ['movement', 'count', 'close']) {
      expect(component).toContain(`id: '${id}'`);
      expect(page).toContain(`id: '${id}'`);
    }
    for (const property of [
      'serverSide = true', 'fill = true', 'views = true', 'cardTitle = (row) =>',
      "cardIcon = () => 'cash-outline'", 'searchable = true', 'pageSize = 50',
      "sort = 'id'", "sortDir = 'asc'",
    ]) expect(page).toContain(property);
    expect(manifest.queries['cash_register.sessions.list'].list).toMatchObject({
      page_size: 50, default_sort: 'id', default_dir: 'asc',
    });
  });

  it('reproduce apertura, cierre, movimiento y arqueo con campos Ionic', () => {
    const page = pageSource();
    for (const panel of ['open', 'close', 'movement', 'count']) {
      expect(page).toContain(`id="cash-${panel}-panel"`);
    }
    for (const command of [
      'cash_register.session.open', 'cash_register.session.close',
      'cash_register.movement.add', 'cash_register.count.add',
    ]) {
      expect(manifest.commands).toHaveProperty(command);
      expect(page).toContain(`'${command}'`);
    }
    expect(page).toContain("const BILLS = ['500', '200', '100', '50', '20', '10', '5']");
    expect(page).toContain("const COINS = ['2', '1', '0.50', '0.20', '0.10', '0.05', '0.02', '0.01']");
    expect(page).toContain("amount: movementType.value === 'out' ? -amount : amount");
    expect(page).toContain('opening_balance: toCents(openingBalance.value)');
  });

  it('conecta todas las señales de la tabla y no inventa borrado ni edición', () => {
    const page = pageSource();
    for (const event of ['rowAction', 'pageChange', 'pageSizeChange', 'sortChange', 'searchChange', 'filterChange']) {
      expect(page).toContain(`addEventListener('${event}'`);
    }
    expect(page).not.toMatch(/id:\s*['"](?:edit|delete|duplicate)['"]/);
    expect(page).toContain('table.rows = filtered.slice(');
  });
});
