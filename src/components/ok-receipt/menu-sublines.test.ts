// @vitest-environment happy-dom

// outfitkit#77 — the MENU on the on-screen ticket (ADR-0396, sales#154).
//
// `sales` composed the menu's components and the line's supplements into ONE `note` («Gazpacho ·
// Solomillo (+3,00) · Cerveza · Al punto»), painted at 9px under the line: unreadable a metre away
// on the POS pre-bill modal and with none of the hierarchy the printed HTML has (one indented
// sub-line per component, 11px). Screen and paper said the same thing but did not LOOK the same.
//
// Contract (ADDED, never replaced): `components?: string[]` and `modifiers?: string[]` — labels
// already composed by the module (single composer, `paper-combos.ts`). One indented sub-line each,
// components first, no amount; `note` stays for free text and is NOT painted when a list is present
// (the module that still duplicates the text into `note` must not show it twice).
import { beforeEach, describe, expect, it } from 'vitest';
import './ok-receipt.js';
import type { OkReceipt, ReceiptData } from './ok-receipt.js';

const PLAIN: ReceiptData = {
  business: { name: 'BAR PEPE' },
  number: 'T-7',
  lines: [{ name: 'Cafe', qty: 1, unit_price: 1.8, total: 1.8, note: 'sin sal' }],
  total: 1.8,
};

const MENU_LINE = {
  name: 'Menú del día',
  qty: 1,
  unit_price: 16.5,
  total: 16.5,
  components: ['Gazpacho', 'Solomillo (+3,00)', 'Cerveza', 'Flan'],
  modifiers: ['Al punto'],
  note: 'Gazpacho · Solomillo (+3,00) · Cerveza · Flan · Al punto',
};

async function mount(receipt: ReceiptData): Promise<OkReceipt> {
  const el = document.createElement('ok-receipt') as OkReceipt;
  el.receipt = receipt;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const subs = (el: OkReceipt): HTMLElement[] => [...el.shadowRoot!.querySelectorAll('.line-sub')] as HTMLElement[];

beforeEach(() => { document.body.innerHTML = ''; });

describe('ok-receipt — el menú se sangra una sub-línea por componente (#77 / ADR-0396)', () => {
  it('pinta una sub-línea por componente y otra por suplemento, en ese orden', async () => {
    const el = await mount({ ...PLAIN, lines: [MENU_LINE] });
    const texts = subs(el).map((s) => s.textContent?.trim());
    expect(texts).toEqual(['Gazpacho', 'Solomillo (+3,00)', 'Cerveza', 'Flan', 'Al punto']);
    expect(subs(el).slice(0, 4).every((s) => s.classList.contains('comp')), 'los componentes no van marcados como tales').toBe(true);
    expect(subs(el)[4]?.classList.contains('mod'), 'el suplemento no va marcado como tal').toBe(true);
  });

  it('las sub-líneas van bajo el nombre y NO llevan importe (el precio es el de la cabecera)', async () => {
    const el = await mount({ ...PLAIN, lines: [MENU_LINE] });
    const row = el.shadowRoot!.querySelector('tbody tr')!;
    const name = row.querySelector('.line-name > div')!;
    const first = subs(el)[0]!;
    expect(name.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING, 'la sub-línea no va debajo del nombre').toBeTruthy();
    expect(row.querySelectorAll('td.num'), 'más de una celda de importe en la línea del menú').toHaveLength(1);
    expect(row.querySelector('td.num')?.textContent).toContain('16.50');
  });

  it('con listas presentes, `note` NO se pinta (evita el texto por duplicado)', async () => {
    const el = await mount({ ...PLAIN, lines: [MENU_LINE] });
    expect(el.shadowRoot!.querySelector('.line-note')).toBeNull();
  });

  it('las sub-líneas son legibles: cuerpo de 11 px y sangrado de 4 mm, como el papel HTML', async () => {
    await mount({ ...PLAIN, lines: [MENU_LINE] });
    const ctor = customElements.get('ok-receipt') as unknown as { styles: { cssText: string } };
    const css = String(ctor.styles.cssText).replace(/\s+/g, ' ');
    expect(css).toMatch(/\.line-sub[^{]*\{[^}]*font-size: 11px;[^}]*padding-left: 4mm;/);
  });

  it('una línea sin listas se pinta como siempre (nota a 9 px, ninguna sub-línea)', async () => {
    const el = await mount(PLAIN);
    expect(subs(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.line-note')?.textContent).toBe('sin sal');
  });

  it('listas vacías = sin listas (la línea de siempre no crece)', async () => {
    const el = await mount({ ...PLAIN, lines: [{ ...PLAIN.lines[0], components: [], modifiers: [] }] });
    expect(subs(el)).toHaveLength(0);
    expect(el.shadowRoot!.querySelector('.line-note')?.textContent).toBe('sin sal');
  });

  it('tolera que un módulo ya desplegado meta OBJETOS en `modifiers` (sales ≤ 2.16.10): los ignora y pinta la nota', async () => {
    // `sales` today attaches `modifiers: PrintedModifier[]` (objects) and `combo` to the very object
    // it hands to `<ok-receipt>`. A version of this component that painted them as strings would
    // print «[object Object]» on every hub the day the shell upgrades. Non-strings are not labels.
    const line = { ...PLAIN.lines[0], modifiers: [{ name: 'Sin cebolla', price_delta: 0 }] as unknown as string[] };
    const el = await mount({ ...PLAIN, lines: [line] });
    expect(subs(el)).toHaveLength(0);
    expect(el.shadowRoot!.textContent).not.toContain('[object Object]');
    expect(el.shadowRoot!.querySelector('.line-note')?.textContent).toBe('sin sal');
  });
});
