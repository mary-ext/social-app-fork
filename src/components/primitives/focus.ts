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
 * @returns the first tabbable element inside the container, or the container itself
 */
export const getFirstTabbable = (container: HTMLElement): HTMLElement => {
	return container.querySelectorAll<HTMLElement>(CANDIDATES).values().find(isTabbable) ?? container;
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
 * call before containing popups close; their triggers' `aria-controls` links disappear on close.
 *
 * @param opener element that opened the popup
 * @returns the opener, then the trigger of each open popup containing it, innermost first
 */
export const getReturnFocusChain = (opener: HTMLElement): HTMLElement[] => {
	const triggers = new Map<string, HTMLElement>();
	for (const trigger of document.querySelectorAll<HTMLElement>('[aria-controls]')) {
		for (const id of trigger.getAttribute('aria-controls')!.split(' ')) {
			triggers.set(id, trigger);
		}
	}

	const chain = [opener];
	for (let node = opener.parentElement; node !== null; node = node.parentElement) {
		const trigger = node.id ? triggers.get(node.id) : undefined;
		if (trigger) {
			chain.push(trigger);
		}
	}
	return chain;
};

/**
 * @param chain candidates from {@link getReturnFocusChain}
 * @returns the first connected, visible candidate, or `null`
 */
export const findReturnFocus = (chain: readonly HTMLElement[]): HTMLElement | null => {
	return chain.find((el) => el.isConnected && el.checkVisibility({ visibilityProperty: true })) ?? null;
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
