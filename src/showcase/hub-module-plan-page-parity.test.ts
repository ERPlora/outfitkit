// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// @ts-expect-error — módulo JS del showcase, sin declaraciones TypeScript.
import { HUB_PAGES } from '../../showcase/product-pages-data.js';

const readPage = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

const hubPanel = readFileSync(
  new URL('../../../hub/apps/web/src/components/ModulePlanPanel.vue', import.meta.url),
  'utf8',
);
const hubView = readFileSync(
  new URL('../../../hub/apps/web/src/views/ModuleView.vue', import.meta.url),
  'utf8',
);
const manifest = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/whatsapp_inbox/module.json', import.meta.url),
    'utf8',
  ),
) as { billing: { trial_days?: number; tiers: { name: string; price: number }[] } };
const moduleEs = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/whatsapp_inbox/locales/es.json', import.meta.url),
    'utf8',
  ),
) as { billing?: { quota?: Record<string, string> } };

/* La pestaña «Plan» de un módulo de pago.
 *
 * No es una pestaña del módulo: la INYECTA el shell cuando el manifest declara `billing`
 * (`PLAN_TAB_ID`, ModuleView.vue), así que el generador de páginas de módulo —que solo lee
 * `navigation[]`— nunca la produce, y esta página se cura a mano.
 *
 * Lo que fija este test es el contrato de esa pantalla, que existe porque el Hub NO vende:
 * empaquetado como app, los CTA de compra se retiraron (hub#479, steering en Play/Store) y la
 * gestión aterriza en la cuenta del SaaS ligada a un hub (hub#1608 → ERPlora/saas#1901).
 */
