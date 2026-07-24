// @vitest-environment happy-dom

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../base/icons.js', () => ({
  iconCalendarOutline: '<svg></svg>',
  iconChevronBack: '<svg></svg>',
  iconChevronDownOutline: '<svg></svg>',
  iconChevronForward: '<svg></svg>',
  iconChevronUpOutline: '<svg></svg>',
  iconClose: '<svg></svg>',
  iconEllipsisVertical: '<svg></svg>',
  iconFileTrayOutline: '<svg></svg>',
  iconSwapVerticalOutline: '<svg></svg>',
  okIcon: (value?: string) => value,
}));

import './ok-data-table.js';

describe('ok-data-table document locale defaults', () => {
  beforeEach(() => {
    document.body.replaceChildren();
    document.documentElement.lang = 'en';
  });

  it('uses Spanish chrome when the host document is Spanish', async () => {
    document.documentElement.lang = 'es';
    const table = document.createElement('ok-data-table') as unknown as HTMLElement & {
      rows: Array<Record<string, unknown>>;
      columns: Array<Record<string, unknown>>;
    };
    table.rows = [];
    table.columns = [{ key: 'name', header: 'Nombre' }];
    table.setAttribute('searchable', '');
    document.body.appendChild(table);
    await (table as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const text = table.shadowRoot?.textContent ?? '';
    expect(text).toContain('registros');
    expect(text).not.toContain('records');
  });

  it('reacts when the shell changes locale', async () => {
    const table = document.createElement('ok-data-table') as unknown as HTMLElement & {
      rows: Array<Record<string, unknown>>;
      columns: Array<Record<string, unknown>>;
    };
    table.rows = [];
    table.columns = [{ key: 'name', header: 'Name' }];
    document.body.appendChild(table);
    await (table as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(table.shadowRoot?.textContent ?? '').toContain('records');

    document.documentElement.lang = 'es';
    window.dispatchEvent(new CustomEvent('erplora:locale-changed'));
    await (table as unknown as { updateComplete: Promise<unknown> }).updateComplete;
    expect(table.shadowRoot?.textContent ?? '').toContain('registros');
  });

  it('gives icon-only row actions an accessible name', async () => {
    const table = document.createElement('ok-data-table') as unknown as HTMLElement & {
      rows: Array<Record<string, unknown>>;
      columns: Array<Record<string, unknown>>;
      actions: Array<Record<string, unknown>>;
    };
    table.rows = [{ id: '1', name: 'Ada' }];
    table.columns = [{ key: 'name', header: 'Name' }];
    table.actions = [{ id: 'edit', label: 'Edit', icon: 'create-outline' }];
    document.body.appendChild(table);
    await (table as unknown as { updateComplete: Promise<unknown> }).updateComplete;

    const action = table.shadowRoot?.querySelector('ion-button[aria-label="Edit"]');
    expect(action).toBeTruthy();
    expect(action?.getAttribute('title')).toBe('Edit');
  });

  it('keeps row and toolbar touch targets at least 44px on tablet and mobile', () => {
    const ctor = customElements.get('ok-data-table') as unknown as {
      styles: { cssText: string };
    };
    expect(ctor.styles.cssText).toContain('@media (pointer: coarse), (max-width: 834px)');
    expect(ctor.styles.cssText).toContain('.actions ion-button { min-width: 44px; min-height: 44px;');
    expect(ctor.styles.cssText).toContain('.toolbtn { width: 44px; height: 44px;');
  });
});
