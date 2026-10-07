import type { RefObject } from 'react';

import type { InteractionType } from '#/lib/browser/input-modality';

/**
 * where focus moves when the popup opens or closes.
 *
 * - `true`: the default target
 * - `false`: leaves focus alone
 * - ref: the referenced element, or the default target while empty
 * - function: receives the interaction type; returns an element, `true` or `null` for the default target, or
 *   `false`/`undefined` to leave focus alone
 */
export type FocusTarget =
	| boolean
	| RefObject<HTMLElement | null>
	| ((type: InteractionType) => boolean | HTMLElement | null | void);

const CANDIDATES = [
	'a[href]',
	'audio[controls]',
	'button',
	'iframe',
	'input',
	'select',
	'summary',
	'textarea',
	'video[controls]',
	'[contenteditable]',
	'[tabindex]',
].join(',');

const isTabbable = (el: HTMLElement): boolean => {
	return (
		el.tabIndex >= 0 &&
		!el.matches(':disabled') &&
		!el.closest('[inert]') &&
		el.checkVisibility({ visibilityProperty: true })
	);
};

/**
 * @param container element to search
 * @returns elements inside the container reachable with Tab, in tree order
 */
export const getTabbables = (container: Element): HTMLElement[] => {
	return Array.from(container.querySelectorAll<HTMLElement>(CANDIDATES)).filter(isTabbable);
};

/**
 * @param container element to search
 * @returns the first tabbable element inside the container, or the container itself
 */
export const getFirstTabbable = (container: HTMLElement): HTMLElement => {
	return getTabbables(container)[0] ?? container;
};

/**
 * @param reference element to start from
 * @param exclude subtree to skip
 * @returns the first tabbable element after the reference in tree order
 */
export const getNextTabbable = (reference: Element, exclude: Element | null): HTMLElement | undefined => {
	// test position before tabbability, which resolves styles.
	return document.body
		.querySelectorAll<HTMLElement>(CANDIDATES)
		.values()
		.find(
			(el) =>
				!!(reference.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING) &&
				!reference.contains(el) &&
				!exclude?.contains(el) &&
				isTabbable(el),
		);
};

/**
 * @param target focus target option
 * @param type interaction type that opened or closed the popup
 * @param getDefault resolves the default target
 * @returns the element to focus, or `null` to leave focus alone
 */
export const resolveFocusTarget = (
	target: FocusTarget,
	type: InteractionType,
	getDefault: () => HTMLElement | null,
): HTMLElement | null => {
	if (typeof target === 'boolean') {
		return target ? getDefault() : null;
	}
	if (typeof target !== 'function') {
		return target.current ?? getDefault();
	}

	const result = target(type);
	if (result === true || result === null) {
		return getDefault();
	}
	if (result instanceof HTMLElement) {
		return result;
	}
	return null;
};
