// @vitest-environment happy-dom
//
// outfitkit#201 (from hub#2198) — on a phone the file manager was used blind:
//   1. every card floated its 5 row actions (5 × 28px + gaps = 148px) over the thumbnail, on a card
//      whose content box is ~134px at 390px — the row covered the badge and spilled past the edge;
//   2. «Move to…» opened an ion-popover anchored to the tapped button, and Ionic squeezes a popover
//      into whatever is left BELOW the anchor: a card low on a 640px screen left ~150px, three
//      folders visible and the rest off-screen.
//
// Contract (what Google Drive, Dropbox and OneDrive do on a phone): a card carries ONE «⋮» button
// that opens a bottom sheet with the actions by name, and «Move to…» is a bottom sheet tall enough
// for the folder list (full height when it is long) that scrolls on its own. Desktop is unchanged:
// hover actions on the card and the popover anchored to the button (outfitkit#185).
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../base/icons.js", () => ({
  iconChevronForwardOutline: "<svg/>",
  iconFolderOpenOutline: "<svg/>",
  okIcon: () => "<svg/>",
}));

import "./ok-file-manager.js";
import { OkFileManager } from "./ok-file-manager.js";
import type { OkFmFile, OkFmFolder, OkFmPolicy } from "./ok-file-manager.js";

type Host = HTMLElement & {
  files: OkFmFile[];
  folders: OkFmFolder[];
  selected: string;
  view: "grid" | "list";
  policy?: OkFmPolicy;
  updateComplete: Promise<unknown>;
};

type Sheet = HTMLElement & {
  isOpen?: boolean;
  breakpoints?: number[];
  initialBreakpoint?: number;
  expandToScroll?: boolean;
};

const FILE: OkFmFile = {
  id: "fotos/a.jpg",
  name: "a.jpg",
  ext: "jpg",
  url: "/raw?path=fotos/a.jpg",
};
const FOLDERS: OkFmFolder[] = [
  {
    id: "",
    label: "media",
    children: [
      { id: "fotos", label: "fotos" },
      { id: "facturas", label: "facturas" },
      { id: "_logs", label: "_logs", readOnly: true },
    ],
  },
];

