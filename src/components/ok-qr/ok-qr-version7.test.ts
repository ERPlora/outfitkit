// @vitest-environment happy-dom
// Regression (found reviewing sales#340): every QR of version 7 or above came out unreadable.
//
// From version 7 the alignment-pattern coordinates include the timing lines (row/column 6: the
// pattern centred at (6, 22) and (22, 6) for v7), and the encoder skipped any pattern whose centre
// sat on a reserved module — meant to dodge the finders, it dodged those two as well. The data bits
// then flowed into the modules the patterns should occupy and no reader could lock on the code.
// The AEAT's validation URL for a production ticket (`https://www2.agenciatributaria.gob.es/wlpl/
// TIKE-CONT/ValidarQR?nif=…&numserie=…&fecha=…&importe=…`) is at least 111 characters: version 7 at
// level M, always. Verified against node-qrcode and read with jsQR only after this fix.
import { describe, expect, it } from 'vitest';
import { qrSvgMarkup } from './ok-qr.js';

const PROD_URL = 'https://www2.agenciatributaria.gob.es/wlpl/TIKE-CONT/ValidarQR?nif=B87654321&numserie=T-7&fecha=23-09-2026&importe=5.00';

function matrixOf(value: string): boolean[][] {
  const svg = qrSvgMarkup(value, { margin: 0 });
  const dim = Number(/viewBox="0 0 (\d+)/.exec(svg)?.[1]);
  const rows = Array.from({ length: dim }, () => Array<boolean>(dim).fill(false));
  for (const m of (/<path d="([^"]*)"/.exec(svg)?.[1] ?? '').matchAll(/M(\d+) (\d+)h1v1h-1z/g)) rows[Number(m[2])][Number(m[1])] = true;
  return rows;
}

/** The 5×5 alignment pattern: dark ring, light ring, dark centre. */
function isAlignmentPattern(m: boolean[][], r: number, c: number): boolean {
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const ring = Math.max(Math.abs(dr), Math.abs(dc));
      if (m[r + dr][c + dc] !== (ring !== 1)) return false;
    }
  }
  return true;
}

describe('ok-qr encoder from version 7 (the AEAT production URL)', () => {
  it('the production validation URL needs version 7: 45 modules', () => {
    expect(matrixOf(PROD_URL).length).toBe(45);
  });

  it('draws the alignment patterns that sit on the timing lines, not only the centre one', () => {
    const m = matrixOf(PROD_URL);
    expect(isAlignmentPattern(m, 22, 22)).toBe(true);
    expect(isAlignmentPattern(m, 6, 22)).toBe(true);
    expect(isAlignmentPattern(m, 22, 6)).toBe(true);
    expect(isAlignmentPattern(m, 22, 38)).toBe(true);
    expect(isAlignmentPattern(m, 38, 22)).toBe(true);
  });

  it('still leaves out the three that would overlap the finders', () => {
    const m = matrixOf(PROD_URL);
    // (6, 6), (6, 38) and (38, 6) are finder territory: the separator around each finder is light,
    // so an alignment ring there would be a defect of its own.
    expect(isAlignmentPattern(m, 6, 6)).toBe(false);
    expect(isAlignmentPattern(m, 6, 38)).toBe(false);
    expect(isAlignmentPattern(m, 38, 6)).toBe(false);
  });
});
