import { useEffect, useLayoutEffect } from 'react';

import { INTERACTIVE_SELECTOR } from '#/lib/browser/interactive';

import { getDisplacement, resist, SWIPE_IGNORE_ATTRIBUTE, type SwipeDirection } from '../swipe';
import { swipeMovementX, swipeMovementY, swipeProgress, swipeStrength } from './css-vars';
import { CONTENT_ATTRIBUTE, type RootContextValue } from './shared';

// #region tuning

// mouse drag threshold, in pixels.
const MOUSE_SLOP = 4;
// touch travel needed to distinguish dragging from cross-axis scrolling, in pixels.
const AXIS_LOCK_SLOP = 6;
// cross-axis travel must exceed axial travel by this margin before yielding to scrolling, in pixels.
const AXIS_LOCK_BIAS = 2;

// minimum flick velocity for dismissal, in pixels per millisecond.
const FAST_VELOCITY = 0.5;
// a reversal at or below this velocity cancels distance-based dismissal, in pixels per millisecond.
const REVERSE_VELOCITY = -0.2;
// distance threshold as a fraction of the popup's size.
const DISMISS_FRACTION = 0.5;

// velocity sampling window, in milliseconds.
const VELOCITY_WINDOW = 80;
const MIN_VELOCITY_DURATION = 16;

const MIN_RELEASE_VELOCITY = 0.2;
const MAX_RELEASE_VELOCITY = 4;
const MIN_RELEASE_DURATION = 80;
const MAX_RELEASE_DURATION = 360;
const MIN_STRENGTH = 0.1;

// trailing-click suppression window after a drag, in milliseconds.
const CLICK_SUPPRESSION = 300;

// #endregion

// #region css variables

// non-inheriting properties avoid restyling descendants on every drag update.
for (const [name, syntax, initialValue] of [
	[swipeMovementX, '<length>', '0px'],
	[swipeMovementY, '<length>', '0px'],
	[swipeProgress, '<number>', '0'],
	[swipeStrength, '<number>', '1'],
] as const) {
	try {
		CSS.registerProperty({ name, syntax, inherits: false, initialValue });
	} catch {
		// HMR may have registered these already.
	}
}

// #endregion

// preserve text selection and control interaction for mouse drags; touch can still swipe through content.
const MOUSE_IGNORE_SELECTOR = `${INTERACTIVE_SELECTOR}, input, label, select, textarea, [contenteditable], [${CONTENT_ATTRIBUTE}], [${SWIPE_IGNORE_ATTRIBUTE}]`;
const TOUCH_IGNORE_SELECTOR = `input[type="range"], [${SWIPE_IGNORE_ATTRIBUTE}]`;

type Axis = 'x' | 'y';

type Gesture = {
	/** pointer id for mouse and pen, touch identifier for touch. */
	id: number;
	touch: boolean;
	state: 'dragging' | 'pending';
	startX: number;
	startY: number;
	/** drag origin, reset when claimed to avoid a jump. */
	originX: number;
	originY: number;
	/** nearest ancestor scrolling along the drawer's axis. */
	scroller: HTMLElement | null;
	/** whether an ancestor scrolls across the drawer's axis. */
	crossScrollable: boolean;
	/** popup size along the drawer's axis, measured when dragging begins. */
	size: number;
	/** undamped travel toward dismissal. */
	travel: number;
	samples: { time: number; travel: number }[];
};

const getAxis = (direction: SwipeDirection): Axis => {
	return direction === 'left' || direction === 'right' ? 'x' : 'y';
};

const canScroll = (el: HTMLElement, style: CSSStyleDeclaration, axis: Axis): boolean => {
	const overflow = axis === 'x' ? style.overflowX : style.overflowY;
	if (overflow !== 'auto' && overflow !== 'scroll') {
		return false;
	}
	return axis === 'x' ? el.scrollWidth > el.clientWidth : el.scrollHeight > el.clientHeight;
};

const findScrollers = (
	target: Element,
	popup: HTMLElement,
	axis: Axis,
): Pick<Gesture, 'crossScrollable' | 'scroller'> => {
	const crossAxis: Axis = axis === 'x' ? 'y' : 'x';
	let scroller: HTMLElement | null = null;
	let crossScrollable = false;
	for (let el: Element | null = target; el; el = el.parentElement) {
		if (el instanceof HTMLElement) {
			const style = getComputedStyle(el);
			if (!scroller && canScroll(el, style, axis)) {
				scroller = el;
			}
			crossScrollable ||= canScroll(el, style, crossAxis);
		}
		if (el === popup || (scroller && crossScrollable)) {
			break;
		}
	}
	return { scroller, crossScrollable };
};