/** happy-dom has no matchMedia: the viewport is whatever this stub says. */
function viewport(compact: boolean): void {
  (window as unknown as { matchMedia: unknown }).matchMedia = (q: string) => ({
    media: q,
    matches: compact && /max-width:\s*768px/.test(q),
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

async function mount(
  opts: {
    view?: "grid" | "list";
    policy?: OkFmPolicy;
    folders?: OkFmFolder[];
  } = {},
): Promise<Host> {
  const el = document.createElement("ok-file-manager") as Host;
  el.folders = opts.folders ?? FOLDERS;
  el.files = [FILE];
  el.selected = "fotos";
  el.view = opts.view ?? "grid";
  if (opts.policy) el.policy = opts.policy;
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

const root = (el: Host) => el.shadowRoot!;
const btn = (el: Host, act: string, scope = "") =>
  root(el).querySelector<HTMLElement>(`${scope} [data-act="${act}"]`.trim());
const sheet = (el: Host) => root(el).querySelector<Sheet>("ion-modal.fm-sheet");
const sheetActs = (el: Host) =>
  Array.from(
    root(el).querySelectorAll<HTMLElement>(
      "ion-modal.fm-sheet [data-sheet-act]",
    ),
  );
const moveTargets = (el: Host) =>
  Array.from(
    root(el).querySelectorAll<HTMLElement>(
      "ion-modal.fm-sheet [data-move-target]",
    ),
  );

/** What Ionic does once the dismiss animation is over. */
async function finishDismiss(el: Host): Promise<void> {
  sheet(el)!.dispatchEvent(new CustomEvent("didDismiss"));
  await el.updateComplete;
}

function stylesText(): string {
  const styles = OkFileManager.styles;
  const list = Array.isArray(styles) ? styles : [styles];
  return list.map((s) => (s as { cssText: string }).cssText).join("\n");
}

/** Body of the `@media (max-width: 768px)` block that stacks the layout on a phone. */
function compactBlock(css: string): string {
  const start = css.indexOf("@media (max-width: 768px)");
  expect(
    start,
    "@media (max-width: 768px) block not found",
  ).toBeGreaterThanOrEqual(0);
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}" && --depth === 0) return css.slice(start, i);
  }
  throw new Error("unterminated @media block");
}

beforeEach(() => {
  document.body.innerHTML = "";
  document.documentElement.lang = "en";
  viewport(true);
});
afterEach(() => {
  delete (window as unknown as { matchMedia?: unknown }).matchMedia;
});

describe("ok-file-manager · card on a phone: one «⋮», nothing over the thumbnail (outfitkit#201)", () => {
  it("every card carries a «⋮» button named after what it does", async () => {
    const el = await mount();
    const more = btn(el, "more", ".card");
    expect(more, "no «⋮» button on the card").not.toBeNull();
    expect(more!.getAttribute("aria-label")).toBe("More actions");
  });

  it("on a phone the card shows only «⋮»; the five row actions stay for the desktop hover", () => {
    const compact = compactBlock(stylesText());
    expect(compact).toMatch(
      /\.card-actions\s+\.action:not\(\.more\)\s*\{[^}]*display:\s*none/,
    );
    expect(compact).toMatch(
      /\.card-actions\s+\.action\.more\s*\{[^}]*display:\s*inline-flex/,
    );
    // Outside the phone block the «⋮» is hidden: desktop keeps its hover actions untouched.
    const outside = stylesText().replace(compact, "");
    expect(outside).toMatch(/\.action\.more\s*\{[^}]*display:\s*none/);
  });

  it("the lone «⋮» gets the full 44px hit area (it has no neighbour to protect)", () => {
    const css = stylesText();
    const m = /\.action\.more\.ok-tap::before\s*\{([^}]*)\}/.exec(css);
    expect(m, ".action.more.ok-tap::before rule not found").not.toBeNull();
    expect(m![1]).toMatch(/display:\s*block/);
    expect(m![1]).toMatch(
      /width:\s*max\(100%,\s*var\(--ok-tap-min,\s*44px\)\)/,
    );
    expect(m![1]).toMatch(
      /height:\s*max\(100%,\s*var\(--ok-tap-min,\s*44px\)\)/,
    );
  });
});

describe("ok-file-manager · «⋮» opens a bottom sheet with the actions by name (outfitkit#201)", () => {
  it("tapping «⋮» opens a sheet titled with the file, listing every action the folder allows", async () => {
    const el = await mount();
    expect(sheet(el)?.isOpen ?? false).toBe(false);
    expect(sheetActs(el)).toEqual([]);

    btn(el, "more", ".card")!.click();
    await el.updateComplete;

    const s = sheet(el)!;
    expect(s, "no sheet opened").not.toBeNull();
    expect(s.isOpen).toBe(true);
    expect(s.initialBreakpoint).toBeGreaterThan(0);
    expect(s.breakpoints).toContain(s.initialBreakpoint);
    expect(s.querySelector("ion-title")?.textContent?.trim()).toBe("a.jpg");
    expect(sheetActs(el).map((n) => n.dataset.sheetAct)).toEqual([
      "open",
      "download",
      "move-file",
      "rename-file",
      "delete-file",
    ]);
    expect(sheetActs(el).map((n) => n.textContent?.trim())).toEqual([
      "Open",
      "Download",
      "Move to…",
      "Rename",
      "Delete",
    ]);
  });

  it("the sheet obeys the folder policy exactly like the row actions do", async () => {
    const el = await mount({
      policy: { upload: false, rename: false, delete: false },
    });
    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    expect(sheetActs(el).map((n) => n.dataset.sheetAct)).toEqual([
      "open",
      "download",
      "move-file",
    ]);
  });

  it.each([
    ["open", "ok-open", { id: "fotos/a.jpg" }],
    [
      "download",
      "ok-download",
      { id: "fotos/a.jpg", url: "/raw?path=fotos/a.jpg" },
    ],
    [
      "rename-file",
      "ok-rename",
      { id: "fotos/a.jpg", name: "a.jpg", kind: "file" },
    ],
    ["delete-file", "ok-delete", { id: "fotos/a.jpg", kind: "file" }],
  ])(
    "«%s» in the sheet emits %s with the row contract and closes the sheet",
    async (act, event, detail) => {
      const el = await mount();
      const spy = vi.fn();
      el.addEventListener(event, (e) => spy((e as CustomEvent).detail));
      btn(el, "more", ".card")!.click();
      await el.updateComplete;

      sheetActs(el)
        .find((n) => n.dataset.sheetAct === act)!
        .click();
      await el.updateComplete;

      expect(spy).toHaveBeenCalledWith(detail);
      expect(sheet(el)!.isOpen).toBe(false);
      await finishDismiss(el);
      expect(sheet(el)!.isOpen).toBe(false);
      expect(sheetActs(el)).toEqual([]);
    },
  );

  it("dismissing the sheet (swipe down, backdrop) leaves nothing behind and emits nothing", async () => {
    const el = await mount();
    const spy = vi.fn();
    for (const ev of [
      "ok-open",
      "ok-download",
      "ok-rename",
      "ok-delete",
      "ok-move",
    ])
      el.addEventListener(ev, spy);
    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    await finishDismiss(el);
    expect(sheet(el)!.isOpen).toBe(false);
    expect(sheetActs(el)).toEqual([]);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("ok-file-manager · «Move to…» on a phone is a sheet the list fits in (outfitkit#201)", () => {
  it("«Move to…» from the «⋮» sheet closes it and opens the folder list, without read-only folders", async () => {
    const el = await mount();
    btn(el, "more", ".card")!.click();
    await el.updateComplete;

    sheetActs(el)
      .find((n) => n.dataset.sheetAct === "move-file")!
      .click();
    await el.updateComplete;
    expect(sheet(el)!.isOpen).toBe(false);
    await finishDismiss(el);

    const s = sheet(el)!;
    expect(s.isOpen).toBe(true);
    expect(s.querySelector("ion-title")?.textContent?.trim()).toBe("Move to…");
    expect(moveTargets(el).map((n) => n.dataset.moveTarget)).toEqual([
      "",
      "fotos",
      "facturas",
    ]);
  });

  it("choosing a folder emits ok-move {from,to} — the drag&drop contract — and closes the sheet", async () => {
    const el = await mount({ view: "list" });
    const moved = vi.fn();
    el.addEventListener("ok-move", (e) => moved((e as CustomEvent).detail));
    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;

    moveTargets(el)
      .find((n) => n.dataset.moveTarget === "facturas")!
      .click();
    await el.updateComplete;

    expect(moved).toHaveBeenCalledWith({ from: "fotos/a.jpg", to: "facturas" });
    expect(sheet(el)!.isOpen).toBe(false);
  });

  it("on a phone the row «Move to…» opens the sheet, not a popover squeezed under the button", async () => {
    const el = await mount({ view: "list" });
    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;
    expect(
      (root(el).querySelector("ion-popover") as Sheet | null)?.isOpen ?? false,
    ).toBe(false);
    expect(sheet(el)?.isOpen).toBe(true);
    expect(moveTargets(el).length).toBe(3);
  });

  it("on a desktop the row «Move to…» keeps the popover anchored to the button (outfitkit#185)", async () => {
    viewport(false);
    const el = await mount({ view: "list" });
    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;
    expect((root(el).querySelector("ion-popover") as Sheet | null)?.isOpen).toBe(
      true,
    );
    expect(sheet(el)?.isOpen ?? false).toBe(false);
  });

  it("a short list opens at a height that shows all of it; the list scrolls inside the sheet", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 640,
    });
    const el = await mount({ view: "list" });
    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;

    const s = sheet(el)!;
    // 3 destinations must fit: at least the toolbar plus three 48px rows, and less than full height.
    expect(s.initialBreakpoint! * 640).toBeGreaterThanOrEqual(56 + 3 * 48);
    expect(s.initialBreakpoint).toBeLessThan(1);
    expect(s.breakpoints).toEqual([0, s.initialBreakpoint, 1]);
    expect(s.expandToScroll).toBe(false);
  });

  it("a long list opens at full height", async () => {
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: 640,
    });
    const many: OkFmFolder[] = [
      {
        id: "",
        label: "media",
        children: Array.from({ length: 17 }, (_, i) => ({
          id: `c${i}`,
          label: `c${i}`,
        })),
      },
    ];
    const el = await mount({ view: "list", folders: many });
    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;

    const s = sheet(el)!;
    expect(s.initialBreakpoint).toBe(1);
    expect(s.breakpoints).toEqual([0, 1]);
  });
});

