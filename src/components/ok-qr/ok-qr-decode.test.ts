// @vitest-environment happy-dom
// outfitkit#138 — the QR `<ok-qr>` paints has to SCAN, not just look like a QR.
//
// The other ok-qr tests pin pieces of the symbol (alignment patterns, quiet-zone offset, parity
// with `qrSvgMarkup`). None of them reads the code back: a broken mask, format info, Reed-Solomon
// block or interleaving still draws a perfectly normal black-and-white square that no camera can
// read. This battery rasterizes the SVG the component actually renders and decodes it with an
// independent reader (jsQR, a pure-JS port of ZXing's detector/decoder — no shared code with the
// encoder), so the only way to stay green is to paint a code that a reader locks onto.
//
// The negative controls matter as much as the positives: a reader that returns nothing for
// everything would otherwise make this whole file vacuous.
import jsQR from 'jsqr';
import { describe, expect, it } from 'vitest';
import { OkQr, qrSvgMarkup } from './ok-qr.js';

// The AEAT validation URL of a production ticket: 111+ characters, version 7 at level M — the
// size that shipped unreadable until outfitkit#161.
const PROD_URL =
  'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B87654321&numserie=T-2026-000123&fecha=25-09-2026&importe=1234.56';
// The same URL against the AEAT test environment (what PRE prints): shorter, a lower version.
const PRE_URL = 'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=B12345678&numserie=T-1&fecha=23-09-2026&importe=1.80';
// The side-panel QR that opens the hub on the phone (hub#1715).
const HUB_URL = 'https://banco-pre.pre.erplora.com/';

const PX_PER_MODULE = 4;

interface Symbol {
  dim: number;
  dark: boolean[][];
}

/** Reads the painted symbol out of an SVG: its viewBox (quiet zone included) and the dark modules
 *  of the single `<path>`. Fails loudly on any path command it does not understand, so a change of
 *  path format breaks this test instead of silently rasterizing a blank image. */
function symbolOf(svg: SVGSVGElement | null): Symbol {
  expect(svg).toBeTruthy();
  const box = (svg!.getAttribute('viewBox') ?? '').split(' ').map(Number);
  expect(box[0]).toBe(0);
  expect(box[1]).toBe(0);
  expect(box[2]).toBe(box[3]);
  const dim = box[2];
  const dark = Array.from({ length: dim }, () => Array<boolean>(dim).fill(false));
  const d = svg!.querySelector('path')?.getAttribute('d') ?? '';
  const rest = d.replace(/M(\d+) (\d+)h1v1h-1z/g, (_, x: string, y: string) => {
    dark[Number(y)][Number(x)] = true;
    return '';
  });
  expect(rest).toBe('');
  return { dim, dark };
}

async function renderedSymbol(value: string, props: Partial<Pick<OkQr, 'ec' | 'margin'>> = {}): Promise<Symbol> {
  const el = document.createElement('ok-qr') as OkQr;
  el.value = value;
  Object.assign(el, props);
  document.body.appendChild(el);
  await el.updateComplete;
  const symbol = symbolOf(el.shadowRoot?.querySelector('svg') ?? null);
  el.remove();
  return symbol;
}

function markupSymbol(markup: string): Symbol {
  return symbolOf(new DOMParser().parseFromString(markup, 'image/svg+xml').querySelector('svg'));
}

/** Black on white, `PX_PER_MODULE` pixels per module and NO padding of its own: the only quiet
 *  zone the reader gets is the one the component painted inside its viewBox. */
function rasterize({ dim, dark }: Symbol): { data: Uint8ClampedArray; width: number; height: number } {
  const side = dim * PX_PER_MODULE;
  const data = new Uint8ClampedArray(side * side * 4).fill(255);
  for (let y = 0; y < side; y++) {
    for (let x = 0; x < side; x++) {
      if (!dark[Math.floor(y / PX_PER_MODULE)][Math.floor(x / PX_PER_MODULE)]) continue;
      const i = (y * side + x) * 4;
      data[i] = data[i + 1] = data[i + 2] = 0;
    }
  }
  return { data, width: side, height: side };
}

