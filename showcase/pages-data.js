/* pages-data.js — Registro de PÁGINAS DE EJEMPLO del docs-app de OutfitKit.
 *
 * Cada entrada es una pantalla completa («plantilla») que compone ion-* + ok-*
 * para reproducir una vista real de gestión de hubs de ERPlora Cloud (estructura
 * tomada del prototipo erplora.github.io/ux). Cada página vive en su propio
 * fichero HTML standalone bajo showcase/pages/ y se muestra en un <iframe> dentro
 * del showcase (aislamiento total: cada página carga su propio Ionic + OutfitKit).
 *
 * El router (app.js) las enruta en `#/p/<id>` y las lista en la sidebar.
 */

export const PAGES = [
  { id: 'hubs-active',   name: 'Hubs · Activos',      file: 'pages/hubs-active.html',   icon: 'cube-outline' },
  { id: 'hubs-inactive', name: 'Hubs · Inactivos',    file: 'pages/hubs-inactive.html', icon: 'archive-outline' },
  { id: 'hubs-users',    name: 'Hub · Usuarios',      file: 'pages/hubs-users.html',    icon: 'people-outline' },
  { id: 'hubs-modules',  name: 'Hub · Módulos',       file: 'pages/hubs-modules.html',  icon: 'apps-outline' },
  { id: 'hubs-qr',       name: 'Hub · Acceso QR',     file: 'pages/hubs-qr.html',       icon: 'qr-code-outline' },
  { id: 'users-invite',  name: 'Usuarios · Invitar',  file: 'pages/users-invite.html',  icon: 'person-add-outline' },
];
