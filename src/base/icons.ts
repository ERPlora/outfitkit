// Iconos de OutfitKit — SVG de Iconify (set `ion:`) HORNEADOS EN BUILD por unplugin-icons
// (`~icons/ion/<name>?raw`): offline, CSP-safe, sin red y sin runtime.
//
// POR QUÉ: antes los ok-* pintaban `<ion-icon name="trash-outline">` dando por hecho que el HOST
// había registrado ese nombre (addIcons). Ese contrato no estaba escrito en ningún sitio, y los dos
// consumidores lo cumplían distinto: el SaaS sirve los SVG de ionicons como assets (el `name=`
// resuelve por fetch y se ve), el Hub es offline y no → el fetch fallaba EN SILENCIO y el icono
// salía VACÍO. Así llevaban rotos 19 iconos en el Hub, incluida la flecha de orden ascendente de
// ok-data-table (`chevron-up-outline`), que no estaba registrada en ninguna parte.
//
// Ahora la librería es AUTÓNOMA: trae sus iconos dentro. Cada uno es un export NOMBRADO, así que
// rollup descarta los que un componente no use.
//
// Para AÑADIR uno: `import rawX from '~icons/ion/<name>?raw'` + su export + su entrada en BY_NAME.
// Guard: icons.test.ts (prohíbe volver al atributo `name`).

import rawAdd from '~icons/ion/add?raw';
import rawAlertCircle from '~icons/ion/alert-circle?raw';
import rawAlertCircleOutline from '~icons/ion/alert-circle-outline?raw';
import rawAppsOutline from '~icons/ion/apps-outline?raw';
import rawArchiveOutline from '~icons/ion/archive-outline?raw';
import rawArrowRedoOutline from '~icons/ion/arrow-redo-outline?raw';
import rawArrowUndoOutline from '~icons/ion/arrow-undo-outline?raw';
import rawBackspaceOutline from '~icons/ion/backspace-outline?raw';
import rawCalendarOutline from '~icons/ion/calendar-outline?raw';
import rawCheckmarkCircle from '~icons/ion/checkmark-circle?raw';
import rawCheckmarkOutline from '~icons/ion/checkmark-outline?raw';
import rawChevronBack from '~icons/ion/chevron-back?raw';
import rawChevronBackOutline from '~icons/ion/chevron-back-outline?raw';
import rawChevronDownOutline from '~icons/ion/chevron-down-outline?raw';
import rawChevronForward from '~icons/ion/chevron-forward?raw';
import rawChevronForwardOutline from '~icons/ion/chevron-forward-outline?raw';
import rawChevronUpOutline from '~icons/ion/chevron-up-outline?raw';
import rawClose from '~icons/ion/close?raw';
import rawCloseOutline from '~icons/ion/close-outline?raw';
import rawCloudUploadOutline from '~icons/ion/cloud-upload-outline?raw';
import rawCreateOutline from '~icons/ion/create-outline?raw';
import rawDocumentAttachOutline from '~icons/ion/document-attach-outline?raw';
import rawDocumentOutline from '~icons/ion/document-outline?raw';
import rawDocumentTextOutline from '~icons/ion/document-text-outline?raw';
import rawDownloadOutline from '~icons/ion/download-outline?raw';
import rawEllipsisVertical from '~icons/ion/ellipsis-vertical?raw';
import rawExpandOutline from '~icons/ion/expand-outline?raw';
import rawFileTrayOutline from '~icons/ion/file-tray-outline?raw';
import rawFolderOpenOutline from '~icons/ion/folder-open-outline?raw';
import rawInformationCircle from '~icons/ion/information-circle?raw';
import rawMenuOutline from '~icons/ion/menu-outline?raw';
import rawNotificationsOffOutline from '~icons/ion/notifications-off-outline?raw';
import rawOpenOutline from '~icons/ion/open-outline?raw';
import rawPlayOutline from '~icons/ion/play-outline?raw';
import rawRemove from '~icons/ion/remove?raw';
import rawSearchOutline from '~icons/ion/search-outline?raw';
import rawSend from '~icons/ion/send?raw';
import rawSwapVerticalOutline from '~icons/ion/swap-vertical-outline?raw';
import rawTrashOutline from '~icons/ion/trash-outline?raw';
import rawTrendingDown from '~icons/ion/trending-down?raw';
import rawTrendingUp from '~icons/ion/trending-up?raw';
import rawVolumeHighOutline from '~icons/ion/volume-high-outline?raw';
import rawVolumeLowOutline from '~icons/ion/volume-low-outline?raw';
import rawVolumeMuteOutline from '~icons/ion/volume-mute-outline?raw';
import rawWarning from '~icons/ion/warning?raw';

