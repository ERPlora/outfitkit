# Contribuir a OutfitKit

Gracias por tu interés en OutfitKit (`@erplora/outfitkit`). Este documento describe cómo trabajamos y
las reglas que todo cambio debe respetar. La referencia técnica detallada de la API está en
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Forma de trabajar

**El test va primero, y quien escribe decide.** Son dos reglas, y las dos derogaron lo que este
documento decía antes:

- **TDD obligatorio.** Todo cambio de comportamiento empieza por el test que **falla**, luego el
  código mínimo que lo pone verde, luego el refactor. Aquí no hay excepción por ser una librería de
  UI: la antigua («tests solo si el humano los pide») se retiró el **2026-07-13**, cuando se cobró
  un bug real — 19 iconos rotos en el Hub durante meses porque ningún test los miraba (ADR-0122, de
  donde salen los guards de `src/base/icons.test.ts`). Excepciones legítimas: cambios puramente
  mecánicos sin comportamiento nuevo (formato, renombrados, mover ficheros, comentarios, docs,
  config, tipos). Ante la duda → test primero.
- **La división de labor humano/IA está derogada** (ADR-0163, `ERPlora/pm#43`, 2026-07-31). El set
  de componentes, la API pública, el naming de tags y tokens, la estructura del paquete y la
  distribución **se deciden aquí**, con su test delante y documentando la decisión (doc del
  componente + entrada en el decision-log de `architecture/`) en vez de pedir permiso antes.

Lo que sigue en pie es la **prudencia con la API publicada**: `ok-data-table` la consumen el Hub, el
Cloud y los módulos, así que solo se **añaden** props opcionales — nada se quita ni se renombra sin
tratarlo como el cambio de contrato que es.

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

1. **Carpeta propia** en `src/components/ok-x/` con el componente Lit, y `define('ok-x', OkX)` al
   **final** del fichero.
2. **Entrada en `vite.config.ts`** (`build.lib.entry`) para que genere `dist/ok-x.js`.
3. **Export en `package.json`** (`exports`), p. ej. `"./ok-x": "./dist/ok-x.js"`.
4. **Re-export en `src/index.ts`** (barrel: clase + tipos) y registro en **`src/cdn.ts`** (para que
   el bundle único lo auto-registre).
5. **Ejemplo en el showcase** (`showcase/`) y **entrada en el README** (inventario de componentes).
6. **Regenerar el índice**: `npm run catalog` reescribe [`docs/COMPONENT-CATALOG.md`](docs/COMPONENT-CATALOG.md)
   a partir del registro del showcase. **No se edita a mano**; si no lo regeneras, el gate sale rojo.

Esqueleto de referencia y el detalle de slots-vs-props/eventos/theming en
[`docs/CONVENTIONS.md`](docs/CONVENTIONS.md).

## Build, typecheck y verificación

```sh
npm install          # o npm ci
npm run build        # vite (dist/*.js, outfitkit.js, theme.example.css) + tsc (dist/*.d.ts)
npm run typecheck    # tipos sin emitir
npm run verify:csp   # rechaza eval / new Function en dist (CSP estricta)
npm test             # suite de LIBRERÍA (hermética): solo lee este repo
npm run test:parity  # suite de PARIDAD: showcase ↔ hub/, saas/ y modules-workspace/
npm run catalog      # regenera docs/COMPONENT-CATALOG.md del registro
npm run dev          # vite build --watch / showcase en local
```

Antes de proponer un cambio asegúrate de que **`npm run build`**, **`npm run typecheck`**,
**`npm run verify:csp`** y **`npm test`** pasan en verde. **CI corre los tests** (job `quality` para
la librería, job `parity` para las demos contra los módulos reales): no hace falta pedirlo, pero
tampoco hay sitio donde esconder uno en rojo. Detalle de las dos suites:
[`README.md` § Las dos suites de test](README.md#las-dos-suites-de-test).

## Idioma y estilo

- **El código se escribe en INGLÉS** (ADR-0199): identificadores, comentarios y doc-comments,
  nombres de test, logs y claves de error. Los **`.md`** —este incluido— **siguen en español**, y
  también los mensajes de commit, PRs e issues.
- **Los textos de UI de un componente van por `labels`**, con el **inglés como default** y el
  consumidor pasando solo las claves que traduce (ver `docs/CONVENTIONS.md` § i18n). Nada de texto
  visible hardcodeado en español dentro de un `ok-*`.
- Vars CSS por componente nombradas **como Ionic** (sin `_`, kebab-case, overridables).
- Componentes pequeños y enfocados; documenta cada prop, evento y slot.

## Licencia

Al contribuir, aceptas que tu aportación se publique bajo la licencia [MIT](LICENSE).
