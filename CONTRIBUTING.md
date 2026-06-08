# Contribuir a OutfitKit

Gracias por tu interés en OutfitKit (`@outfitkit/core`). Este documento describe cómo trabajamos y
las reglas que todo cambio debe respetar. La referencia técnica detallada de la API está en
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Forma de trabajar

OutfitKit separa **diseño** de **implementación**:

- **El humano decide:** el **set** de componentes, su **API pública** (props/eventos/slots), el
  **naming** de tags y tokens, la **estructura** del paquete y la **distribución** (npm/CDN).
- **La IA implementa:** el **boilerplate** Lit, el CSS, la conversión a tokens, la documentación,
  los ejemplos y los refactors pequeños.
- **Tests:** solo si el humano los pide (por defecto no se escriben).

Si una tarea toca una decisión de diseño (set, API, naming, estructura, distribución) → **pregunta
antes de decidir**. No amplíes el inventario ni cambies una API por iniciativa propia.

## Reglas duras (no negociables)

1. **Solo Web Components en Lit**, con **Shadow DOM** en todos los componentes.
2. **Registro idempotente** vía `src/base/define.ts` (`define(tag, Class)`). **Nunca**
   `@customElement` ni `customElements.define` directo (evita "already defined" al cargarse por
   varias vías).
3. **Prefijo de tags: `ok-*`** en todos los componentes.
4. **CSP estricta** `script-src 'self'`: el output **no** puede contener `eval(` ni `new Function(`.
   Lit cumple (tagged templates + `adoptedStyleSheets`, sin eval). Verifica con `npm run verify:csp`.
5. **Theming en dos capas:**
   - Tokens globales `--ok-*` (los pone el consumidor; espejo de `--ion-*`).
   - Vars por componente estilo Ionic, **sin guion bajo** (`--background`, `--color`,
     `--border-color`, `--border-radius`, `--padding`…), declaradas en `:host` con default = cadena
     `--ok-* → --ion-* → hex`. **No** uses variables privadas `--_*`.
6. **Eventos normalizados a `ok-*`** vía `relay(host, e, 'ok-…')` (`src/base/relay.ts`),
   preservando `detail`. Mapa canónico: `ionInput`→`ok-input`, `ionChange`→`ok-change`,
   `ionBlur`→`ok-blur`, `ionFocus`→`ok-focus`. El `click` nativo **no** se re-emite (burbujea solo).
7. **Hijos tipados → prop de datos.** Para `ion-*` que leen hijos tipados (`ion-select` ⇒
   `ion-select-option`, `ion-segment` ⇒ `ion-segment-button`) **no** se usa slot: se expone una
   **prop de datos** (`options`, `items`) y el wrapper renderiza los hijos Ionic dentro de su shadow
   DOM. Es una decisión deliberada (evita el slotting de hijos tipados a través del shadow boundary).
8. **El `ion-*` interno lo registra el HOST**: OutfitKit asume que `@ionic/core` ya está cargado y
   **no** lo importa por componente.
9. **`lit` queda external** en los bundles (una sola copia compartida vía bundler o import-map).

## Cómo añadir un componente

> El set y la API son decisión del humano: **confírmalo antes** de empezar.

1. **Carpeta propia** en `src/components/ok-x/` con el componente Lit, y `define('ok-x', OkX)` al
   **final** del fichero.
2. **Entrada en `vite.config.ts`** (`build.lib.entry`) para que genere `dist/ok-x.js`.
3. **Export en `package.json`** (`exports`), p. ej. `"./ok-x": "./dist/ok-x.js"`.
4. **Re-export en `src/index.ts`** (barrel: clase + tipos) y registro en **`src/cdn.ts`** (para que
   el bundle único lo auto-registre).
5. **Ejemplo en el showcase** (`showcase/`) y **entrada en el README** (inventario de componentes).

Esqueleto de referencia y el detalle de slots-vs-props/eventos/theming en
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Build, typecheck y verificación

```sh
npm install          # o npm ci
npm run build        # vite (dist/*.js, outfitkit.js, theme.example.css) + tsc (dist/*.d.ts)
npm run typecheck    # tipos sin emitir
npm run verify:csp   # rechaza eval / new Function en dist (CSP estricta)
npm run dev          # vite build --watch / showcase en local
```

Antes de proponer un cambio asegúrate de que **`npm run build`**, **`npm run typecheck`** y
**`npm run verify:csp`** pasan en verde.

## Idioma y estilo

- Idioma de trabajo: **español** (comentarios y documentación).
- Vars CSS por componente nombradas **como Ionic** (sin `_`, kebab-case, overridables).
- Componentes pequeños y enfocados; documenta cada prop, evento y slot.

## Licencia

Al contribuir, aceptas que tu aportación se publique bajo la licencia [MIT](LICENSE).
