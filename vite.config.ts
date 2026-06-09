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
        'ok-timeline': resolve(__dirname, 'src/components/ok-timeline/ok-timeline.ts'),
        'ok-qty-stepper': resolve(__dirname, 'src/components/ok-qty-stepper/ok-qty-stepper.ts'),
        'ok-command-palette': resolve(__dirname, 'src/components/ok-command-palette/ok-command-palette.ts'),
        'ok-color-picker': resolve(__dirname, 'src/components/ok-color-picker/ok-color-picker.ts'),
        // Marketing 2026 (bento · cards · scroll-reveal · prueba social)
        'ok-section': resolve(__dirname, 'src/components/ok-section/ok-section.ts'),
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
        'ok-container': resolve(__dirname, 'src/components/ok-container/ok-container.ts'),
        'ok-container-full': resolve(__dirname, 'src/components/ok-container-full/ok-container-full.ts'),
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