describe("ok-file-manager · the sheet is ONE ion-modal that never leaves the template (outfitkit#201)", () => {
  // Ionic moves an inline ion-modal to ion-app while it is presented, leaving a comment where it
  // was, and puts it back AFTER emitting didDismiss. If the template drops the modal on didDismiss,
  // Lit removes that comment first and Ionic throws «Cannot read properties of null (reading
  // 'insertBefore')». So the modal stays mounted and only `isOpen` and its content change.
  it("open → dismiss → reopen → move reuses the very same ion-modal node", async () => {
    const el = await mount();
    const first = sheet(el);
    expect(first, "the sheet modal must be rendered up front, closed").not.toBeNull();

    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    expect(sheet(el)).toBe(first);
    await finishDismiss(el);
    expect(sheet(el)).toBe(first);

    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    sheetActs(el)
      .find((n) => n.dataset.sheetAct === "move-file")!
      .click();
    await el.updateComplete;
    await finishDismiss(el);
    expect(sheet(el)).toBe(first);
    expect(sheet(el)!.isOpen).toBe(true);
    expect(moveTargets(el).length).toBe(3);
  });
});

describe("ok-file-manager · the desktop «Move to…» popover never leaves the template either (outfitkit#201)", () => {
  // Same Ionic mechanics as the sheet: picking a folder used to drop the ion-popover from the
  // template while Ionic was still putting it back, and the console showed the insertBefore error.
  it("open → pick → dismiss → reopen reuses the very same ion-popover node", async () => {
    viewport(false);
    const el = await mount({ view: "list" });
    const pop = () => root(el).querySelector<Sheet>("ion-popover");
    const first = pop();
    expect(first, "the popover must be rendered up front, closed").not.toBeNull();
    expect(first!.isOpen).toBe(false);

    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;
    expect(pop()).toBe(first);
    expect(pop()!.isOpen).toBe(true);

    const moved = vi.fn();
    el.addEventListener("ok-move", (e) => moved((e as CustomEvent).detail));
    pop()!
      .querySelector<HTMLElement>('[data-move-target="facturas"]')!
      .click();
    await el.updateComplete;
    expect(moved).toHaveBeenCalledWith({ from: "fotos/a.jpg", to: "facturas" });
    expect(pop()).toBe(first);
    expect(pop()!.isOpen).toBe(false);

    pop()!.dispatchEvent(new CustomEvent("didDismiss"));
    await el.updateComplete;
    expect(pop()).toBe(first);
    expect(pop()!.querySelectorAll("[data-move-target]").length).toBe(0);

    btn(el, "move-file", ".lrow")!.click();
    await el.updateComplete;
    expect(pop()).toBe(first);
    expect(pop()!.isOpen).toBe(true);
  });
});

