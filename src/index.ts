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
export { OkCalendar } from './components/ok-calendar/ok-calendar.js';
export type { OkCalendarEvent, OkCalendarView } from './components/ok-calendar/ok-calendar.js';
export { OkKanban } from './components/ok-kanban/ok-kanban.js';
export type { OkKanbanColumn, OkKanbanCard } from './components/ok-kanban/ok-kanban.js';
export { OkAppLauncher } from './components/ok-app-launcher/ok-app-launcher.js';
export type { OkLauncherApp } from './components/ok-app-launcher/ok-app-launcher.js';
export { OkSplitButton } from './components/ok-split-button/ok-split-button.js';
export type { OkSplitButtonItem } from './components/ok-split-button/ok-split-button.js';
export { OkCombo } from './components/ok-combo/ok-combo.js';
export type { OkComboOption } from './components/ok-combo/ok-combo.js';
export { OkTagInput } from './components/ok-tag-input/ok-tag-input.js';
export { OkRating } from './components/ok-rating/ok-rating.js';
export { OkOtp } from './components/ok-otp/ok-otp.js';
export { OkPinpad } from './components/ok-pinpad/ok-pinpad.js';
export { OkCurrency } from './components/ok-currency/ok-currency.js';
export { OkPhone } from './components/ok-phone/ok-phone.js';
export type { OkPhoneCountry } from './components/ok-phone/ok-phone.js';
export { OkDropzone } from './components/ok-dropzone/ok-dropzone.js';
export { OkSparkline } from './components/ok-sparkline/ok-sparkline.js';
export { OkChat } from './components/ok-chat/ok-chat.js';
export type { OkChatMessage } from './components/ok-chat/ok-chat.js';
export { OkScheduler } from './components/ok-scheduler/ok-scheduler.js';
export type { OkSchedulerResource, OkSchedulerEvent } from './components/ok-scheduler/ok-scheduler.js';
export { OkMenubar } from './components/ok-menubar/ok-menubar.js';
export type { OkMenu, OkMenuItem } from './components/ok-menubar/ok-menubar.js';
export { OkCarousel } from './components/ok-carousel/ok-carousel.js';
export { OkSignature } from './components/ok-signature/ok-signature.js';
export { OkQr } from './components/ok-qr/ok-qr.js';
export { OkAudio } from './components/ok-audio/ok-audio.js';
export { OkVideo } from './components/ok-video/ok-video.js';
export { OkPdf } from './components/ok-pdf/ok-pdf.js';

// ── Chrome web / marketing ──────────────────────────────────────────────────────────────────
export { OkNavbar } from './components/ok-navbar/ok-navbar.js';
export { OkFooter } from './components/ok-footer/ok-footer.js';
export { OkHero } from './components/ok-hero/ok-hero.js';
export { OkContainer } from './components/ok-container/ok-container.js';
export { OkContainerFull } from './components/ok-container-full/ok-container-full.js';
