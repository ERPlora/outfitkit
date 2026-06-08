# OutfitKit — convención de wrappers `ok-*`

OutfitKit es un **wrapper completo sobre Ionic**: el código de aplicación/módulo usa **solo `ok-*`**
y nunca toca `ion-*` directamente. Cada componente esconde el `ion-*` equivalente y expone una API
propia, estable y framework-agnóstica (sirve igual en Django, Lit, Vue…).

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

## Esqueleto de un wrapper

```ts
import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';
import { relay } from '../../base/relay.js';

export class OkInput extends LitElement {
  static styles = css`:host { display: block; }`;
  @property() value = '';
  @property() placeholder?: string;
  @property({ type: Boolean }) disabled = false;

  render() {
    return html`<ion-input
      .value=${this.value}
      placeholder=${this.placeholder ?? ''}
      ?disabled=${this.disabled}
      @ionInput=${(e: Event) => relay(this, e, 'ok-input')}
      @ionChange=${(e: Event) => relay(this, e, 'ok-change')}
    ></ion-input>`;
  }
}
define('ok-input', OkInput);
```

## Componentes que leen hijos tipados → API de datos

`ok-select` (`options`), `ok-segment` (`items`). El consumidor pasa un array `{ value, label }`
en lugar de componer `ion-select-option`/`ion-segment-button`.

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
