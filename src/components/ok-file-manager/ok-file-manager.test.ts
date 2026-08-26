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
import { OkFileManager } from './ok-file-manager';
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

// ── Opening a file on touch (#95) ──────────────────────────────────────
//
// Opening used to be `@dblclick`/Enter only, which a tablet cannot rely on (no keyboard, and
// double-tap is usually eaten by the browser's zoom gesture before it synthesizes `dblclick`).
// `fileActions()` already renders an explicit "open" row action wired to a plain `@click`
// (works on touch), but in the grid view it lived inside `.card-actions`, which was only shown
// on `:hover`/`:focus-within` — invisible and therefore untappable on a device with no hover.
describe('ok-file-manager · abrir sin doble clic (#95)', () => {
  it('el botón "Abrir" de fileActions() emite ok-open con un solo click (no dblclick)', async () => {
    const el = await mount();
    const spy = vi.fn();
    el.addEventListener('ok-open', (e) => spy((e as CustomEvent).detail));

    act(el, 'open')!.click();

    expect(spy).toHaveBeenCalledWith({ id: 'facturas/a.pdf' });
  });

  it('en la vista grid, .card-actions deja de depender de :hover en dispositivos táctiles', () => {
    // Un tablet no tiene :hover fiable: sin esto, el botón "Abrir" existe en el DOM pero es
    // invisible (opacity:0) y nadie sabe que está ahí para tocarlo.
    const css = stylesText();
    const coarse = /@media \(pointer: coarse\)\s*\{([\s\S]*?)\n {4}\}\n/.exec(css);
    expect(coarse, '@media (pointer: coarse) block not found for .card-actions').not.toBeNull();
    expect(coarse![1]).toMatch(/\.card-actions\s*\{[^}]*opacity:\s*1/);
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

/** Dispara la secuencia dragstart → dragover → drop (→ dragend) entre dos elementos del shadow. */
function dragBetween(
  from: HTMLElement,
  to: HTMLElement,
  detail: { id: string; kind: 'file' | 'folder' },
): void {
  const dt = makeMoveDrag(detail);
  from.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
  to.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
  from.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));
}

describe('ok-file-manager · arrastrar para reubicar (ok-move)', () => {
  it('suelta un fichero sobre una carpeta del árbol → emite ok-move con from y to', async () => {
    const el = await mount(undefined, '');
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    const fileRow = el.shadowRoot!.querySelector('.lrow') as HTMLElement;
    const folderRow = el.shadowRoot!.querySelectorAll('.trow')[1] as HTMLElement; // [0]=media, [1]=facturas

    dragBetween(fileRow, folderRow, { id: 'facturas/a.pdf', kind: 'file' });

    expect(moved).toHaveBeenCalledWith({ from: 'facturas/a.pdf', to: 'facturas' });
  });

  it('suelta sobre el área main → el destino es la raíz (to = "")', async () => {
    const el = await mount(undefined, '');
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    const fileRow = el.shadowRoot!.querySelector('.lrow') as HTMLElement;
    const main = el.shadowRoot!.querySelector('.main') as HTMLElement;

    dragBetween(fileRow, main, { id: 'facturas/a.pdf', kind: 'file' });

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

    dragBetween(fileRow, logsRow, { id: 'facturas/a.pdf', kind: 'file' });

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

  it('arrancar el drag desde un botón de acción también mueve el fichero', async () => {
    // En el grid los iconos de acción cubren buena parte del card; el cursor cae a menudo sobre
    // ellos. Los botones son draggable para que el dragstart burbujee al card y se trate como drag
    // del fichero, no como un click del botón.
    const el = await mount(undefined, '');
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    const openBtn = act(el, 'open') as HTMLElement;
    const folderRow = el.shadowRoot!.querySelectorAll('.trow')[1] as HTMLElement;

    // dragstart nace en el botón; dragover/drop en la carpeta destino.
    const dt = makeMoveDrag({ id: 'facturas/a.pdf', kind: 'file' });
    openBtn.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
    folderRow.dispatchEvent(new DragEvent('dragover', { bubbles: true, dataTransfer: dt }));
    folderRow.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }));
    openBtn.dispatchEvent(new DragEvent('dragend', { bubbles: true, dataTransfer: dt }));

    expect(moved).toHaveBeenCalledWith({ from: 'facturas/a.pdf', to: 'facturas' });
  });
});

// ── Move without dragging — destination picker (#96) ──────────────────
//
// HTML5 drag&drop never fires on touch, and `emitMove()` used to be the ONLY thing that emits
// `ok-move` — reachable solely from the drop handlers. This adds a tap-driven "Move to…" row
// action that opens a folder picker and emits the SAME `ok-move` {from,to} event; the drag&drop
// path stays untouched for mouse users.
const MOVE_FOLDERS: OkFmFolder[] = [
  {
    id: '',
    label: 'media',
    children: [
      { id: 'facturas', label: 'facturas' },
      { id: '_logs', label: '_logs', readOnly: true },
    ],
  },
];

async function mountForMove() {
  const el = document.createElement('ok-file-manager') as HTMLElement & {
    files: OkFmFile[];
    folders: OkFmFolder[];
    selected: string;
    view: 'grid' | 'list';
    policy?: OkFmPolicy;
    updateComplete: Promise<unknown>;
  };
  el.folders = MOVE_FOLDERS;
  el.files = FILES;
  el.selected = 'facturas';
  el.view = 'list';
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

/** Destination items rendered by the open "Move to…" picker. */
function moveTargets(el: HTMLElement): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll('[data-move-target]'));
}

