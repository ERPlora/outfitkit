# OutfitKit — convenciones de componente `ok-*`

OutfitKit **construye lo que Ionic no tiene**, por dentro sobre primitivos `ion-*` nativos que
registra el host (ver README.md). **No** es un wrapper 1:1 de Ionic: el código de aplicación/módulo
usa `ion-*` **directo** para botones, inputs, listas, modales, toolbars, layout/tabs — OutfitKit no
los envuelve. Esto sustituye el enfoque anterior de "wrapper completo" (`ok-button`/`ok-input`/…),
que se retiró por redundante. Las reglas de abajo aplican a los componentes `ok-*` reales (huecos y
chrome web/marketing), incluidos los que por dentro usan uno o varios `ion-*` con eventos.

## Reglas

1. **Lit + Shadow DOM + `define()` idempotente.** Nunca `customElements.define` directo. El `ion-*`
   interno se registra por el **host** (Cloud/Hub cargan `@ionic/core` una vez); el wrapper asume
   que ya existe (igual que `ok-data-table`).
2. **Prefijo `ok-*`** en todos los tags.
3. **Props en kebab-case** que mapean a las del `ion-*` interno. Documenta cada una.
4. **Eventos normalizados a `ok-*`.** El wrapper escucha el evento Ionic y lo re-emite vía
   `relay(this, e, 'ok-…')` (`src/base/relay.ts`), preservando `detail`. Mapa canónico:
   - `ionInput`  → `ok-input`   (detail `{ value }`)
   - `ionChange` → `ok-change`  (detail `{ value }`)
   - `ionBlur`   → `ok-blur`
   - `ionFocus`  → `ok-focus`
   - el `click` nativo **no** se re-emite (ya burbujea).
5. **Contenido por `<slot>`** (default y nombrados). Para componentes de Ionic que leen **hijos
   tipados** (p. ej. `ion-select` ⇒ `ion-select-option`, `ion-segment` ⇒ `ion-segment-button`) NO
   se usa slot: se expone una prop de **datos** (`options`, `items`) y el wrapper renderiza los
   hijos Ionic dentro de su shadow DOM. Es una decisión deliberada (evita el problema de slotting
   de hijos tipados a través del shadow boundary) y da una API declarativa.
6. **Theming en dos capas** (igual que el resto de OutfitKit):
   - Tokens globales `--ok-*` (los pone el consumidor; espejo de `--ion-*`).
   - Vars por componente en `:host`, estilo Ionic, con default = cadena `--ok-* → --ion-* → hex`.
   El `ion-*` interno hereda el tema `--ion-*` del host, así que claro/oscuro funcionan solos.
7. **CSP estricta**: sin `eval`/`new Function`. Verifica con `pnpm verify:csp`.

## Esqueleto de un componente (hueco que Ionic no cubre)

Ejemplo real simplificado (`ok-qty-stepper`): usa `ion-button`/`ion-icon` nativos por dentro y
expone su propio evento `ok-*`.

```ts
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

export class OkQtyStepper extends LitElement {
  static styles = css`:host { display: inline-flex; }`;
  @property({ type: Number }) value = 0;
  @property({ type: Number }) min = 0;
  @property({ type: Number }) max?: number;

  #set(next: number) {
    const clamped = Math.max(this.min, this.max != null ? Math.min(this.max, next) : next);
    this.value = clamped;
    this.dispatchEvent(new CustomEvent('ok-change', { detail: { value: clamped }, bubbles: true, composed: true }));
  }

  render() {
    return html`<ion-button @click=${() => this.#set(this.value - 1)}>−</ion-button>
      <span>${this.value}</span>
      <ion-button @click=${() => this.#set(this.value + 1)}>+</ion-button>`;
  }
}
define('ok-qty-stepper', OkQtyStepper);
```

Cuando el `ion-*` interno emite sus propios eventos (`ionInput`/`ionChange`…) y quieres
normalizarlos, usa `relay(this, e, 'ok-…')` (`src/base/relay.ts`) en vez de reenviarlos a mano.

## Componentes que leen hijos tipados → API de datos

`ok-phone` (prop `countries`, renderiza `ion-select-option` por dentro). El consumidor pasa un
array `{ iso, name, dial }` en lugar de componer los `ion-select-option`/`ion-segment-button`
él mismo.

## Estado: store reactivo (IndexedDB)

El CORE incluye un **store** (`src/store/`) reutilizable, con CERO dependencias y CSP-safe:

- `src/store/idb.ts` — adaptador IndexedDB mínimo (promesas). Si no hay `indexedDB`, degrada a NO-OP
  (memoria-solo); los errores se tragan y nunca se lanzan al consumidor.
- `src/store/store.ts` — `createStore()` + singleton `store`. Caché en memoria como fuente síncrona;
  IndexedDB solo persiste (fire-and-forget, `flush()` para esperar). API: `get/set/update/delete/
  remove/clear/has/keys/entries/subscribe/ready/flush`.
- `src/store/controller.ts` — `StoreController` (`ReactiveController` de Lit): suscribe en
  `hostConnected`, `requestUpdate()` en cada cambio, desuscribe en `hostDisconnected`.
- `src/components/ok-store/ok-store.ts` — elemento declarativo `<ok-store name>` para Django (sin
  JS de wiring): emite `ok-store-change`/`ok-store-ready`, expone `.store` y proxies
  `get/set/updateValue/delete`. **Ojo**: el proxy se llama `updateValue` (no `update`) porque
  `update` es un método reservado del ciclo de vida de LitElement.

Wiring de un módulo del store nuevo: entry en `vite.config.ts`, export en `package.json`
(`exports`) + `src/index.ts`; los entries de elemento (`<ok-store>`) además en `src/cdn.ts`. Los
módulos `store`/`store-controller` NO son elementos: no se registran, solo se exportan.

## i18n — textos traducibles (default INGLÉS)

Todos los componentes con texto de UI propio (chrome) exponen sus cadenas para que el consumidor las
traduzca. Convención única y reutilizable:

- Los **defaults son INGLÉS** (placeholders, labels de botón, mensajes vacíos, aria-labels, títulos).
- Cada componente con texto exporta `interface OkXLabels { … }` y un `const DEFAULT_LABELS: OkXLabels`
  en inglés.
- Prop: `@property({ attribute: false }) labels: Partial<OkXLabels> = {}` — el consumidor pasa **solo
  las claves que quiere traducir**.
- Merge: `private get t(): OkXLabels { return { ...DEFAULT_LABELS, ...this.labels }; }` y en el
  template se usa `this.t.clave`.
- Variables: tokens `{n}`/`{x}` en el string (p.ej. `selected: '{n} selected'`) → `.replace('{n}', …)`.
- Formato de fecha/número (Intl): el default de `locale` es `'en-US'`; prop `locale` para override.
- El contenido **data-driven** (`.messages`/`.columns`/`.folders`/`.items`/slots) NO es i18n del
  componente: lo aporta ya traducido el consumidor.

Uso:
```js
mail.labels = { compose: 'Redactar', empty: 'Sin mensajes', search: 'Buscar…' }; // ES
table.labels = { selected: '{n} seleccionados', clear: 'Limpiar', apply: 'Aplicar' };
```
