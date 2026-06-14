import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// OutfitKit — librería de Web Components (Lit) que CONSTRUYE lo que Ionic NO tiene (tree, calendar,
// kanban, inline-feedback, kpi, data-table rica…) sobre primitivos de Ionic. Build en "library
// mode" multi-entry: un fichero ESM por componente (import individual / tree-shake) + bundle
// `outfitkit.js` (CDN, registra todo). `lit` external. Output CSP-safe (sin eval).
const emitTheme = {
  name: 'outfitkit-emit-theme',
  generateBundle() {
    // @ts-expect-error — rollup `this.emitFile` disponible en el hook.
    this.emitFile({
      type: 'asset',
      fileName: 'theme.example.css',
      source: readFileSync(resolve(__dirname, 'src/theme/theme.example.css'), 'utf8'),
    });
    // layout.css — primitivos de layout como CSS plano (container/grid/section);
    // sustituye a los antiguos <ok-container>/<ok-container-full>/<ok-section>.
    // @ts-expect-error — rollup `this.emitFile` disponible en el hook.
    this.emitFile({
      type: 'asset',
      fileName: 'layout.css',
      source: readFileSync(resolve(__dirname, 'src/styles/layout.css'), 'utf8'),
    });
  },
};

export default defineConfig({
  plugins: [emitTheme],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
    lib: {
      formats: ['es'],
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        outfitkit: resolve(__dirname, 'src/cdn.ts'),
        // Helper de registro idempotente (lo usan los módulos para registrar su propio WC).
        define: resolve(__dirname, 'src/base/define.ts'),
        // Estado (store reactivo IndexedDB) + ReactiveController de Lit.
        store: resolve(__dirname, 'src/store/store.ts'),
        'store-controller': resolve(__dirname, 'src/store/controller.ts'),
        'ok-store': resolve(__dirname, 'src/components/ok-store/ok-store.ts'),
        // Compuesto / datos
        'ok-data-table': resolve(__dirname, 'src/components/ok-data-table/ok-data-table.ts'),
        'ok-mail': resolve(__dirname, 'src/components/ok-mail/ok-mail.ts'),
        // Componentes nuevos (huecos de Ionic)
        'ok-tree': resolve(__dirname, 'src/components/ok-tree/ok-tree.ts'),
        'ok-inline-feedback': resolve(__dirname, 'src/components/ok-inline-feedback/ok-inline-feedback.ts'),
        'ok-empty-state': resolve(__dirname, 'src/components/ok-empty-state/ok-empty-state.ts'),
        'ok-kpi': resolve(__dirname, 'src/components/ok-kpi/ok-kpi.ts'),
        'ok-stat': resolve(__dirname, 'src/components/ok-stat/ok-stat.ts'),
        'ok-stepper': resolve(__dirname, 'src/components/ok-stepper/ok-stepper.ts'),
        'ok-wizard': resolve(__dirname, 'src/components/ok-wizard/ok-wizard.ts'),
        'ok-contact-form': resolve(__dirname, 'src/components/ok-contact-form/ok-contact-form.ts'),
        // Tier 1/2 (2ª oleada)
        'ok-calendar': resolve(__dirname, 'src/components/ok-calendar/ok-calendar.ts'),
        'ok-kanban': resolve(__dirname, 'src/components/ok-kanban/ok-kanban.ts'),
        'ok-app-launcher': resolve(__dirname, 'src/components/ok-app-launcher/ok-app-launcher.ts'),
        'ok-split-button': resolve(__dirname, 'src/components/ok-split-button/ok-split-button.ts'),
        'ok-combo': resolve(__dirname, 'src/components/ok-combo/ok-combo.ts'),
        'ok-tag-input': resolve(__dirname, 'src/components/ok-tag-input/ok-tag-input.ts'),
        'ok-rating': resolve(__dirname, 'src/components/ok-rating/ok-rating.ts'),
        'ok-otp': resolve(__dirname, 'src/components/ok-otp/ok-otp.ts'),
        'ok-pinpad': resolve(__dirname, 'src/components/ok-pinpad/ok-pinpad.ts'),
        'ok-currency': resolve(__dirname, 'src/components/ok-currency/ok-currency.ts'),
        'ok-phone': resolve(__dirname, 'src/components/ok-phone/ok-phone.ts'),
        'ok-dropzone': resolve(__dirname, 'src/components/ok-dropzone/ok-dropzone.ts'),
        'ok-sparkline': resolve(__dirname, 'src/components/ok-sparkline/ok-sparkline.ts'),
        'ok-chat': resolve(__dirname, 'src/components/ok-chat/ok-chat.ts'),
        'ok-scheduler': resolve(__dirname, 'src/components/ok-scheduler/ok-scheduler.ts'),
        'ok-menubar': resolve(__dirname, 'src/components/ok-menubar/ok-menubar.ts'),
        'ok-carousel': resolve(__dirname, 'src/components/ok-carousel/ok-carousel.ts'),
        'ok-signature': resolve(__dirname, 'src/components/ok-signature/ok-signature.ts'),
        'ok-qr': resolve(__dirname, 'src/components/ok-qr/ok-qr.ts'),
        'ok-audio': resolve(__dirname, 'src/components/ok-audio/ok-audio.ts'),
        'ok-video': resolve(__dirname, 'src/components/ok-video/ok-video.ts'),
        'ok-pdf': resolve(__dirname, 'src/components/ok-pdf/ok-pdf.ts'),
        'ok-receipt': resolve(__dirname, 'src/components/ok-receipt/ok-receipt.ts'),
        'ok-invoice': resolve(__dirname, 'src/components/ok-invoice/ok-invoice.ts'),
        'ok-timeline': resolve(__dirname, 'src/components/ok-timeline/ok-timeline.ts'),
        'ok-qty-stepper': resolve(__dirname, 'src/components/ok-qty-stepper/ok-qty-stepper.ts'),
        'ok-command-palette': resolve(__dirname, 'src/components/ok-command-palette/ok-command-palette.ts'),
        'ok-color-picker': resolve(__dirname, 'src/components/ok-color-picker/ok-color-picker.ts'),
        'ok-avatar': resolve(__dirname, 'src/components/ok-avatar/ok-avatar.ts'),
        'ok-status-pill': resolve(__dirname, 'src/components/ok-status-pill/ok-status-pill.ts'),
        'ok-drawer': resolve(__dirname, 'src/components/ok-drawer/ok-drawer.ts'),
        'ok-page-header': resolve(__dirname, 'src/components/ok-page-header/ok-page-header.ts'),
        // Marketing 2026 (bento · cards · scroll-reveal · prueba social)
        'ok-bento': resolve(__dirname, 'src/components/ok-bento/ok-bento.ts'),
        'ok-bento-item': resolve(__dirname, 'src/components/ok-bento-item/ok-bento-item.ts'),
        'ok-reveal': resolve(__dirname, 'src/components/ok-reveal/ok-reveal.ts'),
        'ok-feature-card': resolve(__dirname, 'src/components/ok-feature-card/ok-feature-card.ts'),
        'ok-pricing-card': resolve(__dirname, 'src/components/ok-pricing-card/ok-pricing-card.ts'),
        'ok-product-card': resolve(__dirname, 'src/components/ok-product-card/ok-product-card.ts'),
        'ok-logo-cloud': resolve(__dirname, 'src/components/ok-logo-cloud/ok-logo-cloud.ts'),
        'ok-testimonial': resolve(__dirname, 'src/components/ok-testimonial/ok-testimonial.ts'),
        'ok-cta-band': resolve(__dirname, 'src/components/ok-cta-band/ok-cta-band.ts'),
        'ok-language-select': resolve(__dirname, 'src/components/ok-language-select/ok-language-select.ts'),
        // Chrome web / marketing (Ionic no cubre la web pública)
        'ok-navbar': resolve(__dirname, 'src/components/ok-navbar/ok-navbar.ts'),
        'ok-footer': resolve(__dirname, 'src/components/ok-footer/ok-footer.ts'),
        'ok-hero': resolve(__dirname, 'src/components/ok-hero/ok-hero.ts'),
        // ── ux-legacy port (Tier 1+2) ──
        'ok-pagination': resolve(__dirname, 'src/components/ok-pagination/ok-pagination.ts'),
        'ok-skeleton': resolve(__dirname, 'src/components/ok-skeleton/ok-skeleton.ts'),
        'ok-gauge': resolve(__dirname, 'src/components/ok-gauge/ok-gauge.ts'),
        'ok-chart': resolve(__dirname, 'src/components/ok-chart/ok-chart.ts'),
        'ok-donut': resolve(__dirname, 'src/components/ok-donut/ok-donut.ts'),
        'ok-heatmap': resolve(__dirname, 'src/components/ok-heatmap/ok-heatmap.ts'),
        'ok-funnel': resolve(__dirname, 'src/components/ok-funnel/ok-funnel.ts'),
        'ok-bar-list': resolve(__dirname, 'src/components/ok-bar-list/ok-bar-list.ts'),
        'ok-detail-list': resolve(__dirname, 'src/components/ok-detail-list/ok-detail-list.ts'),
        'ok-icon-tile': resolve(__dirname, 'src/components/ok-icon-tile/ok-icon-tile.ts'),
        'ok-status-dot': resolve(__dirname, 'src/components/ok-status-dot/ok-status-dot.ts'),
        'ok-kbd': resolve(__dirname, 'src/components/ok-kbd/ok-kbd.ts'),
        'ok-menu': resolve(__dirname, 'src/components/ok-menu/ok-menu.ts'),
        'ok-hover-card': resolve(__dirname, 'src/components/ok-hover-card/ok-hover-card.ts'),
        'ok-notification-center': resolve(__dirname, 'src/components/ok-notification-center/ok-notification-center.ts'),
        'ok-coachmark': resolve(__dirname, 'src/components/ok-coachmark/ok-coachmark.ts'),
        'ok-select-card': resolve(__dirname, 'src/components/ok-select-card/ok-select-card.ts'),
        'ok-error-page': resolve(__dirname, 'src/components/ok-error-page/ok-error-page.ts'),
        'ok-date-picker': resolve(__dirname, 'src/components/ok-date-picker/ok-date-picker.ts'),
        'ok-time-picker': resolve(__dirname, 'src/components/ok-time-picker/ok-time-picker.ts'),
        'ok-range-dual': resolve(__dirname, 'src/components/ok-range-dual/ok-range-dual.ts'),
        'ok-file-item': resolve(__dirname, 'src/components/ok-file-item/ok-file-item.ts'),
        'ok-rich-text': resolve(__dirname, 'src/components/ok-rich-text/ok-rich-text.ts'),
        'ok-code': resolve(__dirname, 'src/components/ok-code/ok-code.ts'),
        'ok-json-viewer': resolve(__dirname, 'src/components/ok-json-viewer/ok-json-viewer.ts'),
        'ok-diff': resolve(__dirname, 'src/components/ok-diff/ok-diff.ts'),
        'ok-keyboard': resolve(__dirname, 'src/components/ok-keyboard/ok-keyboard.ts'),
        'ok-calculator': resolve(__dirname, 'src/components/ok-calculator/ok-calculator.ts'),
        'ok-image': resolve(__dirname, 'src/components/ok-image/ok-image.ts'),
        'ok-gallery': resolve(__dirname, 'src/components/ok-gallery/ok-gallery.ts'),
        'ok-lightbox': resolve(__dirname, 'src/components/ok-lightbox/ok-lightbox.ts'),
        'ok-cropper': resolve(__dirname, 'src/components/ok-cropper/ok-cropper.ts'),
        'ok-splitter': resolve(__dirname, 'src/components/ok-splitter/ok-splitter.ts'),
        'ok-loyalty-card': resolve(__dirname, 'src/components/ok-loyalty-card/ok-loyalty-card.ts'),
        'ok-event-card': resolve(__dirname, 'src/components/ok-event-card/ok-event-card.ts'),
        'ok-avatar-group': resolve(__dirname, 'src/components/ok-avatar-group/ok-avatar-group.ts'),
        'ok-org-chart': resolve(__dirname, 'src/components/ok-org-chart/ok-org-chart.ts'),
      },
    },
    rollupOptions: {
      external: [/^lit($|\/)/],
      output: {
        chunkFileNames: 'shared/[name].js',
        entryFileNames: '[name].js',
      },
    },
  },
});
