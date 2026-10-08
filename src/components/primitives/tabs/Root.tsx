'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useId } from 'react';

import { useControlled } from '@base-ui/utils/useControlled';

import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { createChangeDetails } from '../change-details';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import {
	type Orientation,
	RootContext,
	type RootContextValue,
	type TabValue,
	type ValueChangeDetails,
} from './shared';

export type RootProps = Omit<RenderProps<'div'>, 'defaultValue' | 'onChange'> & {
	/** controlled value of the selected tab; `null` selects none. */
	value?: TabValue | null;
	/**
	 * initial uncontrolled value of the selected tab.
	 *
	 * @default null
	 */
	defaultValue?: TabValue | null;
	/** receives requests to select a different tab. */
	onValueChange?: (value: TabValue, details: ValueChangeDetails) => void;
	/** @default 'horizontal' */
	orientation?: Orientation;
};

/**
 * shares the selected tab across the list and panels.
 *
 * @param props parts, value, and element props
 * @returns the root element; a `<div>` by default
 */
export const Root = ({
	render,
	ref,
	value: valueProp,
	defaultValue = null,
	onValueChange,
	orientation = 'horizontal',
	...elementProps
}: RootProps) => {
	const [value, setValueState] = useControlled({
		controlled: valueProp,
		default: defaultValue,
		name: 'Tabs',
		state: 'value',
	});
	const prefix = useId();

	const setValue = useNonReactiveCallback<RootContextValue['setValue']>((next, event) => {
		if (next === value) {
			return;
		}

		const details = createChangeDetails('none', event);
		onValueChange?.(next, details);
		if (!details.isCanceled) {
			setValueState(next);
		}
	});

	const contextValue: RootContextValue = {
		value,
		orientation,
		getTabId: (tab) => `${prefix}-tab-${encodeURIComponent(tab)}`,
		getPanelId: (tab) => `${prefix}-panel-${encodeURIComponent(tab)}`,
		setValue,
	};

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(dataAttributes({ orientation }), elementProps),
	});

	return <RootContext.Provider value={contextValue}>{element}</RootContext.Provider>;
};
