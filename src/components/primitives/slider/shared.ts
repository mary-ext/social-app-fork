import { createContext, type RefObject, useContext } from 'react';

import { clamp } from '#/lib/utils/numbers';

import type { ChangeDetails } from '../change-details';
import type { Orientation } from '../composite';
import { type DataAttributes, dataAttributes } from '../data-attributes';

export type { Orientation };

export type ValueChangeReason = 'drag' | 'input-change' | 'keyboard' | 'track-press';

export type ValueChangeDetails = ChangeDetails<ValueChangeReason>;

export type ValueCommitDetails = {
	reason: ValueChangeReason;
	event: Event;
};

export type SliderState = {
	value: number;
	disabled: boolean;
	dragging: boolean;
	orientation: Orientation;
};

/**
 * @param state slider state
 * @returns `data-disabled`, `data-dragging`, and `data-orientation` attributes
 */
export const getSliderAttributes = ({ disabled, dragging, orientation }: SliderState): DataAttributes => {
	return dataAttributes({ disabled, dragging, orientation });
};

export type RootContextValue = {
	state: SliderState;
	min: number;
	max: number;
	step: number;
	largeStep: number;
	thumbRef: RefObject<HTMLElement | null>;
	inputRef: RefObject<HTMLInputElement | null>;
	setDragging: (dragging: boolean) => void;
	/**
	 * @param value requested value
	 * @param reason what caused the change
	 * @param event source event
	 * @returns the snapped, clamped value, or `null` if disabled, invalid, unchanged, or canceled
	 */
	setValue: (value: number, reason: ValueChangeReason, event: Event) => number | null;
	commitValue: (value: number, reason: ValueChangeReason, event: Event) => void;
};

export const RootContext = createContext<RootContextValue | null>(null);
RootContext.displayName = 'SliderRootContext';

/**
 * @returns the enclosing slider's state
 * @throws if called outside `Root`
 */
export const useRootContext = (): RootContextValue => {
	const ctx = useContext(RootContext);
	if (ctx === null) {
		throw new Error(`slider parts require <Slider.Root>`);
	}
	return ctx;
};

// exponent notation also covers tiny steps such as `1e-7`.
const getDecimalPrecision = (num: number): number => {
	const [, fraction = '', exponent] = /^-?\d(?:\.(\d+))?e([+-]\d+)$/.exec(num.toExponential()) ?? [];
	return Math.max(0, fraction.length - Number(exponent));
};

/**
 * @param value raw value
 * @param range bounds and step size
 * @returns the nearest step anchored at `min`, clamped to `[min, max]`
 */
export const snapToStep = (
	value: number,
	{ min, max, step }: { min: number; max: number; step: number },
): number => {
	const nearest = Math.round((value - min) / step) * step + min;
	// trims float error such as `0.1 + 0.2`.
	const precise = Number(nearest.toFixed(Math.max(getDecimalPrecision(step), getDecimalPrecision(min))));
	return clamp(precise, min, max);
};
