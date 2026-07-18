/**
 * Agrupa el catálogo sin inferir productos desde el nombre del ID.
 * El orden es el de la primera aparición, tanto para superficies como secciones.
 */
export function groupPagesBySurface(pages) {
  const surfaces = [];
  const bySurface = new Map();

  for (const page of pages) {
    let surfaceGroup = bySurface.get(page.surface);
    if (!surfaceGroup) {
      surfaceGroup = { surface: page.surface, sections: [] };
      bySurface.set(page.surface, surfaceGroup);
      surfaces.push(surfaceGroup);
    }

    let sectionGroup = surfaceGroup.sections.find((item) => item.section === page.section);
    if (!sectionGroup) {
      sectionGroup = { section: page.section, pages: [] };
      surfaceGroup.sections.push(sectionGroup);
    }
    sectionGroup.pages.push(page);
  }

  return surfaces;
}
