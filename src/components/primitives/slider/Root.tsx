'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useRef, useState } from 'react';

import { useControlled } from '@base-ui/utils/useControlled';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';
import { clamp } from '#/lib/utils/numbers';

import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import {
	getSliderAttributes,
	type Orientation,
	RootContext,
	type RootContextValue,
	type SliderState,
	snapToStep,
	type ValueChangeDetails,
	type ValueCommitDetails,
} from './shared';

export type RootProps = Omit<RenderProps<'div'>, 'defaultValue' | 'onChange'> & {
	/** controlled value. */
	value?: number;
	/** initial uncontrolled value; defaults to `min`. */
	defaultValue?: number;
	/** receives cancellable changes, snapped to `step` and clamped to the bounds. */
	onValueChange?: (value: number, details: ValueChangeDetails) => void;
	/**
	 * receives the last accepted value when a pointer interaction ends, or immediately for keyboard/input
	 * changes.
	 */
	onValueCommitted?: (value: number, details: ValueCommitDetails) => void;
	/** @default 0 */
	min?: number;
	/** @default 100 */
	max?: number;
	/**
	 * value increment, anchored at `min`.
	 *
	 * @default 1
	 */
	step?: number;
	/**
	 * increment for Page Up/Down and Shift + arrow keys.
	 *
	 * @default 10
	 */
	largeStep?: number;
	/** @default 'horizontal' */
	orientation?: Orientation;
	/** ignores user interaction. */
	disabled?: boolean;
};

/**
 * shares state across the slider parts and exposes `--slider-position` as a percentage.
 *
 * @param props parts, value, and element props
 * @returns the root element; a `<div>` by default
 */
export const Root = ({
	render,
	ref,
	value: valueProp,
	defaultValue,
	onValueChange,
	onValueCommitted,
	min = 0,
	max = 100,
	step = 1,
	largeStep = 10,
	orientation = 'horizontal',
	disabled = false,
	...elementProps
}: RootProps) => {
	const [rawValue, setValueState] = useControlled({
		controlled: valueProp,
		default: defaultValue ?? min,
		name: 'Slider',
		state: 'value',
	});
	const value = clamp(rawValue, min, max);

	const [dragging, setDragging] = useState(false);
	const thumbRef = useRef<HTMLElement | null>(null);
	const inputRef = useRef<HTMLInputElement | null>(null);

	const setValue = useNonReactiveCallback<RootContextValue['setValue']>((requested, reason, event) => {
		const next = snapToStep(requested, { min, max, step });
		if (disabled || Number.isNaN(next) || next === value) {
			return null;
		}

		let canceled = false;
		onValueChange?.(next, {
			reason,
			event,
			cancel() {
				canceled = true;
			},
		});
		if (canceled) {
			return null;
		}

		setValueState(next);
		return next;
	});

	const commitValue = useNonReactiveCallback<RootContextValue['commitValue']>((committed, reason, event) => {
		onValueCommitted?.(committed, { reason, event });
	});

	const state: SliderState = { value, disabled, dragging, orientation };

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'group',
		style: {
			'--slider-position': `${max > min ? ((value - min) / (max - min)) * 100 : 0}%`,
		},
	};

	const contextValue: RootContextValue = {
		state,
		min,
		max,
		step,
		largeStep,
		thumbRef,
		inputRef,
		setDragging,
		setValue,
		commitValue,
	};

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(getSliderAttributes(state), internalProps, elementProps),
	});

	return <RootContext.Provider value={contextValue}>{element}</RootContext.Provider>;
};
