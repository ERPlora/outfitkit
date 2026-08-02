/* Composiciones Ionic que usa ERPlora directamente.
 *
 * No son exports de OutfitKit: son recetas de referencia para no volver a crear
 * wrappers `ok-*` alrededor de capacidades que Ionic ya mantiene.
 */

export const IONIC_RECIPES = [
  {
    id: 'ionic-drawer',
    name: 'Drawer lateral · ion-modal',
    desc: 'Panel lateral del asistente y formularios contextuales. SaaS y Hub usan ion-modal anclado al borde mediante sus variables oficiales.',
    example: `<ion-button id="open-ionic-drawer">Abrir drawer</ion-button>
<ion-modal id="ionic-drawer" style="--width:420px;--height:100%;--border-radius:0;justify-content:flex-end">
  <ion-header>
    <ion-toolbar>
      <ion-title>Detalle</ion-title>
      <ion-buttons slot="end"><ion-button id="close-ionic-drawer">Cerrar</ion-button></ion-buttons>
    </ion-toolbar>
  </ion-header>
  <ion-content class="ion-padding">Contenido del panel</ion-content>
</ion-modal>`,
    setup(root) {
      const modal = root.querySelector('#ionic-drawer');
      root.querySelector('#open-ionic-drawer')?.addEventListener('click', () => modal?.present());
      root.querySelector('#close-ionic-drawer')?.addEventListener('click', () => modal?.dismiss());
    },
    code: `<ion-modal class="erplora-drawer-right" style="--width:420px">
  <ion-header><ion-toolbar><ion-title>Detalle</ion-title></ion-toolbar></ion-header>
  <ion-content class="ion-padding">…</ion-content>
</ion-modal>

/* CSS del host */
ion-modal.erplora-drawer-right {
  --height: 100%;
  --border-radius: 0;
  justify-content: flex-end;
}`,
  },
  {
    id: 'ionic-skeleton',
    name: 'Carga · ion-skeleton-text',
    desc: 'Placeholder nativo de Ionic. Las tarjetas y tablas componen varias líneas en lugar de depender de un wrapper propio.',
    example: `<ion-card style="max-width:420px">
  <ion-card-header><ion-skeleton-text animated style="width:42%;height:20px"></ion-skeleton-text></ion-card-header>
  <ion-card-content>
    <ion-skeleton-text animated style="width:100%"></ion-skeleton-text>
    <ion-skeleton-text animated style="width:82%"></ion-skeleton-text>
    <ion-skeleton-text animated style="width:64%"></ion-skeleton-text>
  </ion-card-content>
</ion-card>`,
    code: `<ion-skeleton-text animated style="width:100%"></ion-skeleton-text>
<ion-skeleton-text animated style="width:82%"></ion-skeleton-text>
<ion-skeleton-text animated style="width:64%"></ion-skeleton-text>`,
  },
  {
    id: 'ionic-date-time',
    name: 'Fecha y hora · ion-datetime',
    desc: 'Selector mantenido por Ionic para fecha, hora y rangos. Se configura con presentation, min, max, minute-values y multiple.',
    example: `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px">
  <ion-datetime presentation="date" value="2026-07-18" show-default-buttons></ion-datetime>
  <ion-datetime presentation="time" value="09:30" minute-values="0,15,30,45" show-default-buttons></ion-datetime>
</div>`,
    code: `<ion-datetime
  presentation="date"
  min="2026-01-01"
  max="2026-12-31"
  show-default-buttons>
</ion-datetime>

<ion-datetime
  presentation="time"
  minute-values="0,15,30,45"
  show-default-buttons>
</ion-datetime>`,
  },
  {
    id: 'ionic-range-dual',
    name: 'Rango doble · ion-range',
    desc: 'ion-range ya soporta dos knobs y pin de valor. El objeto {lower, upper} se asigna como propiedad.',
    example: `<div style="max-width:520px">
  <ion-range id="ionic-dual-range" label="Precio" label-placement="stacked" min="0" max="500" step="5" dual-knobs pin></ion-range>
  <ion-note id="ionic-dual-output">€60 – €320</ion-note>
</div>`,
    setup(root) {
      const range = root.querySelector('#ionic-dual-range');
      const output = root.querySelector('#ionic-dual-output');
      if (!range) return;
      range.value = { lower: 60, upper: 320 };
      range.addEventListener('ionChange', (event) => {
        const value = event.detail.value;
        if (output && typeof value === 'object') output.textContent = `€${value.lower} – €${value.upper}`;
      });
    },
    code: `<ion-range id="price" min="0" max="500" step="5" dual-knobs pin></ion-range>
<script type="module">
  const range = document.querySelector('#price');
  range.value = { lower: 60, upper: 320 };
  range.addEventListener('ionChange', ({ detail }) => console.log(detail.value));
</script>`,
  },
];
