import { describe, expect, it } from 'vitest';
import { OkErrorPage } from './ok-error-page.js';

describe('ok-error-page — tokens compartidos', () => {
  it('usa el color muted global antes de recurrir al fallback claro', () => {
    const styles = OkErrorPage.styles.toString();

    expect(styles).toContain(
      '--ink-2: var(--ok-muted, var(--ok-color-medium-shade, var(--ion-color-medium, #5b5f66)))',
    );
  });
});
