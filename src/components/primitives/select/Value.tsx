'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { ReactNode } from 'react';

import { useRender } from '@base-ui/react/use-render';

import { useRootContext } from './shared';

export type ValueProps = Omit<useRender.ComponentProps<'span', { placeholder: boolean }>, 'children'> & {
	/** shown while no value is selected. */
	placeholder?: ReactNode;
	/** custom content or formatter; defaults to the `Root.items` label or `String(value)`. */
	children?: ReactNode | ((value: never) => ReactNode);
};

/**
 * shows the selected value.
 *
 * @param props formatter, placeholder, and element props
 * @returns the value element; a `<span>` by default
 */
export const Value = ({ render, ref, placeholder, children, ...elementProps }: ValueProps) => {
	const { value, selectedItem, placeholder: empty } = useRootContext();

	let content: ReactNode;
	if (typeof children === 'function') {
		// oxlint-disable-next-line typescript/no-unsafe-type-assertion -- the formatter receives `Root`'s `Value`; context erases it
		content = children(value as never);
	} else if (children !== undefined) {
		content = children;
	} else if (selectedItem) {
		content = selectedItem.label;
	} else if (empty) {
		content = placeholder;
	} else {
		content = String(value);
	}

	return useRender({
		render,
		ref,
		defaultTagName: 'span',
		state: { placeholder: empty },
		props: { ...elementProps, children: content },
	});
};
