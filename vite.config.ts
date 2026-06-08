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
        // Componentes nuevos (huecos de Ionic)
        'ok-tree': resolve(__dirname, 'src/components/ok-tree/ok-tree.ts'),
        'ok-inline-feedback': resolve(__dirname, 'src/components/ok-inline-feedback/ok-inline-feedback.ts'),
        'ok-empty-state': resolve(__dirname, 'src/components/ok-empty-state/ok-empty-state.ts'),
        'ok-kpi': resolve(__dirname, 'src/components/ok-kpi/ok-kpi.ts'),
        'ok-stat': resolve(__dirname, 'src/components/ok-stat/ok-stat.ts'),
        'ok-stepper': resolve(__dirname, 'src/components/ok-stepper/ok-stepper.ts'),
        'ok-wizard': resolve(__dirname, 'src/components/ok-wizard/ok-wizard.ts'),
        'ok-contact-form': resolve(__dirname, 'src/components/ok-contact-form/ok-contact-form.ts'),
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
