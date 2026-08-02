// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import './ok-hero.js';
import type { OkHero } from './ok-hero.js';

afterEach(() => {
  document.body.innerHTML = '';
});

async function renderHero(markup = ''): Promise<OkHero> {
  const hero = document.createElement('ok-hero') as OkHero;
  hero.innerHTML = markup;
  document.body.append(hero);
  await hero.updateComplete;
  return hero;
}

describe('ok-hero', () => {
  it('expone un hero editorial centrado y suave por defecto', async () => {
    const hero = await renderHero(`
      <span slot="eyebrow">Platform</span>
      <h1 slot="title">One ERP</h1>
      <p slot="subtitle">For growing businesses.</p>
    `);

    expect(hero.getAttribute('align')).toBe('center');
    expect(hero.getAttribute('tone')).toBe('soft');
    expect(hero.shadowRoot?.querySelector('slot[name="eyebrow"]')).not.toBeNull();
    expect(hero.shadowRoot?.querySelector('slot[name="title"]')).not.toBeNull();
    expect(hero.shadowRoot?.querySelector('.eyebrow')?.classList.contains('empty')).toBe(false);
    expect(hero.shadowRoot?.querySelector('.title')).not.toBeNull();
    expect(hero.shadowRoot?.querySelector('.subtitle')).not.toBeNull();
    expect(hero.querySelector('h1[slot="title"]')?.textContent).toBe('One ERP');
  });

  it('refleja variantes reutilizables sin mover el contenido fuera del light DOM', async () => {
    const hero = await renderHero(`
      <h1 slot="title">Connect every device</h1>
      <div>Product visual</div>
    `);

    hero.align = 'split';
    hero.tone = 'gradient';
    hero.compact = true;
    await hero.updateComplete;

    expect(hero.getAttribute('align')).toBe('split');
    expect(hero.getAttribute('tone')).toBe('gradient');
    expect(hero.hasAttribute('compact')).toBe(true);
    expect(hero.shadowRoot?.querySelector('.layout')).not.toBeNull();
    expect(hero.shadowRoot?.querySelector('slot:not([name])')).not.toBeNull();
    expect(hero.querySelector('h1')?.textContent).toBe('Connect every device');
  });

  it('mantiene las acciones Ionic en un slot dedicado', async () => {
    const hero = await renderHero(`
      <h1 slot="title">Start now</h1>
      <ion-button slot="actions">Create account</ion-button>
    `);

    expect(hero.shadowRoot?.querySelector('slot[name="actions"]')).not.toBeNull();
    expect(hero.querySelector('ion-button[slot="actions"]')?.textContent).toBe('Create account');
  });
});