describe("ok-file-manager · sheet texts follow the language (outfitkit#201)", () => {
  it("«⋮» and the sheet close button read in Spanish on an es document and can be overridden", async () => {
    document.documentElement.lang = "es";
    const el = await mount();
    expect(btn(el, "more", ".card")!.getAttribute("aria-label")).toBe(
      "Más acciones",
    );
    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    expect(
      sheet(el)!
        .querySelector('[data-act="close-sheet"]')!
        .getAttribute("aria-label"),
    ).toBe("Cerrar");

    (el as unknown as { labels: Record<string, string> }).labels = {
      more: "Opciones",
      close: "Salir",
    };
    await el.updateComplete;
    expect(btn(el, "more", ".card")!.getAttribute("aria-label")).toBe(
      "Opciones",
    );
    expect(
      sheet(el)!
        .querySelector('[data-act="close-sheet"]')!
        .getAttribute("aria-label"),
    ).toBe("Salir");
  });

  it("the sheet close button closes it", async () => {
    const el = await mount();
    btn(el, "more", ".card")!.click();
    await el.updateComplete;
    sheet(el)!.querySelector<HTMLElement>('[data-act="close-sheet"]')!.click();
    await el.updateComplete;
    expect(sheet(el)!.isOpen).toBe(false);
  });
});
