// @vitest-environment happy-dom
//
// Selector de imagen con DOS orígenes (decisión de Ioan, 2026-07-14):
//
//   hub    → el bucket/disco del propio cliente. El usuario SÍ sube aquí.
//   public → la librería curada de `blueprints`, servida por el proxy del SaaS. El usuario NO
//            puede subir: la única entrada es un PR al repo. Es un activo compartido por TODOS
//            los tenants; si un hub pudiera escribir en él, lo contamina para los demás.
//
// La regla que de verdad importa y que estos tests blindan: **en `public` no hay upload**. No basta
// con "no pintar el botón" — el componente tampoco debe emitir `ok-upload` estando en `public`,
// porque el `ok-dropzone` acepta drag&drop y un drop sobre la rejilla no pasa por ningún botón.
import { describe, expect, it, vi } from 'vitest';
import './ok-image-picker.js';
import type { OkImagePicker } from './ok-image-picker.js';

const HUB_IMAGES = [{ id: 'media:hub/img/fotos/local-1.webp', src: '/api/media/raw?path=fotos/local-1.webp', alt: 'local 1' }];
const PUBLIC_IMAGES = [
  { id: 'media:public/img/beauty_hair/tinte_barba.webp', src: '/api/v1/catalog/media/img/beauty_hair/tinte_barba.webp', alt: 'tinte barba' },
];

async function mount(segment: 'hub' | 'public' = 'hub'): Promise<OkImagePicker> {
  const el = document.createElement('ok-image-picker') as OkImagePicker;
  el.open = true;
  el.segment = segment;
  el.hubImages = HUB_IMAGES as never;
  el.publicImages = PUBLIC_IMAGES as never;
  document.body.append(el);
  await el.updateComplete;
  return el;
}

describe('segments', () => {
  it('arranca en hub y muestra las imágenes del hub', async () => {
    const el = await mount('hub');
    const gallery = el.shadowRoot!.querySelector('ok-gallery') as unknown as { images: unknown[] };
    expect(gallery.images).toHaveLength(1);
    expect((gallery.images[0] as { id: string }).id).toBe('media:hub/img/fotos/local-1.webp');
  });

  it('en public muestra la librería pública', async () => {
    const el = await mount('public');
    const gallery = el.shadowRoot!.querySelector('ok-gallery') as unknown as { images: unknown[] };
    expect((gallery.images[0] as { id: string }).id).toBe('media:public/img/beauty_hair/tinte_barba.webp');
  });
});

describe('upload: solo en hub', () => {
  it('en hub SÍ se pinta la zona de subida', async () => {
    const el = await mount('hub');
    expect(el.shadowRoot!.querySelector('ok-dropzone')).not.toBeNull();
  });

  it('en public NO se pinta la zona de subida', async () => {
    const el = await mount('public');
    expect(el.shadowRoot!.querySelector('ok-dropzone')).toBeNull();
  });

  it('en public NO emite ok-upload aunque le fuercen ficheros (drag&drop no pasa por el botón)', async () => {
    const el = await mount('public');
    const spy = vi.fn();
    el.addEventListener('ok-upload', spy);

    el.requestUpload([new File(['x'], 'colada.webp', { type: 'image/webp' })]);
    await el.updateComplete;

    expect(spy).not.toHaveBeenCalled();
  });

  it('en hub SÍ emite ok-upload con los ficheros', async () => {
    const el = await mount('hub');
    const spy = vi.fn();
    el.addEventListener('ok-upload', spy);

    const file = new File(['x'], 'foto.webp', { type: 'image/webp' });
    el.requestUpload([file]);
    await el.updateComplete;

    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].detail.files).toEqual([file]);
  });
});

describe('selección', () => {
  it('emite ok-select con la ref lógica (no la URL: la URL caduca, la ref no)', async () => {
    const el = await mount('public');
    const spy = vi.fn();
    el.addEventListener('ok-select', spy);

    el.select('media:public/img/beauty_hair/tinte_barba.webp');
    await el.updateComplete;

    expect(spy.mock.calls[0][0].detail.ref).toBe('media:public/img/beauty_hair/tinte_barba.webp');
  });
});

describe('búsqueda', () => {
  it('emite ok-search con el origen activo, para que el host sepa a qué backend preguntar', async () => {
    const el = await mount('public');
    const spy = vi.fn();
    el.addEventListener('ok-search', spy);

    el.search('barba');
    await el.updateComplete;

    expect(spy.mock.calls[0][0].detail).toEqual({ query: 'barba', origin: 'public' });
  });
});
