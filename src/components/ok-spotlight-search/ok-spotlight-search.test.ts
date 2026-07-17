// @vitest-environment happy-dom
//
// Contrato de ok-spotlight-search: overlay de búsqueda estilo Spotlight (macOS). Aporta SOLO el
// chrome (input hero + ✕ + panel translúcido flotante + <dialog> top-layer); el consumidor pone y
// estila los resultados vía el slot por defecto y las acciones vía slot="footer". Emite `ok-input`
// al teclear y `ok-open` al abrir/cerrar. Si se le da `trigger-icon`, pinta su propio botón-trigger;
// si no, el consumidor controla `open` (p.ej. desde una lupa externa).
import { describe, expect, it, vi } from 'vitest';

// `icons.js` arrastra la cadena `~icons/…?raw` que el transform de test deniega; la mockeamos
// (los iconos horneados son irrelevantes para el CONTRATO de comportamiento que se fija aquí).
vi.mock('../../base/icons.js', () => ({
  iconSearchOutline: '<svg></svg>',
  iconCloseOutline: '<svg></svg>',
  okIcon: (v?: string) => v,
}));

import './ok-spotlight-search.js';
import type { OkSpotlightSearch } from './ok-spotlight-search.js';

async function mount(attrs: Record<string, string> = {}): Promise<OkSpotlightSearch> {
  const el = document.createElement('ok-spotlight-search') as OkSpotlightSearch;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('ok-spotlight-search', () => {
  it('con trigger-icon pinta un botón-trigger que abre el overlay', async () => {
    const el = await mount({ 'trigger-icon': 'person', 'trigger-label': 'Buscar cliente' });
    const trigger = el.shadowRoot!.querySelector('button.trigger') as HTMLElement | null;
    expect(trigger, 'pinta el botón-trigger').toBeTruthy();
    expect(trigger!.getAttribute('aria-label')).toBe('Buscar cliente');

    let opened: boolean | undefined;
    el.addEventListener('ok-open', (e) => { opened = (e as CustomEvent).detail.open; });
    trigger!.click();
    await el.updateComplete;
    expect(el.open, 'queda abierto').toBe(true);
    expect(opened, 'emite ok-open {open:true}').toBe(true);
  });

  it('sin trigger-icon no pinta trigger; el consumidor controla open', async () => {
    const el = await mount();
    expect(el.shadowRoot!.querySelector('button.trigger'), 'no hay trigger propio').toBeNull();
    el.open = true;
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector('dialog'), 'el overlay es un <dialog> nativo').toBeTruthy();
  });

  it('al teclear emite ok-input con el valor', async () => {
    const el = await mount();
    el.open = true;
    await el.updateComplete;
    let val: string | undefined;
    el.addEventListener('ok-input', (e) => { val = (e as CustomEvent).detail.value; });
    const input = el.shadowRoot!.querySelector('input') as HTMLInputElement;
    input.value = 'ana';
    input.dispatchEvent(new Event('input'));
    expect(val, 'emite ok-input {value}').toBe('ana');
    expect(el.value, 'refleja el valor').toBe('ana');
  });

  it('close() cierra y emite ok-open {open:false}', async () => {
    const el = await mount();
    el.open = true;
    await el.updateComplete;
    let opened: boolean | undefined;
    el.addEventListener('ok-open', (e) => { opened = (e as CustomEvent).detail.open; });
    el.close();
    await el.updateComplete;
    expect(el.open).toBe(false);
    expect(opened).toBe(false);
  });

  it('proyecta resultados (slot por defecto) y acciones (slot footer)', async () => {
    const el = await mount();
    el.open = true;
    await el.updateComplete;
    const names = [...el.shadowRoot!.querySelectorAll('slot')].map((s) => s.getAttribute('name') || 'default');
    expect(names, 'expone slot por defecto para resultados').toContain('default');
    expect(names, 'expone slot="footer" para acciones').toContain('footer');
  });
});
