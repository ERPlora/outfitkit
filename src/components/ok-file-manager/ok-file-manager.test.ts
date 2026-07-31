// @vitest-environment happy-dom
// Contrato de las ACCIONES del gestor de ficheros: renombrar, borrar carpetas, y respetar la
// política que le pasa el host.
//
// Por qué la política vive aquí y no en el consumidor: en ERPlora cada módulo decide qué se puede
// hacer con los ficheros de SU carpeta (ADR-0166) — los XML de VeriFactu son evidencia fiscal y no
// se borran. El componente no la decide ni la aplica de verdad (eso es del servidor, que revalida
// siempre): solo evita pintar un botón que va a dar 403.
import { describe, expect, it, beforeEach, vi } from 'vitest';

// `base/icons.ts` hornea los SVG con `~icons/ion/<name>?raw` (unplugin-icons), que el entorno de
// test deniega. Aquí se prueba el contrato de acciones, no los iconos.
vi.mock('../../base/icons.js', () => ({
  iconChevronForwardOutline: '<svg/>',
  iconFolderOpenOutline: '<svg/>',
  okIcon: () => '<svg/>',
}));

import './ok-file-manager';
import type { OkFmFile, OkFmFolder, OkFmPolicy } from './ok-file-manager';

const FILES: OkFmFile[] = [
  { id: 'facturas/a.pdf', name: 'a.pdf', ext: 'pdf', url: '/api/media/raw?path=facturas/a.pdf' },
];
const FOLDERS: OkFmFolder[] = [{ id: '', label: 'media', children: [{ id: 'facturas', label: 'facturas' }] }];

async function mount(policy?: OkFmPolicy, selected = 'facturas') {
  const el = document.createElement('ok-file-manager') as HTMLElement & {
    files: OkFmFile[];
    folders: OkFmFolder[];
    selected: string;
    policy?: OkFmPolicy;
    view: 'grid' | 'list';
    updateComplete: Promise<unknown>;
  };
  el.folders = FOLDERS;
  el.files = FILES;
  el.selected = selected;
  el.view = 'list';
  if (policy) el.policy = policy;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Botón del shadow DOM por su `data-act`. */
function act(el: HTMLElement, name: string): HTMLButtonElement | null {
  return el.shadowRoot!.querySelector(`[data-act="${name}"]`);
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('ok-file-manager · acciones sobre ficheros', () => {
  it('ofrece renombrar un fichero y lo anuncia con su id', async () => {
    const el = await mount();
    const spy = vi.fn();
    el.addEventListener('ok-rename', (e) => spy((e as CustomEvent).detail));

    act(el, 'rename-file')!.click();

    expect(spy).toHaveBeenCalledWith({ id: 'facturas/a.pdf', name: 'a.pdf', kind: 'file' });
  });

  it('dice si lo que se borra es un fichero o una carpeta', async () => {
    // El host necesita distinguirlo: el texto de confirmación y el destino tras borrar no son
    // los mismos («vas a borrar la carpeta y todo su contenido»).
    const el = await mount();
    const spy = vi.fn();
    el.addEventListener('ok-delete', (e) => spy((e as CustomEvent).detail));

    act(el, 'delete-file')!.click();

    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'facturas/a.pdf', kind: 'file' }));
  });
});

describe('ok-file-manager · acciones sobre la carpeta actual', () => {
  it('deja renombrar y borrar la carpeta en la que estás', async () => {
    const el = await mount();
    const renamed = vi.fn();
    const deleted = vi.fn();
    el.addEventListener('ok-rename', (e) => renamed((e as CustomEvent).detail));
    el.addEventListener('ok-delete', (e) => deleted((e as CustomEvent).detail));

    act(el, 'rename-folder')!.click();
    act(el, 'delete-folder')!.click();

    expect(renamed).toHaveBeenCalledWith({ id: 'facturas', name: 'facturas', kind: 'folder' });
    expect(deleted).toHaveBeenCalledWith({ id: 'facturas', kind: 'folder' });
  });

  it('no ofrece renombrar ni borrar la raíz', async () => {
    // `media/` es la carpeta del hub: no es de nadie para renombrarla.
    const el = await mount(undefined, '');
    expect(act(el, 'rename-folder')).toBeNull();
    expect(act(el, 'delete-folder')).toBeNull();
  });
});

describe('ok-file-manager · política del host', () => {
  it('sin política declarada se comporta como siempre (todo disponible)', async () => {
    // Compatibilidad: los consumidores que no pasan `policy` no cambian de comportamiento.
    const el = await mount();
    expect(act(el, 'rename-file')).not.toBeNull();
    expect(act(el, 'delete-file')).not.toBeNull();
    expect(act(el, 'upload')).not.toBeNull();
  });

  it('una carpeta de solo lectura no ofrece ni borrar, ni renombrar, ni subir', async () => {
    const el = await mount({ upload: false, rename: false, delete: false });
    expect(act(el, 'rename-file')).toBeNull();
    expect(act(el, 'delete-file')).toBeNull();
    expect(act(el, 'rename-folder')).toBeNull();
    expect(act(el, 'delete-folder')).toBeNull();
    expect(act(el, 'upload')).toBeNull();
    expect(act(el, 'new-folder')).toBeNull();
  });

  it('pero SIEMPRE deja ver y descargar: solo lectura no es "no puedes mirar"', async () => {
    const el = await mount({ upload: false, rename: false, delete: false });
    expect(act(el, 'open')).not.toBeNull();
    expect(act(el, 'download')).not.toBeNull();
  });

  it('concede acción por acción', async () => {
    const el = await mount({ upload: true, rename: false, delete: true });
    expect(act(el, 'upload')).not.toBeNull();
    expect(act(el, 'delete-file')).not.toBeNull();
    expect(act(el, 'rename-file')).toBeNull();
  });
});
