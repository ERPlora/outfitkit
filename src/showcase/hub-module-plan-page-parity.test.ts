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
interface ManifestTier {
  slug: string;
  name: string;
  price: number;
  interval?: 'month' | 'year' | 'one_time';
  quota?: Record<string, number>;
  metered?: boolean;
  overage_price?: number;
  trial_days?: number;
}
const manifest = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/whatsapp_inbox/module.json', import.meta.url),
    'utf8',
  ),
) as { billing: { trial_days?: number; tiers: ManifestTier[] } };
const moduleEs = JSON.parse(
  readFileSync(
    new URL('../../../modules-workspace/modules/whatsapp_inbox/locales/es.json', import.meta.url),
    'utf8',
  ),
) as { billing?: { quota?: Record<string, string> } };

/*
 * Lo que sigue se DERIVA del manifest, no se escribe a mano.
 *
 * outfitkit#134: la demo llevaba los tiers copiados literalmente («WhatsApp Starter», «14,99 €»,
 * «200 conversaciones al mes») y el módulo se movió debajo. De las cinco cosas que dejaron de ser
 * ciertas, las comprobaciones solo cazaron dos: las otras tres —los PRECIOS, los importes de la
 * cuota y el sobrecoste del tier medido— pasaban porque la aserción comparaba la página consigo
 * misma, no con el módulo. Un literal en los dos lados no es paridad: es una copia.
 */

/** Módulo y campo que se han movido, dicho en el propio fallo (outfitkit#134). */
const moved = (field: string): string =>
  `modules-workspace/modules/whatsapp_inbox/${field} se movió y la demo del showcase ` +
  '(showcase/pages/module-plan-hub.html) sigue enseñando lo anterior';

const tiers = manifest.billing.tiers;
const freeTier = tiers.find((tier) => !tier.price);

/** El NBSP que mete `Intl` entre importe y símbolo no es una diferencia de contenido. */
const flat = (text: string): string => text.replace(/\u00a0/g, ' ');
const page = flat(readPage('module-plan-hub.html'));

/** La métrica de cuota que declaran los tiers. Una sola: es el `usage.metric` que factura el proxy. */
const quotaMetrics = [...new Set(tiers.flatMap((tier) => Object.keys(tier.quota ?? {})))];

/** `priceLabel()` del panel: «Gratis» si no cuesta, y si cuesta, el importe en euros. */
const EUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const priceLabel = (tier: ManifestTier): string => (!tier.price ? 'Gratis' : flat(EUR.format(tier.price)));

