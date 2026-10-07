// imported by `.css.ts` files; keep this module browser-independent

/** `<html>` attribute containing the last pointer type */
export const POINTER_ATTR = 'data-pointer';

/** attribute marking the active press target */
export const PRESSED_ATTR = 'data-pressing';

/** zero-specificity mouse-modality selector */
export const MOUSE = `:where(:root[${POINTER_ATTR}='mouse'])`;

/** zero-specificity non-mouse pointer selector */
export const TOUCH = `:where(:root:not([${POINTER_ATTR}='mouse']))`;

/** active press attribute selector */
export const PRESSED = `[${PRESSED_ATTR}]`;

/** current-element selector for an active press */
export const PRESSING = `&${PRESSED}`;

/** hover selector excluding ancestors of open popups, except tooltips; pair with {@link MOUSE} */
export const HOVER = `:hover:not(:has(:modal, :popover-open:not([popover='hint'])))`;

/**
 * builds a selector for mouse hover ({@link HOVER}) or active press.
 *
 * @param qualifier compound selector applied to both states
 * @returns vanilla-extract selector key
 */
export const hover = (qualifier = ''): string => `${MOUSE} &${HOVER}${qualifier}, ${PRESSING}${qualifier}`;

/**
 * builds a descendant selector for parent hover ({@link HOVER}) or active press.
 *
 * @param parent parent class selector
 * @param qualifier compound selector applied to the parent
 * @returns vanilla-extract selector key
 */
export const hoverWithin = (parent: string, qualifier = ''): string =>
	`${MOUSE} ${parent}${HOVER}${qualifier} &, ${parent}${PRESSED}${qualifier} &`;