function decode(symbol: Symbol): string | null {
  const { data, width, height } = rasterize(symbol);
  return jsQR(data, width, height, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

/** A copy of the symbol with `mutate` applied to its module grid. */
function corrupted(symbol: Symbol, mutate: (dark: boolean[][]) => void): Symbol {
  const dark = symbol.dark.map((row) => [...row]);
  mutate(dark);
  return { dim: symbol.dim, dark };
}

describe('ok-qr decodes to the value it was given (independent reader)', () => {
  it.each([
    ['the production fiscal URL (version 7+)', PROD_URL],
    ['the PRE fiscal URL', PRE_URL],
    ['the hub side-panel URL', HUB_URL],
    ['non-ASCII text (UTF-8 bytes)', 'Peluquería Ñandú · 5,00 €'],
  ])('%s', async (_, value) => {
    expect(await decode(await renderedSymbol(value))).toBe(value);
  });

  it('the production fiscal URL really is a version 7+ symbol (45+ modules)', async () => {
    const { dim } = await renderedSymbol(PROD_URL, { margin: 0 });
    expect(dim).toBeGreaterThanOrEqual(45);
  });

  it.each(['L', 'M', 'Q', 'H'] as const)('decodes at error-correction level %s', async (ec) => {
    expect(await decode(await renderedSymbol(PROD_URL, { ec }))).toBe(PROD_URL);
  });

  it('a different error-correction level paints a different symbol', async () => {
    const l = await renderedSymbol(PROD_URL, { ec: 'L' });
    const h = await renderedSymbol(PROD_URL, { ec: 'H' });
    expect(JSON.stringify(h.dark)).not.toBe(JSON.stringify(l.dark));
  });

  it('the static SVG for the printed ticket (qrSvgMarkup) decodes too', () => {
    expect(decode(markupSymbol(qrSvgMarkup(PROD_URL)))).toBe(PROD_URL);
    expect(decode(markupSymbol(qrSvgMarkup(PRE_URL)))).toBe(PRE_URL);
  });

  it('an empty value paints no symbol at all, not half a one', async () => {
    const el = document.createElement('ok-qr') as OkQr;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.querySelector('svg')).toBeNull();
    el.remove();
  });
});

/** The reader above still locks onto a code with no quiet zone at all, so the border the standard
 *  requires (4 modules) is pinned on its own — thermal paper and phone cameras are less forgiving. */
function expectQuietZone({ dim, dark }: Symbol): void {
  for (let i = 0; i < dim; i++) {
    for (let q = 0; q < 4; q++) {
      expect(dark[q][i] || dark[dim - 1 - q][i] || dark[i][q] || dark[i][dim - 1 - q]).toBe(false);
    }
  }
  // And the code starts right after it: the top-left finder is dark at (4, 4).
  expect(dark[4][4]).toBe(true);
}

describe('quiet zone: the 4-module light border the standard requires', () => {
  it.each([PROD_URL, PRE_URL])('<ok-qr> by default: %s', async (value) => {
    expectQuietZone(await renderedSymbol(value));
  });

  it.each([PROD_URL, PRE_URL])('the printed ticket SVG (qrSvgMarkup) by default: %s', (value) => {
    expectQuietZone(markupSymbol(qrSvgMarkup(value)));
  });
});

describe('negative controls: the reader is not a rubber stamp', () => {
  it('a symbol with a finder pattern wiped does not decode', async () => {
    const symbol = await renderedSymbol(PROD_URL);
    const broken = corrupted(symbol, (dark) => {
      for (let r = 4; r < 11; r++) for (let c = 4; c < 11; c++) dark[r][c] = false;
    });
    expect(decode(symbol)).toBe(PROD_URL);
    expect(decode(broken)).toBeNull();
  });

  it('a symbol with its data region scrambled beyond error correction does not decode', async () => {
    const symbol = await renderedSymbol(PROD_URL);
    // Invert a wide band of the data area, clear of the finders and the timing lines: far more
    // flipped codewords than level M can repair.
    const broken = corrupted(symbol, (dark) => {
      for (let r = 16; r < symbol.dim - 16; r++) for (let c = 16; c < symbol.dim - 16; c++) dark[r][c] = !dark[r][c];
    });
    expect(decode(broken)).toBeNull();
  });
});

/** The mask pattern the generator chose, read from the symbol's format information exactly as a
 *  reader does (ISO/IEC 18004 §7.9: 15 BCH-coded bits around the top-left finder, XOR 0x5412; the
 *  top five data bits are two bits of EC level and three of mask). Independent of the generator's
 *  tables: only the standard's positions and the standard's mask constant. */
function formatInfoOf({ dim, dark }: Symbol): { mask: number; ecBits: number } {
  const quiet = 4; // every symbol in this file keeps the default quiet zone
  expect(dim % 2).toBe(1); // (version * 4 + 17) + 2 * 4 is always odd
  const g = (r: number, c: number): boolean => dark[r + quiet][c + quiet];
  let fmt = 0;
  for (let i = 0; i < 15; i++) {
    const bit = i < 6 ? g(i, 8) : i === 6 ? g(7, 8) : i === 7 ? g(8, 8) : i === 8 ? g(8, 7) : g(8, 14 - i);
    if (bit) fmt |= 1 << i;
  }
  const data = (fmt ^ 0x5412) >> 10;
  return { mask: data & 7, ecBits: data >> 3 };
}

describe('every one of the 8 mask patterns decodes', () => {
  // The generator picks the mask by penalty score, so which mask a value gets is not a knob: the
  // positives above only ever land on masks 2, 3, 4 and 6, and a broken mask 0, 1, 5 or 7 stayed
  // green. These values were searched for so that, together, they exercise all eight (fiscal
  // URLs where one exists; mask 0 only ever came up for short text). If a change to the penalty
  // rules moves one of them, the coverage assertion below says so instead of the gap reopening.
  const ONE_VALUE_PER_MASK = [
    '6TV7Y1A',
    'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=K45040369&numserie=YY-924200&fecha=26-04-2026&importe=1245.98',
    'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=P30481433&numserie=W9-679461&fecha=05-11-2026&importe=3536.36',
    'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=R44727575&numserie=PL-793469&fecha=09-08-2026&importe=926.54',
    'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=J28695964&numserie=O8-512215&fecha=25-02-2026&importe=797.42',
    'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=L92460084&numserie=T-54&fecha=23-09-2026&importe=138.54',
    'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B59054428&numserie=UX-79222&fecha=08-02-2026&importe=907.65',
    'https://prewww2.aeat.es/wlpl/TIKE-CONT/ValidarQR?nif=M44868171&numserie=T-510&fecha=23-09-2026&importe=132.73',
  ];

  it('the corpus covers masks 0-7 and each symbol decodes to its value', async () => {
    const masks = new Set<number>();
    for (const value of ONE_VALUE_PER_MASK) {
      const symbol = await renderedSymbol(value);
      const { mask, ecBits } = formatInfoOf(symbol);
      expect(ecBits, `format info of ${value} declares level M (00)`).toBe(0);
      masks.add(mask);
      expect(decode(symbol), `mask ${mask}: ${value}`).toBe(value);
    }
    expect([...masks].sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });
});
