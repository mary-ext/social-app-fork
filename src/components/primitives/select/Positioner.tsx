'use no memo'; // composition props usually invalidate the generated wrapper caches

import { type CSSProperties, type Ref, useLayoutEffect, useState } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import {
	type Align,
	getShrinkingAnchoredStyle,
	openStateAttributes,
	useInertWhileClosed,
	useTopLayerPresence,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { SELECTED_ITEM_SELECTOR, useRootContext } from './shared';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: 'bottom';
	align: Align;
};

/** minimum distance from the viewport edges, in pixels. */
const COLLISION_PADDING = 5;

export type PositionerProps = Omit<useRender.ComponentProps<'div', PositionerState>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
	/**
	 * overlays the selected item on the trigger; defaults to `true`. falls back to opening below, or above when
	 * that does not fit, for touch opens or no selection.
	 */
	alignItemWithTrigger?: boolean;
};

type ItemOffset = {
	x: number;
	y: number;
	width: number;
	height: number;
};

// client rects include entry-animation transforms; offsets do not.
const measureItemOffset = (positioner: HTMLElement, item: HTMLElement, align: Align): ItemOffset => {
	let top = 0;
	let left = 0;
	for (let el: Element | null = item; el && el !== positioner;) {
		if (!(el instanceof HTMLElement)) {
			break;
		}
		top += el.offsetTop;
		left += el.offsetLeft;
		el = el.offsetParent;
	}

	let x: number;
	switch (align) {
		case 'center': {
			x = left + item.offsetWidth / 2;
			break;
		}
		case 'end': {
			x = left + item.offsetWidth;
			break;
		}
		case 'start': {
			x = left;
			break;
		}
	}

	return {
		x,
		y: top + item.offsetHeight / 2,
		width: positioner.offsetWidth,
		height: positioner.offsetHeight,
	};
};

const ANCHOR_EDGE = {
	center: 'center',
	end: 'right',
	start: 'left',
} as const;

/**
 * positions the top-layer popup at the trigger. content must allow scrolling when the popup shrinks to fit
 * the viewport.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<div>` by default
 */
export const Positioner = ({
	render,
	ref,
	align = 'center',
	sideOffset = 0,
	alignItemWithTrigger = true,
	...elementProps
}: PositionerProps) => {
	const { open, openMethod, anchorName, positionerRef, onTransitionSettled } = useRootContext();
	const [itemOffset, setItemOffset] = useState<ItemOffset | null>(null);

	useTopLayerPresence(positionerRef, open, onTransitionSettled);

	// measure after entering the top layer; retain the offset through the exit transition.
	useLayoutEffect(() => {
		const positioner = positionerRef.current;
		if (!open || !positioner) {
			return;
		}
		const item = positioner.querySelector<HTMLElement>(SELECTED_ITEM_SELECTOR);
		if (!alignItemWithTrigger || openMethod === 'touch' || !item) {
			setItemOffset(null);
			return;
		}
		setItemOffset(measureItemOffset(positioner, item, align));
	}, [open, openMethod, alignItemWithTrigger, align, positionerRef]);

	useInertWhileClosed(positionerRef, open);

	const pad = COLLISION_PADDING;
	let style: CSSProperties;
	if (itemOffset) {
		const { x, y, width, height } = itemOffset;
		style = {
			positionAnchor: anchorName,
			top: `clamp(${pad}px, calc(anchor(center) - ${y}px), calc(100% - ${height + pad}px))`,
			left: `clamp(${pad}px, calc(anchor(${ANCHOR_EDGE[align]}) - ${x}px), calc(100% - ${width + pad}px))`,
			maxHeight: `calc(100% - ${pad * 2}px)`,
		};
	} else {
		style = getShrinkingAnchoredStyle({
			anchorName,
			side: 'bottom',
			align,
			sideOffset,
			collisionPadding: pad,
		});
	}

	return useRender({
		render,
		ref: [ref ?? null, positionerRef],
		state: { open, side: 'bottom', align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(
			{
				popover: 'manual',
				role: 'presentation',
				className: `${styles.positioner} ${styles.shrinkingPositioner}`,
				style,
			},
			elementProps,
		),
	});
};
