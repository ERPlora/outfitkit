// Entry del bundle único de CDN (`@outfitkit/core/cdn` → dist/outfitkit.js). Importar este
// fichero auto-registra TODOS los componentes ok-*. Pensado para cargarlo de una vez en una
// página (Django/landing/showcase) con un solo <script type="module">.
// `lit` queda external → en CDN sirve un import-map que apunte "lit" a su CDN.

// Compuestos / dashboard
import './components/ok-data-table/ok-data-table.js';
// Shell / layout (wrappers finos sobre Ionic nativo)
import './components/ok-split-pane/ok-split-pane.js';
import './components/ok-menu/ok-menu.js';
import './components/ok-app-shell/ok-app-shell.js';
import './components/ok-sidebar/ok-sidebar.js';
import './components/ok-topbar/ok-topbar.js';
import './components/ok-page/ok-page.js';
import './components/ok-content/ok-content.js';
import './components/ok-segment/ok-segment.js';
import './components/ok-tabbar/ok-tabbar.js';
// Overlays (wrappers finos sobre Ionic nativo)
import './components/ok-modal/ok-modal.js';
import './components/ok-alert/ok-alert.js';
import './components/ok-toast/ok-toast.js';
import './components/ok-action-sheet/ok-action-sheet.js';
// Primitivos (wrap de Ionic)
import './components/ok-button/ok-button.js';
import './components/ok-icon/ok-icon.js';
import './components/ok-input/ok-input.js';
import './components/ok-select/ok-select.js';
import './components/ok-searchbar/ok-searchbar.js';
import './components/ok-badge/ok-badge.js';
import './components/ok-card/ok-card.js';
import './components/ok-item/ok-item.js';
import './components/ok-spinner/ok-spinner.js';
import './components/ok-toggle/ok-toggle.js';
import './components/ok-checkbox/ok-checkbox.js';
import './components/ok-chip/ok-chip.js';
// Estado declarativo (registra <ok-store>; el módulo store no es un elemento pero importarlo
// asegura que el singleton `store` exista al cargar el bundle).
import './components/ok-store/ok-store.js';
import './store/store.js';
// Landing chrome
import './components/ok-navbar/ok-navbar.js';
import './components/ok-footer/ok-footer.js';
import './components/ok-container/ok-container.js';
import './components/ok-container-full/ok-container-full.js';
import './components/ok-hero/ok-hero.js';
