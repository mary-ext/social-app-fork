import type { RefObject } from 'react';

import { getListItems } from './list-navigation';

// ignore quick, stationary releases to avoid activating items beneath the trigger.
const RELEASE_DELAY = 400;
const RELEASE_DRAG_DISTANCE = 8;

const isWithin = (event: PointerEvent, el: Element): boolean => {
	const rect = el.getBoundingClientRect();
	return (
		event.clientX >= rect.left &&
		event.clientX <= rect.right &&
		event.clientY >= rect.top &&
		event.clientY <= rect.bottom
	);
};

export type ReleaseOptions = {
	trigger: Element;
	positionerRef: RefObject<HTMLElement | null>;
	onOutsideRelease: (event: PointerEvent) => void;
};

/**
 * handles release after a drag or hold: clicks a popup item or calls `onOutsideRelease` outside both the
 * trigger and popup.
 *
 * @param press the mousedown that opened the popup
 * @param options popup elements and the outside release callback
 */
export const listenForRelease = (
	press: MouseEvent,
	{ trigger, positionerRef, onOutsideRelease }: ReleaseOptions,
): void => {
	const onPointerUp = (event: PointerEvent) => {
		const target = event.target;
		if (!(target instanceof Element) || trigger.contains(target)) {
			return;
		}
		const dragged =
			Math.hypot(event.clientX - press.clientX, event.clientY - press.clientY) >= RELEASE_DRAG_DISTANCE;
		if (!dragged && event.timeStamp - press.timeStamp < RELEASE_DELAY) {
			return;
		}
		const positioner = positionerRef.current;
		if (!positioner?.contains(target)) {
			// inert triggers cannot receive pointer events, so also check their bounds.
			if (!isWithin(event, trigger)) {
				onOutsideRelease(event);
			}
			return;
		}
		const item = getListItems(positioner).find((candidate) => candidate.contains(target));
		item?.click();
	};

	// Firefox may dispatch the pointerup of a press that is still being handled.
	const timer = setTimeout(() => {
		document.addEventListener('pointerup', onPointerUp, { once: true, capture: true });
	});
	document.addEventListener(
		'pointerdown',
		() => {
			clearTimeout(timer);
			document.removeEventListener('pointerup', onPointerUp, { capture: true });
		},
		{ once: true, capture: true },
	);
};
