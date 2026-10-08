'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ButtonHTMLAttributes } from 'react';

import { useCompositeItem } from '../composite';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { type TabValue, useListContext, useRootContext } from './shared';

export type TabProps = Omit<RenderProps<'button'>, 'id' | 'value'> & {
	/** pairs the tab with the panel of the same value. */
	value: TabValue;
	/** keeps the tab reachable with arrow keys but never selects it. */
	disabled?: boolean;
};

/**
 * selects its panel when pressed.
 *
 * @param props value and element props
 * @returns the tab element; a `<button>` by default
 * @throws if rendered outside `List`
 */
export const Tab = ({ render, ref, value, disabled = false, ...elementProps }: TabProps) => {
	const { value: selected, orientation, getTabId, getPanelId, setValue } = useRootContext();
	const { activateOnFocus } = useListContext();
	const active = value === selected;
	const item = useCompositeItem({ active, disabled });

	const internalProps: ButtonHTMLAttributes<HTMLButtonElement> = {
		...item,
		type: 'button',
		role: 'tab',
		id: getTabId(value),
		'aria-controls': active ? getPanelId(value) : undefined,
		'aria-disabled': disabled || undefined,
		'aria-selected': active,
		onClick(event) {
			if (!disabled) {
				setValue(value, event.nativeEvent);
			}
		},
		onFocus(event) {
			if (activateOnFocus && !disabled) {
				setValue(value, event.nativeEvent);
			}
		},
	};

	return useRender({
		tag: 'button',
		render,
		refs: [ref],
		props: mergeProps<'button'>(
			dataAttributes({ active, disabled, orientation }),
			internalProps,
			elementProps,
		),
	});
};