const isAtDismissEdge = (scroller: HTMLElement, direction: SwipeDirection): boolean => {
	// fractional scroll offsets can stop short of the maximum.
	switch (direction) {
		case 'down': {
			return scroller.scrollTop <= 0;
		}
		case 'up': {
			return scroller.scrollTop >= scroller.scrollHeight - scroller.clientHeight - 1;
		}
		case 'right': {
			return scroller.scrollLeft <= 0;
		}
		case 'left': {
			return scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 1;
		}
	}
};

const hasSelectionWithin = (el: HTMLElement): boolean => {
	const selection = document.getSelection();
	return (
		!!selection &&
		!selection.isCollapsed &&
		(el.contains(selection.anchorNode) || el.contains(selection.focusNode))
	);
};

const clearSwipe = (elements: (HTMLElement | null)[], properties: readonly string[]): void => {
	for (const el of elements) {
		el?.removeAttribute('data-swipe-dismiss');
		for (const property of properties) {
			el?.style.removeProperty(property);
		}
	}
};

const damp = (travel: number): number => {
	return travel >= 0 ? travel : resist(travel);
};

// positive velocity is toward dismissal, in pixels per millisecond.
const getReleaseVelocity = (samples: Gesture['samples'], releaseTime: number): number => {
	const last = samples.at(-1);
	if (!last || releaseTime - last.time > VELOCITY_WINDOW) {
		return 0;
	}
	const first = samples.find((sample) => sample.time >= last.time - VELOCITY_WINDOW) ?? last;
	return (last.travel - first.travel) / Math.max(last.time - first.time, MIN_VELOCITY_DURATION);
};

const getStrength = (remaining: number, velocity: number): number => {
	if (velocity <= MIN_RELEASE_VELOCITY || remaining <= 0) {
		return 1;
	}
	const clamped = Math.min(velocity, MAX_RELEASE_VELOCITY);
	const duration = Math.min(Math.max(remaining / clamped, MIN_RELEASE_DURATION), MAX_RELEASE_DURATION);
	const normalized = (duration - MIN_RELEASE_DURATION) / (MAX_RELEASE_DURATION - MIN_RELEASE_DURATION);
	return MIN_STRENGTH + normalized * (1 - MIN_STRENGTH);
};

/**
 * handles drag-to-dismiss. touch yields to scrolling unless the scroller is at its dismissal edge.
 *
 * @param ctx the drawer's state; the viewport must be mounted
 */
