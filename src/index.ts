// @outfitkit/core — barrel. Importar este módulo registra TODOS los componentes ok-* y
// re-exporta sus clases y tipos. Para tree-shake real, importa el componente concreto:
//   import '@outfitkit/core/ok-button';

// ── Estado (store reactivo + IndexedDB) ───────────────────────────────────────────────────
export { createStore, store } from './store/store.js';
export type { Store, StoreOptions, StoreSubscriber } from './store/store.js';
export { StoreController } from './store/controller.js';
export { OkStore } from './components/ok-store/ok-store.js';

// ── Compuestos / dashboard ──────────────────────────────────────────────────────────────
export { OkDataTable } from './components/ok-data-table/ok-data-table.js';
export type {
  DataTableColumn,
  DataTableAction,
  DataTableView,
} from './components/ok-data-table/ok-data-table.js';

// ── Shell / layout ──────────────────────────────────────────────────────────────────────
export { OkAppShell } from './components/ok-app-shell/ok-app-shell.js';
export { OkSidebar } from './components/ok-sidebar/ok-sidebar.js';
export type {
  OkNavItem,
  OkNavSection,
  OkSidebarUser,
} from './components/ok-sidebar/ok-sidebar.js';
export { OkTopbar } from './components/ok-topbar/ok-topbar.js';
export type { OkHeaderAction } from './components/ok-topbar/ok-topbar.js';
export { OkPage } from './components/ok-page/ok-page.js';
export { OkSegment } from './components/ok-segment/ok-segment.js';
export type { OkSegmentItem } from './components/ok-segment/ok-segment.js';

// ── Primitivos (wrap de Ionic) ──────────────────────────────────────────────────────────
export { OkButton } from './components/ok-button/ok-button.js';
export { OkIcon } from './components/ok-icon/ok-icon.js';
export { OkInput } from './components/ok-input/ok-input.js';
export { OkSelect } from './components/ok-select/ok-select.js';
export type { OkSelectOption } from './components/ok-select/ok-select.js';
export { OkSearchbar } from './components/ok-searchbar/ok-searchbar.js';
export { OkBadge } from './components/ok-badge/ok-badge.js';
export {
  OkCard,
  OkCardHeader,
  OkCardTitle,
  OkCardSubtitle,
  OkCardContent,
} from './components/ok-card/ok-card.js';
export { OkList, OkItem, OkLabel } from './components/ok-item/ok-item.js';
export { OkSpinner } from './components/ok-spinner/ok-spinner.js';
export { OkToggle } from './components/ok-toggle/ok-toggle.js';
export { OkCheckbox } from './components/ok-checkbox/ok-checkbox.js';
export { OkChip } from './components/ok-chip/ok-chip.js';

// ── Landing chrome ──────────────────────────────────────────────────────────────────────
export { OkNavbar } from './components/ok-navbar/ok-navbar.js';
export { OkFooter } from './components/ok-footer/ok-footer.js';
export { OkContainer } from './components/ok-container/ok-container.js';
export { OkContainerFull } from './components/ok-container-full/ok-container-full.js';
export { OkHero } from './components/ok-hero/ok-hero.js';
