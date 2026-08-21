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
import { decodeCsvBuffer, decodeWindows1252, CSV_BOM } from './csv-encoding';

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

// La tabla de Windows-1252 la ponemos NOSOTROS, no la plataforma.
//
// El gate de outfitkit#66 lo destapó el primer día que corrió: `new TextDecoder('windows-1252')`
// solo es correcto donde hay tabla de codificaciones heredadas. En el runner de CI (Node sin
// full-icu) ese mismo `TextDecoder` se comporta como latin-1 y el byte 0x80 sale como U+0080 en
// vez de «€» — en silencio, que es lo caro. Es la misma clase de fallo que los iconos de ADR-0122:
// un contrato implícito con el entorno que un WebView embebido puede no cumplir.
//
// Se decodifica el tramo C1 (0x80–0x9F) con la tabla escrita a mano, así el import de un CSV de
// Excel se lee IGUAL en el navegador, en el Hub offline y en cualquier runner.
describe('decodeWindows1252 (tabla propia, sin depender del entorno)', () => {
  it('mapea el tramo C1 (0x80–0x9F) como Windows-1252, no como latin-1', () => {
    const at = (byte: number): string => decodeWindows1252(new Uint8Array([byte]));

    expect(at(0x80)).toBe('€');
    expect(at(0x82)).toBe('‚'); // ‚
    expect(at(0x85)).toBe('…');
    expect(at(0x91)).toBe('‘'); // ‘
    expect(at(0x92)).toBe('’'); // ’ — el apóstrofo que Excel mete en los nombres
    expect(at(0x93)).toBe('“'); // “
    expect(at(0x96)).toBe('–'); // –
    expect(at(0x99)).toBe('™');
    expect(at(0x9c)).toBe('œ');
    expect(at(0x9f)).toBe('Ÿ');
  });

  it('los cinco huecos sin asignar de 1252 se quedan como su propio control (regla WHATWG)', () => {
    for (const byte of [0x81, 0x8d, 0x8f, 0x90, 0x9d]) {
      expect(decodeWindows1252(new Uint8Array([byte])), byte.toString(16)).toBe(
        String.fromCharCode(byte),
      );
    }
  });

  it('deja intacto el ASCII y el resto de latin-1', () => {
    const bytes = new Uint8Array([0x43, 0x61, 0x66, 0xe9, 0x20, 0xf1, 0x20, 0xba, 0x20, 0xff]);
    expect(decodeWindows1252(bytes)).toBe('Café ñ º ÿ');
  });
});
