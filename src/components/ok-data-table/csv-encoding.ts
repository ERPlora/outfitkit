// Codificación del CSV de ok-data-table (2026-07-16): la frontera con Excel.
//
// · IMPORTAR — Excel guarda "CSV" en Windows-1252 por defecto, y su "CSV UTF-8" lleva
//   BOM. Decodificar siempre como UTF-8 (`file.text()`) convertía «Café» en «Caf�» y
//   el BOM contaminaba la primera cabecera (la columna se daba por ausente sin error).
//   Estrategia: UTF-8 ESTRICTO primero (fatal: true) — si los bytes no son UTF-8
//   válido, es un fichero ANSI de Excel → windows-1252. El BOM se elimina siempre.
// · EXPORTAR — sin BOM, Excel abre el UTF-8 como ANSI y pinta «CafÃ©». El export
//   antepone `CSV_BOM`.
//
// La tabla de Windows-1252 la ponemos NOSOTROS (outfitkit#66). `new TextDecoder('windows-1252')`
// solo es correcto donde el entorno trae la tabla de codificaciones heredadas: en un Node sin
// full-icu —el runner de CI, por ejemplo— ese mismo decoder se comporta como latin-1 y el byte
// 0x80 sale como U+0080 en vez de «€». En silencio, que es lo caro. Mismo patrón que los iconos
// de ADR-0122: un contrato implícito con el entorno que un WebView embebido puede no cumplir.

/** BOM UTF-8: al frente del export para que Excel detecte la codificación. */
export const CSV_BOM = '﻿';

// Tramo C1 (0x80–0x9F), que es donde Windows-1252 se separa de latin-1. Del 0xA0 en adelante
// las dos codificaciones coinciden, así que ahí basta con el propio valor del byte.
// Los cinco huecos sin asignar (0x81, 0x8D, 0x8F, 0x90, 0x9D) se quedan como su control, que es
// lo que manda la especificación WHATWG.
const WINDOWS_1252_C1 = [
  0x20ac, 0x0081, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021,
  0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x008d, 0x017d, 0x008f,
  0x0090, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x009d, 0x017e, 0x0178,
];

/**
 * Bytes Windows-1252 → texto, con nuestra propia tabla.
 *
 * No usa `TextDecoder`: su soporte de codificaciones heredadas depende del entorno (ver arriba),
 * y el import de un CSV de Excel tiene que leerse igual en el navegador, en el Hub offline y en
 * cualquier runner de CI.
 */
export function decodeWindows1252(bytes: Uint8Array): string {
  let text = '';
  for (const byte of bytes) {
    text += String.fromCharCode(byte >= 0x80 && byte <= 0x9f ? WINDOWS_1252_C1[byte - 0x80] : byte);
  }
  return text;
}

/** Bytes de un fichero CSV → texto: UTF-8 estricto con fallback a Windows-1252 (Excel). */
export function decodeCsvBuffer(buf: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // No es UTF-8 válido → CSV "ANSI" de Excel (Windows-1252 cubre latin-1 + €/º).
    text = decodeWindows1252(new Uint8Array(buf));
  }
  // El BOM ya viene decodificado como ﻿; nunca debe llegar a las cabeceras.
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
