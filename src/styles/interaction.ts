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

/**
 * builds a selector for mouse hover or active press
 *
 * @param qualifier compound selector applied to both states
 * @returns vanilla-extract selector key
 */
export const hover = (qualifier = ''): string => `${MOUSE} &:hover${qualifier}, ${PRESSING}${qualifier}`;

/**
 * builds a descendant selector for parent hover or active press
 *
 * @param parent parent class selector
 * @param qualifier compound selector applied to the parent
 * @returns vanilla-extract selector key
 */
export const hoverWithin = (parent: string, qualifier = ''): string =>
	`${MOUSE} ${parent}:hover${qualifier} &, ${parent}${PRESSED}${qualifier} &`;
