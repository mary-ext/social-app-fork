'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { dataAttributes } from '../data-attributes';
import { listItemProps, useItemHighlight } from '../list-navigation';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { ItemSelectedContext, useRootContext } from './shared';

export type ItemProps = RenderProps<'div'> & {
	/** value committed on activation. */
	value: unknown;
	/** text matched by typeahead; defaults to the item's text content. */
	label?: string;
	disabled?: boolean;
};

/**
 * an option that commits its value on press, Enter or Space.
 *
 * @param props value, label, and element props
 * @returns the option element; a `<div>` by default
 */
export const Item = ({ render, ref, value, label, disabled = false, ...elementProps }: ItemProps) => {
	const ctx = useRootContext();
	const { highlighted, highlightProps } = useItemHighlight();
	const selected = Object.is(value, ctx.value);

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		...listItemProps(label),
		...highlightProps,
		role: 'option',
		'aria-selected': selected,
		'aria-disabled': disabled || undefined,
		onClick() {
			if (!disabled) {
				ctx.select(value);
			}
		},
		onKeyDown(event) {
			if (disabled || event.defaultPrevented || event.target !== event.currentTarget) {
				return;
			}
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				ctx.select(value);
			}
		},
	};

	const element = useRender({
		tag: 'div',
		render,
		refs: [ref],
		props: mergeProps<'div'>(
			dataAttributes({ selected, highlighted, disabled }),
			internalProps,
			elementProps,
		),
	});

	return <ItemSelectedContext value={selected}>{element}</ItemSelectedContext>;
};