describe('showcase Hub — pestaña «Plan» de un módulo de pago', () => {
  const page = readPage('module-plan-hub.html');

  it('la pestaña la inyecta el shell, no el manifest del módulo', () => {
    expect(hubView).toContain("PLAN_TAB_ID = '__plan__'");
    expect(page).toContain('value="__plan__"');
  });

  it('usa el shell Hub y configura Ionic iOS antes de cargar Ionic', () => {
    expect(page).toContain("import { defineHubPage } from './_hub.js'");
    expect(page).not.toContain("from './_page.js'");
    expect(page).not.toContain('<ok-page-header');
    // ADR-0143 (enmienda 2026-08-11): el shell se queda en `ios`; lo prohibido es mover la PÁGINA a md.
    expect(page).not.toMatch(/mode:\s*['"]md['"]/);

    const config = page.indexOf('<script src="./_ionic-config.js"></script>');
    const ionic = page.indexOf('@ionic/core/dist/ionic/ionic.esm.js');
    expect(config).toBeGreaterThan(-1);
    expect(config).toBeLessThan(ionic);

    expect(page).toMatch(/defineHubPage\(\{[\s\S]*active:\s*'\/apps'/);
    expect(page).toContain("title: 'WhatsApp Inbox'");
  });

  it('pinta el estado con las piezas de OutfitKit, nunca con una tarjeta propia', () => {
    // hub#1605: el panel dejó `ion-card`/`ion-card-header` porque el preflight de Tailwind aplasta
    // su padding de Shadow DOM. Las piezas de OutfitKit traen el suyo dentro del shadow root.
    for (const tag of ['<ok-inline-feedback', '<ok-status-pill', '<ok-pricing-card']) {
      expect(hubPanel).toContain(tag);
      expect(page).toContain(tag);
    }
    expect(hubPanel).not.toContain('<ion-card');
    expect(page).not.toContain('<ion-card');
    expect(page).toContain('Tu plan');
    expect(page).toContain(
      'Los planes de este módulo se gestionan desde tu cuenta de ERPlora, en erplora.com.',
    );
  });

  it('lleva los DOS botones reales en slot="actions" y ningún camino al pago', () => {
    for (const testid of ['module-manage-plan', 'module-check-purchase']) {
      expect(hubPanel).toContain(`data-testid="${testid}"`);
      expect(page).toContain(`data-testid="${testid}"`);
    }
    expect(page).toContain('Gestionar plan');
    expect(page).toContain('Ya lo he contratado — comprobar');
    expect(page.match(/slot="actions"/g)).toHaveLength(2);

    // hub#479 — el Hub no vende. Ni un CTA de compra, ni el marketplace nombrado.
    for (const steering of ['Comprar', 'Suscribirse', 'Mejorar', 'Checkout', 'marketplace']) {
      expect(page).not.toContain(steering);
    }
  });

  it('un módulo CON tier gratuito no tiene «En prueba» ni «Sin plan»', () => {
    // ADR-0032 (saas/apps/public/modules/entitlement.py): un módulo premium que declara un tier a
    // 0 € es instalable SIN compra y corre en modo gratuito; el trial sin tarjeta es solo para los
    // que NO traen tier gratuito. Luego, con WhatsApp Free en el manifest, todo el mundo entra por
    // el gratis y nadie está «sin plan» ni «en prueba».
    expect(manifest.billing.tiers.some((tier) => tier.price === 0)).toBe(true);
    for (const label of ['Activo', 'Caducado', 'Cancelado', 'Pago pendiente']) {
      expect(page).toContain(label);
    }
    expect(page).not.toContain('En prueba');
    expect(page).not.toContain('Sin plan');

    for (const tone of ['success', 'warning', 'danger']) {
      expect(hubPanel).toContain(`'${tone}'`);
      expect(page).toContain(`'${tone}'`);
    }
  });

  /* Los tres DELTAS contra el Hub de hoy. Cada uno afirma también que el Hub aún NO lo hace: el día
   * que se implemente, este test cae y avisa de que la página pasa a `parity: current`. */
  it('DELTA — el estado por defecto es el tier gratuito, no «Sin plan»', () => {
    // Hoy: sin `ModulePurchase`, /module-subscription/ devuelve `none` y el panel lo pinta como si
    // no tuvieras nada, cuando en realidad estás en WhatsApp Free con su cuota.
    expect(hubPanel).toContain("t(`modulePlan.status.${s}`)");
    expect(page).toContain('Estás en WhatsApp Free');
  });

  it('DELTA — la tarjeta del plan que tienes va marcada', () => {
    // `ok-pricing-card` ya trae `featured` + `badge`; el panel del Hub no los usa porque el Cloud
    // no le manda el slug del tier contratado (vive en `ModulePurchase.module_tier`, que la ficha
    // del SaaS sí pinta, pero el endpoint del hub no serializa).
    expect(hubPanel).not.toContain('featured');
    expect(page).toContain('featured');
    expect(page).toContain('Tu plan');
  });

  it('la cuota se lee en español, y la palabra la pone el MÓDULO', () => {
    // hub#1604: el shell no guarda un diccionario de métricas de todos los módulos del mundo — la
    // etiqueta sale del `locales/<lang>.json` del propio módulo, con el inglés canónico de fallback
    // (ADR-0055). Antes cambiaba los `_` por espacios y un hub español leía «30 conversations per
    // month» en la pantalla donde se decide cuánto se paga al mes.
    expect(hubPanel).toContain("from '../lib/module-quota'");
    expect(moduleEs.billing?.quota?.conversations_per_month).toBe('conversaciones al mes');
    expect(page).toContain('Incluye 30 conversaciones al mes');
    expect(page).not.toContain('conversations per month');
  });

  it('pinta los tiers del manifest sobre la rejilla de Ionic', () => {
    // Una sola plantilla de tarjeta, recorrida sobre los tiers — el `v-for` del panel real.
    expect(hubPanel).toContain('size="12"');
    expect(hubPanel).toContain('size-md="6"');
    expect(hubPanel).toContain('size-lg="3"');
    expect(page).toContain('<ion-grid');
    expect(page).toContain('size="12"');
    expect(page).toContain('size-md="6"');
    expect(page).toContain('size-lg="3"');

    // Los tiers salen del manifest de whatsapp_inbox: si allí cambian, esta página miente.
    const tiers = manifest.billing.tiers;
    expect(tiers).toHaveLength(4);
    for (const tier of tiers) {
      expect(page).toContain(tier.name);
    }
    expect(page.match(/name: 'WhatsApp/g)).toHaveLength(4);
    expect(page).toContain('Gratis');
    expect(page).toContain('14,99 €');
    expect(page).toContain('59,99 €');
    expect(page).toContain('19,99 €');
    expect(page).toContain('/mes');

    // Las features que compone `tierFeatures()`: la cuota de cada tier y el sobrecoste del medido.
    expect(page).toContain('Incluye 30 conversaciones al mes');
    expect(page).toContain('Incluye 200 conversaciones al mes');
    expect(page).toContain('Incluye 800 conversaciones al mes');
    expect(page).toContain('Incluye 270 conversaciones al mes');
    expect(page).toContain('0,08 € por unidad extra');

    // Ninguna tarjeta anuncia prueba, y es lo correcto por partida doble: `tierFeatures()` lee
    // `tier.trial_days` mientras el manifest lo declara en la RAÍZ, y sobre todo un módulo con tier
    // gratuito NO lleva prueba (ADR-0032). Ese `trial_days: 15` de la raíz es config muerta.
    expect(tiers.every((tier) => !('trial_days' in tier))).toBe(true);
    expect(hubPanel).toContain('tier.trial_days');
    // Se mira lo que va DENTRO de las tarjetas, no el fichero entero: el comentario de arriba
    // de la página explica la regla de la prueba y nombrarla no es anunciarla.
    expect(page).not.toMatch(/features: \[[^\]]*prueba/);
  });

  it('entra en el catálogo apuntando a la ruta y la fuente reales', () => {
    const entry = (HUB_PAGES as { id: string }[]).find((p) => p.id === 'module-plan-hub');
    expect(entry).toMatchObject({
      surface: 'hub',
      route: '/m/whatsapp_inbox/__plan__',
      source: 'hub/apps/web/src/components/ModulePlanPanel.vue',
      file: 'pages/module-plan-hub.html',
      parity: 'current',
    });
  });
});

describe('showcase Hub — el shell de módulo ya no inventa su propia pestaña Plan', () => {
  const shell = readPage('module-shell-hub.html');

  it('no publica una tarjeta de plan que no existe en el producto', () => {
    for (const invented of ['Plan Profesional', 'Gestionar suscripción', 'El módulo está activo en este Hub.']) {
      expect(shell).not.toContain(invented);
    }
  });
});
