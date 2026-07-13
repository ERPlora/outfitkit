// Contrato: OutfitKit TRAE SUS PROPIOS ICONOS. No le pide al host que los registre.
//
// Antes, los ok-* pintaban `<ion-icon name="trash-outline">` y confiaban en que el consumidor
// hubiera hecho `addIcons({trashOutline})`. Ese contrato no estaba escrito en ninguna parte, y los
// dos consumidores lo cumplían de forma distinta:
//   · el SaaS sirve los 1357 SVG de ionicons como assets → el `name=` resuelve por fetch. Funciona.
//   · el Hub es offline y no sirve esa carpeta → el fetch falla EN SILENCIO y el icono sale VACÍO.
// Resultado: 19 iconos de OutfitKit llevaban rotos en el Hub sin que nadie lo viera.
//
// Ahora cada componente importa su SVG (`~icons/ion/<name>?raw`, horneado en build) y lo pasa por
// la prop `.icon`. Este guard impide volver atrás.
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { iconChevronUpOutline, iconTrashOutline, okIcon } from './icons';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else if (extname(entry.name) === '.ts' && !entry.name.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

describe('iconos de OutfitKit', () => {
  it('ningún componente usa el atributo `name` de ion-icon — todo va por `.icon`', () => {
    // `name=` solo acepta un nombre, así que obliga a que el HOST lo tenga registrado. `.icon`
    // acepta las dos cosas: un data-URI (lo pinta directo, sin red) o un nombre (que ion-icon busca
    // en el registro global). Yendo siempre por `.icon` + okIcon(), un icono nuestro se pinta solo
    // y uno del consumidor sigue funcionando como antes. Ver base/icons.ts.
    const offenders: string[] = [];
    // Solo los componentes: base/icons.ts lleva markup de ejemplo en sus comentarios.
    for (const file of walk(join(SRC, 'components'))) {
      for (const tag of readFileSync(file, 'utf8').match(/<ion-icon[^>]*>/g) ?? []) {
        if (/\s\.?name=/.test(tag)) offenders.push(`${file.slice(SRC.length + 1)} → ${tag.slice(0, 70)}`);
      }
    }
    expect(offenders, 'estos ion-icon dependen del registro del host → salen VACÍOS en el Hub offline').toEqual([]);
  });

  it('cada icono horneado es un data-URI que ionicons parsea sin fetch (CSP-safe)', () => {
    for (const [name, icon] of Object.entries({ iconTrashOutline, iconChevronUpOutline })) {
      // Los dos predicados que aplica ionicons (icon/validate.js): si no los cumple, en vez de
      // parsearlo con DOMParser hace un fetch() por icono, que la CSP del SaaS puede bloquear.
      expect(icon.startsWith('data:image/svg+xml'), `${name}: ionicons no lo ve como SVG`).toBe(true);
      expect(icon.includes(';utf8,'), `${name}: sin ";utf8," ionicons haría fetch()`).toBe(true);
      // Y el SVG tiene que ir CRUDO: ese DOMParser busca el tag <svg> literal DENTRO de la URL
      // (`parseFromString(url,'text/html')`). Percent-encoded no lo encuentra → icono VACÍO.
      expect(icon, `${name}: SVG codificado → DOMParser no lo encuentra`).toContain('<svg');
    }
  });

  it('okIcon resuelve un SVG inline, un icono propio, y deja pasar el nombre que no conoce', () => {
    // SVG inline (lo puede pasar un módulo con su icono ya horneado) → data-URI.
    expect(okIcon('<svg viewBox="0 0 1 1"></svg>')).toMatch(/^data:image\/svg\+xml;utf8,/);
    // Un nombre que OutfitKit SÍ trae → su SVG, sin depender del host.
    expect(okIcon('trash-outline')).toBe(iconTrashOutline);
    // Un nombre cualquiera → tal cual: lo resuelve el registro global del host (comportamiento
    // de siempre para los iconos que pasa el consumidor: <ok-kpi icon="receipt-outline">).
    expect(okIcon('receipt-outline')).toBe('receipt-outline');
    expect(okIcon(undefined)).toBeUndefined();
  });
});
