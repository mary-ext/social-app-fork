'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, useContext } from 'react';

import { useControlled } from '@base-ui/utils/useControlled';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { CompositeProvider, useCompositeRoot } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { RootContext as ToolbarContext, useToolbarDisabled } from '../toolbar/shared';
import { GroupContext, type GroupContextValue, type Orientation, type PressedChangeDetails } from './shared';

export type GroupProps = Omit<RenderProps<'div'>, 'defaultValue' | 'onChange'> & {
	/** controlled values of the pressed toggles. */
	value?: readonly string[];
	/** initial uncontrolled values of the pressed toggles. */
	defaultValue?: readonly string[];
	/** receives changes to the pressed values. */
	onValueChange?: (value: string[], details: PressedChangeDetails) => void;
	/** allows more than one pressed toggle. */
	multiple?: boolean;
	/** disables every toggle. */
	disabled?: boolean;
	/** @default 'horizontal' */
	orientation?: Orientation;
	/**
	 * wraps focus at either end.
	 *
	 * @default true
	 */
	loopFocus?: boolean;
};

const EMPTY: readonly string[] = [];

/**
 * shares pressed state and a single tab stop across toggles. inside a toolbar, joins its navigation.
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
	multiple = false,
	disabled: disabledProp = false,
	orientation = 'horizontal',
	loopFocus = true,
	...elementProps
}: GroupProps) => {
	const [value, setValueState] = useControlled({
		controlled: valueProp,
		default: defaultValue,
		name: 'ToggleGroup',
		state: 'value',
	});
	const disabled = useToolbarDisabled() || disabledProp;

	const inToolbar = useContext(ToolbarContext) !== null;
	const composite = useCompositeRoot({ orientation, loopFocus, homeEnd: true, tabbable: true });

	const setGroupValue = useNonReactiveCallback<GroupContextValue['setGroupValue']>(
		(toggle, pressed, details) => {
			let next: string[];
			if (multiple) {
				next = pressed ? [...value, toggle] : value.filter((item) => item !== toggle);
			} else {
				next = pressed ? [toggle] : [];
			}

			onValueChange?.(next, details);
			if (!details.isCanceled) {
				setValueState(next);
			}
		},
	);

	// `aria-orientation` is invalid on `role="group"`.
	const internalProps: HTMLAttributes<HTMLDivElement> = {
		role: 'group',
		...(inToolbar ? undefined : composite.props),
	};

	const contextValue: GroupContextValue = { value, disabled, setGroupValue };

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref, inToolbar ? undefined : composite.setRoot],
		props: mergeProps<'div'>(
			dataAttributes({ disabled, multiple, orientation }),
			internalProps,
			elementProps,
		),
	});

	return (
		<GroupContext.Provider value={contextValue}>
			{inToolbar ? element : <CompositeProvider value={composite.context}>{element}</CompositeProvider>}
		</GroupContext.Provider>
	);
};
