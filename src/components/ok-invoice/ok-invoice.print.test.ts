import { describe, it, expect } from 'vitest';
import { OkInvoice } from './ok-invoice.js';

// Una factura es un documento fiscal: acaba en papel. Y en papel no se comporta como en pantalla.
// Estos guards existen porque el fallo aquí es **silencioso**: no se ve hasta que alguien imprime
// —mismo motivo por el que existen los guards de iconos (`src/base/icons.test.ts`, ADR-0122)—.

/** CSS del componente, aplanado a texto. */
function css(): string {
  const styles = OkInvoice.styles;
  return (Array.isArray(styles) ? styles : [styles]).map((s) => String(s)).join('\n');
}

describe('ok-invoice — estilos de papel', () => {
  it('trae un bloque @media print', () => {
    expect(css()).toContain('@media print');
  });

  it('NO declara @page: dentro de un shadow root se ignora en silencio', () => {
    // `@page` es una at-rule de DOCUMENTO. Puesta aquí no da error, simplemente NO HACE NADA, así
    // que el folio sale con los márgenes por defecto del navegador y parece que el CSS "no
    // funciona". El tamaño y los márgenes los declara quien monta el documento (en el Hub,
    // `lib/print.ts` al escribir el iframe aislado).
    expect(css()).not.toMatch(/@page\s*\{/);
  });

  it('no fuerza el ancho del folio al imprimir', () => {
    // En papel el ancho lo manda `@page`. Mantener `width: 210mm` cuando el navegador ya ha
    // restado los márgenes desborda y saca una segunda página en blanco.
    const print = css().split('@media print')[1] ?? '';
    expect(print).toMatch(/width:\s*auto/);
    expect(print).toMatch(/padding:\s*0/);
  });

  it('repite la cabecera de la tabla en cada folio', () => {
    // Sin esto, una factura de más de una página deja las columnas sin rotular a partir de la 2ª.
    const print = css().split('@media print')[1] ?? '';
    expect(print).toMatch(/thead\s*\{\s*display:\s*table-header-group/);
  });

  it('no parte por la mitad las filas ni los bloques que se leen de un vistazo', () => {
    const print = css().split('@media print')[1] ?? '';
    expect(print).toMatch(/break-inside:\s*avoid/);
    // `page-break-inside` es el nombre antiguo: hace falta para los motores que aún no soportan
    // el moderno, y WebKit es uno de ellos en impresión.
    expect(print).toMatch(/page-break-inside:\s*avoid/);
  });

  it('quita el fondo del bloque de receptor y lo sustituye por un filete', () => {
    // En pantalla el relleno ayuda a leer; en papel gasta tóner y sale sucio en láser monocroma.
    const print = css().split('@media print')[1] ?? '';
    expect(print).toMatch(/background:\s*transparent/);
    expect(print).toMatch(/border:\s*1px solid/);
  });
});
