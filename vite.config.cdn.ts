import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';
import { resolve } from 'node:path';

// Build SECUNDARIO: un único bundle AUTOCONTENIDO para CDN (`dist/outfitkit.bundle.js`).
//
// El build principal (vite.config.ts) mantiene `lit` EXTERNAL (regla dura: una sola copia de Lit
// para los consumidores con bundler — Hub, módulos). Pero un consumidor por CDN (un <script
// type="module"> en una página Django/landing) NO tiene bundler ni import-map fiable: si carga el
// `dist/outfitkit.js` externalizado vía jsDelivr `+esm`, el CDN resuelve Lit en decenas de
// peticiones y a veces en DOS versiones a la vez ("Multiple versions of Lit loaded"). Para ese
// consumidor servimos un único archivo con Lit INLINE.
//
// Es ADITIVO: no cambia ninguno de los outputs externalizados existentes; solo añade
// `dist/outfitkit.bundle.js`. Se construye con `emptyOutDir:false` para no borrar el build principal
// (el orden lo fija el script `build` de package.json: primero el principal, luego este).
// CSP-safe: esbuild minify no introduce eval/new Function (lo verifica `npm run verify:csp`).
export default defineConfig({
  // Mismo plugin que el build principal: los iconos de `base/icons.ts` se hornean desde Iconify
  // (`~icons/ion/<name>?raw`). Sin esto, Rollup no sabe resolver esos imports y el bundle CDN casca.
  plugins: [Icons({ compiler: 'raw' })],
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: false,
    minify: 'esbuild',
    lib: {
      formats: ['es'],
      entry: { 'outfitkit.bundle': resolve(__dirname, 'src/cdn.ts') },
      fileName: () => 'outfitkit.bundle.js',
    },
    rollupOptions: {
      // SIN `external`: Lit se hornea dentro del bundle (autocontenido).
      // `cdn.ts` son SOLO imports con efecto secundario (cada componente llama a `define()` al
      // cargar). El `sideEffects` del package.json marca `src/**` como SIN efectos, así que con
      // tree-shaking Rollup vacía el bundle. Lo DESACTIVAMOS para incluirlo todo (un bundle de
      // "registra todo" no debe podar nada; tamaño es secundario en este artefacto).
      treeshake: false,
      output: { inlineDynamicImports: true },
    },
  },
});
