'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';
import { useControlled } from '@base-ui/utils/useControlled';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { type CheckedChangeDetails, GroupContext, type GroupContextValue } from './shared';

export type GroupState = {
	disabled: boolean;
};

export type GroupProps = Omit<useRender.ComponentProps<'div', GroupState>, 'defaultValue' | 'onChange'> & {
	/** controlled values of the checked checkboxes. */
	value?: readonly string[];
	/** initial uncontrolled values of the checked checkboxes. */
	defaultValue?: readonly string[];
	/** receives cancellable changes to the checked values. */
	onValueChange?: (value: string[], details: CheckedChangeDetails) => void;
	/** disables every checkbox. */
	disabled?: boolean;
};

const EMPTY: readonly string[] = [];

/**
 * shares checked state across checkboxes, keyed by each checkbox's `value`.
 *
 * @param props parts, value, and element props
 * @returns the group element; a `<div>` by default
 */
export const Group = ({
	render,
	ref,
	value: valueProp,
	defaultValue = EMPTY,
	onValueChange,
	disabled = false,
	...elementProps
}: GroupProps) => {
	const [value, setValueState] = useControlled({
		controlled: valueProp,
		default: defaultValue,
		name: 'CheckboxGroup',
		state: 'value',
	});

	const setGroupValue = useNonReactiveCallback<GroupContextValue['setGroupValue']>(
		(item, checked, details) => {
			const next = checked ? [...value, item] : value.filter((existing) => existing !== item);
			onValueChange?.(next, details);
			if (!details.isCanceled) {
				setValueState(next);
			}
		},
	);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'group',
	};

	const contextValue: GroupContextValue = { value, disabled, setGroupValue };

	const element = useRender({
		render,
		ref,
		state: { disabled },
		props: mergeProps<'div'>(internalProps, elementProps),
	});

	return <GroupContext.Provider value={contextValue}>{element}</GroupContext.Provider>;
};
