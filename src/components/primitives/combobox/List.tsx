'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes, ReactNode } from 'react';

import { dataAttributes } from '../data-attributes';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { useRootContext } from './shared';

export type ListProps = Omit<RenderProps<'div'>, 'children'> & {
	/** list content, or a function rendering each of the root's `items`. */
	children?: ReactNode | ((item: never, index: number) => ReactNode);
};

/**
 * the listbox, or a grid of `Row`s. presses inside it keep focus on the input.
 *
 * @param props content and element props
 * @returns the list element; a `<div>` by default
 */
export const List = ({ render, ref, children, ...elementProps }: ListProps) => {
	const ctx = useRootContext();

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: ctx.listId,
		role: ctx.grid ? 'grid' : 'listbox',
		'aria-multiselectable': ctx.selectionMode === 'multiple' || undefined,
		'aria-labelledby': ctx.inputId,
		children:
			typeof children === 'function'
				? // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- callers annotate the root's item type
					ctx.items.map((item, index) => children(item as never, index))
				: children,
		onMouseDown(event) {
			event.preventDefault();
		},
	};

	return useRender({
		tag: 'div',
		render,
		refs: [ref, ctx.listRef],
		props: mergeProps<'div'>(dataAttributes({ empty: ctx.items.length === 0 }), internalProps, elementProps),
	});
};
