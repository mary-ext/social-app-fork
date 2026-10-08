'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	COLLISION_PADDING,
	getPositionerAttributes,
	getShrinkingAnchoredStyle,
	type PlacementProps,
	useAnchoredPositioner,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getDialogProps, showModalInTopLayer } from '../top-layer';
import * as styles from './menu.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'dialog'>, 'ref'> &
	Omit<PlacementProps, 'side'> & {
		ref?: Ref<HTMLDialogElement>;
		/** preferred side; flips or shrinks when space is insufficient. */
		side?: 'bottom' | 'top';
	};

/**
 * positions the menu in the top layer at the active trigger. popup content must be scrollable.
 *
 * @param props placement and element props
 * @returns the positioning element; a `<dialog>` by default, or `null` while unmounted
 */
export const Positioner = (props: PositionerProps) => {
	const { mounted } = useRootContext();
	return mounted ? <MountedPositioner {...props} /> : null;
};

const MountedPositioner = ({
	render,
	ref,
	side = 'bottom',
	align = 'center',
	sideOffset = 0,
	collisionPadding = COLLISION_PADDING,
	...elementProps
}: PositionerProps) => {
	const { open, anchorName, positionerRef, setOpen, onTransitionSettled } = useRootContext();

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);

	return useRender({
		tag: 'dialog',
		render,
		refs: [ref, positionerRef, showModalInTopLayer(open)],
		props: mergeProps<'dialog'>(
			getPositionerAttributes(open, side, align),
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				inert: !open,
				className: styles.positioner,
				style: getShrinkingAnchoredStyle({ anchorName, side, align, sideOffset, collisionPadding }),
			},
			elementProps,
		),
	});
};
