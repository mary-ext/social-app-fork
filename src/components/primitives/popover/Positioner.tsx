'use no memo'; // composition props usually invalidate the generated wrapper caches

import type { Ref } from 'react';

import {
	COLLISION_PADDING,
	getAnchoredStyle,
	getPositionerAttributes,
	getShrinkingAnchoredStyle,
	type PlacementProps,
	useAnchoredPositioner,
} from '../anchored-popup';
import { mergeProps } from '../merge-props';
import { type RenderProps, useRender } from '../render';
import { getDialogProps, showInTopLayer, showModalInTopLayer } from '../top-layer';
import * as styles from './popover.css';
import { useRootContext } from './shared';

export type PositionerProps = Omit<RenderProps<'dialog'>, 'ref'> &
	PlacementProps & {
		ref?: Ref<HTMLDialogElement>;
		/** shrinks to the available height on `top` or `bottom`. requires scrollable popup content. */
		shrink?: boolean;
	};

/**
 * positions the popup in the top layer at the active trigger.
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
	shrink = false,
	...elementProps
}: PositionerProps) => {
	const { open, modal, anchorName, activeTrigger, positionerRef, setOpen, onTransitionSettled } =
		useRootContext();

	useAnchoredPositioner(positionerRef, open, onTransitionSettled);

	const placement = { anchorName, side, align, sideOffset, collisionPadding };
	let className = modal ? styles.modalPositioner : styles.positioner;
	let style = getAnchoredStyle(placement);
	if (shrink && (side === 'bottom' || side === 'top')) {
		className = styles.shrinkingPositioner;
		style = getShrinkingAnchoredStyle({ ...placement, side });
	}

	return useRender({
		tag: 'dialog',
		render,
		refs: [ref, positionerRef, modal ? showModalInTopLayer(open) : showInTopLayer(open, activeTrigger)],
		props: mergeProps<'dialog'>(
			getPositionerAttributes(open, side, align),
			{
				...getDialogProps(open, (event) => setOpen(false, { reason: 'escape-key', event })),
				inert: !open,
				className,
				style,
			},
			elementProps,
		),
	});
};
