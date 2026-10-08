'use no memo'; // composition props usually invalidate the generated wrapper caches

import { useId, useRef } from 'react';

import { useControlled } from '#/lib/hooks/use-controlled';
import { useNonReactiveCallback } from '#/lib/hooks/use-non-reactive-callback';

import { createChangeDetails } from '../change-details';
import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { RootContext, type RootContextValue, type VisibleChangeDetails } from './shared';

export type RootProps = Omit<RenderProps<'div'>, 'id'> & {
	/** controlled visibility of the value. */
	visible?: boolean;
	/** initial uncontrolled visibility of the value. */
	defaultVisible?: boolean;
	/** receives cancellable visibility change requests. */
	onVisibleChange?: (visible: boolean, details: VisibleChangeDetails) => void;
	/** disables the input and the toggle. */
	disabled?: boolean;
	/** id of the input, for external labels. */
	id?: string;
};

/**
 * shares visibility state between `Input` and `Toggle`.
 *
 * @param props parts, visibility, and element props
 * @returns the root element; a `<div>` by default
 */
export const Root = ({
	render,
	ref,
	visible: visibleProp,
	defaultVisible = false,
	onVisibleChange,
	disabled = false,
	id,
	...elementProps
}: RootProps) => {
	const [visible, setVisibleState] = useControlled({
		controlled: visibleProp,
		default: defaultVisible,
	});

	const fallbackId = useId();
	const inputRef = useRef<HTMLInputElement | null>(null);

	const setVisible = useNonReactiveCallback<RootContextValue['setVisible']>((next, reason, event) => {
		if (next === visible) {
			return false;
		}

		const details = createChangeDetails(reason, event);
		onVisibleChange?.(next, details);
		if (details.isCanceled) {
			return false;
		}

		setVisibleState(next);
		return true;
	});

	const value: RootContextValue = { visible, disabled, inputId: id ?? fallbackId, inputRef, setVisible };

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(dataAttributes({ visible, disabled }), elementProps),
	});

	return <RootContext.Provider value={value}>{element}</RootContext.Provider>;
};
