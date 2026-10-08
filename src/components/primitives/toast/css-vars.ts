/** zero-based stack position; closing toasts keep their queue index. */
export const index = '--toast-index';

/** sum of preceding toast heights as a length; excludes gaps. */
export const offsetY = '--toast-offset-y';

/** toast's natural height, as a length; unset until measured. */
export const height = '--toast-height';

/** newest toast's height, as a length; set on the viewport. */
export const frontmostHeight = '--toast-frontmost-height';

/** toast's swipe translation along x, as a length. */
export const swipeMovementX = '--toast-swipe-movement-x';

/** toast's swipe translation along y, as a length. */
export const swipeMovementY = '--toast-swipe-movement-y';
