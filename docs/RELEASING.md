# Publicar OutfitKit (`@outfitkit/core`)

OutfitKit se distribuye como **librería npm** (igual que Ionic): los consumidores —Hub, Cloud y
los módulos— instalan una versión publicada (`@outfitkit/core@^x.y.z`), no el source local. El
*bundler* (Vite en el Hub, el vendor script en Cloud) la hornea same-origin, así que **npm es
build-time, no runtime**: no rompe la CSP estricta (`script-src 'self'`) ni el modo offline.

## Quién publica

El **publish lo hace GitHub Actions**, no tu portátil. El token de npm vive solo como secreto del
repo (`NPM_TOKEN`); nunca en local. Tú solo cortas la *release* (bump + tag + push) y la Action se
encarga del resto.

## Prerrequisitos (una sola vez)

1. **Org `outfitkit` en npmjs.** Un paquete con scope `@outfitkit/*` solo se publica si existe la
   organización `outfitkit` en npmjs (o si `outfitkit` fuese tu usuario). Créala en
   npmjs.com → *Add Organization* (plan Free).
2. **Secreto `NPM_TOKEN`** en el repo, tipo *Automation* (permiso publish sobre `@outfitkit`):
   ```sh
   # npmjs.com → perfil → Access Tokens → Generate New Token → Automation
   gh secret set NPM_TOKEN -R ERPlora/outfitkit
   ```

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
[`.github/workflows/release.yml`](../.github/workflows/release.yml), que repite el gate
(build/typecheck/csp), comprueba `tag == package.json.version`, **no republica** si la versión ya
existe, y hace `npm publish --access public` con `NPM_TOKEN`.

`release-it` tiene `npm.publish: false` a propósito: **no** publica desde local; deja que la Action
publique con el token del servidor.

## Verificar

```sh
npm view @outfitkit/core version     # debe mostrar la versión recién publicada
```

> Nota: el script usa `npx --yes release-it` (sin fijar versión) para no añadir dependencia ni
> tocar el lockfile. Si prefieres pinearlo: `pnpm add -D release-it` y cambia el script a
> `"release": "release-it"`.
