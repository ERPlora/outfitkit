// @vitest-environment happy-dom

import { afterEach, describe, expect, it } from 'vitest';
import './ok-cta-band.js';
import { OkCtaBand } from './ok-cta-band.js';

afterEach(() => {
  document.body.innerHTML = '';
});

async function renderBand(variant: 'solid' | 'soft' | 'glass' = 'solid'): Promise<OkCtaBand> {
  const band = document.createElement('ok-cta-band') as OkCtaBand;
  band.variant = variant;
  band.innerHTML = '<ion-button slot="actions" fill="outline">Secondary action</ion-button>';
  document.body.append(band);
  await band.updateComplete;
  return band;
}

describe('ok-cta-band — acciones Ionic', () => {
  it('mantiene los ion-button en el slot dedicado', async () => {
    const band = await renderBand();

    expect(band.shadowRoot?.querySelector('slot[name="actions"]')).not.toBeNull();
    expect(band.querySelector('ion-button[slot="actions"][fill="outline"]')?.textContent).toContain(
      'Secondary action',
    );
  });

  it('deriva el outline sólido del contraste de la paleta, incluso cuando es oscuro', async () => {
    const band = await renderBand();
    band.style.setProperty('--ok-primary-contrast', '#0a0a0a');

    const componentStyles = OkCtaBand.styles.toString();
    expect(componentStyles).toContain(
      '--primary-contrast: var(--ok-primary-contrast, var(--ion-color-primary-contrast, #ffffff))',
    );
    expect(componentStyles).toContain(
      '--action-outline-color: var(--ok-cta-action-outline-color, var(--primary-contrast))',
    );
    expect(componentStyles).toContain("::slotted(ion-button[fill='outline'])");
    expect(componentStyles).toContain('--color: var(--action-outline-color)');
    expect(componentStyles).toContain('--border-color: var(--action-outline-border-color)');
  });

  it('no fuerza el contraste sólido sobre las variantes soft o glass', async () => {
    const componentStyles = OkCtaBand.styles.toString();

    expect(componentStyles).not.toContain(":host([variant='soft']) ::slotted");
    expect(componentStyles).not.toContain(":host([variant='glass']) ::slotted");
  });
});
