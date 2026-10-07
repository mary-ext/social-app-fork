'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import {
	type Align,
	getAnchoredStyle,
	openStateAttributes,
	type Side,
	useTopLayerPresence,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { useRootContext } from './shared';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: Side;
	align: Align;
};

export type PositionerProps = Omit<useRender.ComponentProps<'div', PositionerState>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** preferred side; flips when space is insufficient. */
	side?: Side;
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
};

/**
 * anchors a top-layer popup to the trigger with CSS anchor positioning.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<div>` by default
 */
export const Positioner = ({
	render,
	ref,
	side = 'top',
	align = 'center',
	sideOffset = 0,
	...elementProps
}: PositionerProps) => {
	const { open, disableHoverablePopup, anchorName, positionerRef, onTransitionSettled } = useRootContext();

	useTopLayerPresence(positionerRef, open, onTransitionSettled);

	return useRender({
		render,
		ref: [ref ?? null, positionerRef],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(
			{
				popover: 'manual',
				// prevent the popup from intercepting the pointer when hover is disabled.
				inert: !open || disableHoverablePopup,
				className: styles.positioner,
				style: getAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding: 0 }),
			},
			elementProps,
		),
	});
};
