import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// OutfitKit se compila en "library mode" multi-entry: un fichero ESM por componente
// (import individual / tree-shake) + un bundle `outfitkit.js` para CDN. `lit` queda
// EXTERNAL en todos los entries → una sola copia compartida (el consumidor la resuelve
// con su bundler o con un import-map en CDN/Django). Salida CSP-safe (sin eval).
//
// El theme de ejemplo (tokens --ok-*) se emite a dist/ para `@erplora/outfitkit/theme.css`.
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
        // Store de estado reactivo (IndexedDB) + su ReactiveController de Lit.
        store: resolve(__dirname, 'src/store/store.ts'),
        'store-controller': resolve(__dirname, 'src/store/controller.ts'),
        // Compuestos / dashboard
        'ok-data-table': resolve(__dirname, 'src/components/ok-data-table/ok-data-table.ts'),
        // Shell / layout (wrappers finos sobre Ionic nativo)
        'ok-split-pane': resolve(__dirname, 'src/components/ok-split-pane/ok-split-pane.ts'),
        'ok-menu': resolve(__dirname, 'src/components/ok-menu/ok-menu.ts'),
        'ok-app-shell': resolve(__dirname, 'src/components/ok-app-shell/ok-app-shell.ts'),
        'ok-sidebar': resolve(__dirname, 'src/components/ok-sidebar/ok-sidebar.ts'),
        'ok-topbar': resolve(__dirname, 'src/components/ok-topbar/ok-topbar.ts'),
        'ok-page': resolve(__dirname, 'src/components/ok-page/ok-page.ts'),
        'ok-content': resolve(__dirname, 'src/components/ok-content/ok-content.ts'),
        'ok-segment': resolve(__dirname, 'src/components/ok-segment/ok-segment.ts'),
        'ok-tabbar': resolve(__dirname, 'src/components/ok-tabbar/ok-tabbar.ts'),
        // Overlays (wrappers finos sobre Ionic nativo)
        'ok-modal': resolve(__dirname, 'src/components/ok-modal/ok-modal.ts'),
        'ok-alert': resolve(__dirname, 'src/components/ok-alert/ok-alert.ts'),
        'ok-toast': resolve(__dirname, 'src/components/ok-toast/ok-toast.ts'),
        'ok-action-sheet': resolve(__dirname, 'src/components/ok-action-sheet/ok-action-sheet.ts'),
        // Primitivos (wrap de Ionic)
        'ok-button': resolve(__dirname, 'src/components/ok-button/ok-button.ts'),
        'ok-icon': resolve(__dirname, 'src/components/ok-icon/ok-icon.ts'),
        'ok-input': resolve(__dirname, 'src/components/ok-input/ok-input.ts'),
        'ok-select': resolve(__dirname, 'src/components/ok-select/ok-select.ts'),
        'ok-searchbar': resolve(__dirname, 'src/components/ok-searchbar/ok-searchbar.ts'),
        'ok-badge': resolve(__dirname, 'src/components/ok-badge/ok-badge.ts'),
        'ok-card': resolve(__dirname, 'src/components/ok-card/ok-card.ts'),
        'ok-item': resolve(__dirname, 'src/components/ok-item/ok-item.ts'),
        'ok-spinner': resolve(__dirname, 'src/components/ok-spinner/ok-spinner.ts'),
        'ok-toggle': resolve(__dirname, 'src/components/ok-toggle/ok-toggle.ts'),
        'ok-checkbox': resolve(__dirname, 'src/components/ok-checkbox/ok-checkbox.ts'),
        'ok-chip': resolve(__dirname, 'src/components/ok-chip/ok-chip.ts'),
        // Estado declarativo (sin JS)
        'ok-store': resolve(__dirname, 'src/components/ok-store/ok-store.ts'),
        // Landing chrome
        'ok-navbar': resolve(__dirname, 'src/components/ok-navbar/ok-navbar.ts'),
        'ok-footer': resolve(__dirname, 'src/components/ok-footer/ok-footer.ts'),
        'ok-container': resolve(__dirname, 'src/components/ok-container/ok-container.ts'),
        'ok-container-full': resolve(__dirname, 'src/components/ok-container-full/ok-container-full.ts'),
        'ok-hero': resolve(__dirname, 'src/components/ok-hero/ok-hero.ts'),
      },
    },
    rollupOptions: {
      external: [/^lit($|\/)/],
      output: {
        // Mantén nombres estables para los chunks compartidos (p.ej. el base ok-element).
        chunkFileNames: 'shared/[name].js',
        entryFileNames: '[name].js',
      },
    },
  },
});
