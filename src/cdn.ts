// Entry del bundle único de CDN (`@outfitkit/core/cdn` → dist/outfitkit.js). Importar este fichero
// auto-registra TODOS los componentes ok-*. Para una página de una vez (Django/landing/showcase)
// con un solo <script type="module">. `lit` external → en CDN sirve un import-map para "lit".

// Estado declarativo (registra <ok-store>; importa el singleton store al cargar)
import './components/ok-store/ok-store.js';
import './store/store.js';
// Compuesto / datos
import './components/ok-data-table/ok-data-table.js';
import './components/ok-mail/ok-mail.js';
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
import './components/ok-scheduler/ok-scheduler.js';
import './components/ok-menubar/ok-menubar.js';
import './components/ok-carousel/ok-carousel.js';
import './components/ok-signature/ok-signature.js';
import './components/ok-qr/ok-qr.js';
import './components/ok-audio/ok-audio.js';
import './components/ok-video/ok-video.js';
import './components/ok-pdf/ok-pdf.js';
import './components/ok-receipt/ok-receipt.js';
import './components/ok-timeline/ok-timeline.js';
import './components/ok-qty-stepper/ok-qty-stepper.js';
import './components/ok-command-palette/ok-command-palette.js';
import './components/ok-color-picker/ok-color-picker.js';
// Marketing 2026 (bento · cards · scroll-reveal · prueba social)
import './components/ok-section/ok-section.js';
import './components/ok-bento/ok-bento.js';
import './components/ok-bento-item/ok-bento-item.js';
import './components/ok-reveal/ok-reveal.js';
import './components/ok-feature-card/ok-feature-card.js';
import './components/ok-pricing-card/ok-pricing-card.js';
import './components/ok-product-card/ok-product-card.js';
import './components/ok-logo-cloud/ok-logo-cloud.js';
import './components/ok-testimonial/ok-testimonial.js';
import './components/ok-cta-band/ok-cta-band.js';
import './components/ok-language-select/ok-language-select.js';
// Chrome web / marketing
import './components/ok-navbar/ok-navbar.js';
import './components/ok-footer/ok-footer.js';
import './components/ok-hero/ok-hero.js';
import './components/ok-container/ok-container.js';
import './components/ok-container-full/ok-container-full.js';