describe('ok-file-manager · mover sin arrastrar — selector de destino (#96)', () => {
  it('fileActions() ofrece una acción "Mover a…" (antes solo traía renombrar y borrar)', async () => {
    const el = await mountForMove();
    expect(act(el, 'move-file')).not.toBeNull();
  });

  it('tocar "Mover a…" abre un selector con las carpetas del árbol', async () => {
    const el = await mountForMove();
    expect(moveTargets(el)).toHaveLength(0); // cerrado hasta que se pide mover

    act(el, 'move-file')!.click();
    await el.updateComplete;

    const labels = moveTargets(el).map((n) => n.textContent?.trim());
    expect(labels).toEqual(expect.arrayContaining(['media', 'facturas']));
  });

  it('elegir un destino emite ok-move con el MISMO contrato {from,to} que el drag&drop', async () => {
    const el = await mountForMove();
    const moved = vi.fn();
    el.addEventListener('ok-move', (e) => moved((e as CustomEvent).detail));

    act(el, 'move-file')!.click();
    await el.updateComplete;
    moveTargets(el).find((n) => n.getAttribute('data-move-target') === 'facturas')!.click();

    expect(moved).toHaveBeenCalledWith({ from: 'facturas/a.pdf', to: 'facturas' });
  });

  it('elegir un destino cierra el selector', async () => {
    const el = await mountForMove();

    act(el, 'move-file')!.click();
    await el.updateComplete;
    moveTargets(el)[0].click();
    await el.updateComplete;

    expect(moveTargets(el)).toHaveLength(0);
  });

  it('una carpeta de solo lectura no se ofrece como destino', async () => {
    const el = await mountForMove();

    act(el, 'move-file')!.click();
    await el.updateComplete;

    const ids = moveTargets(el).map((n) => n.getAttribute('data-move-target'));
    expect(ids).not.toContain('_logs');
  });

  it('"Mover a…" no depende de la política: se ofrece igual que abrir/descargar', async () => {
    // El drag&drop tampoco la comprueba (solo mira folder.readOnly) -- el tap no le añade una
    // puerta que el ratón no tenía.
    const el = document.createElement('ok-file-manager') as HTMLElement & {
      files: OkFmFile[];
      folders: OkFmFolder[];
      selected: string;
      view: 'grid' | 'list';
      policy?: OkFmPolicy;
      updateComplete: Promise<unknown>;
    };
    el.folders = MOVE_FOLDERS;
    el.files = FILES;
    el.selected = 'facturas';
    el.view = 'list';
    el.policy = { upload: false, rename: false, delete: false };
    document.body.appendChild(el);
    await el.updateComplete;

    expect(act(el, 'move-file')).not.toBeNull();
  });
});

