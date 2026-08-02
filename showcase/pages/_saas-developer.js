import { defineSaasDashboardPage } from './_saas-dashboard.js';

function developerFooter(activeTab) {
  return `
    <footer id="section-tabbar">
      <ion-segment value="${activeTab}" aria-label="Secciones de desarrollador">
        <ion-segment-button value="overview"><iconify-icon icon="lucide:layout-grid" width="20" height="20"></iconify-icon><ion-label>Resumen</ion-label></ion-segment-button>
        <ion-segment-button value="earnings"><iconify-icon icon="lucide:wallet" width="20" height="20"></iconify-icon><ion-label>Ingresos</ion-label></ion-segment-button>
        <ion-segment-button value="payouts"><iconify-icon icon="lucide:banknote" width="20" height="20"></iconify-icon><ion-label>Pagos</ion-label></ion-segment-button>
        <ion-segment-button value="modules"><iconify-icon icon="lucide:box" width="20" height="20"></iconify-icon><ion-label>Mis módulos</ion-label></ion-segment-button>
        <ion-segment-button value="blueprints"><iconify-icon icon="lucide:layers" width="20" height="20"></iconify-icon><ion-label>Blueprints</ion-label></ion-segment-button>
        <ion-segment-button value="repositories"><iconify-icon icon="lucide:git-branch" width="20" height="20"></iconify-icon><ion-label>Repositorios</ion-label></ion-segment-button>
        <ion-segment-button value="apidocs"><iconify-icon icon="lucide:book-open" width="20" height="20"></iconify-icon><ion-label>API Docs</ion-label></ion-segment-button>
      </ion-segment>
    </footer>`;
}

/** Mantiene el mismo shell y tabbar en todas las vistas del portal Developer. */
export function defineDeveloperPage({ activeTab = 'overview', title = '', body = '', setup } = {}) {
  defineSaasDashboardPage({
    active: '/dashboard/developer/',
    title,
    body,
    footer: developerFooter(activeTab),
    setup,
  });
}
