import { type HTMLAttributes, type RefObject, useRef } from 'react';

import { type InteractionType, toInteractionType } from '#/lib/browser/input-modality';

import { isWithinPopup } from './anchored-popup';
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

const swallow = (event: MouseEvent) => {
	event.stopPropagation();
	event.preventDefault();
};

// suppress the follow-up click on the press/release targets' common ancestor to avoid activating the row.
const swallowNextClick = (): void => {
	window.addEventListener('click', swallow, { once: true, capture: true });
	setTimeout(() => {
		window.removeEventListener('click', swallow, { capture: true });
	});
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
		if (!positioner || !isWithinPopup(positioner, target)) {
			// inert triggers cannot receive pointer events, so also check their bounds.
			if (!isWithin(event, trigger)) {
				onOutsideRelease(event);
				swallowNextClick();
			}
			return;
		}
		const item = getListItems(positioner).find((candidate) => candidate.contains(target));
		item?.click();
		swallowNextClick();
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

export type ListTriggerPressOptions = {
	open: boolean;
	/** `undefined` while no popup is attached. */
	positionerRef: RefObject<HTMLElement | null> | undefined;
	/**
	 * requests a toggle on mouse/pen mousedown, or click for touch, keyboard, and draggable triggers.
	 *
	 * @param event source event
	 * @param method input type
	 */
	onPress: (event: Event, method: InteractionType) => void;
	/**
	 * requests opening with Up or Down.
	 *
	 * @param event source event
	 * @param entry item to focus
	 */
	onArrowOpen: (event: Event, entry: 'first' | 'last') => void;
	/**
	 * requests closing after an outside drag or hold release.
	 *
	 * @param event pointer release outside both trigger and popup
	 */
	onOutsideRelease: (event: PointerEvent) => void;
};

/**
 * handles list-popup activation and drag-to-select.
 *
 * @param options popup state and callbacks
 * @returns props for the trigger
 */
export const useListTriggerPress = ({
	open,
	positionerRef,
	onPress,
	onArrowOpen,
	onOutsideRelease,
}: ListTriggerPressOptions): HTMLAttributes<HTMLElement> => {
	const pointerTypeRef = useRef<InteractionType>('');
	const pressToggledRef = useRef(false);

	return {
		onPointerDown(event) {
			pointerTypeRef.current = toInteractionType(event.pointerType);
			pressToggledRef.current = false;
		},
		onMouseDown(event) {
			if (event.button !== 0 || pointerTypeRef.current === 'touch') {
				return;
			}
			// preventing mousedown would cancel a native drag, so draggable triggers open on click.
			if (event.currentTarget.closest('[draggable="true"]')) {
				return;
			}
			// keep native mousedown focus from competing with popup focus.
			event.preventDefault();
			pressToggledRef.current = true;

			onPress(event.nativeEvent, pointerTypeRef.current || 'mouse');
			if (!open && positionerRef) {
				listenForRelease(event.nativeEvent, {
					trigger: event.currentTarget,
					positionerRef,
					onOutsideRelease,
				});
			}
		},
		onClick(event) {
			// keyboard activation dispatches a click without a press.
			const keyboard = event.detail === 0;
			if (!keyboard && pressToggledRef.current) {
				pressToggledRef.current = false;
				return;
			}
			onPress(event.nativeEvent, keyboard ? 'keyboard' : pointerTypeRef.current || 'mouse');
		},
		onKeyDown(event) {
			if (!open && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
				event.preventDefault();
				onArrowOpen(event.nativeEvent, event.key === 'ArrowDown' ? 'first' : 'last');
			}
		},
	};
};
