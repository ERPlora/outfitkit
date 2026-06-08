// @outfitkit/core — barrel. Importar este módulo registra TODOS los componentes ok-* y re-exporta
// sus clases y tipos. Para tree-shake real, importa el componente concreto:
//   import '@outfitkit/core/ok-tree';

// ── Estado (store reactivo + IndexedDB) ───────────────────────────────────────────────────
export { createStore, store } from './store/store.js';
export type { Store, StoreOptions, StoreSubscriber } from './store/store.js';
export { StoreController } from './store/controller.js';
export { OkStore } from './components/ok-store/ok-store.js';

// ── Compuesto / datos ─────────────────────────────────────────────────────────────────────
export { OkDataTable } from './components/ok-data-table/ok-data-table.js';
export type {
  DataTableColumn,
  DataTableAction,
  DataTableView,
  DataTablePrimaryAction,
  DataTableRowKey,
} from './components/ok-data-table/ok-data-table.js';

// ── Componentes nuevos (huecos de Ionic) ────────────────────────────────────────────────────
export { OkTree } from './components/ok-tree/ok-tree.js';
export type { OkTreeNode } from './components/ok-tree/ok-tree.js';
export { OkInlineFeedback } from './components/ok-inline-feedback/ok-inline-feedback.js';
export type { OkInlineFeedbackTone } from './components/ok-inline-feedback/ok-inline-feedback.js';
export { OkEmptyState } from './components/ok-empty-state/ok-empty-state.js';
export { OkKpi } from './components/ok-kpi/ok-kpi.js';
export { OkStat } from './components/ok-stat/ok-stat.js';
export { OkStepper } from './components/ok-stepper/ok-stepper.js';
export type { OkStep } from './components/ok-stepper/ok-stepper.js';
export { OkWizard } from './components/ok-wizard/ok-wizard.js';
export { OkContactForm } from './components/ok-contact-form/ok-contact-form.js';

// ── Chrome web / marketing ──────────────────────────────────────────────────────────────────
export { OkNavbar } from './components/ok-navbar/ok-navbar.js';
export { OkFooter } from './components/ok-footer/ok-footer.js';
export { OkHero } from './components/ok-hero/ok-hero.js';
export { OkContainer } from './components/ok-container/ok-container.js';
export { OkContainerFull } from './components/ok-container-full/ok-container-full.js';
