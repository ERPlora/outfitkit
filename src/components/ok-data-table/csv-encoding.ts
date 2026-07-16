// Codificación del CSV de ok-data-table (2026-07-16): la frontera con Excel.
//
// · IMPORTAR — Excel guarda "CSV" en Windows-1252 por defecto, y su "CSV UTF-8" lleva
//   BOM. Decodificar siempre como UTF-8 (`file.text()`) convertía «Café» en «Caf�» y
//   el BOM contaminaba la primera cabecera (la columna se daba por ausente sin error).
//   Estrategia: UTF-8 ESTRICTO primero (fatal: true) — si los bytes no son UTF-8
//   válido, es un fichero ANSI de Excel → windows-1252. El BOM se elimina siempre.
// · EXPORTAR — sin BOM, Excel abre el UTF-8 como ANSI y pinta «CafÃ©». El export
//   antepone `CSV_BOM`.

/** BOM UTF-8: al frente del export para que Excel detecte la codificación. */
export const CSV_BOM = '﻿';

/** Bytes de un fichero CSV → texto: UTF-8 estricto con fallback a Windows-1252 (Excel). */
export function decodeCsvBuffer(buf: ArrayBuffer): string {
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(buf);
  } catch {
    // No es UTF-8 válido → CSV "ANSI" de Excel (Windows-1252 cubre latin-1 + €/º).
    text = new TextDecoder('windows-1252').decode(buf);
  }
  // El BOM ya viene decodificado como ﻿; nunca debe llegar a las cabeceras.
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}
