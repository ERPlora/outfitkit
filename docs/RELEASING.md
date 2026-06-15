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

Tú solo cortas la *release* (bump + tag + push); la Action publica sola.

## Prerrequisitos (una sola vez, en npmjs — columna del humano)

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

```sh
npm run release      # release-it: pregunta el bump (patch/minor/major)
```

`release-it` (config en [`.release-it.json`](../.release-it.json)):

1. corre el gate local `build` → `typecheck` → `verify:csp` (falla rápido si el `dist` no está sano),
2. sube la `version` en `package.json`,
3. commitea `chore: release vX.Y.Z`,
4. crea el tag anotado `vX.Y.Z` y hace `push` del commit + el tag.

El `push` del tag `v*` dispara
[`.github/workflows/publish.yml`](../.github/workflows/publish.yml), que repite el gate
(build/typecheck/csp), comprueba `tag == package.json.version`, **no republica** si la versión ya
existe, y hace `npm publish --access public` autenticándose por **OIDC** (sin token).

`release-it` tiene `npm.publish: false` a propósito: **no** publica desde local; deja que la Action
publique con la confianza OIDC del servidor.

## Verificar

```sh
npm view @erplora/outfitkit version     # debe mostrar la versión recién publicada
```

> Nota: el script usa `npx --yes release-it` (sin fijar versión) para no añadir dependencia ni
> tocar el lockfile. Si prefieres pinearlo: `pnpm add -D release-it` y cambia el script a
> `"release": "release-it"`.
