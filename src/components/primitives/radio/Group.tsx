'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useId, useReducer } from 'react';

import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { createChangeDetails } from '../change-details';
import { mergeProps } from '../merge-props';
import { getNativeInputAttributes } from '../native-input';
import { type RenderProps, useRender } from '../render';
import { GroupContext, type GroupContextValue, type ValueChangeDetails } from './shared';

export type GroupProps<Value> = Omit<RenderProps<'div'>, 'defaultValue' | 'onChange'> & {
	/** controlled value of the checked radio. */
	value?: Value;
	/** initial uncontrolled value of the checked radio. */
	defaultValue?: Value;
	/** receives user selection changes. */
	onValueChange?: (value: Value, details: ValueChangeDetails) => void;
	/** disables every radio. */
	disabled?: boolean;
	/** keeps radios focusable but ignores changes. */
	readOnly?: boolean;
	/** requires a checked radio for form submission. */
	required?: boolean;
	/** shared form field name; generated when omitted. */
	name?: string;
	/** id of the form the radios belong to. */
	form?: string;
};

/**
 * groups native radio inputs for keyboard selection and form submission.
 *
 * @param props parts, value, and element props
 * @returns the group element; a `<div>` by default
 */
export const Group = <Value,>({
	render,
	ref,
	value: valueProp,
	defaultValue,
	onValueChange,
	disabled = false,
	readOnly = false,
	required = false,
	name: nameProp,
	form,
	...elementProps
}: GroupProps<Value>) => {
	const [value, setValueState] = useControlled({
		controlled: valueProp,
		default: defaultValue,
	});
	const fallbackName = useId();
	const [revision, resync] = useReducer((count: number) => count + 1, 0);

	const setValue = useNonReactiveCallback((next: Value, event: Event) => {
		const details = createChangeDetails('none', event);
		onValueChange?.(next, details);
		if (!details.isCanceled) {
			setValueState(next);
		}
		resync();
	});

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'radiogroup',
		'aria-disabled': disabled || undefined,
		'aria-readonly': readOnly || undefined,
		'aria-required': required || undefined,
	};

	const contextValue: GroupContextValue = {
		value,
		name: nameProp ?? fallbackName,
		form,
		disabled,
		readOnly,
		required,
		revision,
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- context can't carry the group's generic
		setValue: setValue as GroupContextValue['setValue'],
	};

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(
			getNativeInputAttributes({ disabled, readOnly, required }),
			internalProps,
			elementProps,
		),
	});

	return <GroupContext.Provider value={contextValue}>{element}</GroupContext.Provider>;
};
