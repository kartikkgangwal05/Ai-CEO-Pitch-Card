import type { FocusEvent, MouseEvent } from 'react';

/**
 * Spread on an input so focusing it selects its text and typing replaces it.
 * The first mouse-up after focus is cancelled because Safari clears the selection there.
 */
export const selectOnFocus = {
  onFocus: (e: FocusEvent<HTMLInputElement>) => {
    e.currentTarget.select();
    e.currentTarget.dataset.justFocused = '1';
  },
  onMouseUp: (e: MouseEvent<HTMLInputElement>) => {
    if (e.currentTarget.dataset.justFocused) {
      e.preventDefault();
      delete e.currentTarget.dataset.justFocused;
    }
  },
};
