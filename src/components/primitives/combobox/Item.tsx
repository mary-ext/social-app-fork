'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type HTMLAttributes, type MouseEvent, useContext, useLayoutEffect, useRef } from 'react';

import type { BaseUIEvent } from '@base-ui/react';
import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import { isMouseLike } from '#/lib/browser/input-modality';

import { isHoverMove } from '../list-navigation';
import { ITEM_SELECTOR, ItemSelectedContext, RowContext, useHighlighted, useRootContext } from './shared';

export type ItemState = {
	selected: boolean;
	highlighted: boolean;
	disabled: boolean;
};

export type ItemProps = useRender.ComponentProps<'div', ItemState> & {
	/** the item's value, matched against the root's `items`. */
	value: unknown;
	/** position in `items`; required for virtualized lists and repeated values. */
	index?: number;
	/** keeps the item highlightable, but ignores presses. */
	disabled?: boolean;
};

const disabledGuard = {
	onClick(event: BaseUIEvent<MouseEvent<HTMLElement>>) {
		event.preventDefault();
		event.preventBaseUIHandler();
	},
};

/**
 * option highlighted on hover and activated by click or Enter on the input.
 *
 * @param props value, index, and element props
 * @returns the option element; a `<div>` by default
 */
export const Item = ({
	render,
	ref,
	value,
	index: indexProp,
	disabled = false,
	...elementProps
}: ItemProps) => {
	const ctx = useRootContext();
	const inRow = useContext(RowContext);
	const elementRef = useRef<HTMLDivElement | null>(null);

	const index = indexProp ?? ctx.indexOf(value);
	const highlighted = useHighlighted(index);
	const selected = ctx.selectionMode !== 'none' && ctx.isSelected(value);

	// scroll on keyboard highlight, or once a virtualized item mounts.
	useLayoutEffect(() => {
		if (highlighted && ctx.takeScrollRequest(index)) {
			elementRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		}
	});

	const internalProps: HTMLAttributes<HTMLDivElement> = {
		id: index === -1 ? undefined : ctx.getItemId(index),
		role: inRow ? 'gridcell' : 'option',
		'aria-selected': ctx.selectionMode === 'none' ? undefined : selected,
		'aria-disabled': disabled || undefined,
		onClick(event) {
			ctx.press(value, { event: event.nativeEvent });
		},
		onPointerMove(event) {
			if (isHoverMove(event) && !highlighted && index !== -1) {
				ctx.setActiveIndex(index, 'pointer');
			}
		},
		onPointerLeave(event) {
			if (!isMouseLike(event) || !highlighted) {
				return;
			}
			const related = event.relatedTarget;
			if (
				related instanceof Element &&
				related.closest(ITEM_SELECTOR) &&
				ctx.listRef.current?.contains(related)
			) {
				return;
			}
			ctx.setActiveIndex(-1, 'pointer');
		},
	};

	const element = useRender({
		render,
		ref: [ref ?? null, elementRef],
		state: { selected, highlighted, disabled },
		props: mergeProps<'div'>(internalProps, elementProps, disabled ? disabledGuard : undefined),
	});

	return <ItemSelectedContext value={selected}>{element}</ItemSelectedContext>;
};
