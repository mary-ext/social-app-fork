'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import { mergeProps } from '@base-ui/react/merge-props';
import { useRender } from '@base-ui/react/use-render';

import {
	type Align,
	type CollisionPadding,
	getShrinkingAnchoredStyle,
	openStateAttributes,
	useInertWhileClosed,
	useModalInert,
	useTopLayerPresence,
} from '../anchored-popup';
import * as styles from '../anchored-popup.css';
import { useRootContext } from './shared';

export type PositionerState = {
	open: boolean;
	/** preferred side, not the resolved placement. */
	side: 'bottom' | 'top';
	align: Align;
};

export type PositionerProps = Omit<useRender.ComponentProps<'div', PositionerState>, 'ref'> & {
	ref?: Ref<HTMLDivElement>;
	/** preferred side; flips when space is insufficient. */
	side?: 'bottom' | 'top';
	/** alignment along the trigger's edge. */
	align?: Align;
	/** gap between trigger and popup, in pixels. */
	sideOffset?: number;
	collisionPadding?: CollisionPadding;
};

/**
 * positions the menu in the top layer at the active trigger. popup content must be scrollable.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<div>` by default
 */
export const Positioner = ({
	render,
	ref,
	side = 'bottom',
	align = 'center',
	sideOffset = 0,
	collisionPadding = 5,
	...elementProps
}: PositionerProps) => {
	const { open, modal, anchorName, positionerRef, onTransitionSettled } = useRootContext();

	useTopLayerPresence(positionerRef, open, onTransitionSettled);

	useModalInert(positionerRef, open && modal);

	useInertWhileClosed(positionerRef, open);

	return useRender({
		render,
		ref: [ref ?? null, positionerRef],
		state: { open, side, align },
		stateAttributesMapping: openStateAttributes,
		props: mergeProps<'div'>(
			{
				popover: 'manual',
				role: 'presentation',
				className: `${styles.positioner} ${styles.shrinkingPositioner}`,
				style: getShrinkingAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
