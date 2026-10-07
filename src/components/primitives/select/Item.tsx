'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { HTMLAttributes } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { listItemProps, useItemHighlight } from '../list-navigation';
import { ItemSelectedContext, useRootContext } from './shared';

export type ItemState = {
	selected: boolean;
	/** whether the item has focus. */
	highlighted: boolean;
	disabled: boolean;
};

export type ItemProps = useRender.ComponentProps<'div', ItemState> & {
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
		render,
		ref,
		state: { selected, highlighted, disabled },
		props: mergeProps<'div'>(internalProps, elementProps),
	});

	return <ItemSelectedContext value={selected}>{element}</ItemSelectedContext>;
};
