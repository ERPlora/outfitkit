// Contrato: el CSV de ok-data-table SOBREVIVE a Excel en los dos sentidos.
//
// Bug 2026-07-16 (reportado por Ioan: «los caracteres no se ven correctamente»):
//   · IMPORTAR: `file.text()` decodificaba SIEMPRE como UTF-8. Un CSV guardado por
//     Excel (Windows-1252 por defecto) convertía «Café» en «Caf�»; y el "CSV UTF-8"
//     de Excel trae BOM, que contaminaba la primera cabecera (`﻿name` ≠ `name`
//     → la columna se daba por ausente SIN error).
//   · EXPORTAR: el blob UTF-8 iba SIN BOM → Excel lo abre como ANSI y pinta «CafÃ©».
//
// La decodificación vive en `decodeCsvBuffer`: UTF-8 estricto primero (fatal), y si
// los bytes no son UTF-8 válido, fallback a windows-1252 (lo que produce Excel).
// La exportación antepone el BOM (`CSV_BOM`) para que Excel lea UTF-8.
import { describe, expect, it } from 'vitest';
import { decodeCsvBuffer, CSV_BOM } from './csv-encoding';

const enc = (s: string) => new TextEncoder().encode(s).buffer;

describe('decodeCsvBuffer (importar)', () => {
  it('UTF-8 normal pasa tal cual', () => {
    expect(decodeCsvBuffer(enc('name,price\nCafé,2.20'))).toBe('name,price\nCafé,2.20');
  });

  it('el BOM de "CSV UTF-8" de Excel se elimina (no contamina la primera cabecera)', () => {
    expect(decodeCsvBuffer(enc('﻿name,price\nCafé,2.20'))).toBe('name,price\nCafé,2.20');
  });

  it('un CSV Windows-1252 de Excel («Café» = byte 0xE9) decodifica bien, no «Caf�»', () => {
    // C a f é(0xE9) , 2 . 2 0
    const bytes = new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x2c, 0x32, 0x2e, 0x32, 0x30]);
    expect(decodeCsvBuffer(bytes.buffer)).toBe('Café,2.20');
  });

  it('otros latinos de 1252 también (ñ/º/€)', () => {
    // ñ=0xF1 º=0xBA €=0x80 (1252)
    const bytes = new Uint8Array([0x6d, 0x61, 0xf1, 0x61, 0x6e, 0x61, 0x20, 0xba, 0x20, 0x80]);
    expect(decodeCsvBuffer(bytes.buffer)).toBe('mañana º €');
  });
});

describe('CSV_BOM (exportar)', () => {
  it('es el BOM UTF-8 que hace que Excel lea acentos bien', () => {
    expect(CSV_BOM).toBe('﻿');
  });
});