/**
 * SVG inline → data-URI. Formato EXACTO del que emite el propio set de ionicons; las dos partes
 * importan:
 *
 * - `;utf8,` es el marcador que ionicons busca (`isEncodedDataUrl`) para parsear el SVG con
 *   DOMParser —sin red, compatible con CSP— en vez de caer a un `fetch()` por icono.
 * - El SVG va CRUDO, sin `encodeURIComponent`: ese DOMParser hace
 *   `parseFromString(url, 'text/html').querySelector('svg')` sobre la URL ENTERA, así que necesita
 *   encontrar el tag `<svg>` literal. Percent-encoded no lo encuentra → "Could not parse svg" y el
 *   icono sale VACÍO.
 */
function bake(svg: string): string {
  return `data:image/svg+xml;utf8,${svg}`;
}

export const iconAdd = bake(rawAdd);
export const iconAlertCircle = bake(rawAlertCircle);
export const iconAlertCircleOutline = bake(rawAlertCircleOutline);
export const iconAppsOutline = bake(rawAppsOutline);
export const iconArchiveOutline = bake(rawArchiveOutline);
export const iconArrowRedoOutline = bake(rawArrowRedoOutline);
export const iconArrowUndoOutline = bake(rawArrowUndoOutline);
export const iconBackspaceOutline = bake(rawBackspaceOutline);
export const iconCalendarOutline = bake(rawCalendarOutline);
export const iconCheckmarkCircle = bake(rawCheckmarkCircle);
export const iconCheckmarkOutline = bake(rawCheckmarkOutline);
export const iconChevronBack = bake(rawChevronBack);
export const iconChevronBackOutline = bake(rawChevronBackOutline);
export const iconChevronDownOutline = bake(rawChevronDownOutline);
export const iconChevronForward = bake(rawChevronForward);
export const iconChevronForwardOutline = bake(rawChevronForwardOutline);
export const iconChevronUpOutline = bake(rawChevronUpOutline);
export const iconClose = bake(rawClose);
export const iconCloseOutline = bake(rawCloseOutline);
export const iconCloudUploadOutline = bake(rawCloudUploadOutline);
export const iconCreateOutline = bake(rawCreateOutline);
export const iconDocumentAttachOutline = bake(rawDocumentAttachOutline);
export const iconDocumentOutline = bake(rawDocumentOutline);
export const iconDocumentTextOutline = bake(rawDocumentTextOutline);
export const iconDownloadOutline = bake(rawDownloadOutline);
export const iconEllipsisVertical = bake(rawEllipsisVertical);
export const iconExpandOutline = bake(rawExpandOutline);
export const iconFileTrayOutline = bake(rawFileTrayOutline);
export const iconFolderOpenOutline = bake(rawFolderOpenOutline);
export const iconInformationCircle = bake(rawInformationCircle);
export const iconMenuOutline = bake(rawMenuOutline);
export const iconNotificationsOffOutline = bake(rawNotificationsOffOutline);
export const iconOpenOutline = bake(rawOpenOutline);
export const iconPlayOutline = bake(rawPlayOutline);
export const iconRemove = bake(rawRemove);
export const iconSearchOutline = bake(rawSearchOutline);
export const iconSend = bake(rawSend);
export const iconSwapVerticalOutline = bake(rawSwapVerticalOutline);
export const iconTrashOutline = bake(rawTrashOutline);
export const iconTrendingDown = bake(rawTrendingDown);
export const iconTrendingUp = bake(rawTrendingUp);
export const iconVolumeHighOutline = bake(rawVolumeHighOutline);
export const iconVolumeLowOutline = bake(rawVolumeLowOutline);
export const iconVolumeMuteOutline = bake(rawVolumeMuteOutline);
export const iconWarning = bake(rawWarning);