export const useSwipeDismiss = (ctx: RootContextValue): void => {
	const { open, swipeDirection, viewportRef, popupRef, backdropRef, setOpen } = ctx;

	// clear the previous swipe even when reopening mid-exit.
	useLayoutEffect(() => {
		if (!open) {
			return;
		}
		clearSwipe(
			[popupRef.current, backdropRef.current],
			[swipeMovementX, swipeMovementY, swipeProgress, swipeStrength],
		);
	}, [open, popupRef, backdropRef]);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport || !open) {
			return;
		}

		const axis = getAxis(swipeDirection);

		let gesture: Gesture | null = null;
		// expire suppression so a later keyboard click isn't swallowed.
		let suppressClickUntil = -Infinity;

		const setSwiping = (swiping: boolean): void => {
			popupRef.current?.toggleAttribute('data-swiping', swiping);
			backdropRef.current?.toggleAttribute('data-swiping', swiping);
		};

		const applyTravel = (current: Gesture): void => {
			const offset = damp(current.travel);
			const signed = swipeDirection === 'left' || swipeDirection === 'up' ? -offset : offset;
			popupRef.current?.style.setProperty(axis === 'x' ? swipeMovementX : swipeMovementY, `${signed}px`);

			const progress = current.size > 0 ? Math.min(Math.max(offset / current.size, 0), 1) : 0;
			backdropRef.current?.style.setProperty(swipeProgress, `${progress}`);
		};

		const start = (event: Event, current: Gesture, x: number, y: number): void => {
			const popup = popupRef.current;
			current.state = 'dragging';
			// measure once to avoid forcing layout after each drag update.
			current.size = (axis === 'x' ? popup?.offsetWidth : popup?.offsetHeight) ?? 0;
			current.originX = x;
			current.originY = y;
			current.samples = [{ time: event.timeStamp, travel: 0 }];
			document.getSelection()?.removeAllRanges();
			setSwiping(true);
		};

		const move = (event: Event, current: Gesture, x: number, y: number): void => {
			const travel = getDisplacement(swipeDirection, x - current.originX, y - current.originY);
			current.travel = travel;
			current.samples.push({ time: event.timeStamp, travel });
			if (current.samples.length > 2 && event.timeStamp - current.samples[0]!.time > VELOCITY_WINDOW * 2) {
				current.samples.shift();
			}
			applyTravel(current);
		};

		const end = (event: Event, cancelled: boolean): void => {
			const current = gesture;
			gesture = null;
			if (current?.state !== 'dragging') {
				return;
			}

			const popup = popupRef.current;
			const backdrop = backdropRef.current;
			suppressClickUntil = event.timeStamp + CLICK_SUPPRESSION;
			setSwiping(false);

			if (popup && !cancelled && current.travel > 0) {
				const size = current.size;
				const velocity = getReleaseVelocity(current.samples, event.timeStamp);
				const dismiss =
					velocity >= FAST_VELOCITY ||
					(current.travel >= size * DISMISS_FRACTION && velocity > REVERSE_VELOCITY);

				if (dismiss) {
					const strength = `${getStrength(size - current.travel, velocity)}`;
					for (const el of [popup, backdrop]) {
						el?.setAttribute('data-swipe-dismiss', '');
						el?.style.setProperty(swipeStrength, strength);
					}
					if (setOpen(false, { reason: 'swipe', event })) {
						return;
					}
				}
			}

			// removing movement overrides lets CSS transition back to the open position.
			clearSwipe([popup, backdrop], [swipeMovementX, swipeMovementY, swipeProgress, swipeStrength]);
		};

		const getSwipeablePopup = (target: EventTarget | null, ignoreSelector: string): HTMLElement | null => {
			const popup = popupRef.current;
			if (!popup || !(target instanceof Element) || !popup.contains(target)) {
				return null;
			}
			const ignored = target.closest(ignoreSelector);
			if (ignored && popup.contains(ignored)) {
				return null;
			}
			return popup;
		};

		// #region mouse and pen

		const onPointerDown = (event: PointerEvent): void => {
			suppressClickUntil = -Infinity;
			if (event.pointerType === 'touch' || event.button !== 0 || gesture) {
				return;
			}
			if (!getSwipeablePopup(event.target, MOUSE_IGNORE_SELECTOR)) {
				return;
			}
			gesture = {
				id: event.pointerId,
				touch: false,
				state: 'pending',
				startX: event.clientX,
				startY: event.clientY,
				originX: event.clientX,
				originY: event.clientY,
				scroller: null,
				crossScrollable: false,
				size: 0,
				travel: 0,
				samples: [],
			};
		};

		const onPointerMove = (event: PointerEvent): void => {
			const current = gesture;
			if (current?.touch !== false || current.id !== event.pointerId) {
				return;
			}
			if (current.state === 'pending') {
				if (Math.hypot(event.clientX - current.startX, event.clientY - current.startY) < MOUSE_SLOP) {
					return;
				}
				viewport.setPointerCapture(event.pointerId);
				start(event, current, event.clientX, event.clientY);
			}
			// prevent text selection while dragging.
			event.preventDefault();
			move(event, current, event.clientX, event.clientY);
		};

		const onPointerUp = (event: PointerEvent): void => {
			if (gesture?.touch === false && gesture.id === event.pointerId) {
				end(event, event.type === 'pointercancel');
			}
		};

		// #endregion

		// #region touch

		const findTouch = (list: TouchList, id: number): Touch | undefined => {
			for (let i = 0; i < list.length; i++) {
				const touch = list[i];
				if (touch?.identifier === id) {
					return touch;
				}
			}
			return undefined;
		};

		const onTouchStart = (event: TouchEvent): void => {
			suppressClickUntil = -Infinity;
			// a second finger means a pinch, not a swipe.
			if (event.touches.length > 1) {
				if (gesture?.touch) {
					end(event, true);
				}
				return;
			}
			const touch = event.changedTouches[0];
			const target = event.target;
			const popup = getSwipeablePopup(target, TOUCH_IGNORE_SELECTOR);
			// let selection handles adjust an existing selection.
			if (!touch || !popup || !(target instanceof Element) || hasSelectionWithin(popup)) {
				return;
			}
			gesture = {
				id: touch.identifier,
				touch: true,
				state: 'pending',
				startX: touch.clientX,
				startY: touch.clientY,
				originX: touch.clientX,
				originY: touch.clientY,
				...findScrollers(target, popup, axis),
				size: 0,
				travel: 0,
				samples: [],
			};
		};

		// null means there isn't enough movement to decide yet.
		const shouldClaim = (event: TouchEvent, current: Gesture, touch: Touch): boolean | null => {
			// the browser already committed to a native scroll.
			if (!event.cancelable) {
				return false;
			}
			const dx = touch.clientX - current.startX;
			const dy = touch.clientY - current.startY;
			const axisTravel = Math.abs(axis === 'x' ? dx : dy);
			const crossTravel = Math.abs(axis === 'x' ? dy : dx);

			if (current.crossScrollable) {
				if (crossTravel >= AXIS_LOCK_SLOP && crossTravel > axisTravel + AXIS_LOCK_BIAS) {
					return false;
				}
				// on iOS, preventing the first move blocks scrolling for the entire gesture; wait for an axis.
				if (axisTravel < AXIS_LOCK_SLOP) {
					return null;
				}
			}

			if (current.scroller) {
				if (axisTravel === 0) {
					return null;
				}
				return (
					getDisplacement(swipeDirection, dx, dy) > 0 && isAtDismissEdge(current.scroller, swipeDirection)
				);
			}

			return true;
		};

		const onTouchMove = (event: TouchEvent): void => {
			const current = gesture;
			if (!current?.touch) {
				return;
			}
			const touch = findTouch(event.touches, current.id);
			if (!touch) {
				return;
			}

			if (current.state === 'pending') {
				const claim = shouldClaim(event, current, touch);
				if (claim === null) {
					return;
				}
				if (!claim) {
					gesture = null;
					return;
				}
				start(event, current, touch.clientX, touch.clientY);
			}

			if (event.cancelable) {
				event.preventDefault();
			}
			move(event, current, touch.clientX, touch.clientY);
		};

		const onTouchEnd = (event: TouchEvent): void => {
			if (gesture?.touch && findTouch(event.changedTouches, gesture.id)) {
				end(event, event.type === 'touchcancel');
			}
		};

		// #endregion

		const onClickCapture = (event: MouseEvent): void => {
			if (event.timeStamp <= suppressClickUntil) {
				suppressClickUntil = -Infinity;
				event.preventDefault();
				event.stopPropagation();
			}
		};

		// passive starts avoid delaying scrolling; moves must be cancellable to claim a drag.
		const moveOptions: AddEventListenerOptions = { passive: false };
		const startOptions: AddEventListenerOptions = { passive: true };
		viewport.addEventListener('pointerdown', onPointerDown);
		viewport.addEventListener('pointermove', onPointerMove);
		viewport.addEventListener('pointerup', onPointerUp);
		viewport.addEventListener('pointercancel', onPointerUp);
		viewport.addEventListener('touchstart', onTouchStart, startOptions);
		viewport.addEventListener('touchmove', onTouchMove, moveOptions);
		viewport.addEventListener('touchend', onTouchEnd);
		viewport.addEventListener('touchcancel', onTouchEnd);
		viewport.addEventListener('click', onClickCapture, true);

		return () => {
			if (gesture?.state === 'dragging') {
				setSwiping(false);
			}
			viewport.removeEventListener('pointerdown', onPointerDown);
			viewport.removeEventListener('pointermove', onPointerMove);
			viewport.removeEventListener('pointerup', onPointerUp);
			viewport.removeEventListener('pointercancel', onPointerUp);
			viewport.removeEventListener('touchstart', onTouchStart, startOptions);
			viewport.removeEventListener('touchmove', onTouchMove, moveOptions);
			viewport.removeEventListener('touchend', onTouchEnd);
			viewport.removeEventListener('touchcancel', onTouchEnd);
			viewport.removeEventListener('click', onClickCapture, true);
		};
	}, [open, swipeDirection, viewportRef, popupRef, backdropRef, setOpen]);
};
