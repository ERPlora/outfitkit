// @vitest-environment happy-dom
// Contrato de las ACCIONES del gestor de ficheros: renombrar, borrar carpetas, y respetar la
// política que le pasa el host.
//
// Por qué la política vive aquí y no en el consumidor: en ERPlora cada módulo decide qué se puede
// hacer con los ficheros de SU carpeta (ADR-0172) — los XML de VeriFactu son evidencia fiscal y no
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

// ── Drag & drop de reubicación (ok-move) ──────────────────────────────
//
// El gestor distingue dos flujos de arrastre: subir ficheros externos (ok-upload) y reubicar un
// fichero o carpeta del propio gestor a otra carpeta (ok-move). Aquí probamos el segundo: que se
// emite `ok-move` con {from,to}, que la raíz (main) es destino válido, y que una carpeta readOnly
// NO recibe el drop. Construimos DragEvent con un DataTransfer real para que el componente lea los
// tipos y el payload como en el navegador.

function makeMoveDrag(detail: { id: string; kind: 'file' | 'folder' }): DataTransfer {
  const dt = new DataTransfer();
  dt.setData('application/x-ok-file-manager-move', JSON.stringify(detail));
  return dt;
}

describe('ok-file-manager · arrastrar para reubicar (ok-move)', () => {
  it('suelta un fichero sobre una carpeta del árbol → emite ok-move con from y to', async () => {
    const el = await mount(undefined, '');
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    // Origen: la fila del fichero en la lista. Destino: la fila de la carpeta "facturas".
    const fileRow = el.shadowRoot!.querySelector('.lrow') as HTMLElement;
    const folderRow = el.shadowRoot!.querySelectorAll('.trow')[1] as HTMLElement; // [0]=media, [1]=facturas

    const dt = makeMoveDrag({ id: 'facturas/a.pdf', kind: 'file' });
    fileRow.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    folderRow.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
    folderRow.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));

    expect(moved).toHaveBeenCalledWith({ from: 'facturas/a.pdf', to: 'facturas' });
  });

  it('suelta sobre el área main → el destino es la raíz (to = "")', async () => {
    const el = await mount(undefined, '');
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    const fileRow = el.shadowRoot!.querySelector('.lrow') as HTMLElement;
    const main = el.shadowRoot!.querySelector('.main') as HTMLElement;

    const dt = makeMoveDrag({ id: 'facturas/a.pdf', kind: 'file' });
    fileRow.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    main.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
    main.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));

    expect(moved).toHaveBeenCalledWith({ from: 'facturas/a.pdf', to: '' });
  });

  it('una carpeta de solo lectura NO recibe el drop (no emite ok-move)', async () => {
    const folders: OkFmFolder[] = [
      {
        id: '',
        label: 'media',
        children: [
          { id: 'facturas', label: 'facturas' },
          { id: '_logs', label: '_logs', readOnly: true },
        ],
      },
    ];
    const el = document.createElement('ok-file-manager') as HTMLElement & {
      files: OkFmFile[];
      folders: OkFmFolder[];
      selected: string;
      view: 'grid' | 'list';
      updateComplete: Promise<unknown>;
    };
    el.folders = folders;
    el.files = FILES;
    el.selected = '';
    el.view = 'list';
    document.body.appendChild(el);
    await el.updateComplete;

    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    const fileRow = el.shadowRoot!.querySelector('.lrow') as HTMLElement;
    // Localiza la fila de "_logs" por su texto.
    const rows = Array.from(el.shadowRoot!.querySelectorAll('.trow')) as HTMLElement[];
    const logsRow = rows.find((r) => r.textContent?.includes('_logs'))!;

    const dt = makeMoveDrag({ id: 'facturas/a.pdf', kind: 'file' });
    fileRow.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    logsRow.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
    logsRow.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));

    expect(moved).not.toHaveBeenCalled();
    // Y la fila readOnly no es arrastrable.
    expect(logsRow.getAttribute('draggable')).toBe('false');
  });

  it('una carpeta normal es arrastrable; una readOnly no', async () => {
    const folders: OkFmFolder[] = [
      {
        id: '',
        label: 'media',
        children: [
          { id: 'facturas', label: 'facturas' },
          { id: 'modules/v', label: 'modules/v', readOnly: true },
        ],
      },
    ];
    const el = document.createElement('ok-file-manager') as HTMLElement & {
      folders: OkFmFolder[];
      selected: string;
      view: 'grid' | 'list';
      updateComplete: Promise<unknown>;
    };
    el.folders = folders;
    el.selected = '';
    el.view = 'list';
    document.body.appendChild(el);
    await el.updateComplete;

    const rows = Array.from(el.shadowRoot!.querySelectorAll('.trow')) as HTMLElement[];
    const facturas = rows.find((r) => r.textContent?.includes('facturas'))!;
    const module = rows.find((r) => r.textContent?.includes('modules/v'))!;

    expect(facturas.getAttribute('draggable')).toBe('true');
    expect(module.getAttribute('draggable')).toBe('false');
  });
});