/** Los mismos iconos, por su nombre Iconify — para resolver los que llegan como string. */
const BY_NAME: Record<string, string> = {
  'add': iconAdd,
  'alert-circle': iconAlertCircle,
  'alert-circle-outline': iconAlertCircleOutline,
  'apps-outline': iconAppsOutline,
  'archive-outline': iconArchiveOutline,
  'arrow-redo-outline': iconArrowRedoOutline,
  'arrow-undo-outline': iconArrowUndoOutline,
  'backspace-outline': iconBackspaceOutline,
  'calendar-outline': iconCalendarOutline,
  'checkmark-circle': iconCheckmarkCircle,
  'checkmark-outline': iconCheckmarkOutline,
  'chevron-back': iconChevronBack,
  'chevron-back-outline': iconChevronBackOutline,
  'chevron-down-outline': iconChevronDownOutline,
  'chevron-forward': iconChevronForward,
  'chevron-forward-outline': iconChevronForwardOutline,
  'chevron-up-outline': iconChevronUpOutline,
  'close': iconClose,
  'close-outline': iconCloseOutline,
  'cloud-upload-outline': iconCloudUploadOutline,
  'create-outline': iconCreateOutline,
  'document-attach-outline': iconDocumentAttachOutline,
  'document-outline': iconDocumentOutline,
  'document-text-outline': iconDocumentTextOutline,
  'download-outline': iconDownloadOutline,
  'ellipsis-vertical': iconEllipsisVertical,
  'expand-outline': iconExpandOutline,
  'file-tray-outline': iconFileTrayOutline,
  'folder-open-outline': iconFolderOpenOutline,
  'information-circle': iconInformationCircle,
  'menu-outline': iconMenuOutline,
  'notifications-off-outline': iconNotificationsOffOutline,
  'open-outline': iconOpenOutline,
  'play-outline': iconPlayOutline,
  'remove': iconRemove,
  'search-outline': iconSearchOutline,
  'send': iconSend,
  'swap-vertical-outline': iconSwapVerticalOutline,
  'trash-outline': iconTrashOutline,
  'trending-down': iconTrendingDown,
  'trending-up': iconTrendingUp,
  'volume-high-outline': iconVolumeHighOutline,
  'volume-low-outline': iconVolumeLowOutline,
  'volume-mute-outline': iconVolumeMuteOutline,
  'warning': iconWarning,
};

/**
 * Normaliza un icono que llega como STRING: el que pasa el consumidor por prop
 * (`<ok-kpi icon="receipt-outline">`, las rowActions de ok-data-table, los items de un menú) o el
 * valor por defecto de una prop. Devuelve algo listo para la prop `.icon` de ion-icon:
 *
 *   · SVG inline (`<svg …>`)      → lo hornea aquí mismo a data-URI.
 *   · un nombre que OutfitKit trae  → su SVG horneado (sin red, sin depender del host).
 *   · cualquier otro nombre         → se devuelve tal cual: ion-icon lo resuelve contra el registro
 *     global del host (window.Ionicons.map). Es el comportamiento de siempre → no rompe a nadie.
 *
 * Usamos `.icon` y no `name` porque la prop `icon` de ion-icon acepta AMBOS (un data-URI lo trata
 * como src; un nombre lo busca en el registro), mientras que `name` solo acepta nombres.
 */
export function okIcon(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trimStart();
  if (trimmed.startsWith('<svg')) return bake(trimmed);
  return BY_NAME[value] ?? value;
}
