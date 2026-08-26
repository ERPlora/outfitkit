import { css } from 'lit';

/**
 * Minimum hit area for anything a finger has to press.
 *
 * ERPlora is a POS: the customer's real device is a touchscreen, and the mouse is the rare case.
 * The touch audit of August 2026 found the same defect in 21 components -- a control declared at
 * 6px, 9px, 18px, 28px -- so this is one library decision, not 43 separate patches.
 *
 * It widens the HIT AREA and leaves the DRAWING alone, which is what Apple HIG and Material both
 * ask for: a 9px carousel dot must stay a 9px dot, it just has to be pressable. Growing the boxes
 * instead would inflate every toolbar and pager in the product.
 *
 * Use it on the rule of the control itself, which needs a positioning context:
 *
 *   static styles = [tapTarget, css`
 *     .dot { position: relative; width: 9px; height: 9px; cursor: pointer; }
 *   `];
 *
 * and mark the rule so the guard knows it is covered:
 *   `/* ok-tap-exempt: hit area widened by tapTarget *\/`
 *
 * The floor is `--ok-tap-min` (44px, where Apple HIG, Material and WCAG 2.5.8 agree). A product on a
 * rough counter -- gloves, a wall-mounted screen -- raises the token instead of patching components.
 */
export const tapTarget = css`
  .ok-tap::before,
  [data-ok-tap]::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: max(100%, var(--ok-tap-min, 44px));
    height: max(100%, var(--ok-tap-min, 44px));
  }
`;
