import { LitElement, html, css } from 'lit';
import { property } from 'lit/decorators.js';
import { define } from '../../base/define.js';

// ok-org-chart — organigrama jerárquico (nodo-y-conector), distinto del ok-tree indentado.
// Árbol vertical centrado con líneas de conexión dibujadas en CSS (caída vertical + barra
// horizontal entre hermanos vía ::before/::after). Nodo raíz resaltado con borde degradado,
// nodos hijos con hover-lift, y stack de avatares solapados (+N) opcional por tamaño de equipo.
// Presentacional: solo recibe el árbol por `root` y lo renderiza recursivamente.

/** Un nodo del organigrama (recursivo vía `children`). */
export interface OrgNode {
  /** Identificador único (opcional, útil para keys). */
  id?: string;
  /** Nombre de la persona/unidad. */
  name: string;
  /** Rol o cargo (línea secundaria muted). */
  role?: string;
  /** URL de avatar del propio nodo (no usada en el stack de equipo). */
  avatar?: string;
  /** Tamaño del equipo que reporta a este nodo → genera el stack de avatares (+N). */
  team?: number;
  /** Hijos directos en la jerarquía. */
  children?: OrgNode[];
}

export class OkOrgChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      width: 100%;
      /* Tokens propios estilo Ionic (overridables): --ok-* → --ion-* → hex. */
      --bg: var(--ok-surface, var(--ion-background-color, #fff));
      --node-bg: var(--ok-card-background, var(--ion-card-background, #f7f8fa));
      --root-bg-top: var(--ok-surface-2, var(--ion-color-light, #eef0f4));
      --line: var(--ok-border-color, var(--ion-border-color, #d7dade));
      --line-2: var(--ok-border-color, var(--ion-border-color, #c9ccd2));
      --brand: var(--ok-color-primary, var(--ion-color-primary, #3880ff));
      --brand-soft-line: var(--ok-color-primary-tint, var(--ion-color-primary-tint, #5a98ff));
      --name-color: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --role-color: var(--ok-color-medium, var(--ion-color-medium, #92949c));
      --avatar-bg: var(--ok-surface-3, var(--ion-color-light-shade, #d7dade));
      --avatar-fg: var(--ok-text-color, var(--ion-text-color, #1f2933));
      --radius: var(--ok-radius-md, 10px);
      --dur: 160ms;
      --ease: cubic-bezier(0.4, 0, 0.2, 1);
    }

    .chart {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      padding: 20px;
      overflow-x: auto;
      box-sizing: border-box;
      background: var(--bg);
    }

    /* Cada subárbol: nodo arriba, fila de hijos debajo, centrados. */
    .subtree {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 28px;
      position: relative;
    }

    /* Fila de hijos: barra horizontal (::after) + caída desde el padre (::before). */
    .row {
      display: flex;
      gap: 28px;
      position: relative;
      justify-content: center;
      align-items: flex-start;
    }
    /* Caída vertical desde el nodo padre hacia la barra horizontal. */
    .row::before {
      content: '';
      position: absolute;
      top: -16px;
      left: 50%;
      width: 1px;
      height: 16px;
      background: var(--line-2);
    }
    /* Barra horizontal que une a los hermanos. */
    .row::after {
      content: '';
      position: absolute;
      top: -16px;
      left: 16%;
      right: 16%;
      height: 1px;
      background: var(--line-2);
    }
    /* Si solo hay un hijo no hace falta la barra horizontal. */
    .row.single::after {
      display: none;
    }
    /* Caída vertical desde la barra hacia cada subárbol hijo. */
    .row > .subtree::before {
      content: '';
      position: absolute;
      top: -16px;
      left: 50%;
      width: 1px;
      height: 16px;
      background: var(--line-2);
    }

    .node {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      background: var(--node-bg);
      border: 1px solid var(--line);
      border-radius: var(--radius);
      padding: 10px 14px;
      min-width: 160px;
      box-sizing: border-box;
      text-align: center;
      position: relative;
      transition: border-color var(--dur) var(--ease), transform var(--dur) var(--ease),
        box-shadow var(--dur) var(--ease);
    }
    .node:hover {
      border-color: var(--brand);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    }
    .node.root {
      background: linear-gradient(180deg, var(--root-bg-top), var(--node-bg));
      border-color: var(--brand-soft-line);
    }

    .name {
      font-size: 13px;
      font-weight: 600;
      color: var(--name-color);
      line-height: 1.2;
    }
    .role {
      font-size: 11px;
      color: var(--role-color);
      line-height: 1.2;
    }

    /* Stack de avatares solapados para el tamaño de equipo. */
    .team {
      display: inline-flex;
      align-items: center;
      margin-top: 4px;
    }
    .avatar {
      display: inline-grid;
      place-items: center;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--avatar-bg);
      color: var(--avatar-fg);
      font-size: 9px;
      font-weight: 600;
      letter-spacing: -0.02em;
      overflow: hidden;
      flex-shrink: 0;
      border: 1px solid var(--bg);
      box-sizing: border-box;
    }
    .avatar + .avatar {
      margin-left: -4px;
    }
    .avatar.more {
      background: var(--avatar-bg);
      color: var(--role-color);
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `;

  /** Nodo raíz del organigrama (con `children` recursivos). */
  @property({ attribute: false }) root: OrgNode | null = null;

  /** Máximo de avatares mostrados en el stack antes del «+N» (resto). */
  @property({ type: Number }) maxAvatars = 3;

  /** Renderiza el stack de avatares (+N) para el tamaño de equipo de un nodo. */
  private renderTeam(node: OrgNode): unknown {
    const total = node.team ?? 0;
    if (total <= 0) return null;
    // Mostramos hasta `maxAvatars` huecos y un chip «+N» con el resto.
    const shown = Math.min(this.maxAvatars, total);
    const rest = total - shown;
    const initials = (node.role ?? node.name)
      .replace(/[^A-Za-zÀ-ÿ ]/g, '')
      .split(/\s+/)
      .filter(Boolean);
    return html`
      <div class="team" aria-label="Equipo de ${total}">
        ${Array.from({ length: shown }, (_v, i) => {
          // Iniciales decorativas a partir de las palabras del rol/nombre.
          const seed = initials[i % Math.max(initials.length, 1)] ?? '';
          const label = seed ? seed.slice(0, 2).toUpperCase() : '·';
          return html`<span class="avatar" aria-hidden="true">${label}</span>`;
        })}
        ${rest > 0
          ? html`<span class="avatar more" aria-hidden="true">+${rest}</span>`
          : null}
      </div>
    `;
  }

  /** Renderiza un nodo y, recursivamente, su fila de hijos como un subárbol. */
  private renderSubtree(node: OrgNode, isRoot: boolean): unknown {
    const children = node.children ?? [];
    return html`
      <div class="subtree">
        <div class="node ${isRoot ? 'root' : ''}" role="treeitem">
          ${node.avatar
            ? html`<span class="avatar" style="width:32px;height:32px;font-size:11px">
                <img src=${node.avatar} alt="" />
              </span>`
            : null}
          <span class="name">${node.name}</span>
          ${node.role ? html`<span class="role">${node.role}</span>` : null}
          ${this.renderTeam(node)}
        </div>
        ${children.length
          ? html`
              <div class="row ${children.length === 1 ? 'single' : ''}" role="group">
                ${children.map((c) => this.renderSubtree(c, false))}
              </div>
            `
          : null}
      </div>
    `;
  }

  render(): unknown {
    if (!this.root) return html`<div class="chart" role="tree"></div>`;
    return html`
      <div class="chart" role="tree" aria-label="Organigrama">
        ${this.renderSubtree(this.root, true)}
      </div>
    `;
  }
}

define('ok-org-chart', OkOrgChart);

declare global {
  interface HTMLElementTagNameMap {
    'ok-org-chart': OkOrgChart;
  }
}
