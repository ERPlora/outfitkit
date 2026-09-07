// generate-component-catalog — the short index of "what already exists" (outfitkit#126).
//
// The full registry is `showcase/components-data.js`: id, category, desc and api for every
// component, kept complete by `src/showcase/component-catalog-completeness.test.ts`. But it is
// ~2900 lines interleaved with live demos and fixture data, so nobody opens it to answer the one
// question that matters before writing a screen — "is this already built?". The answer was being
// copied by hand somewhere else, and the copy drifted: three totals at once and five components
// missing, two of them older than the copy itself.
//
// This derives that index instead. It is committed (readers get it without a build) and
// `src/repo/generate-component-catalog.test.ts` regenerates it on every run, so a component added
// without regenerating turns the gate red.
//
// Usage:
//   node scripts/generate-component-catalog.mjs           # write docs/COMPONENT-CATALOG.md
//   node scripts/generate-component-catalog.mjs --check   # exit 1 if the file is out of date

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const CATALOG_PATH = resolve(process.cwd(), 'docs/COMPONENT-CATALOG.md');
const REGISTRY_PATH = resolve(process.cwd(), 'showcase/components-data.js');
const COMPONENTS_DIR = resolve(process.cwd(), 'src/components');

/**
 * First sentence of a description, which is how the registry summarises each component.
 *
 * Splitting on any "." would cut inside "0-100 %.", "ADR-0123)." or "16,50 €;": a sentence only
 * ends when the next one starts, i.e. at ". " followed by an opening character. A very short
 * opener ("Es un <dialog>.") carries no information on its own, so it takes the next one along.
 */
function firstSentence(desc) {
  const text = String(desc).replace(/\s+/g, ' ').trim();
  const boundary = /\.\s+(?=[A-ZÁÉÍÓÚÑ¿¡«(])/g;
  let cut = 0;

  for (const match of text.matchAll(boundary)) {
    cut = match.index + 1;
    if (cut >= 60) break;
  }

  return cut > 0 ? text.slice(0, cut) : text;
}

/** Public API names of one kind, in declaration order and without duplicates. */
function apiNames(component, kind) {
  const names = (component.api ?? [])
    .filter((entry) => entry.kind === kind && typeof entry.name === 'string')
    .map((entry) => entry.name.trim())
    .filter(Boolean);

  return [...new Set(names)];
}

/** One catalog line: what it is, plus the names needed to wire it without opening the source. */
function renderEntry(component) {
  const parts = [`- \`${component.id}\` — ${firstSentence(component.desc)}`];
  const props = apiNames(component, 'prop');
  const events = apiNames(component, 'event');

  if (props.length > 0) parts.push(`props: ${props.map((name) => `\`${name}\``).join(', ')}`);
  if (events.length > 0) parts.push(`eventos: ${events.map((name) => `\`${name}\``).join(', ')}`);

  return parts.join(' · ');
}

/**
 * Build the markdown index.
 *
 * The registry also documents four CSS recipes from `layout.css` (`ok-layout`, `ok-section`,
 * `ok-grid-recipes`, `ok-table-stack`) which are classes, not custom elements. They are named in
 * the closing note rather than listed as components, so the count stays honest.
 */
export async function renderComponentCatalog() {
  const { COMPONENTS, CATEGORIES } = await import(pathToFileURL(REGISTRY_PATH).href);
  const components = new Set(readdirSync(COMPONENTS_DIR));
  const documented = COMPONENTS.filter((component) => components.has(component.id));

  const missing = [...components]
    .filter((id) => !documented.some((component) => component.id === id))
    .sort();
  if (missing.length > 0) {
    // component-catalog-completeness.test.ts owns that failure; refuse to emit an index that
    // would hide it behind a plausible-looking list.
    throw new Error(
      `showcase/components-data.js does not document: ${missing.join(', ')}. ` +
        'Add an entry there before regenerating the catalog.',
    );
  }

  const lines = [
    '<!-- GENERADO por scripts/generate-component-catalog.mjs — NO editar a mano.',
    '     Se regenera con `npm run catalog`; el gate falla si este fichero no coincide. -->',
    '',
    `# OutfitKit — qué existe ya (${components.size} componentes)`,
    '',
    'Índice para decidir **antes** de escribir markup o crear un componente: si algo de aquí sirve,',
    'se reutiliza. Ionic (`ion-*`) es la base — botones, inputs, listas, modales, toolbars, cards,',
    'tabs, selects, popovers y el app-shell se usan **directamente de Ionic**; OutfitKit solo cubre',
    'lo que Ionic no trae.',
    '',
    '⚠️ Los datos tipados (arrays, objetos, funciones) se pasan **por propiedad JS**',
    '(`el.columns = [...]`), nunca por atributo HTML.',
    '',
  ];

  for (const category of CATEGORIES) {
    const inCategory = documented
      .filter((component) => component.category === category.id)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (inCategory.length === 0) continue;

    lines.push(`## ${category.label} (${inCategory.length})`, '');
    for (const component of inCategory) lines.push(renderEntry(component));
    lines.push('');
  }

  const uncategorised = documented
    .filter((component) => !CATEGORIES.some((category) => category.id === component.category))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (uncategorised.length > 0) {
    lines.push(`## Sin categoría (${uncategorised.length})`, '');
    for (const component of uncategorised) lines.push(renderEntry(component));
    lines.push('');
  }

  lines.push(
    '---',
    '',
    'Además, `@erplora/outfitkit/layout.css` aporta **recetas CSS** (no son componentes):',
    '`.ok-container`, `.ok-grid`/`.ok-col`, `.ok-section`, `.ok-grid-cards`, `.ok-masonry`,',
    '`.ok-form-actions` y `.ok-table-stack` (la tabla que colapsa a tarjetas bajo 768 px).',
    'Regla: geometría y tipografía puras → clase CSS; comportamiento o estado → componente.',
    '',
    'Ejemplos vivos de cada uno (Preview + Código + API): `erplora.github.io/outfitkit`.',
    '',
  );

  return lines.join('\n');
}

async function main() {
  const catalog = await renderComponentCatalog();

  if (process.argv.includes('--check')) {
    const committed = readFileSync(CATALOG_PATH, 'utf8');
    if (committed === catalog) {
      console.log('docs/COMPONENT-CATALOG.md está al día.');
      return;
    }
    console.error(
      'docs/COMPONENT-CATALOG.md está desfasado respecto a showcase/components-data.js.\n' +
        'Regenéralo con `npm run catalog` y commitea el resultado.',
    );
    process.exitCode = 1;
    return;
  }

  writeFileSync(CATALOG_PATH, catalog);
  console.log('docs/COMPONENT-CATALOG.md regenerado.');
}

// Only run as a CLI; the test imports `renderComponentCatalog` directly.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
