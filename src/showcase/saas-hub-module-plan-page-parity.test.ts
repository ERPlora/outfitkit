// @suite parity — compara esta demo del showcase contra el código REAL de otro repo del
// monorepo (`hub/`, `saas/` o `modules-workspace/`). No corre en el gate hermético: va en el
// job `parity`, que clona antes lo que compara (outfitkit#66).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// @ts-expect-error — módulo JS del showcase, sin declaraciones TypeScript.
import { SAAS_PAGES } from '../../showcase/product-pages-data.js';

const page = readFileSync(
  new URL('../../showcase/pages/hubs-module-plan.html', import.meta.url),
  'utf8',
);
const saasPartial = readFileSync(
  new URL(
    '../../../saas/apps/dashboard/marketplace/templates/dashboard/marketplace/partials/module_detail_content.html',
    import.meta.url,
  ),
  'utf8',
);
const saasView = readFileSync(
  new URL('../../../saas/apps/dashboard/hubs/main/views.py', import.meta.url),
  'utf8',
);

/* El plan de UN módulo para ESTE hub, en el área de CUENTA — `/dashboard/hubs/<hub_id>/modules/<slug>/plan/`.
 *
 * Es el destino al que el Hub SÍ puede enlazar (hub#1608 → saas#1901): su guardia anti-steering le
 * prohíbe nombrar el marketplace (hub#479), y el precedente permitido es la cuenta del cliente, con
 * el hub en la ruta para que no haya duda de qué plan se toca. Comparte vista y plantilla con la
 * ficha del marketplace (`module_plan_context`), y la diferencia es QUIÉN elige el hub: aquí lo
 * impone la URL.
 *
 * Aquí es donde ocurre la VENTA, ligada a un hub — el Hub solo mira.
 */
describe('showcase SaaS — plan de un módulo en la cuenta del cliente', () => {
  it('cuelga del hub, no del marketplace, y vuelve a los módulos del hub', () => {
    expect(saasView).toContain('def hub_module_plan');
    expect(saasView).toContain('ctx["current_section"] = "hubs"');
    expect(page).toContain("import { defineSaasDashboardPage } from './_saas-dashboard.js'");
    expect(page).toContain('/dashboard/hubs/<hub_id>/modules/<slug>/plan/');
  });

  it('el hub lo impone la RUTA: aquí no se elige hub', () => {
    // El selector de la ficha del marketplace navega con `hx-get` a esa misma ficha. En la página de
    // cuenta no pinta nada: el hub viene en la URL, y ofrecerlo aquí devuelve al cliente justo a la
    // superficie que el Hub tiene prohibido nombrar.
    expect(saasPartial).toContain("hx-get=\"{% url 'marketplace_dash:module_detail' module.slug %}\"");
    expect(page).not.toContain('form-hub-select');
    expect(page).not.toContain('marketplace');
    expect(page).toContain('Main Hub');
  });

  it('pinta los planes con ok-pricing-card, no con una rejilla de Tailwind calculada', () => {
    // La plantilla real compone la clase en tiempo de render (`md:grid-cols-{{ module_tiers|length }}`),
    // y Tailwind solo genera las clases que encuentra ESCRITAS: con 5 tiers no existe la clase y los
    // planes se apilan. La rejilla del showcase es la de Ionic, que no depende del escaneo.
    expect(saasPartial).toContain('md:grid-cols-{{ module_tiers|length }}');
    expect(page).not.toContain('grid-cols');
    expect(page).toContain('<ion-grid');
    expect(page).toContain('<ok-pricing-card');
    expect(page.match(/name: 'WhatsApp/g)).toHaveLength(4);
  });

  it('marca el plan contratado, que aquí el SaaS sí sabe cuál es', () => {
    expect(saasPartial).toContain('purchase.module_tier_id == tier.id');
    expect(page).toContain('featured');
    expect(page).toContain('Tu plan');
  });

  it('conserva las acciones reales de la página y ninguna inventada', () => {
    for (const action of ['Suscribirse', 'Reasignar suscripción', 'Cancelar suscripción']) {
      expect(page).toContain(action);
    }
    // El checkout NO sale de la página: Embedded Checkout de Stripe dentro de un ion-modal.
    expect(saasPartial).toContain('<ion-modal id="marketplace-checkout-modal"');
    expect(page).toContain('<ion-modal id="checkout-modal"');
    expect(page).toContain('Solo el propietario o un administrador del hub pueden contratar');
    expect(page).toContain('El módulo sigue activo hasta el final del periodo de facturación.');
  });

  it('entra en el catálogo apuntando a la ruta y la fuente reales', () => {
    const entry = (SAAS_PAGES as { id: string }[]).find((p) => p.id === 'hubs-module-plan');
    expect(entry).toMatchObject({
      surface: 'saas',
      route: '/dashboard/hubs/<hub_id>/modules/<slug>/plan/',
      file: 'pages/hubs-module-plan.html',
    });
  });
});
