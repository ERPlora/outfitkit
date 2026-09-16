# Publicar OutfitKit (`@erplora/outfitkit`)

OutfitKit se distribuye como **librería npm** (igual que Ionic): los consumidores —Hub, Cloud y
los módulos— instalan una versión publicada (`@erplora/outfitkit@^x.y.z`), no el source local. El
*bundler* (Vite en el Hub, el vendor script en Cloud) la hornea same-origin, así que **npm es
build-time, no runtime**: no rompe la CSP estricta (`script-src 'self'`) ni el modo offline.

## Quién publica: Trusted Publishing (OIDC), sin token

El **publish lo hace GitHub Actions** vía **Trusted Publishing con OIDC** — **no hay token ni
secret**. npm y GitHub establecen una relación de confianza; en cada publicación se genera un
token efímero, firmado y específico de este workflow, que no se puede extraer ni reutilizar. En
repo público, npm genera **provenance** automáticamente (prueba criptográfica de origen del build).

No cortas nada a mano: **la Action bumpea, taggea y publica sola** al mergear a `main` (ver abajo).

## Prerrequisitos (una sola vez, en npmjs — requiere acceso a la cuenta org `erplora` en npmjs.com)

1. **Scope `@erplora`.** El paquete `@erplora/outfitkit` se publica bajo la org npm `erplora`,
   **que ya existe** (el publicador es owner) — no hay que crear nada.
2. **Trusted Publisher** en la página del paquete: npmjs.com → Packages → `@erplora/outfitkit` →
   *Settings* → *Trusted Publisher* → GitHub Actions:
   - Organization or user: `ERPlora`
   - Repository: `outfitkit`
   - Workflow filename: `publish.yml`  *(solo el nombre, no la ruta)*
   - Environment name: *(vacío)*
   - Allowed actions: `npm publish`

   ⚠️ npm **no valida** estos datos al guardar: si org/repo/workflow no son exactos, el publish
   falla. ⚠️ El paquete debe existir para configurar su Trusted Publisher; si npm no deja
   configurarlo antes del primer publish, haz **el publish inicial manual** (el publicador es
   owner de `@erplora` y ya tiene `npm login`): `npm run build && npm publish --access public`, y
   luego activa OIDC para las siguientes releases.
3. *(Recomendado, tras validar OIDC)* En *Settings → Publishing access* del paquete marca
   **"Require two-factor authentication and disallow tokens"**: OIDC sigue funcionando aunque
   deshabilites los tokens, y cierras esa vía.

## Cortar una release

**No hay paso manual: el único acto humano es mergear el PR a `main`.**

[`.github/workflows/publish.yml`](../.github/workflows/publish.yml) se dispara con un **push a
`main`** que toque `src/**`, `vite.config*.ts` o `tsconfig*.json` — **no** con un tag. Entonces:

1. corre el gate `build` → `typecheck` → `verify:csp` (hook `before:init` de release-it),
2. ejecuta **`release-it patch --ci`**: sube la `version` en `package.json`, commitea
   `chore: release vX.Y.Z`, crea el tag anotado y los pushea,
3. hace `npm publish --access public` autenticándose por **OIDC** (sin token).

Detalles que conviene no deshacer sin leer el workflow:

- **El bump es siempre `patch` y lo decide la CI**, a partir de lo que haya en `main`. **No subas
  la versión a mano en tu rama**: provoca conflicto de merge y, resuelto mal, `main` retrocede a
  una versión ya publicada y el siguiente release muere con
  `403 cannot publish over previously published version`.
- Para un **minor/major**, o para publicar un cambio que no toca `src/**` (p. ej. solo
  dependencias), usa **`workflow_dispatch`** sobre `publish.yml`.
- `package.json` está **excluido** del filtro de `paths` a propósito: si no, el propio commit de
  bump del bot volvería a disparar el workflow en bucle. Por el mismo motivo hay un guard que
  ignora los commits que empiezan por `chore: release v`.
- `release-it` tiene `npm.publish: false` a propósito: **no** publica; deja que el paso siguiente
  publique con la confianza OIDC del servidor.

### Qué mira cada gate

Hay **dos** workflows y no miran lo mismo — conviene no confundirlos:

| Workflow | Cuándo | Qué corre |
|---|---|---|
| `ci.yml` | cada PR y cada push a `main` | job `quality`: higiene de git + `build` + `typecheck` + `verify:csp` + **`npm test`** · job `parity`: clona `hub/`, `saas/` y los módulos que la suite compara y corre **`npm run test:parity`** |
| `publish.yml` | push a `main` que toque `src/**` o la config de build | el gate de `release-it` (`before:init`: `build` + `typecheck` + `verify:csp`) y luego el publish |

O sea: **los tests los corre `ci.yml`, no el publish**. El gate del publish es deliberadamente el
corto —si el PR entró, la suite ya pasó—, así que un rojo de tests se ve **antes de mergear**, que
es donde sirve.

> Hasta `outfitkit#66` esto no era así: `ci.yml` **no llamaba a `npm test` en absoluto**. 471 tests
> escritos que CI no ejecutó nunca, y nueve ficheros meses en rojo sin que nadie se enterara — en la
> librería de la que dependen los módulos, el Hub y el Cloud. Ese es el motivo de que hoy sean dos
> jobs y de que la paridad **falle** en vez de auto-omitirse cuando le falta un checkout.

## Verificar

```sh
npm view @erplora/outfitkit version     # debe mostrar la versión recién publicada
```

> Nota: el script usa `npx --yes release-it` (sin fijar versión) para no añadir dependencia ni
> tocar el lockfile. Si prefieres pinearlo: `pnpm add -D release-it` y cambia el script a
> `"release": "release-it"`.
