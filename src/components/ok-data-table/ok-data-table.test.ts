// @vitest-environment happy-dom
//
// Contrato de las ACCIONES DE FILA (ADR-0133): son SOLO ICONO, y un botón solo-icono
// TIENE QUE TENER NOMBRE ACCESIBLE.
//
// El JSDoc de `DataTableAction.label` promete «texto del botón (o aria-label si solo hay icono)»,
// pero `actionButtons()` era binario: `a.icon ? <ion-icon slot="icon-only"> : a.label`. Con icono,
// el `label` se TIRABA: ni `title` (sin tooltip al pasar el ratón) ni `aria-label` (el lector de
// pantalla lee «botón», sin más). 17 de 27 módulos pintan sus acciones así → decenas de botones
// anónimos. `toolButton()`, en la misma clase, sí ponía `title` + `aria-label`.
//
// Aquí se fija: con icono, el `label` viaja a `title` + `aria-label` del <ion-button> y el botón
// SIGUE siendo icon-only (nada de texto visible: no se toca el aspecto).
import { describe, expect, it } from 'vitest';
import './ok-data-table.js';
import type { OkDataTable } from './ok-data-table.js';

const COLUMNS = [{ key: 'name', header: 'Nombre' }];
const ROWS = [{ id: '1', name: 'Ana García' }];

async function mount(actions: unknown[]): Promise<OkDataTable> {
  const el = document.createElement('ok-data-table') as OkDataTable;
  el.columns = COLUMNS as never;
  el.rows = ROWS;
  el.actions = actions as never;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

function actionButtons(el: OkDataTable): HTMLElement[] {
  return [...el.shadowRoot!.querySelectorAll('.actions ion-button')] as HTMLElement[];
}

describe('ok-data-table · acciones de fila', () => {
  it('una acción con icono expone su `label` como `title` y `aria-label` (botón con nombre)', async () => {
    const el = await mount([{ id: 'edit', label: 'Editar', icon: 'create-outline' }]);

    const [btn] = actionButtons(el);
    expect(btn, 'no se pintó el botón de acción').toBeTruthy();
    expect(btn.getAttribute('title')).toBe('Editar');
    expect(btn.getAttribute('aria-label')).toBe('Editar');
  });

  it('el botón con icono sigue siendo SOLO ICONO: no aparece el texto del label', async () => {
    const el = await mount([{ id: 'delete', label: 'Eliminar', icon: 'trash-outline' }]);

    const [btn] = actionButtons(el);
    expect(btn.querySelector('ion-icon[slot="icon-only"]'), 'falta el ion-icon icon-only').toBeTruthy();
    expect(btn.textContent?.trim(), 'el label no debe pintarse como texto visible').toBe('');
  });

  it('una acción SIN icono conserva el texto (compatibilidad) y no inventa aria-label', async () => {
    const el = await mount([{ id: 'approve', label: 'Aprobar' }]);

    const [btn] = actionButtons(el);
    expect(btn.textContent?.trim()).toBe('Aprobar');
    // Con texto visible, el nombre accesible YA es el texto: un aria-label redundante solo estorba.
    expect(btn.getAttribute('aria-label')).toBeNull();
  });
});