/** `periodLabel()` del panel: el gratuito y el pago único no repiten, así que no llevan periodo. */
const periodLabel = (tier: ManifestTier): string => {
  if (!tier.price || tier.interval === 'one_time') return '';
  return tier.interval === 'year' ? '/año' : '/mes';
};

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

  /* Estos dos nacieron como DELTAS: afirmaban que el Hub aún NO lo hacía y que la demo iba por
   * delante (outfitkit#131). Se cumplió su condición de salida —hub#1652 llegó a `main` con el tag
   * v1.1.21— así que hoy afirman lo mismo de los dos lados, que es su forma definitiva. La página
   * ya entraba en el catálogo como `parity: 'current'` (`showcase/product-pages-data.js`). */
  it('el estado por defecto es el tier gratuito, no «Sin plan»', () => {
    // Sin compra, /module-subscription/ contesta `none`, que es como entra casi todo el mundo. El
    // panel lo remapea sobre el tier gratuito (`displayStatus`) en vez de pintar «Sin plan» en la
    // única pantalla que existe para explicarte tu plan.
    expect(hubPanel, moved('el panel del Hub ya no remapea el estado')).toContain('displayStatus');
    expect(hubPanel).toMatch(/\(s === 'none' \|\| s === 'trialing'\) && onFreeTier/);
    expect(hubPanel).not.toContain('t(`modulePlan.status.${s}`)');
    expect(freeTier, moved('module.json → billing.tiers[] sin tier gratuito')).toBeDefined();
    expect(page, moved(`module.json → billing.tiers[${freeTier?.slug}].name`)).toContain(
      `Estás en ${freeTier?.name}`,
    );
  });

  it('la tarjeta del plan que tienes va marcada', () => {
    // `ok-pricing-card` ya traía `featured` + `badge`; desde saas#1921 el Cloud manda el slug del
    // tier contratado, así que el panel marca ESA tarjeta. Con cuatro precios delante, un «Activo»
    // suelto no dice cuál es el tuyo — es lo que hacen Shopify, Odoo y Square.
    expect(hubPanel).toContain('featured');
    expect(hubPanel).toContain('isCurrentTier(tier)');
    expect(hubPanel).toContain(":badge=");
    expect(page).toContain('featured');
    expect(page).toContain('Tu plan');
  });

  it('la cuota se lee en español, y la palabra la pone el MÓDULO', () => {
    // hub#1604: el shell no guarda un diccionario de métricas de todos los módulos del mundo — la
    // etiqueta sale del `locales/<lang>.json` del propio módulo, con el inglés canónico de fallback
    // (ADR-0055). Antes cambiaba los `_` por espacios y un hub español leía «30 conversations per
    // month» en la pantalla donde se decide cuánto se paga al mes.
    expect(hubPanel).toContain("from '../lib/module-quota'");

    // La métrica sale del manifest. Cuando el módulo la renombró (`conversations_per_month` →
    // `billable_messages_per_month`, porque pasó a cobrar por MENSAJE) esta línea era un
    // `expected undefined to be 'conversaciones al mes'` que no decía de quién era la culpa.
    expect(quotaMetrics, moved('module.json → billing.tiers[].quota')).toHaveLength(1);
    const [metric] = quotaMetrics;
    const unit = moduleEs.billing?.quota?.[metric];
    expect(unit, moved(`locales/es.json → billing.quota.${metric}`)).toBeTypeOf('string');

    // Y el IMPORTE de cada tier, no solo la unidad: es el número que decide cuánto se paga al mes.
    for (const tier of tiers) {
      expect(page, moved(`module.json → billing.tiers[${tier.slug}].quota.${metric}`)).toContain(
        `Incluye ${tier.quota?.[metric]} ${unit}`,
      );
    }
    // El inglés canónico del que sale la etiqueta cuando el módulo no traduce: si asoma en la
    // demo, es que la demo dejó de leer el `locales/es.json` del módulo.
    expect(page).not.toContain(metric.replace(/_/g, ' '));
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

    // Los tiers salen del manifest de whatsapp_inbox: si allí cambian, esta página miente. Nada
    // de esto se escribe a mano — el nombre, el importe y el periodo se COMPONEN como los compone
    // el panel (`priceLabel()`, `periodLabel()`), que es lo único que hace de esto una paridad.
    expect(tiers, moved('module.json → billing.tiers[]')).toHaveLength(4);

    // Las tres se leen JUNTAS, por tarjeta. Comprobarlas por separado con `toContain` no vale
    // aquí: los cuatro tiers valen `0`, así que los cuatro pintan `price: 'Gratis'` y `period: ''`
    // — un `toContain` de esos literales lo cumple CUALQUIER otra tarjeta, y la demo podría volver
    // a anunciar «19,99 €/mes» en un tier sin que nada se enterase. Medido con un mutante el
    // 10/09: cambiar el precio de un solo tier dejaba la paridad en verde (outfitkit#134).
    const painted = [...page.matchAll(/\{\s*name: '([^']*)',\s*price: '([^']*)',\s*period: '([^']*)'/g)]
      .map(([, name, price, period]) => ({ name, price, period }));

    // Ni una tarjeta de más ni de menos, y en el orden del manifest: el panel las recorre con un
    // `v-for` sobre `billing.tiers[]`, así que reordenarlas también es enseñar otra pantalla.
    expect(painted.map((card) => card.name), moved('module.json → billing.tiers[].name')).toEqual(
      tiers.map((tier) => tier.name),
    );

    for (const tier of tiers) {
      const card = painted.find((entry) => entry.name === tier.name);
      expect(card, moved(`module.json → billing.tiers[${tier.slug}].name`)).toBeDefined();
      expect(card?.price, moved(`module.json → billing.tiers[${tier.slug}].price`)).toBe(priceLabel(tier));
      expect(card?.period, moved(`module.json → billing.tiers[${tier.slug}].interval`)).toBe(periodLabel(tier));
    }

    // El sobrecoste del medido, la otra línea que compone `tierFeatures()`. Hoy ningún tier de
    // WhatsApp Inbox es medido, así que la demo tampoco puede anunciarlo.
    const metered = tiers.filter((tier) => tier.metered && tier.overage_price != null);
    for (const tier of metered) {
      expect(page, moved(`module.json → billing.tiers[${tier.slug}].overage_price`)).toContain(
        `${priceLabel({ ...tier, price: tier.overage_price as number })} por unidad extra`,
      );
    }
    if (!metered.length) expect(page, moved('module.json → billing.tiers[].metered')).not.toContain('por unidad extra');

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
