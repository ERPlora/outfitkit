/* Registro canónico de páginas del showcase.
 *
 * Las superficies SaaS/Hub son curadas contra sus rutas reales. Las páginas de
 * módulos se generan desde module.json para que el índice no se mantenga a mano.
 */

import { SAAS_PAGES, HUB_PAGES } from './product-pages-data.js';
import { MODULE_PAGES } from './module-pages-data.js';

export const SURFACES = [
  { id: 'saas', label: 'SaaS', icon: 'cloud-outline' },
  { id: 'hub', label: 'Hub', icon: 'desktop-outline' },
  { id: 'modules', label: 'Módulos', icon: 'extension-puzzle-outline' },
];

export const PAGES = [...SAAS_PAGES, ...HUB_PAGES, ...MODULE_PAGES];