// ---- Tap targets (#92 touch audit) ----
// Contract: src/base/tap-target.test.ts — nothing interactive under 44px, exemptions argued in a
// comment. ok-file-manager mixes lone toolbar buttons (grown outright, plenty of room in the
// toolbar) with packed row/tree controls (hit area capped to the real neighbour spacing so up to
// 4 actions 2px apart, or a caret glued to the folder name, never overlap).
function stylesText(): string {
  const styles = OkFileManager.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join('\n');
}

describe('ok-file-manager — tap targets (#92)', () => {
  it('the shared tapTarget hit-area fragment is part of the component styles', () => {
    const css = stylesText();
    expect(css).toMatch(/::before/);
    expect(css).toMatch(/max\(100%,\s*var\(--ok-tap-min/);
  });

  it('.tbtn grows to the 44px floor -- a lone toolbar button, nothing to preserve', () => {
    const css = stylesText();
    const m = /\.tbtn\s*\{([^}]*)\}/.exec(css);
    expect(m, '.tbtn rule not found').not.toBeNull();
    expect(m![1]).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.tbtn.icon stays square at the grown size', () => {
    const css = stylesText();
    const m = /\.tbtn\.icon\s*\{([^}]*)\}/.exec(css);
    expect(m, '.tbtn.icon rule not found').not.toBeNull();
    expect(m![1]).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.view-btn grows to the 44px floor -- the view toggle has room to spare', () => {
    const css = stylesText();
    const m = /\.view-btn\s*\{([^}]*)\}/.exec(css);
    expect(m, '.view-btn rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*var\(--ok-tap-min,\s*44px\)/);
    expect(body).toMatch(/height:\s*var\(--ok-tap-min,\s*44px\)/);
  });

  it('.action keeps the 28px ghost-button drawing -- up to 5 of them share a row 2px apart', () => {
    const css = stylesText();
    const m = /\.action\s*\{([^}]*)\}/.exec(css);
    expect(m, '.action rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*28px/);
    expect(body).toMatch(/height:\s*28px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it('caps the .action hit area to the real row/card gap (2px) so neighbours never overlap', () => {
    const css = stylesText();
    const m = /\.action\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.action.ok-tap::before override not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*calc\(28px \+ 2px\)/);
    expect(body).toMatch(/height:\s*calc\(28px \+ 2px\)/);
  });

  it('.caret keeps the 18px chevron drawing -- widening it would eat the row click zone', () => {
    const css = stylesText();
    const m = /\.caret\s*\{([^}]*)\}/.exec(css);
    expect(m, '.caret rule not found').not.toBeNull();
    const body = m![1];
    expect(body).toMatch(/width:\s*18px/);
    expect(body).toMatch(/height:\s*18px/);
    expect(body, 'must carry an argued exemption, not a silent shrink').toMatch(
      /ok-tap-exempt\s*:\s*\S/,
    );
  });

  it("caps the .caret hit area to the row's own gap/padding, never the folder name or a neighbour row", () => {
    const css = stylesText();
    const m = /\.caret\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, '.caret.ok-tap::before override not found').not.toBeNull();
    const body = m![1];
    // 6px = the .trow gap before the folder icon; 14px = 2 * the .trow vertical padding (7px),
    // landing exactly on the row's own edge, never a neighbour row's.
    expect(body).toMatch(/width:\s*calc\(18px \+ 6px\)/);
    expect(body).toMatch(/height:\s*calc\(18px \+ 14px\)/);
  });

  it('renders the folder caret and the file actions with the ok-tap marker', async () => {
    const el = await mount();
    const caret = el.shadowRoot!.querySelector('.caret');
    expect(caret?.classList.contains('ok-tap')).toBe(true);
    const openBtn = act(el, 'open');
    expect(openBtn?.classList.contains('ok-tap')).toBe(true);
  });
});
