/// <reference types="vite/client" />

// `vite/client` declara los imports con sufijo `?raw` como `string`. Es lo que hace typable
// `import trashOutline from '~icons/ion/trash-outline?raw'` (los SVG de Iconify que unplugin-icons
// hornea en build, ver base/icons.ts y el plugin Icons({compiler:'raw'}) de vite.config.ts).
