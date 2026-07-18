// @vitest-environment happy-dom
// Contrato del TABBAR de footer (`ion-segment` usado como barra de navegación).
//
// Por qué vive en OutfitKit y no en cada producto: el Hub y el SaaS habían arreglado POR SEPARADO
// el mismo problema, con reglas que ya divergían (Hub `polish.css` ↔ SaaS `dashboard-shell.css`,
// cloud#559). Es un hueco real de Ionic, no un wrapper: `ion-segment` no hace `scrollIntoView` a la
// pestaña activa y su prop `scrollable` sólo cambia layout y gestos — no hay forma de saber si
// desborda ni por dónde va el scroll sin JS.
//
// happy-dom no calcula layout: offsetLeft/offsetWidth/clientWidth/scrollWidth son 0 y son getters de
// solo lectura, así que se fijan por instancia con defineProperty.
import { afterEach, describe, expect, it, vi } from 'vitest';

import { bindTabbar, hintScroll, scrollActiveTabIntoView, shouldHintScroll, syncTabbarOverflow, tabbarOverflow } from './tabbar';

function metricas(el: HTMLElement, m: Record<string, number>): void {
  for (const [k, v] of Object.entries(m)) Object.defineProperty(el, k, { configurable: true, value: v });
}

/** Segment de `n` pestañas de 84px en una barra visible de `clientWidth`, con la `activa` marcada. */
function segmentCon(n: number, activa: number, clientWidth: number): HTMLElement {
  const seg = document.createElement('ion-segment');
  metricas(seg, { clientWidth, scrollWidth: n * 84 });
  for (let i = 0; i < n; i++) {
    const b = document.createElement('ion-segment-button');
    if (i === activa) b.classList.add('segment-button-checked');
    metricas(b, { offsetLeft: i * 84, offsetWidth: 84 });
    seg.appendChild(b);
  }
  seg.scrollLeft = 0;
  document.body.appendChild(seg);
  return seg;
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('tabbarOverflow', () => {
  it('sin desbordamiento no marca ningún borde', () => {
    const seg = segmentCon(3, 0, 382);
    metricas(seg, { scrollWidth: 252 });
    expect(tabbarOverflow(seg)).toBe('none');
  });

  it('al principio solo marca el borde derecho', () => {
    const seg = segmentCon(6, 0, 382);
    expect(tabbarOverflow(seg)).toBe('end');
  });

  it('a mitad marca los dos bordes', () => {
    const seg = segmentCon(6, 0, 382);
    seg.scrollLeft = 60;
    expect(tabbarOverflow(seg)).toBe('both');
  });

  it('al final solo marca el izquierdo: el degradado no queda colgando', () => {
    const seg = segmentCon(6, 0, 382);
    seg.scrollLeft = 504 - 382;
    expect(tabbarOverflow(seg)).toBe('start');
  });

  it('tolera el subpíxel', () => {
    const seg = segmentCon(6, 0, 382);
    seg.scrollLeft = 504 - 382 - 0.5;
    expect(tabbarOverflow(seg)).toBe('start');
  });

  it('sin segment devuelve none', () => {
    expect(tabbarOverflow(null)).toBe('none');
  });
});

describe('syncTabbarOverflow', () => {
  it('publica el estado en data-overflow para que lo lea el CSS', () => {
    const seg = segmentCon(6, 0, 382);
    syncTabbarOverflow(seg);
    expect(seg.dataset.overflow).toBe('end');
  });
});

describe('scrollActiveTabIntoView', () => {
  it('trae la pestaña activa cuando queda fuera por la derecha', () => {
    const seg = segmentCon(5, 4, 382);
    scrollActiveTabIntoView(seg);
    expect(seg.scrollLeft).toBe(38); // [336,420] → 420-382
  });

  it('trae la pestaña activa cuando queda fuera por la izquierda', () => {
    const seg = segmentCon(5, 0, 382);
    seg.scrollLeft = 200;
    scrollActiveTabIntoView(seg);
    expect(seg.scrollLeft).toBe(0);
  });

  it('no mueve la barra si la activa ya se ve', () => {
    const seg = segmentCon(5, 1, 382);
    scrollActiveTabIntoView(seg);
    expect(seg.scrollLeft).toBe(0);
  });

  it('no toca nada si caben todas', () => {
    const seg = segmentCon(3, 2, 382);
    metricas(seg, { scrollWidth: 252 });
    scrollActiveTabIntoView(seg);
    expect(seg.scrollLeft).toBe(0);
  });
});

describe('shouldHintScroll', () => {
  it('da la pista cuando quedan pestañas a la derecha', () => {
    expect(shouldHintScroll({ overflow: 'end', reducedMotion: false, yaScrolleado: false })).toBe(true);
    expect(shouldHintScroll({ overflow: 'both', reducedMotion: false, yaScrolleado: false })).toBe(true);
  });

  it('no la da si caben todas, si ya estás al final, con reduced-motion, o si ya se movió', () => {
    expect(shouldHintScroll({ overflow: 'none', reducedMotion: false, yaScrolleado: false })).toBe(false);
    expect(shouldHintScroll({ overflow: 'start', reducedMotion: false, yaScrolleado: false })).toBe(false);
    expect(shouldHintScroll({ overflow: 'end', reducedMotion: true, yaScrolleado: false })).toBe(false);
    expect(shouldHintScroll({ overflow: 'both', reducedMotion: false, yaScrolleado: true })).toBe(false);
  });
});

describe('hintScroll', () => {
  it('se asoma y vuelve al origen', () => {
    vi.useFakeTimers();
    const seg = segmentCon(6, 0, 382);
    const movs: number[] = [];
    seg.scrollTo = ((o: { left: number }) => movs.push(o.left)) as unknown as typeof seg.scrollTo;
    hintScroll(seg);
    expect(movs).toEqual([28]);
    vi.runAllTimers();
    expect(movs).toEqual([28, 0]);
    vi.useRealTimers();
  });
});

// `bindTabbar` es la ÚNICA llamada que necesita el consumidor: marca el elemento para el CSS,
// mantiene `data-overflow` al día y limpia detrás. Así el Hub y el SaaS comparten comportamiento
// en vez de reimplementarlo cada uno.
describe('bindTabbar', () => {
  it('marca el segment con la clase que estiliza el CSS', () => {
    const seg = segmentCon(6, 0, 382);
    bindTabbar(seg);
    expect(seg.classList.contains('ok-tabbar')).toBe(true);
  });

  it('publica el estado inicial sin esperar a que el usuario scrollee', () => {
    const seg = segmentCon(6, 0, 382);
    bindTabbar(seg);
    expect(seg.dataset.overflow).toBe('end');
  });

  it('recalcula el estado al scrollear', () => {
    const seg = segmentCon(6, 0, 382);
    bindTabbar(seg);
    seg.scrollLeft = 60;
    seg.dispatchEvent(new Event('scroll'));
    expect(seg.dataset.overflow).toBe('both');
  });

  it('el cleanup deja de escuchar: no debe quedar trabajo tras desmontar la vista', () => {
    const seg = segmentCon(6, 0, 382);
    const cleanup = bindTabbar(seg);
    cleanup();
    seg.scrollLeft = 60;
    seg.dispatchEvent(new Event('scroll'));
    expect(seg.dataset.overflow).toBe('end'); // se quedó como estaba
  });

  it('sin segment devuelve un cleanup inocuo en vez de reventar', () => {
    expect(() => bindTabbar(null)()).not.toThrow();
  });
});
