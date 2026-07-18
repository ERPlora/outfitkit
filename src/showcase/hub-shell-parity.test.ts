import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readShowcaseFile = (name: string): string =>
  readFileSync(new URL(`../../showcase/pages/${name}`, import.meta.url), 'utf8');

describe('showcase Hub shell — paridad con el Hub real', () => {
  const js = readShowcaseFile('_hub.js');
  const css = readShowcaseFile('_hub.css');

  it('expone una API de página pequeña y carga el tema canónico ERPlora', () => {
    expect(js).toMatch(/export function defineHubPage\s*\(\s*\{/);
    for (const option of ['active', 'title', 'backHref', 'body', 'footer', 'setup']) {
      expect(js).toMatch(new RegExp(`\\b${option}\\b`));
    }
    expect(js).toContain('../../dist/erplora.css');
    expect(js).toContain('./_hub.css');
  });

  it('reproduce la jerarquía del App.vue y la navegación real del Hub', () => {
    expect(js).toContain('<ion-split-pane content-id="main" when="lg"');
    expect(js).toContain('<ion-menu content-id="main" type="overlay" class="dash-menu">');
    expect(js.indexOf('sidebar-user')).toBeLessThan(js.indexOf('sidebar-content'));
    expect(js.indexOf('sidebar-content')).toBeLessThan(js.indexOf('sidebar-foot'));

    for (const route of ['/dashboard', '/employees', '/files', '/billing', '/apps', '/system', '/settings']) {
      expect(js).toContain(`path: '${route}'`);
    }
    expect(js).toContain("path: '/api-docs'");
    expect(js).toContain('erp-lockup');
    expect(js).toContain('erp-wordmark');
  });

  it('reproduce AppTopbar y AppPage sin inventar chrome que el Hub no usa', () => {
    expect(js).toContain('class="ion-page split-pane-main" id="main"');
    expect(js).toContain('<ion-menu-button');
    expect(js).toContain('class="rail-toggle"');
    expect(js).toContain('<ion-title>${escapeHtml(title)}</ion-title>');
    expect(js).toContain('<ok-app-launcher');
    expect(js).toContain('sparkles-outline');
    expect(js).toContain('notifications-outline');
    expect(js).toContain('class="topbar-progress"');
    expect(js).toContain('<ion-content class="ion-padding hub-main-content">');
    // En HTML directo, `fullscreen="false"` seguiría siendo un booleano PRESENTE y Ionic lo
    // interpretaría como true. AppPage pasa false como propiedad Vue, que en estático = omitirlo.
    expect(js).not.toMatch(/<ion-content[^>]*\sfullscreen(?:=|\s|>)/);
    expect(js).toContain('${body}');
    expect(js).toContain('${footer}');

    expect(js).not.toContain('<ion-searchbar');
    expect(js).not.toContain('moon-outline');
    expect(js).not.toContain('sunny-outline');

    const outfitTags = [...js.matchAll(/<\/?(ok-[a-z-]+)/g)].map((match) => match[1]);
    expect(new Set(outfitTags)).toEqual(new Set(['ok-app-launcher']));
  });

  it('conserva geometría responsive, rail y superficie del contenido del Hub', () => {
    expect(css).toContain('--side-width: 240px');
    expect(css).toContain('--side-width: 68px');
    expect(css).toContain('@media (min-width: 992px)');
    expect(css).toContain('.rail-toggle');
    expect(css).toContain('border-radius: 25px');
    expect(css).toContain('.nav-item.selected');
    expect(css).toContain('.sidebar-user');
    expect(css).toContain('.app-topbar');
  });
});
