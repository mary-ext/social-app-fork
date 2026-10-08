'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useRef } from 'react';

import { clamp } from '#/lib/utils/numbers';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getSliderAttributes, useRootContext, type ValueChangeReason } from './shared';
import * as styles from './slider.css';

export type ControlProps = RenderProps<'div'> & {
	/**
	 * focuses the thumb on pointer press; `false` preserves current focus.
	 *
	 * @default true
	 */
	focusOnPress?: boolean;
};

type Press = {
	pointerId: number;
	/** preserves the grab position within the thumb. */
	offset: number;
	/** side of the control at the minimum end of the axis. */
	startEdge: 'bottom' | 'left' | 'right';
	/** border and padding at the minimum end of the axis. */
	startInset: number;
	/** border and padding at the maximum end of the axis. */
	endInset: number;
	last: { value: number; reason: ValueChangeReason } | null;
};

type Side = 'bottom' | 'left' | 'right' | 'top';

const getMidpoint = (el: Element, vertical: boolean): number => {
	const rect = el.getBoundingClientRect();
	return vertical ? (rect.top + rect.bottom) / 2 : (rect.left + rect.right) / 2;
};

/**
 * handles track presses and thumb dragging.
 *
 * @param props element props
 * @returns the control element; a `<div>` by default
 */
export const Control = ({ render, ref, focusOnPress = true, ...elementProps }: ControlProps) => {
	const { state, min, max, thumbRef, inputRef, setDragging, setValue, commitValue } = useRootContext();
	const vertical = state.orientation === 'vertical';

	const pressRef = useRef<Press | null>(null);

	const startPress = (control: HTMLElement, event: PointerEvent, offset: number): Press => {
		const computed = getComputedStyle(control);
		const inset = (side: Side) =>
			parseFloat(computed.getPropertyValue(`border-${side}-width`)) +
			parseFloat(computed.getPropertyValue(`padding-${side}`));

		let start: Press['startEdge'];
		let end: Side;
		if (vertical) {
			[start, end] = ['bottom', 'top'];
		} else if (control.matches(':dir(rtl)')) {
			[start, end] = ['right', 'left'];
		} else {
			[start, end] = ['left', 'right'];
		}

		return {
			pointerId: event.pointerId,
			offset,
			startEdge: start,
			startInset: inset(start),
			endInset: inset(end),
			last: null,
		};
	};

	// scrolling or layout shifts can move the control mid-drag.
	const update = (control: HTMLElement, press: Press, reason: ValueChangeReason, event: PointerEvent) => {
		const rect = control.getBoundingClientRect();
		const pointer = (vertical ? event.clientY : event.clientX) - press.offset;

		const edge = rect[press.startEdge];

		const distance = (press.startEdge === 'left' ? pointer - edge : edge - pointer) - press.startInset;
		const size = (vertical ? rect.height : rect.width) - press.startInset - press.endInset;

		const applied = setValue(min + clamp(distance / size, 0, 1) * (max - min), reason, event);
		if (applied !== null) {
			press.last = { value: applied, reason };
		}
	};

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		className: styles.control,
		onPointerDown(event) {
			if (state.disabled || event.defaultPrevented || event.button !== 0) {
				return;
			}

			const control = event.currentTarget;
			const thumb = thumbRef.current;
			const onThumb = thumb !== null && event.target instanceof Node && thumb.contains(event.target);

			// suppress compatibility `mousedown` to prevent native focus, selection, and dragging.
			event.preventDefault();
			if (focusOnPress) {
				inputRef.current?.focus({ preventScroll: true, focusVisible: false });
			}
			control.setPointerCapture(event.pointerId);

			const offset = onThumb ? (vertical ? event.clientY : event.clientX) - getMidpoint(thumb, vertical) : 0;
			const press = startPress(control, event.nativeEvent, offset);
			pressRef.current = press;
			setDragging(true);

			if (!onThumb) {
				update(control, press, 'track-press', event.nativeEvent);
			}
		},
		onPointerMove(event) {
			const press = pressRef.current;
			if (press?.pointerId === event.pointerId) {
				update(event.currentTarget, press, 'drag', event.nativeEvent);
			}
		},
		// capture loss handles both pointer release and cancellation.
		onLostPointerCapture(event) {
			const press = pressRef.current;
			if (press?.pointerId !== event.pointerId) {
				return;
			}

			pressRef.current = null;
			setDragging(false);
			if (press.last !== null) {
				commitValue(press.last.value, press.last.reason, event.nativeEvent);
			}
		},
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref],
		// oxlint-disable-next-line react/refs -- the handlers only read refs when events fire
		props: mergeProps<'div'>(getSliderAttributes(state), internalProps, elementProps),
	});
};
