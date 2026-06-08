// Entry del bundle único de CDN (`@outfitkit/core/cdn` → dist/outfitkit.js). Importar este fichero
// auto-registra TODOS los componentes ok-*. Para una página de una vez (Django/landing/showcase)
// con un solo <script type="module">. `lit` external → en CDN sirve un import-map para "lit".

// Estado declarativo (registra <ok-store>; importa el singleton store al cargar)
import './components/ok-store/ok-store.js';
import './store/store.js';
// Compuesto / datos
import './components/ok-data-table/ok-data-table.js';
// Componentes nuevos (huecos de Ionic)
import './components/ok-tree/ok-tree.js';
import './components/ok-inline-feedback/ok-inline-feedback.js';
import './components/ok-empty-state/ok-empty-state.js';
import './components/ok-kpi/ok-kpi.js';
import './components/ok-stat/ok-stat.js';
import './components/ok-stepper/ok-stepper.js';
import './components/ok-wizard/ok-wizard.js';
import './components/ok-contact-form/ok-contact-form.js';
// Tier 1/2 (2ª oleada)
import './components/ok-calendar/ok-calendar.js';
import './components/ok-kanban/ok-kanban.js';
import './components/ok-app-launcher/ok-app-launcher.js';
import './components/ok-split-button/ok-split-button.js';
import './components/ok-combo/ok-combo.js';
import './components/ok-tag-input/ok-tag-input.js';
import './components/ok-rating/ok-rating.js';
import './components/ok-otp/ok-otp.js';
import './components/ok-pinpad/ok-pinpad.js';
import './components/ok-currency/ok-currency.js';
import './components/ok-phone/ok-phone.js';
import './components/ok-dropzone/ok-dropzone.js';
import './components/ok-sparkline/ok-sparkline.js';
import './components/ok-chat/ok-chat.js';
// Chrome web / marketing
import './components/ok-navbar/ok-navbar.js';
import './components/ok-footer/ok-footer.js';
import './components/ok-hero/ok-hero.js';
import './components/ok-container/ok-container.js';
import './components/ok-container-full/ok-container-full.js';
